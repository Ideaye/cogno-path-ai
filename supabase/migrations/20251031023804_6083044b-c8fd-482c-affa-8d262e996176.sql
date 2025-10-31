-- CDNA Fix Patch v0.4.1: UI/Worker Hardening

-- 1) RPC for latest JQS by exam
CREATE OR REPLACE FUNCTION public.get_last_jqs_for_user_exam(p_user uuid, p_exam uuid)
RETURNS TABLE(jqs_0_1 double precision, created_at timestamp with time zone)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ea.jqs_0_1, ea.created_at
  FROM eval_adjudications ea
  JOIN user_justifications uj ON uj.id = ea.justification_id
  JOIN train_ai_items tai ON tai.id = uj.train_ai_item_id
  JOIN train_ai_sessions tas ON tas.id = tai.session_id
  JOIN user_exam_enrollments uee ON uee.user_id = tas.user_id AND uee.exam_id = p_exam
  WHERE tas.user_id = p_user
  ORDER BY ea.created_at DESC
  LIMIT 1
$$;

-- 2) One-per-item justification constraint
ALTER TABLE public.user_justifications 
ADD CONSTRAINT user_justifications_train_ai_item_id_key UNIQUE (train_ai_item_id);

-- 3) Queue idempotency constraint
ALTER TABLE public.llm_eval_queue 
ADD CONSTRAINT llm_eval_queue_justification_id_key UNIQUE (justification_id);

-- 4) Audit fallback RPC for cron runs
CREATE OR REPLACE FUNCTION public.get_recent_cron_runs()
RETURNS TABLE(
  runid bigint,
  jobid bigint,
  job_name text,
  status text,
  return_message text,
  start_time timestamp with time zone,
  end_time timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    jrd.runid,
    jrd.jobid,
    jrd.job_name,
    jrd.status,
    jrd.return_message,
    jrd.start_time,
    jrd.end_time
  FROM cron.job_run_details jrd
  ORDER BY jrd.start_time DESC
  LIMIT 5;
EXCEPTION
  WHEN OTHERS THEN
    -- If cron schema not accessible, return empty
    RETURN;
END;
$$;