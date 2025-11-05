
-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('CAT', 'GRE', 'UPSC', 'NEET')),
  cognitive_profile JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create question bank table
CREATE TABLE public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option TEXT NOT NULL,
  difficulty FLOAT DEFAULT 0.5 CHECK (difficulty >= 0 AND difficulty <= 1),
  concept_tag TEXT NOT NULL,
  format_type TEXT DEFAULT 'multiple_choice',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create diagnostic results table
CREATE TABLE public.diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  time_taken FLOAT NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  correct BOOLEAN NOT NULL,
  revisit_count INTEGER DEFAULT 0,
  hesitation_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create attempts table for practice sessions
CREATE TABLE public.attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.question_bank(id) ON DELETE CASCADE,
  attempt_number INTEGER DEFAULT 1,
  time_taken FLOAT NOT NULL,
  correct BOOLEAN NOT NULL,
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create learning paths table
CREATE TABLE public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  path_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Question bank policies (public read for all authenticated users)
CREATE POLICY "Authenticated users can view questions"
  ON public.question_bank FOR SELECT
  TO authenticated
  USING (true);

-- Diagnostic results policies
CREATE POLICY "Users can view their own diagnostic results"
  ON public.diagnostic_results FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own diagnostic results"
  ON public.diagnostic_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Attempts policies
CREATE POLICY "Users can view their own attempts"
  ON public.attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attempts"
  ON public.attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Learning paths policies
CREATE POLICY "Users can view their own learning path"
  ON public.learning_paths FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own learning path"
  ON public.learning_paths FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning path"
  ON public.learning_paths FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to handle new user signups
-- UPDATED: Now enrolls user in their chosen course
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_exam_id UUID;
BEGIN
  -- Step 1: Create the user's profile
  INSERT INTO public.profiles (id, name, email, exam_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'exam_type', 'CAT')
  );

  -- Step 2: Check if an active_exam_id was provided during signup
  v_exam_id := (new.raw_user_meta_data->>'active_exam_id')::UUID;

  -- Step 3: If an exam was chosen, enroll the user and set it to active
  IF v_exam_id IS NOT NULL THEN
    INSERT INTO public.user_exam_enrollments(user_id, exam_id, is_active)
    VALUES (new.id, v_exam_id, true)
    ON CONFLICT (user_id, exam_id) 
    DO UPDATE SET is_active = true;
  END IF;

  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample questions for diagnostic test
-- ... (sample data remains the same)
