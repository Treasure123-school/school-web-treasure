// Quick database schema fix script
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

async function fixSchema() {
  try {
    console.log('🔧 Fixing database schema by adding missing columns...');
    
    // Create attendance_status enum if it doesn't exist
    await sql`
      DO $$ BEGIN
        CREATE TYPE attendance_status AS ENUM ('Present', 'Absent', 'Late', 'Excused');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    console.log('✅ attendance_status enum created/verified');
    
    // Add recovery_email column to users table
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS recovery_email varchar(255)
    `;
    
    console.log('✅ users table updated with recovery_email column');
    
    // Add missing columns to exam_questions table
    await sql`
      ALTER TABLE exam_questions 
      ADD COLUMN IF NOT EXISTS auto_gradable boolean DEFAULT true,
      ADD COLUMN IF NOT EXISTS expected_answers text[],
      ADD COLUMN IF NOT EXISTS case_sensitive boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS allow_partial_credit boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS partial_credit_rules text,
      ADD COLUMN IF NOT EXISTS explanation_text text,
      ADD COLUMN IF NOT EXISTS hint_text text
    `;
    
    console.log('✅ exam_questions table updated');
    
    // Add missing columns to student_answers table
    await sql`
      ALTER TABLE student_answers
      ADD COLUMN IF NOT EXISTS auto_scored boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS feedback_text text,
      ADD COLUMN IF NOT EXISTS partial_credit_reason text
    `;
    
    console.log('✅ student_answers table updated');
    
    // Add missing columns to question_options table
    await sql`
      ALTER TABLE question_options
      ADD COLUMN IF NOT EXISTS partial_credit_value integer DEFAULT 0,
      ADD COLUMN IF NOT EXISTS explanation_text text
    `;
    
    console.log('✅ question_options table updated');
    console.log('🎉 Database schema fixed successfully!');
    
    await sql.end();
    
  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    await sql.end();
  }
  
  process.exit(0);
}

fixSchema();