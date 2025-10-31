import { AIFItem } from "@/types/ItemSchema";

export function validateItemSchema(item: any): AIFItem {
  const errors: string[] = [];

  if (!item || typeof item !== 'object') {
    throw new Error('Item must be an object');
  }

  if (!item.exam_id || typeof item.exam_id !== 'string') {
    errors.push('exam_id must be a non-empty string');
  }

  if (!item.section || typeof item.section !== 'string') {
    errors.push('section must be a non-empty string');
  }

  if (!Array.isArray(item.concept_tags) || item.concept_tags.length === 0) {
    errors.push('concept_tags must be a non-empty array');
  }

  if (!item.stem || typeof item.stem !== 'string' || item.stem.length > 800) {
    errors.push('stem must be a non-empty string under 800 characters');
  }

  if (!Array.isArray(item.options) || item.options.length !== 4) {
    errors.push('options must be an array of exactly 4 strings');
  }

  if (typeof item.correct_index !== 'number' || item.correct_index < 0 || item.correct_index > 3) {
    errors.push('correct_index must be a number between 0 and 3');
  }

  if (!item.explanation || typeof item.explanation !== 'string' || item.explanation.length > 800) {
    errors.push('explanation must be a non-empty string under 800 characters');
  }

  if (item.required_strategy && !['elimination', 'equation_setup', 'diagram'].includes(item.required_strategy)) {
    errors.push('required_strategy must be "elimination", "equation_setup", "diagram", or null');
  }

  if (typeof item.difficulty_seed_0_1 !== 'number' || item.difficulty_seed_0_1 < 0 || item.difficulty_seed_0_1 > 1) {
    errors.push('difficulty_seed_0_1 must be a number between 0 and 1');
  }

  if (typeof item.reading_len !== 'number' || item.reading_len < 0) {
    errors.push('reading_len must be a non-negative number');
  }

  if (errors.length > 0) {
    throw new Error(`Item validation failed:\n${errors.join('\n')}`);
  }

  return item as AIFItem;
}
