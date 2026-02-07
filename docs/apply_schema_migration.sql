-- ========== STUDENT APPLICATIONS (online_applications) ==========
-- Ensures table exists, has required columns, and allows public insert (anon users on apply page).

CREATE TABLE IF NOT EXISTS online_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    student_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    grade_applying TEXT NOT NULL,
    parent_name TEXT NOT NULL,
    parent_relationship TEXT DEFAULT 'Father',
    parent_contact TEXT,
    parent_email TEXT,
    parent_occupation TEXT,
    previous_school TEXT,
    reason_for_leaving TEXT,
    home_address TEXT,
    extra_curricular TEXT,
    last_grade_completed TEXT,
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);

ALTER TABLE online_applications ENABLE ROW LEVEL SECURITY;

-- Add columns in case table already existed without them
ALTER TABLE online_applications ADD COLUMN IF NOT EXISTS home_address TEXT;
ALTER TABLE online_applications ADD COLUMN IF NOT EXISTS extra_curricular TEXT;
ALTER TABLE online_applications ADD COLUMN IF NOT EXISTS last_grade_completed TEXT;

-- Policies: allow anyone to INSERT (apply form is public), admin can do everything
DROP POLICY IF EXISTS "Admin full access" ON online_applications;
DROP POLICY IF EXISTS "Public can submit applications" ON online_applications;

-- Use JWT (user_metadata or app_metadata) so we don't read auth.users
CREATE POLICY "Admin full access" ON online_applications
    FOR ALL USING (
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Public can submit applications" ON online_applications
    FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_applications_status ON online_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON online_applications(created_at DESC);

-- ========== TEACHER APPLICATIONS (teacher_applications) ==========
-- Teacher applications table (for apply.html teacher form)
CREATE TABLE IF NOT EXISTS teacher_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

    full_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    subjects_grades TEXT,
    contact_number TEXT,
    email TEXT NOT NULL,
    home_address TEXT,
    qualifications TEXT,
    experience_years INT,
    previous_school TEXT,
    cv_url TEXT,

    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);

ALTER TABLE teacher_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies so this script can be re-run safely
DROP POLICY IF EXISTS "Admin full access teacher_applications" ON teacher_applications;
DROP POLICY IF EXISTS "Public can submit teacher applications" ON teacher_applications;

-- Use JWT (user_metadata or app_metadata) so we don't read auth.users
CREATE POLICY "Admin full access teacher_applications" ON teacher_applications
    FOR ALL USING (
        COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "Public can submit teacher applications" ON teacher_applications
    FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_teacher_applications_status ON teacher_applications(status);
CREATE INDEX IF NOT EXISTS idx_teacher_applications_created ON teacher_applications(created_at DESC);

-- Supabase Storage: create a bucket named "teacher-cvs" in Dashboard (Storage)
-- and set policy to allow public uploads or authenticated uploads as needed for CV uploads.
