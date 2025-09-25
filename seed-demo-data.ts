import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema";
import bcrypt from "bcrypt";

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: { rejectUnauthorized: false }
});
const db = drizzle(sql, { schema });

async function seedDemoData() {
  try {
    console.log('Creating roles...');
    
    // Insert roles in correct order to match application expectations
    // CRITICAL: Role IDs must match application constants:
    // Admin = 1, Teacher = 2, Student = 3, Parent = 4
    const roles = [
      { name: 'Admin' },    // Will get ID 1
      { name: 'Teacher' },  // Will get ID 2
      { name: 'Student' },  // Will get ID 3
      { name: 'Parent' }    // Will get ID 4
    ];

    for (const role of roles) {
      await db.insert(schema.roles).values(role).onConflictDoNothing();
    }

    console.log('Roles created successfully');

    // Get role IDs
    const allRoles = await db.select().from(schema.roles);
    const roleMap: Record<string, number> = {};
    allRoles.forEach(role => {
      roleMap[role.name] = role.id;
    });

    console.log('Creating demo users...');

    // Hash the demo password
    const demoPassword = 'demo123';
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(demoPassword, saltRounds);

    // Insert demo users with hashed passwords
    const demoUsers = [
      {
        email: 'student@demo.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: roleMap['Student'],
        passwordHash: hashedPassword
      },
      {
        email: 'teacher@demo.com',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: roleMap['Teacher'],
        passwordHash: hashedPassword
      },
      {
        email: 'parent@demo.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        roleId: roleMap['Parent'],
        passwordHash: hashedPassword
      },
      {
        email: 'admin@demo.com',
        firstName: 'Admin',
        lastName: 'User',
        roleId: roleMap['Admin'],
        passwordHash: hashedPassword
      }
    ];

    for (const user of demoUsers) {
      await db.insert(schema.users).values(user).onConflictDoUpdate({
        target: schema.users.email,
        set: {
          passwordHash: user.passwordHash,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId
        }
      });
    }

    console.log('Demo users created successfully');

    // Create demo academic terms
    console.log('Creating demo academic terms...');
    const currentTerm = {
      name: 'First Term',
      year: '2024/2025',
      startDate: '2024-09-01',
      endDate: '2024-12-15',
      isCurrent: true
    };

    await db.insert(schema.academicTerms).values(currentTerm).onConflictDoNothing();
    
    const terms = await db.select().from(schema.academicTerms);
    const currentTermRecord = terms.find(t => t.isCurrent);

    // Create demo subjects
    console.log('Creating demo subjects...');
    const subjects = [
      { name: 'Mathematics', code: 'MATH', description: 'Core Mathematics' },
      { name: 'English Language', code: 'ENG', description: 'English Language and Literature' },
      { name: 'Basic Science', code: 'SCI', description: 'Integrated Science' },
      { name: 'Social Studies', code: 'SOC', description: 'Social Studies' },
      { name: 'Computer Studies', code: 'CSC', description: 'Basic Computer Studies' }
    ];

    for (const subject of subjects) {
      await db.insert(schema.subjects).values(subject).onConflictDoNothing();
    }

    // Create demo classes
    console.log('Creating demo classes...');
    const demoClasses = [
      {
        name: 'JSS 1',
        level: 'Junior Secondary',
        capacity: 30,
        currentTermId: currentTermRecord?.id,
        isActive: true
      },
      {
        name: 'JSS 2', 
        level: 'Junior Secondary',
        capacity: 30,
        currentTermId: currentTermRecord?.id,
        isActive: true
      },
      {
        name: 'JSS 3',
        level: 'Junior Secondary', 
        capacity: 30,
        currentTermId: currentTermRecord?.id,
        isActive: true
      }
    ];

    for (const cls of demoClasses) {
      await db.insert(schema.classes).values(cls).onConflictDoNothing();
    }

    // Get the created users and classes
    const users = await db.select().from(schema.users);
    const classes = await db.select().from(schema.classes);
    const jss1Class = classes.find(c => c.name === 'JSS 1');

    // Create student records for demo users with Student role
    console.log('Creating student records...');
    const studentUser = users.find(u => u.email === 'student@demo.com');
    const parentUser = users.find(u => u.email === 'parent@demo.com');

    if (studentUser && jss1Class) {
      const studentRecord = {
        id: studentUser.id,
        admissionNumber: 'THS/2024/001',
        classId: jss1Class.id,
        parentId: parentUser?.id || null,
        admissionDate: '2024-09-01'
      };

      await db.insert(schema.students).values(studentRecord).onConflictDoUpdate({
        target: schema.students.id,
        set: {
          admissionNumber: studentRecord.admissionNumber,
          classId: studentRecord.classId,
          parentId: studentRecord.parentId,
          admissionDate: studentRecord.admissionDate
        }
      });

      console.log(`✅ Student record created for ${studentUser.email} - assigned to ${jss1Class.name}`);
    }

    console.log('Demo accounts (all use password: demo123):');
    console.log('- student@demo.com (Student) - Assigned to JSS 1');
    console.log('- teacher@demo.com (Teacher)');
    console.log('- parent@demo.com (Parent)');
    console.log('- admin@demo.com (Admin)');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}

seedDemoData();