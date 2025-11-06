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
    const { item_id, choice_key } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch the question from question_bank
    const { data: question, error: qError } = await supabaseClient
      .from('question_bank')
      .select('text, options, correct_option, flags_json')
      .eq('id', item_id)
      .single();

    if (qError || !question) {
      console.error('Question fetch error:', qError);
      return new Response(
        JSON.stringify({
          short_justification_md: 'Explanation unavailable for this question.',
          solution_steps_md: null,
          why_others_wrong_md: null,
          misconception_tags: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract explanation from flags_json if available
    const storedExplanation = question.flags_json?.explanation;
    
    if (storedExplanation) {
      return new Response(
        JSON.stringify({
          short_justification_md: storedExplanation,
          solution_steps_md: null,
          why_others_wrong_md: null,
          misconception_tags: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate explanation using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const optionsText = Object.entries(question.options || {})
      .map(([key, val]) => `${key}. ${val}`)
      .join('\n');

    const prompt = `Explain this question and its answer clearly and concisely.

Question: ${question.text}

Options:
${optionsText}

Correct Answer: ${question.correct_option}
${choice_key ? `User Selected: ${choice_key}` : ''}

Provide:
1. A brief (2-3 sentence) justification of why the correct answer is correct
2. Key reasoning steps
3. Why the other options are wrong (if user selected wrong answer)

Keep it educational and clear for a student.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful tutor explaining questions clearly and concisely.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const explanation = aiData.choices?.[0]?.message?.content || 'Explanation generation failed.';

    console.log('Generated explanation for item:', item_id);

    return new Response(
      JSON.stringify({
        short_justification_md: explanation,
        solution_steps_md: null,
        why_others_wrong_md: null,
        misconception_tags: []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        short_justification_md: 'Unable to generate explanation at this time.',
        solution_steps_md: null,
        why_others_wrong_md: null,
        misconception_tags: []
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
