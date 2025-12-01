import bcrypt from 'bcrypt';
import { db } from './storage';
import * as schema from "@shared/schema";
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Seeds test user accounts for all 5 roles
 * Each user has a default password that should be changed on first login
 * Also creates corresponding profile records (e.g., students table for student users)
 */
export async function seedTestUsers() {
  try {
    // Define test users for each role
    const testUsers = [
      {
        id: randomUUID(),
        username: 'superadmin',
        email: 'superadmin@treasurehome.com',
        password: 'SuperAdmin@123',
        roleId: 1,
        firstName: 'Super',
        lastName: 'Admin',
        roleName: 'Super Admin'
      },
      {
        id: randomUUID(),
        username: 'admin',
        email: 'admin@treasurehome.com',
        password: 'Admin@123',
        roleId: 2,
        firstName: 'Admin',
        lastName: 'User',
        roleName: 'Admin'
      },
      {
        id: randomUUID(),
        username: 'teacher',
        email: 'teacher@treasurehome.com',
        password: 'Teacher@123',
        roleId: 3,
        firstName: 'John',
        lastName: 'Teacher',
        roleName: 'Teacher'
      },
      {
        id: randomUUID(),
        username: 'student',
        email: 'student@treasurehome.com',
        password: 'Student@123',
        roleId: 4,
        firstName: 'Jane',
        lastName: 'Student',
        roleName: 'Student'
      },
      {
        id: randomUUID(),
        username: 'parent',
        email: 'parent@treasurehome.com',
        password: 'Parent@123',
        roleId: 5,
        firstName: 'Peter',
        lastName: 'Parent',
        roleName: 'Parent'
      }
    ];

    // Fetch all roles
    const roles = await db.select().from(schema.roles);
    
    // Map role names to IDs
    const roleMap: Record<string, number> = {};
    for (const role of roles) {
      roleMap[role.name] = role.id;
    }

    // Fetch all classes to get a default class for test student
    const classes = await db.select().from(schema.classes);
    const defaultStudentClass = classes.find(c => c.name === 'JSS 1') || classes[0];

    console.log('📋 Creating test user accounts for all 5 roles...');

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, userData.username))
        .limit(1);

      let userId = userData.id;

      if (existingUser.length === 0) {
        // Get the correct role ID
        const roleId = roleMap[userData.roleName];
        if (!roleId) {
          console.warn(`⚠️ Role "${userData.roleName}" not found`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 12);

        // Create user
        const [newUser] = await db
          .insert(schema.users)
          .values({
            id: userData.id,
            username: userData.username,
            email: userData.email,
            passwordHash,
            roleId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            status: 'active',
            isActive: true,
            mustChangePassword: false,
            profileCompleted: true,
            createdVia: 'seed'
          })
          .returning();

        userId = newUser.id;
        console.log(`✅ Created ${userData.roleName} account: ${userData.username}`);
      } else {
        userId = existingUser[0].id;
        console.log(`ℹ️  ${userData.roleName} account already exists: ${userData.username}`);
      }

      // For student users, ensure they have a student record
      if (userData.roleName === 'Student' && defaultStudentClass) {
        const existingStudent = await db
          .select()
          .from(schema.students)
          .where(eq(schema.students.id, userId))
          .limit(1);

        if (existingStudent.length === 0) {
          // Generate admission number
          const year = new Date().getFullYear();
          const randomNum = Math.floor(100000 + Math.random() * 900000);
          const admissionNumber = `THS/${year}/${randomNum}`;

          await db.insert(schema.students).values({
            id: userId,
            admissionNumber,
            classId: defaultStudentClass.id,
            admissionDate: new Date().toISOString().split('T')[0],
          });
          console.log(`   ✅ Created student record for ${userData.username} in class ${defaultStudentClass.name}`);
        } else {
          console.log(`   ℹ️  Student record already exists for ${userData.username}`);
        }
      }
    }

    console.log('\n📝 TEST ACCOUNT CREDENTIALS:\n');
    console.log('┌─────────────────────────────────────────────────────┐');
    console.log('│         LOGIN CREDENTIALS FOR ALL 5 ROLES           │');
    console.log('├─────────────────────────────────────────────────────┤');
    for (const user of testUsers) {
      console.log(`│ Role: ${user.roleName.padEnd(45)}│`);
      console.log(`│   Username: ${user.username.padEnd(38)}│`);
      console.log(`│   Password: ${user.password.padEnd(38)}│`);
      console.log(`│   Email:    ${user.email.padEnd(38)}│`);
      console.log('├─────────────────────────────────────────────────────┤');
    }
    console.log('└─────────────────────────────────────────────────────┘\n');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Error seeding test users: ${errorMessage}`);
    throw error;
  }
}
