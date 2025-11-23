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

    // Step 1: Get all users
    const allUsers = await db.select().from(schema.users);

    // Step 2: Identify Super Admin users
    const superAdmins = allUsers.filter((user: typeof schema.users.$inferSelect) => user.roleId === SUPER_ADMIN_ROLE_ID);

    // Step 3: Identify users to delete
    const usersToDelete = allUsers.filter((user: typeof schema.users.$inferSelect) => user.roleId !== SUPER_ADMIN_ROLE_ID);
    
    if (usersToDelete.length === 0) {
      process.exit(0);
    }
    
    // Use SQL to bypass Drizzle's ORM issues
    const userIdsToDelete = usersToDelete.map((u: typeof schema.users.$inferSelect) => `'${u.id}'`).join(',');
    
    // Execute raw SQL to delete all related data in proper order
    const sqlClient = (db as any).$client;
    
    try {
      
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
      
      await sqlClient`DELETE FROM students WHERE id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM teacher_profiles WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM admin_profiles WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      await sqlClient`DELETE FROM parent_profiles WHERE user_id IN (${sql.raw(userIdsToDelete)})`;
      
      await sqlClient`DELETE FROM users WHERE id IN (${sql.raw(userIdsToDelete)})`;
      
    } catch (error: any) {
      if (!error.message.includes('does not exist')) {
        throw error;
      }
    }

    // Verify cleanup
    const remainingUsers = await db.select().from(schema.users);
    remainingUsers.forEach((user: typeof schema.users.$inferSelect) => {
    });

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Polyfill sql.raw if needed
const sql = {
  raw: (value: string) => value
};

// Run cleanup
cleanupUsers();
