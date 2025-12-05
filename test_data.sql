-- Test Data for School Management System
-- Run this in your Supabase SQL Editor to populate test data

-- 1. Add Classes
INSERT INTO public.classes (class_name, sections) VALUES
('Class 9', ARRAY['A', 'B']),
('Class 10', ARRAY['A', 'B', 'C']),
('Class 11', ARRAY['A', 'B'])
ON CONFLICT (class_name) DO NOTHING;

-- 2. Add Students
INSERT INTO public.students (name, roll_no, class, section, gender, email, phone, admission_date, tuition_fee, transport_fee) VALUES
('John Doe', 'ST-001', 'Class 9', 'A', 'Male', 'john@example.com', '1234567890', '2024-01-15', 5000, 1000),
('Jane Smith', 'ST-002', 'Class 9', 'A', 'Female', 'jane@example.com', '1234567891', '2024-01-15', 5000, 1000),
('Bob Johnson', 'ST-003', 'Class 10', 'A', 'Male', 'bob@example.com', '1234567892', '2024-01-15', 6000, 1200),
('Alice Williams', 'ST-004', 'Class 10', 'B', 'Female', 'alice@example.com', '1234567893', '2024-01-15', 6000, 1200),
('Charlie Brown', 'ST-005', 'Class 10', 'C', 'Male', 'charlie@example.com', '1234567894', '2024-01-15', 6000, 1200),
('Diana Prince', 'ST-006', 'Class 11', 'A', 'Female', 'diana@example.com', '1234567895', '2024-01-15', 7000, 1500),
('Eve Davis', 'ST-007', 'Class 11', 'B', 'Female', 'eve@example.com', '1234567896', '2024-01-15', 7000, 1500)
ON CONFLICT (roll_no) DO NOTHING;

-- 3. Add Fees (Mix of paid and unpaid)
INSERT INTO public.fees (student_id, fee_type, month, amount, due_date, status) 
SELECT 
    s.id,
    'Tuition Fee',
    '2024-12',
    s.tuition_fee,
    '2024-12-10',
    CASE 
        WHEN s.roll_no IN ('ST-001', 'ST-003', 'ST-006') THEN 'paid'
        ELSE 'unpaid'
    END
FROM public.students s
ON CONFLICT DO NOTHING;

-- Add some transport fees
INSERT INTO public.fees (student_id, fee_type, month, amount, due_date, status) 
SELECT 
    s.id,
    'Transport Fee',
    '2024-12',
    s.transport_fee,
    '2024-12-10',
    CASE 
        WHEN s.roll_no IN ('ST-001', 'ST-002', 'ST-004') THEN 'paid'
        ELSE 'unpaid'
    END
FROM public.students s
WHERE s.transport_fee > 0
ON CONFLICT DO NOTHING;

-- 4. Add Fee Types
INSERT INTO public.fee_types (name, description) VALUES
('Tuition Fee', 'Monthly tuition fee for academic instruction'),
('Lab Fee', 'Laboratory and practical work fee'),
('Sports Fee', 'Sports and physical education fee'),
('Library Fee', 'Library access and book maintenance fee'),
('Transport Fee', 'School bus transportation fee'),
('Computer Fee', 'Computer lab and IT resources fee'),
('Examination Fee', 'Examination and assessment fee')
ON CONFLICT (name) DO NOTHING;

-- 5. Add Class Fees (Assign fee types to classes with amounts)
-- Get class and fee type IDs and assign fees
INSERT INTO public.class_fees (class_id, fee_type_id, amount)
SELECT 
    c.id,
    ft.id,
    CASE 
        WHEN c.class_name = 'Class 9' AND ft.name = 'Tuition Fee' THEN 5000
        WHEN c.class_name = 'Class 9' AND ft.name = 'Lab Fee' THEN 800
        WHEN c.class_name = 'Class 9' AND ft.name = 'Sports Fee' THEN 500
        WHEN c.class_name = 'Class 9' AND ft.name = 'Library Fee' THEN 300
        WHEN c.class_name = 'Class 9' AND ft.name = 'Transport Fee' THEN 1000
        
        WHEN c.class_name = 'Class 10' AND ft.name = 'Tuition Fee' THEN 6000
        WHEN c.class_name = 'Class 10' AND ft.name = 'Lab Fee' THEN 1000
        WHEN c.class_name = 'Class 10' AND ft.name = 'Sports Fee' THEN 500
        WHEN c.class_name = 'Class 10' AND ft.name = 'Library Fee' THEN 300
        WHEN c.class_name = 'Class 10' AND ft.name = 'Transport Fee' THEN 1200
        WHEN c.class_name = 'Class 10' AND ft.name = 'Computer Fee' THEN 800
        
        WHEN c.class_name = 'Class 11' AND ft.name = 'Tuition Fee' THEN 7000
        WHEN c.class_name = 'Class 11' AND ft.name = 'Lab Fee' THEN 1500
        WHEN c.class_name = 'Class 11' AND ft.name = 'Sports Fee' THEN 600
        WHEN c.class_name = 'Class 11' AND ft.name = 'Library Fee' THEN 400
        WHEN c.class_name = 'Class 11' AND ft.name = 'Transport Fee' THEN 1500
        WHEN c.class_name = 'Class 11' AND ft.name = 'Computer Fee' THEN 1000
        WHEN c.class_name = 'Class 11' AND ft.name = 'Examination Fee' THEN 500
    END as amount
FROM public.classes c
CROSS JOIN public.fee_types ft
WHERE CASE 
    WHEN c.class_name = 'Class 9' AND ft.name IN ('Tuition Fee', 'Lab Fee', 'Sports Fee', 'Library Fee', 'Transport Fee') THEN true
    WHEN c.class_name = 'Class 10' AND ft.name IN ('Tuition Fee', 'Lab Fee', 'Sports Fee', 'Library Fee', 'Transport Fee', 'Computer Fee') THEN true
    WHEN c.class_name = 'Class 11' AND ft.name IN ('Tuition Fee', 'Lab Fee', 'Sports Fee', 'Library Fee', 'Transport Fee', 'Computer Fee', 'Examination Fee') THEN true
    ELSE false
END
ON CONFLICT (class_id, fee_type_id) DO NOTHING;

-- Verify the data
SELECT 'Students Added:' as info, COUNT(*) as count FROM public.students
UNION ALL
SELECT 'Classes Added:', COUNT(*) FROM public.classes
UNION ALL
SELECT 'Fees Added:', COUNT(*) FROM public.fees
UNION ALL
SELECT 'Paid Fees:', COUNT(*) FROM public.fees WHERE status = 'paid'
UNION ALL
SELECT 'Unpaid Fees:', COUNT(*) FROM public.fees WHERE status = 'unpaid'
UNION ALL
SELECT 'Fee Types Added:', COUNT(*) FROM public.fee_types
UNION ALL
SELECT 'Class Fee Assignments:', COUNT(*) FROM public.class_fees;
