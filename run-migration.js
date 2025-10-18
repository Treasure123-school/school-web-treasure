import postgres from 'postgres';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set');
  process.exit(1);
}

console.log('🔗 Connecting to database...');
const sql = postgres(DATABASE_URL, {
  max: 1,
  ssl: 'require'
});

async function runMigration() {
  try {
    console.log('📖 Reading migration file...');
    const migrationSQL = fs.readFileSync('add-profile-columns.sql', 'utf8');
    
    console.log('🚀 Running migration...');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Added columns: profile_completed, profile_skipped, profile_completion_percentage');
    
    // Verify the columns were added
    const result = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('profile_completed', 'profile_skipped', 'profile_completion_percentage')
      ORDER BY column_name;
    `;
    
    console.log('\n📊 Verified columns:');
    result.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('\n🔌 Database connection closed');
  }
}

runMigration();
