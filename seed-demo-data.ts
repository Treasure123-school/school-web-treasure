import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./shared/schema";
import bcrypt from "bcrypt";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seedDemoData() {
  try {
    console.log('Creating roles...');
    
    // Insert roles
    const roles = [
      { name: 'Student' },
      { name: 'Teacher' }, 
      { name: 'Parent' },
      { name: 'Admin' }
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
    console.log('Demo accounts (all use password: demo123):');
    console.log('- student@demo.com (Student)');
    console.log('- teacher@demo.com (Teacher)');
    console.log('- parent@demo.com (Parent)');
    console.log('- admin@demo.com (Admin)');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}

seedDemoData();