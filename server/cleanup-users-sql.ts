/**
 * Database Cleanup Script (SQL-based)
 * Deletes all users except the Super Admin (roleId = 0)
 * 
 * Usage: npx tsx server/cleanup-users-sql.ts
 */

import { db } from './storage';
import * as schema from '@shared/schema';
import { eq, ne } from 'drizzle-orm';

const SUPER_ADMIN_ROLE_ID = 0;

async function cleanupUsers() {
  try {
    console.log('🧹 Starting SQL-based user cleanup process...\n');

    // Step 1: Get all users
    const allUsers = await db.select().from(schema.users);
    console.log(`📊 Total users in database: ${allUsers.length}`);

    // Step 2: Identify Super Admin users
    const superAdmins = allUsers.filter(user => user.roleId === SUPER_ADMIN_ROLE_ID);
    console.log(`👑 Super Admin users found: ${superAdmins.length}`);
    superAdmins.forEach(admin => {
      console.log(`   - ${admin.username} (${admin.email})`);
    });

    // Step 3: Identify users to delete
    const usersToDelete = allUsers.filter(user => user.roleId !== SUPER_ADMIN_ROLE_ID);
    console.log(`\n🗑️  Users to be deleted: ${usersToDelete.length}`);
    
    if (usersToDelete.length === 0) {
      console.log('✅ No users to delete. Database already clean.');
      process.exit(0);
    }

    // Show which users will be deleted
    console.log('\nUsers that will be deleted:');
    usersToDelete.forEach(user => {
      console.log(`   - ${user.username || 'no-username'} (${user.email}) - Role ID: ${user.roleId}`);
    });

    console.log('\n🗑️  Starting SQL-based deletion process...');
    
    // Use SQL to bypass Drizzle's ORM issues
    const userIdsToDelete = usersToDelete.map(u => `'${u.id}'`).join(',');
    
    // Execute raw SQL to delete all related data in proper order
    const sqlClient = (db as any).$client;
    
    try {
      console.log('   📝 Deleting related records...');
      
      // Delete in reverse dependency order
      await sqlClient`DELETE FROM student_answers WHERE session_id IN (SELECT id FROM exam_sessions WHERE student_id IN (${sql.raw(userIdsToDelete)}))`;
      await sqlClient`DELETE FROM student_answers WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (${sql.raw(userIdsToDelete)})))`;
      await sqlClient`DELETE FROM question_options WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (${sql.raw(userIdsToDelete)})))`;
      await sqlClient`DELETE FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (${sql.raw(userIdsToDelete)}))`;
      await sqlClient`DELETE FROM exam_sessions WHERE student_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM exam_sessions WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (${sql.raw(userIdsToDelete)}))`;
      await sqlClient`DELETE FROM exam_results WHERE student_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM exam_results WHERE exam_id IN (SELECT id FROM exams WHERE created_by IN (${sql.raw(userIdsToDelete)}))`;
      await sqlClient`DELETE FROM exams WHERE created_by IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM attendance WHERE student_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM messages WHERE sender_id IN (${sql.raw(userIdsToDelete)}) OR recipient_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM announcements WHERE author_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM notifications WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      
      console.log('   📝 Deleting profile records...');
      await sqlClient`DELETE FROM students WHERE id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM teacher_profiles WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM admin_profiles WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM parent_profiles WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      
      console.log('   📝 Deleting user records...');
      await sqlClient`DELETE FROM users WHERE id IN (${sql.raw(userIdsToDelete)})`;
      
      console.log('   ✅ All records deleted successfully');
    } catch (error: any) {
      console.error('❌ SQL deletion error:', error.message);
      if (error.message.includes('does not exist')) {
        console.log('   ℹ️  Some tables may not exist yet, continuing...');
      } else {
        throw error;
      }
    }

    // Verify cleanup
    const remainingUsers = await db.select().from(schema.users);
    console.log(`\n✅ Cleanup complete!`);
    console.log(`📊 Remaining users: ${remainingUsers.length}`);
    console.log('\nRemaining users:');
    remainingUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.email}) - Role ID: ${user.roleId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Polyfill sql.raw if needed
const sql = {
  raw: (value: string) => value
};

// Run cleanup
cleanupUsers();
