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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    console.log('Calling AI gateway for committee evaluation (3 templates)...');

    // Fetch the 3 prompt templates
    const { data: templates, error: templatesErr } = await supabase
      .from("prompt_templates")
      .select("id, text")
      .in("id", ["T1", "T2", "T3"])
      .order("id");

    if (templatesErr || !templates || templates.length !== 3) {
      console.error('Failed to fetch templates:', templatesErr);
      await supabase.from("llm_eval_queue").update({ status: "failed" }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "Templates not found" }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const justText = (just?.text || "").slice(0, 600);
    const ratings: any[] = [];

    // Call Gemini 2.5 Flash with each template
    for (const template of templates) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.2,
          messages: [
            { role: "system", content: template.text },
            { role: "user", content: justText }
          ]
        })
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(`AI gateway error for ${template.id}:`, resp.status, errorText);
        continue;
      }

      const ai = await resp.json();
      let labels: any = {};
      let confidence = 0.8;

      try {
        const content = ai?.choices?.[0]?.message?.content || "{}";
        labels = JSON.parse(content);
        console.log(`Parsed ${template.id}:`, labels);
      } catch (parseErr) {
        console.error(`Failed to parse ${template.id} response:`, parseErr);
        labels = {
          strategy_primary: "other",
          strategy_secondary: [],
          reasoning_style: "analytical",
          step_count: 1,
          coherence_0_1: 0.5,
          error_class: "none",
          jqs_0_1: 0.5
        };
        confidence = 0.3;
      }

      ratings.push({ template_id: template.id, labels, confidence });

      // Insert rating
      await supabase.from("eval_ratings").insert({
        justification_id: job.justification_id,
        template_id: template.id,
        labels_json: labels,
        confidence_0_1: confidence
      });
    }

    if (ratings.length < 2) {
      console.error('Not enough ratings received');
      await supabase.from("llm_eval_queue").update({ status: "failed" }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "Insufficient ratings" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Computing adjudication...');

    // Majority vote for categorical fields
    const stratPrimary = ratings.map(r => r.labels.strategy_primary || "other");
    const reasonStyle = ratings.map(r => r.labels.reasoning_style || "analytical");
    const errorClass = ratings.map(r => r.labels.error_class || "none");

    const majorityVote = (arr: string[]) => {
      const counts: Record<string, number> = {};
      arr.forEach(v => counts[v] = (counts[v] || 0) + 1);
      return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    const adjStratPrimary = majorityVote(stratPrimary);
    const adjReasonStyle = majorityVote(reasonStyle);
    const adjErrorClass = majorityVote(errorClass);

    // Average continuous fields
    const avgCoherence = ratings.reduce((sum, r) => sum + (r.labels.coherence_0_1 || 0.5), 0) / ratings.length;
    const avgJqs = ratings.reduce((sum, r) => sum + (r.labels.jqs_0_1 || 0.5), 0) / ratings.length;
    const avgStepCount = Math.round(ratings.reduce((sum, r) => sum + (r.labels.step_count || 1), 0) / ratings.length);

    // Compute Cohen's kappa (simplified: % agreement across categorical fields)
    const agreements = [
      stratPrimary.filter(v => v === adjStratPrimary).length / stratPrimary.length,
      reasonStyle.filter(v => v === adjReasonStyle).length / reasonStyle.length,
      errorClass.filter(v => v === adjErrorClass).length / errorClass.length
    ];
    const kappa = agreements.reduce((a, b) => a + b, 0) / agreements.length;

    console.log(`Kappa: ${kappa}, JQS: ${avgJqs}`);

    const adjudication = {
      strategy_primary: adjStratPrimary,
      strategy_secondary: ratings[0]?.labels.strategy_secondary || [],
      reasoning_style: adjReasonStyle,
      step_count: avgStepCount,
      coherence_0_1: avgCoherence,
      error_class: adjErrorClass,
      jqs_0_1: avgJqs
    };

    // Insert adjudication
    const { error: adjErr } = await supabase.from("eval_adjudications").insert({
      justification_id: job.justification_id,
      labels_json: adjudication,
      agreement_kappa: kappa,
      jqs_0_1: avgJqs,
      rubric_version: 'v0.4'
    });

    if (adjErr) {
      console.error('Failed to insert adjudication:', adjErr);
      await supabase.from("llm_eval_queue").update({ status: "failed" }).eq("id", job.id);
      return new Response(JSON.stringify({ error: "Failed to save adjudication" }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Also insert to llm_eval_results for backward compatibility
    await supabase.from("llm_eval_results").insert({
      justification_id: job.justification_id,
      strategy_primary: adjudication.strategy_primary,
      strategy_secondary: adjudication.strategy_secondary,
      reasoning_style: adjudication.reasoning_style,
      step_count: adjudication.step_count,
      coherence_0_1: adjudication.coherence_0_1,
      error_class: adjudication.error_class,
      jqs_0_1: adjudication.jqs_0_1,
      features_json: adjudication
    });

    // Conditional progress bump: only if kappa >= 0.5 AND jqs >= 0.35
    if (kappa >= 0.5 && avgJqs >= 0.35) {
      console.log('Quality thresholds met, updating calibration progress...');
      const { error: rpcErr } = await supabase.rpc("bump_calibration_progress", { 
        justification_id: job.justification_id 
      });

      if (rpcErr) {
        console.error('Failed to update calibration progress:', rpcErr);
      }
    } else {
      console.log(`Quality below threshold (κ=${kappa.toFixed(2)}, jqs=${avgJqs.toFixed(2)}), flagging for review`);
      // Update justification flags for review
      await supabase
        .from("question_bank")
        .update({ 
          flags_json: { 
            needs_review: true, 
            reason: `Low quality: κ=${kappa.toFixed(2)}, jqs=${avgJqs.toFixed(2)}` 
          } 
        })
        .eq("id", (await supabase
          .from("user_justifications")
          .select("train_ai_item_id")
          .eq("id", job.justification_id)
          .single()
        ).data?.train_ai_item_id);
    }

    // Mark job as done
    await supabase.from("llm_eval_queue").update({ status: "done" }).eq("id", job.id);

    console.log('Job completed successfully');

    return new Response(JSON.stringify({ 
      success: true,
      job_id: job.id,
      justification_id: job.justification_id,
      adjudication,
      kappa,
      ratings_count: ratings.length
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
