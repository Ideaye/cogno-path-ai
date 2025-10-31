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
    const { user_id, exam_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Computing CDNA v0.4 for user ${user_id}, exam ${exam_id}`);

    // 1. Fetch adjudications (last 50)
    const { data: adjudications } = await supabase
      .from('eval_adjudications')
      .select('labels_json, jqs_0_1')
      .eq('justification_id', supabase
        .from('user_justifications')
        .select('id')
        .eq('train_ai_item_id', supabase
          .from('train_ai_items')
          .select('id')
          .eq('session_id', supabase
            .from('train_ai_sessions')
            .select('id')
            .eq('user_id', user_id)
          )
        )
      )
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Fetch attempts (last 100)
    const { data: attempts } = await supabase
      .from('attempts')
      .select('correct, time_taken, confidence_0_1')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!adjudications || adjudications.length < 5) {
      console.log('Insufficient adjudications for CDNA v0.4');
      return new Response(JSON.stringify({ error: "Insufficient data" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Compute strategy_strengths vector
    const stratCounts: Record<string, number> = {};
    adjudications.forEach(adj => {
      const strat = adj.labels_json?.strategy_primary;
      if (strat) stratCounts[strat] = (stratCounts[strat] || 0) + 1;
    });
    const totalStrats = adjudications.length;
    const strategy_strengths = Object.fromEntries(
      Object.entries(stratCounts).map(([k, v]) => [k, v / totalStrats])
    );

    // 4. Compute error_pattern_vec
    const errorCounts: Record<string, number> = {};
    adjudications.forEach(adj => {
      const err = adj.labels_json?.error_class;
      if (err && err !== 'none') errorCounts[err] = (errorCounts[err] || 0) + 1;
    });
    const error_pattern_vec = Object.fromEntries(
      Object.entries(errorCounts).map(([k, v]) => [k, v / adjudications.length])
    );

    // 5. Compute time_profile (fast/medium/slow buckets)
    const times = attempts?.map(a => a.time_taken).filter(t => t > 0) || [];
    const avgTime = times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 15.0;
    const fastCount = times.filter(t => t < avgTime * 0.7).length;
    const slowCount = times.filter(t => t > avgTime * 1.3).length;
    const time_profile = {
      fast: fastCount / times.length,
      medium: (times.length - fastCount - slowCount) / times.length,
      slow: slowCount / times.length,
      avg_seconds: avgTime
    };

    // 6. Compute confidence_calibration (ECE approximation)
    const buckets = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
    const bucketAcc: number[] = [];
    const bucketConf: number[] = [];
    
    for (let i = 0; i < buckets.length - 1; i++) {
      const inBucket = attempts?.filter(a => 
        a.confidence_0_1 != null &&
        a.confidence_0_1 >= buckets[i] && 
        a.confidence_0_1 < buckets[i + 1]
      ) || [];
      
      if (inBucket.length > 0) {
        const acc = inBucket.filter(a => a.correct).length / inBucket.length;
        const conf = inBucket.reduce((sum, a) => sum + (a.confidence_0_1 || 0.5), 0) / inBucket.length;
        bucketAcc.push(acc);
        bucketConf.push(conf);
      }
    }
    
    let ece = 0;
    for (let i = 0; i < bucketAcc.length; i++) {
      ece += Math.abs(bucketAcc[i] - bucketConf[i]);
    }
    ece = ece / Math.max(bucketAcc.length, 1);

    // 7. Compute planning_depth (avg step_count)
    const stepCounts = adjudications.map(adj => adj.labels_json?.step_count || 1);
    const planning_depth = stepCounts.reduce((sum, s) => sum + s, 0) / stepCounts.length;

    // 8. Build CDNA v0.4 vector
    const cdnaVector = {
      strategy_strengths,
      error_pattern_vec,
      time_profile,
      confidence_calibration: {
        ece,
        bucket_accuracies: bucketAcc,
        bucket_confidences: bucketConf
      },
      planning_depth,
      jqs_mean: adjudications.reduce((sum, adj) => sum + (adj.jqs_0_1 || 0.5), 0) / adjudications.length,
      data_points: {
        adjudications: adjudications.length,
        attempts: attempts?.length || 0
      }
    };

    console.log('CDNA v0.4 computed:', cdnaVector);

    // 9. Save to cdna_versions (shadow)
    const { error: insertErr } = await supabase.from('cdna_versions').insert({
      user_id,
      exam_id,
      vector_json: cdnaVector,
      version: 'v0.4',
      source: 'shadow'
    });

    if (insertErr) {
      console.error('Failed to save CDNA v0.4:', insertErr);
      throw insertErr;
    }

    // 10. Update ECE in feature_user_exam_daily
    await supabase
      .from('feature_user_exam_daily')
      .upsert({
        user_id,
        exam_id,
        snapshot_date: new Date().toISOString().split('T')[0],
        ece_0_1: ece
      }, {
        onConflict: 'user_id,exam_id,snapshot_date'
      });

    return new Response(JSON.stringify({ 
      success: true,
      cdna_vector: cdnaVector,
      ece
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error computing CDNA v0.4:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
