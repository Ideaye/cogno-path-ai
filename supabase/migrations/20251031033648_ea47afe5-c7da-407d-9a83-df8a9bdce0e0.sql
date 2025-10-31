-- Abhyas Scaffold: profiles, reports, indexes, RLS, RPCs (fixed)

-- 1. profiles columns
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS cognitive_profile jsonb DEFAULT '{}'::jsonb;

-- 2. admin seed
UPDATE public.profiles
SET is_admin = true
WHERE email = 'pranav.n@ideaye.in';

-- 3. calibration_reports table
CREATE TABLE IF NOT EXISTS public.calibration_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('weekly','calibration')),
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. helpful indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON public.attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_user_exam_daily_user_exam_date ON public.feature_user_exam_daily(user_id, exam_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_cdna_versions_user_exam_created ON public.cdna_versions(user_id, exam_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calibration_reports_user_type_created ON public.calibration_reports(user_id, report_type, created_at DESC);

-- 5. RLS for calibration_reports
ALTER TABLE IF EXISTS public.calibration_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS calibration_reports_owner_read ON public.calibration_reports;
CREATE POLICY calibration_reports_owner_read
ON public.calibration_reports FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

DROP POLICY IF EXISTS calibration_reports_owner_write ON public.calibration_reports;
CREATE POLICY calibration_reports_owner_write
ON public.calibration_reports FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- 6. Drop and recreate get_recent_cron_runs with correct signature
DROP FUNCTION IF EXISTS public.get_recent_cron_runs();
CREATE FUNCTION public.get_recent_cron_runs()
RETURNS TABLE (jobname text, start_time timestamptz, end_time timestamptz, status text)
LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  SELECT j.jobname, d.start_time, d.end_time, d.status
  FROM cron.job_run_details d
  JOIN cron.job j ON j.jobid = d.jobid
  ORDER BY d.start_time DESC
  LIMIT 25;
$$;