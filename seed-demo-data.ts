import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./shared/schema";

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

    // Insert demo users
    const demoUsers = [
      {
        email: 'student@demo.com',
        firstName: 'John',
        lastName: 'Doe',
        roleId: roleMap['Student']
      },
      {
        email: 'teacher@demo.com',
        firstName: 'Jane',
        lastName: 'Smith',
        roleId: roleMap['Teacher']
      },
      {
        email: 'parent@demo.com',
        firstName: 'Bob',
        lastName: 'Johnson',
        roleId: roleMap['Parent']
      },
      {
        email: 'admin@demo.com',
        firstName: 'Admin',
        lastName: 'User',
        roleId: roleMap['Admin']
      }
    ];

    for (const user of demoUsers) {
      await db.insert(schema.users).values(user).onConflictDoNothing();
    }

    console.log('Demo users created successfully');
    console.log('Demo accounts:');
    console.log('- student@demo.com (Student)');
    console.log('- teacher@demo.com (Teacher)');
    console.log('- parent@demo.com (Parent)');
    console.log('- admin@demo.com (Admin)');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}

seedDemoData();