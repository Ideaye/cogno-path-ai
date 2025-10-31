-- Drop conflicting exam policies
DROP POLICY IF EXISTS "Authenticated users can view exams" ON public.exams;
DROP POLICY IF EXISTS "exams_select" ON public.exams;

-- Create new exam read policies
CREATE POLICY "exams_read_public" ON public.exams
FOR SELECT TO authenticated
USING (is_admin_only = false);

CREATE POLICY "exams_read_admin" ON public.exams
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
);

-- Update Chemistry exams to be public (not admin-only)
UPDATE public.exams
SET is_admin_only = false
WHERE name ILIKE '%chemistry%' OR name ILIKE '%chem%';

-- Drop and recreate practice_items policies
DROP POLICY IF EXISTS "pi_select" ON public.practice_items;

CREATE POLICY "practice_items_read_public_or_enrolled_or_admin" ON public.practice_items
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = practice_items.exam_id AND e.is_admin_only = false)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  OR EXISTS (SELECT 1 FROM public.user_exam_enrollments ue WHERE ue.exam_id = practice_items.exam_id AND ue.user_id = auth.uid())
);

-- Drop and recreate calibration_items policies
DROP POLICY IF EXISTS "ci_select" ON public.calibration_items;

CREATE POLICY "calibration_items_read_public_or_enrolled_or_admin" ON public.calibration_items
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.exams e WHERE e.id = calibration_items.exam_id AND e.is_admin_only = false)
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  OR EXISTS (SELECT 1 FROM public.user_exam_enrollments ue WHERE ue.exam_id = calibration_items.exam_id AND ue.user_id = auth.uid())
);

-- Ensure enrollment policies are secure (drop old, create new)
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.user_exam_enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON public.user_exam_enrollments;

CREATE POLICY "enrollments_read_own" ON public.user_exam_enrollments
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "enrollments_read_admin" ON public.user_exam_enrollments
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

CREATE POLICY "enrollments_insert_own" ON public.user_exam_enrollments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "enrollments_update_own" ON public.user_exam_enrollments
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "enrollments_delete_own" ON public.user_exam_enrollments
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Create RPC function for auto-enroll and set active
CREATE OR REPLACE FUNCTION public.ensure_enrolled_and_set_active(p_exam_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Enroll if missing, or activate if exists
  INSERT INTO public.user_exam_enrollments (user_id, exam_id, is_active)
  VALUES (auth.uid(), p_exam_id, true)
  ON CONFLICT (user_id, exam_id) 
  DO UPDATE SET is_active = true;

  -- Deactivate all other enrollments for this user
  UPDATE public.user_exam_enrollments
  SET is_active = false
  WHERE user_id = auth.uid() AND exam_id != p_exam_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_enrolled_and_set_active(uuid) TO authenticated;