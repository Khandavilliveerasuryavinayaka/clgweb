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
