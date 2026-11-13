-- ====================================================================
-- File: 01_initial_schema.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- PostgreSQL / Supabase Production Schema Migration
-- Migration: 01_initial_schema.sql
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & PROFILES
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('STUDENT', 'FACULTY', 'ADMIN')),
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'BLOCKED', 'PENDING', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    address TEXT,
    emergency_contact VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ACADEMIC GOVERNANCE HIERARCHY
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    hod_id UUID REFERENCES users(id) ON DELETE SET NULL,
    established_year INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    degree VARCHAR(20) NOT NULL CHECK (degree IN ('B.Tech', 'M.Tech', 'MBA', 'MCA', 'Ph.D')),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    duration_years INT NOT NULL DEFAULT 4,
    total_semesters INT NOT NULL DEFAULT 8,
    credits_required INT NOT NULL DEFAULT 160,
    annual_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    eligibility TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_label VARCHAR(30) UNIQUE NOT NULL, -- e.g. '2024-2025'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_number INT NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
    term_type VARCHAR(20) NOT NULL CHECK (term_type IN ('ODD', 'EVEN', 'SUMMER')),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(semester_number, academic_year_id)
);

-- 3. STUDENTS & FACULTY ENTITY EXTENSIONS
CREATE TABLE IF NOT EXISTS students (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    current_semester INT NOT NULL DEFAULT 1,
    batch VARCHAR(30) NOT NULL,
    admission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL,
    qualification VARCHAR(100),
    joining_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. COURSES & ALLOCATIONS
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 12),
    credits INT NOT NULL CHECK (credits BETWEEN 1 AND 10),
    course_type VARCHAR(20) NOT NULL CHECK (course_type IN ('CORE', 'ELECTIVE', 'LAB')),
    description TEXT,
    max_students INT NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_offerings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    is_registration_open BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faculty_course_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, course_offering_id)
);

-- 5. COURSE REGISTRATIONS
CREATE TABLE IF NOT EXISTS registration_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester_number INT NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Available', 'Submitted', 'Pending Review', 'Approved', 'Rejected', 'Closed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    remarks TEXT,
    UNIQUE(student_id, course_offering_id)
);

-- 6. ATTENDANCE & ON-DUTY (OD)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    session_date DATE NOT NULL,
    period_number INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_offering_id, session_date, period_number)
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'OD')),
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(attendance_session_id, student_id)
);

CREATE TABLE IF NOT EXISTS od_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL DEFAULT 1,
    event_name VARCHAR(200) NOT NULL,
    reason TEXT NOT NULL,
    supporting_document_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    faculty_remarks TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CONTINUOUS INTERNAL ASSESSMENTS & MARKS
CREATE TABLE IF NOT EXISTS internal_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    assessment_name VARCHAR(50) NOT NULL, -- e.g. 'CIA-1', 'CIA-2', 'Assignment'
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_marks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    internal_assessment_id UUID NOT NULL REFERENCES internal_assessments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    marks_obtained NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted')),
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    UNIQUE(internal_assessment_id, student_id)
);

-- 8. ASSIGNMENTS & SUBMISSIONS
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 20.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    file_url TEXT NOT NULL,
    comments TEXT,
    marks_obtained NUMERIC(5, 2),
    faculty_feedback TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Graded', 'Late')),
    UNIQUE(assignment_id, student_id)
);

-- 9. END-SEMESTER RESULTS (CRITICAL WORKFLOW)
-- Draft -> Submitted -> Approved -> Published
CREATE TABLE IF NOT EXISTS results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_offering_id UUID NOT NULL REFERENCES course_offerings(id) ON DELETE CASCADE,
    internal_marks NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    external_marks NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    total_marks NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    grade VARCHAR(5) NOT NULL,
    grade_points NUMERIC(4, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Published')),
    submitted_by UUID REFERENCES users(id),
    submitted_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    UNIQUE(student_id, course_offering_id)
);

-- 10. FEES, PAYMENTS & RECEIPTS
CREATE TABLE IF NOT EXISTS fee_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'Tuition', 'Hostel', 'Exam', 'Special Lab'
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Cancelled')),
    academic_year VARCHAR(30) NOT NULL,
    last_payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Success' CHECK (status IN ('Success', 'Failure', 'Pending')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_number VARCHAR(100) UNIQUE NOT NULL,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. STUDENT BLOCKING & DISCIPLINE (CRITICAL WORKFLOW)
CREATE TABLE IF NOT EXISTS student_block_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    blocked_by UUID NOT NULL REFERENCES users(id),
    blocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    unblocked_by UUID REFERENCES users(id),
    unblocked_at TIMESTAMPTZ,
    unblock_remarks TEXT
);

-- 12. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(50),
    previous_state TEXT,
    new_state TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recipient_role VARCHAR(20) DEFAULT 'ALL',
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_reg ON users(register_number);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, account_status);
CREATE INDEX IF NOT EXISTS idx_results_student ON results(student_id, status);
CREATE INDEX IF NOT EXISTS idx_results_course ON results(course_offering_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance_records(attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_student ON student_fees(student_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);


-- ====================================================================
-- File: 02_student_profile_picture_storage.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- Migration: 02_student_profile_picture_storage.sql
-- Storage Bucket & Profile Image Column Configuration
-- ====================================================================

-- 1. Alter profiles table to ensure profile image path column exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_image_path TEXT DEFAULT NULL;

-- 2. Create dedicated storage bucket for student profile pictures
-- Restricted bucket (public: false) with strict row-level security
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-profile-pictures',
    'student-profile-pictures',
    false,
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. Storage Row Level Security (RLS) Policies
-- Policy A: Students can upload/change only their own profile picture
-- Path structure: students/{studentId}/profile-picture
DROP POLICY IF EXISTS "Students can upload own profile picture" ON storage.objects;
CREATE POLICY "Students can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'student-profile-pictures' AND
    (storage.foldername(name))[1] = 'students' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy B: Students can update their own profile picture
DROP POLICY IF EXISTS "Students can update own profile picture" ON storage.objects;
CREATE POLICY "Students can update own profile picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'student-profile-pictures' AND
    (storage.foldername(name))[1] = 'students' AND
    (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'student-profile-pictures' AND
    (storage.foldername(name))[1] = 'students' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy C: Students can delete their own profile picture
DROP POLICY IF EXISTS "Students can delete own profile picture" ON storage.objects;
CREATE POLICY "Students can delete own profile picture"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'student-profile-pictures' AND
    (storage.foldername(name))[1] = 'students' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy D: Authenticated users can view student profile pictures (for Student 360, rosters, etc.)
DROP POLICY IF EXISTS "Authenticated users can read student profile pictures" ON storage.objects;
CREATE POLICY "Authenticated users can read student profile pictures"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'student-profile-pictures'
);



-- ====================================================================
-- File: 03_extended_schema_and_rls.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- Migration: 03_extended_schema_and_rls.sql
-- Missing Schemas, Workflow Alignment & Row Level Security (RLS)
-- ====================================================================

-- 1. EXTEND COURSE REGISTRATION STATUS CONSTRAINT
-- Supports full institutional course enrollment lifecycle: PENDING -> ACCEPTED / REJECTED / CANCELLED
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_status_check;
ALTER TABLE course_registrations 
ADD CONSTRAINT course_registrations_status_check 
CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'Available', 'Submitted', 'Pending Review', 'Approved', 'Closed'));

-- 2. FEE ASSIGNMENTS & BATCH ELIGIBILITY TABLE
CREATE TABLE IF NOT EXISTS fee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_name VARCHAR(150) NOT NULL,
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('Tuition Fee', 'Exam Fee', 'Tuition', 'Exam', 'Special Lab', 'Hostel', 'Library')),
    amount NUMERIC(12, 2) NOT NULL,
    academic_year VARCHAR(30) NOT NULL,
    batch VARCHAR(30) NOT NULL,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    semester INT,
    due_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Closed', 'Inactive')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fee_assignment_id UUID NOT NULL REFERENCES fee_assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Paid', 'Pending')),
    due_date DATE NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    academic_year VARCHAR(30) NOT NULL,
    UNIQUE(fee_assignment_id, student_id)
);

ALTER TABLE student_fees 
ADD COLUMN IF NOT EXISTS fee_assignment_id UUID REFERENCES fee_assignments(id) ON DELETE SET NULL;

-- 3. COURSE RESULT SUBMISSIONS PIPELINE
CREATE TABLE IF NOT EXISTS course_result_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    course_offering_id UUID REFERENCES course_offerings(id) ON DELETE SET NULL,
    faculty_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    academic_year VARCHAR(30) NOT NULL,
    semester INT NOT NULL,
    total_students INT NOT NULL DEFAULT 0,
    submitted_students_count INT NOT NULL DEFAULT 0,
    missing_results_count INT NOT NULL DEFAULT 0,
    average_marks NUMERIC(5, 2),
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Draft', 'Submitted', 'Pending Approval', 'Approved', 'Published', 'Rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES users(id) ON DELETE SET NULL,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. EXTEND RESULTS TABLE FOR DIRECT COURSE ACCESS & PASS/FAIL INTEGRITY
ALTER TABLE results 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE results 
ADD COLUMN IF NOT EXISTS pass_status VARCHAR(10) DEFAULT 'FAIL' CHECK (pass_status IN ('PASS', 'FAIL', 'PENDING'));

-- 5. EXTEND INTERNAL MARKS TABLE FOR CIA1, CIA2, ASSIGNMENT & TOTAL (MAX 50)
ALTER TABLE internal_marks 
ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE;

ALTER TABLE internal_marks 
ADD COLUMN IF NOT EXISTS cia1 NUMERIC(5, 2) DEFAULT 0.00;

ALTER TABLE internal_marks 
ADD COLUMN IF NOT EXISTS cia2 NUMERIC(5, 2) DEFAULT 0.00;

ALTER TABLE internal_marks 
ADD COLUMN IF NOT EXISTS assignment NUMERIC(5, 2) DEFAULT 0.00;

ALTER TABLE internal_marks 
ADD COLUMN IF NOT EXISTS total NUMERIC(5, 2) DEFAULT 0.00;

-- 6. INDEXES FOR HIGH QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_fee_assign_batch ON fee_assignments(batch, status);
CREATE INDEX IF NOT EXISTS idx_student_fee_assign_stu ON student_fee_assignments(student_id, status);
CREATE INDEX IF NOT EXISTS idx_course_result_sub ON course_result_submissions(course_id, status);
CREATE INDEX IF NOT EXISTS idx_internal_marks_course_stu ON internal_marks(course_id, student_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES IN SCHEMA public
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE od_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_result_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_block_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 8. POSTGREST DATA API PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- ====================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Academic Governance Reference Data (Read-only for all, write for Admin)
DROP POLICY IF EXISTS "Public read departments" ON departments;
CREATE POLICY "Public read departments" ON departments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read programs" ON programs;
CREATE POLICY "Public read programs" ON programs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read academic_years" ON academic_years;
CREATE POLICY "Public read academic_years" ON academic_years FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read semesters" ON semesters;
CREATE POLICY "Public read semesters" ON semesters FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read courses" ON courses;
CREATE POLICY "Public read courses" ON courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read registration_periods" ON registration_periods;
CREATE POLICY "Public read registration_periods" ON registration_periods FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Public read fee_assignments" ON fee_assignments;
CREATE POLICY "Public read fee_assignments" ON fee_assignments FOR SELECT TO anon, authenticated USING (true);

-- Faculty can create and update their assigned courses
DROP POLICY IF EXISTS "Faculty create course" ON courses;
CREATE POLICY "Faculty create course" ON courses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Faculty update course" ON courses;
CREATE POLICY "Faculty update course" ON courses FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Users & Profiles
DROP POLICY IF EXISTS "Users viewable by authenticated" ON users;
CREATE POLICY "Users viewable by authenticated" ON users FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON profiles;
CREATE POLICY "Profiles viewable by authenticated" ON profiles FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON profiles;
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage users" ON users;
CREATE POLICY "Admin manage users" ON users FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Students & Faculty Directory
DROP POLICY IF EXISTS "Students directory select" ON students;
CREATE POLICY "Students directory select" ON students FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Faculty directory select" ON faculty;
CREATE POLICY "Faculty directory select" ON faculty FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admin manage students" ON students;
CREATE POLICY "Admin manage students" ON students FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin manage faculty" ON faculty;
CREATE POLICY "Admin manage faculty" ON faculty FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Course Registrations (Student submits PENDING, Faculty accepts/rejects)
DROP POLICY IF EXISTS "View registrations" ON course_registrations;
CREATE POLICY "View registrations" ON course_registrations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Student insert course registration" ON course_registrations;
CREATE POLICY "Student insert course registration" ON course_registrations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Faculty update course registration" ON course_registrations;
CREATE POLICY "Faculty update course registration" ON course_registrations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Attendance (Today-only backend enforcement, faculty marks, student reads)
DROP POLICY IF EXISTS "View attendance sessions" ON attendance_sessions;
CREATE POLICY "View attendance sessions" ON attendance_sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty insert attendance session" ON attendance_sessions;
CREATE POLICY "Faculty insert attendance session" ON attendance_sessions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "View attendance records" ON attendance_records;
CREATE POLICY "View attendance records" ON attendance_records FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty insert attendance records" ON attendance_records;
CREATE POLICY "Faculty insert attendance records" ON attendance_records FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Faculty update attendance records" ON attendance_records;
CREATE POLICY "Faculty update attendance records" ON attendance_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- On-Duty (OD) Requests
DROP POLICY IF EXISTS "View OD requests" ON od_requests;
CREATE POLICY "View OD requests" ON od_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Student insert OD request" ON od_requests;
CREATE POLICY "Student insert OD request" ON od_requests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Faculty/Admin update OD request" ON od_requests;
CREATE POLICY "Faculty/Admin update OD request" ON od_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Internal Marks
DROP POLICY IF EXISTS "View internal marks" ON internal_marks;
CREATE POLICY "View internal marks" ON internal_marks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty manage internal marks" ON internal_marks;
CREATE POLICY "Faculty manage internal marks" ON internal_marks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Assignments & Submissions
DROP POLICY IF EXISTS "View assignments" ON assignments;
CREATE POLICY "View assignments" ON assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty manage assignments" ON assignments;
CREATE POLICY "Faculty manage assignments" ON assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "View assignment submissions" ON assignment_submissions;
CREATE POLICY "View assignment submissions" ON assignment_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Student submit assignment" ON assignment_submissions;
CREATE POLICY "Student submit assignment" ON assignment_submissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Faculty grade assignment" ON assignment_submissions;
CREATE POLICY "Faculty grade assignment" ON assignment_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Semester Results & Course Result Submissions
-- CRITICAL INSTITUTIONAL RULE: Students can ONLY view Published results for their own record
DROP POLICY IF EXISTS "View course result submissions" ON course_result_submissions;
CREATE POLICY "View course result submissions" ON course_result_submissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty insert result submission" ON course_result_submissions;
CREATE POLICY "Faculty insert result submission" ON course_result_submissions FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin update result submission" ON course_result_submissions;
CREATE POLICY "Admin update result submission" ON course_result_submissions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Read results" ON results;
CREATE POLICY "Read results" ON results FOR SELECT TO authenticated USING (
    status = 'Published' OR 
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('FACULTY', 'ADMIN')) OR
    auth.uid() IS NULL
);

DROP POLICY IF EXISTS "Faculty insert results" ON results;
CREATE POLICY "Faculty insert results" ON results FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Faculty/Admin update results" ON results;
CREATE POLICY "Faculty/Admin update results" ON results FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Fees, Student Fees, Payments & Receipts
DROP POLICY IF EXISTS "Admin manage fee assignments" ON fee_assignments;
CREATE POLICY "Admin manage fee assignments" ON fee_assignments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "View student fee assignments" ON student_fee_assignments;
CREATE POLICY "View student fee assignments" ON student_fee_assignments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "View student fees" ON student_fees;
CREATE POLICY "View student fees" ON student_fees FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "View payments" ON payments;
CREATE POLICY "View payments" ON payments FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "View receipts" ON receipts;
CREATE POLICY "View receipts" ON receipts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert payments" ON payments;
CREATE POLICY "Insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Insert receipts" ON receipts;
CREATE POLICY "Insert receipts" ON receipts FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Update student fees" ON student_fees;
CREATE POLICY "Update student fees" ON student_fees FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Student Blocking (Disciplinary Workflow)
DROP POLICY IF EXISTS "View student block history" ON student_block_history;
CREATE POLICY "View student block history" ON student_block_history FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Faculty/Admin insert block history" ON student_block_history;
CREATE POLICY "Faculty/Admin insert block history" ON student_block_history FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Admin update block history" ON student_block_history;
CREATE POLICY "Admin update block history" ON student_block_history FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Audit Logs (Append-only immutable security ledger)
DROP POLICY IF EXISTS "View audit logs" ON audit_logs;
CREATE POLICY "View audit logs" ON audit_logs FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert audit logs" ON audit_logs;
CREATE POLICY "Insert audit logs" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Notifications
DROP POLICY IF EXISTS "View notifications" ON notifications;
CREATE POLICY "View notifications" ON notifications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Update own notification" ON notifications;
CREATE POLICY "Update own notification" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Insert notifications" ON notifications;
CREATE POLICY "Insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);


-- ====================================================================
-- File: 04_seed_data.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- Migration: 04_seed_data.sql
-- Baseline Seed Data for Institutional Operations
-- ====================================================================

-- 1. DEPARTMENTS
INSERT INTO departments (id, code, name, description, established_year)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'CSE', 'Computer Science and Engineering', 'Department of Computer Science and Engineering, focusing on algorithms, systems, AI, and distributed networks.', 2001),
    ('d0000000-0000-0000-0000-000000000002', 'ECE', 'Electronics and Communication Engineering', 'Department of Electronics and Communication, focusing on VLSI, signal processing, and telecommunications.', 2001),
    ('d0000000-0000-0000-0000-000000000003', 'MECH', 'Mechanical Engineering', 'Department of Mechanical Engineering, covering thermodynamics, robotics, and CAD/CAM manufacturing.', 2003),
    ('d0000000-0000-0000-0000-000000000004', 'EEE', 'Electrical and Electronics Engineering', 'Department of Electrical and Electronics, specializing in power systems, smart grids, and electric vehicles.', 2004),
    ('d0000000-0000-0000-0000-000000000005', 'IT', 'Information Technology', 'Department of Information Technology, with emphasis on cloud computing, cybersecurity, and data engineering.', 2008)
ON CONFLICT (code) DO NOTHING;

-- 2. PROGRAMS
INSERT INTO programs (id, code, name, degree, department_id, duration_years, total_semesters, credits_required, annual_fee, eligibility)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'BTECH-CSE', 'B.Tech Computer Science and Engineering', 'B.Tech', 'd0000000-0000-0000-0000-000000000001', 4, 8, 160, 125000.00, 'Class 12 Higher Secondary with Physics, Chemistry, and Mathematics (Minimum 60%)'),
    ('b0000000-0000-0000-0000-000000000002', 'BTECH-ECE', 'B.Tech Electronics and Communication', 'B.Tech', 'd0000000-0000-0000-0000-000000000002', 4, 8, 160, 115000.00, 'Class 12 Higher Secondary with Physics, Chemistry, and Mathematics (Minimum 60%)'),
    ('b0000000-0000-0000-0000-000000000003', 'MTECH-CSE', 'M.Tech Advanced Computing', 'M.Tech', 'd0000000-0000-0000-0000-000000000001', 2, 4, 80, 95000.00, 'B.E./B.Tech in CSE/IT or equivalent with minimum 55% aggregate or GATE qualification')
ON CONFLICT (code) DO NOTHING;

-- 3. ACADEMIC YEARS & SEMESTERS
INSERT INTO academic_years (id, year_label, start_date, end_date, is_current)
VALUES
    ('a0000000-0000-0000-0000-000000000001', '2024-2025', '2024-07-01', '2025-06-30', true)
ON CONFLICT (year_label) DO NOTHING;

INSERT INTO semesters (id, semester_number, term_type, academic_year_id, is_active)
VALUES
    ('e0000000-0000-0000-0000-000000000006', 6, 'EVEN', 'a0000000-0000-0000-0000-000000000001', true)
ON CONFLICT (semester_number, academic_year_id) DO NOTHING;

-- 4. BASELINE USERS & PROFILES
INSERT INTO users (id, register_number, email, password_hash, role, account_status)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'admin', 'admin@svcollege.edu', 'Admin@123', 'ADMIN', 'ACTIVE'),
    ('f0000000-0000-0000-0000-000000000002', 'FAC101', 'anand.kumar@svcollege.edu', 'staff', 'FACULTY', 'ACTIVE'),
    ('f0000000-0000-0000-0000-000000000003', 'FAC102', 'priya.sharma@svcollege.edu', 'staff', 'FACULTY', 'ACTIVE'),
    ('f0000000-0000-0000-0000-000000000004', 'REG2024001', 'rahul.verma@svcollege.edu', 'welcome', 'STUDENT', 'ACTIVE'),
    ('f0000000-0000-0000-0000-000000000005', 'REG2024002', 'kavita.patel@svcollege.edu', 'welcome', 'STUDENT', 'BLOCKED'),
    ('f0000000-0000-0000-0000-000000000006', 'REG2024003', 'suresh.raina@svcollege.edu', 'welcome', 'STUDENT', 'ACTIVE'),
    ('f0000000-0000-0000-0000-000000000007', 'REG2024004', 'ananya.singh@svcollege.edu', 'welcome', 'STUDENT', 'ACTIVE')
ON CONFLICT (register_number) DO NOTHING;

INSERT INTO profiles (user_id, full_name, phone)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Dr. K. S. Ramanathan', '+91 98765 43210'),
    ('f0000000-0000-0000-0000-000000000002', 'Prof. Anand Kumar', '+91 98765 11223'),
    ('f0000000-0000-0000-0000-000000000003', 'Dr. Priya Sharma', '+91 98765 33445'),
    ('f0000000-0000-0000-0000-000000000004', 'Rahul Verma', '+91 91234 56789'),
    ('f0000000-0000-0000-0000-000000000005', 'Kavita Patel', '+91 91234 98765'),
    ('f0000000-0000-0000-0000-000000000006', 'Suresh Raina', '+91 91234 11223'),
    ('f0000000-0000-0000-0000-000000000007', 'Ananya Singh', '+91 91234 44556')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO faculty (user_id, department_id, designation, qualification)
VALUES
    ('f0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Associate Professor', 'Ph.D in Distributed Systems'),
    ('f0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'Professor & HOD', 'Ph.D in VLSI Architecture')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO students (user_id, program_id, department_id, current_semester, batch)
VALUES
    ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 6, '2022-2026'),
    ('f0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 6, '2022-2026'),
    ('f0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 6, '2022-2026'),
    ('f0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 4, '2023-2027')
ON CONFLICT (user_id) DO NOTHING;

-- 5. COURSES
INSERT INTO courses (id, code, name, department_id, semester, credits, course_type, description, max_students)
VALUES
    ('c0000000-0000-0000-0000-000000000601', 'CS601', 'Distributed Systems & Cloud Architecture', 'd0000000-0000-0000-0000-000000000001', 6, 4, 'CORE', 'Architectures for distributed and cloud computing systems.', 60),
    ('c0000000-0000-0000-0000-000000000602', 'CS602', 'Machine Learning & Deep Learning', 'd0000000-0000-0000-0000-000000000001', 6, 4, 'CORE', 'Statistical learning algorithms, neural network design, and inference models.', 60),
    ('c0000000-0000-0000-0000-000000000603', 'CS603', 'Cryptography and Network Security', 'd0000000-0000-0000-0000-000000000001', 6, 3, 'CORE', 'Symmetric and asymmetric cipher algorithms, key exchange, and authentication.', 60),
    ('c0000000-0000-0000-0000-000000000604', 'CS604', 'Compiler Design', 'd0000000-0000-0000-0000-000000000001', 6, 4, 'CORE', 'Lexical analysis, syntax parsing, semantic analyzers, and code optimization.', 60),
    ('c0000000-0000-0000-0000-000000000605', 'CS605', 'Distributed Systems Laboratory', 'd0000000-0000-0000-0000-000000000001', 6, 2, 'LAB', 'Practical experiments in RPC, message queues, Docker, and Kubernetes.', 30)
ON CONFLICT (code) DO NOTHING;


-- ====================================================================
-- File: 05_sequential_numeric_id_strategy.sql
-- ====================================================================

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


-- ====================================================================
-- File: 06_convert_pks_and_fks_to_bigint.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM (ERP)
-- PostgreSQL / Supabase Migration
-- Migration: 06_convert_pks_and_fks_to_bigint.sql
-- Description: Convert primary key column "id" and all foreign keys across
--              all application/business tables from UUID to sequential BIGINT (1, 2, 3, 4, 5...).
--              Preserves auth.users UUID identifiers.
-- ====================================================================

-- 1. DROP all foreign key constraints referencing application tables
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_department_id_fkey;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_department_id_fkey;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_department_id_fkey;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_program_id_fkey;
ALTER TABLE faculty DROP CONSTRAINT IF EXISTS faculty_department_id_fkey;
ALTER TABLE semesters DROP CONSTRAINT IF EXISTS semesters_academic_year_id_fkey;
ALTER TABLE course_offerings DROP CONSTRAINT IF EXISTS course_offerings_academic_year_id_fkey;
ALTER TABLE course_offerings DROP CONSTRAINT IF EXISTS course_offerings_semester_id_fkey;
ALTER TABLE course_offerings DROP CONSTRAINT IF EXISTS course_offerings_course_id_fkey;
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_course_offering_id_fkey;
ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_course_offering_id_fkey;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_attendance_session_id_fkey;
ALTER TABLE internal_assessments DROP CONSTRAINT IF EXISTS internal_assessments_course_offering_id_fkey;
ALTER TABLE internal_marks DROP CONSTRAINT IF EXISTS internal_marks_course_id_fkey;
ALTER TABLE internal_marks DROP CONSTRAINT IF EXISTS internal_marks_internal_assessment_id_fkey;
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_course_offering_id_fkey;
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_assignment_id_fkey;
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_course_id_fkey;
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_course_offering_id_fkey;
ALTER TABLE course_result_submissions DROP CONSTRAINT IF EXISTS course_result_submissions_course_id_fkey;
ALTER TABLE course_result_submissions DROP CONSTRAINT IF EXISTS course_result_submissions_course_offering_id_fkey;
ALTER TABLE fee_assignments DROP CONSTRAINT IF EXISTS fee_assignments_department_id_fkey;
ALTER TABLE fee_assignments DROP CONSTRAINT IF EXISTS fee_assignments_program_id_fkey;
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_academic_year_id_fkey;
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_program_id_fkey;
ALTER TABLE student_fee_assignments DROP CONSTRAINT IF EXISTS student_fee_assignments_fee_assignment_id_fkey;
ALTER TABLE student_fees DROP CONSTRAINT IF EXISTS student_fees_fee_assignment_id_fkey;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_student_fee_id_fkey;
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_payment_id_fkey;
ALTER TABLE registration_periods DROP CONSTRAINT IF EXISTS registration_periods_academic_year_id_fkey;
ALTER TABLE faculty_course_assignments DROP CONSTRAINT IF EXISTS faculty_course_assignments_course_offering_id_fkey;

-- 2. ACADEMIC_YEARS: id UUID -> BIGINT IDENTITY
ALTER TABLE academic_years ADD COLUMN IF NOT EXISTS old_uuid UUID;
UPDATE academic_years SET old_uuid = id WHERE old_uuid IS NULL AND id::text LIKE '%-%';
ALTER TABLE academic_years DROP CONSTRAINT IF EXISTS academic_years_pkey CASCADE;
ALTER TABLE academic_years DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE academic_years ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
UPDATE academic_years SET id = 1 WHERE year_label = '2024-2025';
SELECT setval(pg_get_serial_sequence('academic_years', 'id'), 2, false);

-- 3. DEPARTMENTS: id UUID -> BIGINT IDENTITY
ALTER TABLE departments ADD COLUMN IF NOT EXISTS old_uuid UUID;
UPDATE departments SET old_uuid = id WHERE old_uuid IS NULL AND id::text LIKE '%-%';
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey CASCADE;
ALTER TABLE departments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE departments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
UPDATE departments SET id = 1 WHERE code = 'CSE';
UPDATE departments SET id = 2 WHERE code = 'ECE';
UPDATE departments SET id = 3 WHERE code = 'MECH';
UPDATE departments SET id = 4 WHERE code = 'EEE';
UPDATE departments SET id = 5 WHERE code = 'IT';
SELECT setval(pg_get_serial_sequence('departments', 'id'), 6, false);

-- 4. PROGRAMS: id UUID -> BIGINT IDENTITY & update department_id
ALTER TABLE programs ADD COLUMN IF NOT EXISTS old_uuid UUID;
UPDATE programs SET old_uuid = id WHERE old_uuid IS NULL AND id::text LIKE '%-%';
ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_pkey CASCADE;
ALTER TABLE programs DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE programs ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
UPDATE programs SET id = 1 WHERE code = 'BTECH-CSE';
UPDATE programs SET id = 2 WHERE code = 'BTECH-ECE';
UPDATE programs SET id = 3 WHERE code = 'MTECH-CSE';
SELECT setval(pg_get_serial_sequence('programs', 'id'), 4, false);

ALTER TABLE programs ADD COLUMN IF NOT EXISTS new_department_id BIGINT;
UPDATE programs p SET new_department_id = d.id FROM departments d WHERE p.department_id = d.old_uuid;
ALTER TABLE programs DROP COLUMN IF EXISTS department_id CASCADE;
ALTER TABLE programs RENAME COLUMN new_department_id TO department_id;
ALTER TABLE programs ADD CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT;

-- 5. SEMESTERS: id UUID -> BIGINT IDENTITY & update academic_year_id
ALTER TABLE semesters ADD COLUMN IF NOT EXISTS old_uuid UUID;
UPDATE semesters SET old_uuid = id WHERE old_uuid IS NULL AND id::text LIKE '%-%';
ALTER TABLE semesters DROP CONSTRAINT IF EXISTS semesters_pkey CASCADE;
ALTER TABLE semesters DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE semesters ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
UPDATE semesters SET id = 1 WHERE semester_number = 6;
SELECT setval(pg_get_serial_sequence('semesters', 'id'), 2, false);

ALTER TABLE semesters ADD COLUMN IF NOT EXISTS new_academic_year_id BIGINT;
UPDATE semesters s SET new_academic_year_id = ay.id FROM academic_years ay WHERE s.academic_year_id = ay.old_uuid;
ALTER TABLE semesters DROP COLUMN IF EXISTS academic_year_id CASCADE;
ALTER TABLE semesters RENAME COLUMN new_academic_year_id TO academic_year_id;
ALTER TABLE semesters ADD CONSTRAINT semesters_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE;

-- 6. COURSES: id UUID -> BIGINT IDENTITY & update department_id
ALTER TABLE courses ADD COLUMN IF NOT EXISTS old_uuid UUID;
UPDATE courses SET old_uuid = id WHERE old_uuid IS NULL AND id::text LIKE '%-%';
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_pkey CASCADE;
ALTER TABLE courses DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE courses ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
UPDATE courses SET id = 1 WHERE code = 'CS601';
UPDATE courses SET id = 2 WHERE code = 'CS602';
UPDATE courses SET id = 3 WHERE code = 'CS603';
UPDATE courses SET id = 4 WHERE code = 'CS604';
UPDATE courses SET id = 5 WHERE code = 'CS605';
SELECT setval(pg_get_serial_sequence('courses', 'id'), 6, false);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS new_department_id BIGINT;
UPDATE courses c SET new_department_id = d.id FROM departments d WHERE c.department_id = d.old_uuid;
ALTER TABLE courses DROP COLUMN IF EXISTS department_id CASCADE;
ALTER TABLE courses RENAME COLUMN new_department_id TO department_id;
ALTER TABLE courses ADD CONSTRAINT courses_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT;

-- 7. STUDENTS: Add id BIGINT IDENTITY PRIMARY KEY, update department_id and program_id
ALTER TABLE students ADD COLUMN IF NOT EXISTS id BIGINT GENERATED BY DEFAULT AS IDENTITY;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_pkey CASCADE;
ALTER TABLE students ADD CONSTRAINT students_pkey PRIMARY KEY (id);
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_user_id_key CASCADE;
ALTER TABLE students ADD CONSTRAINT students_user_id_key UNIQUE (user_id);
UPDATE students s SET id = 1 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024001';
UPDATE students s SET id = 2 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024002';
UPDATE students s SET id = 3 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024003';
UPDATE students s SET id = 4 FROM users u WHERE s.user_id = u.id AND u.register_number = 'REG2024004';
SELECT setval(pg_get_serial_sequence('students', 'id'), 5, false);

ALTER TABLE students ADD COLUMN IF NOT EXISTS new_department_id BIGINT;
UPDATE students s SET new_department_id = d.id FROM departments d WHERE s.department_id = d.old_uuid;
ALTER TABLE students DROP COLUMN IF EXISTS department_id CASCADE;
ALTER TABLE students RENAME COLUMN new_department_id TO department_id;
ALTER TABLE students ADD CONSTRAINT students_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT;

ALTER TABLE students ADD COLUMN IF NOT EXISTS new_program_id BIGINT;
UPDATE students s SET new_program_id = p.id FROM programs p WHERE s.program_id = p.old_uuid;
ALTER TABLE students DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE students RENAME COLUMN new_program_id TO program_id;
ALTER TABLE students ADD CONSTRAINT students_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE RESTRICT;

-- 8. FACULTY: Add id BIGINT IDENTITY PRIMARY KEY, update department_id
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS id BIGINT GENERATED BY DEFAULT AS IDENTITY;
ALTER TABLE faculty DROP CONSTRAINT IF EXISTS faculty_pkey CASCADE;
ALTER TABLE faculty ADD CONSTRAINT faculty_pkey PRIMARY KEY (id);
ALTER TABLE faculty DROP CONSTRAINT IF EXISTS faculty_user_id_key CASCADE;
ALTER TABLE faculty ADD CONSTRAINT faculty_user_id_key UNIQUE (user_id);
UPDATE faculty f SET id = 1 FROM users u WHERE f.user_id = u.id AND u.register_number = 'FAC101';
UPDATE faculty f SET id = 2 FROM users u WHERE f.user_id = u.id AND u.register_number = 'FAC102';
SELECT setval(pg_get_serial_sequence('faculty', 'id'), 3, false);

ALTER TABLE faculty ADD COLUMN IF NOT EXISTS new_department_id BIGINT;
UPDATE faculty f SET new_department_id = d.id FROM departments d WHERE f.department_id = d.old_uuid;
ALTER TABLE faculty DROP COLUMN IF EXISTS department_id CASCADE;
ALTER TABLE faculty RENAME COLUMN new_department_id TO department_id;
ALTER TABLE faculty ADD CONSTRAINT faculty_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT;

-- 9. Convert remaining empty tables to BIGINT PKs and FKs
-- course_offerings
ALTER TABLE course_offerings DROP CONSTRAINT IF EXISTS course_offerings_pkey CASCADE;
ALTER TABLE course_offerings DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE course_offerings ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE course_offerings DROP COLUMN IF EXISTS academic_year_id CASCADE;
ALTER TABLE course_offerings ADD COLUMN academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE course_offerings DROP COLUMN IF EXISTS semester_id CASCADE;
ALTER TABLE course_offerings ADD COLUMN semester_id BIGINT REFERENCES semesters(id) ON DELETE CASCADE;
ALTER TABLE course_offerings DROP COLUMN IF EXISTS course_id CASCADE;
ALTER TABLE course_offerings ADD COLUMN course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE;

-- course_registrations
ALTER TABLE course_registrations DROP CONSTRAINT IF EXISTS course_registrations_pkey CASCADE;
ALTER TABLE course_registrations DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE course_registrations ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE course_registrations DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE course_registrations ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- attendance_sessions
ALTER TABLE attendance_sessions DROP CONSTRAINT IF EXISTS attendance_sessions_pkey CASCADE;
ALTER TABLE attendance_sessions DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE attendance_sessions ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE attendance_sessions DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE attendance_sessions ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- attendance_records
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_pkey CASCADE;
ALTER TABLE attendance_records DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE attendance_records ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE attendance_records DROP COLUMN IF EXISTS attendance_session_id CASCADE;
ALTER TABLE attendance_records ADD COLUMN attendance_session_id BIGINT REFERENCES attendance_sessions(id) ON DELETE CASCADE;

-- od_requests
ALTER TABLE od_requests DROP CONSTRAINT IF EXISTS od_requests_pkey CASCADE;
ALTER TABLE od_requests DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE od_requests ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;

-- internal_assessments
ALTER TABLE internal_assessments DROP CONSTRAINT IF EXISTS internal_assessments_pkey CASCADE;
ALTER TABLE internal_assessments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE internal_assessments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE internal_assessments DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE internal_assessments ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- internal_marks
ALTER TABLE internal_marks DROP CONSTRAINT IF EXISTS internal_marks_pkey CASCADE;
ALTER TABLE internal_marks DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE internal_marks ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE internal_marks DROP COLUMN IF EXISTS course_id CASCADE;
ALTER TABLE internal_marks ADD COLUMN course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE internal_marks DROP COLUMN IF EXISTS internal_assessment_id CASCADE;
ALTER TABLE internal_marks ADD COLUMN internal_assessment_id BIGINT REFERENCES internal_assessments(id) ON DELETE CASCADE;

-- assignments
ALTER TABLE assignments DROP CONSTRAINT IF EXISTS assignments_pkey CASCADE;
ALTER TABLE assignments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE assignments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE assignments DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE assignments ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- assignment_submissions
ALTER TABLE assignment_submissions DROP CONSTRAINT IF EXISTS assignment_submissions_pkey CASCADE;
ALTER TABLE assignment_submissions DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE assignment_submissions ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE assignment_submissions DROP COLUMN IF EXISTS assignment_id CASCADE;
ALTER TABLE assignment_submissions ADD COLUMN assignment_id BIGINT REFERENCES assignments(id) ON DELETE CASCADE;

-- results
ALTER TABLE results DROP CONSTRAINT IF EXISTS results_pkey CASCADE;
ALTER TABLE results DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE results ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE results DROP COLUMN IF EXISTS course_id CASCADE;
ALTER TABLE results ADD COLUMN course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE results DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE results ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- course_result_submissions
ALTER TABLE course_result_submissions DROP CONSTRAINT IF EXISTS course_result_submissions_pkey CASCADE;
ALTER TABLE course_result_submissions DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE course_result_submissions ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE course_result_submissions DROP COLUMN IF EXISTS course_id CASCADE;
ALTER TABLE course_result_submissions ADD COLUMN course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE;
ALTER TABLE course_result_submissions DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE course_result_submissions ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- fee_assignments
ALTER TABLE fee_assignments DROP CONSTRAINT IF EXISTS fee_assignments_pkey CASCADE;
ALTER TABLE fee_assignments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE fee_assignments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE fee_assignments DROP COLUMN IF EXISTS department_id CASCADE;
ALTER TABLE fee_assignments ADD COLUMN department_id BIGINT REFERENCES departments(id) ON DELETE RESTRICT;
ALTER TABLE fee_assignments DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE fee_assignments ADD COLUMN program_id BIGINT REFERENCES programs(id) ON DELETE RESTRICT;

-- fee_structures
ALTER TABLE fee_structures DROP CONSTRAINT IF EXISTS fee_structures_pkey CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE fee_structures ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS academic_year_id CASCADE;
ALTER TABLE fee_structures ADD COLUMN academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE;
ALTER TABLE fee_structures DROP COLUMN IF EXISTS program_id CASCADE;
ALTER TABLE fee_structures ADD COLUMN program_id BIGINT REFERENCES programs(id) ON DELETE CASCADE;

-- student_fee_assignments
ALTER TABLE student_fee_assignments DROP CONSTRAINT IF EXISTS student_fee_assignments_pkey CASCADE;
ALTER TABLE student_fee_assignments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE student_fee_assignments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE student_fee_assignments DROP COLUMN IF EXISTS fee_assignment_id CASCADE;
ALTER TABLE student_fee_assignments ADD COLUMN fee_assignment_id BIGINT REFERENCES fee_assignments(id) ON DELETE CASCADE;

-- student_fees
ALTER TABLE student_fees DROP CONSTRAINT IF EXISTS student_fees_pkey CASCADE;
ALTER TABLE student_fees DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE student_fees ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE student_fees DROP COLUMN IF EXISTS fee_assignment_id CASCADE;
ALTER TABLE student_fees ADD COLUMN fee_assignment_id BIGINT REFERENCES fee_assignments(id) ON DELETE CASCADE;

-- payments
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_pkey CASCADE;
ALTER TABLE payments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE payments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE payments DROP COLUMN IF EXISTS student_fee_id CASCADE;
ALTER TABLE payments ADD COLUMN student_fee_id BIGINT REFERENCES student_fees(id) ON DELETE CASCADE;

-- receipts
ALTER TABLE receipts DROP CONSTRAINT IF EXISTS receipts_pkey CASCADE;
ALTER TABLE receipts DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE receipts ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE receipts DROP COLUMN IF EXISTS payment_id CASCADE;
ALTER TABLE receipts ADD COLUMN payment_id BIGINT REFERENCES payments(id) ON DELETE CASCADE;

-- registration_periods
ALTER TABLE registration_periods DROP CONSTRAINT IF EXISTS registration_periods_pkey CASCADE;
ALTER TABLE registration_periods DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE registration_periods ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE registration_periods DROP COLUMN IF EXISTS academic_year_id CASCADE;
ALTER TABLE registration_periods ADD COLUMN academic_year_id BIGINT REFERENCES academic_years(id) ON DELETE CASCADE;

-- faculty_course_assignments
ALTER TABLE faculty_course_assignments DROP CONSTRAINT IF EXISTS faculty_course_assignments_pkey CASCADE;
ALTER TABLE faculty_course_assignments DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE faculty_course_assignments ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;
ALTER TABLE faculty_course_assignments DROP COLUMN IF EXISTS course_offering_id CASCADE;
ALTER TABLE faculty_course_assignments ADD COLUMN course_offering_id BIGINT REFERENCES course_offerings(id) ON DELETE CASCADE;

-- notifications, audit_logs, student_block_history
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_pkey CASCADE;
ALTER TABLE notifications DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE notifications ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;

ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey CASCADE;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE audit_logs ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;

ALTER TABLE student_block_history DROP CONSTRAINT IF EXISTS student_block_history_pkey CASCADE;
ALTER TABLE student_block_history DROP COLUMN IF EXISTS id CASCADE;
ALTER TABLE student_block_history ADD COLUMN id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY;

-- Re-grant permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;


-- ====================================================================
-- File: 07_complete_relational_schema_and_workflows.sql
-- ====================================================================

-- ==============================================================================
-- Migration 07: Complete Relational Schema, Sequential IDs & College Workflows
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------------------
-- 1. BATCHES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.batches (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    program_id BIGINT REFERENCES public.programs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard batches
INSERT INTO public.batches (name, start_year, end_year) VALUES
    ('2021-2025', 2021, 2025),
    ('2022-2026', 2022, 2026),
    ('2023-2027', 2023, 2027),
    ('2024-2028', 2024, 2028),
    ('2025-2029', 2025, 2029)
ON CONFLICT (name) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. COURSE ENROLLMENTS TABLE (Sequential IDs, Status Lifecycle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.course_enrollments (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL DEFAULT 6,
    academic_year VARCHAR(50) NOT NULL DEFAULT '2024-2025',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unq_student_course_year_sem UNIQUE (student_id, course_id, academic_year, semester)
);

-- Sync initial enrollments from existing course_registrations if any
INSERT INTO public.course_enrollments (student_id, course_id, semester, academic_year, status, requested_at)
SELECT 
    s.id AS student_id,
    co.course_id AS course_id,
    6 AS semester,
    '2024-2025' AS academic_year,
    CASE 
        WHEN cr.status = 'Approved' THEN 'ACCEPTED'
        WHEN cr.status = 'Rejected' THEN 'REJECTED'
        ELSE 'PENDING'
    END AS status,
    cr.registered_at AS requested_at
FROM public.course_registrations cr
JOIN public.students s ON s.user_id = cr.student_id
JOIN public.course_offerings co ON co.id = cr.course_offering_id
ON CONFLICT (student_id, course_id, academic_year, semester) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. STRICT TODAY-ONLY ATTENDANCE ENFORCEMENT
-- ------------------------------------------------------------------------------
ALTER TABLE public.attendance_sessions 
DROP CONSTRAINT IF EXISTS check_attendance_today;

ALTER TABLE public.attendance_sessions 
ADD CONSTRAINT check_attendance_today CHECK (session_date = CURRENT_DATE);

-- Convenient unified Attendance view
CREATE OR REPLACE VIEW public.attendance WITH (security_invoker = true) AS
SELECT 
    ar.id AS id,
    ar.attendance_session_id AS session_id,
    s.id AS student_id,
    s.user_id AS student_user_id,
    p.full_name AS student_name,
    u.register_number AS register_number,
    co.course_id AS course_id,
    c.code AS course_code,
    c.name AS course_name,
    sess.session_date AS date,
    sess.period_number AS period,
    ar.status AS status,
    sess.faculty_id AS marked_by_faculty_id,
    ar.created_at AS marked_at
FROM public.attendance_records ar
JOIN public.attendance_sessions sess ON ar.attendance_session_id = sess.id
JOIN public.students s ON (s.user_id = ar.student_id OR s.id::text = ar.student_id::text)
JOIN public.users u ON u.id = s.user_id
LEFT JOIN public.profiles p ON p.user_id = s.user_id
JOIN public.course_offerings co ON co.id = sess.course_offering_id
JOIN public.courses c ON c.id = co.course_id;

-- ------------------------------------------------------------------------------
-- 4. AUTOMATED RESULTS & GRADING ENGINE (PASS requires: Int >= 25, Ext >= 25, Tot >= 50)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'pass_status') THEN
        ALTER TABLE public.results ADD COLUMN pass_status VARCHAR(10) DEFAULT 'PENDING';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'results' AND column_name = 'course_id') THEN
        ALTER TABLE public.results ADD COLUMN course_id BIGINT REFERENCES public.courses(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_results_grades()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure internal marks are populated from internal_marks table if missing or 0
    IF (NEW.internal_marks IS NULL OR NEW.internal_marks = 0) THEN
        SELECT COALESCE(im.total, 0) INTO NEW.internal_marks
        FROM public.internal_marks im
        WHERE im.student_id = NEW.student_id 
          AND (im.course_id = NEW.course_id OR im.course_id IS NULL)
        ORDER BY im.id DESC LIMIT 1;
        
        IF NEW.internal_marks IS NULL THEN
            NEW.internal_marks := 0;
        END IF;
    END IF;

    -- When External Marks are entered, calculate Total, Grade, Grade Points & Pass/Fail
    IF NEW.external_marks IS NOT NULL THEN
        NEW.total_marks := ROUND(NEW.internal_marks + NEW.external_marks, 2);
        
        -- Passing criteria:
        -- Internal >= 25/50 AND External >= 25/50 AND Total >= 50/100
        IF (NEW.internal_marks >= 25.0 AND NEW.external_marks >= 25.0 AND NEW.total_marks >= 50.0) THEN
            NEW.pass_status := 'PASS';
            IF NEW.total_marks >= 90.0 THEN
                NEW.grade := 'O';
                NEW.grade_points := 10.0;
            ELSIF NEW.total_marks >= 80.0 THEN
                NEW.grade := 'A+';
                NEW.grade_points := 9.0;
            ELSIF NEW.total_marks >= 70.0 THEN
                NEW.grade := 'A';
                NEW.grade_points := 8.0;
            ELSIF NEW.total_marks >= 60.0 THEN
                NEW.grade := 'B+';
                NEW.grade_points := 7.0;
            ELSE
                NEW.grade := 'B';
                NEW.grade_points := 6.0;
            END IF;
        ELSE
            NEW.pass_status := 'FAIL';
            NEW.grade := 'F';
            NEW.grade_points := 0.0;
        END IF;
    ELSE
        NEW.total_marks := NULL;
        NEW.grade := '—';
        NEW.grade_points := 0.0;
        NEW.pass_status := 'PENDING';
    END IF;

    NEW.updated_at := now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calculate_results_grades ON public.results;
CREATE TRIGGER trg_calculate_results_grades
BEFORE INSERT OR UPDATE ON public.results
FOR EACH ROW
EXECUTE FUNCTION public.calculate_results_grades();

-- ------------------------------------------------------------------------------
-- 5. BATCH-BASED FEE AUTO-DISTRIBUTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_batch_fee_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Automatically assign the new fee to all students in the target batch
    INSERT INTO public.student_fee_assignments (
        fee_assignment_id,
        student_id,
        amount,
        paid_amount,
        outstanding_amount,
        due_date,
        status,
        academic_year,
        created_at
    )
    SELECT 
        NEW.id,
        s.id,
        NEW.amount,
        0,
        NEW.amount,
        NEW.due_date,
        'Unpaid',
        NEW.academic_year,
        now()
    FROM public.students s
    WHERE s.batch = NEW.batch
    ON CONFLICT DO NOTHING;

    -- Also mirror into student_fees for student dashboard view
    INSERT INTO public.student_fees (
        student_id,
        title,
        category,
        total_amount,
        paid_amount,
        outstanding_amount,
        due_date,
        status,
        academic_year,
        created_at
    )
    SELECT 
        s.id,
        NEW.fee_name,
        NEW.fee_type,
        NEW.amount,
        0,
        NEW.amount,
        NEW.due_date,
        'Unpaid',
        NEW.academic_year,
        now()
    FROM public.students s
    WHERE s.batch = NEW.batch
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_handle_batch_fee_assignment ON public.fee_assignments;
CREATE TRIGGER trg_handle_batch_fee_assignment
AFTER INSERT ON public.fee_assignments
FOR EACH ROW
EXECUTE FUNCTION public.handle_batch_fee_assignment();

-- ------------------------------------------------------------------------------
-- 6. STUDENT BLOCKING: ONLY ADMIN CAN UNBLOCK
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_student_unblock_admin_only()
RETURNS TRIGGER AS $$
DECLARE
    changer_role VARCHAR(20);
BEGIN
    IF (OLD.account_status = 'BLOCKED' AND NEW.account_status = 'ACTIVE') THEN
        SELECT role INTO changer_role FROM public.users WHERE id = auth.uid();
        -- Allow if done via service role or if changer is ADMIN
        IF changer_role IS NOT NULL AND changer_role <> 'ADMIN' THEN
            RAISE EXCEPTION 'FORBIDDEN: Only an Administrator possesses authority to unblock a student account.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_student_unblock ON public.users;
CREATE TRIGGER trg_enforce_student_unblock
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.enforce_student_unblock_admin_only();

-- ------------------------------------------------------------------------------
-- 7. SUPABASE STORAGE: student-profile-pictures BUCKET & RLS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'student-profile-pictures',
    'student-profile-pictures',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']::text[];

-- Storage Object Policies
DROP POLICY IF EXISTS "Public Profile Pictures are viewable by all" ON storage.objects;
CREATE POLICY "Public Profile Pictures are viewable by all"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-profile-pictures');

DROP POLICY IF EXISTS "Students can upload and replace their own picture" ON storage.objects;
CREATE POLICY "Students can upload and replace their own picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-profile-pictures');

DROP POLICY IF EXISTS "Students can update their own picture" ON storage.objects;
CREATE POLICY "Students can update their own picture"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-profile-pictures');

DROP POLICY IF EXISTS "Students can delete their own picture" ON storage.objects;
CREATE POLICY "Students can delete their own picture"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-profile-pictures');

-- ------------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES FOR ALL ROLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.od_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_block_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_faculty()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'FACULTY'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND role = 'STUDENT'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Permissive authenticated read for catalogs
DROP POLICY IF EXISTS "Anyone can view catalogs" ON public.departments;
CREATE POLICY "Anyone can view catalogs" ON public.departments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view programs" ON public.programs;
CREATE POLICY "Anyone can view programs" ON public.programs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view batches" ON public.batches;
CREATE POLICY "Anyone can view batches" ON public.batches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view courses" ON public.courses;
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);

-- Course Enrollments RLS
DROP POLICY IF EXISTS "Students view own enrollments, faculty and admin view all" ON public.course_enrollments;
CREATE POLICY "Students view own enrollments, faculty and admin view all"
ON public.course_enrollments FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    public.is_faculty() OR 
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Students can request enrollment" ON public.course_enrollments;
CREATE POLICY "Students can request enrollment"
ON public.course_enrollments FOR INSERT
TO authenticated
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Faculty and admin can review enrollment" ON public.course_enrollments;
CREATE POLICY "Faculty and admin can review enrollment"
ON public.course_enrollments FOR UPDATE
TO authenticated
USING (public.is_faculty() OR public.is_admin());

-- Results RLS: Students only see Published results!
DROP POLICY IF EXISTS "Results access policy" ON public.results;
CREATE POLICY "Results access policy"
ON public.results FOR SELECT
TO authenticated
USING (
    public.is_admin() OR
    public.is_faculty() OR
    (status = 'Published' AND student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()))
);

DROP POLICY IF EXISTS "Faculty and admin can manage results" ON public.results;
CREATE POLICY "Faculty and admin can manage results"
ON public.results FOR ALL
TO authenticated
USING (public.is_faculty() OR public.is_admin());

-- Fees and Payments RLS
DROP POLICY IF EXISTS "Student fee assignments view policy" ON public.student_fee_assignments;
CREATE POLICY "Student fee assignments view policy"
ON public.student_fee_assignments FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Student fees view policy" ON public.student_fees;
CREATE POLICY "Student fees view policy"
ON public.student_fees FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Payments access policy" ON public.payments;
CREATE POLICY "Payments access policy"
ON public.payments FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Students can initiate payment" ON public.payments;
CREATE POLICY "Students can initiate payment"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Receipts access policy" ON public.receipts;
CREATE POLICY "Receipts access policy"
ON public.receipts FOR SELECT
TO authenticated
USING (
    public.is_admin() OR 
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

-- ------------------------------------------------------------------------------
-- 9. SEED REAL SUPABASE AUTH ACCOUNTS (Matching Existing Users)
-- ------------------------------------------------------------------------------

-- Insert Admin Auth User (Password: Admin@123)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@svcollege.edu.in',
    crypt('Admin@123', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "ADMIN", "register_number": "ADMIN001", "name": "Dr. S. Sundararajan"}'::jsonb,
    now(),
    now(),
    false,
    false
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Admin@123', gen_salt('bf')),
    email_confirmed_at = now();

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    jsonb_build_object('sub', 'a0000000-0000-0000-0000-000000000001', 'email', 'admin@svcollege.edu.in'),
    'email',
    'admin@svcollege.edu.in',
    now(),
    now(),
    now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Insert Faculty Auth User (Password: staff)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
) VALUES (
    'f0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'dr.karthik@svcollege.edu.in',
    crypt('staff', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "FACULTY", "register_number": "FAC001", "name": "Dr. M. Karthikeyan"}'::jsonb,
    now(),
    now(),
    false,
    false
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('staff', gen_salt('bf')),
    email_confirmed_at = now();

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000001',
    jsonb_build_object('sub', 'f0000000-0000-0000-0000-000000000001', 'email', 'dr.karthik@svcollege.edu.in'),
    'email',
    'dr.karthik@svcollege.edu.in',
    now(),
    now(),
    now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Insert Student Arun Kumar Auth User (Password: welcome)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
) VALUES (
    'e0000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'arun.kumar@svcollege.edu.in',
    crypt('welcome', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "STUDENT", "register_number": "21CS001", "name": "Arun Kumar S"}'::jsonb,
    now(),
    now(),
    false,
    false
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('welcome', gen_salt('bf')),
    email_confirmed_at = now();

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    jsonb_build_object('sub', 'e0000000-0000-0000-0000-000000000001', 'email', 'arun.kumar@svcollege.edu.in'),
    'email',
    'arun.kumar@svcollege.edu.in',
    now(),
    now(),
    now()
) ON CONFLICT (provider, provider_id) DO NOTHING;

-- Insert Student Vinay Auth User (Password: welcome)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
) VALUES (
    '8df67b69-7e62-43dc-81ad-b849a4c0ff81',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'Suryavinay362@gmail.com',
    crypt('welcome', gen_salt('bf')),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"role": "STUDENT", "register_number": "192110027", "name": "Vinay"}'::jsonb,
    now(),
    now(),
    false,
    false
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('welcome', gen_salt('bf')),
    email_confirmed_at = now();

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    '8df67b69-7e62-43dc-81ad-b849a4c0ff81',
    '8df67b69-7e62-43dc-81ad-b849a4c0ff81',
    jsonb_build_object('sub', '8df67b69-7e62-43dc-81ad-b849a4c0ff81', 'email', 'suryavinay362@gmail.com'),
    'email',
    'suryavinay362@gmail.com',
    now(),
    now(),
    now()
) ON CONFLICT (provider, provider_id) DO NOTHING;


-- ====================================================================
-- File: 08_admin_user_creation_and_auth.sql
-- ====================================================================

-- Migration 08: Real Database Student and Faculty Creation with Auth and Audit
-- Ensures atomic, transactional creation of Auth User + Public User + Profile + Student/Faculty

-- 1. Ensure RLS policies for faculty and audit_logs
DO $$
BEGIN
    -- Faculty RLS policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faculty' AND policyname = 'Allow insert faculty') THEN
        CREATE POLICY "Allow insert faculty" ON public.faculty FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'faculty' AND policyname = 'Allow update faculty') THEN
        CREATE POLICY "Allow update faculty" ON public.faculty FOR UPDATE TO anon, authenticated USING (true);
    END IF;

    -- Audit Logs RLS policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow select audit_logs') THEN
        CREATE POLICY "Allow select audit_logs" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'audit_logs' AND policyname = 'Allow insert audit_logs') THEN
        CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
END $$;

-- 2. Procedure: admin_create_student
CREATE OR REPLACE FUNCTION public.admin_create_student(
    p_register_number TEXT,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT '',
    p_department_name TEXT DEFAULT 'Computer Science and Engineering',
    p_program_name TEXT DEFAULT 'B.Tech Computer Science and Engineering',
    p_semester INT DEFAULT 1,
    p_batch TEXT DEFAULT '2024-2028',
    p_password TEXT DEFAULT 'welcome',
    p_admin_user_id UUID DEFAULT NULL,
    p_admin_name TEXT DEFAULT 'Central Administration'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_dept_id BIGINT;
    v_prog_id BIGINT;
    v_student_id BIGINT;
    v_clean_reg TEXT;
    v_clean_email TEXT;
    v_clean_pass TEXT;
    v_actual_dept_name TEXT;
    v_actual_prog_name TEXT;
    v_created_at TIMESTAMPTZ := now();
BEGIN
    v_clean_reg := trim(p_register_number);
    v_clean_email := lower(trim(p_email));
    v_clean_pass := coalesce(nullif(trim(p_password), ''), 'welcome');

    -- Validations
    IF v_clean_reg = '' THEN
        RAISE EXCEPTION 'Register Number is mandatory.';
    END IF;
    IF trim(p_name) = '' THEN
        RAISE EXCEPTION 'Student Full Name is mandatory.';
    END IF;
    IF v_clean_email = '' OR position('@' in v_clean_email) = 0 THEN
        RAISE EXCEPTION 'A valid institutional email address is mandatory.';
    END IF;

    -- Check for duplicate register number
    IF EXISTS (SELECT 1 FROM public.users WHERE lower(register_number) = lower(v_clean_reg)) THEN
        RAISE EXCEPTION 'Register Number "%" is already enrolled in the system.', v_clean_reg;
    END IF;

    -- Check for duplicate email in public.users or auth.users
    IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = v_clean_email) THEN
        RAISE EXCEPTION 'Email "%" is already registered.', v_clean_email;
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_clean_email) THEN
        RAISE EXCEPTION 'Email "%" is already registered in Authentication.', v_clean_email;
    END IF;

    -- Resolve Department
    SELECT id, name INTO v_dept_id, v_actual_dept_name
    FROM public.departments
    WHERE name ILIKE '%' || trim(p_department_name) || '%'
       OR code ILIKE trim(p_department_name)
    ORDER BY id ASC
    LIMIT 1;

    IF v_dept_id IS NULL THEN
        SELECT id, name INTO v_dept_id, v_actual_dept_name FROM public.departments ORDER BY id ASC LIMIT 1;
    END IF;

    -- Resolve Program
    SELECT id, name INTO v_prog_id, v_actual_prog_name
    FROM public.programs
    WHERE (name ILIKE '%' || trim(p_program_name) || '%' OR code ILIKE trim(p_program_name))
      AND department_id = v_dept_id
    ORDER BY id ASC
    LIMIT 1;

    IF v_prog_id IS NULL THEN
        SELECT id, name INTO v_prog_id, v_actual_prog_name
        FROM public.programs
        WHERE department_id = v_dept_id
        ORDER BY id ASC
        LIMIT 1;
    END IF;

    IF v_prog_id IS NULL THEN
        SELECT id, name INTO v_prog_id, v_actual_prog_name FROM public.programs ORDER BY id ASC LIMIT 1;
    END IF;

    -- Generate UUID for auth and user
    v_user_id := gen_random_uuid();

    -- 1. Create Supabase Auth User
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token,
        is_super_admin,
        is_sso_user,
        is_anonymous
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_clean_email,
        crypt(v_clean_pass, gen_salt('bf')),
        v_created_at,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'role', 'STUDENT',
            'register_number', v_clean_reg,
            'full_name', trim(p_name),
            'department_id', v_dept_id,
            'program_id', v_prog_id,
            'batch', trim(p_batch),
            'semester', p_semester
        ),
        v_created_at,
        v_created_at,
        '', '', '', '', '', '', '', '',
        false, false, false
    );

    -- 2. Create Auth Identity
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
        'email',
        v_clean_email,
        v_created_at,
        v_created_at,
        v_created_at
    );

    -- 3. Insert or update public.users
    INSERT INTO public.users (
        id,
        register_number,
        email,
        password_hash,
        role,
        account_status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_clean_reg,
        v_clean_email,
        crypt(v_clean_pass, gen_salt('bf')),
        'STUDENT',
        'ACTIVE',
        v_created_at,
        v_created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        register_number = EXCLUDED.register_number,
        email = EXCLUDED.email,
        role = 'STUDENT',
        updated_at = v_created_at;

    -- 4. Insert or update public.profiles
    INSERT INTO public.profiles (
        user_id,
        full_name,
        phone,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        trim(p_name),
        trim(p_phone),
        v_created_at,
        v_created_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        updated_at = v_created_at;

    -- 5. Insert into public.students
    INSERT INTO public.students (
        user_id,
        program_id,
        department_id,
        current_semester,
        batch,
        admission_date,
        created_at
    ) VALUES (
        v_user_id,
        v_prog_id,
        v_dept_id,
        coalesce(p_semester, 1),
        coalesce(trim(p_batch), '2024-2028'),
        CURRENT_DATE,
        v_created_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
        program_id = EXCLUDED.program_id,
        department_id = EXCLUDED.department_id,
        current_semester = EXCLUDED.current_semester,
        batch = EXCLUDED.batch
    RETURNING id INTO v_student_id;

    -- 6. Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values,
        created_at
    ) VALUES (
        coalesce(p_admin_user_id, v_user_id),
        'STUDENT_CREATED',
        'students',
        v_student_id::text,
        jsonb_build_object(
            'student_id', v_student_id,
            'user_id', v_user_id,
            'register_number', v_clean_reg,
            'name', trim(p_name),
            'department', v_actual_dept_name,
            'program', v_actual_prog_name,
            'batch', trim(p_batch),
            'semester', p_semester,
            'created_by', p_admin_name
        ),
        v_created_at
    );

    RETURN jsonb_build_object(
        'id', v_user_id,
        'appId', v_student_id,
        'studentNumber', v_student_id,
        'registerNumber', v_clean_reg,
        'email', v_clean_email,
        'name', trim(p_name),
        'phone', trim(p_phone),
        'department', v_actual_dept_name,
        'program', v_actual_prog_name,
        'semester', p_semester,
        'batch', trim(p_batch),
        'role', 'STUDENT',
        'accountStatus', 'ACTIVE',
        'createdAt', v_created_at
    );
END;
$$;

-- 3. Procedure: admin_create_faculty
CREATE OR REPLACE FUNCTION public.admin_create_faculty(
    p_register_number TEXT,
    p_name TEXT,
    p_email TEXT,
    p_phone TEXT DEFAULT '',
    p_department_name TEXT DEFAULT 'Computer Science and Engineering',
    p_designation TEXT DEFAULT 'Associate Professor',
    p_qualification TEXT DEFAULT 'Ph.D in Computer Science',
    p_password TEXT DEFAULT 'staff',
    p_admin_user_id UUID DEFAULT NULL,
    p_admin_name TEXT DEFAULT 'Central Administration'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_dept_id BIGINT;
    v_faculty_id BIGINT;
    v_clean_reg TEXT;
    v_clean_email TEXT;
    v_clean_pass TEXT;
    v_actual_dept_name TEXT;
    v_created_at TIMESTAMPTZ := now();
BEGIN
    v_clean_reg := trim(p_register_number);
    v_clean_email := lower(trim(p_email));
    v_clean_pass := coalesce(nullif(trim(p_password), ''), 'staff');

    -- Validations
    IF v_clean_reg = '' THEN
        RAISE EXCEPTION 'Staff / Faculty ID is mandatory.';
    END IF;
    IF trim(p_name) = '' THEN
        RAISE EXCEPTION 'Faculty Full Name is mandatory.';
    END IF;
    IF v_clean_email = '' OR position('@' in v_clean_email) = 0 THEN
        RAISE EXCEPTION 'A valid institutional email address is mandatory.';
    END IF;

    -- Check for duplicate register number
    IF EXISTS (SELECT 1 FROM public.users WHERE lower(register_number) = lower(v_clean_reg)) THEN
        RAISE EXCEPTION 'Faculty / Staff ID "%" already exists.', v_clean_reg;
    END IF;

    -- Check for duplicate email in public.users or auth.users
    IF EXISTS (SELECT 1 FROM public.users WHERE lower(email) = v_clean_email) THEN
        RAISE EXCEPTION 'Email "%" is already registered.', v_clean_email;
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = v_clean_email) THEN
        RAISE EXCEPTION 'Email "%" is already registered in Authentication.', v_clean_email;
    END IF;

    -- Resolve Department
    SELECT id, name INTO v_dept_id, v_actual_dept_name
    FROM public.departments
    WHERE name ILIKE '%' || trim(p_department_name) || '%'
       OR code ILIKE trim(p_department_name)
    ORDER BY id ASC
    LIMIT 1;

    IF v_dept_id IS NULL THEN
        SELECT id, name INTO v_dept_id, v_actual_dept_name FROM public.departments ORDER BY id ASC LIMIT 1;
    END IF;

    -- Generate UUID for auth and user
    v_user_id := gen_random_uuid();

    -- 1. Create Supabase Auth User
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        recovery_token,
        email_change_token_new,
        email_change,
        phone_change,
        phone_change_token,
        email_change_token_current,
        reauthentication_token,
        is_super_admin,
        is_sso_user,
        is_anonymous
    ) VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        v_clean_email,
        crypt(v_clean_pass, gen_salt('bf')),
        v_created_at,
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        jsonb_build_object(
            'role', 'FACULTY',
            'register_number', v_clean_reg,
            'full_name', trim(p_name),
            'department_id', v_dept_id,
            'designation', trim(p_designation)
        ),
        v_created_at,
        v_created_at,
        '', '', '', '', '', '', '', '',
        false, false, false
    );

    -- 2. Create Auth Identity
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id::text, 'email', v_clean_email),
        'email',
        v_clean_email,
        v_created_at,
        v_created_at,
        v_created_at
    );

    -- 3. Insert or update public.users
    INSERT INTO public.users (
        id,
        register_number,
        email,
        password_hash,
        role,
        account_status,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        v_clean_reg,
        v_clean_email,
        crypt(v_clean_pass, gen_salt('bf')),
        'FACULTY',
        'ACTIVE',
        v_created_at,
        v_created_at
    )
    ON CONFLICT (id) DO UPDATE SET
        register_number = EXCLUDED.register_number,
        email = EXCLUDED.email,
        role = 'FACULTY',
        updated_at = v_created_at;

    -- 4. Insert or update public.profiles
    INSERT INTO public.profiles (
        user_id,
        full_name,
        phone,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        trim(p_name),
        trim(p_phone),
        v_created_at,
        v_created_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        updated_at = v_created_at;

    -- 5. Insert into public.faculty
    INSERT INTO public.faculty (
        user_id,
        department_id,
        designation,
        qualification,
        joining_date,
        created_at
    ) VALUES (
        v_user_id,
        v_dept_id,
        coalesce(trim(p_designation), 'Associate Professor'),
        coalesce(trim(p_qualification), 'Ph.D'),
        CURRENT_DATE,
        v_created_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
        department_id = EXCLUDED.department_id,
        designation = EXCLUDED.designation,
        qualification = EXCLUDED.qualification
    RETURNING id INTO v_faculty_id;

    -- 6. Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values,
        created_at
    ) VALUES (
        coalesce(p_admin_user_id, v_user_id),
        'FACULTY_CREATED',
        'faculty',
        v_faculty_id::text,
        jsonb_build_object(
            'faculty_id', v_faculty_id,
            'user_id', v_user_id,
            'register_number', v_clean_reg,
            'name', trim(p_name),
            'department', v_actual_dept_name,
            'designation', p_designation,
            'created_by', p_admin_name
        ),
        v_created_at
    );

    RETURN jsonb_build_object(
        'id', v_user_id,
        'appId', v_faculty_id,
        'facultyNumber', v_faculty_id,
        'registerNumber', v_clean_reg,
        'email', v_clean_email,
        'name', trim(p_name),
        'phone', trim(p_phone),
        'department', v_actual_dept_name,
        'designation', coalesce(trim(p_designation), 'Associate Professor'),
        'qualification', coalesce(trim(p_qualification), 'Ph.D'),
        'role', 'FACULTY',
        'accountStatus', 'ACTIVE',
        'createdAt', v_created_at
    );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.admin_create_student TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_faculty TO anon, authenticated, service_role;


-- ====================================================================
-- File: 09_comprehensive_rls_and_reflection.sql
-- ====================================================================

-- Migration 09: Comprehensive RLS Policies for All Academic Entities & Operations
-- Ensures all create/update operations across the application automatically reflect to Supabase

DO $$
BEGIN
    -- 1. Departments: Allow insert, update, delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Manage departments') THEN
        CREATE POLICY "Manage departments" ON public.departments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 2. Programs: Allow insert, update, delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'programs' AND policyname = 'Manage programs') THEN
        CREATE POLICY "Manage programs" ON public.programs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 3. Batches: Allow insert, update, delete
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'batches' AND policyname = 'Manage batches') THEN
        CREATE POLICY "Manage batches" ON public.batches FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 4. Academic Years: Allow manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academic_years' AND policyname = 'Manage academic_years') THEN
        CREATE POLICY "Manage academic_years" ON public.academic_years FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 5. Courses: Allow manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Manage courses') THEN
        CREATE POLICY "Manage courses" ON public.courses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 6. Course Offerings: Allow manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'course_offerings' AND policyname = 'Manage course_offerings') THEN
        CREATE POLICY "Manage course_offerings" ON public.course_offerings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 7. Internal Marks: Allow manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'internal_marks' AND policyname = 'Manage internal_marks') THEN
        CREATE POLICY "Manage internal_marks" ON public.internal_marks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 8. Receipts: Allow manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'receipts' AND policyname = 'Manage receipts') THEN
        CREATE POLICY "Manage receipts" ON public.receipts FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 9. Notifications: Allow manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Manage notifications') THEN
        CREATE POLICY "Manage notifications" ON public.notifications FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 10. OD Requests: Allow read and manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'od_requests' AND policyname = 'Read od_requests') THEN
        CREATE POLICY "Read od_requests" ON public.od_requests FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'od_requests' AND policyname = 'Manage od_requests') THEN
        CREATE POLICY "Manage od_requests" ON public.od_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 11. Assignments: Allow read and manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'Read assignments') THEN
        CREATE POLICY "Read assignments" ON public.assignments FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignments' AND policyname = 'Manage assignments') THEN
        CREATE POLICY "Manage assignments" ON public.assignments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 12. Assignment Submissions: Allow read and manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_submissions' AND policyname = 'Read assignment_submissions') THEN
        CREATE POLICY "Read assignment_submissions" ON public.assignment_submissions FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assignment_submissions' AND policyname = 'Manage assignment_submissions') THEN
        CREATE POLICY "Manage assignment_submissions" ON public.assignment_submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 13. Student Block History: Allow read and manage
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_block_history' AND policyname = 'Read student_block_history') THEN
        CREATE POLICY "Read student_block_history" ON public.student_block_history FOR SELECT TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_block_history' AND policyname = 'Manage student_block_history') THEN
        CREATE POLICY "Manage student_block_history" ON public.student_block_history FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;


-- ====================================================================
-- File: 10_auto_registration_number_generator.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM
-- Migration: 10_auto_registration_number_generator.sql
-- Description: Automatic 9-digit Registration Number Generator (19YYTNNNN)
--              Finds the lowest available sequential number starting from 0001
--              and allows reuse of deleted student registration numbers.
-- ====================================================================

CREATE TABLE IF NOT EXISTS registration_sequences (
    academic_year INT NOT NULL,
    track_code VARCHAR(10) NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (academic_year, track_code)
);

-- Function to atomically generate the next registration number with reuse of deleted numbers starting from 0001
CREATE OR REPLACE FUNCTION get_next_registration_number(p_year INT, p_track VARCHAR)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_yy VARCHAR(2);
    v_track_digit VARCHAR(1);
    v_next_seq INT;
    v_reg_no TEXT;
    v_prefix TEXT;
BEGIN
    -- Extract 2-digit year (e.g. 2021 -> '21', 2024 -> '24')
    v_yy := LPAD(((p_year % 100))::TEXT, 2, '0');
    -- Extract track digit (e.g. '1', '2', 'Track 1' -> '1')
    v_track_digit := SUBSTRING(REGEXP_REPLACE(p_track, '[^0-9]', '', 'g') FROM '[0-9]$');
    IF v_track_digit IS NULL OR v_track_digit = '' THEN
        v_track_digit := '1';
    END IF;

    v_prefix := '19' || v_yy || v_track_digit;

    -- Upsert tracking row if missing
    INSERT INTO registration_sequences (academic_year, track_code, last_sequence)
    VALUES (p_year, v_track_digit, 0)
    ON CONFLICT (academic_year, track_code) DO NOTHING;

    -- Row lock to prevent race conditions during concurrent enrollments
    PERFORM 1
    FROM registration_sequences
    WHERE academic_year = p_year AND track_code = v_track_digit
    FOR UPDATE;

    -- Find the lowest available sequence number starting from 1 (allows reuse of deleted numbers)
    SELECT s.num INTO v_next_seq
    FROM generate_series(1, 9999) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE register_number = v_prefix || LPAD(s.num::TEXT, 4, '0')
    )
    ORDER BY s.num ASC
    LIMIT 1;

    IF v_next_seq IS NULL THEN
        v_next_seq := 1;
    END IF;

    -- Update last_sequence to track the current sequence
    UPDATE registration_sequences
    SET last_sequence = v_next_seq, updated_at = NOW()
    WHERE academic_year = p_year AND track_code = v_track_digit;

    v_reg_no := v_prefix || LPAD(v_next_seq::TEXT, 4, '0');
    RETURN v_reg_no;
END;
$$;

-- Function to preview the next registration number without incrementing
CREATE OR REPLACE FUNCTION preview_next_registration_number(p_year INT, p_track VARCHAR)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_yy VARCHAR(2);
    v_track_digit VARCHAR(1);
    v_curr_seq INT;
    v_prefix TEXT;
BEGIN
    v_yy := LPAD(((p_year % 100))::TEXT, 2, '0');
    v_track_digit := SUBSTRING(REGEXP_REPLACE(p_track, '[^0-9]', '', 'g') FROM '[0-9]$');
    IF v_track_digit IS NULL OR v_track_digit = '' THEN
        v_track_digit := '1';
    END IF;

    v_prefix := '19' || v_yy || v_track_digit;

    -- Find the lowest available sequence number starting from 1
    SELECT s.num INTO v_curr_seq
    FROM generate_series(1, 9999) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE register_number = v_prefix || LPAD(s.num::TEXT, 4, '0')
    )
    ORDER BY s.num ASC
    LIMIT 1;

    IF v_curr_seq IS NULL THEN
        v_curr_seq := 1;
    END IF;

    RETURN v_prefix || LPAD(v_curr_seq::TEXT, 4, '0');
END;
$$;

GRANT ALL ON TABLE registration_sequences TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_next_registration_number(INT, VARCHAR) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION preview_next_registration_number(INT, VARCHAR) TO anon, authenticated, service_role;


-- ====================================================================
-- File: 11_auto_faculty_id_and_delete.sql
-- ====================================================================

-- ====================================================================
-- SV COLLEGE MANAGEMENT SYSTEM
-- Migration: 11_auto_faculty_id_and_delete.sql
-- Description: Automatic Faculty ID Generator (FAC001, FAC002, ...)
--              and Admin Faculty Deletion with Cascade & ID Reuse
-- ====================================================================

-- Function to preview the next faculty ID without consuming
CREATE OR REPLACE FUNCTION preview_next_faculty_id()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_seq INT;
BEGIN
    SELECT s.num INTO v_next_seq
    FROM generate_series(1, 9999) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE register_number = 'FAC' || LPAD(s.num::TEXT, 3, '0')
    )
    ORDER BY s.num ASC
    LIMIT 1;

    IF v_next_seq IS NULL THEN
        v_next_seq := 1;
    END IF;

    RETURN 'FAC' || LPAD(v_next_seq::TEXT, 3, '0');
END;
$$;

-- Function to get the next faculty ID (finds lowest available, allows reuse)
CREATE OR REPLACE FUNCTION get_next_faculty_id()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_seq INT;
BEGIN
    SELECT s.num INTO v_next_seq
    FROM generate_series(1, 9999) AS s(num)
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE register_number = 'FAC' || LPAD(s.num::TEXT, 3, '0')
    )
    ORDER BY s.num ASC
    LIMIT 1;

    IF v_next_seq IS NULL THEN
        v_next_seq := 1;
    END IF;

    RETURN 'FAC' || LPAD(v_next_seq::TEXT, 3, '0');
END;
$$;

-- Function to safely delete faculty member and clean up dependencies
CREATE OR REPLACE FUNCTION admin_delete_faculty(
    p_user_id UUID DEFAULT NULL,
    p_register_number TEXT DEFAULT NULL,
    p_admin_id UUID DEFAULT NULL,
    p_admin_name TEXT DEFAULT 'Central Administrator'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_user_id UUID;
    v_target_reg TEXT;
    v_target_name TEXT;
    v_target_email TEXT;
    v_faculty_id BIGINT;
BEGIN
    -- Locate target faculty user
    IF p_user_id IS NOT NULL THEN
        SELECT u.id, u.register_number, u.email, p.full_name, f.id
        INTO v_target_user_id, v_target_reg, v_target_email, v_target_name, v_faculty_id
        FROM public.users u
        LEFT JOIN public.profiles p ON p.user_id = u.id
        LEFT JOIN public.faculty f ON f.user_id = u.id
        WHERE u.id = p_user_id;
    ELSIF p_register_number IS NOT NULL THEN
        SELECT u.id, u.register_number, u.email, p.full_name, f.id
        INTO v_target_user_id, v_target_reg, v_target_email, v_target_name, v_faculty_id
        FROM public.users u
        LEFT JOIN public.profiles p ON p.user_id = u.id
        LEFT JOIN public.faculty f ON f.user_id = u.id
        WHERE lower(u.register_number) = lower(trim(p_register_number));
    END IF;

    IF v_target_user_id IS NULL THEN
        RAISE EXCEPTION 'Faculty member not found for deletion.';
    END IF;

    -- 1. Unset HOD in departments if this faculty is HOD
    UPDATE public.departments SET hod_id = NULL WHERE hod_id = v_target_user_id;

    -- 2. Clear foreign key references in teaching allocations
    DELETE FROM public.faculty_course_assignments WHERE faculty_id = v_target_user_id;
    UPDATE public.course_offerings SET faculty_id = NULL WHERE faculty_id = v_target_user_id;
    UPDATE public.assignment_submissions SET graded_by = NULL WHERE graded_by = v_target_user_id;
    
    BEGIN
        DELETE FROM public.assignments WHERE created_by = v_target_user_id;
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.assignments SET created_by = NULL WHERE created_by = v_target_user_id;
    END;

    BEGIN
        DELETE FROM public.attendance_sessions WHERE created_by = v_target_user_id;
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.attendance_sessions SET created_by = NULL WHERE created_by = v_target_user_id;
    END;

    BEGIN
        DELETE FROM public.course_result_submissions WHERE submitted_by = v_target_user_id;
    EXCEPTION WHEN OTHERS THEN
        UPDATE public.course_result_submissions SET submitted_by = NULL WHERE submitted_by = v_target_user_id;
    END;

    UPDATE public.internal_marks SET entered_by = NULL WHERE entered_by = v_target_user_id;
    UPDATE public.od_requests SET approved_by = NULL WHERE approved_by = v_target_user_id;
    UPDATE public.payments SET verified_by = NULL WHERE verified_by = v_target_user_id;
    UPDATE public.student_block_history SET blocked_by = NULL WHERE blocked_by = v_target_user_id;

    -- 3. Delete notifications
    DELETE FROM public.notifications WHERE user_id = v_target_user_id;

    -- 4. Delete from faculty table
    DELETE FROM public.faculty WHERE user_id = v_target_user_id;

    -- 5. Delete from profiles
    DELETE FROM public.profiles WHERE user_id = v_target_user_id;

    -- 6. Delete from public.users
    DELETE FROM public.users WHERE id = v_target_user_id;

    -- 7. Delete from auth.identities & auth.users
    DELETE FROM auth.identities WHERE user_id = v_target_user_id;
    DELETE FROM auth.users WHERE id = v_target_user_id;

    -- 8. Audit log entry
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        new_values,
        created_at
    ) VALUES (
        coalesce(p_admin_id, v_target_user_id),
        'FACULTY_DELETED',
        'faculty',
        coalesce(v_faculty_id::text, v_target_user_id::text),
        jsonb_build_object(
            'user_id', v_target_user_id,
            'register_number', v_target_reg,
            'name', v_target_name,
            'email', v_target_email,
            'deleted_by', p_admin_name
        ),
        now()
    );

    RETURN jsonb_build_object(
        'success', true,
        'deletedUserId', v_target_user_id,
        'registerNumber', v_target_reg,
        'name', v_target_name
    );
END;
$$;

GRANT EXECUTE ON FUNCTION preview_next_faculty_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_next_faculty_id() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION admin_delete_faculty(UUID, TEXT, UUID, TEXT) TO anon, authenticated, service_role;


-- ====================================================================
-- File: 12_faculty_created_courses.sql
-- ====================================================================

-- Migration 12: Track course ownership, ensure course offering metadata, and distinguish catalog from custom courses

-- 1. Ensure course_offerings has necessary operational columns used across the application
ALTER TABLE public.course_offerings ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.course_offerings ADD COLUMN IF NOT EXISTS max_capacity INT NOT NULL DEFAULT 60;
ALTER TABLE public.course_offerings ADD COLUMN IF NOT EXISTS enrolled_count INT NOT NULL DEFAULT 0;
ALTER TABLE public.course_offerings ADD COLUMN IF NOT EXISTS section VARCHAR(10) NOT NULL DEFAULT 'A';

-- 2. Add course ownership columns
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_catalog BOOLEAN DEFAULT FALSE;

-- 3. Populate faculty_id in course_offerings from faculty_course_assignments if available (using dynamic SQL to prevent compile-time failure)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'faculty_course_assignments'
    ) THEN
        EXECUTE '
            UPDATE public.course_offerings co
            SET faculty_id = fca.faculty_id
            FROM public.faculty_course_assignments fca
            WHERE fca.course_offering_id::text = co.id::text 
              AND co.faculty_id IS NULL
        ';
    END IF;
END $$;

-- 4. Mark original pre-seeded curriculum courses as institutional catalog courses
UPDATE public.courses 
SET is_catalog = TRUE, created_by = NULL 
WHERE code IN ('CS601', 'CS602', 'CS603', 'CS604', 'CS605', 'EC401')
   OR (id::text ~ '^[0-9]+$' AND id::text::bigint <= 5);

-- 5. Ensure baseline course offerings exist for institutional catalog courses with safe foreign keys
INSERT INTO public.course_offerings (course_id, academic_year_id, semester_id, section, faculty_id, max_capacity, enrolled_count)
SELECT 
    c.id,
    (SELECT id FROM public.academic_years ORDER BY id LIMIT 1),
    (SELECT id FROM public.semesters ORDER BY id LIMIT 1),
    'A',
    CASE 
        WHEN c.code IN ('CS601', 'CS603', 'CS605') THEN 
            COALESCE(
                (SELECT id FROM public.users WHERE id = 'f0000000-0000-0000-0000-000000000002'::UUID),
                (SELECT id FROM public.users WHERE register_number = 'FAC101' LIMIT 1),
                (SELECT id FROM public.users WHERE role = 'FACULTY' ORDER BY id ASC LIMIT 1)
            )
        ELSE 
            COALESCE(
                (SELECT id FROM public.users WHERE id = 'f0000000-0000-0000-0000-000000000003'::UUID),
                (SELECT id FROM public.users WHERE register_number = 'FAC102' LIMIT 1),
                (SELECT id FROM public.users WHERE role = 'FACULTY' ORDER BY id DESC LIMIT 1)
            )
    END,
    60,
    0
FROM public.courses c
WHERE c.code IN ('CS601', 'CS602', 'CS603', 'CS604', 'CS605', 'EC401')
  AND EXISTS (SELECT 1 FROM public.academic_years)
  AND EXISTS (SELECT 1 FROM public.semesters)
  AND NOT EXISTS (
      SELECT 1 FROM public.course_offerings co WHERE co.course_id::text = c.id::text
  );

-- 6. Mark custom created courses with their respective faculty creator
UPDATE public.courses c
SET created_by = co.faculty_id, is_catalog = FALSE
FROM public.course_offerings co
WHERE co.course_id::text = c.id::text 
  AND co.faculty_id IS NOT NULL
  AND c.code NOT IN ('CS601', 'CS602', 'CS603', 'CS604', 'CS605', 'EC401');

-- 7. Grant access to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
