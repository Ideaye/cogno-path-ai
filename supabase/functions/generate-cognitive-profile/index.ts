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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch diagnostic results
    const { data: results, error: resultsError } = await supabaseClient
      .from('diagnostic_results')
      .select('*')
      .eq('user_id', user_id);

    if (resultsError) throw resultsError;

    if (!results || results.length === 0) {
      throw new Error('No diagnostic results found');
    }

    // Calculate metrics
    const avgTime = results.reduce((sum, r) => sum + r.time_taken, 0) / results.length;
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / results.length;
    const accuracy = results.filter(r => r.correct).length / results.length;
    const totalHesitation = results.reduce((sum, r) => sum + r.hesitation_count, 0);

    // Determine profile type
    let profileType = 'Analytical';
    let strengths: string[] = [];
    let areasForImprovement: string[] = [];

    if (avgTime < 15 && accuracy > 0.75) {
      profileType = 'Intuitive';
      strengths = [
        'Quick decision making',
        'Strong pattern recognition',
        'Efficient problem solving'
      ];
    } else if (avgTime > 20 && accuracy > 0.6) {
      profileType = 'Reflective';
      strengths = [
        'Thorough analysis',
        'Careful consideration',
        'Detailed thinking'
      ];
      areasForImprovement = ['Time management', 'Decision speed'];
    } else if (avgConfidence < 0.5) {
      profileType = 'Cautious';
      strengths = ['Careful approach', 'Risk awareness'];
      areasForImprovement = ['Build confidence', 'Trust your instincts'];
    } else {
      strengths = ['Balanced approach', 'Steady performance'];
    }

    if (accuracy < 0.5) {
      areasForImprovement.push('Concept mastery', 'Practice fundamentals');
    }

    // Use Lovable AI to generate personalized insights
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a cognitive learning expert. Analyze test performance and provide 2-3 actionable, encouraging insights.'
          },
          {
            role: 'user',
            content: `Profile: ${profileType}, Accuracy: ${(accuracy * 100).toFixed(0)}%, Avg Time: ${avgTime.toFixed(1)}s, Confidence: ${(avgConfidence * 100).toFixed(0)}%, Hesitations: ${totalHesitation}`
          }
        ],
      }),
    });

    let aiInsights = '';
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      aiInsights = aiData.choices?.[0]?.message?.content || '';
    }

    const cognitiveProfile = {
      avgTime,
      avgConfidence,
      accuracy,
      profileType,
      strengths,
      areasForImprovement,
      aiInsights,
      generatedAt: new Date().toISOString(),
    };

    // Update user profile
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ cognitive_profile: cognitiveProfile })
      .eq('id', user_id);

    if (updateError) throw updateError;

    console.log(`Generated profile for user ${user_id}: ${profileType}`);

    return new Response(
      JSON.stringify({ success: true, profile: cognitiveProfile }),
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
