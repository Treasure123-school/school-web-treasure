import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedBasicData() {
  try {
    console.log('Creating basic school data...');
    
    // Create academic terms
    console.log('Creating academic terms...');
    const academicTerms = [
      { name: 'Fall 2024', year: '2024-2025', startDate: '2024-09-01', endDate: '2024-12-15' },
      { name: 'Spring 2025', year: '2024-2025', startDate: '2025-01-15', endDate: '2025-05-30' },
    ];

    for (const term of academicTerms) {
      await db.insert(schema.academicTerms).values(term).onConflictDoNothing();
    }

    // Create subjects
    console.log('Creating subjects...');
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Algebra, geometry, and calculus' },
      { name: 'Science', code: 'SCI', description: 'Biology, chemistry, and physics' },
      { name: 'English', code: 'ENG', description: 'Literature and language arts' },
      { name: 'History', code: 'HIST', description: 'World and local history' },
      { name: 'Art', code: 'ART', description: 'Visual arts and creativity' },
    ];

    for (const subject of subjects) {
      await db.insert(schema.subjects).values(subject).onConflictDoNothing();
    }

    // Create classes
    console.log('Creating classes...');
    const classes = [
      { name: 'Grade 9A', level: 'Grade 9' },
      { name: 'Grade 9B', level: 'Grade 9' },
      { name: 'Grade 10A', level: 'Grade 10' },
      { name: 'Grade 10B', level: 'Grade 10' },
      { name: 'Grade 11A', level: 'Grade 11' },
      { name: 'Grade 12A', level: 'Grade 12' },
    ];

    for (const classData of classes) {
      await db.insert(schema.classes).values(classData).onConflictDoNothing();
    }

    // Create students
    console.log('Creating students...');
    const users = await db.select().from(schema.users);
    const studentUser = users.find(u => u.roleId === 4); // Student role

    if (studentUser) {
      const studentData = {
        id: studentUser.id,
        admissionNumber: 'ADM2024001',
        classId: 1, // Assign to first class
        admissionDate: '2024-09-01',
      };
      
      await db.insert(schema.students).values(studentData).onConflictDoNothing();
    }

    console.log('Basic data seeded successfully!');
    console.log('Created:');
    console.log('- Academic terms: Fall 2024, Spring 2025');
    console.log('- Subjects: Mathematics, Science, English, History, Art');
    console.log('- Classes: Grade 9A, 9B, 10A, 10B, 11A, 12A');
    console.log('- Student enrollment for demo student');
    
  } catch (error) {
    console.error('Error seeding basic data:', error);
  }
}

seedBasicData();