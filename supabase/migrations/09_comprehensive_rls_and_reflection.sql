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
