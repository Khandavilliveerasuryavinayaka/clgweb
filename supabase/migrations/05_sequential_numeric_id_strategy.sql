-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- PostgreSQL / Supabase Migration
-- Migration: 05_sequential_numeric_id_strategy.sql
-- Description: Simple sequential numeric auto-incrementing IDs (1, 2, 3, 4, 5...)
--              using PostgreSQL BIGINT sequences starting at 1.
--              Preserves internal Supabase Auth auth.users UUIDs.
-- ====================================================================

-- 1. Create simple sequential sequences starting at 1 for application tables
CREATE SEQUENCE IF NOT EXISTS app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS departments_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS programs_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS courses_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS students_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS faculty_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS course_enrollments_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS attendance_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS assignments_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS assignment_submissions_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS internal_marks_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS results_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS fee_assignments_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS student_fee_assignments_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS student_fees_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS payment_transactions_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS receipts_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS notifications_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;
CREATE SEQUENCE IF NOT EXISTS audit_logs_app_id_seq START WITH 1 INCREMENT BY 1 MINVALUE 1;

-- 2. Add application sequential ID columns if not already present
ALTER TABLE departments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('departments_app_id_seq');
ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_number BIGINT UNIQUE;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('programs_app_id_seq');
ALTER TABLE programs ADD COLUMN IF NOT EXISTS program_number BIGINT UNIQUE;

ALTER TABLE courses ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('courses_app_id_seq');
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_number BIGINT UNIQUE;

ALTER TABLE students ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('students_app_id_seq');
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_number BIGINT UNIQUE;

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('faculty_app_id_seq');
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS faculty_number BIGINT UNIQUE;

ALTER TABLE course_registrations ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('course_enrollments_app_id_seq');
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('attendance_app_id_seq');
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('assignments_app_id_seq');
ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('assignment_submissions_app_id_seq');
ALTER TABLE internal_marks ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('internal_marks_app_id_seq');
ALTER TABLE results ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('results_app_id_seq');
ALTER TABLE fee_assignments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('fee_assignments_app_id_seq');
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('student_fee_assignments_app_id_seq');
ALTER TABLE student_fees ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('student_fees_app_id_seq');
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('payment_transactions_app_id_seq');
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('receipts_app_id_seq');
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('notifications_app_id_seq');
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS app_id BIGINT UNIQUE DEFAULT nextval('audit_logs_app_id_seq');

-- 3. Replace any old 10-digit constraints with positive integer check constraints
DO $$
BEGIN
    -- Drop old 10-digit range constraints if present
    ALTER TABLE departments DROP CONSTRAINT IF EXISTS check_departments_app_id_10_digit;
    ALTER TABLE programs DROP CONSTRAINT IF EXISTS check_programs_app_id_10_digit;
    ALTER TABLE courses DROP CONSTRAINT IF EXISTS check_courses_app_id_10_digit;
    ALTER TABLE students DROP CONSTRAINT IF EXISTS check_students_app_id_10_digit;
    ALTER TABLE faculty DROP CONSTRAINT IF EXISTS check_faculty_app_id_10_digit;
    ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS check_course_registrations_app_id_10_digit;
    ALTER TABLE attendance DROP CONSTRAINT IF EXISTS check_attendance_app_id_10_digit;
    ALTER TABLE assignments DROP CONSTRAINT IF EXISTS check_assignments_app_id_10_digit;
    ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS check_assignment_submissions_app_id_10_digit;
    ALTER TABLE internal_marks DROP CONSTRAINT IF EXISTS check_internal_marks_app_id_10_digit;
    ALTER TABLE results DROP CONSTRAINT IF EXISTS check_results_app_id_10_digit;
    ALTER TABLE fee_assignments DROP CONSTRAINT IF EXISTS check_fee_assignments_app_id_10_digit;
    ALTER TABLE student_fee_assignments DROP CONSTRAINT IF EXISTS check_student_fee_assignments_app_id_10_digit;
    ALTER TABLE student_fees DROP CONSTRAINT IF EXISTS check_student_fees_app_id_10_digit;
    ALTER TABLE payment_transactions DROP CONSTRAINT IF EXISTS check_payment_transactions_app_id_10_digit;
    ALTER TABLE receipts DROP CONSTRAINT IF EXISTS check_receipts_app_id_10_digit;
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS check_notifications_app_id_10_digit;
    ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS check_audit_logs_app_id_10_digit;

    -- Add simple positive ID constraints
    ALTER TABLE departments ADD CONSTRAINT check_departments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE programs ADD CONSTRAINT check_programs_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE courses ADD CONSTRAINT check_courses_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE students ADD CONSTRAINT check_students_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE faculty ADD CONSTRAINT check_faculty_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE course_registrations ADD CONSTRAINT check_course_registrations_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE attendance ADD CONSTRAINT check_attendance_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE assignments ADD CONSTRAINT check_assignments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE assignment_submissions ADD CONSTRAINT check_assignment_submissions_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE internal_marks ADD CONSTRAINT check_internal_marks_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE results ADD CONSTRAINT check_results_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE fee_assignments ADD CONSTRAINT check_fee_assignments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE student_fee_assignments ADD CONSTRAINT check_student_fee_assignments_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE student_fees ADD CONSTRAINT check_student_fees_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE payment_transactions ADD CONSTRAINT check_payment_transactions_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE receipts ADD CONSTRAINT check_receipts_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE notifications ADD CONSTRAINT check_notifications_app_id_positive CHECK (app_id >= 1);
    ALTER TABLE audit_logs ADD CONSTRAINT check_audit_logs_app_id_positive CHECK (app_id >= 1);
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 4. Re-sequence baseline application courses deterministically starting at 1:
-- 1: CS601 Distributed Systems & Cloud Architecture
-- 2: CS602 Machine Learning & Deep Learning
-- 3: CS603 Cryptography and Network Security
-- 4: CS604 Compiler Design
-- 5: CS605 Distributed Systems Laboratory
UPDATE courses SET app_id = NULL, course_number = NULL;
UPDATE courses SET app_id = 1, course_number = 1 WHERE code = 'CS601';
UPDATE courses SET app_id = 2, course_number = 2 WHERE code = 'CS602';
UPDATE courses SET app_id = 3, course_number = 3 WHERE code = 'CS603';
UPDATE courses SET app_id = 4, course_number = 4 WHERE code = 'CS604';
UPDATE courses SET app_id = 5, course_number = 5 WHERE code = 'CS605';
UPDATE courses SET app_id = 6, course_number = 6 WHERE code = 'EC401';
UPDATE courses SET app_id = nextval('courses_app_id_seq'), course_number = currval('courses_app_id_seq') WHERE app_id IS NULL;
SELECT setval('courses_app_id_seq', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM courses), false);

-- 5. Re-sequence baseline students deterministically starting at 1:
-- 1: Rahul Verma (REG2024001)
-- 2: Kavita Patel (REG2024002)
-- 3: Vikram Aditya (REG2024003)
-- 4: Ananya Iyer (REG2024004)
UPDATE students SET app_id = NULL, student_number = NULL;
UPDATE students s SET app_id = 1, student_number = 1 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024001';
UPDATE students s SET app_id = 2, student_number = 2 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024002';
UPDATE students s SET app_id = 3, student_number = 3 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024003';
UPDATE students s SET app_id = 4, student_number = 4 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024004';
UPDATE students SET app_id = nextval('students_app_id_seq'), student_number = currval('students_app_id_seq') WHERE app_id IS NULL;
SELECT setval('students_app_id_seq', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM students), false);

-- 6. Re-sequence baseline faculty deterministically starting at 1:
-- 1: Prof. Anand Kumar (FAC101)
-- 2: Dr. Priya Sharma (FAC102)
UPDATE faculty SET app_id = NULL, faculty_number = NULL;
UPDATE faculty f SET app_id = 1, faculty_number = 1 FROM users u WHERE f.user_id = u.id AND u.register_number = 'FAC101';
UPDATE faculty f SET app_id = 2, faculty_number = 2 FROM users u WHERE f.user_id = u.id AND u.register_number = 'FAC102';
UPDATE faculty SET app_id = nextval('faculty_app_id_seq'), faculty_number = currval('faculty_app_id_seq') WHERE app_id IS NULL;
SELECT setval('faculty_app_id_seq', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM faculty), false);

-- 7. Re-sequence baseline departments starting at 1
UPDATE departments SET app_id = NULL, department_number = NULL;
UPDATE departments SET app_id = 1, department_number = 1 WHERE code = 'CSE';
UPDATE departments SET app_id = 2, department_number = 2 WHERE code = 'ECE';
UPDATE departments SET app_id = 3, department_number = 3 WHERE code = 'MECH';
UPDATE departments SET app_id = 4, department_number = 4 WHERE code = 'EEE';
UPDATE departments SET app_id = 5, department_number = 5 WHERE code = 'IT';
UPDATE departments SET app_id = nextval('departments_app_id_seq'), department_number = currval('departments_app_id_seq') WHERE app_id IS NULL;
SELECT setval('departments_app_id_seq', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM departments), false);

-- 8. Re-sequence baseline programs starting at 1
UPDATE programs SET app_id = NULL, program_number = NULL;
UPDATE programs SET app_id = 1, program_number = 1 WHERE code = 'BTECH-CSE';
UPDATE programs SET app_id = 2, program_number = 2 WHERE code = 'BTECH-ECE';
UPDATE programs SET app_id = 3, program_number = 3 WHERE code = 'MTECH-CSE';
UPDATE programs SET app_id = nextval('programs_app_id_seq'), program_number = currval('programs_app_id_seq') WHERE app_id IS NULL;
SELECT setval('programs_app_id_seq', (SELECT COALESCE(MAX(app_id), 0) + 1 FROM programs), false);

-- 9. Grant sequence permissions to standard roles
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
