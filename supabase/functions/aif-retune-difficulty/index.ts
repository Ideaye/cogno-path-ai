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

    const results = {
      analyzed: 0,
      updated: 0,
      skipped: 0
    };

    // Get questions with at least 10 recent attempts (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: questions } = await supabase
      .from('question_bank')
      .select('id, difficulty')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (!questions) {
      return new Response(
        JSON.stringify({ message: 'No questions to analyze' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    for (const question of questions) {
      const { data: attempts, count } = await supabase
        .from('attempts')
        .select('correct', { count: 'exact' })
        .eq('question_id', question.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      results.analyzed++;

      if (!count || count < 10) {
        results.skipped++;
        continue;
      }

      // Calculate empirical difficulty
      const correctCount = attempts?.filter(a => a.correct).length || 0;
      const accuracy = correctCount / count;
      const empirical = 1 - accuracy; // Higher difficulty = lower accuracy

      // Blend: 80% current + 20% empirical
      const oldDiff = question.difficulty;
      const newDiff = Math.max(0.05, Math.min(0.95, 0.8 * oldDiff + 0.2 * empirical));

      // Only update if change is significant (> 0.05)
      if (Math.abs(newDiff - oldDiff) > 0.05) {
        await supabase
          .from('question_bank')
          .update({ difficulty: newDiff })
          .eq('id', question.id);

        await supabase
          .from('question_difficulty_history')
          .insert({
            question_id: question.id,
            old: oldDiff,
            new: newDiff,
            reason: 'retune'
          });

        results.updated++;
      } else {
        results.skipped++;
      }
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in aif-retune-difficulty:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
