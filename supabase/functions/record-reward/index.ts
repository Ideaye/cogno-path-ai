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
    const { attempt_id } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the attempt
    const { data: attempt, error: attemptError } = await supabaseClient
      .from('attempts')
      .select('*')
      .eq('id', attempt_id)
      .single();

    if (attemptError) throw attemptError;

    // Find most recent policy log for this user
    const { data: logs, error: logsError } = await supabaseClient
      .from('policy_logs')
      .select('*')
      .eq('user_id', attempt.user_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (logsError) throw logsError;

    if (!logs || logs.length === 0) {
      throw new Error('No policy log found for this attempt');
    }

    const policyLog = logs[0];

    // Compute reward: accuracy - time_penalty + confidence_bonus
    const accuracyReward = attempt.correct ? 1 : 0;
    const timePenalty = Math.log(1 + Math.max(attempt.time_taken, 0.1)) / 5;
    const confidenceBonus = (attempt.confidence || 0) * 0.2;
    const reward = accuracyReward - timePenalty + confidenceBonus;

    // Update policy log with reward
    await supabaseClient
      .from('policy_logs')
      .update({ reward })
      .eq('id', policyLog.id);

    // Update bandit parameters (LinUCB update)
    const { data: pathData } = await supabaseClient
      .from('learning_paths')
      .select('*')
      .eq('user_id', attempt.user_id)
      .single();

    const banditParams = pathData?.path_json?.bandit_params || {};
    const actionKey = JSON.stringify(policyLog.action_json);
    const state = banditParams[actionKey] || {
      theta: [0, 0, 0],
      n: 0,
    };

    // Simple gradient update (simplified LinUCB)
    const context = policyLog.context_json.ctxVec || [0.5, 0.8, 0.8];
    const learningRate = 0.1;
    
    const newTheta = state.theta.map((t: number, i: number) => {
      const error = reward - (state.theta.reduce((sum: number, val: number, j: number) => sum + val * context[j], 0));
      return t + learningRate * error * context[i];
    });

    banditParams[actionKey] = {
      theta: newTheta,
      n: state.n + 1,
    };

    // Save updated parameters
    await supabaseClient
      .from('learning_paths')
      .upsert({
        user_id: attempt.user_id,
        path_json: {
          ...pathData?.path_json,
          bandit_params: banditParams,
        },
      });

    console.log(`Recorded reward ${reward.toFixed(3)} for attempt ${attempt_id}`);

    return new Response(
      JSON.stringify({ success: true, reward }),
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
