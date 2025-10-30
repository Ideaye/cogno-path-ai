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
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, exam_type)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'exam_type', 'CAT')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample questions for diagnostic test
INSERT INTO public.question_bank (text, options, correct_option, difficulty, concept_tag, format_type) VALUES
('If x + y = 10 and x - y = 4, what is the value of x?', '["5", "6", "7", "8"]', '7', 0.4, 'Algebra', 'multiple_choice'),
('What is the next number in the sequence: 2, 6, 12, 20, ?', '["28", "30", "32", "34"]', '30', 0.5, 'Pattern Recognition', 'multiple_choice'),
('A train travels 120 km in 2 hours. What is its average speed?', '["50 km/h", "60 km/h", "70 km/h", "80 km/h"]', '60 km/h', 0.3, 'Speed & Distance', 'multiple_choice'),
('If 20% of a number is 50, what is the number?', '["200", "250", "300", "350"]', '250', 0.4, 'Percentages', 'multiple_choice'),
('Which of the following is a prime number?', '["27", "35", "41", "51"]', '41', 0.3, 'Number Theory', 'multiple_choice'),
('Solve: 3x + 7 = 22', '["3", "4", "5", "6"]', '5', 0.4, 'Algebra', 'multiple_choice'),
('What is 15% of 200?', '["25", "30", "35", "40"]', '30', 0.3, 'Percentages', 'multiple_choice'),
('If a rectangle has length 8 and width 5, what is its area?', '["30", "35", "40", "45"]', '40', 0.3, 'Geometry', 'multiple_choice'),
('What is the value of 2^5?', '["16", "24", "32", "64"]', '32', 0.3, 'Exponents', 'multiple_choice'),
('If a = 3 and b = 4, what is a^2 + b^2?', '["12", "20", "25", "30"]', '25', 0.4, 'Algebra', 'multiple_choice');