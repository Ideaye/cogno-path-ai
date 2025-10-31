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
