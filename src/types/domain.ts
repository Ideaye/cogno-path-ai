export type ExamRef = { exam_id: string; name: string };
export type DateRange = { from: string; to: string }; // ISO
export type ActionItem = { 
  id: string; 
  label: string; 
  minutes: number; 
  severity: 'high' | 'med' | 'low'; 
  cta?: () => void 
};

export type Stats = {
  totalPractice: number; 
  accuracy: number; 
  streak: number;
  ece?: number | null; 
  anchorMean?: number | null; 
  anchorStd?: number | null;
  cdnaVersion?: string | null; 
  cdnaSource?: 'shadow' | 'live' | null;
};

export type ResourcesUsed = {
  calculator: boolean;
  notes: boolean;
  external_link: string | null;
};

export type CalibrationPayload = {
  exam_id: string;
  train_ai_item_id?: string | null;
  final_answer: string;
  justification: string;
  confidence_0_1: number;
  strategy_tags: string[];
  assumptions: string;
  checks: string;
  resources: ResourcesUsed;
  difficulty: number;
  latency_ms: number;
  is_correct: boolean | null;
};
