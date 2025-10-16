import postgres from 'postgres';

async function applyStoragePolicies() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔐 Applying Supabase Storage RLS Policies...\n');

  const sql = postgres(databaseUrl, {
    ssl: 'require',
    max: 1
  });

  try {
    console.log('1️⃣ Enabling RLS on storage.objects table...');
    await sql`ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`;
    console.log('✅ RLS enabled\n');

    console.log('2️⃣ Creating service_role full access policy...');
    await sql`
      CREATE POLICY IF NOT EXISTS "service_role_full_access"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    `;
    console.log('✅ Service role policy created\n');

    console.log('3️⃣ Creating public read access policy...');
    await sql`
      CREATE POLICY IF NOT EXISTS "public_read_access"
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
    `;
    console.log('✅ Public read policy created\n');

    console.log('4️⃣ Creating service_role update policy...');
    await sql`
      CREATE POLICY IF NOT EXISTS "service_role_update_access"
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
    `;
    console.log('✅ Service role update policy created\n');

    console.log('5️⃣ Creating service_role delete policy...');
    await sql`
      CREATE POLICY IF NOT EXISTS "service_role_delete_access"
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
    `;
    console.log('✅ Service role delete policy created\n');

    console.log('6️⃣ Verifying policies...');
    const policies = await sql`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'storage' AND tablename = 'objects'
      ORDER BY policyname;
    `;
    
    console.log('\n📋 Installed policies:');
    policies.forEach((policy: any) => {
      console.log(`  ✅ ${policy.policyname} (${policy.cmd})`);
    });

    console.log('\n✨ All storage policies applied successfully!');
    console.log('ℹ️ Backend uploads using service_role key will now work correctly.');
    
  } catch (error: any) {
    console.error('\n❌ Error applying policies:', error.message);
    console.error('\nℹ️ This might happen if:');
    console.error('   1. Policies already exist (this is OK)');
    console.error('   2. User lacks permissions (run SQL manually in Supabase dashboard)');
    console.error('   3. storage.objects table does not exist (Supabase not properly configured)');
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyStoragePolicies();
