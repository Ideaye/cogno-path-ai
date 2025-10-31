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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const results = { processed: 0, validated: 0, rejected: 0, errors: 0 };

    // Process up to 5 queued items
    for (let batch = 0; batch < 5; batch++) {
      // First select a queued job
      const { data: queuedJobs } = await supabase
        .from('aif_validation_queue')
        .select('id, aiq_id')
        .eq('status', 'queued')
        .limit(1);

      if (!queuedJobs || queuedJobs.length === 0) break;
      
      const job = queuedJobs[0];
      
      // Then update it to processing
      await supabase
        .from('aif_validation_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .eq('id', job.id);

      try {
        const { data: qItem } = await supabase
          .from('ai_items_quarantine')
          .select('id, payload_json')
          .eq('id', job.aiq_id)
          .single();

        if (!qItem) {
          await supabase.from('aif_validation_queue')
            .update({ status: 'failed', error: 'Quarantine item not found' })
            .eq('id', job.id);
          results.errors++;
          continue;
        }

        const item = qItem.payload_json as any;

        const rubricPrompt = `Validate a single MCQ item for clarity, solvability, and uniqueness.
Return JSON ONLY:
{ "is_valid": true|false,
  "reasons": ["..."],
  "quality_score_0_1": 0..1,
  "issues": ["ambiguous_stem"|"calc_error"|"poor_distractors"|"missing_explanation"|"bias"|"too_trivial"|"too_hard"|"duplicate_style"],
  "difficulty_check_0_1": 0..1 }

Item to validate:
Stem: ${item.stem}
Options: ${JSON.stringify(item.options)}
Correct Index: ${item.correct_index}
Explanation: ${item.explanation}`;

        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            temperature: 0.2,
            messages: [
              { role: 'system', content: rubricPrompt },
              { role: 'user', content: 'Validate this item now.' }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`AI Gateway error: ${response.status}`);
        }

        const aiData = await response.json();
        const content = aiData?.choices?.[0]?.message?.content || '';
        
        let validation;
        try {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : content;
          validation = JSON.parse(jsonStr);
        } catch (e) {
          validation = {
            is_valid: false,
            reasons: ['Failed to parse validation response'],
            quality_score_0_1: 0,
            issues: ['validation_error'],
            difficulty_check_0_1: item.difficulty_seed_0_1 || 0.5
          };
        }

        // Update quarantine item
        const newStatus = validation.is_valid ? 'validated' : 'rejected';
        await supabase
          .from('ai_items_quarantine')
          .update({
            quality_score: validation.quality_score_0_1 || 0,
            issues: validation.issues || [],
            status: newStatus,
            difficulty_seed_0_1: validation.difficulty_check_0_1 || item.difficulty_seed_0_1
          })
          .eq('id', job.aiq_id);

        // Mark queue job as done
        await supabase.from('aif_validation_queue')
          .update({ status: 'done' })
          .eq('id', job.id);

        results.processed++;
        if (validation.is_valid) {
          results.validated++;
        } else {
          results.rejected++;
        }

      } catch (e) {
        console.error('Validation error:', e);
        await supabase.from('aif_validation_queue')
          .update({ 
            status: 'failed', 
            error: e instanceof Error ? e.message : 'Unknown error' 
          })
          .eq('id', job.id);
        results.errors++;
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aif-validator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
