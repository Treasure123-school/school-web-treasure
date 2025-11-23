import { db } from './storage';
import { sql } from 'drizzle-orm';

async function fixCountersTable() {
  try {
    
    // Make class_code and year nullable
    await db.execute(sql`ALTER TABLE counters ALTER COLUMN class_code DROP NOT NULL`);
    
    await db.execute(sql`ALTER TABLE counters ALTER COLUMN year DROP NOT NULL`);
    
    // Drop the old unique index if it exists
    await db.execute(sql`DROP INDEX IF EXISTS counters_class_year_idx`);
    
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

fixCountersTable();
