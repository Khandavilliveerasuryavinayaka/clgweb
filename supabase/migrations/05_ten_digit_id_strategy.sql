-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- PostgreSQL / Supabase Migration
-- Migration: 05_sequential_numeric_id_strategy.sql
-- Description: Simple sequential numeric auto-incrementing IDs (1, 2, 3, 4, 5...)
--              using PostgreSQL BIGINT sequences starting at 1.
--              Preserves internal Supabase Auth auth.users UUIDs.
-- ====================================================================

-- 1. Create simple sequential sequences starting at 1 for application tables
CREATE SEQUENCE IF NOT EXISTS seq_departments_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_programs_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_courses_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_users_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_students_student_number START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_faculty_faculty_number START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_course_registrations_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_attendance_sessions_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_attendance_records_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_od_requests_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_internal_marks_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_assignments_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_assignment_submissions_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_results_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_course_result_submissions_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_fee_assignments_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_student_fee_assignments_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_student_fees_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_payments_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_receipts_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_audit_logs_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_notifications_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS seq_student_block_history_app_id START WITH 1 INCREMENT BY 1 MINVALUE 1;

-- 2. Add application sequential ID columns if not already present
ALTER TABLE departments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_departments_app_id');
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_number BIGINT UNIQUE;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_programs_app_id');
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_number BIGINT UNIQUE;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_courses_app_id');
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_number BIGINT UNIQUE;

ALTER TABLE users ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_users_app_id');

ALTER TABLE students ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_students_student_number');
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_number BIGINT UNIQUE;

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_faculty_faculty_number');
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS faculty_number BIGINT UNIQUE;

ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_course_registrations_app_id');
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_attendance_sessions_app_id');
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_attendance_records_app_id');
ALTER TABLE od_requests ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_od_requests_app_id');
ALTER TABLE internal_marks ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_internal_marks_app_id');
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_assignments_app_id');
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_assignment_submissions_app_id');
ALTER TABLE results ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_results_app_id');
ALTER TABLE course_result_submissions ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_course_result_submissions_app_id');
ALTER TABLE fee_assignments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_fee_assignments_app_id');
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_student_fee_assignments_app_id');
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_student_fees_app_id');
ALTER TABLE payments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_payments_app_id');
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_receipts_app_id');
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_audit_logs_app_id');
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_notifications_app_id');
ALTER TABLE student_block_history ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('seq_student_block_history_app_id');

-- 3. Replace any old 10-digit constraints with positive integer check constraints
DO $$
BEGIN
    ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_app_id_range_check;
    ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_app_id_range_check;
    ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_app_id_range_check;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_app_id_range_check;
    ALTER TABLE students DROP CONSTRAINT IF EXISTS students_student_number_range_check;
    ALTER TABLE faculty DROP CONSTRAINT IF EXISTS faculty_number_range_check;
    ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_app_id_range_check;
    ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_app_id_range_check;
    ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_app_id_range_check;
    ALTER TABLE od_requests DROP CONSTRAINT IF EXISTS od_requests_app_id_range_check;
    ALTER TABLE internal_marks DROP CONSTRAINT IF EXISTS internal_marks_app_id_range_check;
    ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_app_id_range_check;
    ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_app_id_range_check;
    ALTER TABLE results DROP CONSTRAINT IF EXISTS results_app_id_range_check;
    ALTER TABLE course_result_submissions DROP CONSTRAINT IF EXISTS course_result_submissions_app_id_range_check;
    ALTER TABLE fee_assignments DROP CONSTRAINT IF EXISTS fee_assignments_app_id_range_check;
    ALTER TABLE student_fee_assignments DROP CONSTRAINT IF EXISTS student_fee_assignments_app_id_range_check;
    ALTER TABLE student_fees DROP CONSTRAINT IF EXISTS student_fees_app_id_range_check;
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_app_id_range_check;
    ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_app_id_range_check;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_app_id_range_check;
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_app_id_range_check;
    ALTER TABLE student_block_history DROP CONSTRAINT IF EXISTS student_block_history_app_id_range_check;

    ALTER TABLE departments ADD CONSTRAINT departments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE programs ADD CONSTRAINT programs_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE courses ADD CONSTRAINT courses_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE users ADD CONSTRAINT users_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE students ADD CONSTRAINT students_student_number_positive CHECK (student_number >= 1);
    ALTER TABLE faculty ADD CONSTRAINT faculty_number_positive CHECK (faculty_number >= 1);
    ALTER TABLE course_registrations ADD CONSTRAINT course_registrations_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE attendance_sessions ADD CONSTRAINT attendance_sessions_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE attendance_records ADD CONSTRAINT attendance_records_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE od_requests ADD CONSTRAINT od_requests_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE internal_marks ADD CONSTRAINT internal_marks_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE assignments ADD CONSTRAINT assignments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE assignment_submissions ADD CONSTRAINT assignment_submissions_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE results ADD CONSTRAINT results_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE course_result_submissions ADD CONSTRAINT course_result_submissions_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE fee_assignments ADD CONSTRAINT fee_assignments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE student_fee_assignments ADD CONSTRAINT student_fee_assignments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE student_fees ADD CONSTRAINT student_fees_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE payments ADD CONSTRAINT payments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE receipts ADD CONSTRAINT receipts_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE notifications ADD CONSTRAINT notifications_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE student_block_history ADD CONSTRAINT student_block_history_app_id_positive CHECK (app_id >= 1);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Re-sequence baseline application courses deterministically starting at 1:
-- 1: CS601 Distributed Systems & Cloud Architecture
-- 2: CS602 Machine Learning & Deep Learning
-- 3: CS603 Cryptography and Network Security
-- 4: CS604 Compiler Design
-- 5: CS605 Distributed Systems Laboratory
UPDATE courses SET app_id = 1, course_number = 1 WHERE code = 'CS601';
UPDATE courses SET app_id = 2, course_number = 2 WHERE code = 'CS602';
UPDATE courses SET app_id = 3, course_number = 3 WHERE code = 'CS603';
UPDATE courses SET app_id = 4, course_number = 4 WHERE code = 'CS604';
UPDATE courses SET app_id = 5, course_number = 5 WHERE code = 'CS605';
UPDATE courses SET app_id = 6, course_number = 6 WHERE code = 'EC401';
SELECT setval('seq_courses_app_id', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM courses), false);

-- 5. Re-sequence baseline students deterministically starting at 1:
-- 1: Rahul Verma (REG2024001)
-- 2: Kavita Patel (REG2024002)
-- 3: Vikram Aditya (REG2024003)
-- 4: Ananya Iyer (REG2024004)
UPDATE students SET app_id = 1, student_number = 1 WHERE user_id = 'c0000000-0000-0000-0000-000000000004' OR user_id = 'f0000000-0000-0000-0000-000000000004';
UPDATE students SET app_id = 2, student_number = 2 WHERE user_id = 'c0000000-0000-0000-0000-000000000005' OR user_id = 'f0000000-0000-0000-0000-000000000005';
UPDATE students SET app_id = 3, student_number = 3 WHERE user_id = 'c0000000-0000-0000-0000-000000000006' OR user_id = 'f0000000-0000-0000-0000-000000000006';
UPDATE students SET app_id = 4, student_number = 4 WHERE user_id = 'c0000000-0000-0000-0000-000000000007' OR user_id = 'f0000000-0000-0000-0000-000000000007';
SELECT setval('seq_students_student_number', (SELECT COALESCE(MAX(student_number), 0) + 1 FROM students), false);

-- 6. Re-sequence baseline faculty deterministically starting at 1:
-- 1: Prof. Anand Kumar (FAC101)
-- 2: Dr. Priya Sharma (FAC102)
UPDATE faculty SET app_id = 1, faculty_number = 1 WHERE user_id = 'c0000000-0000-0000-0000-000000000002' OR user_id = 'f0000000-0000-0000-0000-000000000002';
UPDATE faculty SET app_id = 2, faculty_number = 2 WHERE user_id = 'c0000000-0000-0000-0000-000000000003' OR user_id = 'f0000000-0000-0000-0000-000000000003';
SELECT setval('seq_faculty_faculty_number', (SELECT COALESCE(MAX(faculty_number), 0) + 1 FROM faculty), false);

-- 7. Re-sequence baseline departments starting at 1
UPDATE departments SET app_id = 1, department_number = 1 WHERE code = 'CSE';
UPDATE departments SET app_id = 2, department_number = 2 WHERE code = 'ECE';
UPDATE departments SET app_id = 3, department_number = 3 WHERE code = 'MECH';
UPDATE departments SET app_id = 4, department_number = 4 WHERE code = 'CIVIL';
UPDATE departments SET app_id = 5, department_number = 5 WHERE code = 'MBA';
SELECT setval('seq_departments_app_id', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM departments), false);

-- 8. Re-sequence baseline programs starting at 1
UPDATE programs SET app_id = 1, program_number = 1 WHERE code = 'BTECH-CSE';
UPDATE programs SET app_id = 2, program_number = 2 WHERE code = 'BTECH-ECE';
UPDATE programs SET app_id = 3, program_number = 3 WHERE code = 'BTECH-ECE-NEW' OR code = 'BTECH-ECE';
UPDATE programs SET app_id = 3, program_number = 3 WHERE code = 'MBA';
SELECT setval('seq_programs_app_id', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM programs), false);

-- 9. Permissions & Indexes
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
CREATE INDEX IF NOT EXISTS idx_users_app_id ON users(app_id);
CREATE INDEX IF NOT EXISTS idx_courses_app_id ON courses(app_id);
CREATE INDEX IF NOT EXISTS idx_students_number ON students(student_number);
CREATE INDEX IF NOT EXISTS idx_faculty_number ON faculty(faculty_number);
CREATE INDEX IF NOT EXISTS idx_course_registrations_app_id ON course_registrations(app_id);
CREATE INDEX IF NOT EXISTS idx_fee_assignments_app_id ON fee_assignments(app_id);
CREATE INDEX IF NOT EXISTS idx_receipts_app_id ON receipts(app_id);
