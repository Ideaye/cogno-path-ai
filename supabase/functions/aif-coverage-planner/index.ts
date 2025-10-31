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
    const { exam_id, target_per_section = 40 } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get exam sections
    const { data: sections } = await supabase
      .from('exam_sections')
      .select('name')
      .eq('exam_id', exam_id);

    if (!sections || sections.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No sections found for exam' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const plan = [];
    const results = [];

    for (const section of sections) {
      const { count } = await supabase
        .from('question_bank')
        .select('*', { count: 'exact', head: true })
        .eq('concept_tag', section.name);

      const current = count || 0;
      const deficit = Math.max(0, target_per_section - current);

      if (deficit > 0) {
        plan.push({
          section: section.name,
          current,
          target: target_per_section,
          deficit
        });

        // Generate items to fill deficit
        const generateResponse = await supabase.functions.invoke('aif-generate', {
          body: {
            exam_id,
            section: section.name,
            concept_tags: [section.name],
            count: deficit,
            difficulty_mix: { easy: 0.3, medium: 0.5, hard: 0.2 },
            required_strategy_pct: 0.3
          }
        });

        results.push({
          section: section.name,
          deficit,
          generated: generateResponse.data
        });
      }
    }

    return new Response(
      JSON.stringify({ plan, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aif-coverage-planner:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
