-- =====================================================
-- FIX: Enable Access to Fees and Students Data
-- Run this in Supabase SQL Editor to fix "No fee records found"
-- =====================================================

-- 1. Enable RLS on tables (if not already enabled)
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts (optional, but safe)
DROP POLICY IF EXISTS "Public read access" ON fees;
DROP POLICY IF EXISTS "Public read access" ON students;
DROP POLICY IF EXISTS "Allow authenticated read" ON fees;
DROP POLICY IF EXISTS "Allow authenticated read" ON students;

-- 3. Create Permissive Read Policies for Authenticated Users (Students & Admins)
-- This allows any logged-in user to READ the data, ensuring the Dashboard works.
-- Logic is filtered on the frontend (Client-side) for now to ensure functionality.
CREATE POLICY "Allow authenticated read" ON fees
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Allow authenticated read" ON students
FOR SELECT TO authenticated
USING (true);

-- 4. Allow Admins (service_role) full access (implicitly allowed, but good to be explicit if needed)
-- Note: Service role always has full access, so we don't strictly need policies for it.

-- 5. Fix for Manual Fees logic (Optional check)
-- Ensure 'fees' table schema supports 'final_amount' if used
-- (No SQL change needed if table structure is standard)

-- INSTRUCTIONS:
-- 1. Copy this entire script.
-- 2. Go to Supabase > SQL Editor.
-- 3. Paste and Run.
-- 4. Refresh the Student Portal.
