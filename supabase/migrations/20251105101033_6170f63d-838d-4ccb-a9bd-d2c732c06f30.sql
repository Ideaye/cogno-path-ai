-- Synthetic Data Bootstrap Migration (Simplified)
-- Adds is_synthetic flags and basic indexes only

-- Add is_synthetic flags to existing tables
ALTER TABLE practice_items 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

ALTER TABLE calibration_items 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

ALTER TABLE attempts 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

ALTER TABLE user_justifications 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

ALTER TABLE eval_adjudications 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

ALTER TABLE feature_user_exam_daily 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_synthetic BOOLEAN DEFAULT FALSE;

-- Add missing columns to practice_items
ALTER TABLE practice_items 
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS strategy_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty_0_1 NUMERIC(4,3);

-- Add missing columns to calibration_items
ALTER TABLE calibration_items
ADD COLUMN IF NOT EXISTS stem TEXT,
ADD COLUMN IF NOT EXISTS choices JSONB,
ADD COLUMN IF NOT EXISTS correct_key TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS strategy_tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS difficulty_0_1 NUMERIC(4,3);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_attempts_user_created ON attempts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attempts_synthetic ON attempts(is_synthetic) WHERE is_synthetic = TRUE;
CREATE INDEX IF NOT EXISTS idx_feature_snapshot ON feature_user_exam_daily(user_id, exam_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_justifications_item ON user_justifications(train_ai_item_id);
CREATE INDEX IF NOT EXISTS idx_adjudications_just ON eval_adjudications(justification_id);