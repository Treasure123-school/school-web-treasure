import bcrypt from 'bcrypt';
import { db } from './storage';
import * as schema from "@shared/schema";
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { isPostgres } from './db';

/**
 * Seeds test user accounts for all 5 roles
 * Each user has a default password that should be changed on first login
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

    console.log('📋 Creating test user accounts for all 5 roles...');

    // Get SS3 class for student enrollment
    let ss3Class: typeof schema.classes.$inferSelect | undefined;
    try {
      const classResult = await db
        .select()
        .from(schema.classes)
        .where(eq(schema.classes.name, 'SSS 3'))
        .limit(1);
      if (classResult.length > 0) {
        ss3Class = classResult[0];
      }
    } catch (e) {
      console.warn('⚠️ Could not fetch SS3 class for student enrollment');
    }

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, userData.username))
        .limit(1);

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

        console.log(`✅ Created ${userData.roleName} account: ${userData.username}`);

        // If it's a student, create a Student record and enroll in SS3
        if (userData.roleName === 'Student' && ss3Class) {
          try {
            // Check if student record already exists
            const existingStudent = await db
              .select()
              .from(schema.students)
              .where(eq(schema.students.id, userData.id))
              .limit(1);

            if (existingStudent.length === 0) {
              const admissionNumber = `STU-${Date.now()}`;
              await db
                .insert(schema.students)
                .values({
                  id: userData.id,
                  classId: ss3Class.id,
                  admissionNumber,
                  dateOfAdmission: new Date(),
                  department: undefined
                })
                .returning();
              
              console.log(`✅ Enrolled student in class: SSS 3`);
            }
          } catch (e) {
            console.warn('⚠️ Could not create student record:', e instanceof Error ? e.message : 'Unknown error');
          }
        }
      } else {
        console.log(`ℹ️  ${userData.roleName} account already exists: ${userData.username}`);
        
        // For existing student user, ensure they have a Student record in SS3
        if (userData.roleName === 'Student' && ss3Class) {
          try {
            const existingStudent = await db
              .select()
              .from(schema.students)
              .where(eq(schema.students.id, userData.id))
              .limit(1);

            if (existingStudent.length === 0) {
              // Student record doesn't exist, create it
              const admissionNumber = `STU-${Date.now()}`;
              await db
                .insert(schema.students)
                .values({
                  id: userData.id,
                  classId: ss3Class.id,
                  admissionNumber,
                  dateOfAdmission: new Date(),
                  department: undefined
                })
                .returning();
              
              console.log(`✅ Enrolled existing student in class: SSS 3`);
            } else {
              // Student record exists, ensure it has a class assignment
              if (!existingStudent[0].classId) {
                // Update with class assignment
                await db
                  .update(schema.students)
                  .set({ classId: ss3Class.id })
                  .where(eq(schema.students.id, userData.id))
                  .returning();
                
                console.log(`✅ Updated existing student with class assignment: SSS 3`);
              }
            }
          } catch (e) {
            console.warn('⚠️ Could not ensure student class enrollment:', e instanceof Error ? e.message : 'Unknown error');
          }
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
