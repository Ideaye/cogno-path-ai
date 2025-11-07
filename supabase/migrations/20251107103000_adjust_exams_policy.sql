-- Relax RLS so unauthenticated users (signup flow) can read public exams

-- Drop existing public policy if present
DROP POLICY IF EXISTS "exams_read_public" ON public.exams;

-- Allow anyone to select non-admin exams
CREATE POLICY "exams_read_public" ON public.exams
FOR SELECT
USING (is_admin_only = false);

-- Ensure admins retain access to all exams
DROP POLICY IF EXISTS "exams_read_admin" ON public.exams;

CREATE POLICY "exams_read_admin" ON public.exams
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
);
