/**
 * Database Cleanup Script
 * Deletes all users except the Super Admin (roleId = 0)
 * 
 * Usage: npx tsx server/cleanup-users.ts
 */

import { db } from './storage';
import * as schema from '@shared/schema';
import { eq, ne, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';

const SUPER_ADMIN_ROLE_ID = 0;

async function cleanupUsers() {
  try {

    // Step 1: Get all users
    const allUsers = await db.select().from(schema.users);

    // Step 2: Identify Super Admin users
    const superAdmins = allUsers.filter(user => user.roleId === SUPER_ADMIN_ROLE_ID);
    superAdmins.forEach(admin => {
    });

    // Step 3: Identify users to delete
    const usersToDelete = allUsers.filter(user => user.roleId !== SUPER_ADMIN_ROLE_ID);
    
    if (usersToDelete.length === 0) {
      process.exit(0);
    }

    // Show which users will be deleted
    usersToDelete.forEach(user => {
    });

    // Step 4: Delete users and all related data (non-interactive mode)
    
    // Helper function to safely delete from tables
    const safeDelete = async (tableName: string, deleteOperation: () => Promise<any>) => {
      try {
        await deleteOperation();
      } catch (error: any) {
        if (error?.cause?.code !== '42P01') { // Ignore "relation does not exist" errors
          throw error;
        }
      }
    };
    
    // Delete all related data for each user
    for (const user of usersToDelete) {
      try {
        
        // Delete student exam sessions and their answers first
        const userSessions = await db.select({ id: schema.examSessions.id })
          .from(schema.examSessions)
          .where(eq(schema.examSessions.studentId, user.id));
        
        for (const session of userSessions) {
          await safeDelete('studentAnswers', () =>
            db.delete(schema.studentAnswers).where(eq(schema.studentAnswers.sessionId, session.id))
          );
        }
        
        // Now delete exam sessions
        await safeDelete('examSessions', () =>
          db.delete(schema.examSessions).where(eq(schema.examSessions.studentId, user.id))
        );
        
        // Delete exam results
        await safeDelete('examResults', () =>
          db.delete(schema.examResults).where(eq(schema.examResults.studentId, user.id))
        );
        
        // Delete attendance
        await safeDelete('attendance', () =>
          db.delete(schema.attendance).where(eq(schema.attendance.studentId, user.id))
        );
        
        // Delete exams created by this user (and all their related data)
        const userExams = await db.select({ id: schema.exams.id })
          .from(schema.exams)
          .where(eq(schema.exams.createdBy, user.id));
        
        for (const exam of userExams) {
          // Get all exam sessions for this exam
          const examSessions = await db.select({ id: schema.examSessions.id })
            .from(schema.examSessions)
            .where(eq(schema.examSessions.examId, exam.id));
          
          // Delete student answers for all sessions of this exam
          for (const session of examSessions) {
            await safeDelete('studentAnswers-session', () =>
              db.delete(schema.studentAnswers).where(eq(schema.studentAnswers.sessionId, session.id))
            );
          }
          
          // Delete exam questions and their answers/options
          const examQuestions = await db.select({ id: schema.examQuestions.id })
            .from(schema.examQuestions)
            .where(eq(schema.examQuestions.examId, exam.id));
          
          for (const question of examQuestions) {
            // Delete student answers for this question
            await safeDelete('studentAnswers-question', () =>
              db.delete(schema.studentAnswers).where(eq(schema.studentAnswers.questionId, question.id))
            );
            
            // Delete question options
            await safeDelete('questionOptions', () =>
              db.delete(schema.questionOptions).where(eq(schema.questionOptions.questionId, question.id))
            );
          }
          
          // Delete exam questions
          await safeDelete('examQuestions', () =>
            db.delete(schema.examQuestions).where(eq(schema.examQuestions.examId, exam.id))
          );
          
          // Delete exam results
          await safeDelete('examResults-exam', () =>
            db.delete(schema.examResults).where(eq(schema.examResults.examId, exam.id))
          );
          
          // Delete exam sessions
          await safeDelete('examSessions-exam', () =>
            db.delete(schema.examSessions).where(eq(schema.examSessions.examId, exam.id))
          );
          
          // Finally delete the exam
          await safeDelete('exams', () =>
            db.delete(schema.exams).where(eq(schema.exams.id, exam.id))
          );
        }
        
        // Delete messages
        await safeDelete('messages-sender', () =>
          db.delete(schema.messages).where(eq(schema.messages.senderId, user.id))
        );
        
        await safeDelete('messages-recipient', () =>
          db.delete(schema.messages).where(eq(schema.messages.recipientId, user.id))
        );
        
        // Delete announcements
        await safeDelete('announcements', () =>
          db.delete(schema.announcements).where(eq(schema.announcements.authorId, user.id))
        );
        
        // Delete notifications
        await safeDelete('notifications', () =>
          db.delete(schema.notifications).where(eq(schema.notifications.userId, user.id))
        );
        
        // Delete study resources
        await safeDelete('studyResources', () =>
          db.delete(schema.studyResources).where(eq(schema.studyResources.uploadedBy, user.id))
        );
        
        // Delete grading tasks (check if table exists and has teacherId column)
        try {
          const gradingTasks = await db.select({ id: schema.gradingTasks.id })
            .from(schema.gradingTasks)
            .where(eq(schema.gradingTasks.assignedTo, user.id));
          
          for (const task of gradingTasks) {
            await safeDelete('gradingTasks', () =>
              db.delete(schema.gradingTasks).where(eq(schema.gradingTasks.id, task.id))
            );
          }
        } catch (error: any) {
          if (error?.cause?.code !== '42P01' && error?.cause?.code !== '42703') {
            throw error;
          }
        }
        
        // Delete teacher class assignments
        await safeDelete('teacherClassAssignments', () =>
          db.delete(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.teacherId, user.id))
        );
        
        // Delete students table entry (if this is a student)
        await safeDelete('students', () => 
          db.delete(schema.students).where(eq(schema.students.id, user.id))
        );
        
        // Delete profile tables
        await safeDelete('teacherProfiles', () =>
          db.delete(schema.teacherProfiles).where(eq(schema.teacherProfiles.userId, user.id))
        );
        
        await safeDelete('adminProfiles', () =>
          db.delete(schema.adminProfiles).where(eq(schema.adminProfiles.userId, user.id))
        );
        
        await safeDelete('parentProfiles', () =>
          db.delete(schema.parentProfiles).where(eq(schema.parentProfiles.userId, user.id))
        );
        
        // Finally delete the user
        await db.delete(schema.users).where(eq(schema.users.id, user.id));
        
      } catch (error: any) {
        if (error?.cause?.detail) {
        }
      }
    }

    // Step 6: Verify cleanup
    const remainingUsers = await db.select().from(schema.users);
    remainingUsers.forEach(user => {
    });

    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
}

// Run cleanup
cleanupUsers();
