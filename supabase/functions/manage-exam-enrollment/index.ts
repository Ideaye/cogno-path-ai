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
    const { action, exam_id } = await req.json();
    
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

    if (action === 'add') {
      // Check if enrollment exists
      const { data: existing } = await supabaseClient
        .from('user_exam_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', exam_id)
        .single();

      if (!existing) {
        // Create new enrollment
        await supabaseClient
          .from('user_exam_enrollments')
          .insert({ user_id: user.id, exam_id, is_active: false });
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Exam added' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'set_active') {
      // Deactivate all enrollments for this user
      await supabaseClient
        .from('user_exam_enrollments')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Activate the selected exam
      await supabaseClient
        .from('user_exam_enrollments')
        .update({ is_active: true })
        .eq('user_id', user.id)
        .eq('exam_id', exam_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Active exam updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'remove') {
      // Delete enrollment
      await supabaseClient
        .from('user_exam_enrollments')
        .delete()
        .eq('user_id', user.id)
        .eq('exam_id', exam_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Enrollment removed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in manage-exam-enrollment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});