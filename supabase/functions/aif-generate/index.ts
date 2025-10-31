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
    const { 
      exam_id, 
      section, 
      concept_tags, 
      count = 1, 
      difficulty_mix = { easy: 0.3, medium: 0.5, hard: 0.2 },
      required_strategy_pct = 0.3 
    } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const results = {
      generated: 0,
      inserted: 0,
      duplicates: 0,
      errors: 0,
      ids: [] as string[]
    };

    // Distribute difficulty
    const difficultyBands: { band: string; range: [number, number]; count: number }[] = [
      { band: 'easy', range: [0.2, 0.4], count: Math.round(count * difficulty_mix.easy) },
      { band: 'medium', range: [0.4, 0.65], count: Math.round(count * difficulty_mix.medium) },
      { band: 'hard', range: [0.65, 0.85], count: Math.round(count * difficulty_mix.hard) }
    ];

    const strategies = ['elimination', 'equation_setup', 'diagram', null];
    let strategyIndex = 0;

    for (const { band, range, count: bandCount } of difficultyBands) {
      for (let i = 0; i < bandCount; i++) {
        try {
          const useStrategy = Math.random() < required_strategy_pct;
          const targetStrategy = useStrategy ? strategies[strategyIndex % 3] : null;
          if (useStrategy) strategyIndex++;

          const targetDiff = range[0] + Math.random() * (range[1] - range[0]);

          const systemPrompt = `You generate ORIGINAL multiple-choice questions for exam ${exam_id}, section ${section}, concept tags ${concept_tags.join(', ')}.
Return JSON ONLY matching this schema:
{ "exam_id":"${exam_id}", "section":"${section}", "concept_tags":${JSON.stringify(concept_tags)},
  "stem":"...", "options":["A","B","C","D"], "correct_index":1,
  "explanation":"...", "required_strategy":"${targetStrategy || 'null'}",
  "difficulty_seed_0_1": ${targetDiff.toFixed(2)}, "reading_len": 0, "metadata": {} }

Rules:
- One unambiguously correct option (correct_index points to it).
- NO copyrighted passages; write original content.
- Match target difficulty band ${band} (${targetDiff.toFixed(2)}).
- Prefer 2–4 reasoning steps; explanation must justify the correct option and 1–2 distractors.
- If numeric, avoid trivial mental math; require setup (equations/ratios/logic).
- Stem/explanation must be under 800 characters each.`;

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
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Generate one question now.' }
              ]
            })
          });

          if (!response.ok) {
            console.error(`AI Gateway error: ${response.status}`);
            results.errors++;
            continue;
          }

          const aiData = await response.json();
          const content = aiData?.choices?.[0]?.message?.content || '';
          
          let item;
          try {
            // Try to extract JSON if wrapped in markdown
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : content;
            item = JSON.parse(jsonStr);
          } catch (e) {
            console.error('Failed to parse AI response:', content);
            results.errors++;
            continue;
          }

          results.generated++;

          // Compute reading_len and originality_hash
          item.reading_len = item.stem.length + (item.explanation?.length || 0);
          const optionsArray = Array.isArray(item.options) ? item.options : [];
          const correctOption = optionsArray[item.correct_index] || '';
          
          const { data: hashData } = await supabase.rpc('compute_item_hash', {
            stem: item.stem,
            correct: correctOption,
            options: optionsArray
          });

          const originality_hash = hashData || `fallback_${Date.now()}_${Math.random()}`;

          // Insert into quarantine
          const { data: inserted, error: insertError } = await supabase
            .from('ai_items_quarantine')
            .insert({
              exam_id,
              section,
              payload_json: item,
              originality_hash,
              quality_score: 0,
              required_strategy: item.required_strategy,
              difficulty_seed_0_1: item.difficulty_seed_0_1,
              reading_len: item.reading_len,
              status: 'pending',
              generator_version: 'aif_v1'
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
            results.inserted++;
            results.ids.push(inserted.id);

            // Enqueue for validation
            await supabase.from('aif_validation_queue').insert({
              aiq_id: inserted.id,
              status: 'queued'
            });
          }

        } catch (e) {
          console.error('Item generation error:', e);
          results.errors++;
        }
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aif-generate:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
