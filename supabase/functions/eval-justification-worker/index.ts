import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log('Worker: Checking for queued jobs...');

    // Atomically claim a job
    const { data: job, error: jerr } = await supabase
      .from("llm_eval_queue")
      .update({ status: "processing" })
      .eq("status", "queued")
      .select("id, justification_id")
      .limit(1)
      .single();

    if (jerr || !job) {
      console.log('No jobs to process');
      return new Response(JSON.stringify({ message: "No jobs" }), { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Processing job:', job.id, 'for justification:', job.justification_id);

    // Fetch justification
    const { data: just, error: justErr } = await supabase
      .from("user_justifications")
      .select("id, text")
      .eq("id", job.justification_id)
      .single();

    if (justErr || !just) {
      console.error('Failed to fetch justification:', justErr);
      await supabase.from("llm_eval_queue").update({ status: "failed" }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "Justification not found" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log('Calling AI gateway for evaluation...');

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: `Extract structured analysis from the student's problem-solving justification. Return ONLY valid JSON with these exact fields:
- strategy_primary: string (one of: elimination, equation_setup, diagram, estimation, pattern, working_backwards, inference, other)
- strategy_secondary: array of strings (additional strategies used)
- reasoning_style: string (one of: analytical, intuitive, reflective, visual)
- step_count: integer (number of reasoning steps)
- coherence_0_1: float (0-1, how coherent the explanation is)
- error_class: string (one of: misread, arithmetic, formula, inference, time, trap, none)
- jqs_0_1: float (0-1, justification quality score)` 
          },
          { 
            role: "user", 
            content: (just?.text || "").slice(0, 600) 
          }
        ]
      })
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error('AI gateway error:', resp.status, errorText);
      await supabase.from("llm_eval_queue").update({ status: "failed" }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const ai = await resp.json();
    let features: any = {};
    
    try {
      const content = ai?.choices?.[0]?.message?.content || "{}";
      features = JSON.parse(content);
      console.log('Parsed AI features:', features);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', parseErr);
      features = {
        strategy_primary: "other",
        strategy_secondary: [],
        reasoning_style: "analytical",
        step_count: 1,
        coherence_0_1: 0.5,
        error_class: "none",
        jqs_0_1: 0.5
      };
    }

    // Insert evaluation results
    const { error: insertErr } = await supabase.from("llm_eval_results").insert({
      justification_id: job.justification_id,
      strategy_primary: features.strategy_primary || "other",
      strategy_secondary: features.strategy_secondary || [],
      reasoning_style: features.reasoning_style || "analytical",
      step_count: features.step_count || 1,
      coherence_0_1: features.coherence_0_1 || 0.5,
      error_class: features.error_class || "none",
      jqs_0_1: features.jqs_0_1 || 0.5,
      features_json: features
    });

    if (insertErr) {
      console.error('Failed to insert eval results:', insertErr);
      await supabase.from("llm_eval_queue").update({ status: "failed" }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "Failed to save results" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Evaluation results saved, updating calibration progress...');

    // Update calibration progress via RPC
    const { error: rpcErr } = await supabase.rpc("bump_calibration_progress", { 
      justification_id: job.justification_id 
    });

    if (rpcErr) {
      console.error('Failed to update calibration progress:', rpcErr);
      // Don't fail the job for this
    }

    // Mark job as done
    await supabase.from("llm_eval_queue").update({ status: "done" }).eq("id", job.id);

    console.log('Job completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      job_id: job.id,
      justification_id: job.justification_id,
      features 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Worker error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
