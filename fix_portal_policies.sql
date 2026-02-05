-- FIX PORTAL RLS POLICIES
-- Run this to allow students to see their own data

-- 1. FIX FEES POLICY
DROP POLICY IF EXISTS "Students can read their own fees" ON public.fees;
CREATE POLICY "Students can read their own fees"
ON public.fees FOR SELECT
USING (
    student_id IN (
        SELECT id FROM public.students WHERE auth_id = auth.uid()
    )
);

-- 2. ATTENDANCE POLICIES
-- Ensure RLS is enabled
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Admins/Teachers/Staff access
CREATE POLICY "Staff can view all attendance"
ON public.attendance FOR ALL
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'teacher', 'accountant', 'staff') );

-- Student access
CREATE POLICY "Students can view own attendance"
ON public.attendance FOR SELECT
USING (
    student_id IN (
        SELECT id FROM public.students WHERE auth_id = auth.uid()
    )
);

-- 3. NOTIFICATIONS POLICIES
-- Ensure RLS is enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Staff access
CREATE POLICY "Staff can view all notifications"
ON public.notifications FOR ALL
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'teacher', 'accountant', 'staff') );

-- Student access
-- Logic: Targeted at 'all', or specific 'class', or specific 'student'
CREATE POLICY "Students can view relevant notifications"
ON public.notifications FOR SELECT
USING (
    target_type = 'all'
    OR (
        target_type = 'class' AND target_class IN (
            SELECT class FROM public.students WHERE auth_id = auth.uid()
        )
    )
    OR (
        target_type = 'student' AND target_student_id IN (
            SELECT id FROM public.students WHERE auth_id = auth.uid()
        )
    )
);

-- 4. FAMILY DATA ACCESS
-- Allow students to view fees of their family members
CREATE POLICY "Students can view family fees"
ON public.fees FOR SELECT
USING (
    student_id IN (
        SELECT s.id 
        FROM public.students s
        JOIN public.students current_student ON s.family_code = current_student.family_code
        WHERE current_student.auth_id = auth.uid()
        AND s.id != current_student.id -- Optional, but good for clarity (own fees covered by other policy)
    )
);

-- Allow students to view family member profiles (basic info)
CREATE POLICY "Students can view family members"
ON public.students FOR SELECT
USING (
    family_code IN (
        SELECT family_code FROM public.students WHERE auth_id = auth.uid()
    )
);
