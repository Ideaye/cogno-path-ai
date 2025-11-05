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

    const { exam_ids, users_count = 400, days = 30, attempts_range = [80, 150] } = await req.json();

    console.log('Starting synthetic data generation:', { exam_ids, users_count, days, attempts_range });

    const counts = {
      exams: 0,
      calibration_items: 0,
      practice_items: 0,
      users: 0,
      enrollments: 0,
      attempts: 0,
      justifications: 0,
      adjudications: 0,
      features: 0,
    };

    // Get or create exams
    let exam_list = [];
    if (exam_ids && exam_ids.length > 0) {
      const { data } = await supabase.from('exams').select('*').in('id', exam_ids);
      exam_list = data || [];
    } else {
      const { data } = await supabase.from('exams').select('*');
      exam_list = data || [];
    }

    counts.exams = exam_list.length;

    // Topics and strategies per exam type
    const examTopics: Record<string, string[]> = {
      'Chemistry': ['Stoichiometry', 'Thermodynamics', 'Kinetics', 'Equilibrium', 'Acids & Bases', 'Electrochemistry', 'Organic Chem', 'Atomic Structure', 'Bonding', 'States of Matter', 'Solutions', 'Nuclear'],
      'CAT': ['Number Systems', 'Algebra', 'Geometry', 'Mensuration', 'Permutations', 'Probability', 'Data Interpretation', 'Logical Reasoning', 'Verbal Ability', 'Reading Comprehension', 'Para Jumbles', 'Grammar'],
      'Marketing': ['Segmentation', 'Positioning', 'Pricing Strategy', 'Channel Management', 'Consumer Behavior', 'Brand Management', 'Digital Marketing', 'Market Research', 'Product Development', 'Advertising', 'Sales Management', 'CRM'],
    };

    const coreStrategies = ['Breakdown & Reframe', 'Elimination', 'Unit Analysis', 'Formula Recall', 'Graph/Trend', 'Edge-case Check', 'Plug-and-Chug'];
    const chemStrategies = ['Stoichiometry', 'Acid-Base', 'Thermodynamics', 'Electrochemistry', 'Organic Patterns'];
    const marketingStrategies = ['Segmentation', 'Funnel Math', 'A/B Testing', 'Attribution', 'CAC/LTV', 'Cohorts'];

    function beta(a: number, b: number): number {
      const u1 = Math.random(), u2 = Math.random();
      const v1 = Math.pow(u1, 1/a);
      const v2 = Math.pow(u2, 1/b);
      return v1 / (v1 + v2);
    }

    function clamp(val: number, min: number, max: number): number {
      return Math.max(min, Math.min(max, val));
    }

    function randomChoice<T>(arr: T[]): T {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    // Generate items for each exam
    for (const exam of exam_list) {
      const examType = exam.name.includes('Chemistry') ? 'Chemistry' : 
                       exam.name.includes('Marketing') ? 'Marketing' : 'CAT';
      const topics = examTopics[examType] || examTopics['CAT'];
      const strategies = examType === 'Chemistry' ? [...coreStrategies, ...chemStrategies] :
                        examType === 'Marketing' ? [...coreStrategies, ...marketingStrategies] :
                        coreStrategies;

      // Generate 400 calibration items
      const calibration_items = [];
      for (let i = 0; i < 400; i++) {
        const topic = randomChoice(topics);
        const difficulty = clamp(beta(2, 2), 0.1, 0.9);
        const strategy_tags = [randomChoice(strategies), ...(Math.random() > 0.5 ? [randomChoice(strategies)] : [])];
        
        calibration_items.push({
          exam_id: exam.id,
          stem: `Calibration question ${i+1} for ${topic} in ${exam.name}`,
          choices: JSON.stringify({ A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }),
          correct_key: randomChoice(['A', 'B', 'C', 'D']),
          difficulty_0_1: difficulty,
          topic,
          unit: `Unit ${Math.floor(i / 40) + 1}`,
          strategy_tags,
          is_synthetic: true,
        });
      }

      // Insert in chunks of 100
      for (let i = 0; i < calibration_items.length; i += 100) {
        const chunk = calibration_items.slice(i, i + 100);
        const { error } = await supabase.from('calibration_items').insert(chunk);
        if (error) console.error('Error inserting calibration items:', error);
        else counts.calibration_items += chunk.length;
      }

      // Generate 1200 practice items
      const practice_items = [];
      for (let i = 0; i < 1200; i++) {
        const topic = randomChoice(topics);
        const difficulty = clamp(beta(2, 2), 0.1, 0.9);
        const strategy_tags = [randomChoice(strategies), ...(Math.random() > 0.5 ? [randomChoice(strategies)] : [])];
        
        practice_items.push({
          exam_id: exam.id,
          stem: `Practice question ${i+1} for ${topic} in ${exam.name}`,
          choices: JSON.stringify({ A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }),
          correct_answer: randomChoice(['A', 'B', 'C', 'D']),
          difficulty: Math.round(difficulty * 5) || 3,
          difficulty_0_1: difficulty,
          tags: [topic],
          topic,
          unit: `Unit ${Math.floor(i / 120) + 1}`,
          strategy_tags,
          is_synthetic: true,
        });
      }

      // Insert in chunks of 100
      for (let i = 0; i < practice_items.length; i += 100) {
        const chunk = practice_items.slice(i, i + 100);
        const { error } = await supabase.from('practice_items').insert(chunk);
        if (error) console.error('Error inserting practice items:', error);
        else counts.practice_items += chunk.length;
      }
    }

    // Generate synthetic users
    const users = [];
    for (let i = 0; i < users_count; i++) {
      const theta = Math.random() * 2 - 1; // ability: -1 to 1
      const speed_factor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
      const conf_bias = (Math.random() - 0.5) * 0.3; // -0.15 to 0.15

      const userId = crypto.randomUUID();
      const email = `synth_user_${i}@example.com`;
      const name = `Synthetic User ${i}`;
      
      users.push({
        id: userId,
        email,
        name,
        exam_type: randomChoice(exam_list).name.split(' ')[0],
        is_synthetic: true,
        metadata: { theta, speed_factor, conf_bias },
      });
    }

    // Insert users in chunks
    for (let i = 0; i < users.length; i += 100) {
      const chunk = users.slice(i, i + 100);
      const profileChunk = chunk.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        exam_type: u.exam_type,
        is_synthetic: u.is_synthetic,
      }));
      
      const { error } = await supabase.from('profiles').insert(profileChunk);
      if (error) console.error('Error inserting profiles:', error);
      else counts.users += profileChunk.length;
    }

    // Enroll users in exams
    const enrollments = [];
    for (const user of users) {
      const exam_id = randomChoice(exam_list).id;
      enrollments.push({
        user_id: user.id,
        exam_id,
        is_active: true,
      });
    }

    for (let i = 0; i < enrollments.length; i += 100) {
      const chunk = enrollments.slice(i, i + 100);
      const { error } = await supabase.from('user_exam_enrollments').upsert(chunk);
      if (error) console.error('Error inserting enrollments:', error);
      else counts.enrollments += chunk.length;
    }

    console.log('Completed item and user generation:', counts);

    return new Response(JSON.stringify({ success: true, counts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in seed-synthetic-data:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});