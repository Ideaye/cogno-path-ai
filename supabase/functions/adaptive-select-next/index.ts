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
    const { user_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch latest feature snapshot
    const { data: features, error: featError } = await supabaseClient
      .from('feature_user_daily')
      .select('*')
      .eq('user_id', user_id)
      .order('snapshot_date', { ascending: false })
      .limit(1);

    if (featError) throw featError;

    const mastery = features?.[0]?.mastery_vector || {};
    const accShort = features?.[0]?.acc_ema_short || 0.5;
    const miscal = features?.[0]?.miscalibration_ema || 0.2;
    const fatigue = features?.[0]?.fatigue_index || 0.2;

    // Define action space (difficulty adjustment, style, timebox)
    const actions = [
      { diffStep: -1, style: 'analytical', timebox: 'normal' },
      { diffStep: 0, style: 'example', timebox: 'normal' },
      { diffStep: 1, style: 'visual', timebox: 'short' }
    ];

    // Context vector for LinUCB
    const ctxVec = [accShort, 1 - miscal, 1 - fatigue];

    // Retrieve bandit parameters (stored as KV in a simple table)
    const { data: paramData } = await supabaseClient
      .from('learning_paths')
      .select('path_json')
      .eq('user_id', user_id)
      .single();

    const banditParams = paramData?.path_json?.bandit_params || {};

    // UCB scoring function
    function scoreAction(action: any) {
      const key = JSON.stringify(action);
      const state = banditParams[key] || { theta: [0, 0, 0], n: 1 };
      const mean = state.theta.reduce((sum: number, v: number, i: number) => sum + v * ctxVec[i], 0);
      const bonus = Math.sqrt(2 * Math.log(Date.now() % 1e9 + 2) / state.n);
      return mean + bonus;
    }

    // Select best action
    const selectedAction = actions.reduce((best, curr) => 
      scoreAction(curr) > scoreAction(best) ? curr : best
    );

    // Find weakest concepts
    const masteryEntries = Object.entries(mastery);
    const weakestConcepts = masteryEntries
      .sort(([, a]: any, [, b]: any) => a - b)
      .slice(0, 2)
      .map(([id]) => id);

    // If no mastery data, use random concepts
    let conceptIds = weakestConcepts;
    if (conceptIds.length === 0) {
      const { data: concepts } = await supabaseClient
        .from('concepts')
        .select('id')
        .limit(3);
      conceptIds = concepts?.map(c => c.id) || [];
    }

    // Calculate target difficulty
    const baseDiff = 1 - accShort;
    const targetDiff = Math.max(0.1, Math.min(0.9, baseDiff + 0.1 * selectedAction.diffStep));

    // Select question matching criteria
    let question;
    if (conceptIds.length > 0) {
      const { data: questions } = await supabaseClient
        .from('question_bank')
        .select('*, question_bank_concepts!inner(concept_id)')
        .in('question_bank_concepts.concept_id', conceptIds)
        .order('difficulty')
        .limit(10);

      // Find closest difficulty match
      question = questions?.reduce((best, curr) => {
        const currDiff = Math.abs(curr.difficulty - targetDiff);
        const bestDiff = Math.abs(best.difficulty - targetDiff);
        return currDiff < bestDiff ? curr : best;
      });
    }

    // Fallback to random question
    if (!question) {
      const { data: fallback } = await supabaseClient
        .from('question_bank')
        .select('*')
        .limit(1)
        .single();
      question = fallback;
    }

    // Log policy decision
    await supabaseClient
      .from('policy_logs')
      .insert({
        user_id,
        context_json: { ctxVec, weakestConcepts: conceptIds, targetDiff },
        action_json: selectedAction,
        chosen_question_id: question?.id || null,
        propensity: 1.0,
      });

    console.log(`Selected question ${question?.id} with action:`, selectedAction);

    return new Response(
      JSON.stringify({
        question,
        style: selectedAction.style,
        timebox: selectedAction.timebox,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
