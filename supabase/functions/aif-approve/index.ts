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
    const { aiq_ids, min_quality = 0.7 } = await req.json();

    if (!Array.isArray(aiq_ids) || aiq_ids.length === 0) {
      return new Response(
        JSON.stringify({ error: 'aiq_ids must be a non-empty array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const results = {
      inserted: 0,
      skipped: 0,
      duplicates: 0,
      errors: 0
    };

    for (const aiq_id of aiq_ids) {
      try {
        const { data: qItem } = await supabase
          .from('ai_items_quarantine')
          .select('*')
          .eq('id', aiq_id)
          .eq('status', 'validated')
          .single();

        if (!qItem) {
          results.skipped++;
          continue;
        }

        if (qItem.quality_score < min_quality) {
          results.skipped++;
          continue;
        }

        const item = qItem.payload_json as any;

        // Insert into question_bank
        const { data: inserted, error: insertError } = await supabase
          .from('question_bank')
          .insert({
            text: item.stem,
            options: { choices: item.options },
            correct_option: item.options[item.correct_index],
            format_type: 'multiple_choice',
            concept_tag: item.concept_tags[0] || 'general',
            difficulty: qItem.difficulty_seed_0_1 || 0.5,
            required_strategy: qItem.required_strategy,
            reading_len: qItem.reading_len,
            source: 'ai',
            generator_version: qItem.generator_version,
            originality_hash: qItem.originality_hash,
            quality_score: qItem.quality_score,
            flags_json: { explanation: item.explanation }
          })
          .select('id')
          .single();

        if (insertError) {
          if (insertError.code === '23505') {
            results.duplicates++;
          } else {
            console.error('Insert error:', insertError);
            results.errors++;
          }
          continue;
        }

        if (inserted?.id) {
          // Get concept IDs
          const { data: concepts } = await supabase
            .from('concepts')
            .select('id, name')
            .in('name', item.concept_tags);

          // Map concepts
          if (concepts && concepts.length > 0) {
            const conceptMappings = concepts.map(c => ({
              question_id: inserted.id,
              concept_id: c.id
            }));

            await supabase
              .from('question_bank_concepts')
              .insert(conceptMappings);
          }

          // Update quarantine status
          await supabase
            .from('ai_items_quarantine')
            .update({ status: 'approved' })
            .eq('id', aiq_id);

          results.inserted++;
        }

      } catch (e) {
        console.error('Approval error:', e);
        results.errors++;
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aif-approve:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
