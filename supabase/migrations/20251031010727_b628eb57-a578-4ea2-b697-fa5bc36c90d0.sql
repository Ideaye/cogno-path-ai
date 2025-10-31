-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qb_difficulty ON question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_qbc_q_c ON question_bank_concepts(question_id, concept_id);
CREATE INDEX IF NOT EXISTS idx_feature_user_exam_daily_lookup ON feature_user_exam_daily(user_id, exam_id, snapshot_date DESC);

-- Add required_strategy column for Block D constraints
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS required_strategy TEXT;
CREATE INDEX IF NOT EXISTS idx_qb_required_strategy ON question_bank(required_strategy) WHERE required_strategy IS NOT NULL;

-- Create RPC function to update calibration progress
CREATE OR REPLACE FUNCTION bump_calibration_progress(justification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_exam UUID;
  v_done INT;
  v_target INT := 24;
BEGIN
  -- Find user and active exam from justification
  SELECT s.user_id, ue.exam_id
  INTO v_user, v_exam
  FROM user_justifications uj
  JOIN train_ai_items i ON i.id = uj.train_ai_item_id
  JOIN train_ai_sessions s ON s.id = i.session_id
  LEFT JOIN user_exam_enrollments ue ON ue.user_id = s.user_id AND ue.is_active = TRUE
  WHERE uj.id = justification_id;

  IF v_user IS NULL THEN
    RETURN;
  END IF;

  -- Count total justified items for this user
  SELECT COUNT(DISTINCT uj.id)
  INTO v_done
  FROM user_justifications uj
  JOIN train_ai_items i ON i.id = uj.train_ai_item_id
  JOIN train_ai_sessions s ON s.id = i.session_id
  WHERE s.user_id = v_user;

  -- Update or insert calibration progress
  INSERT INTO feature_user_exam_daily(user_id, exam_id, snapshot_date, calibration_progress_0_1)
  VALUES (v_user, v_exam, CURRENT_DATE, LEAST(1.0, v_done::FLOAT / v_target))
  ON CONFLICT (user_id, exam_id, snapshot_date)
  DO UPDATE SET calibration_progress_0_1 = LEAST(1.0, v_done::FLOAT / v_target);
END;
$$;