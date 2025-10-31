-- Create exams table
CREATE TABLE IF NOT EXISTS public.exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  alias TEXT[],
  level TEXT,
  duration_min INTEGER,
  negative_marking_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_sections table
CREATE TABLE IF NOT EXISTS public.exam_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  weight DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exam_presets table
CREATE TABLE IF NOT EXISTS public.exam_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  calibration_preset_json JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_exam_enrollments table
CREATE TABLE IF NOT EXISTS public.user_exam_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exam_id)
);

-- Create per-exam feature snapshots table
CREATE TABLE IF NOT EXISTS public.feature_user_exam_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  acc_ema_short DOUBLE PRECISION DEFAULT 0.5,
  acc_ema_long DOUBLE PRECISION DEFAULT 0.5,
  latency_ema_short DOUBLE PRECISION DEFAULT 15.0,
  latency_ema_long DOUBLE PRECISION DEFAULT 15.0,
  miscalibration_ema DOUBLE PRECISION DEFAULT 0.2,
  fatigue_index DOUBLE PRECISION DEFAULT 0.0,
  pressure_sensitivity DOUBLE PRECISION DEFAULT 0.0,
  switch_cost DOUBLE PRECISION DEFAULT 0.0,
  strategy_strengths_json JSONB DEFAULT '{}'::JSONB,
  mastery_vector JSONB DEFAULT '{}'::JSONB,
  cdna_embed DOUBLE PRECISION[],
  calibration_progress_0_1 DOUBLE PRECISION DEFAULT 0.0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exam_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_user_exam_daily ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exams (readable by all authenticated users)
CREATE POLICY "Authenticated users can view exams"
ON public.exams FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for exam_sections
CREATE POLICY "Authenticated users can view exam sections"
ON public.exam_sections FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for exam_presets
CREATE POLICY "Authenticated users can view exam presets"
ON public.exam_presets FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for user_exam_enrollments
CREATE POLICY "Users can view their own enrollments"
ON public.user_exam_enrollments FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enrollments"
ON public.user_exam_enrollments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
ON public.user_exam_enrollments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enrollments"
ON public.user_exam_enrollments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS Policies for feature_user_exam_daily
CREATE POLICY "Users can view their own exam features"
ON public.feature_user_exam_daily FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own exam features"
ON public.feature_user_exam_daily FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exam features"
ON public.feature_user_exam_daily FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Seed exam data
INSERT INTO public.exams (name, alias, level, duration_min) VALUES
  ('JEE Main', ARRAY['AIEEE'], 'UG', 180),
  ('JEE Advanced', ARRAY[]::TEXT[], 'UG', 180),
  ('AP EAMCET (Engg)', ARRAY['EAMCET-AP'], 'UG', 180),
  ('TS EAMCET (Engg)', ARRAY[]::TEXT[], 'UG', 180),
  ('CAT', ARRAY[]::TEXT[], 'PG', 120),
  ('UPSC CSE (Prelims)', ARRAY['IAS'], 'Govt', 120)
ON CONFLICT DO NOTHING;

-- Seed exam sections (using subqueries to get exam IDs)
INSERT INTO public.exam_sections (exam_id, name, order_index) VALUES
  ((SELECT id FROM public.exams WHERE name = 'JEE Main' LIMIT 1), 'Physics', 1),
  ((SELECT id FROM public.exams WHERE name = 'JEE Main' LIMIT 1), 'Chemistry', 2),
  ((SELECT id FROM public.exams WHERE name = 'JEE Main' LIMIT 1), 'Mathematics', 3),
  ((SELECT id FROM public.exams WHERE name = 'JEE Advanced' LIMIT 1), 'Physics', 1),
  ((SELECT id FROM public.exams WHERE name = 'JEE Advanced' LIMIT 1), 'Chemistry', 2),
  ((SELECT id FROM public.exams WHERE name = 'JEE Advanced' LIMIT 1), 'Mathematics', 3),
  ((SELECT id FROM public.exams WHERE name = 'AP EAMCET (Engg)' LIMIT 1), 'Mathematics', 1),
  ((SELECT id FROM public.exams WHERE name = 'AP EAMCET (Engg)' LIMIT 1), 'Physics', 2),
  ((SELECT id FROM public.exams WHERE name = 'AP EAMCET (Engg)' LIMIT 1), 'Chemistry', 3),
  ((SELECT id FROM public.exams WHERE name = 'TS EAMCET (Engg)' LIMIT 1), 'Mathematics', 1),
  ((SELECT id FROM public.exams WHERE name = 'TS EAMCET (Engg)' LIMIT 1), 'Physics', 2),
  ((SELECT id FROM public.exams WHERE name = 'TS EAMCET (Engg)' LIMIT 1), 'Chemistry', 3),
  ((SELECT id FROM public.exams WHERE name = 'CAT' LIMIT 1), 'VARC', 1),
  ((SELECT id FROM public.exams WHERE name = 'CAT' LIMIT 1), 'DILR', 2),
  ((SELECT id FROM public.exams WHERE name = 'CAT' LIMIT 1), 'QA', 3),
  ((SELECT id FROM public.exams WHERE name = 'UPSC CSE (Prelims)' LIMIT 1), 'GS Paper I', 1),
  ((SELECT id FROM public.exams WHERE name = 'UPSC CSE (Prelims)' LIMIT 1), 'CSAT', 2)
ON CONFLICT DO NOTHING;

-- Seed exam presets
INSERT INTO public.exam_presets (exam_id, calibration_preset_json) VALUES
  (
    (SELECT id FROM public.exams WHERE name = 'CAT' LIMIT 1),
    '{"baseline":{"total":8,"mix":{"QA":3,"DILR":3,"VARC":2}},"strategy_block":{"total":24,"mix":{"QA":8,"DILR":8,"VARC":8}},"pressure":{"total":6,"mix":{"balanced":true}},"drills":{"total":8,"constraints":["elimination","equation_setup","diagram"]}}'::JSONB
  ),
  (
    (SELECT id FROM public.exams WHERE name = 'JEE Main' LIMIT 1),
    '{"baseline":{"total":8,"mix":{"Physics":3,"Chemistry":2,"Mathematics":3}},"strategy_block":{"total":24,"mix":{"Physics":8,"Chemistry":8,"Mathematics":8}},"pressure":{"total":6,"mix":{"balanced":true}},"drills":{"total":8,"constraints":["estimation","diagram","casework"]}}'::JSONB
  ),
  (
    (SELECT id FROM public.exams WHERE name = 'AP EAMCET (Engg)' LIMIT 1),
    '{"baseline":{"total":8,"mix":{"Mathematics":4,"Physics":2,"Chemistry":2}},"strategy_block":{"total":24,"mix":{"Mathematics":12,"Physics":6,"Chemistry":6}},"pressure":{"total":6,"mix":{"balanced":true}},"drills":{"total":8,"constraints":["ratio_proportion","equation_setup","elimination"]}}'::JSONB
  ),
  (
    (SELECT id FROM public.exams WHERE name = 'UPSC CSE (Prelims)' LIMIT 1),
    '{"baseline":{"total":8,"mix":{"GS Paper I":6,"CSAT":2}},"strategy_block":{"total":24,"mix":{"GS Paper I":12,"CSAT":12}},"pressure":{"total":6,"mix":{"balanced":true}},"drills":{"total":8,"constraints":["inference","elimination","data_table"]}}'::JSONB
  )
ON CONFLICT DO NOTHING;