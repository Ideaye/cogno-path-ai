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

    // Fetch recent attempts
    const { data: attempts, error: attemptsError } = await supabaseClient
      .from('attempts')
      .select('*, question_bank!inner(difficulty, concept_tag), question_bank_concepts!inner(concept_id)')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (attemptsError) throw attemptsError;

    if (!attempts || attempts.length === 0) {
      // Initialize default features
      await supabaseClient
        .from('feature_user_daily')
        .upsert({
          user_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          acc_ema_short: 0.5,
          acc_ema_long: 0.5,
          latency_ema_short: 15.0,
          latency_ema_long: 15.0,
          miscalibration_ema: 0.2,
          mastery_vector: {},
        });

      return new Response(
        JSON.stringify({ message: 'Initialized default features' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute EMA features
    const alpha_short = 0.3;
    const alpha_long = 0.1;

    let acc_ema_short = 0.5;
    let acc_ema_long = 0.5;
    let latency_ema_short = 15.0;
    let latency_ema_long = 15.0;

    // Compute EMAs (newest to oldest)
    attempts.forEach(attempt => {
      const correct = attempt.correct ? 1 : 0;
      acc_ema_short = alpha_short * correct + (1 - alpha_short) * acc_ema_short;
      acc_ema_long = alpha_long * correct + (1 - alpha_long) * acc_ema_long;
      
      latency_ema_short = alpha_short * attempt.time_taken + (1 - alpha_short) * latency_ema_short;
      latency_ema_long = alpha_long * attempt.time_taken + (1 - alpha_long) * latency_ema_long;
    });

    // Compute miscalibration
    const recentAttempts = attempts.slice(0, 20);
    const miscalibrationScores = recentAttempts.map(a => {
      const confidence = a.confidence || 0.5;
      const actual = a.correct ? 1 : 0;
      return Math.abs(confidence - actual);
    });
    const miscalibration_ema = miscalibrationScores.reduce((sum, val) => sum + val, 0) / Math.max(miscalibrationScores.length, 1);

    // Compute mastery vector by concept
    const masteryMap: Record<string, { correct: number; total: number }> = {};
    
    attempts.forEach(attempt => {
      const conceptIds = attempt.question_bank_concepts?.map((qc: any) => qc.concept_id) || [];
      conceptIds.forEach((conceptId: string) => {
        if (!masteryMap[conceptId]) {
          masteryMap[conceptId] = { correct: 0, total: 0 };
        }
        masteryMap[conceptId].total += 1;
        if (attempt.correct) {
          masteryMap[conceptId].correct += 1;
        }
      });
    });

    const mastery_vector: Record<string, number> = {};
    Object.entries(masteryMap).forEach(([conceptId, stats]) => {
      mastery_vector[conceptId] = stats.total > 0 ? stats.correct / stats.total : 0.5;
    });

    // Fatigue index (simplified: based on recent time variance)
    const recent20 = attempts.slice(0, 20);
    const avgTime = recent20.reduce((sum, a) => sum + a.time_taken, 0) / Math.max(recent20.length, 1);
    const timeVariance = recent20.reduce((sum, a) => sum + Math.pow(a.time_taken - avgTime, 2), 0) / Math.max(recent20.length, 1);
    const fatigue_index = Math.min(1, timeVariance / 100);

    // Save features
    const today = new Date().toISOString().split('T')[0];
    await supabaseClient
      .from('feature_user_daily')
      .upsert({
        user_id,
        snapshot_date: today,
        acc_ema_short,
        acc_ema_long,
        latency_ema_short,
        latency_ema_long,
        miscalibration_ema,
        skip_rate_win20: 0,
        fatigue_index,
        pressure_sensitivity: 0,
        switch_cost: 0,
        mastery_vector,
      });

    console.log(`Computed features for user ${user_id}:`, {
      acc_ema_short,
      acc_ema_long,
      miscalibration_ema,
      fatigue_index,
      concepts: Object.keys(mastery_vector).length,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        features: {
          acc_ema_short,
          acc_ema_long,
          latency_ema_short,
          latency_ema_long,
          miscalibration_ema,
          fatigue_index,
          mastery_vector,
        }
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
