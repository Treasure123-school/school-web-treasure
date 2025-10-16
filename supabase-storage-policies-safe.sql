-- =====================================================
-- Supabase Storage RLS Policies - SAFE VERSION
-- =====================================================
-- This script is IDEMPOTENT (safe to run multiple times)
-- It drops existing policies first, then recreates them
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy this ENTIRE file
-- 3. Paste and click "Run"
-- =====================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (no error if they don't)
DROP POLICY IF EXISTS "Service role has full access" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to homepage-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to gallery-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to profile-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to study-resources" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload to general-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to all school buckets" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update school bucket files" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete from school buckets" ON storage.objects;

-- =====================================================
-- CREATE POLICIES
-- =====================================================

-- Policy 1: Service role full access
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2-6: Service role upload access for each bucket
CREATE POLICY "Service role can upload to homepage-images"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'homepage-images');

CREATE POLICY "Service role can upload to gallery-images"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'gallery-images');

CREATE POLICY "Service role can upload to profile-images"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Service role can upload to study-resources"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'study-resources');

CREATE POLICY "Service role can upload to general-uploads"
ON storage.objects FOR INSERT TO service_role
WITH CHECK (bucket_id = 'general-uploads');

-- Policy 7: Public read access
CREATE POLICY "Public read access to all school buckets"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads')
);

-- Policy 8: Service role update access
CREATE POLICY "Service role can update school bucket files"
ON storage.objects FOR UPDATE TO service_role
USING (bucket_id IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads'))
WITH CHECK (bucket_id IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads'));

-- Policy 9: Service role delete access
CREATE POLICY "Service role can delete from school buckets"
ON storage.objects FOR DELETE TO service_role
USING (bucket_id IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads'));

-- =====================================================
-- VERIFY: Check all policies were created
-- =====================================================
SELECT 
  '✅ Policy created: ' || policyname as status,
  cmd as operation,
  CASE 
    WHEN roles = '{service_role}' THEN 'service_role only'
    WHEN roles = '{public}' THEN 'public'
    ELSE roles::text
  END as applies_to
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
