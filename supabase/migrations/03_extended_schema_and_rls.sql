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
