/**
 * Database Cleanup Script
 * Deletes all users except the Super Admin (roleId = 0)
 * 
 * Usage: npx tsx server/cleanup-database.ts
 */

import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  process.exit(1);
}

const SUPER_ADMIN_ROLE_ID = 0;

async function cleanupDatabase() {
  const sql = postgres(DATABASE_URL, {
    ssl: { rejectUnauthorized: false },
    prepare: false
  });

  try {

    // Get all users
    const allUsers = await sql`SELECT id, username, email, role_id FROM users`;

    // Identify Super Admins
    const superAdmins = allUsers.filter((u: any) => u.role_id === SUPER_ADMIN_ROLE_ID);

    // Get users to delete
    const usersToDelete = allUsers.filter((u: any) => u.role_id !== SUPER_ADMIN_ROLE_ID);
    
    if (usersToDelete.length === 0) {
      await sql.end();
      process.exit(0);
    }

    usersToDelete.forEach((user: any) => {
    });

    const userIds = usersToDelete.map((u: any) => u.id);
    
    
    // Delete related records using ANY array syntax
    await sql`DELETE FROM student_answers WHERE session_id IN (SELECT id FROM exam_sessions WHERE student_id = ANY(${userIds}))`;
    await sql`DELETE FROM student_answers WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE created_by = ANY(${userIds})))`;
    await sql`DELETE FROM question_options WHERE question_id IN (SELECT id FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE created_by = ANY(${userIds})))`;
    await sql`DELETE FROM exam_questions WHERE exam_id IN (SELECT id FROM exams WHERE created_by = ANY(${userIds}))`;
    await sql`DELETE FROM exam_sessions WHERE student_id = ANY(${userIds})`;
    await sql`DELETE FROM exam_sessions WHERE exam_id IN (SELECT id FROM exams WHERE created_by = ANY(${userIds}))`;
    await sql`DELETE FROM exam_results WHERE student_id = ANY(${userIds})`;
    await sql`DELETE FROM exam_results WHERE exam_id IN (SELECT id FROM exams WHERE created_by = ANY(${userIds}))`;
    await sql`DELETE FROM exams WHERE created_by = ANY(${userIds})`;
    await sql`DELETE FROM attendance WHERE student_id = ANY(${userIds})`;
    await sql`DELETE FROM messages WHERE sender_id = ANY(${userIds}) OR recipient_id = ANY(${userIds})`;
    await sql`DELETE FROM announcements WHERE author_id = ANY(${userIds})`;
    await sql`DELETE FROM notifications WHERE user_id = ANY(${userIds})`;
    
    
    await sql`DELETE FROM students WHERE id = ANY(${userIds})`;
    await sql`DELETE FROM teacher_profiles WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM admin_profiles WHERE user_id = ANY(${userIds})`;
    await sql`DELETE FROM parent_profiles WHERE user_id = ANY(${userIds})`;
    
    
    await sql`DELETE FROM users WHERE id = ANY(${userIds})`;
    

    // Verify
    const remaining = await sql`SELECT id, username, email, role_id FROM users`;
    remaining.forEach((user: any) => {
    });

    await sql.end();
    process.exit(0);
  } catch (error: any) {
    await sql.end();
    process.exit(1);
  }
}

cleanupDatabase();
