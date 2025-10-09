import { sql } from 'drizzle-orm';
import { db } from './server/storage';

async function ensureProfileColumns() {
  console.log('🔧 Ensuring profile-related columns exist in users table...');
  
  try {
    // Add national_id column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
    `);
    console.log('✅ national_id column checked/added');

    // Add profile_image_url column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
    `);
    console.log('✅ profile_image_url column checked/added');

    // Add recovery_email column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);
    `);
    console.log('✅ recovery_email column checked/added');

    // Add index for national_id if it doesn't exist
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
    `);
    console.log('✅ Index for national_id checked/added');

    // Add comments for documentation
    await db.execute(sql`
      COMMENT ON COLUMN users.national_id IS 'National Identification Number (NIN) for teachers and staff';
    `);
    await db.execute(sql`
      COMMENT ON COLUMN users.profile_image_url IS 'URL/path to user profile image';
    `);
    await db.execute(sql`
      COMMENT ON COLUMN users.recovery_email IS 'Alternative email for password recovery';
    `);
    console.log('✅ Column comments added');

    console.log('\n✅ All profile columns are now available in the database!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ensuring columns:', error);
    process.exit(1);
  }
}

ensureProfileColumns();
