import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Security checks
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting synthetic data wipe...');

    const deleted = {
      feature_snapshots: 0,
      adjudications: 0,
      justifications: 0,
      attempts: 0,
      enrollments: 0,
      practice_items: 0,
      calibration_items: 0,
      users: 0,
    };

    // Delete in reverse dependency order
    const { error: e1, count: c1 } = await supabase
      .from('feature_user_exam_daily')
      .delete()
      .eq('is_synthetic', true);
    deleted.feature_snapshots = c1 || 0;
    if (e1) console.error('Error deleting features:', e1);

    const { error: e2, count: c2 } = await supabase
      .from('eval_adjudications')
      .delete()
      .eq('is_synthetic', true);
    deleted.adjudications = c2 || 0;
    if (e2) console.error('Error deleting adjudications:', e2);

    const { error: e3, count: c3 } = await supabase
      .from('user_justifications')
      .delete()
      .eq('is_synthetic', true);
    deleted.justifications = c3 || 0;
    if (e3) console.error('Error deleting justifications:', e3);

    const { error: e4, count: c4 } = await supabase
      .from('attempts')
      .delete()
      .eq('is_synthetic', true);
    deleted.attempts = c4 || 0;
    if (e4) console.error('Error deleting attempts:', e4);

    // Get synthetic user IDs
    const { data: synthUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_synthetic', true);

    if (synthUsers && synthUsers.length > 0) {
      const userIds = synthUsers.map(u => u.id);
      
      const { error: e5, count: c5 } = await supabase
        .from('user_exam_enrollments')
        .delete()
        .in('user_id', userIds);
      deleted.enrollments = c5 || 0;
      if (e5) console.error('Error deleting enrollments:', e5);
    }

    const { error: e6, count: c6 } = await supabase
      .from('practice_items')
      .delete()
      .eq('is_synthetic', true);
    deleted.practice_items = c6 || 0;
    if (e6) console.error('Error deleting practice items:', e6);

    const { error: e7, count: c7 } = await supabase
      .from('calibration_items')
      .delete()
      .eq('is_synthetic', true);
    deleted.calibration_items = c7 || 0;
    if (e7) console.error('Error deleting calibration items:', e7);

    const { error: e8, count: c8 } = await supabase
      .from('profiles')
      .delete()
      .eq('is_synthetic', true);
    deleted.users = c8 || 0;
    if (e8) console.error('Error deleting users:', e8);

    console.log('Completed synthetic data wipe:', deleted);

    return new Response(JSON.stringify({ success: true, deleted }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wipe-synthetic-data:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});