-- Create concepts table for hierarchical concept tracking
CREATE TABLE public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create junction table for question-concept many-to-many relationship
CREATE TABLE public.question_bank_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.concepts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(question_id, concept_id)
);

-- Create feature snapshots table for daily user metrics
CREATE TABLE public.feature_user_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  acc_ema_short FLOAT DEFAULT 0.5,
  acc_ema_long FLOAT DEFAULT 0.5,
  latency_ema_short FLOAT DEFAULT 15.0,
  latency_ema_long FLOAT DEFAULT 15.0,
  miscalibration_ema FLOAT DEFAULT 0.2,
  skip_rate_win20 FLOAT DEFAULT 0.0,
  fatigue_index FLOAT DEFAULT 0.0,
  pressure_sensitivity FLOAT DEFAULT 0.0,
  switch_cost FLOAT DEFAULT 0.0,
  mastery_vector JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, snapshot_date)
);

-- Create policy logs table for bandit decisions and rewards
CREATE TABLE public.policy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  context_json JSONB NOT NULL,
  action_json JSONB NOT NULL,
  chosen_question_id UUID REFERENCES public.question_bank(id) ON DELETE SET NULL,
  propensity FLOAT DEFAULT 1.0,
  reward FLOAT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_user_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_logs ENABLE ROW LEVEL SECURITY;

-- Concepts policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view concepts"
  ON public.concepts FOR SELECT
  TO authenticated
  USING (true);

-- Question-concept mapping policies (read-only for authenticated users)
CREATE POLICY "Authenticated users can view question concepts"
  ON public.question_bank_concepts FOR SELECT
  TO authenticated
  USING (true);

-- Feature snapshots policies
CREATE POLICY "Users can view their own feature snapshots"
  ON public.feature_user_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature snapshots"
  ON public.feature_user_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy logs policies
CREATE POLICY "Users can view their own policy logs"
  ON public.policy_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policy logs"
  ON public.policy_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Insert sample concepts
INSERT INTO public.concepts (name, parent_id) VALUES
('Mathematics', NULL),
('Algebra', (SELECT id FROM public.concepts WHERE name = 'Mathematics')),
('Geometry', (SELECT id FROM public.concepts WHERE name = 'Mathematics')),
('Arithmetic', (SELECT id FROM public.concepts WHERE name = 'Mathematics')),
('Number Theory', (SELECT id FROM public.concepts WHERE name = 'Mathematics')),
('Pattern Recognition', NULL),
('Speed & Distance', (SELECT id FROM public.concepts WHERE name = 'Mathematics')),
('Percentages', (SELECT id FROM public.concepts WHERE name = 'Mathematics')),
('Exponents', (SELECT id FROM public.concepts WHERE name = 'Mathematics'));

-- Link existing questions to concepts
INSERT INTO public.question_bank_concepts (question_id, concept_id)
SELECT q.id, c.id
FROM public.question_bank q
JOIN public.concepts c ON c.name = q.concept_tag;