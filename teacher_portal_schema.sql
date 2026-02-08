-- TEACHER PORTAL SCHEMA: ATTENDANCE, ASSIGNMENTS, EXAMS, MESSAGES
-- Run this in Supabase SQL Editor

-- 1. Student Attendance
CREATE TABLE IF NOT EXISTS public.student_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
    remarks TEXT,
    marked_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
);

-- 2. Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    section TEXT NOT NULL DEFAULT '',
    subject TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Submissions
CREATE TABLE IF NOT EXISTS public.submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_url TEXT,
    marks NUMERIC,
    remarks TEXT,
    status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Late')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
);

-- 4. Exams
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('Quiz', 'Midterm', 'Final')),
    academic_year TEXT NOT NULL,
    total_marks NUMERIC NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Exam Marks
CREATE TABLE IF NOT EXISTS public.exam_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    marks_obtained NUMERIC NOT NULL,
    marked_by UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(exam_id, student_id, subject)
);

-- 6. Messaging
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_auth_id UUID REFERENCES auth.users(id),
    receiver_auth_id UUID REFERENCES auth.users(id), -- Null for class-wide
    receiver_role TEXT, -- 'student', 'teacher', 'admin', 'parent'
    class_id UUID REFERENCES public.classes(id), -- For class-wide messages
    section TEXT,
    content TEXT NOT NULL,
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RLS POLICIES

-- Enable RLS
ALTER TABLE public.student_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Student Attendance Policies
CREATE POLICY "Admins have full access to attendance" ON public.student_attendance FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );
CREATE POLICY "Teachers can manage their own class attendance" ON public.student_attendance FOR ALL 
USING ( marked_by IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid()) );
CREATE POLICY "Students can view own attendance" ON public.student_attendance FOR SELECT 
USING ( student_id IN (SELECT id FROM public.students WHERE auth_id = auth.uid()) );

-- Assignments Policies
CREATE POLICY "Admins can view all assignments" ON public.assignments FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );
CREATE POLICY "Teachers can manage own assignments" ON public.assignments FOR ALL 
USING ( teacher_id IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid()) );
CREATE POLICY "Students can view their class assignments" ON public.assignments FOR SELECT 
USING ( class_id IN (SELECT (SELECT id FROM public.classes WHERE class_name = s.class) FROM public.students s WHERE auth_id = auth.uid()) );

-- Submissions Policies
CREATE POLICY "Teachers can view/grade submissions" ON public.submissions FOR ALL 
USING ( assignment_id IN (SELECT id FROM public.assignments WHERE teacher_id IN (SELECT id FROM public.teachers WHERE auth_id = auth.uid())) );
CREATE POLICY "Students can manage own submissions" ON public.submissions FOR ALL 
USING ( student_id IN (SELECT id FROM public.students WHERE auth_id = auth.uid()) );

-- Exams Policies
CREATE POLICY "Everyone can view exams" ON public.exams FOR SELECT USING ( true );
CREATE POLICY "Admins manage exams" ON public.exams FOR ALL USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Exam Marks Policies
CREATE POLICY "Admins/Teachers can manage marks" ON public.exam_marks FOR ALL 
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'teacher') );
CREATE POLICY "Students see own marks" ON public.exam_marks FOR SELECT 
USING ( student_id IN (SELECT id FROM public.students WHERE auth_id = auth.uid()) );

-- Messaging Policies
CREATE POLICY "Users can see messages sent to them or by them" ON public.messages FOR SELECT 
USING ( auth.uid() = sender_auth_id OR auth.uid() = receiver_auth_id OR (class_id IS NOT NULL AND ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' OR student_id IN (SELECT id FROM public.students WHERE auth_id = auth.uid()) )) );
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ( auth.uid() = sender_auth_id );
