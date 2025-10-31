-- Add new fields to existing tables
ALTER TABLE attempts 
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'practice',
  ADD COLUMN IF NOT EXISTS time_taken_ms integer,
  ADD COLUMN IF NOT EXISTS confidence_0_1 double precision,
  ADD COLUMN IF NOT EXISTS hesitation_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS option_switches integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS revisited boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pressure_mode text,
  ADD COLUMN IF NOT EXISTS ui_variant text;

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS reading_len integer;

ALTER TABLE feature_user_daily
  ADD COLUMN IF NOT EXISTS strategy_strengths_json jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cdna_embed double precision[],
  ADD COLUMN IF NOT EXISTS calibration_progress_0_1 double precision DEFAULT 0.0;

-- Create Calibration Lab tables
CREATE TABLE IF NOT EXISTS train_ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  block text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS train_ai_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES train_ai_sessions(id),
  question_id uuid NOT NULL REFERENCES question_bank(id),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  timer_s integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_justifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  train_ai_item_id uuid NOT NULL REFERENCES train_ai_items(id),
  text text,
  audio_url text,
  strategy_tags text[],
  effort_1_5 integer,
  stress_1_5 integer,
  error_cause text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS llm_eval_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  justification_id uuid NOT NULL REFERENCES user_justifications(id),
  status text NOT NULL DEFAULT 'queued',
  payload_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS llm_eval_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  justification_id uuid NOT NULL REFERENCES user_justifications(id),
  strategy_primary text,
  strategy_secondary text[],
  reasoning_style text,
  step_count integer,
  coherence_0_1 double precision,
  error_class text,
  jqs_0_1 double precision,
  features_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE train_ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE train_ai_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_justifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_eval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_eval_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for train_ai_sessions
CREATE POLICY "Users can view their own training sessions"
  ON train_ai_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training sessions"
  ON train_ai_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training sessions"
  ON train_ai_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for train_ai_items
CREATE POLICY "Users can view their own training items"
  ON train_ai_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM train_ai_sessions 
    WHERE train_ai_sessions.id = train_ai_items.session_id 
    AND train_ai_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own training items"
  ON train_ai_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM train_ai_sessions 
    WHERE train_ai_sessions.id = train_ai_items.session_id 
    AND train_ai_sessions.user_id = auth.uid()
  ));

-- RLS Policies for user_justifications
CREATE POLICY "Users can view their own justifications"
  ON user_justifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM train_ai_items
    JOIN train_ai_sessions ON train_ai_sessions.id = train_ai_items.session_id
    WHERE train_ai_items.id = user_justifications.train_ai_item_id
    AND train_ai_sessions.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own justifications"
  ON user_justifications FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM train_ai_items
    JOIN train_ai_sessions ON train_ai_sessions.id = train_ai_items.session_id
    WHERE train_ai_items.id = user_justifications.train_ai_item_id
    AND train_ai_sessions.user_id = auth.uid()
  ));

-- RLS Policies for llm_eval_queue
CREATE POLICY "Users can view their own eval queue items"
  ON llm_eval_queue FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_justifications
    JOIN train_ai_items ON train_ai_items.id = user_justifications.train_ai_item_id
    JOIN train_ai_sessions ON train_ai_sessions.id = train_ai_items.session_id
    WHERE user_justifications.id = llm_eval_queue.justification_id
    AND train_ai_sessions.user_id = auth.uid()
  ));

-- RLS Policies for llm_eval_results
CREATE POLICY "Users can view their own eval results"
  ON llm_eval_results FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_justifications
    JOIN train_ai_items ON train_ai_items.id = user_justifications.train_ai_item_id
    JOIN train_ai_sessions ON train_ai_sessions.id = train_ai_items.session_id
    WHERE user_justifications.id = llm_eval_results.justification_id
    AND train_ai_sessions.user_id = auth.uid()
  ));