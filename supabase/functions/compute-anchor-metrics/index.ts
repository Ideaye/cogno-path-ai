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

    console.log('Computing anchor metrics for all users...');

    // Get all active anchor items grouped by exam
    const { data: anchors } = await supabase
      .from('anchor_items')
      .select('question_id, exam_id')
      .eq('active', true);

    if (!anchors || anchors.length === 0) {
      console.log('No active anchor items found');
      return new Response(JSON.stringify({ message: "No anchors configured" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get all users with enrollments
    const { data: enrollments } = await supabase
      .from('user_exam_enrollments')
      .select('user_id, exam_id')
      .eq('is_active', true);

    if (!enrollments || enrollments.length === 0) {
      console.log('No active enrollments found');
      return new Response(JSON.stringify({ message: "No enrollments" }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let processed = 0;

    for (const enrollment of enrollments) {
      const examAnchors = anchors.filter(a => a.exam_id === enrollment.exam_id);
      if (examAnchors.length === 0) continue;

      const anchorQuestionIds = examAnchors.map(a => a.question_id);

      // Get user's attempts on anchor items (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: attempts } = await supabase
        .from('attempts')
        .select('correct')
        .eq('user_id', enrollment.user_id)
        .in('question_id', anchorQuestionIds)
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (!attempts || attempts.length < 3) {
        // Not enough anchor attempts for reliable metrics
        continue;
      }

      // Calculate mean and std of accuracy on anchors
      const scores = attempts.map(a => a.correct ? 1 : 0);
      const mean = scores.reduce((sum: number, v) => sum + v, 0) / scores.length;
      const variance = scores.reduce((sum: number, v) => sum + Math.pow(v - mean, 2), 0) / scores.length;
      const std = Math.sqrt(variance);

      console.log(`User ${enrollment.user_id}, Exam ${enrollment.exam_id}: anchor_mean=${mean.toFixed(2)}, anchor_std=${std.toFixed(2)}`);

      // Update feature_user_exam_daily for today
      await supabase
        .from('feature_user_exam_daily')
        .upsert({
          user_id: enrollment.user_id,
          exam_id: enrollment.exam_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          anchor_score_mean: mean,
          anchor_score_std: std
        }, {
          onConflict: 'user_id,exam_id,snapshot_date'
        });

      processed++;
    }

    console.log(`Processed anchor metrics for ${processed} user-exam pairs`);

    return new Response(JSON.stringify({ 
      success: true,
      processed,
      total_enrollments: enrollments.length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error computing anchor metrics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
