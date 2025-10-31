-- Ensure profiles table has required columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'profiles' 
                 AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
END $$;

-- Set admin user
UPDATE public.profiles
SET is_admin = true
WHERE email = 'pranav.n@ideaye.in';

-- Ensure calibration_reports table exists
CREATE TABLE IF NOT EXISTS public.calibration_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('weekly', 'calibration')),
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_calibration_reports_user_type_created 
  ON public.calibration_reports(user_id, report_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attempts_user_created 
  ON public.attempts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_user_exam_daily_lookup 
  ON public.feature_user_exam_daily(user_id, exam_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_cdna_versions_lookup 
  ON public.cdna_versions(user_id, exam_id, created_at DESC);

-- RLS for calibration_reports
ALTER TABLE public.calibration_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calibration_reports_owner_read ON public.calibration_reports;
CREATE POLICY calibration_reports_owner_read
  ON public.calibration_reports FOR SELECT
  USING (
    user_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

DROP POLICY IF EXISTS calibration_reports_owner_write ON public.calibration_reports;
CREATE POLICY calibration_reports_owner_write
  ON public.calibration_reports FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.is_admin = true
    )
  );

-- RPC function for getting last JQS (if not exists)
CREATE OR REPLACE FUNCTION public.get_last_jqs_for_user_exam(p_user uuid, p_exam uuid)
RETURNS TABLE (jqs_0_1 numeric, created_at timestamptz)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ea.jqs_0_1, ea.created_at
  FROM public.eval_adjudications ea
  JOIN public.user_justifications uj ON uj.id = ea.justification_id
  JOIN public.train_ai_items ti ON ti.id = uj.train_ai_item_id
  JOIN public.train_ai_sessions ts ON ts.id = ti.session_id
  WHERE ts.user_id = p_user
  ORDER BY ea.created_at DESC
  LIMIT 1;
$$;