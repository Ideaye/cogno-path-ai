-- 0) Create strategy_tags table
CREATE TABLE IF NOT EXISTS public.strategy_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategy_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view strategy tags"
ON public.strategy_tags FOR SELECT
USING (true);

-- Seed strategy tags
INSERT INTO public.strategy_tags (name) VALUES
  ('Estimation'),
  ('Unit Analysis'),
  ('First Principles'),
  ('Elimination'),
  ('Recall Fact'),
  ('Case Breakdown'),
  ('Revenue Math'),
  ('Funnel Math'),
  ('Time-Series'),
  ('Cohort'),
  ('Segmentation'),
  ('A/B Reasoning'),
  ('Heuristic')
ON CONFLICT (name) DO NOTHING;

-- 1) Add new columns to user_justifications
ALTER TABLE public.user_justifications
  ADD COLUMN IF NOT EXISTS assumptions_text TEXT,
  ADD COLUMN IF NOT EXISTS checks_units TEXT,
  ADD COLUMN IF NOT EXISTS resources_used JSONB DEFAULT '{"type":"none","details":null}'::jsonb,
  ADD COLUMN IF NOT EXISTS perceived_difficulty_1_5 INTEGER CHECK (perceived_difficulty_1_5 BETWEEN 1 AND 5);

-- 2) Create marketing preview exam (admin-only)
INSERT INTO public.exams (id, name, alias, level, duration_min, is_admin_only)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Marketing (Preview)',
  ARRAY['marketing-preview'],
  'Intermediate',
  120,
  true
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_admin_only = EXCLUDED.is_admin_only;

-- Create marketing section
INSERT INTO public.exam_sections (exam_id, name, weight, order_index)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Marketing Analytics',
  1.0,
  1
)
ON CONFLICT DO NOTHING;

-- 3) Seed realistic marketing questions
INSERT INTO public.question_bank (id, text, options, correct_option, concept_tag, difficulty, format_type, source, quality_score, reading_len) VALUES
(
  gen_random_uuid(),
  'A company allocates a ₹10,00,000 budget across Meta (60%) and Google (40%). If Meta CPA is ₹500 and Google CPA is ₹700, what is the expected total number of leads?',
  '{"A": "1,771", "B": "2,000", "C": "1,771", "D": "1,629"}'::jsonb,
  'C',
  'budget-allocation',
  0.4,
  'multiple_choice',
  'seed',
  0.9,
  50
),
(
  gen_random_uuid(),
  'If a campaign has a CTR of 1.5% and CPC of ₹12, what is the estimated CPM (cost per 1000 impressions)?',
  '{"A": "₹180", "B": "₹800", "C": "₹180", "D": "₹120"}'::jsonb,
  'C',
  'cpm-calculation',
  0.35,
  'multiple_choice',
  'seed',
  0.9,
  40
),
(
  gen_random_uuid(),
  'A funnel has 10,000 impressions, 2% CTR, and 5% conversion rate from click to purchase. How many purchases occur?',
  '{"A": "10", "B": "50", "C": "10", "D": "100"}'::jsonb,
  'A',
  'funnel-analysis',
  0.45,
  'multiple_choice',
  'seed',
  0.9,
  45
),
(
  gen_random_uuid(),
  'An A/B test shows Variant A with 180 conversions from 3000 users (6%) and Variant B with 240 conversions from 4000 users (6%). What is the correct interpretation?',
  '{"A": "B is significantly better", "B": "A is significantly better", "C": "No significant difference", "D": "Insufficient data"}'::jsonb,
  'C',
  'ab-testing',
  0.55,
  'multiple_choice',
  'seed',
  0.9,
  60
),
(
  gen_random_uuid(),
  'A cohort of 1000 users from January shows 20% MoM retention in Feb, 15% in March (of original cohort). What is cumulative retention by March?',
  '{"A": "15%", "B": "35%", "C": "15%", "D": "17.5%"}'::jsonb,
  'A',
  'cohort-retention',
  0.5,
  'multiple_choice',
  'seed',
  0.9,
  55
),
(
  gen_random_uuid(),
  'A SaaS product has 500 monthly subscribers at ₹1000/month with 5% monthly churn. What is the approximate LTV (customer lifetime value) if discount rate is ignored?',
  '{"A": "₹20,000", "B": "₹10,000", "C": "₹20,000", "D": "₹15,000"}'::jsonb,
  'A',
  'ltv-calculation',
  0.6,
  'multiple_choice',
  'seed',
  0.9,
  50
),
(
  gen_random_uuid(),
  'If ROAS (Return on Ad Spend) target is 4:1 and revenue per conversion is ₹2000, what is the maximum allowable CPA?',
  '{"A": "₹500", "B": "₹800", "C": "₹500", "D": "₹400"}'::jsonb,
  'A',
  'roas-cpa',
  0.4,
  'multiple_choice',
  'seed',
  0.9,
  45
),
(
  gen_random_uuid(),
  'A campaign runs for 30 days with daily budget ₹5000 and achieves 1500 conversions. What is the average CPA?',
  '{"A": "₹100", "B": "₹150", "C": "₹100", "D": "₹50"}'::jsonb,
  'A',
  'cpa-simple',
  0.3,
  'multiple_choice',
  'seed',
  0.9,
  35
);

-- 4) Performance indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON public.attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feat_user_exam_date ON public.feature_user_exam_daily(user_id, exam_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_justifs_train_item ON public.user_justifications(train_ai_item_id);
CREATE INDEX IF NOT EXISTS idx_justifs_user_exam ON public.user_justifications(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_active ON public.user_exam_enrollments(user_id, is_active);

-- 5) Create audit_logs table for admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_created ON public.audit_logs(admin_user_id, created_at DESC);

-- 6) Create calibration_sessions table for state persistence
CREATE TABLE IF NOT EXISTS public.calibration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  exam_id UUID NOT NULL REFERENCES public.exams(id),
  block TEXT NOT NULL,
  current_item_id UUID,
  timer_remaining_s INTEGER,
  session_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calibration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calibration sessions"
ON public.calibration_sessions FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_calib_sessions_user ON public.calibration_sessions(user_id, updated_at DESC);