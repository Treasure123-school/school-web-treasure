import { db } from './server/storage.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';

async function applyMigration() {
  try {
    console.log('📦 Reading migration file...');
    const migrationSQL = fs.readFileSync('./migrations/0005_romantic_darkhawk.sql', 'utf-8');
    
    // Split by statement breakpoint
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      console.log(`\n▶️ Executing statement ${i + 1}/${statements.length}:`);
      console.log(statements[i]);
      await db.execute(sql.raw(statements[i]));
      console.log(`✅ Statement ${i + 1} executed successfully`);
    }
    
    console.log('\n🎉 Migration applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
