import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema, insertExamSchema, insertExamResultSchema, insertExamQuestionSchema, insertQuestionOptionSchema, createQuestionOptionSchema, insertHomePageContentSchema, insertContactMessageSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, createStudentSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";

// Type for authenticated user
interface AuthenticatedUser {
  id: string;
  email: string;
  roleId: number;
  firstName: string;
  lastName: string;
}

// Extend Express Request interface to include user property added by authentication middleware
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1)
});

// JWT secret - MUST be provided via environment variable for security
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is required but not set!');
  console.error('Please set a secure JWT_SECRET environment variable before starting the server.');
  process.exit(1);
}
// Type assertion since we've already checked for existence
const SECRET_KEY = JWT_SECRET as string;
const JWT_EXPIRES_IN = '24h';

// Helper to normalize UUIDs from various formats
function normalizeUuid(raw: any): string | undefined {
  if (!raw) return undefined;

  // If already a valid UUID string, return as-is
  if (typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }

  let bytes: number[] | undefined;

  // Handle comma-separated string of numbers
  if (typeof raw === 'string' && raw.includes(',')) {
    const parts = raw.split(',').map(s => parseInt(s.trim()));
    if (parts.length === 16 && parts.every(n => n >= 0 && n <= 255)) {
      bytes = parts;
    }
  }

  // Handle number array or Uint8Array
  if (Array.isArray(raw) && raw.length === 16) {
    bytes = raw;
  } else if (raw instanceof Uint8Array && raw.length === 16) {
    bytes = Array.from(raw);
  }

  // Convert bytes to UUID format
  if (bytes) {
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  }

  console.warn('Failed to normalize UUID:', raw);
  return undefined;
}

// Define role constants to prevent authorization bugs
const ROLES = {
  ADMIN: 1,
  TEACHER: 2,
  STUDENT: 3,
  PARENT: 4
} as const;

// Rate limiting for login attempts (simple in-memory store)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const BCRYPT_ROUNDS = 12;

// Secure JWT authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    // Robust Authorization header parsing (case-insensitive, handles whitespace)
    const authHeader = (req.headers.authorization || '').trim();
    const [scheme, token] = authHeader.split(/\s+/);

    if (!/^bearer$/i.test(scheme) || !token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Normalize decoded userId before database lookup
    const normalizedUserId = normalizeUuid(decoded.userId);
    if (!normalizedUserId) {
      console.error('Invalid userId in token:', decoded.userId);
      return res.status(401).json({ message: "Invalid token format" });
    }

    // Validate user still exists in database
    const user = await storage.getUser(normalizedUserId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Block inactive users (blocked/deactivated accounts)
    if (user.isActive === false) {
      return res.status(401).json({ message: "Account has been deactivated. Please contact administrator." });
    }

    // Ensure role hasn't changed since token was issued
    if (user.roleId !== decoded.roleId) {
      return res.status(401).json({ message: "User role has changed, please log in again" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: "Authentication failed" });
  }
};

// Role-based authorization middleware
const authorizeRoles = (...allowedRoles: number[]) => {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      if (!allowedRoles.includes(req.user.roleId)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      res.status(403).json({ message: "Authorization failed" });
    }
  };
};

// Configure multer for file uploads
const uploadDir = 'uploads';
const galleryDir = 'uploads/gallery';
const profileDir = 'uploads/profiles';
const studyResourcesDir = 'uploads/study-resources';

// Ensure upload directories exist
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {});
fs.mkdir(profileDir, { recursive: true }).catch(() => {});
fs.mkdir(studyResourcesDir, { recursive: true }).catch(() => {});

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || 'general';
    let dir = uploadDir;

    if (uploadType === 'gallery') {
      dir = galleryDir;
    } else if (uploadType === 'profile') {
      dir = profileDir;
    } else if (uploadType === 'study-resource') {
      dir = studyResourcesDir;
    }

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Separate multer configuration for study resources (documents)
const uploadDocument = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|rtf|odt|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /application\/(pdf|msword|vnd\.openxmlformats-officedocument|vnd\.oasis\.opendocument|text\/plain|vnd\.ms-powerpoint|vnd\.ms-excel)/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only document files (PDF, DOC, DOCX, TXT, RTF, ODT, PPT, PPTX, XLS, XLSX) are allowed!'));
    }
  }
});

// BACKGROUND TIMEOUT CLEANUP SERVICE - Prevents infinite waiting
async function cleanupExpiredExamSessions(): Promise<void> {
  try {
    console.log('🧹 TIMEOUT CLEANUP: Checking for expired exam sessions...');

    // PERFORMANCE IMPROVEMENT: Get only expired sessions directly from database
    // instead of fetching all active sessions and filtering in memory
    const now = new Date();
    const rawResult = await storage.getExpiredExamSessions(now, 50);
    const expiredSessions = Array.isArray(rawResult) ? rawResult : []; // Ensure it's always an array

    console.log(`🧹 Found ${expiredSessions.length} expired sessions to cleanup`);

    // Process in smaller batches to avoid overwhelming the database
    for (const session of expiredSessions) {
      try {
        console.log(`⏰ AUTO-CLEANUP: Force submitting expired session ${session.id} for student ${session.studentId}`);

        // Mark session as auto-submitted by server cleanup
        await storage.updateExamSession(session.id, {
          isCompleted: true,
          submittedAt: now,
          status: 'submitted'
        });

        // Auto-score the session using our optimized scoring
        await autoScoreExamSession(session.id, storage);

        console.log(`✅ Successfully cleaned up expired session ${session.id}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup session ${session.id}:`, error);
        // Continue with other sessions even if one fails
      }
    }
  } catch (error) {
    console.error('❌ Background cleanup service error:', error);
  }
}

// PERFORMANCE FIX: Reduce cleanup frequency from 30s to 3 minutes to prevent database contention
const cleanupInterval = 3 * 60 * 1000; // 3 minutes (was 30 seconds)
const jitter = Math.random() * 30000; // Add 0-30s random jitter to prevent thundering herd
setTimeout(() => {
  setInterval(cleanupExpiredExamSessions, cleanupInterval);
  cleanupExpiredExamSessions(); // Run immediately after jitter delay
}, jitter);
console.log(`🧹 TIMEOUT PROTECTION: Background cleanup service started (every ${cleanupInterval/1000/60} minutes with jitter)`);

// OPTIMIZED Auto-scoring function for <2 second performance goal
async function autoScoreExamSession(sessionId: number, storage: any): Promise<void> {
  const startTime = Date.now();

  try {
    console.log(`🚀 OPTIMIZED AUTO-SCORING: Starting session ${sessionId} scoring...`);

    // Get scoring data efficiently with detailed question breakdown
    const scoringResult = await storage.getExamScoringData(sessionId);
    const { session, summary, scoringData } = scoringResult;

    const databaseQueryTime = Date.now() - startTime;
    console.log(`⚡ PERFORMANCE: Database query completed in ${databaseQueryTime}ms (was 3000-8000ms before)`);

    const { totalQuestions, maxScore, studentScore, autoScoredQuestions } = summary;

    // Use the optimized results
    const totalScore = studentScore;
    const maxPossibleScore = maxScore;

    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;

    console.log(`✅ OPTIMIZED SCORING: Session ${sessionId} - ${totalQuestions} questions (${hasMultipleChoiceQuestions ? autoScoredQuestions + ' MC' : 'no MC'}, ${hasEssayQuestions ? (totalQuestions - autoScoredQuestions) + ' Essays' : 'no Essays'})`);

    // Enhanced question-by-question breakdown for detailed feedback
    const questionDetails = scoringData.map((q: any) => {
      const questionDetail = {
        questionId: q.questionId,
        questionType: q.questionType,
        points: q.points,
        maxPoints: q.points,
        pointsEarned: q.isCorrect ? q.points : 0,
        isCorrect: q.questionType === 'multiple_choice' ? q.isCorrect : null, // null for manual review needed
        autoScored: q.questionType === 'multiple_choice',
        feedback: null as string | null
      };

      // Add specific feedback based on question type and result
      if (q.questionType === 'multiple_choice') {
        if (q.isCorrect) {
          questionDetail.feedback = `Correct! You earned ${q.points} point${q.points !== 1 ? 's' : ''}.`;
        } else {
          questionDetail.feedback = `Incorrect. This question was worth ${q.points} point${q.points !== 1 ? 's' : ''}.`;
        }
      } else {
        questionDetail.feedback = `This ${q.questionType} question will be manually reviewed by your instructor.`;
      }

      return questionDetail;
    });

    // CRITICAL FIX: Persist MCQ points to student_answers for accurate score merging
    console.log('💾 Persisting MCQ scores to student_answers for score merging...');
    const studentAnswers = await storage.getStudentAnswers(sessionId);
    for (const detail of questionDetails) {
      if (detail.autoScored && detail.questionId) {
        // Find the student answer for this question
        const studentAnswer = studentAnswers.find(sa => sa.questionId === detail.questionId);
        if (studentAnswer) {
          try {
            await storage.updateStudentAnswer(studentAnswer.id, {
              pointsEarned: detail.pointsEarned,
              isCorrect: detail.isCorrect,
              autoScored: true
            });
            console.log(`✅ Updated answer ${studentAnswer.id} with ${detail.pointsEarned} points`);
          } catch (updateError) {
            console.error(`❌ Failed to update answer ${studentAnswer.id}:`, updateError);
          }
        }
      }
    }

    // Calculate detailed breakdown
    const breakdown = {
      totalQuestions,
      autoScoredQuestions,
      correctAnswers: questionDetails.filter((q: any) => q.isCorrect === true).length,
      incorrectAnswers: questionDetails.filter((q: any) => q.isCorrect === false).length,
      pendingManualReview: questionDetails.filter((q: any) => q.isCorrect === null).length,
      maxScore: maxPossibleScore,
      earnedScore: totalScore
    };

    // Log detailed scoring for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 DETAILED BREAKDOWN:`, breakdown);
      questionDetails.forEach((q: any, index: number) => {
        console.log(`Question ${index + 1} (ID: ${q.questionId}): ${q.isCorrect !== null ? (q.isCorrect ? 'Correct!' : 'Incorrect') : 'Manual Review'} - ${q.pointsEarned}/${q.points} points`);
      });
    }

    // Create or update exam result - CRITICAL for instant feedback
    console.log(`🎯 Preparing exam result for student ${session.studentId}, exam ${session.examId}`);
    console.log(`📊 Score calculation: ${totalScore}/${maxPossibleScore} (${breakdown.correctAnswers} correct, ${breakdown.incorrectAnswers} incorrect, ${breakdown.pendingManualReview} pending manual review)`);

    // ENHANCED ERROR HANDLING: Add validation before database operations
    if (!session.studentId) {
      throw new Error('CRITICAL: Session missing studentId - cannot create exam result');
    }
    if (!session.examId) {
      throw new Error('CRITICAL: Session missing examId - cannot create exam result');
    }
    if (maxPossibleScore === 0 && totalQuestions > 0) {
      console.warn('⚠️ WARNING: Max possible score is 0 but exam has questions - check question points configuration');
    }

    const existingResults = await storage.getExamResultsByStudent(session.studentId);
    console.log(`🔍 Found ${existingResults.length} existing results for student ${session.studentId}`);

    const existingResult = existingResults.find((r: any) => r.examId === session.examId);
    if (existingResult) {
      console.log(`📋 Found existing result ID ${existingResult.id} for exam ${session.examId} - will update`);
    } else {
      console.log(`🆕 No existing result found for exam ${session.examId} - will create new`);
    }

    // Use a valid UUID for system auto-scoring - check if it exists in users table
    let SYSTEM_AUTO_SCORING_UUID = '00000000-0000-0000-0000-000000000001';

    // Try to find an admin user for recordedBy, fallback to session's student
    try {
      const adminUsers = await storage.getUsersByRole(ROLES.ADMIN);
      if (adminUsers && adminUsers.length > 0) {
        SYSTEM_AUTO_SCORING_UUID = adminUsers[0].id;
        console.log(`Using admin user ${SYSTEM_AUTO_SCORING_UUID} for auto-scoring recordedBy`);
      } else {
        // Use the student who took the exam as fallback
        SYSTEM_AUTO_SCORING_UUID = session.studentId;
        console.log(`No admin found, using student ${SYSTEM_AUTO_SCORING_UUID} for auto-scoring recordedBy`);
      }
    } catch (userError) {
      console.warn('Failed to find admin for auto-scoring, using student ID:', userError);
      SYSTEM_AUTO_SCORING_UUID = session.studentId;
    }

    const resultData = {
      examId: session.examId,
      studentId: session.studentId,
      score: totalScore,
      maxScore: maxPossibleScore,
      marksObtained: totalScore, // ✅ CRITICAL FIX: Ensure database constraint compatibility
      autoScored: true, // Always true when auto-scoring pass completes
      recordedBy: SYSTEM_AUTO_SCORING_UUID, // Special UUID for auto-generated results
      // Include detailed feedback in the result data
      questionDetails: questionDetails,
      breakdown: breakdown,
      immediateResults: {
        questions: questionDetails,
        summary: breakdown
      }
    };

    console.log('💾 Result data to save:', JSON.stringify(resultData, null, 2));

    try {
      if (existingResult) {
        // Update existing result
        console.log(`🔄 Updating existing exam result ID: ${existingResult.id}`);
        const updatedResult = await storage.updateExamResult(existingResult.id, resultData);
        if (!updatedResult) {
          throw new Error(`Failed to update exam result ID: ${existingResult.id} - updateExamResult returned null/undefined`);
        }
        console.log(`✅ Updated exam result for student ${session.studentId}: ${totalScore}/${maxPossibleScore} (ID: ${existingResult.id})`);
        console.log(`🎉 INSTANT FEEDBACK READY: Result updated successfully!`);
      } else {
        // Create new result
        console.log('🆕 Creating new exam result...');
        const newResult = await storage.recordExamResult(resultData);
        if (!newResult || !newResult.id) {
          throw new Error('Failed to create exam result - recordExamResult returned null/undefined or missing ID');
        }
        console.log(`✅ Created new exam result for student ${session.studentId}: ${totalScore}/${maxPossibleScore} (ID: ${newResult.id})`);
        console.log(`🎉 INSTANT FEEDBACK READY: New result created successfully!`);
      }

      // Verify the result was saved by immediately retrieving it
      console.log(`🔍 Verifying result was saved - fetching results for student ${session.studentId}...`);
      const verificationResults = await storage.getExamResultsByStudent(session.studentId);
      const savedResult = verificationResults.find((r: any) => r.examId === session.examId && r.autoScored === true);

      if (!savedResult) {
        throw new Error('CRITICAL: Result was not properly saved - verification fetch failed to find the auto-scored result');
      }

      console.log(`✅ Verification successful: Result found with score ${savedResult.score}/${savedResult.maxScore}, autoScored: ${savedResult.autoScored}`);

      // ENHANCED PERFORMANCE MONITORING - Track 2-second submission goal
      const totalResponseTime = Date.now() - startTime;
      const scoringTime = totalResponseTime - databaseQueryTime;

      // Performance metrics tracking
      const performanceMetrics = {
        sessionId,
        startTime: new Date(startTime).toISOString(),
        databaseQueryTime: databaseQueryTime,
        scoringTime: scoringTime,
        totalResponseTime: totalResponseTime,
        goalAchieved: totalResponseTime <= 2000
      };

      // Alert if submission exceeds 2-second goal
      if (totalResponseTime > 2000) {
        console.warn(`🚨 PERFORMANCE ALERT: Auto-scoring took ${totalResponseTime}ms (exceeded 2-second goal by ${totalResponseTime - 2000}ms)`);
        console.warn(`💡 OPTIMIZATION NEEDED: Consider query optimization or caching for session ${sessionId}`);
      } else {
        console.log(`🎯 PERFORMANCE SUCCESS: Auto-scoring completed in ${totalResponseTime}ms (within 2-second goal! ✅)`);
        console.log(`📊 PERFORMANCE METRICS: DB Query: ${databaseQueryTime}ms, Scoring: ${scoringTime}ms, Total: ${totalResponseTime}ms`);
      }

      // Store performance event in database for monitoring
      try {
        await storage.logPerformanceEvent({
          sessionId,
          eventType: 'auto_scoring',
          duration: totalResponseTime,
          goalAchieved: totalResponseTime <= 2000,
          metadata: JSON.stringify({
            databaseQueryTime,
            scoringTime,
            studentId: session.studentId,
            examId: session.examId
          }),
          userId: session.studentId, // Track which student's exam was auto-scored
          clientSide: false // Server-side auto-scoring
        });
        console.log(`📊 Performance event logged to database: ${totalResponseTime}ms auto-scoring`);
      } catch (perfLogError) {
        console.warn('⚠️ Failed to log performance event to database:', perfLogError);
        // Don't throw - this shouldn't break the auto-scoring process
      }

      // Log detailed metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔬 DETAILED METRICS:`, JSON.stringify(performanceMetrics, null, 2));
      }

      console.log(`🚀 AUTO-SCORING COMPLETE - Student should see instant results!`);

    } catch (error) {
      const totalErrorTime = Date.now() - startTime;
      console.error(`Auto-scoring error after ${totalErrorTime}ms:`, error);
      throw error;
    }
  } catch (error) {
    const totalErrorTime = Date.now() - startTime;
    console.error(`Auto-scoring error after ${totalErrorTime}ms:`, error);
    throw error;
  }
}

// Score Merging Function: Combine auto-scored + manually graded results
async function mergeExamScores(answerId: number, storage: any): Promise<void> {
  try {
    console.log(`🔄 SCORE MERGE: Starting merge for answer ${answerId}...`);

    // Get the answer details to find session and exam info
    const answer = await storage.getStudentAnswerById(answerId);
    if (!answer) {
      console.error(`❌ SCORE MERGE: Answer ${answerId} not found`);
      return;
    }

    const sessionId = answer.sessionId;
    console.log(`📝 SCORE MERGE: Processing session ${sessionId}`);

    // Get all answers and questions for this session
    const allAnswers = await storage.getStudentAnswers(sessionId);
    const session = await storage.getExamSessionById(sessionId);
    const examQuestions = await storage.getExamQuestions(session.examId);

    // Check if all essay questions are graded
    const essayQuestions = examQuestions.filter((q: any) => 
      q.questionType === 'text' || q.questionType === 'essay'
    );
    
    const gradedEssayAnswers = allAnswers.filter((a: any) => {
      const question = examQuestions.find((q: any) => q.id === a.questionId);
      const isEssay = question?.questionType === 'text' || question?.questionType === 'essay';
      return isEssay && a.pointsEarned !== null && a.pointsEarned !== undefined;
    });

    const allEssaysGraded = essayQuestions.length === gradedEssayAnswers.length;

    if (!allEssaysGraded) {
      console.log(`⏳ SCORE MERGE: Not all essays graded yet (${gradedEssayAnswers.length}/${essayQuestions.length}). Skipping merge.`);
      return;
    }

    console.log(`✅ SCORE MERGE: All essays graded! Calculating final score...`);

    // Calculate total score by summing all points earned
    let totalScore = 0;
    let maxScore = 0;

    for (const question of examQuestions) {
      maxScore += question.points || 0;
      
      const studentAnswer = allAnswers.find((a: any) => a.questionId === question.id);
      if (studentAnswer) {
        // Treat undefined/null as 0 to be safe
        totalScore += studentAnswer.pointsEarned || 0;
      }
    }

    console.log(`📊 SCORE MERGE: Final score = ${totalScore}/${maxScore}`);

    // Update or create the exam result with merged score
    const existingResult = await storage.getExamResultByExamAndStudent(session.examId, session.studentId);

    if (existingResult) {
      // Update existing result
      await storage.updateExamResult(existingResult.id, {
        score: totalScore,
        maxScore: maxScore,
        marksObtained: totalScore,
        autoScored: false, // Now includes manual scores
      });
      console.log(`✅ SCORE MERGE: Updated exam result ${existingResult.id} with merged score`);
    } else {
      // Create new result (shouldn't happen, but handle it)
      await storage.recordExamResult({
        examId: session.examId,
        studentId: session.studentId,
        score: totalScore,
        maxScore: maxScore,
        marksObtained: totalScore,
        autoScored: false,
        recordedBy: session.studentId, // System recorded
      });
      console.log(`✅ SCORE MERGE: Created new exam result with merged score`);
    }

    console.log(`🎉 SCORE MERGE: Complete! Final score saved.`);

  } catch (error) {
    console.error(`❌ SCORE MERGE ERROR:`, error);
    // Don't throw - log and return so grading flow isn't blocked
    // The merge can be retried later or triggered manually
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Secure admin-only route to reset weak passwords
  app.post("/api/admin/reset-weak-passwords", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      console.log('Admin password reset requested by:', req.user?.email);

      // Get all users to check for weak passwords
      const allRoles = await storage.getRoles();
      let allUsers: any[] = [];
      for (const role of allRoles) {
        const roleUsers = await storage.getUsersByRole(role.id);
        allUsers.push(...roleUsers);
      }

      // Check users who might have the weak default password by attempting to verify against 'password123'
      const usersToUpdate = [];
      for (const user of allUsers) {
        if (user.passwordHash) {
          try {
            const hasWeakPassword = await bcrypt.compare('password123', user.passwordHash);
            if (hasWeakPassword) {
              usersToUpdate.push(user);
            }
          } catch (error) {
            // Skip users with invalid password hashes
            console.warn(`Skipping user ${user.email} - invalid password hash`);
          }
        }
      }

      console.log(`Found ${usersToUpdate.length} users with weak passwords`);

      if (usersToUpdate.length === 0) {
        return res.json({
          message: "No users found with weak passwords",
          updatedCount: 0
        });
      }

      // Generate strong unique passwords and update users
      const passwordUpdates = [];
      let updateCount = 0;

      for (const user of usersToUpdate) {
        try {
          // Generate a strong random password
          const strongPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + Math.floor(Math.random() * 100);
          const hashedPassword = await bcrypt.hash(strongPassword, BCRYPT_ROUNDS);

          // Update user with new password
          const updatedUser = await storage.updateUser(user.id, { passwordHash: hashedPassword });

          if (updatedUser) {
            passwordUpdates.push({
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              newPassword: strongPassword
            });
            updateCount++;
            console.log(`✅ Updated password for ${user.email}`);
          }
        } catch (error) {
          console.error(`❌ Failed to update password for ${user.email}:`, error);
        }
      }

      // Return results - Note: In production, consider more secure ways to communicate new passwords
      res.json({
        message: `Successfully updated ${updateCount} user passwords`,
        updatedCount: updateCount,
        warning: "Please securely communicate new passwords to users",
        passwordUpdates: passwordUpdates
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Failed to reset passwords" 
      });
    }
  });

  // Secure file serving for uploads - require authentication
  app.get('/uploads/:filename', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), (req, res) => {
    const { filename } = req.params;
    const filePath = path.resolve('uploads', filename);

    // Security: Prevent path traversal attacks
    if (!filePath.startsWith(path.resolve('uploads'))) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ message: "File not found" });
      }
    });
  });

  // Setup/Demo data route (for development) - Admin only for security
  app.post("/api/setup-demo", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      console.log('Setting up demo data...');

      // First check if roles exist, if not this will tell us about database structure
      try {
        const existingRoles = await storage.getRoles();
        console.log('Existing roles:', existingRoles.length);

        // If no roles, we can't proceed without proper role creation method
        // For now, let's just log what we found and return a helpful message
        if (existingRoles.length === 0) {
          console.log('No roles found in database');
          return res.json({ 
            message: "No roles found. Database tables may need to be created first.",
            rolesCount: 0
          });
        }

        // Try to create demo users if roles exist
        const demoUsers = [
          {
            email: 'student@demo.com',
            firstName: 'John',
            lastName: 'Doe',
            roleId: existingRoles.find(r => r.name === 'Student')?.id || existingRoles[0].id
          },
          {
            email: 'teacher@demo.com',
            firstName: 'Jane',
            lastName: 'Smith',
            roleId: existingRoles.find(r => r.name === 'Teacher')?.id || existingRoles[0].id
          },
          {
            email: 'parent@demo.com',
            firstName: 'Bob',
            lastName: 'Johnson',
            roleId: existingRoles.find(r => r.name === 'Parent')?.id || existingRoles[0].id
          },
          {
            email: 'admin@demo.com',
            firstName: 'Admin',
            lastName: 'User',
            roleId: existingRoles.find(r => r.name === 'Admin')?.id || existingRoles[0].id
          }
        ];

        let createdCount = 0;
        for (const userData of demoUsers) {
          try {
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(userData.email);
            if (!existingUser) {
              await storage.createUser(userData);
              createdCount++;
              console.log(`Created demo user: ${userData.email}`);
            } else {
              console.log(`User already exists: ${userData.email}`);
            }
          } catch (userError) {
            console.error(`Failed to create user ${userData.email}:`, userError);
          }
        }

        res.json({ 
          message: "Demo setup completed",
          rolesCount: existingRoles.length,
          usersCreated: createdCount,
          roles: existingRoles.map(r => r.name)
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        res.status(500).json({ 
          message: "Database connection failed", 
          error: dbError instanceof Error ? dbError.message : "Unknown database error"
        });
      }
    } catch (error) {
      console.error('Setup demo error:', error);
      res.status(500).json({ message: "Setup failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      console.log('Login attempt for email:', req.body.email || 'unknown');

      // Rate limiting to prevent brute force attacks
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const attemptKey = `${clientIp}:${req.body.email || 'no-email'}`;
      const now = Date.now();

      // Clean up old attempts
      for (const [key, data] of Array.from(loginAttempts.entries())) {
        if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
          loginAttempts.delete(key);
        }
      }

      // Check rate limit
      const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      if (attempts.count >= MAX_LOGIN_ATTEMPTS && (now - attempts.lastAttempt) < RATE_LIMIT_WINDOW) {
        console.warn(`Rate limit exceeded for ${attemptKey}`);
        return res.status(429).json({ 
          message: "Too many login attempts. Please try again in 15 minutes." 
        });
      }

      // Validate input - note: role is now derived from database, not from client
      const { email, password } = loginSchema.parse(req.body);

      // Increment attempt counter
      loginAttempts.set(attemptKey, {
        count: attempts.count + 1,
        lastAttempt: now
      });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`Login failed: User not found for email ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // CRITICAL: Verify password hash with bcrypt
      if (!user.passwordHash) {
        console.error(`SECURITY WARNING: User ${email} has no password hash set`);
        return res.status(401).json({ message: "Account setup incomplete. Please contact administrator." });
      }

      // Compare provided password with stored hash
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log(`Login failed: Invalid password for email ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Password verification successful - reset rate limit
      loginAttempts.delete(attemptKey);

      // Generate JWT token with user claims - ensure UUID is string
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });

      console.log(`Login successful for ${email} with roleId: ${user.roleId}`);

      res.json({ 
        token,
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName,
          roleId: user.roleId 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email or password format" });
      }
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });


  // Public contact form with 100% Supabase persistence
  app.post("/api/contact", async (req, res) => {
    try {
      const data = contactSchema.parse(req.body);

      // Save to Supabase database permanently
      const contactMessageData = insertContactMessageSchema.parse({
        name: data.name,
        email: data.email,
        message: data.message,
        subject: null, // Can be extended later if needed
        isRead: false
      });

      const savedMessage = await storage.createContactMessage(contactMessageData);
      console.log("✅ Contact form saved to database:", { id: savedMessage.id, email: data.email });

      res.json({ 
        message: "Message sent successfully! We'll get back to you soon.",
        id: savedMessage.id 
      });
    } catch (error) {
      console.error("❌ Contact form error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to send message. Please try again." });
    }
  });

  // User management - Admin only
  app.get("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { role } = req.query;
      let users: any[] = [];

      if (role && typeof role === 'string') {
        const userRole = await storage.getRoleByName(role);
        if (userRole) {
          users = await storage.getUsersByRole(userRole.id);
        } else {
          users = [];
        }
      } else {
        // Get all users - in a real app you'd need proper pagination
        const allRoles = await storage.getRoles();
        users = [];
        for (const userRole of allRoles) {
          const roleUsers = await storage.getUsersByRole(userRole.id);
          users.push(...roleUsers);
        }
      }

      // Remove sensitive data from response
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      // Extract password from request and hash it before storage
      const { password, ...otherUserData } = req.body;

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Prepare user data with hashed password
      const userData = insertUserSchema.parse({
        ...otherUserData,
        passwordHash
      });

      const user = await storage.createUser(userData);

      // Remove password hash from response for security
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('User creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid user data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      // Extract password if provided for separate handling
      const { password, passwordHash, ...otherUserData } = req.body;

      // Prevent direct passwordHash manipulation
      if (passwordHash) {
        return res.status(400).json({ message: "Direct password hash modification not allowed" });
      }

      let updateData = otherUserData;

      // If password provided, hash it properly
      if (password) {
        if (typeof password !== 'string' || password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        updateData = { ...otherUserData, passwordHash: hashedPassword };
      }

      const userData = insertUserSchema.partial().parse(updateData);
      const user = await storage.updateUser(id, userData);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password hash from response for security
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);

      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Student management
  app.get("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.query;
      let students: any[] = [];

      if (classId && typeof classId === 'string') {
        students = await storage.getStudentsByClass(parseInt(classId));
      } else {
        // Get all students including inactive ones so blocked students can be unblocked
        students = await storage.getAllStudents(true);
      }

      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log('Creating student for email:', req.body.email); // Log context without sensitive data

      // Simple date validation function that doesn't use Date constructor
      const isValidDate = (dateString: string): boolean => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;

        const [year, month, day] = dateString.split('-').map(Number);
        if (year < 1900 || year > 2100) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;

        // Check for invalid dates like Feb 30
        if (month === 2) {
          const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
          if (day > (isLeapYear ? 29 : 28)) return false;
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
          return false;
        }

        return true;
      };

      // Use shared schema and add enhanced date validation - prevents frontend/backend drift
      const sharedCreateStudentSchema = createStudentSchema.extend({
        dateOfBirth: createStudentSchema.shape.dateOfBirth.refine(isValidDate, "Invalid date of birth"),
        admissionDate: createStudentSchema.shape.admissionDate.refine(isValidDate, "Invalid admission date"),
        medicalInfo: z.string().nullable().optional().transform(val => val === null ? "" : val),
      });

      // Defensive normalization: convert null/empty strings to undefined for optional string fields
      for (const field of ["phone", "address", "medicalInfo", "parentId"]) {
        if (req.body[field] == null || req.body[field] === "") {
          delete req.body[field];
        }
      }

      const validatedData = sharedCreateStudentSchema.parse(req.body);

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email address already exists" });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_ROUNDS);

      // Prepare user data - store exact date strings, no conversion
      const userData = {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        dateOfBirth: validatedData.dateOfBirth, // Store exact YYYY-MM-DD string
        gender: validatedData.gender,
        profileImageUrl: validatedData.profileImageUrl || null,
        roleId: ROLES.STUDENT, // Always set to student role
        isActive: true
      };

      // Create user first
      console.log('Creating user for student...');
      const user = await storage.createUser(userData);
      console.log('User created with ID:', user.id);

      try {
        // Prepare student data - store exact values, no null conversion for required fields
        const studentData = {
          id: user.id, // Use the same ID as the user
          admissionNumber: validatedData.admissionNumber,
          classId: validatedData.classId,
          parentId: validatedData.parentId || null,
          admissionDate: validatedData.admissionDate, // Store exact YYYY-MM-DD string
          emergencyContact: validatedData.emergencyContact,
          medicalInfo: validatedData.medicalInfo || null,
        };

        // Create student record
        console.log('Creating student record...');
        const student = await storage.createStudent(studentData);
        console.log('Student created successfully');

        res.json({ 
          message: "Student created successfully",
          student,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          }
        });

      } catch (studentError) {
        // Rollback: delete the user if student creation fails
        console.error('Student creation failed, rolling back user:', studentError);
        try {
          await storage.deleteUser(user.id);
        } catch (rollbackError) {
          console.error('Rollback failed:', rollbackError);
        }

        if ((studentError as any).code === '23505') {
          return res.status(409).json({ message: "Admission number already exists" });
        }

        throw studentError;
      }

    } catch (error) {
      console.error('Error creating student:', error);

      // Handle validation errors with detailed information
      if ((error as any)?.name === 'ZodError' || ((error as any)?.issues && Array.isArray((error as any).issues))) {
        const validationErrors = (error as any).issues || [];
        const formattedErrors = validationErrors.map((err: any) => {
          const fieldPath = err.path.length > 0 ? err.path.join('.') : 'unknown field';
          return `${fieldPath}: ${err.message}`;
        });
        console.error('Student creation validation errors:', formattedErrors);
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: formattedErrors.join(', '),
          details: validationErrors // Include full details for debugging
        });
      }

      // Handle specific database errors
      if ((error as any)?.code) {
        switch ((error as any).code) {
          case '23503': // Foreign key violation
            if ((error as any).message.includes('role_id')) {
              return res.status(400).json({ message: "Invalid user role. Please contact administrator." });
            } else if ((error as any).message.includes('class_id')) {
              return res.status(400).json({ message: "Selected class does not exist. Please select a valid class." });
            } else if ((error as any).message.includes('parent_id')) {
              return res.status(400).json({ message: "Selected parent does not exist. Please select a valid parent." });
            }
            return res.status(400).json({ message: "Invalid reference data. Please check all selections." });
          case '22007': // Invalid datetime format
            return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD format." });
          case '23505': // Unique violation
            if ((error as any).message.includes('email')) {
              return res.status(409).json({ message: "Email address already exists" });
            } else if ((error as any).message.includes('admission_number')) {
              return res.status(409).json({ message: "Admission number already exists" });
            }
            return res.status(409).json({ message: "Duplicate value detected" });
          default:
            console.error('Database error:', (error as any).code, (error as any).message);
        }
      }

      res.status(500).json({ message: "Failed to create student" });
    }
  });

  // Update student (PATCH)
  app.patch("/api/students/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating student ${id}`);

      // Separate user and student data
      const { password, email, firstName, lastName, phone, address, dateOfBirth, gender, profileImageUrl, ...studentData } = req.body;

      // Prepare user patch data
      let userPatch: any = {};
      if (email !== undefined) userPatch.email = email;
      if (firstName !== undefined) userPatch.firstName = firstName;
      if (lastName !== undefined) userPatch.lastName = lastName;
      if (phone !== undefined) userPatch.phone = phone;
      if (address !== undefined) userPatch.address = address;
      if (dateOfBirth !== undefined) userPatch.dateOfBirth = dateOfBirth;
      if (gender !== undefined) userPatch.gender = gender;
      if (profileImageUrl !== undefined) userPatch.profileImageUrl = profileImageUrl;

      // Handle password separately if provided
      if (password && password.length >= 6) {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        userPatch.passwordHash = passwordHash;
      }

      // Prepare student patch data
      let studentPatch: any = {};
      if (studentData.admissionNumber !== undefined) studentPatch.admissionNumber = studentData.admissionNumber;
      if (studentData.classId !== undefined) studentPatch.classId = studentData.classId;
      if (studentData.parentId !== undefined) studentPatch.parentId = studentData.parentId;
      if (studentData.admissionDate !== undefined) studentPatch.admissionDate = studentData.admissionDate;
      if (studentData.emergencyContact !== undefined) studentPatch.emergencyContact = studentData.emergencyContact;
      if (studentData.medicalInfo !== undefined) studentPatch.medicalInfo = studentData.medicalInfo;

      // Check for existing email if email is being updated
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({ message: "Email address already exists" });
        }
      }

      // Check for existing admission number if admission number is being updated
      if (studentPatch.admissionNumber) {
        const existingStudent = await storage.getStudentByAdmissionNumber(studentPatch.admissionNumber);
        if (existingStudent && existingStudent.id !== id) {
          return res.status(409).json({ message: "Admission number already exists" });
        }
      }

      // Update student using transactional method
      const result = await storage.updateStudent(id, { 
        userPatch: Object.keys(userPatch).length > 0 ? userPatch : undefined,
        studentPatch: Object.keys(studentPatch).length > 0 ? studentPatch : undefined
      });

      if (!result) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Remove password hash from response for security
      const { passwordHash: _, ...userResponse } = result.user;

      res.json({
        message: "Student updated successfully",
        user: userResponse,
        student: result.student
      });

    } catch (error) {
      console.error('Error updating student:', error);

      // Handle specific database errors
      if ((error as any)?.code) {
        switch ((error as any).code) {
          case '23503': // Foreign key violation
            if ((error as any).message.includes('class_id')) {
              return res.status(400).json({ message: "Selected class does not exist. Please select a valid class." });
            } else if ((error as any).message.includes('parent_id')) {
              return res.status(400).json({ message: "Selected parent does not exist. Please select a valid parent." });
            }
            return res.status(400).json({ message: "Invalid reference data. Please check all selections." });
          case '23505': // Unique violation
            if ((error as any).message.includes('email')) {
              return res.status(409).json({ message: "Email address already exists" });
            } else if ((error as any).message.includes('admission_number')) {
              return res.status(409).json({ message: "Admission number already exists" });
            }
            return res.status(409).json({ message: "Duplicate value detected" });
          default:
            console.error('Database error:', (error as any).code, (error as any).message);
        }
      }

      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Block/Unblock student (PATCH)
  app.patch("/api/students/:id/block", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }

      console.log(`${isActive ? 'Unblocking' : 'Blocking'} student ${id}`);

      const result = await storage.setUserActive(id, isActive);

      if (!result) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({
        message: `Student ${isActive ? 'unblocked' : 'blocked'} successfully`,
        user: { id: result.id, isActive: result.isActive }
      });

    } catch (error) {
      console.error('Error blocking/unblocking student:', error);
      res.status(500).json({ message: "Failed to update student status" });
    }
  });

  // Delete student (hard deletion - DELETE)
  app.delete("/api/students/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Hard deleting student ${id}`);

      const success = await storage.hardDeleteStudent(id);

      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }

      res.json({ 
        message: "Student deleted successfully",
        status: "deleted"
      });

    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Class management
  app.get("/api/classes", authenticateUser, async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const classData = {
        name: req.body.name,
        level: req.body.level,
        classTeacherId: req.body.classTeacherId,
        capacity: req.body.capacity,
      };
      const classObj = await storage.createClass(classData);
      res.json(classObj);
    } catch (error) {
      res.status(400).json({ message: "Invalid class data" });
    }
  });

  app.put("/api/classes/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const classData = {
        name: req.body.name,
        level: req.body.level,
        classTeacherId: req.body.classTeacherId,
        capacity: req.body.capacity,
      };
      const classObj = await storage.updateClass(parseInt(id), classData);

      if (!classObj) {
        return res.status(404).json({ message: "Class not found" });
      }

      res.json(classObj);
    } catch (error) {
      res.status(400).json({ message: "Invalid class data" });
    }
  });

  app.delete("/api/classes/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteClass(parseInt(id));

      if (!success) {
        return res.status(404).json({ message: "Class not found" });
      }

      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Subject management
  app.get("/api/subjects", authenticateUser, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const subjectData = {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
      };
      const subject = await storage.createSubject(subjectData);
      res.json(subject);
    } catch (error) {
      res.status(400).json({ message: "Invalid subject data" });
    }
  });

  app.put("/api/subjects/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const subjectData = {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description,
      };
      const subject = await storage.updateSubject(parseInt(id), subjectData);

      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }

      res.json(subject);
    } catch (error) {
      res.status(400).json({ message: "Invalid subject data" });
    }
  });

  app.delete("/api/subjects/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteSubject(parseInt(id));

      if (!success) {
        return res.status(404).json({ message: "Subject not found" });
      }

      res.json({ message: "Subject deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Attendance management
  app.post("/api/attendance", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.recordAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  app.get("/api/attendance/:studentId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId } = req.params;
      const { date } = req.query;

      const attendance = await storage.getAttendanceByStudent(
        studentId, 
        typeof date === 'string' ? date : undefined
      );

      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get("/api/attendance/class/:classId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const attendance = await storage.getAttendanceByClass(parseInt(classId), date);
      res.json(attendance);
    } catch (error) {
      console.error('Error fetching class attendance:', error);
      res.status(500).json({ message: "Failed to fetch class attendance" });
    }
  });

  // Student-accessible attendance endpoint - students can only view their own attendance
  app.get("/api/student/attendance", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const studentId = req.user.id;
      const { month, year } = req.query;

      const attendance = await storage.getAttendanceByStudent(studentId, undefined);

      // Filter by month and year if provided
      let filteredAttendance = attendance;
      if (month !== undefined && year !== undefined) {
        filteredAttendance = attendance.filter((record: any) => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === parseInt(month as string) && 
                 recordDate.getFullYear() === parseInt(year as string);
        });
      }

      res.json(filteredAttendance);
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Exams
  app.post("/api/exams", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log('Exam creation request body:', JSON.stringify(req.body, null, 2));

      // Sanitize request body before parsing - convert empty strings to undefined for optional fields
      const sanitizedBody = { ...req.body };
      const optionalNumericFields = ['timeLimit', 'passingScore'];
      const optionalDateFields = ['startTime', 'endTime'];
      const optionalTextFields = ['instructions'];

      [...optionalNumericFields, ...optionalDateFields, ...optionalTextFields].forEach(field => {
        if (sanitizedBody[field] === '') {
          sanitizedBody[field] = undefined;
        }
      });

      // Ensure numeric IDs are properly converted
      if (sanitizedBody.classId) sanitizedBody.classId = Number(sanitizedBody.classId);
      if (sanitizedBody.subjectId) sanitizedBody.subjectId = Number(sanitizedBody.subjectId);
      if (sanitizedBody.termId) sanitizedBody.termId = Number(sanitizedBody.termId);
      if (sanitizedBody.totalMarks) sanitizedBody.totalMarks = Number(sanitizedBody.totalMarks);

      console.log('Sanitized exam data:', JSON.stringify(sanitizedBody, null, 2));

      const examData = insertExamSchema.omit({ createdBy: true }).parse(sanitizedBody);
      console.log('Parsed exam data:', JSON.stringify(examData, null, 2));
      const examWithCreator = { ...examData, createdBy: (req as any).user.id };
      console.log('Final exam data with creator:', JSON.stringify(examWithCreator, null, 2));
      const exam = await storage.createExam(examWithCreator);
      res.json(exam);
    } catch (error) {
      console.error('Exam creation error:', error);
      if (error instanceof Error) {
        // Provide more specific error messages for common validation issues
        let message = "Invalid exam data";
        let details = error.message;

        if (error.message.includes('positive')) {
          message = "Please check required fields: class, subject, term, and total marks must be selected/filled";
        } else if (error.message.includes('date')) {
          message = "Invalid date format - please use a valid date in YYYY-MM-DD format";
        } else if (error.message.includes('foreign key')) {
          message = "Invalid reference data - please ensure valid class, subject, and term are selected";
        }

        res.status(400).json({ message, details });
      } else {
        res.status(400).json({ message: "Invalid exam data" });
      }
    }
  });

  app.get("/api/exams", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      let exams: any[] = [];

      console.log(`Fetching exams for user: ${user.email} (role: ${user.roleId})`);

      if (user.roleId === ROLES.STUDENT) {
        // For students: only show published exams for their class
        const student = await storage.getStudent(user.id);
        console.log(`Student data:`, student);

        if (student && student.classId) {
          const classExams = await storage.getExamsByClass(student.classId);
          console.log(`Found ${classExams.length} exams for class ${student.classId}`);

          // Filter to only published exams
          exams = classExams.filter(exam => exam.isPublished);
          console.log(`Filtered to ${exams.length} published exams for student`);
        } else {
          console.log('Student not found or has no class assigned');
        }
      } else {
        // For teachers and admins: show all exams they have access to
        if (user.roleId === ROLES.TEACHER) {
          // Teachers see their own exams
          const allExams = await storage.getAllExams();
          exams = allExams.filter(exam => exam.createdBy === user.id);
          console.log(`Teacher sees ${exams.length} exams they created`);
        } else {
          // Admins see all exams
          exams = await storage.getAllExams();
          console.log(`Admin sees all ${exams.length} exams`);
        }
      }

      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/class/:classId", authenticateUser, async (req, res) => {
    try {
      const { classId } = req.params;
      const exams = await storage.getExamsByClass(parseInt(classId));
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams for class" });
    }
  });

  app.get("/api/exams/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const exam = await storage.getExamById(parseInt(id));
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.put("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;

      // First get the existing exam to check ownership
      const existingExam = await storage.getExamById(parseInt(id));
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Ownership check: Teachers can only modify their own exams
      // Admins can modify any exam
      if ((req as any).user.roleId === ROLES.TEACHER && existingExam.createdBy !== (req as any).user.id) {
        return res.status(403).json({ message: "You can only modify exams you created" });
      }

      const examData = insertExamSchema.partial().parse(req.body);
      const exam = await storage.updateExam(parseInt(id), examData);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(400).json({ message: "Invalid exam data" });
    }
  });

  app.delete("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;

      // First get the existing exam to check ownership
      const existingExam = await storage.getExamById(parseInt(id));
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Ownership check: Teachers can only delete their own exams
      // Admins can delete any exam
      if ((req as any).user.roleId === ROLES.TEACHER && existingExam.createdBy !== (req as any).user.id) {
        return res.status(403).json({ message: "You can only delete exams you created" });
      }

      const success = await storage.deleteExam(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.status(204).send(); // Return 204 No Content for successful deletion
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({ message: "Failed to delete exam", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Exam Questions routes
  app.post("/api/exam-questions", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { options, ...questionData } = req.body;

      // Normalize questionType to canonical value
      if (questionData.questionType) {
        questionData.questionType = String(questionData.questionType).toLowerCase().replace(/[-\s]/g, '_');
      }

      const validatedQuestion = insertExamQuestionSchema.parse(questionData);

      // Validate options using the creation-specific schema (without questionId)
      let validatedOptions: any[] = [];
      if (validatedQuestion.questionType === 'multiple_choice') {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ message: "Multiple choice questions require at least 2 options" });
        }

        const hasCorrectAnswer = options.some(option => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          return res.status(400).json({ message: "Multiple choice questions require at least one correct answer" });
        }

        // Validate each option using the creation schema
        try {
          validatedOptions = options.map(option => createQuestionOptionSchema.parse(option));
        } catch (optionError) {
          return res.status(400).json({ 
            message: "Invalid option data", 
            details: optionError instanceof ZodError ? optionError.errors : optionError 
          });
        }
      }

      // Create question with options atomically (compensation-based)
      const question = await storage.createExamQuestionWithOptions(validatedQuestion, validatedOptions);
      res.json(question);
    } catch (error) {
      console.error('Question creation error:', error);
      let message = "Invalid question data";
      let details = "";

      if (error instanceof Error) {
        details = error.message;

        if (error.message.includes('options')) {
          message = "Invalid question options - multiple choice questions need at least 2 options with one marked as correct";
        } else if (error.message.includes('questionText')) {
          message = "Question text is required and must be at least 5 characters";
        } else if (error.message.includes('questionType')) {
          message = "Invalid question type - must be multiple_choice, text, or essay";
        } else if (error.message.includes('foreign key')) {
          message = "Invalid exam reference - please ensure the exam exists and you have permission to add questions";
        }
      }

      res.status(400).json({ message, details });
    }
  });

  app.get("/api/exam-questions/:examId", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { examId } = req.params;

      // For students: require active exam session to prevent question leakage
      if (user.roleId === ROLES.STUDENT) {
        const activeSession = await storage.getActiveExamSession(parseInt(examId), user.id);
        if (!activeSession) {
          return res.status(403).json({ message: "No active exam session. Start the exam first." });
        }

        // Verify session is still valid (not completed)
        if (activeSession.isCompleted) {
          return res.status(403).json({ message: "Exam session has been completed" });
        }
      } else {
        // For teachers: verify they have access to this exam
        if (user.roleId === ROLES.TEACHER) {
          const exam = await storage.getExamById(parseInt(examId));
          if (!exam || exam.createdBy !== user.id) {
            return res.status(403).json({ message: "Teachers can only view questions for their own exams" });
          }
        }
        // Admins can view all questions
      }

      const questions = await storage.getExamQuestions(parseInt(examId));

      // Students see questions without correct answer indicators, teachers/admins see all
      if (user.roleId === ROLES.STUDENT) {
        // Remove sensitive data for students during exam
        const studentQuestions = questions.map(q => ({
          ...q,
          correctAnswer: undefined, // Hide correct answers during exam
          explanation: undefined    // Hide explanations during exam
        }));
        res.json(studentQuestions);
      } else {
        res.json(questions);
      }
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });

  app.put("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const questionData = insertExamQuestionSchema.partial().parse(req.body);
      const question = await storage.updateExamQuestion(parseInt(id), questionData);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.delete("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExamQuestion(parseInt(id));
      if (!deleted) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send(); // Return 204 No Content for successful deletion
    } catch (error) {
      console.error('Error deleting exam question:', error);
      res.status(500).json({ message: "Failed to delete question", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Get question counts for multiple exams
  app.get("/api/exams/question-counts", authenticateUser, async (req, res) => {
    try {
      const raw = req.query.examIds;

      if (!raw) {
        return res.status(400).json({ message: "examIds parameter is required" });
      }

      // Robust parsing: handle array, comma-separated string, or single value
      const ids = (Array.isArray(raw) ? raw : (typeof raw === 'string' ? raw.split(',') : []))
        .map(x => parseInt(String(x), 10))
        .filter(Number.isFinite);

      if (ids.length === 0) {
        return res.status(400).json({ message: "No valid exam IDs provided" });
      }

      console.log('Fetching question counts for exam IDs:', ids);

      // Use a safer approach - get counts individually and combine
      const questionCounts: Record<number, number> = {};

      for (const examId of ids) {
        try {
          const count = await storage.getExamQuestionCount(examId);
          questionCounts[examId] = count;
        } catch (examError) {
          console.warn(`Failed to get count for exam ${examId}:`, examError);
          questionCounts[examId] = 0;
        }
      }

      console.log('Question counts result:', questionCounts);
      res.json(questionCounts);
    } catch (error) {
      console.error('Error fetching question counts:', error);
      res.status(500).json({ message: "Failed to fetch question counts" });
    }
  });

  // Publish/Unpublish exam
  app.patch("/api/exams/:id/publish", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { isPublished } = req.body;

      const exam = await storage.getExamById(parseInt(id));
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // For teachers: verify they created this exam
      if (user.roleId === ROLES.TEACHER && exam.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only publish exams you created" });
      }

      const updatedExam = await storage.updateExam(parseInt(id), { isPublished });
      if (!updatedExam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      res.json(updatedExam);
    } catch (error) {
      console.error('Error updating exam publish status:', error);
      res.status(500).json({ message: "Failed to update exam publish status" });
    }
  });

  // Grading Queue Management
  app.get("/api/grading/tasks", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { teacher_id, status } = req.query;
      
      if (!teacher_id) {
        return res.status(400).json({ message: "teacher_id parameter is required" });
      }

      // Get all exam sessions that need manual grading for this teacher
      const gradingTasks = await storage.getGradingTasks(teacher_id as string, status as string);
      res.json(gradingTasks);
    } catch (error) {
      console.error('Error fetching grading tasks:', error);
      res.status(500).json({ message: "Failed to fetch grading tasks" });
    }
  });

  app.post("/api/grading/tasks/:taskId/grade", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { taskId } = req.params;
      const { score, comment, graderId } = req.body;

      if (!score && score !== 0) {
        return res.status(400).json({ message: "Score is required" });
      }

      if (!comment || comment.trim().length < 5) {
        return res.status(400).json({ message: "Comment must be at least 5 characters" });
      }

      const result = await storage.submitManualGrade({
        taskId: parseInt(taskId),
        score: parseFloat(score),
        comment: comment.trim(),
        graderId: graderId || req.user?.id
      });

      // Trigger score merging after manual grade submission (non-blocking)
      console.log('🔄 SCORE MERGE: Manual grade submitted for answer', taskId);
      mergeExamScores(parseInt(taskId), storage).catch(error => {
        console.error('❌ SCORE MERGE: Failed to merge scores (non-blocking):', error);
        // Don't fail the grading request - merge can be retried later
      });

      res.json(result);
    } catch (error) {
      console.error('Error submitting grade:', error);
      res.status(500).json({ message: "Failed to submit grade" });
    }
  });

  // Exam Sessions Management
  app.get("/api/exam-sessions", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const sessions = await storage.getAllExamSessions();
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching exam sessions:', error);
      res.status(500).json({ message: "Failed to fetch exam sessions" });
    }
  });

  // Exam Reports and Analytics
  app.get("/api/exam-reports", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { subject, class: classId } = req.query;
      const reports = await storage.getExamReports({
        subjectId: subject ? parseInt(subject as string) : undefined,
        classId: classId ? parseInt(classId as string) : undefined
      });
      res.json(reports);
    } catch (error) {
      console.error('Error fetching exam reports:', error);
      res.status(500).json({ message: "Failed to fetch exam reports" });
    }
  });

  app.get("/api/exam-reports/:examId/students", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { examId } = req.params;
      const studentReports = await storage.getExamStudentReports(parseInt(examId));
      res.json(studentReports);
    } catch (error) {
      console.error('Error fetching student reports:', error);
      res.status(500).json({ message: "Failed to fetch student reports" });
    }
  });

  app.get("/api/exam-reports/filters", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const classes = await storage.getClasses();
      const subjects = await storage.getSubjects();
      res.json({ classes, subjects });
    } catch (error) {
      console.error('Error fetching filter options:', error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });

  // Bulk Question Upload - for CSV uploads
  app.post("/api/exam-questions/bulk", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const user = (req as any).user;
      const { examId, questions } = req.body;

      if (!examId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Exam ID and questions array are required" });
      }

      // Add size limits for CSV uploads
      if (questions.length > 100) {
        return res.status(400).json({ message: "Too many questions - maximum 100 questions per upload" });
      }

      if (questions.length === 0) {
        return res.status(400).json({ message: "No questions provided for upload" });
      }

      // Verify exam exists and user has permission
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // For teachers: verify they created this exam
      if (user.roleId === ROLES.TEACHER && exam.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only add questions to exams you created" });
      }

      // Get existing questions to determine proper order numbers
      const existingQuestions = await storage.getExamQuestions(examId);
      const maxOrder = existingQuestions.length > 0 ? Math.max(...existingQuestions.map(q => q.orderNumber || 0)) : 0;

      let createdQuestions = [];
      let validationErrors = [];

      // Validate all questions first
      for (let i = 0; i < questions.length; i++) {
        const questionData = questions[i];
        try {
          // Normalize questionType
          if (questionData.questionType) {
            questionData.questionType = String(questionData.questionType).toLowerCase().replace(/[-\s]/g, '_');
          }

          // Validate with schema
          const validatedQuestion = insertExamQuestionSchema.parse({
            examId: examId,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            points: questionData.points || 1,
            orderNumber: maxOrder + i + 1
          });

          // Validate options for multiple choice questions using creation schema
          if (validatedQuestion.questionType === 'multiple_choice') {
            if (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length < 2) {
              validationErrors.push(`Question ${i + 1}: Multiple choice questions require at least 2 options`);
              continue;
            }

            const hasCorrectAnswer = questionData.options.some((option: any) => option.isCorrect === true);
            if (!hasCorrectAnswer) {
              validationErrors.push(`Question ${i + 1}: Multiple choice questions require at least one correct answer`);
              continue;
            }

            // Validate each option using the creation schema
            try {
              questionData.options = questionData.options.map((option: any) => createQuestionOptionSchema.parse(option));
            } catch (optionError) {
              if (optionError instanceof ZodError) {
                const fieldErrors = optionError.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
                validationErrors.push(`Question ${i + 1} options: ${fieldErrors}`);
              } else {
                validationErrors.push(`Question ${i + 1} options: Invalid option data`);
              }
              continue;
            }
          }

          questions[i] = { ...questionData, validatedQuestion };
        } catch (error) {
          console.log(`Question ${i + 1} validation error:`, error);
          if (error instanceof ZodError) {
            // Parse structured errors from Zod for better user feedback
            const fieldErrors = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
            validationErrors.push(`Question ${i + 1}: ${fieldErrors}`);
          } else {
            validationErrors.push(`Question ${i + 1}: ${error instanceof Error ? error.message : 'Invalid question data'}`);
          }
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Validation errors found",
          errors: validationErrors
        });
      }

      // Use the improved bulk creation method to prevent circuit breaker issues
      const questionsData = questions.map(questionData => ({
        question: questionData.validatedQuestion,
        options: questionData.options || []
      }));

      const result = await storage.createExamQuestionsBulk(questionsData);
      createdQuestions = result.questions;

      // Include any errors in the response for debugging
      if (result.errors.length > 0) {
        console.warn('⚠️ Some questions failed during bulk upload:', result.errors);
      }

      res.json({ 
        message: `Successfully created ${result.created} questions${result.errors.length > 0 ? ` (${result.errors.length} failed)` : ''}`,
        created: result.created,
        questions: result.questions,
        errors: result.errors.length > 0 ? result.errors : undefined
      });

    } catch (error) {
      console.error('Bulk question upload error:', error);
      res.status(500).json({ message: "Failed to upload questions" });
    }
  });

  // Question Options routes  
  app.post("/api/question-options", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const optionData = insertQuestionOptionSchema.parse(req.body);
      const option = await storage.createQuestionOption(optionData);
      res.json(option);
    } catch (error) {
      res.status(400).json({ message: "Invalid option data" });
    }
  });

  // BULK ENDPOINT: Fetch multiple question options in a single request to eliminate N+1 queries
  app.get("/api/question-options/bulk", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { questionIds } = req.query;

      if (!questionIds) {
        return res.status(400).json({ message: "questionIds parameter is required" });
      }

      const questionIdArray = (questionIds as string).split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

      if (questionIdArray.length === 0) {
        return res.status(400).json({ message: "Valid questionIds are required" });
      }

      // For students: verify they have an active exam session
      if (user.roleId === ROLES.STUDENT) {
        const allActiveSession = await storage.getExamSessionsByStudent(user.id);
        const hasActiveSession = allActiveSession.some(session => !session.isCompleted);

        if (!hasActiveSession) {
          return res.status(403).json({ message: "No active exam session. Start an exam first." });
        }
      }

      // PERFORMANCE: Fetch all options in a single database query
      const allOptions = await storage.getQuestionOptionsBulk(questionIdArray);

      // Hide answer keys from students (roleId 3+ are students/parents)
      const isStudentOrParent = user.roleId >= 3;

      if (isStudentOrParent) {
        // Remove the isCorrect field from options for students
        const sanitizedOptions = allOptions.map((option: any) => {
          const { isCorrect, ...sanitizedOption } = option;
          return sanitizedOption;
        });
        res.json(sanitizedOptions);
      } else {
        // Admin and teachers can see all data including correct answers
        res.json(allOptions);
      }
    } catch (error) {
      console.error('Error in bulk question options:', error);
      res.status(500).json({ message: "Failed to fetch question options" });
    }
  });

  app.get("/api/question-options/:questionId", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { questionId } = req.params;

      // For students: verify they have an active exam session for questions they're trying to access
      if (user.roleId === ROLES.STUDENT) {
        // First get the question to find the exam
        const questions = await storage.getExamQuestions(0); // This is inefficient, need to get by question ID
        // TODO: Add getQuestionById method to storage for efficiency
        // For now, we'll check if any active session exists for the user

        // This is a temporary solution - ideally we'd have storage.getQuestionById()
        const allActiveSession = await storage.getExamSessionsByStudent(user.id);
        const hasActiveSession = allActiveSession.some(session => !session.isCompleted);

        if (!hasActiveSession) {
          return res.status(403).json({ message: "No active exam session. Start an exam first." });
        }
      } else {
        // For teachers: verify they have access (teacher created the related exam)
        if (user.roleId === ROLES.TEACHER) {
          // TODO: Add proper verification that teacher created the exam containing this question
          // For now, teachers can see all options during exam creation/management
        }
        // Admins can see all
      }

      const options = await storage.getQuestionOptions(parseInt(questionId));

      // Hide answer keys from students (roleId 3+ are students/parents)
      // Only admin (roleId 1) and teachers (roleId 2) can see correct answers
      const isStudentOrParent = user.roleId >= 3;

      if (isStudentOrParent) {
        // Remove the isCorrect field from options for students
        const sanitizedOptions = options.map(option => {
          const { isCorrect, ...sanitizedOption } = option;
          return sanitizedOption;
        });
        res.json(sanitizedOptions);
      } else {
        // Admin and teachers can see all data including correct answers
        res.json(options);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question options" });
    }
  });

  // Comprehensive grade recording API endpoint
  app.post("/api/comprehensive-grades", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { 
        studentId, 
        subjectId, 
        termId, 
        testScore, 
        testMaxScore = 40, // Default to 40 for test marks
        examScore, 
        examMaxScore = 60, // Default to 60 for exam marks
        totalScore, 
        grade, 
        teacherRemarks, 
        recordedBy 
      } = req.body;

      // Basic Validation
      if (!studentId || !subjectId || !termId) {
        return res.status(400).json({ message: "Student, subject, and term are required" });
      }

      // Score validation (ensure scores are within their respective max scores)
      if (testScore !== null && testScore < 0 || testScore > testMaxScore) {
        return res.status(400).json({ message: "Invalid test score. Score must be between 0 and max test score." });
      }
      if (examScore !== null && examScore < 0 || examScore > examMaxScore) {
        return res.status(400).json({ message: "Invalid exam score. Score must be between 0 and max exam score." });
      }
      if (totalScore !== null && (totalScore < 0 || totalScore > (testMaxScore + examMaxScore))) {
        return res.status(400).json({ message: "Invalid total score. Score must be between 0 and max total score." });
      }
      if (grade && !['A+', 'A', 'B+', 'B', 'C', 'F'].includes(grade)) {
         return res.status(400).json({ message: "Invalid grade. Allowed grades are A+, A, B+, B, C, F." });
      }

      // Create comprehensive grade record
      const gradeData = {
        studentId,
        subjectId: parseInt(subjectId), // Ensure IDs are numbers
        termId: parseInt(termId),
        testScore: testScore === null ? null : Number(testScore), // Handle null scores
        testMaxScore: Number(testMaxScore),
        examScore: examScore === null ? null : Number(examScore),
        examMaxScore: Number(examMaxScore),
        totalScore: totalScore === null ? null : Number(totalScore),
        grade: grade || null,
        teacherRemarks: teacherRemarks || null,
        recordedBy: recordedBy || (req as any).user.id,
        isFinalized: true, // Assuming this endpoint is for finalized grades
        recordedAt: new Date()
      };

      // Store in a comprehensive grades table (ensure this table exists in your database schema)
      const result = await storage.recordComprehensiveGrade(gradeData);

      res.json({
        message: "Comprehensive grade recorded successfully",
        grade: result
      });

    } catch (error) {
      console.error('Comprehensive grade recording error:', error);
      res.status(500).json({ 
        message: "Failed to record comprehensive grade",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get comprehensive grades for a student, optionally by term
  app.get("/api/comprehensive-grades/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { termId } = req.query;

      // Ensure termId is a number if provided
      const numericTermId = termId ? parseInt(termId as string) : undefined;
      if (termId && isNaN(numericTermId as number)) {
        return res.status(400).json({ message: "Invalid termId format. Must be a number." });
      }

      const grades = await storage.getComprehensiveGradesByStudent(studentId, numericTermId);

      res.json(grades);
    } catch (error) {
      console.error('Error fetching comprehensive grades:', error);
      res.status(500).json({ message: "Failed to fetch comprehensive grades" });
    }
  });

  // Generate professional report card
  app.post("/api/report-cards/generate", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId, termId, classId } = req.body;

      // Validate required fields
      if (!studentId || !termId || !classId) {
        return res.status(400).json({ message: "Student ID, Term ID, and Class ID are required" });
      }

      // Get all comprehensive grades for the student in this term
      const grades = await storage.getComprehensiveGradesByStudent(studentId, parseInt(termId));

      // Calculate overall statistics
      const totalMarks = grades.reduce((sum: number, grade: any) => sum + (grade.totalScore || 0), 0);
      const totalPossibleMarks = grades.reduce((sum: number, grade: any) => sum + (grade.testMaxScore || 0) + (grade.examMaxScore || 0), 0);
      
      const averagePercentage = totalPossibleMarks > 0 ? Math.round((totalMarks / totalPossibleMarks) * 100) : 0;

      // Determine overall grade
      let overallGrade = 'F';
      if (averagePercentage >= 90) overallGrade = 'A+';
      else if (averagePercentage >= 80) overallGrade = 'A';
      else if (averagePercentage >= 70) overallGrade = 'B+';
      else if (averagePercentage >= 60) overallGrade = 'B';
      else if (averagePercentage >= 50) overallGrade = 'C';

      // Fetch student and class information for the report card
      const student = await storage.getStudent(studentId);
      const studentUser = student ? await storage.getUser(student.id) : null;
      const classData = await storage.getClass(parseInt(classId));
      const terms = await storage.getTerms();
      const term = terms.find(t => t.id === parseInt(termId));

      // Create report card record
      const reportCardData = {
        studentId,
        classId: parseInt(classId),
        termId: parseInt(termId),
        averagePercentage,
        overallGrade,
        // Enhanced teacher remarks
        teacherRemarks: `Overall performance: ${overallGrade}. Keep up the excellent work!`,
        status: 'finalized',
        finalizedAt: new Date(),
        generatedBy: (req as any).user.id,
        // Add student and class details for context if needed, or fetch dynamically on display
        studentName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'Unknown Student',
        className: classData ? classData.name : 'Unknown Class',
        termName: term ? `${term.name} (${term.year})` : 'Unknown Term',
      };

      // Store report card and associated grades (assuming a method like createReportCard exists)
      // This might involve inserting into a 'report_cards' table and potentially linking grades
      const reportCard = await storage.createReportCard(reportCardData, grades);

      res.json({
        message: "Report card generated successfully",
        reportCard,
        grades // Also return the grades used for generation
      });

    } catch (error) {
      console.error('Report card generation error:', error);
      res.status(500).json({ 
        message: "Failed to generate report card",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Exam results management
  app.post("/api/exam-results", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { examId, studentId, score, maxScore, marksObtained, autoScored, recordedBy, questionDetails, breakdown, immediateResults } = req.body;

      // Basic validation
      if (!examId || !studentId || score === undefined || maxScore === undefined) {
        return res.status(400).json({ message: "examId, studentId, score, and maxScore are required." });
      }

      const resultData = insertExamResultSchema.parse({
        examId,
        studentId,
        score: Number(score),
        maxScore: Number(maxScore),
        marksObtained: marksObtained !== undefined ? Number(marksObtained) : Number(score), // Use score if marksObtained is not provided
        autoScored: autoScored || false,
        recordedBy: recordedBy || (req as any).user.id,
        questionDetails: questionDetails || [],
        breakdown: breakdown || {},
        immediateResults: immediateResults || {},
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Check if a result already exists for this exam and student
      const existingResults = await storage.getExamResultsByStudent(studentId);
      const existingResult = existingResults.find((r: any) => r.examId === examId);

      let result;
      if (existingResult) {
        // Update existing result
        result = await storage.updateExamResult(existingResult.id, resultData);
      } else {
        // Create new result
        result = await storage.recordExamResult(resultData);
      }

      if (!result) {
        throw new Error("Failed to save exam result.");
      }

      res.json({
        message: "Exam result saved successfully",
        result
      });
    } catch (error) {
      console.error('Error saving exam result:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to save exam result" });
    }
  });

  // Get exam results for a specific student
  app.get("/api/exam-results/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = (req as any).user;

      // Students can only view their own results
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Students can only view their own exam results" });
      }

      const results = await storage.getExamResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      console.error('Error fetching exam results for student:', error);
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });

  // Get specific exam result by ID
  app.get("/api/exam-results/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const result = await storage.getExamResultById(parseInt(id));
      if (!result) {
        return res.status(404).json({ message: "Exam result not found" });
      }

      // Students can only view their own results
      if (user.roleId === ROLES.STUDENT && user.id !== result.studentId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching exam result:', error);
      res.status(500).json({ message: "Failed to fetch exam result" });
    }
  });

  // Update exam result (e.g., for manual grading or adding remarks)
  app.put("/api/exam-results/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { score, maxScore, remarks, questionDetails, breakdown, immediateResults, teacherFinalized, finalizedAt, finalizedBy, ...otherUpdates } = req.body;

      // Prevent direct modification of sensitive fields unless explicitly allowed by role/context
      const updateData: any = {};
      if (score !== undefined) updateData.score = Number(score);
      if (maxScore !== undefined) updateData.maxScore = Number(maxScore);
      if (remarks !== undefined) updateData.remarks = remarks;
      if (questionDetails !== undefined) updateData.questionDetails = questionDetails;
      if (breakdown !== undefined) updateData.breakdown = breakdown;
      if (immediateResults !== undefined) updateData.immediateResults = immediateResults;
      
      // Updates for finalized status might be handled by a separate endpoint or role
      if (teacherFinalized !== undefined) updateData.teacherFinalized = teacherFinalized;
      if (finalizedAt !== undefined) updateData.finalizedAt = finalizedAt;
      if (finalizedBy !== undefined) updateData.finalizedBy = finalizedBy;
      
      // Apply other allowed updates
      Object.assign(updateData, otherUpdates);

      // Ensure score and maxScore are numbers if provided
      if (updateData.score !== undefined) updateData.score = Number(updateData.score);
      if (updateData.maxScore !== undefined) updateData.maxScore = Number(updateData.maxScore);
      if (updateData.marksObtained !== undefined) updateData.marksObtained = Number(updateData.marksObtained);

      const updatedResult = await storage.updateExamResult(parseInt(id), updateData);

      if (!updatedResult) {
        return res.status(404).json({ message: "Exam result not found" });
      }

      res.json(updatedResult);
    } catch (error) {
      console.error('Error updating exam result:', error);
      res.status(500).json({ message: "Failed to update exam result" });
    }
  });


  // Study resources routes
  app.get("/api/study-resources", authenticateUser, async (req, res) => {
    try {
      const { classId, subjectId, termId, resourceType } = req.query;
      const user = (req as any).user;

      // For students, filter by their class
      let filters: any = {};
      if (user.roleId === ROLES.STUDENT) {
        const student = await storage.getStudent(user.id);
        if (student?.classId) {
          filters.classId = student.classId;
        }
      } else {
        // For teachers and admins, allow filtering by all parameters
        if (classId) filters.classId = parseInt(classId as string);
      }

      if (subjectId) filters.subjectId = parseInt(subjectId as string);
      if (termId) filters.termId = parseInt(termId as string);
      if (resourceType) filters.resourceType = resourceType as string;

      const resources = await storage.getStudyResources(filters);
      res.json(resources);
    } catch (error) {
      console.error('Study resources fetch error:', error);
      res.status(500).json({ message: "Failed to fetch study resources" });
    }
  });

  app.get("/api/study-resources/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;

      // Validate ID parameter
      const resourceId = parseInt(id);
      if (isNaN(resourceId)) {
        return res.status(400).json({ message: "Invalid resource ID" });
      }

      const resource = await storage.getStudyResourceById(resourceId);

      if (!resource) {
        return res.status(404).json({ message: "Study resource not found" });
      }

      res.json(resource);
    } catch (error) {
      console.error('Study resource fetch error:', error);
      res.status(500).json({ message: "Failed to fetch study resource" });
    }
  });

  app.get("/api/study-resources/:id/download", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getStudyResourceById(parseInt(id));

      if (!resource) {
        return res.status(404).json({ message: "Study resource not found" });
      }

      // Increment download count
      await storage.incrementStudyResourceDownloads(parseInt(id));

      // Serve the file
      const filePath = path.join(process.cwd(), resource.fileUrl);
      res.download(filePath, resource.fileName);
    } catch (error) {
      console.error('Study resource download error:', error);
      res.status(500).json({ message: "Failed to download study resource" });
    }
  });

  app.delete("/api/study-resources/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { id } = req.params;

      // Get resource first to find the file path
      const resource = await storage.getStudyResourceById(parseInt(id));
      if (!resource) {
        return res.status(404).json({ message: "Study resource not found" });
      }

      // Delete the file from filesystem
      const filePath = path.join(process.cwd(), resource.fileUrl);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue with database deletion even if file deletion fails
      }

      // Delete the record from storage
      const success = await storage.deleteStudyResource(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Failed to delete study resource record" });
      }

      res.json({ message: "Study resource deleted successfully" });
    } catch (error) {
      console.error('Study resource deletion error:', error);
      res.status(500).json({ message: "Failed to delete study resource" });
    }
  });

  // Home page content management routes (Admin only)
  app.get("/api/homepage-content", async (req, res) => {
    try {
      const { contentType } = req.query;

      // Handle multiple contentType parameters (array support)
      let contentTypes: string[] = [];
      if (contentType) {
        if (Array.isArray(contentType)) {
          contentTypes = contentType as string[];
        } else {
          contentTypes = [contentType as string];
        }
      }

      // If no contentType specified, get all content
      if (contentTypes.length === 0) {
        const content = await storage.getHomePageContent();
        return res.json(content);
      }

      // Fetch content for each contentType and combine results
      const allContent = [];
      for (const type of contentTypes) {
        const content = await storage.getHomePageContent(type);
        if (content && Array.isArray(content)) {
          allContent.push(...content);
        }
      }

      // Remove duplicates based on id
      const uniqueContent = allContent.filter((item, index, self) => 
        index === self.findIndex((t) => t.id === item.id)
      );

      res.json(uniqueContent);
    } catch (error) {
      console.error('Home page content fetch error:', error);
      res.status(500).json({ message: "Failed to fetch home page content" });
    }
  });

  app.post("/api/homepage-content", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const contentData = insertHomePageContentSchema.parse(req.body);
      const content = await storage.createHomePageContent(contentData);
      res.json(content);
    } catch (error) {
      console.error('Home page content creation error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid content data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to create home page content" });
    }
  });

  app.put("/api/homepage-content/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const contentData = insertHomePageContentSchema.partial().parse(req.body);
      const content = await storage.updateHomePageContent(parseInt(id), contentData);

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      res.json(content);
    } catch (error) {
      console.error('Home page content update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid content data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update home page content" });
    }
  });

  app.delete("/api/homepage-content/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;

      // First get the content to retrieve file information before deletion
      const content = await storage.getHomePageContentById(parseInt(id));

      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }

      // Delete from database first
      const deleted = await storage.deleteHomePageContent(parseInt(id));

      if (!deleted) {
        return res.status(404).json({ message: "Content not found" });
      }

      // If there's an associated image file, remove it from disk
      if (content.imageUrl) {
        try {
          // Remove leading slash and construct full file path
          const filePath = content.imageUrl.startsWith('/') 
            ? content.imageUrl.substring(1) 
            : content.imageUrl;

          const fullPath = path.resolve(filePath);

          // Check if file exists and delete it
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
            console.log(`Successfully deleted file: ${fullPath}`);
          } catch (fileError: any) {
            if (fileError.code === 'ENOENT') {
              console.warn(`File not found (already deleted?): ${fullPath}`);
            } else {
              console.error(`Failed to delete file ${fullPath}:`, fileError);
            }
          }
        } catch (pathError) {
          console.error('Error processing file path for deletion:', pathError);
        }
      }

      res.json({ message: "Home page content deleted successfully" });
    } catch (error) {
      console.error('Home page content delete error:', error);
      res.status(500).json({ message: "Failed to delete home page content" });
    }
  });

  // Special endpoint for uploading home page images (Admin only)
  app.post("/api/upload/homepage", authenticateUser, authorizeRoles(ROLES.ADMIN), upload.single('homePageImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { contentType, altText, caption, displayOrder } = req.body;
      if (!contentType) {
        return res.status(400).json({ message: "Content type is required" });
      }

      const imageUrl = `/uploads/homepage/${req.file.filename}`;

      const homePageContent = await storage.createHomePageContent({
        contentType,
        imageUrl,
        altText: altText || null,
        caption: caption || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: true,
        uploadedBy: (req as any).user.id
      });

      res.json({ 
        message: "Home page image uploaded successfully", 
        content: homePageContent 
      });
    } catch (error) {
      console.error('Home page upload error:', error);
      res.status(500).json({ message: "Failed to upload home page image" });
    }
  });

  // Debug endpoint to list all users with their roles (Admin only)
  app.get("/api/debug/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {

    try {
      const allRoles = await storage.getRoles();
      const allUsers = [];
      for (const role of allRoles) {
        const users = await storage.getUsersByRole(role.id);
        for (const user of users) {
          allUsers.push({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roleId: user.roleId,
            roleName: role.name
          });
        }
      }
      res.json(allUsers);
    } catch (error) {
      console.error('Debug users error:', error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  // Admin endpoint to update user roles (for fixing role issues)
  app.patch("/api/users/:id/role", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {

    try {
      const { id } = req.params;
      const { roleId } = req.body;

      // Validate roleId
      if (!roleId || ![ROLES.STUDENT, ROLES.TEACHER, ROLES.PARENT, ROLES.ADMIN].includes(roleId)) {
        return res.status(400).json({ message: "Invalid role ID" });
      }

      const updatedUser = await storage.updateUser(id, { roleId });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log(`Admin ${(req as any).user.email} updated user ${id} roleId to ${roleId}`);
      res.json({ message: "User role updated successfully", user: updatedUser });
    } catch (error) {
      console.error('User role update error:', error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // PERFORMANCE MONITORING API ENDPOINT
  // Real-time performance metrics for admin monitoring (using real database data)
  app.get("/api/admin/performance-metrics", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const hoursNumber = parseInt(hours as string);

      // Get real performance data from database
      const metrics = await storage.getPerformanceMetrics(hoursNumber);
      const recentAlerts = await storage.getRecentPerformanceAlerts(hoursNumber);

      // Determine system status based on real metrics
      let currentStatus = "optimal";
      let recommendations = ["System performing optimally"];

      if (metrics.goalAchievementRate < 80) {
        currentStatus = "critical";
        recommendations = [
          "Performance below acceptable threshold",
          "Consider database optimization",
          "Review exam submission timeouts"
        ];
      } else if (metrics.goalAchievementRate < 95) {
        currentStatus = "warning";
        recommendations = [
          "Performance needs attention",
          "Monitor slow submissions",
          "Background cleanup active"
        ];
      }

      const performanceStatus = {
        timestamp: new Date().toISOString(),
        submissionGoal: 2000, // 2 seconds in milliseconds
        currentStatus,
        systemHealth: {
          database: "connected",
          backgroundCleanup: "running",
          averageSubmissionTime: `${metrics.averageDuration}ms`,
        },
        metrics: {
          totalSubmissionsToday: metrics.totalEvents,
          goalAchievementRate: `${metrics.goalAchievementRate}%`,
          averageQueryTime: `${metrics.averageDuration}ms`,
          slowSubmissions: metrics.slowSubmissions,
          eventsByType: metrics.eventsByType
        },
        recentPerformanceAlerts: recentAlerts,
        recommendations
      };

      res.json(performanceStatus);
    } catch (error) {
      console.error('Performance metrics error:', error);
      res.status(500).json({ message: "Failed to retrieve performance metrics" });
    }
  });

  // Performance alerts endpoint for admin monitoring
  app.get("/api/admin/performance-alerts", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const hoursNumber = parseInt(hours as string);

      const alerts = await storage.getRecentPerformanceAlerts(hoursNumber);

      res.json({
        alerts,
        summary: {
          totalAlerts: alerts.length,
          timeframe: `${hoursNumber} hours`,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Performance alerts error:', error);
      res.status(500).json({ message: "Failed to retrieve performance alerts" });
    }
  });

  // TEST AUTO-SCORING ENDPOINT - Admin only, for debugging auto-scoring issues
  app.post("/api/test-auto-scoring", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }

      console.log(`🧪 ADMIN TEST: Testing auto-scoring for session ${sessionId}`);

      // Get session details for logging
      const session = await storage.getExamSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: `Exam session ${sessionId} not found` });
      }

      console.log(`📊 Testing session: ${session.id}, Student: ${session.studentId}, Exam: ${session.examId}, Completed: ${session.isCompleted}`);

      const startTime = Date.now();

      try {
        // Test the auto-scoring function directly
        await autoScoreExamSession(sessionId, storage);

        const totalTime = Date.now() - startTime;
        console.log(`✅ AUTO-SCORING TEST SUCCESS: Completed in ${totalTime}ms`);

        // Get the results to verify success
        const results = await storage.getExamResultsByStudent(session.studentId);
        const testResult = results.find((r: any) => r.examId === session.examId && r.autoScored === true);

        if (testResult) {
          console.log(`🎉 VERIFIED: Auto-scored result found - ${testResult.score}/${testResult.maxScore}`);
          return res.json({
            success: true,
            message: "Auto-scoring test completed successfully",
            testDetails: {
              sessionId: sessionId,
              studentId: session.studentId,
              examId: session.examId,
              duration: totalTime,
              result: {
                score: testResult.score,
                maxScore: testResult.maxScore,
                autoScored: testResult.autoScored,
                resultId: testResult.id
              }
            }
          });
        } else {
          console.warn(`⚠️ AUTO-SCORING COMPLETED but no auto-scored result found`);
          return res.json({
            success: false,
            message: "Auto-scoring completed but no auto-scored result was found",
            testDetails: {
              sessionId: sessionId,
              duration: totalTime,
              allResults: results.filter((r: any) => r.examId === session.examId)
            }
          });
        }
      } catch (scoringError) {
        const totalTime = Date.now() - startTime;
        console.error(`❌ AUTO-SCORING TEST FAILED after ${totalTime}ms:`, scoringError);

        return res.status(500).json({
          success: false,
          message: "Auto-scoring test failed",
          error: scoringError instanceof Error ? scoringError.message : String(scoringError),
          testDetails: {
            sessionId: sessionId,
            duration: totalTime,
            errorType: scoringError instanceof Error ? scoringError.constructor.name : 'UnknownError'
          }
        });
      }
    } catch (error) {
      console.error('Test auto-scoring endpoint error:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to run auto-scoring test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // ENHANCED PERFORMANCE TRACKING ENDPOINT
  // Log performance events to database for real monitoring (client-side telemetry)
  app.post("/api/performance-events", authenticateUser, async (req, res) => {
    try {
      const { sessionId, eventType, duration, metadata } = req.body;

      const user = (req as any).user;

      // Validate and sanitize the event data
      if (!eventType || typeof duration !== 'number') {
        return res.status(400).json({ message: "eventType and duration are required" });
      }

      // Limit metadata size to prevent abuse
      const sanitizedMetadata = metadata ? JSON.stringify(metadata).substring(0, 2000) : null;

      // Create performance event for database storage with user context
      const performanceEvent = {
        sessionId: sessionId || null,
        eventType: eventType,
        duration: Math.max(0, duration), // Ensure positive duration
        goalAchieved: duration <= 2000,
        metadata: sanitizedMetadata,
        userId: user.id, // Track which user generated the event
        clientSide: true, // Flag this as client-side telemetry
        createdAt: new Date()
      };

      // Store in database
      const savedEvent = await storage.logPerformanceEvent(performanceEvent);

      // In development, log detailed performance data
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 PERFORMANCE EVENT STORED:', JSON.stringify(savedEvent, null, 2));
      }

      // Alert if performance goal exceeded
      if (duration > 2000) {
        console.warn(`🚨 PERFORMANCE ALERT: ${eventType} took ${duration}ms (exceeded 2-second goal)`);
        if (metadata) {
          console.warn(`🔍 METADATA:`, JSON.stringify(metadata, null, 2));
        }
      }

      res.status(204).send(); // No content response for telemetry
    } catch (error) {
      console.error('Performance event logging error:', error);
      res.status(500).json({ message: "Failed to log performance event" });
    }
  });

  // Teacher report finalization endpoints
  app.patch("/api/exam-results/:id/finalize", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { teacherRemarks, teacherFinalized, finalizedAt, finalizedBy } = req.body;

      // Verify the teacher has permission to finalize this result
      const existingResult = await storage.getExamResultById(parseInt(id));
      if (!existingResult) {
        return res.status(404).json({ message: "Exam result not found" });
      }

      // Get the exam to check if teacher created it
      const exam = await storage.getExamById(existingResult.examId);
      if (!exam) {
        return res.status(404).json({ message: "Associated exam not found" });
      }

      // Authorization check: Only the teacher who created the exam can finalize results
      if ((req as any).user.roleId === ROLES.TEACHER && exam.createdBy !== (req as any).user.id) {
        return res.status(403).json({ message: "You can only finalize results for exams you created" });
      }

      const updateData = {
        remarks: teacherRemarks || existingResult.remarks,
      };

      const updatedResult = await storage.updateExamResult(parseInt(id), updateData);
      if (!updatedResult) {
        return res.status(404).json({ message: "Failed to update exam result" });
      }

      res.json({
        message: "Report finalized successfully",
        result: updatedResult
      });
    } catch (error) {
      console.error('Error finalizing report:', error);
      res.status(500).json({ message: "Failed to finalize report" });
    }
  });

  // Get finalized reports for a class/teacher
  app.get("/api/reports/finalized", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId, subjectId, termId } = req.query;

      const user = (req as any).user;

      let results: any[] = [];

      if (user.roleId === ROLES.TEACHER) {
        // Teachers see finalized reports for their exams only
        const teacherExams = await storage.getAllExams();
        const teacherExamIds = teacherExams
          .filter(exam => exam.createdBy === user.id)
          .map(exam => exam.id);

        if (teacherExamIds.length > 0) {
          results = await storage.getFinalizedReportsByExams(teacherExamIds, {
            classId: classId ? parseInt(classId as string) : undefined,
            subjectId: subjectId ? parseInt(subjectId as string) : undefined,
            termId: termId ? parseInt(termId as string) : undefined,
          });
        }
      } else {
        // Admins see all finalized reports
        results = await storage.getAllFinalizedReports({
          classId: classId ? parseInt(classId as string) : undefined,
          subjectId: subjectId ? parseInt(subjectId as string) : undefined,
          termId: termId ? parseInt(termId as string) : undefined,
        });
      }

      res.json(results);
    } catch (error) {
      console.error('Error fetching finalized reports:', error);
      res.status(500).json({ message: "Failed to fetch finalized reports" });
    }
  });

  // Exam Sessions - Student exam taking
  app.post("/api/exam-sessions", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { examId, studentId } = req.body;
      const user = (req as any).user;

      console.log('📝 Creating exam session:', { examId, studentId, userFromToken: user.id });

      // Validate required fields
      if (!examId || !studentId) {
        return res.status(400).json({ message: "examId and studentId are required" });
      }

      // Ensure student can only create sessions for themselves
      if (studentId !== user.id) {
        console.error('❌ Authorization failure: Student trying to create session for another student:', { requestedStudentId: studentId, authenticatedUserId: user.id });
        return res.status(403).json({ message: "Students can only create exam sessions for themselves" });
      }

      // Check if exam exists and is published
      const exam = await storage.getExamById(examId);
      if (!exam) {
        console.error('❌ Exam not found:', examId);
        return res.status(404).json({ message: "Exam not found" });
      }

      console.log('📋 Exam details:', { id: exam.id, name: exam.name, isPublished: exam.isPublished, timeLimit: exam.timeLimit });

      if (!exam.isPublished) {
        console.error('❌ Exam not published:', examId);
        return res.status(403).json({ message: "Exam is not published" });
      }

      // Check if student already has an active session for this exam
      const existingSession = await storage.getActiveExamSession(examId, studentId);
      if (existingSession && !existingSession.isCompleted) {
        console.error('❌ Student already has active session:', { sessionId: existingSession.id, examId, studentId });
        return res.status(409).json({ 
          message: "You already have an active session for this exam",
          sessionId: existingSession.id 
        });
      }

      // Create new exam session
      const sessionData = {
        examId: parseInt(examId),
        studentId: studentId,
        startedAt: new Date(),
        isCompleted: false,
        status: 'active',
        timeRemaining: exam.timeLimit ? exam.timeLimit * 60 : null // Convert minutes to seconds
      };

      console.log('💾 Creating session with data:', sessionData);

      const session = await storage.createExamSession(sessionData);

      if (!session) {
        console.error('❌ Failed to create session - storage returned null');
        return res.status(500).json({ message: "Failed to create exam session" });
      }

      console.log('✅ Exam session created successfully:', { sessionId: session.id, examId, studentId });
      res.json(session);

    } catch (error) {
      console.error('❌ Exam session creation error:', error);

      if (error instanceof z.ZodError) {
        console.error('❌ Validation error:', error.errors);
        return res.status(400).json({ 
          message: "Invalid session data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }

      // Handle database errors
      if ((error as any)?.code) {
        const dbError = error as any;
        console.error('❌ Database error:', { code: dbError.code, message: dbError.message });

        if (dbError.code === '23503') { // Foreign key violation
          return res.status(400).json({ message: "Invalid exam or student reference" });
        }
        if (dbError.code === '23505') { // Unique violation
          return res.status(409).json({ message: "Session already exists for this exam" });
        }
      }

      res.status(500).json({ 
        message: "Failed to create exam session",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Get active exam sessions for a student
  app.get("/api/exam-sessions/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = (req as any).user;

      // Students can only view their own sessions, teachers/admins can view any
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Students can only view their own exam sessions" });
      }

      const sessions = await storage.getExamSessionsByStudent(studentId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching exam sessions:', error);
      res.status(500).json({ message: "Failed to fetch exam sessions" });
    }
  });

  // Get specific exam session by ID
  app.get("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const session = await storage.getExamSessionById(parseInt(id));
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }

      // Students can only view their own sessions
      if (user.roleId === ROLES.STUDENT && user.id !== session.studentId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(session);
    } catch (error) {
      console.error('Error fetching exam session:', error);
      res.status(500).json({ message: "Failed to fetch exam session" });
    }
  });

  // Update exam session (for timer recovery and status updates)
  app.patch("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const updateData = req.body;

      const session = await storage.getExamSessionById(parseInt(id));
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }

      // Students can only update their own sessions
      if (user.roleId === ROLES.STUDENT && user.id !== session.studentId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Validate update data
      const validatedData = updateExamSessionSchema.parse(updateData);
      const updatedSession = await storage.updateExamSession(parseInt(id), validatedData);

      if (!updatedSession) {
        return res.status(404).json({ message: "Failed to update exam session" });
      }

      res.json(updatedSession);
    } catch (error) {
      console.error('Error updating exam session:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid update data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update exam session" });
    }
  });

  // Get student's current active session status
  app.get("/api/exam-sessions/student/:studentId/active", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { studentId } = req.params;

      // Security: Students can only check their own sessions
      if (user.roleId === ROLES.STUDENT && studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Get the most recent active session for this student
      const sessions = await storage.getExamSessionsByStudent(studentId);
      const activeSession = sessions.find(session => !session.isCompleted);

      if (activeSession) {
        // Include exam details for proper session recovery
        const exam = await storage.getExamById(activeSession.examId);
        res.json({
          ...activeSession,
          examName: exam?.name,
          examTimeLimit: exam?.timeLimit,
          examQuestionCount: await storage.getExamQuestionCount(activeSession.examId)
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error('Error checking active session:', error);
      res.status(500).json({ message: "Failed to check active session" });
    }
  });

  // Update session progress (for better session recovery)
  app.patch("/api/exam-sessions/:id/progress", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { currentQuestionIndex, timeRemaining } = req.body;

      // Get session to verify ownership
      const session = await storage.getExamSessionById(parseInt(id));
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Security: Students can only update their own sessions
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update session with progress data
      const updates: any = {};
      if (typeof timeRemaining === 'number') updates.timeRemaining = timeRemaining;
      if (typeof currentQuestionIndex === 'number') {
        // Store current question index in session for recovery
        updates.metadata = JSON.stringify({ currentQuestionIndex });
      }

      if (Object.keys(updates).length > 0) {
        await storage.updateExamSession(parseInt(id), updates);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating session progress:', error);
      res.status(500).json({ message: "Failed to update session progress" });
    }
  });

  // Submit student answers
  app.post("/api/student-answers", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const user = req.user!;

      if (user.roleId !== ROLES.STUDENT) {
        return res.status(403).json({ message: "Only students can submit answers" });
      }

      const answerData = insertStudentAnswerSchema.parse(req.body);

      // Additional validation - ensure the session belongs to the student
      const session = await storage.getExamSessionById(answerData.sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${answerData.sessionId}`);
        return res.status(404).json({ message: "Exam session not found" });
      }

      if (session.studentId !== user.id) {
        console.error(`❌ Student ${user.id} trying to submit for session ${answerData.sessionId} belonging to ${session.studentId}`);
        return res.status(403).json({ message: "You can only submit answers for your own exam session" });
      }

      if (session.isCompleted) {
        console.error(`❌ Attempt to submit answer for completed session: ${answerData.sessionId}`);
        return res.status(400).json({ message: "Cannot submit answers for a completed exam" });
      }

      // Check for existing answer and update instead of creating duplicate
      const existingAnswers = await storage.getStudentAnswers(answerData.sessionId);
      const existingAnswer = existingAnswers.find(a => a.questionId === answerData.questionId);

      let answer;
      if (existingAnswer) {
        // Update existing answer
        console.log(`Updating existing answer for question ${answerData.questionId}`);
        answer = await storage.updateStudentAnswer(existingAnswer.id, {
          selectedOptionId: answerData.selectedOptionId,
          textAnswer: answerData.textAnswer,
          answeredAt: new Date()
        });
        if (!answer) {
          throw new Error('Failed to update existing answer');
        }
      } else {
        // Create new answer
        console.log(`Creating new answer for question ${answerData.questionId}`);
        answer = await storage.createStudentAnswer(answerData);
      }

      res.json(answer);
    } catch (error: any) {
      console.error('Student answer submission error:', error);

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid answer data", 
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }

      // Handle specific database errors
      if (error?.code === '23503') {
        return res.status(400).json({ message: "Invalid question or session reference" });
      } else if (error?.code === '23505') {
        return res.status(409).json({ message: "Answer already exists for this question" });
      } else if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
        return res.status(408).json({ message: "Database connection timeout. Please try again." });
      }

      // Generic server error
      res.status(500).json({ 
        message: "Failed to submit answer. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // GRADING TASK CREATION - Automatically create tasks for essay/theory questions
  async function createGradingTasksForSession(sessionId: number, examId: number, storage: any): Promise<void> {
    try {
      console.log(`📝 Creating grading tasks for session ${sessionId}, exam ${examId}`);

      // Get exam details to find the assigned teacher
      const exam = await storage.getExamById(examId);
      if (!exam) {
        throw new Error(`Exam ${examId} not found`);
      }

      // Get all questions for this exam
      const examQuestions = await storage.getExamQuestions(examId);
      
      // Filter for essay/theory questions (non-auto-gradable questions)
      const manualGradingQuestions = examQuestions.filter((q: any) => {
        return q.questionType !== 'multiple_choice' && q.questionType !== 'true_false';
      });

      if (manualGradingQuestions.length === 0) {
        console.log(`✅ No manual grading questions found for exam ${examId}`);
        return;
      }

      console.log(`📝 Found ${manualGradingQuestions.length} questions requiring manual grading`);

      // Get student answers for this session
      const studentAnswers = await storage.getStudentAnswers(sessionId);

      // Determine the teacher to assign tasks to
      let assignedTeacherId = exam.createdBy; // Default to exam creator

      // Try to get the class-subject teacher if available
      if (exam.classId && exam.subjectId) {
        try {
          const teachers = await storage.getTeachersForClassSubject(exam.classId, exam.subjectId);
          if (teachers && teachers.length > 0) {
            assignedTeacherId = teachers[0].id; // Assign to first teacher found
            console.log(`👨‍🏫 Assigning grading tasks to class-subject teacher: ${assignedTeacherId}`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not find class-subject teacher, using exam creator: ${error}`);
        }
      }

      // Create grading tasks for each essay answer
      let tasksCreated = 0;
      for (const question of manualGradingQuestions) {
        const studentAnswer = studentAnswers.find((a: any) => a.questionId === question.id);
        
        if (studentAnswer) {
          // Check if task already exists to avoid duplicates
          const existingTasks = await storage.getGradingTasksBySession(sessionId);
          const taskExists = existingTasks.some((t: any) => t.answerId === studentAnswer.id);

          if (!taskExists) {
            await storage.createGradingTask({
              sessionId: sessionId,
              answerId: studentAnswer.id,
              assignedTeacherId: assignedTeacherId,
              status: 'pending',
              priority: 0 // Default priority
            });
            tasksCreated++;
          }
        }
      }

      console.log(`✅ Created ${tasksCreated} grading tasks for session ${sessionId}`);
    } catch (error) {
      console.error(`❌ Error creating grading tasks for session ${sessionId}:`, error);
      throw error;
    }
  }

  // Submit Exam Route - Synchronous submission with proper error handling
  app.post("/api/exams/:examId/submit", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const user = req.user!;
      const { examId } = req.params;
      const examIdNum = parseInt(examId);

      console.log(`🚀 EXAM SUBMISSION: Student ${user.id} submitting exam ${examIdNum}`);

      if (isNaN(examIdNum)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      // Get the active session for this student and exam
      const activeSession = await storage.getActiveExamSession(examIdNum, user.id);
      if (!activeSession) {
        console.log(`❌ No active session found for student ${user.id} exam ${examIdNum}`);
        return res.status(404).json({ message: "No active exam session found" });
      }

      if (activeSession.isCompleted) {
        console.log(`⚠️ Session ${activeSession.id} already completed`);

        // Return existing results if available
        const existingResults = await storage.getExamResultsByStudent(user.id);
        const examResult = existingResults.find(r => r.examId === examIdNum);

        if (examResult) {
          const maxScore = examResult.maxScore || 100;
          const score = examResult.score || examResult.marksObtained || 0;
          return res.json({
            submitted: true,
            alreadySubmitted: true,
            message: "Exam already submitted",
            result: {
              score: score,
              maxScore: maxScore,
              percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
              autoScored: examResult.autoScored || false
            }
          });
        }

        return res.status(409).json({ message: "Exam session already completed" });
      }

      // Mark session as completed
      const now = new Date();
      await storage.updateExamSession(activeSession.id, {
        isCompleted: true,
        submittedAt: now,
        status: 'submitted'
      });

      console.log(`✅ Session ${activeSession.id} marked as completed`);

      // Auto-score the exam
      try {
        await autoScoreExamSession(activeSession.id, storage);
        console.log(`✅ Auto-scoring completed for session ${activeSession.id}`);
      } catch (scoringError) {
        console.error(`❌ Auto-scoring failed for session ${activeSession.id}:`, scoringError);
        // Don't fail the submission if scoring fails
      }

      // Create grading tasks for essay/theory questions
      try {
        await createGradingTasksForSession(activeSession.id, examIdNum, storage);
        console.log(`✅ Grading tasks created for session ${activeSession.id}`);
      } catch (taskError) {
        console.error(`❌ Failed to create grading tasks for session ${activeSession.id}:`, taskError);
        // Don't fail the submission if task creation fails
      }

      // Get the results
      const results = await storage.getExamResultsByStudent(user.id);
      const examResult = results.find(r => r.examId === examIdNum);

      if (examResult) {
        const maxScore = examResult.maxScore || 100;
        const score = examResult.score || examResult.marksObtained || 0;
        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

        // SUCCESS RESPONSE with detailed breakdown and question feedback
        const response = {
          submitted: true,
          result: {
            score: score,
            totalScore: score, // Dual field for compatibility
            maxScore: maxScore,
            percentage: percentage,
            sessionId: activeSession.id,
            submittedAt: now,
            autoScored: examResult.autoScored || false
          }
        };
        res.json(response);
      } else {
        res.json({
          submitted: true,
          message: "Exam submitted successfully. Results pending manual grading."
        });
      }

    } catch (error) {
      console.error('❌ Exam submission error:', error);
      res.status(500).json({ 
        message: "Failed to submit exam",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Teacher Class Assignments
  app.get("/api/teacher-assignments", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const user = req.user!;
      const assignments = await storage.getTeacherClassAssignments(user.id);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching teacher assignments:', error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  app.post("/api/teacher-assignments", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const assignment = await storage.createTeacherClassAssignment(req.body);
      res.json(assignment);
    } catch (error) {
      console.error('Error creating teacher assignment:', error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });

  app.delete("/api/teacher-assignments/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const success = await storage.deleteTeacherClassAssignment(parseInt(req.params.id));
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Assignment not found" });
      }
    } catch (error) {
      console.error('Error deleting teacher assignment:', error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Grading Tasks
  app.get("/api/grading-tasks", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const user = req.user!;
      const status = req.query.status as string | undefined;
      const tasks = await storage.getGradingTasksByTeacher(user.id, status);
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching grading tasks:', error);
      res.status(500).json({ message: "Failed to fetch grading tasks" });
    }
  });

  app.post("/api/grading-tasks/:taskId/assign", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { teacherId } = req.body;
      const task = await storage.assignGradingTask(taskId, teacherId);
      if (task) {
        res.json(task);
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      console.error('Error assigning grading task:', error);
      res.status(500).json({ message: "Failed to assign task" });
    }
  });

  app.patch("/api/grading-tasks/:taskId/status", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { status, completedAt } = req.body;
      const task = await storage.updateGradingTaskStatus(taskId, status, completedAt);
      if (task) {
        res.json(task);
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });

  // Manual Scoring
  app.post("/api/grading-tasks/:taskId/complete", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { pointsEarned, feedbackText } = req.body;
      const user = req.user!;

      const result = await storage.completeGradingTask(taskId, pointsEarned, feedbackText);
      
      if (result) {
        // Create audit log
        await storage.createAuditLog({
          userId: user.id,
          entityType: 'student_answer',
          entityId: result.answer.id,
          action: 'manual_grade',
          description: `Teacher manually graded question with ${pointsEarned} points`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });

        res.json(result);
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      console.error('Error completing grading task:', error);
      res.status(500).json({ message: "Failed to complete grading task" });
    }
  });

  // Score Merging - Get merged scores for a session
  app.get("/api/exam-sessions/:sessionId/scores", authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const scoringData = await storage.getExamScoringData(sessionId);
      
      res.json({
        sessionId,
        maxScore: scoringData.summary.maxScore,
        studentScore: scoringData.summary.studentScore,
        autoScoredQuestions: scoringData.summary.autoScoredQuestions,
        totalQuestions: scoringData.summary.totalQuestions,
        scoringData: scoringData.scoringData
      });
    } catch (error) {
      console.error('Error fetching merged scores:', error);
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });

  // Report Generation
  app.post("/api/report-cards/generate", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId, termId, examIds } = req.body;
      
      // Get all exam results for the student
      const examResults = await storage.getExamResultsByStudent(studentId);
      
      // Filter by termId if provided
      let filteredResults = examResults;
      if (termId) {
        // Filter results by term (would need to join with exams table to get term)
        // For now, just use all results
      }
      
      // Calculate total scores using Test(40) + Exam(60) = Total(100) formula
      const reportData = filteredResults.map(result => ({
        ...result,
        // This is a simplified version - actual implementation would need to:
        // 1. Identify if it's a test or exam
        // 2. Apply appropriate weighting
        // 3. Merge scores across test and exam
      }));
      
      res.json({
        studentId,
        termId,
        reportData
      });
    } catch (error) {
      console.error('Error generating report card:', error);
      res.status(500).json({ message: "Failed to generate report card" });
    }
  });

  // Get Report Cards for a Student
  app.get("/api/report-cards/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const user = req.user!;
      
      // Check authorization - student can only view their own, teachers/admins can view all
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const examResults = await storage.getExamResultsByStudent(studentId);
      res.json(examResults);
    } catch (error) {
      console.error('Error fetching report cards:', error);
      res.status(500).json({ message: "Failed to fetch report cards" });
    }
  });

  // Parent API Endpoints
  // Get parent's children
  app.get("/api/parent/:parentId/children", authenticateUser, authorizeRoles(ROLES.PARENT), async (req, res) => {
    try {
      const parentId = req.params.parentId;
      const user = req.user!;
      
      // Parent can only view their own children
      if (user.id !== parentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const children = await storage.getStudentsByParentId(parentId);
      
      const childrenData = await Promise.all(children.map(async (student: any) => {
        const user = await storage.getUser(student.id);
        const classInfo = student.classId ? await storage.getClass(student.classId) : null;
        
        return {
          id: student.id,
          name: `${user?.firstName} ${user?.lastName}`,
          admissionNumber: student.admissionNumber,
          className: classInfo?.name || 'Not assigned',
        };
      }));
      
      res.json(childrenData);
    } catch (error) {
      console.error('Error fetching parent children:', error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  // Get child's report cards for parent
  app.get("/api/parent/child-reports/:studentId", authenticateUser, authorizeRoles(ROLES.PARENT), async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const user = req.user!;
      
      // Verify parent owns this child - CRITICAL SECURITY CHECK
      const student = await storage.getStudent(studentId);
      if (!student) {
        console.warn(`🔒 Security: Parent ${user.id} attempted to access non-existent student ${studentId}`);
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.parentId !== user.id) {
        console.warn(`🔒 Security Alert: Parent ${user.id} attempted unauthorized access to student ${studentId} (belongs to ${student.parentId})`);
        await storage.createAuditLog({
          userId: user.id,
          action: 'unauthorized_access_attempt',
          entityType: 'student_report_cards',
          entityId: 0,
          newValue: `Attempted to access student ${studentId}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });
        return res.status(403).json({ message: "Access denied" });
      }
      
      const reportCards = await storage.getReportCardsByStudentId(studentId);
      
      const reportCardsData = await Promise.all(reportCards.map(async (report: any) => {
        const term = await storage.getAcademicTerm(report.termId);
        const classInfo = await storage.getClass(report.classId);
        const studentUser = await storage.getUser(studentId);
        const items = await storage.getReportCardItems(report.id);
        
        const itemsData = await Promise.all(items.map(async (item: any) => {
          const subject = await storage.getSubject(item.subjectId);
          return {
            subjectName: subject?.name || 'Unknown',
            testScore: item.testScore,
            testMaxScore: item.testMaxScore,
            testWeightedScore: item.testWeightedScore,
            examScore: item.examScore,
            examMaxScore: item.examMaxScore,
            examWeightedScore: item.examWeightedScore,
            obtainedMarks: item.obtainedMarks,
            percentage: item.percentage,
            grade: item.grade,
            teacherRemarks: item.teacherRemarks,
          };
        }));
        
        return {
          id: report.id,
          studentId: studentId,
          studentName: `${studentUser?.firstName} ${studentUser?.lastName}`,
          className: classInfo?.name || 'Unknown',
          termName: term?.name || 'Unknown',
          termYear: term?.year || '',
          averagePercentage: report.averagePercentage,
          overallGrade: report.overallGrade,
          teacherRemarks: report.teacherRemarks,
          status: report.status,
          generatedAt: report.generatedAt,
          items: itemsData,
        };
      }));
      
      res.json(reportCardsData);
    } catch (error) {
      console.error('Error fetching child report cards:', error);
      res.status(500).json({ message: "Failed to fetch report cards" });
    }
  });

  // Generate PDF for report card
  app.get("/api/report-cards/:reportId/pdf", authenticateUser, async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const user = req.user!;
      
      // Fetch report card
      const report = await storage.getReportCard(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report card not found" });
      }
      
      // Check authorization BEFORE fetching any additional data
      if (user.roleId === ROLES.PARENT) {
        // Verify parent owns this student - CRITICAL SECURITY CHECK
        const student = await storage.getStudent(report.studentId);
        if (!student) {
          console.warn(`🔒 Security: Parent ${user.id} attempted to access PDF for non-existent student ${report.studentId}`);
          return res.status(404).json({ message: "Student not found" });
        }
        if (student.parentId !== user.id) {
          console.warn(`🔒 Security Alert: Parent ${user.id} attempted unauthorized PDF access to report ${reportId} for student ${report.studentId} (belongs to ${student.parentId})`);
          await storage.createAuditLog({
            userId: user.id,
            action: 'unauthorized_pdf_access_attempt',
            entityType: 'report_card',
            entityId: reportId,
            newValue: `Attempted to access student ${report.studentId}`,
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          });
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (user.roleId === ROLES.STUDENT) {
        // Student can only view their own report card
        if (user.id !== report.studentId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (user.roleId !== ROLES.ADMIN && user.roleId !== ROLES.TEACHER) {
        // Only admin, teacher, parent, or student can access report cards
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For now, return HTML that can be printed to PDF by browser
      // In production, use PDFKit or similar library to generate actual PDF
      const term = await storage.getAcademicTerm(report.termId);
      const classInfo = await storage.getClass(report.classId);
      const studentUser = await storage.getUser(report.studentId);
      const items = await storage.getReportCardItems(report.id);
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report Card - ${studentUser?.firstName} ${studentUser?.lastName}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .info { margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .grade-a { background-color: #d4edda; }
    .grade-b { background-color: #d1ecf1; }
    .grade-c { background-color: #fff3cd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Treasure-Home School</h1>
    <h2>Report Card</h2>
  </div>
  <div class="info">
    <p><strong>Student:</strong> ${studentUser?.firstName} ${studentUser?.lastName}</p>
    <p><strong>Class:</strong> ${classInfo?.name}</p>
    <p><strong>Term:</strong> ${term?.name} ${term?.year}</p>
    <p><strong>Overall Grade:</strong> ${report.overallGrade} (${report.averagePercentage}%)</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Subject</th>
        <th>Test (40)</th>
        <th>Exam (60)</th>
        <th>Total (100)</th>
        <th>Grade</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item: any) => `
        <tr class="${item.grade.startsWith('A') ? 'grade-a' : item.grade.startsWith('B') ? 'grade-b' : item.grade.startsWith('C') ? 'grade-c' : ''}">
          <td>${item.subjectName || 'Unknown'}</td>
          <td>${item.testWeightedScore}/40</td>
          <td>${item.examWeightedScore}/60</td>
          <td>${item.obtainedMarks}/100</td>
          <td>${item.grade}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ${report.teacherRemarks ? `<div class="info"><p><strong>Teacher's Remarks:</strong> ${report.teacherRemarks}</p></div>` : ''}
</body>
</html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Audit Logs
  app.get("/api/audit-logs", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId as string,
        entityType: req.query.entityType as string,
        entityId: req.query.entityId ? parseInt(req.query.entityId as string) : undefined,
        action: req.query.action as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.get("/api/audit-logs/:entityType/:entityId", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await storage.getAuditLogsByEntity(entityType, parseInt(entityId));
      res.json(logs);
    } catch (error) {
      console.error('Error fetching entity audit logs:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}