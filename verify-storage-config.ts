import { createClient } from '@supabase/supabase-js';

async function verifyStorageConfig() {
  console.log('🔍 Verifying Supabase Storage Configuration\n');
  console.log('=' .repeat(60) + '\n');

  // Check environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('1️⃣ Environment Variables Check:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Missing required environment variables');
    console.log('\nRequired in production (Render):');
    console.log('   SUPABASE_URL=https://vfqssftlihflcfhfzwkm.supabase.co');
    console.log('   SUPABASE_SERVICE_KEY=eyJhbG... (service_role key, NOT anon key)');
    process.exit(1);
  }

  // Check if key is service_role (contains specific claims)
  console.log('\n2️⃣ API Key Type Check:');
  try {
    const keyParts = supabaseServiceKey.split('.');
    if (keyParts.length === 3) {
      const payload = JSON.parse(Buffer.from(keyParts[1], 'base64').toString());
      const role = payload.role;
      
      if (role === 'service_role') {
        console.log('   ✅ Correct: Using service_role key (bypasses RLS)');
      } else if (role === 'anon') {
        console.error('   ❌ ERROR: Using anon key instead of service_role key!');
        console.error('   This will cause upload failures due to RLS policies.');
        console.error('\nFIX: In Supabase Dashboard → Settings → API');
        console.error('     Copy the "service_role" key (NOT the "anon" key)');
        process.exit(1);
      } else {
        console.warn(`   ⚠️ Unknown role: ${role}`);
      }
    }
  } catch (error) {
    console.warn('   ⚠️ Could not parse JWT key format');
  }

  // Initialize client
  console.log('\n3️⃣ Client Initialization:');
  const client = createClient(supabaseUrl, supabaseServiceKey);
  console.log('   ✅ Supabase client created');

  // Check bucket access
  console.log('\n4️⃣ Storage Bucket Access:');
  const bucketsToCheck = [
    'homepage-images',
    'gallery-images',
    'profile-images',
    'study-resources',
    'general-uploads'
  ];

  for (const bucketName of bucketsToCheck) {
    try {
      const { data, error } = await client.storage.getBucket(bucketName);
      if (error) {
        console.log(`   ❌ ${bucketName}: ${error.message}`);
      } else if (data) {
        console.log(`   ✅ ${bucketName}: Accessible`);
      }
    } catch (error: any) {
      console.log(`   ❌ ${bucketName}: ${error.message}`);
    }
  }

  // Test upload capability
  console.log('\n5️⃣ Upload Capability Test:');
  try {
    const testContent = Buffer.from('test');
    const testPath = `test-${Date.now()}.txt`;
    
    const { data, error } = await client.storage
      .from('homepage-images')
      .upload(testPath, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) {
      console.error(`   ❌ Upload failed: ${error.message}`);
      
      if (error.message.includes('row-level security')) {
        console.error('\n🚨 RLS POLICY ISSUE DETECTED:');
        console.error('   The service_role key should bypass RLS, but it is not.');
        console.error('\n   FIX OPTIONS:');
        console.error('   1. Run: npm run apply-storage-policies');
        console.error('   2. OR manually run SQL from supabase-storage-policies.sql in Supabase SQL Editor');
      } else if (error.message.includes('Bucket not found')) {
        console.error('\n   FIX: Create bucket "homepage-images" in Supabase Dashboard → Storage');
      } else if (error.message.includes('Invalid JWT')) {
        console.error('\n   FIX: SUPABASE_SERVICE_KEY is invalid or expired - get a new one from Supabase Dashboard');
      }
    } else {
      console.log('   ✅ Upload successful');
      
      // Clean up test file
      await client.storage.from('homepage-images').remove([testPath]);
      console.log('   ✅ Test file cleaned up');
    }
  } catch (error: any) {
    console.error(`   ❌ Upload test error: ${error.message}`);
  }

  console.log('\n' + '=' .repeat(60));
  console.log('✨ Verification Complete\n');
}

verifyStorageConfig().catch(console.error);
