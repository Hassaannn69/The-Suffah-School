    -- Online Admission Applications
    -- Parents submit from the landing page; admin reviews here.

    CREATE TABLE IF NOT EXISTS online_applications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),

        -- Status: pending, approved, rejected
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

        -- Student Information
        student_name TEXT NOT NULL,
        date_of_birth DATE,
        gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
        grade_applying TEXT NOT NULL,

        -- Parent / Guardian
        parent_name TEXT NOT NULL,
        parent_relationship TEXT DEFAULT 'Father',
        parent_contact TEXT,
        parent_email TEXT,
        parent_occupation TEXT,

        -- Education Background
        previous_school TEXT,
        reason_for_leaving TEXT,

        -- Admin
        admin_notes TEXT,
        reviewed_by UUID REFERENCES auth.users(id),
        reviewed_at TIMESTAMPTZ
    );

    -- Enable RLS
    ALTER TABLE online_applications ENABLE ROW LEVEL SECURITY;

    -- Admin can do everything (JWT: user_metadata or app_metadata)
    CREATE POLICY "Admin full access" ON online_applications
        FOR ALL USING (
            COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        );

    -- Public can insert (for landing page form)
    CREATE POLICY "Public can submit applications" ON online_applications
        FOR INSERT WITH CHECK (true);

    -- Index for fast status filtering
    CREATE INDEX idx_applications_status ON online_applications(status);
    CREATE INDEX idx_applications_created ON online_applications(created_at DESC);
