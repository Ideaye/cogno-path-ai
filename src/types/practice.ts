export type ItemType = 'MCQ' | 'FREE_RESPONSE';

export type Option = { key: string; text: string };

export type PracticeItem = {
  item_id: string;
  exam_id: string;
  type: ItemType;
  stem_md: string;
  options?: Option[] | null;
  correct_key?: string | null;
  concept_tags: string[];
};

export type Explanation = {
  short_justification_md: string;
  solution_steps_md?: string | null;
  why_others_wrong_md?: string | null;
  misconception_tags: string[];
};

export type AttemptInsert = {
  user_id: string;
  question_id: string;
  exam_id: string;
  final_answer?: string | null;
  correct?: boolean | null;
  time_taken_ms: number;
  time_taken?: number;
  latency_ms?: number | null;
  confidence_0_1?: number | null;
  mode?: string;
};

export type AttemptRow = { 
  id: string; 
  correct: boolean | null; 
  created_at: string;
};

export type NextQuestionRequest = { 
  user_id: string; 
  mode: 'practice' 
};

export type NextQuestionResponse = { 
  question: any;
  style?: string;
  timebox?: string;
};

export type RewardRequest = { 
  attempt_id: string;
};

export type ExplanationRequest = { 
  item_id: string; 
  choice_key?: string | null;
};
