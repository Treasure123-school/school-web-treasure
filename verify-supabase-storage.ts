
import { createClient } from '@supabase/supabase-js';

async function verifySupabaseStorage() {
  console.log('🔍 Verifying Supabase Storage Configuration...\n');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  // Check environment variables
  console.log('1. Environment Variables:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Missing required environment variables!');
    process.exit(1);
  }

  // Verify service key format
  console.log('\n2. Service Key Verification:');
  if (supabaseServiceKey.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
    console.log('   ✅ Key appears to be a valid JWT token');
    
    // Decode JWT to check role
    try {
      const payload = JSON.parse(Buffer.from(supabaseServiceKey.split('.')[1], 'base64').toString());
      console.log(`   Role: ${payload.role || 'unknown'}`);
      
      if (payload.role !== 'service_role') {
        console.warn('   ⚠️  WARNING: This is NOT a service_role key!');
        console.warn('   You must use the service_role key for backend uploads.');
      } else {
        console.log('   ✅ Correct: This is a service_role key');
      }
    } catch (e) {
      console.warn('   ⚠️  Could not decode JWT payload');
    }
  } else {
    console.error('   ❌ Key does not appear to be a valid JWT token');
  }

  // Initialize client
  const client = createClient(supabaseUrl, supabaseServiceKey);

  // Check buckets
  console.log('\n3. Storage Buckets:');
  const buckets = ['homepage-images', 'gallery-images', 'profile-images', 'study-resources', 'general-uploads'];
  
  for (const bucketName of buckets) {
    try {
      const { data, error } = await client.storage.getBucket(bucketName);
      if (error) {
        console.log(`   ❌ ${bucketName}: ${error.message}`);
      } else if (data) {
        console.log(`   ✅ ${bucketName}: Accessible (public: ${data.public})`);
      }
    } catch (e: any) {
      console.log(`   ❌ ${bucketName}: ${e.message}`);
    }
  }

  // Test upload
  console.log('\n4. Test Upload:');
  try {
    const testBuffer = Buffer.from('test file content');
    const testPath = `test-${Date.now()}.txt`;
    
    const { data, error } = await client.storage
      .from('homepage-images')
      .upload(testPath, testBuffer, {
        contentType: 'text/plain',
        upsert: true
      });

    if (error) {
      console.log(`   ❌ Upload failed: ${error.message}`);
      
      if (error.message.includes('new row violates row-level security policy')) {
        console.log('\n🔧 FIX REQUIRED: RLS Policy Issue Detected');
        console.log('   The service_role key should bypass RLS, but it\'s being blocked.');
        console.log('\n   Possible causes:');
        console.log('   1. You\'re using the anon key instead of service_role key');
        console.log('   2. The service_role key is invalid or expired');
        console.log('\n   Solution:');
        console.log('   1. Go to Supabase Dashboard → Settings → API');
        console.log('   2. Copy the "service_role" secret (NOT the anon/public key)');
        console.log('   3. Update SUPABASE_SERVICE_KEY in your .env and Render');
      }
    } else {
      console.log(`   ✅ Upload successful: ${testPath}`);
      
      // Clean up test file
      await client.storage.from('homepage-images').remove([testPath]);
      console.log(`   ✅ Cleanup successful`);
    }
  } catch (e: any) {
    console.log(`   ❌ Test failed: ${e.message}`);
  }

  console.log('\n✅ Verification complete!\n');
}

verifySupabaseStorage().catch(console.error);
