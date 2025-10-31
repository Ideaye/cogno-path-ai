export type AIFItem = {
  exam_id: string;               // uuid
  section: string;               // e.g., "QA"
  concept_tags: string[];        // ["algebra","simultaneous_equations"]
  stem: string;                  // question text
  options: string[];             // length 4
  correct_index: number;         // 0..3
  explanation: string;           // step-by-step
  required_strategy?: "elimination"|"equation_setup"|"diagram"|null;
  difficulty_seed_0_1: number;   // 0..1
  reading_len: number;           // chars count
  metadata?: Record<string, any>;
};
