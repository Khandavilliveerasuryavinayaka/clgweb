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
