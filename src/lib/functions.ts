import { supabase } from '@/integrations/supabase/client';
import type { 
  NextQuestionRequest, 
  NextQuestionResponse, 
  AttemptInsert, 
  AttemptRow,
  RewardRequest,
  ExplanationRequest,
  Explanation
} from '@/types/practice';

export async function invokeAdaptiveSelectNext(req: NextQuestionRequest): Promise<NextQuestionResponse> {
  const { data, error } = await supabase.functions.invoke('adaptive-select-next', {
    body: req
  });

  if (error) throw error;
  if (!data) throw new Error('No data returned from adaptive-select-next');

  return data;
}

export async function insertAttempt(body: AttemptInsert): Promise<AttemptRow> {
  const { data, error} = await supabase
    .from('attempts')
    .insert([body as any])
    .select('id, correct, created_at')
    .single();

  if (error) throw error;
  if (!data) throw new Error('No data returned from attempt insert');

  return data;
}

export async function invokeRecordReward(req: RewardRequest): Promise<{ ok: boolean }> {
  const { data, error } = await supabase.functions.invoke('record-reward', {
    body: req
  });

  if (error) {
    console.error('Record reward error:', error);
    return { ok: false };
  }

  return { ok: true };
}

export async function invokeFetchExplanation(req: ExplanationRequest): Promise<Explanation> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-explanation', {
      body: req
    });

    if (error) throw error;
    if (!data) throw new Error('No explanation data returned');

    return data;
  } catch (error) {
    console.error('Fetch explanation error:', error);
    // Return default explanation if function doesn't exist yet
    return {
      short_justification_md: 'Explanation generation is currently unavailable.',
      solution_steps_md: null,
      why_others_wrong_md: null,
      misconception_tags: []
    };
  }
}
