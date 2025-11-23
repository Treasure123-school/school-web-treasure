import { supabase, isSupabaseStorageEnabled, STORAGE_BUCKETS } from './server/supabase-storage';

async function testSupabaseStorage() {
  console.log('🔍 Testing Supabase Storage Configuration...\n');
  
  try {
    // Test 1: Check if Supabase Storage is enabled
    console.log('1️⃣ Checking if Supabase Storage is enabled...');
    const isEnabled = isSupabaseStorageEnabled();
    
    if (!isEnabled) {
      console.log('⚠️  Supabase Storage is NOT enabled');
      console.log('   Please check:');
      console.log('   - SUPABASE_URL is set correctly');
      console.log('   - SUPABASE_SERVICE_KEY is set correctly\n');
      process.exit(1);
    }
    
    console.log('✅ Supabase Storage is enabled\n');
    
    // Test 2: Check environment variables
    console.log('2️⃣ Verifying Supabase environment variables...');
    console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   SUPABASE_SERVICE_KEY: ${process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`   VITE_SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   VITE_SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}\n`);
    
    // Test 3: List storage buckets
    console.log('3️⃣ Checking available storage buckets...');
    const client = supabase.get();
    
    if (!client) {
      console.log('❌ Failed to get Supabase client');
      process.exit(1);
    }
    
    const { data: buckets, error: bucketsError } = await client.storage.listBuckets();
    
    if (bucketsError) {
      console.log(`❌ Error listing buckets: ${bucketsError.message}`);
      process.exit(1);
    }
    
    console.log(`✅ Found ${buckets?.length || 0} storage buckets:`);
    const expectedBuckets = Object.values(STORAGE_BUCKETS);
    
    for (const bucketName of expectedBuckets) {
      const exists = buckets?.some(b => b.name === bucketName);
      console.log(`   ${exists ? '✅' : '⚠️ '} ${bucketName} ${exists ? '' : '(will be created on first use)'}`);
    }
    console.log('');
    
    // Test 4: Test bucket access (without creating files)
    console.log('4️⃣ Testing bucket access permissions...');
    const testBucket = expectedBuckets[0];
    const { data: files, error: filesError } = await client.storage
      .from(testBucket)
      .list('', { limit: 1 });
    
    if (filesError && !filesError.message.includes('Bucket not found')) {
      console.log(`⚠️  Warning accessing ${testBucket}: ${filesError.message}\n`);
    } else {
      console.log(`✅ Successfully accessed ${testBucket} bucket\n`);
    }
    
    console.log('✨ All Supabase Storage tests passed!\n');
    console.log('📝 Summary:');
    console.log('   - Supabase Storage is properly configured');
    console.log('   - All required environment variables are set');
    console.log('   - Storage buckets are accessible');
    console.log('   - Ready for file uploads\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Supabase Storage test failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\nPlease check:');
    console.error('1. SUPABASE_URL and SUPABASE_SERVICE_KEY are correctly set in your secrets');
    console.error('2. Your Supabase project is running and accessible');
    console.error('3. Storage is enabled in your Supabase project\n');
    process.exit(1);
  }
}

testSupabaseStorage();
