-- =====================================================
-- Supabase Storage RLS Policies for Production
-- =====================================================
-- This script sets up the necessary RLS policies for image uploads
-- Run this in your Supabase SQL Editor to allow authenticated uploads

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Policy 1: Allow service role to bypass all RLS
-- (Backend uses service key, so this is essential)
-- =====================================================
CREATE POLICY "Service role has full access"
ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- Policy 2: Allow ONLY service role uploads to homepage-images
-- (Backend uses service key - no direct client uploads)
-- =====================================================
CREATE POLICY "Service role can upload to homepage-images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'homepage-images');

-- =====================================================
-- Policy 3: Allow ONLY service role uploads to gallery-images
-- =====================================================
CREATE POLICY "Service role can upload to gallery-images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'gallery-images');

-- =====================================================
-- Policy 4: Allow ONLY service role uploads to profile-images
-- =====================================================
CREATE POLICY "Service role can upload to profile-images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'profile-images');

-- =====================================================
-- Policy 5: Allow ONLY service role uploads to study-resources
-- =====================================================
CREATE POLICY "Service role can upload to study-resources"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'study-resources');

-- =====================================================
-- Policy 6: Allow ONLY service role uploads to general-uploads
-- =====================================================
CREATE POLICY "Service role can upload to general-uploads"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'general-uploads');

-- =====================================================
-- Policy 7: Public read access for all buckets
-- (Buckets are public so anyone can VIEW, but NOT upload)
-- =====================================================
CREATE POLICY "Public read access to all school buckets"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id IN (
    'homepage-images',
    'gallery-images',
    'profile-images',
    'study-resources',
    'general-uploads'
  )
);

-- =====================================================
-- Policy 8: Allow ONLY service role to update files
-- (Backend handles all updates via API endpoints)
-- =====================================================
CREATE POLICY "Service role can update school bucket files"
ON storage.objects
FOR UPDATE
TO service_role
USING (
  bucket_id IN (
    'homepage-images',
    'gallery-images',
    'profile-images',
    'study-resources',
    'general-uploads'
  )
)
WITH CHECK (
  bucket_id IN (
    'homepage-images',
    'gallery-images',
    'profile-images',
    'study-resources',
    'general-uploads'
  )
);

-- =====================================================
-- Policy 9: Allow ONLY service role to delete files
-- (Backend handles all deletions via API endpoints)
-- =====================================================
CREATE POLICY "Service role can delete from school buckets"
ON storage.objects
FOR DELETE
TO service_role
USING (
  bucket_id IN (
    'homepage-images',
    'gallery-images',
    'profile-images',
    'study-resources',
    'general-uploads'
  )
);

-- =====================================================
-- Verify policies were created successfully
-- =====================================================
SELECT 
  policyname,
  tablename,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
