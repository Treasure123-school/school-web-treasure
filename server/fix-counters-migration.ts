import { db } from './storage';
import { sql } from 'drizzle-orm';

async function fixCountersTable() {
  try {
    console.log('🔧 Starting counters table migration...');
    
    // Make class_code and year nullable
    await db.execute(sql`ALTER TABLE counters ALTER COLUMN class_code DROP NOT NULL`);
    console.log('✅ Made class_code nullable');
    
    await db.execute(sql`ALTER TABLE counters ALTER COLUMN year DROP NOT NULL`);
    console.log('✅ Made year nullable');
    
    // Drop the old unique index if it exists
    await db.execute(sql`DROP INDEX IF EXISTS counters_class_year_idx`);
    console.log('✅ Dropped old unique index');
    
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixCountersTable();
