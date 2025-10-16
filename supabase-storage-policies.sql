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
-- Policy 2: Allow authenticated uploads to homepage-images
-- =====================================================
CREATE POLICY "Allow authenticated uploads to homepage-images"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'homepage-images');

-- =====================================================
-- Policy 3: Allow authenticated uploads to gallery-images
-- =====================================================
CREATE POLICY "Allow authenticated uploads to gallery-images"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'gallery-images');

-- =====================================================
-- Policy 4: Allow authenticated uploads to profile-images
-- =====================================================
CREATE POLICY "Allow authenticated uploads to profile-images"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'profile-images');

-- =====================================================
-- Policy 5: Allow authenticated uploads to study-resources
-- =====================================================
CREATE POLICY "Allow authenticated uploads to study-resources"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'study-resources');

-- =====================================================
-- Policy 6: Allow authenticated uploads to general-uploads
-- =====================================================
CREATE POLICY "Allow authenticated uploads to general-uploads"
ON storage.objects
FOR INSERT
TO authenticated, anon, service_role
WITH CHECK (bucket_id = 'general-uploads');

-- =====================================================
-- Policy 7: Public read access for all buckets
-- (Since buckets are public, allow anyone to view)
-- =====================================================
CREATE POLICY "Public read access to all school buckets"
ON storage.objects
FOR SELECT
TO public, authenticated, anon, service_role
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
-- Policy 8: Allow authenticated users to update files
-- =====================================================
CREATE POLICY "Allow authenticated updates to school buckets"
ON storage.objects
FOR UPDATE
TO authenticated, service_role
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
-- Policy 9: Allow authenticated users to delete files
-- =====================================================
CREATE POLICY "Allow authenticated deletes from school buckets"
ON storage.objects
FOR DELETE
TO authenticated, service_role
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
