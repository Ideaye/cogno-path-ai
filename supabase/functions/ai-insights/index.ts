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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get active exam
    const { data: enrollment } = await supabaseClient
      .from('user_exam_enrollments')
      .select('exam_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    const examId = enrollment?.exam_id;

    // Get latest features for the exam
    const { data: features } = await supabaseClient
      .from(examId ? 'feature_user_exam_daily' : 'feature_user_daily')
      .select('strategy_strengths_json, acc_ema_long, miscalibration_ema')
      .eq('user_id', user.id)
      .eq(examId ? 'exam_id' : 'user_id', examId || user.id)
      .order('snapshot_date', { ascending: false })
      .limit(1)
      .single();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Call AI to generate insights
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an AI learning coach. Write 2-3 actionable, specific study tips based on the user\'s strategy strengths and calibration data. Be encouraging but direct. Focus on concrete actions they can take.'
          },
          {
            role: 'user',
            content: JSON.stringify(features || {})
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate insights');
    }

    const aiData = await response.json();
    const insights = aiData.choices?.[0]?.message?.content || 'Keep practicing!';

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-insights:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});