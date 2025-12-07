-- =====================================================
-- Student Dashboard Tables
-- Run each block SEPARATELY in Supabase SQL Editor
-- =====================================================

-- STEP 1: ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    remarks TEXT,
    marked_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, date)
)

-- STEP 2: EXAMS TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS exams (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     class_name VARCHAR(50) NOT NULL,
--     section VARCHAR(10),
--     subject VARCHAR(100) NOT NULL,
--     exam_date DATE,
--     total_marks INTEGER DEFAULT 100,
--     exam_type VARCHAR(50),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- )

-- STEP 3: EXAM RESULTS TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS exam_results (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
--     student_id UUID REFERENCES students(id) ON DELETE CASCADE,
--     marks_obtained DECIMAL(5,2),
--     grade VARCHAR(5),
--     remarks TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     UNIQUE(exam_id, student_id)
-- )

-- STEP 4: ASSIGNMENTS TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS assignments (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     title VARCHAR(200) NOT NULL,
--     description TEXT,
--     class_name VARCHAR(50) NOT NULL,
--     section VARCHAR(10),
--     subject VARCHAR(100),
--     due_date DATE,
--     total_marks INTEGER DEFAULT 10,
--     created_by UUID,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- )

-- STEP 5: HOMEWORK TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS homework (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     title VARCHAR(200) NOT NULL,
--     description TEXT,
--     class_name VARCHAR(50) NOT NULL,
--     section VARCHAR(10),
--     subject VARCHAR(100),
--     assigned_date DATE DEFAULT CURRENT_DATE,
--     due_date DATE,
--     created_by UUID,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- )

-- STEP 6: TESTS TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS tests (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     class_name VARCHAR(50) NOT NULL,
--     section VARCHAR(10),
--     subject VARCHAR(100) NOT NULL,
--     test_date DATE,
--     total_marks INTEGER DEFAULT 50,
--     test_type VARCHAR(50),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- )

-- STEP 7: TEST RESULTS TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS test_results (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
--     student_id UUID REFERENCES students(id) ON DELETE CASCADE,
--     marks_obtained DECIMAL(5,2),
--     grade VARCHAR(5),
--     remarks TEXT,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     UNIQUE(test_id, student_id)
-- )

-- STEP 8: NOTIFICATIONS TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS notifications (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     title VARCHAR(200) NOT NULL,
--     message TEXT NOT NULL,
--     type VARCHAR(50) DEFAULT 'general',
--     target_type VARCHAR(50) DEFAULT 'all',
--     target_class VARCHAR(50),
--     target_section VARCHAR(10),
--     target_student_id UUID REFERENCES students(id) ON DELETE CASCADE,
--     is_read BOOLEAN DEFAULT FALSE,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     expires_at TIMESTAMP WITH TIME ZONE
-- )

-- STEP 9: TIMETABLE TABLE (Run separately)
-- CREATE TABLE IF NOT EXISTS timetable (
--     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--     class_name VARCHAR(50) NOT NULL,
--     section VARCHAR(10),
--     day_of_week VARCHAR(10) NOT NULL,
--     period_number INTEGER NOT NULL,
--     start_time TIME NOT NULL,
--     end_time TIME NOT NULL,
--     subject VARCHAR(100) NOT NULL,
--     teacher_name VARCHAR(100),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- )
