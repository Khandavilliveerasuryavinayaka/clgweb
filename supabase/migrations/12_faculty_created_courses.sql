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


