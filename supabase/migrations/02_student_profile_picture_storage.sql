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

