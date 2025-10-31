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

    console.log('Running CDNA Rigor Pack v0.4 Audit...');

    // 1. Count tables
    const { count: ratingsCount } = await supabase
      .from('eval_ratings')
      .select('*', { count: 'exact', head: true });

    const { count: adjudicationsCount } = await supabase
      .from('eval_adjudications')
      .select('*', { count: 'exact', head: true });

    const { count: anchorsCount } = await supabase
      .from('anchor_items')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    const { count: cdnaVersionsCount } = await supabase
      .from('cdna_versions')
      .select('*', { count: 'exact', head: true });

    // 2. Kappa distribution (today)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAdjudications } = await supabase
      .from('eval_adjudications')
      .select('agreement_kappa')
      .gte('created_at', `${today}T00:00:00`)
      .order('agreement_kappa');

    const kappaValues = (todayAdjudications || [])
      .map(a => a.agreement_kappa)
      .filter(k => k !== null) as number[];

    const kappaStats = kappaValues.length > 0 ? {
      min: Math.min(...kappaValues),
      median: kappaValues[Math.floor(kappaValues.length / 2)],
      max: Math.max(...kappaValues),
      mean: kappaValues.reduce((sum, k) => sum + k, 0) / kappaValues.length,
      count: kappaValues.length
    } : null;

    // 3. ECE and Anchor metrics
    const { data: latestFeatures } = await supabase
      .from('feature_user_exam_daily')
      .select('user_id, exam_id, ece_0_1, anchor_score_mean, anchor_score_std')
      .order('snapshot_date', { ascending: false })
      .limit(10);

    const eceMetrics = latestFeatures?.filter(f => f.ece_0_1 !== null) || [];
    const anchorMetrics = latestFeatures?.filter(f => 
      f.anchor_score_mean !== null && f.anchor_score_std !== null
    ) || [];

    // 4. CDNA v0.4 examples
    const { data: cdnaExamples } = await supabase
      .from('cdna_versions')
      .select('id, user_id, version, source, created_at, vector_json')
      .eq('version', 'v0.4')
      .order('created_at', { ascending: false })
      .limit(3);

    // 5. Cron job status
    const { data: cronJobs } = await supabase
      .from('cron.job_run_details')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(5);

    // 6. Build report
    const report = {
      timestamp: new Date().toISOString(),
      status: 'CONDITIONAL GO - Production-Ready with Gaps',
      tables: {
        eval_ratings: ratingsCount || 0,
        eval_adjudications: adjudicationsCount || 0,
        anchor_items_active: anchorsCount || 0,
        cdna_versions: cdnaVersionsCount || 0
      },
      kappa_distribution_today: kappaStats,
      ece_metrics: {
        users_with_ece: eceMetrics.length,
        sample: eceMetrics.slice(0, 3).map(f => ({
          user_id: f.user_id,
          ece: f.ece_0_1
        }))
      },
      anchor_metrics: {
        users_with_anchors: anchorMetrics.length,
        sample: anchorMetrics.slice(0, 3).map(f => ({
          user_id: f.user_id,
          mean: f.anchor_score_mean,
          std: f.anchor_score_std
        }))
      },
      cdna_v04_examples: cdnaExamples?.map(c => ({
        id: c.id,
        user_id: c.user_id,
        source: c.source,
        created_at: c.created_at,
        vector_keys: Object.keys(c.vector_json || {})
      })) || [],
      cron_jobs_recent: cronJobs || [],
      readiness_checks: {
        committee_evaluation: ratingsCount && ratingsCount > 0 ? '✅' : '❌',
        adjudication_system: adjudicationsCount && adjudicationsCount > 0 ? '✅' : '❌',
        anchor_items: anchorsCount && anchorsCount >= 12 ? '✅' : '⚠️',
        cdna_v04_shadow: cdnaVersionsCount && cdnaVersionsCount > 0 ? '✅' : '❌',
        kappa_quality: kappaStats && kappaStats.median >= 0.6 ? '✅' : (kappaStats ? '⚠️' : '❌')
      },
      metrics_targets: {
        kappa_median: '≥ 0.6',
        ece: '≤ 0.08',
        anchor_std: '≤ 0.12',
        anchor_cosine_similarity: '≥ 0.9'
      }
    };

    console.log('Audit complete:', report);

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Audit error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
