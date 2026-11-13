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
