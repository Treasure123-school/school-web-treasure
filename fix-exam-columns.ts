import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false }
});

async function fixExamColumns() {
  try {
    console.log('🔧 Adding missing exam-related database columns...');
    
    // Add time_remaining column to exam_sessions table
    console.log('Adding time_remaining column to exam_sessions table...');
    await sql`ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS time_remaining integer`;
    console.log('✅ Added time_remaining column to exam_sessions');
    
    // Add answered_at column to student_answers table  
    console.log('Adding answered_at column to student_answers table...');
    await sql`ALTER TABLE student_answers ADD COLUMN IF NOT EXISTS answered_at timestamp with time zone DEFAULT now()`;
    console.log('✅ Added answered_at column to student_answers');
    
    console.log('🎉 Database columns updated successfully!');
    console.log('🔄 Restart the application to test exam functionality.');
    
  } catch (error) {
    console.error('❌ Error fixing exam columns:', error);
    console.error('Error details:', error.message);
  } finally {
    await sql.end();
  }
}

fixExamColumns();