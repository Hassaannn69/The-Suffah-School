-- AUTH SYSTEM REBUILD: DATABASE MIGRATION SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR

-- 1. Create Staff Table (for Accountants and General Staff)
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL, -- Format: STF-XXX
    role TEXT NOT NULL CHECK (role IN ('accountant', 'staff')),
    email TEXT, -- Personal email (optional)
    phone TEXT,
    date_of_birth DATE NOT NULL, -- Source of Truth for Password
    is_active BOOLEAN DEFAULT TRUE,
    auth_id UUID UNIQUE, -- Linked to Supabase Auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add Missing Columns to Teachers Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.teachers ADD COLUMN date_of_birth DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teachers' AND column_name = 'auth_id') THEN
        ALTER TABLE public.teachers ADD COLUMN auth_id UUID UNIQUE;
    END IF;
END $$;

-- 3. Add Missing Columns to Students Table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'auth_id') THEN
        ALTER TABLE public.students ADD COLUMN auth_id UUID UNIQUE;
    END IF;
END $$;

-- 4. Enable RLS and Policies for Staff Table
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to staff"
ON public.staff FOR ALL
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Staff can view their own profile
CREATE POLICY "Staff can view own record"
ON public.staff FOR SELECT
USING ( auth.uid() = auth_id );

-- 5. Update Policies for Teachers and Students to allow access via auth_id
-- (Assuming base policies exist, adding specific ones for portal access)

CREATE POLICY "Teachers can view own profile"
ON public.teachers FOR SELECT
USING ( auth.uid() = auth_id );

CREATE POLICY "Students can view own profile"
ON public.students FOR SELECT
USING ( auth.uid() = auth_id );

-- 6. Important Notes:
-- Initial passwords for all roles will be Date of Birth in DDMMYYYY format.
-- Student login format: {roll_no}@student.suffah.school
-- Teacher login format: {employee_id}@teacher.suffah.school
-- Staff/Accountant login format: {employee_id}@staff.suffah.school
-- The Admin (admin@school.com) remains untouched.
