-- =====================================================
-- Production Storage Verification Script
-- =====================================================
-- Run this in Supabase SQL Editor to check if everything is set up correctly
-- =====================================================

-- Check 1: Verify RLS is enabled
SELECT 
  '1️⃣ RLS Status' as check_name,
  CASE 
    WHEN relrowsecurity THEN '✅ ENABLED'
    ELSE '❌ DISABLED - Run supabase-storage-policies-safe.sql'
  END as status
FROM pg_class
WHERE relname = 'objects' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'storage');

-- Check 2: Count policies
SELECT 
  '2️⃣ Policy Count' as check_name,
  CASE 
    WHEN COUNT(*) >= 9 THEN '✅ ' || COUNT(*) || ' policies found'
    ELSE '❌ Only ' || COUNT(*) || ' policies - Expected 9'
  END as status
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check 3: List all policies
SELECT 
  '3️⃣ Policies' as check_name,
  policyname as policy_name,
  cmd as operation,
  CASE 
    WHEN roles = '{service_role}' THEN '✅ service_role'
    WHEN roles = '{public}' THEN '✅ public'
    ELSE roles::text
  END as applies_to
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- Check 4: Verify buckets exist
SELECT 
  '4️⃣ Buckets' as check_name,
  name as bucket_name,
  CASE WHEN public THEN '✅ Public' ELSE '⚠️ Private' END as access,
  created_at
FROM storage.buckets
WHERE name IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads')
ORDER BY name;

-- Check 5: Expected vs Actual
SELECT 
  '5️⃣ Summary' as check_name,
  (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads')) as buckets_found,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') as policies_found,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects') >= 9 
      AND (SELECT COUNT(*) FROM storage.buckets WHERE name IN ('homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads')) = 5
    THEN '✅ ALL GOOD - Ready for production!'
    ELSE '❌ Issues found - See details above'
  END as status;
