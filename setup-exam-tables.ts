import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(sql, { schema });

async function setupExamTables() {
  try {
    console.log('Setting up tables required for exam functionality...');
    
    // Test if key tables exist by trying to select from them
    const tablesToCheck = [
      'academic_terms',
      'classes', 
      'subjects',
      'exams',
      'exam_questions',
      'question_options',
      'exam_results'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        await sql`SELECT 1 FROM ${sql(tableName)} LIMIT 1`;
        console.log(`✅ Table ${tableName} exists`);
      } catch (error) {
        console.log(`❌ Table ${tableName} missing or empty`);
      }
    }
    
    // Create some basic data if tables exist
    console.log('Creating basic academic term if needed...');
    try {
      const existingTerms = await db.select().from(schema.academicTerms);
      if (existingTerms.length === 0) {
        await db.insert(schema.academicTerms).values({
          name: 'First Term',
          year: '2024/2025',
          startDate: '2024-09-01',
          endDate: '2024-12-15',
          isCurrent: true
        });
        console.log('✅ Created default academic term');
      }
    } catch (error) {
      console.log('⚠️  Could not create academic term:', error.message);
    }
    
    console.log('Creating basic classes if needed...');
    try {
      const existingClasses = await db.select().from(schema.classes);
      if (existingClasses.length === 0) {
        await db.insert(schema.classes).values([
          { name: 'Grade 1', level: 'Primary', capacity: 30 },
          { name: 'Grade 2', level: 'Primary', capacity: 30 },
          { name: 'Grade 3', level: 'Primary', capacity: 30 },
        ]);
        console.log('✅ Created default classes');
      }
    } catch (error) {
      console.log('⚠️  Could not create classes:', error.message);
    }
    
    console.log('Creating basic subjects if needed...');
    try {
      const existingSubjects = await db.select().from(schema.subjects);
      if (existingSubjects.length === 0) {
        await db.insert(schema.subjects).values([
          { name: 'Mathematics', code: 'MATH', description: 'Mathematics subject' },
          { name: 'English', code: 'ENG', description: 'English Language' },
          { name: 'Science', code: 'SCI', description: 'General Science' },
        ]);
        console.log('✅ Created default subjects');
      }
    } catch (error) {
      console.log('⚠️  Could not create subjects:', error.message);
    }
    
    console.log('Setup completed!');
    
  } catch (error) {
    console.error('Error during setup:', error);
  } finally {
    await sql.end();
  }
}

setupExamTables();