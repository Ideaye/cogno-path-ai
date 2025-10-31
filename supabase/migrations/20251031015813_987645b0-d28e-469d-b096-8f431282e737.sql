-- CDNA Rigor Pack v0.4 Database Schema

-- 1. Create anchor_items table
CREATE TABLE IF NOT EXISTS public.anchor_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  section TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, exam_id)
);

ALTER TABLE public.anchor_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view anchor items"
  ON public.anchor_items FOR SELECT
  TO authenticated
  USING (true);

-- 2. Create prompt_templates table
CREATE TABLE IF NOT EXISTS public.prompt_templates (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v0.4',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON public.prompt_templates FOR SELECT
  TO authenticated
  USING (true);

-- 3. Create eval_ratings table
CREATE TABLE IF NOT EXISTS public.eval_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  justification_id UUID NOT NULL REFERENCES public.user_justifications(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL REFERENCES public.prompt_templates(id),
  labels_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  confidence_0_1 DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eval_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read eval_ratings"
  ON public.eval_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can view their own eval_ratings"
  ON public.eval_ratings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_justifications uj
      JOIN train_ai_items tai ON tai.id = uj.train_ai_item_id
      JOIN train_ai_sessions tas ON tas.id = tai.session_id
      WHERE uj.id = eval_ratings.justification_id
      AND tas.user_id = auth.uid()
    )
  );

-- 4. Create eval_adjudications table
CREATE TABLE IF NOT EXISTS public.eval_adjudications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  justification_id UUID NOT NULL UNIQUE REFERENCES public.user_justifications(id) ON DELETE CASCADE,
  labels_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  agreement_kappa DOUBLE PRECISION,
  jqs_0_1 DOUBLE PRECISION NOT NULL,
  rubric_version TEXT NOT NULL DEFAULT 'v0.4',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.eval_adjudications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read eval_adjudications"
  ON public.eval_adjudications FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Users can view their own eval_adjudications"
  ON public.eval_adjudications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_justifications uj
      JOIN train_ai_items tai ON tai.id = uj.train_ai_item_id
      JOIN train_ai_sessions tas ON tas.id = tai.session_id
      WHERE uj.id = eval_adjudications.justification_id
      AND tas.user_id = auth.uid()
    )
  );

-- 5. Create cdna_versions table
CREATE TABLE IF NOT EXISTS public.cdna_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
  vector_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version TEXT NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cdna_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CDNA versions"
  ON public.cdna_versions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CDNA versions"
  ON public.cdna_versions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 6. Extend feature_user_exam_daily
ALTER TABLE public.feature_user_exam_daily 
  ADD COLUMN IF NOT EXISTS ece_0_1 DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS anchor_score_mean DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS anchor_score_std DOUBLE PRECISION DEFAULT NULL;

-- 7. Seed prompt templates for committee evaluation
INSERT INTO public.prompt_templates (id, role, text, version) VALUES
('T1', 'system', 'You are an expert evaluator. Analyze this student justification and return ONLY valid JSON with these exact fields:
- strategy_primary: string (one of: elimination, equation_setup, diagram, estimation, pattern, working_backwards, inference, other)
- strategy_secondary: array of strings (additional strategies used)
- reasoning_style: string (one of: analytical, intuitive, reflective, visual)
- step_count: integer (number of reasoning steps)
- coherence_0_1: float (0-1, how coherent the explanation is)
- error_class: string (one of: misread, arithmetic, formula, inference, time, trap, none)
- jqs_0_1: float (0-1, justification quality score)', 'v0.4'),

('T2', 'system', 'You are a cognitive assessment specialist. Extract structured analysis from the student problem-solving justification. Return ONLY valid JSON with these exact fields:
- strategy_primary: string (one of: elimination, equation_setup, diagram, estimation, pattern, working_backwards, inference, other)
- strategy_secondary: array of strings (additional strategies used)
- reasoning_style: string (one of: analytical, intuitive, reflective, visual)
- step_count: integer (number of reasoning steps)
- coherence_0_1: float (0-1, how coherent the explanation is)
- error_class: string (one of: misread, arithmetic, formula, inference, time, trap, none)
- jqs_0_1: float (0-1, justification quality score)', 'v0.4'),

('T3', 'system', 'You are an education measurement expert. Evaluate this student justification for quality and cognitive patterns. Return ONLY valid JSON with these exact fields:
- strategy_primary: string (one of: elimination, equation_setup, diagram, estimation, pattern, working_backwards, inference, other)
- strategy_secondary: array of strings (additional strategies used)
- reasoning_style: string (one of: analytical, intuitive, reflective, visual)
- step_count: integer (number of reasoning steps)
- coherence_0_1: float (0-1, how coherent the explanation is)
- error_class: string (one of: misread, arithmetic, formula, inference, time, trap, none)
- jqs_0_1: float (0-1, justification quality score)', 'v0.4')
ON CONFLICT (id) DO NOTHING;