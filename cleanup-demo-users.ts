import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./shared/schema";
import { eq, and, not, inArray } from "drizzle-orm";

async function cleanupDemoUsers() {
  try {
    console.log('🧹 Starting demo user cleanup...');

    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    const pg = postgres(process.env.DATABASE_URL, {
      ssl: (process.env.DATABASE_URL?.includes('supabase.com') ? 'require' : false) as 'require' | false,
      prepare: false,
    });
    const db = drizzle(pg, { schema });

    // Get all users
    const allUsers = await db.select().from(schema.users);
    console.log(`\n📊 Found ${allUsers.length} total users`);
    
    // List all current users
    console.log('\n👥 Current users:');
    allUsers.forEach(user => {
      console.log(`  - ${user.email || user.username} (${user.firstName} ${user.lastName})`);
    });

    // Demo users to delete (emails from seed-demo-data.ts)
    const demoEmails = [
      'student@demo.com',
      'teacher@demo.com',
      'parent@demo.com',
      'admin@demo.com'
    ];

    // Find demo users to delete
    const demoUsers = allUsers.filter(user => demoEmails.includes(user.email || ''));
    
    if (demoUsers.length === 0) {
      console.log('\n✅ No demo users found to delete');
      await pg.end();
      return;
    }

    console.log(`\n🗑️  Deleting ${demoUsers.length} demo users:`);
    demoUsers.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });

    // Delete related records first (due to foreign key constraints)
    const demoUserIds = demoUsers.map(u => u.id);

    // Delete student records
    const deletedStudents = await db.delete(schema.students)
      .where(inArray(schema.students.id, demoUserIds))
      .returning();
    if (deletedStudents.length > 0) {
      console.log(`  ✓ Deleted ${deletedStudents.length} student records`);
    }

    // Delete teacher profiles
    const deletedTeacherProfiles = await db.delete(schema.teacherProfiles)
      .where(inArray(schema.teacherProfiles.userId, demoUserIds))
      .returning();
    if (deletedTeacherProfiles.length > 0) {
      console.log(`  ✓ Deleted ${deletedTeacherProfiles.length} teacher profiles`);
    }

    // Delete parent profiles
    const deletedParentProfiles = await db.delete(schema.parentProfiles)
      .where(inArray(schema.parentProfiles.userId, demoUserIds))
      .returning();
    if (deletedParentProfiles.length > 0) {
      console.log(`  ✓ Deleted ${deletedParentProfiles.length} parent profiles`);
    }

    // Delete admin profiles
    const deletedAdminProfiles = await db.delete(schema.adminProfiles)
      .where(inArray(schema.adminProfiles.userId, demoUserIds))
      .returning();
    if (deletedAdminProfiles.length > 0) {
      console.log(`  ✓ Deleted ${deletedAdminProfiles.length} admin profiles`);
    }

    // Finally, delete the users themselves
    const deletedUsers = await db.delete(schema.users)
      .where(inArray(schema.users.id, demoUserIds))
      .returning();

    console.log(`\n✅ Successfully deleted ${deletedUsers.length} demo users`);

    // Show remaining users
    const remainingUsers = await db.select().from(schema.users);
    console.log(`\n👥 Remaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(user => {
      console.log(`  - ${user.email || user.username} (${user.firstName} ${user.lastName})`);
    });

    console.log('\n🎉 Cleanup completed successfully!');
    await pg.end();
  } catch (error) {
    console.error('❌ Error cleaning up demo users:', error);
    throw error;
  }
}

// Run the cleanup
cleanupDemoUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
