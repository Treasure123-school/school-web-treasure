import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema, insertExamSchema, insertExamResultSchema, insertExamQuestionSchema, insertQuestionOptionSchema, createQuestionOptionSchema, insertHomePageContentSchema, insertContactMessageSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, createStudentSchema, InsertUser, UpdateExamSessionSchema, UpdateUserStatusSchema, UpdateStudentSchema } from "@shared/schema";
import { z, ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import { generateUsername, generatePassword, getNextUserNumber, generateStudentUsername, generateStudentPassword } from "./auth-utils";
import passport from "passport";
import session from "express-session";
import { setupGoogleAuth } from "./google-auth";
import { and, eq, sql } from "drizzle-orm";

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
    interface User extends AuthenticatedUser {}
  }
}

// Extend express-session to include our custom session data
declare module 'express-session' {
  interface SessionData {
    pendingUser?: {
      googleId: string;
      email: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
      isNewUser: boolean;
    };
  }
}

const loginSchema = z.object({
  identifier: z.string().min(1), // Can be username or email
  password: z.string().min(1)
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
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
const lockoutViolations = new Map(); // Track rate limit violations per user with timestamp
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const LOCKOUT_VIOLATION_WINDOW = 60 * 60 * 1000; // 1 hour window for tracking violations
const MAX_RATE_LIMIT_VIOLATIONS = 3; // Suspend account after 3 rate limit hits within window
const BCRYPT_ROUNDS = 12;

// Periodic cleanup of expired violations and login attempts
setInterval(() => {
  const now = Date.now();

  // Clean up old login attempts
  for (const [key, data] of Array.from(loginAttempts.entries())) {
    if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.delete(key);
    }
  }

  // Clean up old lockout violations
  for (const [identifier, data] of Array.from(lockoutViolations.entries())) {
    const recentViolations = data.timestamps.filter((ts: number) => now - ts < LOCKOUT_VIOLATION_WINDOW);
    if (recentViolations.length === 0) {
      lockoutViolations.delete(identifier);
    } else if (recentViolations.length !== data.timestamps.length) {
      lockoutViolations.set(identifier, { count: recentViolations.length, timestamps: recentViolations });
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

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

// CSV upload configuration for bulk user provisioning
const csvDir = 'uploads/csv';
fs.mkdir(csvDir, { recursive: true }).catch(() => {});

const uploadCSV = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, csvDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'users-' + uniqueSuffix + '.csv');
    }
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for CSV
  },
  fileFilter: (req, file, cb) => {
    const isCSV = /csv|txt/.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = /text\/(csv|plain)|application\/(vnd\.ms-excel|csv)/.test(file.mimetype);

    if (isCSV || mimeOk) {
      return cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'));
    }
  }
});

// BACKGROUND AUTO-PUBLISHING SERVICE - Makes scheduled exams live
async function autoPublishScheduledExams(): Promise<void> {
  try {
    console.log('📅 AUTO-PUBLISH: Checking for scheduled exams...');

    const now = new Date();
    const scheduledExams = await storage.getScheduledExamsToPublish(now);

    if (scheduledExams.length > 0) {
      console.log(`📅 Found ${scheduledExams.length} exams ready to publish`);

      for (const exam of scheduledExams) {
        try {
          console.log(`🚀 AUTO-PUBLISH: Publishing exam ${exam.id} - ${exam.name}`);

          await storage.updateExam(exam.id, {
            isPublished: true
          });

          console.log(`✅ Successfully published exam ${exam.id}`);
        } catch (error) {
          console.error(`❌ Failed to auto-publish exam ${exam.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Auto-publish service error:', error);
  }
}

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

// Start auto-publishing service (runs every minute)
const autoPublishInterval = 60 * 1000; // 1 minute
setInterval(autoPublishScheduledExams, autoPublishInterval);
autoPublishScheduledExams(); // Run immediately on startup
console.log('📅 AUTO-PUBLISH: Background service started (runs every 1 minute)');

// PERFORMANCE FIX: Reduce cleanup frequency from 30s to 3 minutes to prevent database contention
const cleanupInterval = 3 * 60 * 1000; // 3 minutes (was 30 seconds)
const jitter = Math.random() * 30000; // Add 0-30s random jitter to prevent thundering herd
setTimeout(() => {
  setInterval(cleanupExpiredExamSessions, cleanupInterval);
  cleanupExpiredExamSessions(); // Run immediately after jitter delay
}, jitter);
console.log(`🧹 TIMEOUT PROTECTION: Background cleanup service started (every ${cleanupInterval/1000/60} minutes with jitter)`);

// AI-assisted theory scoring helper
async function scoreTheoryAnswer(
  studentAnswer: string,
  expectedAnswers: string[],
  sampleAnswer: string | null,
  points: number
): Promise<{ score: number; confidence: number; feedback: string; autoScored: boolean }> {
  // If no student answer, return 0
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      score: 0,
      confidence: 1.0,
      feedback: 'No answer provided.',
      autoScored: true
    };
  }

  const studentText = studentAnswer.toLowerCase().trim();

  // Keyword matching (60% weight)
  let keywordScore = 0;
  const matchedKeywords: string[] = [];
  const missedKeywords: string[] = [];

  if (expectedAnswers && expectedAnswers.length > 0) {
    expectedAnswers.forEach(keyword => {
      const keywordLower = keyword.toLowerCase().trim();
      if (studentText.includes(keywordLower)) {
        matchedKeywords.push(keyword);
      } else {
        missedKeywords.push(keyword);
      }
    });

    keywordScore = matchedKeywords.length / expectedAnswers.length;
  }

  // Simple semantic similarity (40% weight) - basic word overlap
  let semanticScore = 0;
  if (sampleAnswer && sampleAnswer.trim().length > 0) {
    const sampleWords = sampleAnswer.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const studentWords = studentText.split(/\s+/).filter(w => w.length > 3);

    const commonWords = studentWords.filter(word => sampleWords.includes(word));
    semanticScore = sampleWords.length > 0 ? commonWords.length / sampleWords.length : 0;
  } else {
    // If no sample answer, use keyword score for both
    semanticScore = keywordScore;
  }

  // Hybrid score calculation
  const hybridScore = (keywordScore * 0.6) + (semanticScore * 0.4);
  const calculatedPoints = Math.round(hybridScore * points * 100) / 100; // Round to 2 decimals

  // Confidence calculation
  const confidence = Math.min(
    keywordScore > 0.8 ? 0.9 : keywordScore > 0.5 ? 0.7 : 0.5,
    1.0
  );

  // Generate feedback
  let feedback = '';
  if (hybridScore >= 0.8) {
    feedback = `Excellent answer! Key points identified: ${matchedKeywords.join(', ')}. `;
  } else if (hybridScore >= 0.5) {
    feedback = `Good effort. You covered: ${matchedKeywords.join(', ')}. `;
    if (missedKeywords.length > 0) {
      feedback += `Consider including: ${missedKeywords.slice(0, 3).join(', ')}. `;
    }
  } else {
    feedback = `Needs improvement. `;
    if (missedKeywords.length > 0) {
      feedback += `Missing key points: ${missedKeywords.slice(0, 3).join(', ')}. `;
    }
  }

  // Auto-score if confidence is high, otherwise flag for manual review
  const shouldAutoScore = confidence >= 0.7 && hybridScore >= 0.3;

  if (!shouldAutoScore) {
    feedback += 'This answer has been flagged for teacher review.';
  }

  return {
    score: shouldAutoScore ? calculatedPoints : 0,
    confidence,
    feedback,
    autoScored: shouldAutoScore
  };
}

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

    const { totalQuestions, maxScore: maxPossibleScore, studentScore, autoScoredQuestions } = summary; // Renamed maxScore to maxPossibleScore

    // Get all student answers for theory scoring
    const studentAnswers = await storage.getStudentAnswers(sessionId);
    const examQuestions = await storage.getExamQuestions(session.examId);

    let totalAutoScore = studentScore; // Start with MCQ scores
    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;

    console.log(`✅ OPTIMIZED SCORING: Session ${sessionId} - ${totalQuestions} questions (${hasMultipleChoiceQuestions ? autoScoredQuestions + ' MC' : 'no MC'}, ${hasEssayQuestions ? (totalQuestions - autoScoredQuestions) + ' Essays' : 'no Essays'})`);

    // Enhanced question-by-question breakdown for detailed feedback
    const questionDetails = [];

    for (const q of scoringData) {
      const question = examQuestions.find(eq => eq.id === q.questionId);
      const studentAnswer = studentAnswers.find(sa => sa.questionId === q.questionId);

      let questionDetail: any = {
        questionId: q.questionId,
        questionType: q.questionType,
        points: q.points,
        maxPoints: q.points,
        pointsEarned: 0,
        isCorrect: null,
        autoScored: false,
        feedback: null,
        aiSuggested: false,
        confidence: 0
      };

      // Multiple choice - already scored
      if (q.questionType === 'multiple_choice') {
        questionDetail.pointsEarned = q.isCorrect ? q.points : 0;
        questionDetail.isCorrect = q.isCorrect;
        questionDetail.autoScored = true;
        questionDetail.feedback = q.isCorrect
          ? `Correct! You earned ${q.points} point${q.points !== 1 ? 's' : ''}.`
          : `Incorrect. This question was worth ${q.points} point${q.points !== 1 ? 's' : ''}.`;
      }
      // Theory questions - AI-assisted scoring
      else if (q.questionType === 'text' || q.questionType === 'essay') {
        if (studentAnswer && studentAnswer.textAnswer && question) {
          const aiResult = await scoreTheoryAnswer(
            studentAnswer.textAnswer,
            question.expectedAnswers || [],
            question.sampleAnswer || null,
            q.points
          );

          questionDetail.pointsEarned = aiResult.score;
          questionDetail.autoScored = aiResult.autoScored;
          questionDetail.aiSuggested = !aiResult.autoScored; // Flag for teacher review if not auto-scored
          questionDetail.confidence = aiResult.confidence;
          questionDetail.feedback = aiResult.feedback;

          if (aiResult.autoScored) {
            totalAutoScore += aiResult.score;
            questionDetail.isCorrect = aiResult.score >= (q.points * 0.5); // 50% threshold for "correct"
          }
        } else {
          questionDetail.feedback = 'This question requires manual review by your instructor.';
          questionDetail.aiSuggested = true; // Flag for manual review
        }
      }

      questionDetails.push(questionDetail);
    }

    // CRITICAL FIX: Persist all scores to student_answers for accurate score merging
    console.log('💾 Persisting scores to student_answers for score merging...');
    for (const detail of questionDetails) {
      if (detail.questionId) {
        const studentAnswer = studentAnswers.find(sa => sa.questionId === detail.questionId);
        if (studentAnswer) {
          try {
            await storage.updateStudentAnswer(studentAnswer.id, {
              pointsEarned: detail.pointsEarned,
              isCorrect: detail.isCorrect,
              autoScored: detail.autoScored,
              feedbackText: detail.feedback
            });
            console.log(`✅ Updated answer ${studentAnswer.id} with ${detail.pointsEarned} points (auto: ${detail.autoScored})`);
          } catch (updateError) {
            console.error(`❌ Failed to update answer ${studentAnswer.id}:`, updateError);
          }
        }
      }
    }

    // Calculate detailed breakdown
    const aiSuggestedCount = questionDetails.filter((q: any) => q.aiSuggested === true).length;
    const breakdown = {
      totalQuestions,
      autoScoredQuestions: questionDetails.filter((q: any) => q.autoScored === true).length,
      aiSuggestedQuestions: aiSuggestedCount,
      correctAnswers: questionDetails.filter((q: any) => q.isCorrect === true).length,
      incorrectAnswers: questionDetails.filter((q: any) => q.isCorrect === false).length,
      pendingManualReview: questionDetails.filter((q: any) => q.isCorrect === null || q.aiSuggested === true).length,
      maxScore: maxPossibleScore,
      earnedScore: totalAutoScore
    };

    // Log detailed scoring for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 DETAILED BREAKDOWN:`, breakdown);
      questionDetails.forEach((q: any, index: number) => {
        console.log(`Question ${index + 1} (ID: ${q.questionId}): ${q.isCorrect !== null ? (q.isCorrect ? 'Correct!' : 'Incorrect') : 'Manual Review'} - ${q.pointsEarned}/${q.points}`);
      });
    }

    // Create or update exam result - CRITICAL for instant feedback
    console.log(`🎯 Preparing exam result for student ${session.studentId}, exam ${session.examId}`);
    console.log(`📊 Score calculation: ${totalAutoScore}/${maxPossibleScore} (${breakdown.correctAnswers} correct, ${breakdown.incorrectAnswers} incorrect, ${breakdown.pendingManualReview} pending manual review)`);

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
      score: totalAutoScore,
      maxScore: maxPossibleScore,
      marksObtained: totalAutoScore, // ✅ CRITICAL FIX: Ensure database constraint compatibility
      autoScored: breakdown.pendingManualReview === 0, // Only fully auto-scored if no pending reviews
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
        console.log(`✅ Updated exam result for student ${session.studentId}: ${totalAutoScore}/${maxPossibleScore} (ID: ${existingResult.id})`);
        console.log(`🎉 INSTANT FEEDBACK READY: Result updated successfully!`);
      } else {
        // Create new result
        console.log('🆕 Creating new exam result...');
        const newResult = await storage.recordExamResult(resultData);
        if (!newResult || !newResult.id) {
          throw new Error('Failed to create exam result - recordExamResult returned null/undefined or missing ID');
        }
        console.log(`✅ Created new exam result for student ${session.studentId}: ${totalAutoScore}/${maxPossibleScore} (ID: ${newResult.id})`);
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

export async function registerRoutes(app: Express): Server {

  // AI-assisted grading routes
  // Get AI-suggested grading tasks for teacher review
  app.get('/api/grading/tasks/ai-suggested', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const status = req.query.status as string;

      // Get all exam sessions with AI-suggested answers
      const tasks = await storage.getAISuggestedGradingTasks(teacherId, status);

      res.json(tasks);
    } catch (error) {
      console.error('Error fetching AI-suggested tasks:', error);
      res.status(500).json({ message: 'Failed to fetch AI-suggested tasks' });
    }
  });

  // Teacher profile setup (first-time login)
  app.post('/api/teacher/profile/setup', authenticateUser, authorizeRoles(ROLES.TEACHER), upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      console.log('📥 RECEIVED PROFILE SETUP REQUEST:', {
        teacherId,
        hasFiles: Object.keys(files || {}).length,
        fileFields: Object.keys(files || {}),
        profileImageExists: !!files['profileImage']?.[0],
        signatureExists: !!files['signature']?.[0],
        bodyKeys: Object.keys(req.body),
        staffId: req.body.staffId,
        subjects: req.body.subjects,
        assignedClasses: req.body.assignedClasses
      });

      // Log detailed file information
      if (files['profileImage']?.[0]) {
        console.log('📸 Profile Image Details:', {
          filename: files['profileImage'][0].filename,
          originalname: files['profileImage'][0].originalname,
          mimetype: files['profileImage'][0].mimetype,
          size: files['profileImage'][0].size,
          path: files['profileImage'][0].path
        });
      } else {
        console.log('⚠️ No profile image received in upload');
      }

      if (files['signature']?.[0]) {
        console.log('✍️ Signature Details:', {
          filename: files['signature'][0].filename,
          originalname: files['signature'][0].originalname,
          mimetype: files['signature'][0].mimetype,
          size: files['signature'][0].size,
          path: files['signature'][0].path
        });
      }

      const {
        gender, dateOfBirth, staffId, nationalId, phoneNumber, recoveryEmail,
        qualification, specialization, yearsOfExperience,
        subjects, assignedClasses, department, gradingMode,
        notificationPreference, availability, agreement
      } = req.body;

      // Parse JSON arrays
      const parsedSubjects = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
      const parsedClasses = typeof assignedClasses === 'string' ? JSON.parse(assignedClasses) : assignedClasses;

      // Get file paths
      const profilePhotoPath = files['profileImage']?.[0]?.path;
      const signaturePath = files['signature']?.[0]?.path;

      // Normalize gender to match database enum (Male, Female, Other)
      const normalizedGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : null;

      // FIX #1: Check if profile already exists FIRST
      const existingTeacherProfile = await storage.getTeacherProfile(teacherId);
      if (existingTeacherProfile) {
        return res.status(409).json({
          message: "Profile already exists. Please update your existing profile instead.",
          existingProfile: true
        });
      }

      // FIX #2: Validate user exists before proceeding
      const user = await storage.getUser(teacherId);
      if (!user) {
        return res.status(404).json({
          message: "User account not found. Please contact support.",
          code: "USER_NOT_FOUND"
        });
      }

      // FIX: Make staffId fully optional - auto-generate if not provided
      let finalStaffId: string | null = null;

      if (staffId && staffId.trim() !== '' && staffId.trim() !== 'undefined' && staffId.trim() !== 'null') {
        // User provided a staff ID - check uniqueness
        try {
          const existingProfile = await storage.getTeacherProfileByStaffId(staffId.trim());
          if (existingProfile && existingProfile.userId !== teacherId) {
            return res.status(409).json({
              message: "Staff ID already exists. Please use a unique Staff ID or leave it blank for auto-generation.",
              code: "STAFF_ID_EXISTS"
            });
          }
          finalStaffId = staffId.trim();
        } catch (staffIdError) {
          console.error('❌ Staff ID validation error:', staffIdError);
          // Don't fail - just auto-generate instead
          finalStaffId = null;
        }
      }

      // Auto-generate if still null
      if (!finalStaffId) {
        try {
          const currentYear = new Date().getFullYear();
          const allTeacherProfiles = await storage.getAllTeacherProfiles();

          const teacherProfilesThisYear = allTeacherProfiles.filter((p: any) =>
            p.staffId && p.staffId.startsWith(`THS/TCH/${currentYear}/`)
          );

          const existingNumbers = teacherProfilesThisYear
            .map((p: any) => {
              const match = p.staffId?.match(/THS\/TCH\/\d{4}\/(\d+)/);
              return match ? parseInt(match[1]) : 0;
            })
            .filter((n: number) => !isNaN(n));

          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          finalStaffId = `THS/TCH/${currentYear}/${String(nextNumber).padStart(3, '0')}`;

          console.log(`✅ Auto-generated Staff ID: ${finalStaffId}`);
        } catch (autoGenError) {
          console.error('❌ Auto-generation error:', autoGenError);
          // Last resort - use timestamp
          finalStaffId = `THS/TCH/${new Date().getFullYear()}/${Date.now().toString().slice(-3)}`;
        }
      }

      // Create or update teacher profile
      const profileData = {
        userId: teacherId,
        staffId: finalStaffId, // Use validated staffId or null
        subjects: parsedSubjects,
        assignedClasses: parsedClasses,
        qualification,
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        specialization,
        department,
        signatureUrl: signaturePath ? `/${signaturePath}` : null,
        gradingMode,
        notificationPreference,
        availability: availability || null,
        firstLogin: false,
        verified: true, // Auto-verify on completion
        verifiedAt: new Date()
      };

      // Update user table with basic info
      const userUpdateData: any = {
        phone: phoneNumber,
        gender: normalizedGender,
        dateOfBirth,
        profileImageUrl: profilePhotoPath ? `/${profilePhotoPath}` : null
      };

      // Only include nationalId if provided
      if (nationalId && nationalId.trim() !== '' && nationalId !== 'undefined') {
        userUpdateData.nationalId = nationalId.trim();
      }

      // Only include recoveryEmail if provided
      if (recoveryEmail && recoveryEmail.trim() !== '' && recoveryEmail !== 'undefined') {
        userUpdateData.recoveryEmail = recoveryEmail.trim();
      }

      await storage.updateUser(teacherId, userUpdateData);

      // Detect suspicious patterns for admin notification (informational only)
      const isSuspicious = (
        parsedSubjects.length === 0 ||
        parsedClasses.length === 0 ||
        !department ||
        yearsOfExperience === 0
      );

      // Create teacher profile with verified status and theory grading preferences
      // FIX: Always auto-verify completed profiles, suspicious check is for admin notification only
      const profile = await storage.createTeacherProfile({
        ...profileData,
        firstLogin: false,
        autoGradeTheoryQuestions: req.body.autoGradeTheoryQuestions === 'true',
        theoryGradingInstructions: req.body.theoryGradingInstructions || null
      });

      // Send additional notification for admin review if suspicious (informational only)
      if (isSuspicious) {
        const teacher = await storage.getUser(teacherId);
        const teacherFullName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher';

        const missingFields = [];
        if (parsedSubjects.length === 0) missingFields.push('subjects');
        if (parsedClasses.length === 0) missingFields.push('classes');
        if (!department) missingFields.push('department');
        if (yearsOfExperience === 0) missingFields.push('experience');

        await storage.createNotification({
          userId: (await storage.getUsersByRole(ROLES.ADMIN))[0]?.id,
          type: 'teacher_profile_review_required',
          title: '⚠️ Teacher Profile Has Incomplete Data',
          message: `${teacherFullName}'s profile was auto-verified but has incomplete data (missing: ${missingFields.join(', ')}). Please review and update if needed.`,
          relatedEntityType: 'teacher_profile',
          relatedEntityId: profile.id.toString(),
          isRead: false
        });
      }

      // Update user's profile completion status
      await storage.updateUser(teacherId, {
        profileCompleted: true,
        profileCompletionPercentage: 100
      });

      // Get teacher's full name from user record
      const teacher = await storage.getUser(teacherId);
      const teacherFullName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Teacher';

      // Create notification for admins (informational only)
      const admins = await storage.getUsersByRole(ROLES.ADMIN);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'teacher_profile_created',
          title: '🎉 New Teacher Auto-Verified',
          message: `${teacherFullName} completed profile setup and has been automatically verified. Department: ${department}, Subjects: ${parsedSubjects.length}, Classes: ${parsedClasses.length}`,
          relatedEntityType: 'teacher_profile',
          relatedEntityId: profile.id.toString(),
          isRead: false
        });

        // Send email notification to admin with enhanced details
        try {
          const { sendEmail, getTeacherVerifiedEmailHTML } = await import('./email-service');

          // Get subject and class names for better readability with error handling
          let subjectNames: string[] = [];
          let classNames: string[] = [];

          try {
            const subjects = await storage.getSubjects();
            subjectNames = parsedSubjects.map((subjectId: number) => {
              const subject = subjects.find((s: any) => s.id === subjectId);
              return subject?.name || `Subject #${subjectId}`;
            });
          } catch (error) {
            console.error('Failed to fetch subject names:', error);
            subjectNames = parsedSubjects.map((id: number) => `Subject #${id}`);
          }

          try {
            const classes = await storage.getClasses();
            classNames = parsedClasses.map((classId: number) => {
              const cls = classes.find((c: any) => c.id === classId);
              return cls?.name || `Class #${classId}`;
            });
          } catch (error) {
            console.error('Failed to fetch class names:', error);
            classNames = parsedClasses.map((id: number) => `Class #${id}`);
          }

          await sendEmail({
            to: admin.email,
            subject: '🎉 New Teacher Auto-Verified - THS Portal',
            html: getTeacherVerifiedEmailHTML(
              teacherFullName,
              department,
              subjectNames.join(', '),
              classNames.join(', '),
              qualification,
              yearsOfExperience,
              staffId || 'Pending',
              `${process.env.BASE_URL || 'http://localhost:5000'}/portal/admin/teachers`
            )
          });
          console.log(`✅ Auto-verification email sent to admin: ${admin.email}`);
        } catch (emailError) {
          console.error('Failed to send admin notification email:', emailError);
          // Don't fail the entire process if email fails
        }
      }

      // Log audit event - FIX: profile.id is already a number, don't convert to BigInt
      await storage.createAuditLog({
        userId: teacherId,
        action: 'teacher_profile_setup_completed',
        entityType: 'teacher_profile',
        entityId: profile.id, // Already a number from database
        newValue: JSON.stringify({ staffId: finalStaffId, subjects: parsedSubjects, classes: parsedClasses }),
        reason: 'Teacher completed first-time profile setup',
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || null
      });

      // Return complete profile with correct field names
      const completeProfileResponse = {
        id: profile.id,
        userId: profile.userId,
        staffId: profile.staffId,
        subjects: profile.subjects,
        assignedClasses: profile.assignedClasses, // FIX: Use correct field name
        department: profile.department,
        qualification: profile.qualification,
        yearsOfExperience: profile.yearsOfExperience,
        specialization: profile.specialization,
        verified: profile.verified,
        firstLogin: profile.firstLogin
      };

      console.log('📤 Sending profile response to frontend:', completeProfileResponse);

      res.json({
        message: 'Profile setup completed successfully! You can now access your dashboard.',
        hasProfile: true,
        verified: profile.verified,
        profile: completeProfileResponse
      });
    } catch (error) {
      console.error('❌ TEACHER PROFILE SETUP ERROR - Full Details:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        errorName: error instanceof Error ? error.name : undefined,
        errorCode: (error as any)?.code,
        errorDetail: (error as any)?.detail,
        errorConstraint: (error as any)?.constraint,
        errorSeverity: (error as any)?.severity,
        errorTable: (error as any)?.table,
        errorColumn: (error as any)?.column,
        teacherId: req.user?.id,
        requestBody: {
          ...req.body,
          // Redact sensitive data in logs
          password: req.body.password ? '[REDACTED]' : undefined
        },
        files: Object.keys(req.files || {})
      });

      // Extract meaningful error information
      let errorMessage = 'Failed to setup teacher profile';
      let statusCode = 500;
      let errorCode = 'UNKNOWN_ERROR';

      if (error instanceof Error) {
        // Check for PostgreSQL/database specific errors
        const dbError = error as any;

        // Unique constraint violation
        if (dbError.code === '23505' || dbError.constraint) {
          errorMessage = `A profile with this ${dbError.constraint?.includes('staff_id') ? 'Staff ID' : 'information'} already exists.`;
          statusCode = 409;
          errorCode = 'DUPLICATE_ENTRY';
        }
        // Foreign key violation
        else if (dbError.code === '23503') {
          errorMessage = 'Invalid reference data provided. Please check your selections.';
          statusCode = 400;
          errorCode = 'INVALID_REFERENCE';
        }
        // Not null violation
        else if (dbError.code === '23502') {
          errorMessage = `Required field missing: ${dbError.column || 'unknown'}`;
          statusCode = 400;
          errorCode = 'MISSING_REQUIRED_FIELD';
        }
        // Check constraint violation
        else if (dbError.code === '23514') {
          errorMessage = 'Invalid data provided. Please check your input values.';
          statusCode = 400;
          errorCode = 'INVALID_DATA';
        }
        // Generic error message extraction
        else if (error.message) {
          errorMessage = error.message;

          // Determine status code based on message
          if (error.message.toLowerCase().includes('already exists') ||
              error.message.toLowerCase().includes('duplicate')) {
            statusCode = 409;
            errorCode = 'DUPLICATE_ENTRY';
          } else if (error.message.toLowerCase().includes('not found')) {
            statusCode = 404;
            errorCode = 'NOT_FOUND';
          } else if (error.message.toLowerCase().includes('invalid') ||
                     error.message.toLowerCase().includes('validation')) {
            statusCode = 400;
            errorCode = 'VALIDATION_ERROR';
          }
        }
      }

      res.status(statusCode).json({
        message: errorMessage,
        code: errorCode,
        details: error instanceof Error ? error.message : undefined,
        constraint: (error as any)?.constraint
      });
    }
  });

  // Get teacher profile status (check if setup is needed)
  app.get('/api/teacher/profile/status', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const profile = await storage.getTeacherProfile(teacherId);

      const status = {
        hasProfile: !!profile,
        verified: profile?.verified || false,
        firstLogin: profile?.firstLogin !== false
      };

      console.log('📋 Profile status check:', { teacherId, ...status });

      res.json(status);
    } catch (error) {
      console.error('❌ Get teacher profile status error:', error);
      res.status(500).json({ message: 'Failed to check profile status' });
    }
  });

  // Get teacher's own profile with user data
  app.get('/api/teacher/profile/me', authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;

      const profile = await storage.getTeacherProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: 'Profile not found' });
      }

      // Get user data to merge with profile
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Build complete profile with ALL fields merged from both tables
      const completeProfile = {
        // Profile fields
        id: profile.id,
        userId: profile.userId,
        staffId: profile.staffId,
        subjects: Array.isArray(profile.subjects) ? profile.subjects : (profile.subjects ? [profile.subjects] : []),
        assignedClasses: Array.isArray(profile.assignedClasses) ? profile.assignedClasses : (profile.assignedClasses ? [profile.assignedClasses] : []),
        department: profile.department,
        qualification: profile.qualification,
        yearsOfExperience: profile.yearsOfExperience,
        specialization: profile.specialization,
        verified: profile.verified,
        firstLogin: profile.firstLogin,

        // CRITICAL FIX: Include ALL user fields from users table
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: user.dateOfBirth || '',
        nationalId: user.nationalId || '', // ✅ FIX: From users.national_id column
        address: user.address || '',
        recoveryEmail: user.recoveryEmail || '', // ✅ FIX: From users.recovery_email column
        profileImageUrl: user.profileImageUrl || '', // ✅ FIX: From users.profile_image_url column

        // Additional profile fields
        gradingMode: profile.gradingMode,
        notificationPreference: profile.notificationPreference,
        availability: profile.availability,
        signatureUrl: profile.signatureUrl,
        updatedAt: profile.updatedAt
      };

      console.log('✅ Teacher profile API response:', {
        userId,
        staffId: completeProfile.staffId,
        hasNationalId: !!completeProfile.nationalId,
        nationalId: completeProfile.nationalId,
        hasProfileImage: !!completeProfile.profileImageUrl,
        profileImageUrl: completeProfile.profileImageUrl
      });

      res.json(completeProfile);
    } catch (error: any) {
      console.error('❌ Error fetching teacher profile:', error);
      res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
  });

  // Update teacher profile (PUT endpoint for editing)
  app.put('/api/teacher/profile/me', authenticateUser, authorizeRoles(ROLES.TEACHER), upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      console.log('📝 PROFILE UPDATE REQUEST:', {
        teacherId,
        hasFiles: Object.keys(files || {}).length,
        fileFields: Object.keys(files || {}),
        hasProfileImage: !!files['profileImage']?.[0],
        hasSignature: !!files['signature']?.[0],
        bodyKeys: Object.keys(req.body)
      });

      // Parse the update data
      const updateData = req.body;

      // Handle file uploads
      let profileImageUrl = updateData.profileImageUrl;
      let signatureUrl = updateData.signatureUrl;

      if (files['profileImage']?.[0]) {
        profileImageUrl = `/${files['profileImage'][0].path.replace(/\\/g, '/')}`;
        console.log('📸 New profile image uploaded:', profileImageUrl);
      }

      if (files['signature']?.[0]) {
        signatureUrl = `/${files['signature'][0].path.replace(/\\/g, '/')}`;
        console.log('✍️ New signature uploaded:', signatureUrl);
      }

      // Parse JSON fields
      const subjects = typeof updateData.subjects === 'string' ? JSON.parse(updateData.subjects) : updateData.subjects;
      const assignedClasses = typeof updateData.assignedClasses === 'string' ? JSON.parse(updateData.assignedClasses) : updateData.assignedClasses;

      // Update user table (personal information)
      const userUpdateData: any = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone || null,
        address: updateData.address || null,
        recoveryEmail: updateData.recoveryEmail || null,
        gender: updateData.gender || null,
        dateOfBirth: updateData.dateOfBirth || null,
        nationalId: updateData.nationalId || null,
      };

      if (profileImageUrl) {
        userUpdateData.profileImageUrl = profileImageUrl;
      }

      await storage.updateUser(teacherId, userUpdateData);
      console.log('✅ User data updated successfully');

      // Update teacher profile table (professional information)
      const profileUpdateData: any = {
        qualification: updateData.qualification || null,
        specialization: updateData.specialization || null,
        yearsOfExperience: parseInt(updateData.yearsOfExperience) || 0,
        department: updateData.department || null,
        gradingMode: updateData.gradingMode || 'manual',
        notificationPreference: updateData.notificationPreference || 'all',
        availability: updateData.availability || 'full-time',
        subjects: subjects || [],
        assignedClasses: assignedClasses || [],
        updatedAt: new Date()
      };

      if (signatureUrl) {
        profileUpdateData.signatureUrl = signatureUrl;
      }

      await storage.updateTeacherProfile(teacherId, profileUpdateData);
      console.log('✅ Teacher profile updated successfully');

      // Fetch and return updated profile
      const updatedProfile = await storage.getTeacherProfile(teacherId);
      const updatedUser = await storage.getUser(teacherId);

      const completeProfile = {
        ...updatedProfile,
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        email: updatedUser?.email,
        phone: updatedUser?.phone,
        gender: updatedUser?.gender,
        dateOfBirth: updatedUser?.dateOfBirth,
        nationalId: updatedUser?.nationalId,
        address: updatedUser?.address,
        recoveryEmail: updatedUser?.recoveryEmail,
        profileImageUrl: updatedUser?.profileImageUrl,
      };

      res.json({
        message: 'Profile updated successfully',
        profile: completeProfile
      });

    } catch (error) {
      console.error('❌ PROFILE UPDATE ERROR:', error);
      res.status(500).json({
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get teacher overview for admin dashboard (with auto-verified indicator)
  app.get('/api/admin/teachers/overview', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      // Get all teachers
      const teachers = await storage.getUsersByRole(ROLES.TEACHER);

      // Get all teacher profiles
      const overview = await Promise.all(teachers.map(async (teacher: any) => {
        const profile = await storage.getTeacherProfile(teacher.id);

        return {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          staffId: profile?.staffId || null,
          department: profile?.department || null,
          subjects: profile?.subjects || [],
          classes: profile?.assignedClasses || [],
          verified: profile?.verified || false,
          hasProfile: !!profile,
          createdAt: teacher.createdAt,
        };
      }));

      res.json(overview);
    } catch (error) {
      console.error('Get teacher overview error:', error);
      res.status(500).json({ message: 'Failed to fetch teacher overview' });
    }
  });

  // Teacher approves or overrides AI-suggested score
  app.post('/api/grading/ai-suggested/:answerId/review', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const answerId = parseInt(req.params.answerId);
      const { approved, overrideScore, comment } = req.body;

      const answer = await storage.getStudentAnswerById(answerId);
      if (!answer) {
        return res.status(404).json({ message: 'Answer not found' });
      }

      // If approved, mark as auto-scored and keep the score
      if (approved) {
        await storage.updateStudentAnswer(answerId, {
          autoScored: true,
          manualOverride: false,
          feedbackText: comment || answer.feedbackText
        });
      } else {
        // Teacher override - use their score
        await storage.updateStudentAnswer(answerId, {
          pointsEarned: overrideScore,
          autoScored: false,
          manualOverride: true,
          feedbackText: comment
        });
      }

      // Trigger score merge
      await mergeExamScores(answerId, storage);

      res.json({
        message: approved ? 'AI score approved' : 'Score overridden successfully',
        answer: await storage.getStudentAnswerById(answerId)
      });
    } catch (error) {
      console.error('Error reviewing AI-suggested score:', error);
      res.status(500).json({ message: 'Failed to review AI-suggested score' });
    }
  });

  // Initialize session middleware (required for Passport OAuth)
  app.use(session({
    secret: process.env.JWT_SECRET || SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Setup Google OAuth (will only activate if credentials are provided)
  const googleOAuthEnabled = setupGoogleAuth();
  if (googleOAuthEnabled) {
    console.log('✅ Google OAuth authentication enabled');
  } else {
    console.log('⚠️  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
  }

  // Google OAuth routes
  app.get('/api/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
  }));

  app.get('/api/auth/google/callback',
    (req, res, next) => {
      console.log('📧 Google OAuth callback received:', {
        query: req.query,
        hasCode: !!req.query.code,
        hasError: !!req.query.error
      });

      passport.authenticate('google', async (err: any, user: any, info: any) => {
        if (err) {
          console.error('❌ Google OAuth error:', err);
          console.error('Error details:', { message: err.message, stack: err.stack });
          return res.redirect('/login?error=google_auth_failed&message=' + encodeURIComponent('Authentication failed. Please try again.'));
        }

        if (!user) {
          const message = info?.message || 'Authentication failed';
          console.error('❌ Google OAuth: No user returned. Info:', info);
          return res.redirect('/login?error=google_auth_failed&message=' + encodeURIComponent(message));
        }

        // Handle new user requiring approval
        if (user.isNewUser && user.requiresApproval) {
          console.log('📝 Creating pending staff account for:', user.email);

          try {
            // Check if an invite exists for this email
            const invite = await storage.getPendingInviteByEmail(user.email);
            const roleId = invite ? invite.roleId : ROLES.TEACHER; // Default to teacher if no invite

            // Generate THS username
            const currentYear = new Date().getFullYear().toString();
            const existingUsers = await storage.getUsersByRole(roleId);
            const existingUsernames = existingUsers.map((u: any) => u.username).filter(Boolean);
            const nextNumber = getNextUserNumber(existingUsernames, roleId, currentYear);
            const username = generateUsername(roleId, currentYear, '', nextNumber);

            // Create PENDING account with only fields that exist in DB
            const newUser = await storage.createUser({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              username,
              roleId,
              authProvider: 'google',
              googleId: user.googleId,
              profileImageUrl: user.profileImageUrl,
              mustChangePassword: false,
              passwordHash: null,
              status: 'pending', // Requires approval
              createdVia: invite ? 'invite' : 'google',
              isActive: true,
            });

            // If invite exists, mark it as accepted
            if (invite) {
              await storage.markInviteAsAccepted(invite.id, newUser.id);
            }

            console.log('✅ Created pending account for:', user.email);

            // Log audit event
            await storage.createAuditLog({
              userId: newUser.id,
              action: 'account_created_pending_approval',
              entityType: 'user',
              entityId: BigInt(1), // Placeholder, needs proper entity ID if applicable
              newValue: JSON.stringify({ email: user.email, googleId: user.googleId, username, roleId }),
              reason: invite ? 'OAuth signup via invite' : 'OAuth signup without invite',
              ipAddress: req.ip,
              userAgent: req.headers['user-agent']
            });

            // Notify all admins about the new pending user
            try {
              const admins = await storage.getUsersByRole(ROLES.ADMIN);
              if (admins && admins.length > 0) {
                const role = await storage.getRole(roleId);
                const roleName = role?.name || (roleId === ROLES.ADMIN ? 'Admin' : 'Teacher');

                for (const admin of admins) {
                  await storage.createNotification({
                    userId: admin.id,
                    type: 'pending_user',
                    title: 'New User Pending Approval',
                    message: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) has signed up via Google as ${roleName} and is awaiting approval.`,
                    relatedEntityType: 'user',
                    relatedEntityId: newUser.id,
                    isRead: false
                  });
                }
                console.log(`📬 Notified ${admins.length} admin(s) about pending user: ${newUser.email}`);
              } else {
                console.warn('⚠️ No admins found to notify about pending user:', newUser.email);
              }
            } catch (notifError) {
              console.error('❌ Failed to create admin notifications:', notifError);
              // Don't fail the user creation if notification fails
            }

            // REDIRECT WITH FRIENDLY MESSAGE - As per Chapter 1 plan
            console.log(`🔒 OAuth signup complete - user ${newUser.email} awaiting admin approval`);
            const role = await storage.getRole(roleId);
            const roleName = role?.name || 'Staff';
            return res.redirect(`/login?status=pending_verification&role=${roleName.toLowerCase()}`);
          } catch (error) {
            console.error('❌ Error creating pending account:', error);
            return res.redirect('/login?error=account_creation_failed&message=' + encodeURIComponent('Failed to create your account. Please contact the administrator.'));
          }
        }

        // Existing active user - allow login
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error:', loginErr);
            return res.redirect('/login?error=login_failed&message=' + encodeURIComponent('Failed to complete login'));
          }

          const token = jwt.sign({ userId: user.id, roleId: user.roleId }, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
          res.redirect(`/login?token=${token}&provider=google`);
        });
      })(req, res, next);
    }
  );

  app.get('/api/auth/me', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error in /api/auth/me:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Parent-child linking endpoint
  app.get('/api/parents/children/:parentId', authenticateUser, async (req, res) => {
    try {
      const parentId = req.params.parentId;
      const user = req.user;

      // Security: Only allow parents to access their own children or admins
      if (user?.roleId !== ROLES.PARENT && user?.roleId !== ROLES.ADMIN && user?.id !== parentId) {
        return res.status(403).json({ message: 'Unauthorized access to parent records' });
      }

      const children = await storage.getStudentsByParentId(parentId);
      res.json(children);
    } catch (error) {
      console.error('Error fetching parent children:', error);
      res.status(500).json({ message: 'Failed to fetch children records' });
    }
  });

  // Notification API endpoints
  app.get('/api/notifications', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const notifications = await storage.getNotificationsByUserId(user.id);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  app.get('/api/notifications/unread-count', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ message: 'Failed to fetch unread count' });
    }
  });

  app.put('/api/notifications/:id/read', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const notificationId = parseInt(req.params.id);

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Verify the notification belongs to the user
      const notifications = await storage.getNotificationsByUserId(user.id);
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }

      const updated = await storage.markNotificationAsRead(notificationId);
      res.json(updated);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to update notification' });
    }
  });

  app.put('/api/notifications/mark-all-read', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      await storage.markAllNotificationsAsRead(user.id);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to update notifications' });
    }
  });

  // Delete demo accounts - admin only
  app.post("/api/admin/delete-demo-accounts", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const demoEmails = ['admin@demo.com', 'teacher@demo.com', 'admin@treasure.com'];
      const deletedUsers = [];
      const errors = [];

      for (const email of demoEmails) {
        try {
          const user = await storage.getUserByEmail(email);
          if (user) {
            // Delete user (will cascade delete related records)
            await storage.deleteUser(user.id);
            deletedUsers.push(email);
            console.log(`✅ Deleted demo account: ${email}`);
          } else {
            console.log(`⚠️ Demo account not found: ${email}`);
          }
        } catch (error) {
          console.error(`❌ Failed to delete ${email}:`, error);
          errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        message: `Deleted ${deletedUsers.length} demo accounts`,
        deletedUsers,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error('Delete demo accounts error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Failed to delete demo accounts"
      });
    }
  });

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

  // Profile image upload endpoint
  app.post('/api/upload', authenticateUser, upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
      res.json({ url: fileUrl });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
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
      const { identifier, password } = loginSchema.parse(req.body);
      console.log('Login attempt for:', identifier || 'unknown');

      // Rate limiting to prevent brute force attacks
      const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
      const attemptKey = `${clientIp}:${identifier || 'no-identifier'}`;
      const now = Date.now();

      // Clean up old attempts
      for (const [key, data] of Array.from(loginAttempts.entries())) {
        if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
          loginAttempts.delete(key);
        }
      }

      // Check rate limit - Message 12: Account Temporarily Locked (show once, then suspension message)
      const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      if (attempts.count >= MAX_LOGIN_ATTEMPTS && (now - attempts.lastAttempt) < RATE_LIMIT_WINDOW) {
        console.warn(`Rate limit exceeded for ${attemptKey}`);

        // Track violation for account lockout with timestamp
        if (identifier) {
          // Clean up expired violations
          const violationData = lockoutViolations.get(identifier) || { count: 0, timestamps: [] };
          const recentViolations = violationData.timestamps.filter((ts: number) => now - ts < LOCKOUT_VIOLATION_WINDOW);

          // Add current violation
          recentViolations.push(now);
          lockoutViolations.set(identifier, { count: recentViolations.length, timestamps: recentViolations });

          // Suspend account after threshold violations within the window
          if (recentViolations.length >= MAX_RATE_LIMIT_VIOLATIONS) {
            try {
              // Find and suspend the user
              let userToSuspend;
              if (identifier.includes('@')) {
                userToSuspend = await storage.getUserByEmail(identifier);
              } else {
                userToSuspend = await storage.getUserByUsername(identifier);
              }

              if (userToSuspend && userToSuspend.status !== 'suspended') {
                await storage.updateUserStatus(userToSuspend.id, 'suspended', 'system', `Automatic suspension due to ${recentViolations.length} rate limit violations within 1 hour`);
                console.warn(`Account ${identifier} suspended after ${recentViolations.length} rate limit violations`);
                lockoutViolations.delete(identifier); // Clear violations after suspension

                // Get user role to provide appropriate message - SHOW DETAILED SUSPENSION MESSAGE
                const userRoleForSuspension = await storage.getRole(userToSuspend.roleId);
                const roleNameForSuspension = userRoleForSuspension?.name?.toLowerCase();
                const isStaffForSuspension = roleNameForSuspension === 'admin' || roleNameForSuspension === 'teacher';
                const isParentForSuspension = roleNameForSuspension === 'parent';

                if (isStaffForSuspension) {
                  return res.status(403).json({
                    message: "Account Suspended",
                    description: "Access denied. Your account has been suspended by the school administrator due to security concerns.",
                    statusType: "suspended_staff"
                  });
                } else if (isParentForSuspension) {
                  // Detailed message for suspended parent accounts
                  return res.status(403).json({
                    message: "Account Suspended - Security Alert",
                    description: "Your parent account has been automatically suspended due to multiple failed login attempts. This security measure protects your child's information from unauthorized access.\n\n📞 To Restore Your Account:\nContact School Administrator:\n📧 Email: treasurehomeschool@gmail.com\n📞 Call: School office during working hours\n\n💡 Have your child's information ready for verification.",
                    statusType: "suspended_parent"
                  });
                } else {
                  return res.status(403).json({
                    message: "Account Suspended",
                    description: "Your account has been suspended. Please contact your class teacher or the school administrator to resolve this issue.",
                    statusType: "suspended_student"
                  });
                }
              }
            } catch (err) {
              console.error('Failed to suspend account:', err);
            }
          }
        }

        // Show "temporarily locked" message ONLY on first rate limit hit (when violations < 3)
        const currentViolations = lockoutViolations.get(identifier);
        if (currentViolations && currentViolations.count < MAX_RATE_LIMIT_VIOLATIONS) {
          return res.status(429).json({
            message: "Account Temporarily Locked",
            description: "Too many failed login attempts. Your account has been temporarily locked for security reasons. Please wait 15 minutes before trying again, or use 'Forgot Password' to reset.",
            statusType: "rate_limited"
          });
        }

        // After suspension threshold reached, show nothing here - let the actual suspension check handle it
        // This allows the user to see their account is actually suspended with proper message
      }

      // Try to find user by username or email FIRST to check suspension
      let user;
      if (identifier.includes('@')) {
        // Looks like an email
        user = await storage.getUserByEmail(identifier);
      } else {
        // Try username first
        user = await storage.getUserByUsername(identifier);
        // Fallback to email if username not found
        if (!user) {
          user = await storage.getUserByEmail(identifier);
        }
      }

      if (!user) {
        // Increment attempt counter only after confirming user doesn't exist
        loginAttempts.set(attemptKey, {
          count: attempts.count + 1,
          lastAttempt: now
        });

        console.log(`Login failed: User not found for identifier ${identifier}`);
        return res.status(401).json({
          message: "Invalid username or password. Please check your credentials and try again.",
          hint: "Make sure CAPS LOCK is off and you're using the correct username and password."
        });
      }

      // Get user role for various checks
      const userRole = await storage.getRole(user.roleId);
      const roleName = userRole?.name?.toLowerCase();
      const isStaffAccount = roleName === 'admin' || roleName === 'teacher';

      // SECURITY CHECK: Block suspended accounts BEFORE incrementing attempts
      // This shows the detailed suspension message on all subsequent login attempts
      if (user.status === 'suspended') {
        console.warn(`Login blocked: Account ${identifier} is suspended (showing detailed message)`);

        if (isStaffAccount) {
          // Message 9: Staff Account Suspended
          return res.status(403).json({
            message: "Account Suspended",
            description: "Access denied. Your account has been suspended by the school administrator due to security concerns. Please contact the school administrator to resolve this issue.",
            statusType: "suspended_staff"
          });
        } else if (roleName === 'parent') {
          // Detailed message for suspended parent accounts - shown on every attempt after suspension
          return res.status(403).json({
            message: "Account Suspended - Security Alert",
            description: "Your parent account has been automatically suspended due to multiple failed login attempts. This security measure protects your child's information from unauthorized access.\n\n📞 To Restore Your Account:\nContact School Administrator:\n📧 Email: treasurehomeschool@gmail.com\n📞 Call: School office during working hours\n\n💡 Have your child's information ready for verification.",
            statusType: "suspended_parent"
          });
        } else {
          // Message 10: Student Account Suspended
          return res.status(403).json({
            message: "Account Suspended",
            description: "Your account has been suspended. Please contact your class teacher or the school administrator to resolve this issue.",
            statusType: "suspended_student"
          });
        }
      }

      // Now increment attempt counter for valid users who aren't suspended
      loginAttempts.set(attemptKey, {
        count: attempts.count + 1,
        lastAttempt: now
      });

      // SECURITY CHECK: Block pending accounts - Message 4 & 5
      if (user.status === 'pending') {
        console.warn(`Login blocked: Account ${identifier} is pending approval`);

        if (isStaffAccount) {
          // Message 4: Admin/Teacher Pending Approval
          return res.status(403).json({
            message: "Account Pending Approval",
            description: "Your Admin/Teacher account has been created and is awaiting approval by the school administrator. You will be notified via email once your account is verified. For urgent access needs, please contact the school administrator.",
            statusType: "pending_staff"
          });
        } else {
          // Message 5: Student/Parent Pending Setup
          return res.status(403).json({
            message: "Account Pending Setup",
            description: "Your account is being set up by the school administrator. You will receive a notification once your account is ready. Please check back soon.",
            statusType: "pending_setup"
          });
        }
      }

      // SECURITY CHECK: Block disabled accounts - Message 11
      if (user.status === 'disabled') {
        console.warn(`Login blocked: Account ${identifier} is disabled`);
        return res.status(403).json({
          message: "Account Disabled",
          description: "Your account has been disabled and is no longer active. Please contact the school administrator if you believe this is an error.",
          statusType: "disabled"
        });
      }

      // STRICT ENFORCEMENT: Admin/Teacher with Google OAuth CANNOT use password login - Message 8
      if ((roleName === 'admin' || roleName === 'teacher') && user.authProvider === 'google') {
        console.log(`Login blocked: Admin/Teacher ${identifier} trying to use password login instead of Google OAuth`);
        return res.status(401).json({
          message: "Google Sign-In Required",
          description: "Admins and Teachers must sign in using their authorized Google account. Please click the 'Sign in with Google' button below to access your account.",
          statusType: "google_required"
        });
      }

      // CRITICAL: Verify password hash with bcrypt
      if (!user.passwordHash) {
        // If user is admin/teacher without password but with Google, direct them to Google login
        if ((roleName === 'admin' || roleName === 'teacher') && user.authProvider === 'google') {
          return res.status(401).json({
            message: "Google Sign-In Required",
            description: "Please use Google Sign-In for admin/teacher accounts.",
            statusType: "google_required"
          });
        }
        console.error(`SECURITY WARNING: User ${identifier} has no password hash set`);
        return res.status(401).json({
          message: "Account Setup Incomplete",
          description: "Your account setup is incomplete. Please contact the school administrator for assistance.",
          statusType: "setup_incomplete"
        });
      }

      // Compare provided password with stored hash - Message 1 (Invalid Credentials)
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log(`Login failed: Invalid password for identifier ${identifier}`);
        return res.status(401).json({
          message: "Invalid Credentials",
          description: "Invalid username or password. Please check your credentials and try again. Make sure CAPS LOCK is off and you're using the correct username and password.",
          statusType: "invalid_credentials"
        });
      }

      // Password verification successful - reset rate limit and clear lockout violations
      loginAttempts.delete(attemptKey);
      if (identifier) {
        lockoutViolations.delete(identifier);
      }

      // Generate JWT token with user claims - ensure UUID is string
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });

      console.log(`Login successful for ${identifier} with roleId: ${user.roleId}`);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
          mustChangePassword: user.mustChangePassword || false
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid identifier or password format" });
      }
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });

  // Password change endpoint
  app.post("/api/auth/change-password", authenticateUser, async (req, res) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.user!.id;

      // Get user from database
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update password and clear mustChangePassword flag
      await storage.updateUser(userId, {
        passwordHash: newPasswordHash,
        mustChangePassword: false
      });

      console.log(`Password changed successfully for user ${userId}`);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error('Password change error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password format" });
      }
      res.status(500).json({ message: "Password change failed. Please try again." });
    }
  });

  // Forgot password - Request reset token (ENHANCED WITH RATE LIMITING & EMAIL)
  app.post("/api/auth/forgot-password", async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      const { identifier } = z.object({ identifier: z.string().min(1) }).parse(req.body);

      // RATE LIMITING: Check recent reset attempts (max 3 per hour per identifier)
      const recentAttempts = await storage.getRecentPasswordResetAttempts(identifier, 60);

      if (recentAttempts.length >= 3) {
        log(`🚨 Rate limit exceeded for password reset: ${identifier} from IP ${ipAddress}`);

        // Track failed attempt
        await storage.createPasswordResetAttempt(identifier, ipAddress, false);

        // Check for suspicious activity (5+ attempts in 60 min = lock account temporarily)
        const suspiciousAttempts = await storage.getRecentPasswordResetAttempts(identifier, 60);
        if (suspiciousAttempts.length >= 5) {
          const user = await storage.getUserByEmail(identifier) || await storage.getUserByUsername(identifier);
          if (user) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
            await storage.lockAccount(user.id, lockUntil);
            log(`🔒 Account temporarily locked due to suspicious password reset activity: ${user.id}`);

            // Create audit log
            await storage.createAuditLog({
              userId: user.id,
              action: 'account_locked_suspicious_activity',
              entityType: 'user',
              entityId: 0,
              oldValue: null,
              newValue: JSON.stringify({ reason: 'Excessive password reset attempts', lockUntil }),
              reason: 'Suspicious password reset activity detected',
              ipAddress,
              userAgent: req.headers['user-agent'] || null,
            });
          }
        }

        return res.status(429).json({
          message: "Too many password reset attempts. Please try again later."
        });
      }

      // Find user by email or username
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }

      // Track attempt
      await storage.createPasswordResetAttempt(identifier, ipAddress, !!user);

      // Don't reveal if user exists or not (security best practice)
      if (!user) {
        return res.json({
          message: "If an account exists with that email/username, a password reset link will be sent."
        });
      }

      // Check if account is locked
      const isLocked = await storage.isAccountLocked(user.id);
      if (isLocked) {
        return res.status(423).json({
          message: "Your account is temporarily locked. Please contact the administrator or try again later."
        });
      }

      // Generate secure random token
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Token expires in 15 minutes
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Save token to database with IP tracking
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt, ipAddress);

      // Get recovery email (fallback to primary email if not set)
      const recoveryEmail = user.recoveryEmail || user.email;

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: 'password_reset_requested',
        entityType: 'user',
        entityId: 0,
        oldValue: null,
        newValue: JSON.stringify({ requestedAt: new Date(), ipAddress }),
        reason: 'User requested password reset',
        ipAddress,
        userAgent: req.headers['user-agent'] || null,
      });

      // Send email with reset link
      const resetLink = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/reset-password?token=${resetToken}`;

      // Import email service
      const { sendEmail, getPasswordResetEmailHTML } = await import('./email-service');

      // Send email with HTML template
      const emailSent = await sendEmail({
        to: recoveryEmail,
        subject: 'THS Portal - Password Reset Request',
        html: getPasswordResetEmailHTML(`${user.firstName} ${user.lastName}`, resetLink)
      });

      if (!emailSent && process.env.NODE_ENV === 'production') {
        log(`❌ Failed to send password reset email to ${recoveryEmail}`);
        return res.status(500).json({
          message: "Failed to send password reset email. Please try again later or contact administrator."
        });
      }

      // In development without API key, show the reset code/token for testing
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        log(`📧 DEV MODE - Password Reset Token: ${resetToken}`);
        log(`📧 DEV MODE - Reset Link: ${resetLink}`);

        return res.json({
          message: "Password reset code generated (Development Mode).",
          developmentMode: true,
          resetToken: resetToken, // The actual code
          resetLink: resetLink,
          email: recoveryEmail,
          expiresIn: "15 minutes",
          instructions: "Use the resetToken as your reset code, or click the resetLink"
        });
      }

      log(`✅ Password reset email sent to ${recoveryEmail} for user ${user.id}`);

      res.json({
        message: "If an account exists with that email/username, a password reset link will be sent."
      });
    } catch (error) {
      console.error('Forgot password error:', error);

      // Track failed attempt
      try {
        const { identifier } = req.body;
        if (identifier) {
          await storage.createPasswordResetAttempt(identifier, ipAddress, false);
        }
      } catch (trackError) {
        console.error('Failed to track attempt:', trackError);
      }

      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token (ENHANCED WITH NOTIFICATIONS & AUDIT)
  app.post("/api/auth/reset-password", async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      const { token, newPassword } = z.object({
        token: z.string().min(1),
        newPassword: z.string().min(8).max(100)
          .refine(pwd => /[A-Z]/.test(pwd), "Must contain at least one uppercase letter")
          .refine(pwd => /[a-z]/.test(pwd), "Must contain at least one lowercase letter")
          .refine(pwd => /[0-9]/.test(pwd), "Must contain at least one number")
          .refine(pwd => /[!@#$%^&*]/.test(pwd), "Must contain at least one special character (!@#$%^&*)")
      }).parse(req.body);

      // Verify token exists and is valid
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get user details for notification
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update user password
      await storage.updateUser(resetToken.userId, {
        passwordHash: newPasswordHash,
        mustChangePassword: false
      });

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(token);

      // Create audit log
      await storage.createAuditLog({
        userId: resetToken.userId,
        action: 'password_reset_completed',
        entityType: 'user',
        entityId: 0,
        oldValue: null,
        newValue: JSON.stringify({ completedAt: new Date(), ipAddress }),
        reason: 'Password was successfully reset via reset token',
        ipAddress,
        userAgent: req.headers['user-agent'] || null,
      });

      // Send notification email to user
      const recoveryEmail = user.recoveryEmail || user.email;
      const { sendEmail, getPasswordChangedEmailHTML } = await import('./email-service');

      await sendEmail({
        to: recoveryEmail,
        subject: 'THS Portal - Password Changed',
        html: getPasswordChangedEmailHTML(`${user.firstName} ${user.lastName}`, ipAddress)
      });

      log(`✅ Password reset successfully for user ${resetToken.userId} from IP ${ipAddress}`);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error('Reset password error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
        });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ============================================================
  // ADMIN RECOVERY POWERS ENDPOINTS
  // ============================================================

  // Admin reset user password (ENHANCED WITH AUDIT & NOTIFICATION)
  app.post("/api/admin/reset-user-password", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

    try {
      const { userId, newPassword, forceChange } = z.object({
        userId: z.string().uuid(),
        newPassword: z.string().min(6, "Password must be at least 6 characters").optional(),
        forceChange: z.boolean().optional().default(true)
      }).parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Generate new password if not provided
      const { generatePassword } = await import('./auth-utils');
      const currentYear = new Date().getFullYear().toString();
      const password = newPassword || generatePassword(currentYear);

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Use the enhanced admin reset method with audit logging
      await storage.adminResetUserPassword(userId, passwordHash, req.user!.id, forceChange);

      // Send notification to user
      const recoveryEmail = user.recoveryEmail || user.email;
      const notificationSubject = 'THS Portal - Password Reset by Administrator';
      const notificationBody = `
Hello ${user.firstName} ${user.lastName},

Your password was reset by an administrator on THS Portal.

Details:
- Reset at: ${new Date().toLocaleString()}
- Reset by: Admin (${req.user?.email})
- Temporary Password: ${password}
${forceChange ? '- You will be required to change this password at next login' : ''}

Please login and ${forceChange ? 'change your password immediately' : 'update your password for security'}.

If you did not request this password reset, please contact the school administration immediately.

Thank you,
Treasure-Home School Administration
`;

      // In development, log the notification
      if (process.env.NODE_ENV === 'development') {
        console.log(`\n📧 ADMIN PASSWORD RESET NOTIFICATION:`);
        console.log(`To: ${recoveryEmail}`);
        console.log(`Subject: ${notificationSubject}`);
        console.log(`Body:\n${notificationBody}\n`);
      }

      // TODO: In production, send actual email
      // await sendEmail({ to: recoveryEmail, subject: notificationSubject, text: notificationBody });

      log(`✅ Admin ${req.user?.email} reset password for user ${userId}`);

      res.json({
        message: "Password reset successfully",
        tempPassword: password,
        username: user.username || user.email,
        email: recoveryEmail
      });
    } catch (error) {
      console.error('Admin password reset error:', error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Admin update recovery email
  app.post("/api/admin/update-recovery-email", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId, recoveryEmail } = z.object({
        userId: z.string().uuid(),
        recoveryEmail: z.string().email()
      }).parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update recovery email with audit logging
      const success = await storage.updateRecoveryEmail(userId, recoveryEmail, req.user!.id);

      if (!success) {
        return res.status(500).json({ message: "Failed to update recovery email" });
      }

      console.log(`✅ Admin ${req.user?.email} updated recovery email for user ${userId} to ${recoveryEmail}`);

      res.json({
        message: "Recovery email updated successfully",
        oldEmail: user.recoveryEmail || user.email,
        newEmail: recoveryEmail
      });
    } catch (error) {
      console.error('Update recovery email error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      res.status(500).json({ message: "Failed to update recovery email" });
    }
  });

  // User update own recovery email endpoint
  app.post("/api/users/:id/recovery-email", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { recoveryEmail } = z.object({
        recoveryEmail: z.string().email()
      }).parse(req.body);
      const userId = req.user!.id;

      // Only allow users to update their own recovery email or admins to update any
      if (id !== userId && req.user!.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: "You can only update your own recovery email" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the user with new recovery email
      const updatedUser = await storage.updateUser(id, {
        recoveryEmail
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update recovery email" });
      }

      // Log audit event
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'recovery_email_updated',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, recoveryEmail: user.recoveryEmail }),
        newValue: JSON.stringify({ userId: user.id, recoveryEmail }),
        reason: `User ${req.user!.email} updated recovery email`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      console.log(`✅ User ${req.user?.email} updated recovery email for account ${id}`);

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "Recovery email updated successfully",
        user: safeUser
      });
    } catch (error) {
      console.error('Error updating recovery email:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update recovery email" });
    }
  });

  // Admin unlock account
  app.post("/api/admin/unlock-account", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId } = z.object({
        userId: z.string().uuid()
      }).parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Unlock the account
      const success = await storage.unlockAccount(userId);

      if (!success) {
        return res.status(500).json({ message: "Failed to unlock account" });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'account_unlocked',
        entityType: 'user',
        entityId: 0,
        oldValue: JSON.stringify({ accountLockedUntil: user.accountLockedUntil }),
        newValue: JSON.stringify({ accountLockedUntil: null }),
        reason: 'Account manually unlocked by admin',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || null,
      });

      log(`✅ Admin ${req.user?.email} unlocked account for user ${userId}`);

      res.json({
        message: "Account unlocked successfully",
        username: user.username || user.email
      });
    } catch (error) {
      console.error('Unlock account error:', error);
      res.status(500).json({ message: "Failed to unlock account" });
    }
  });

  // ============================================================
  // ACCOUNT LOCKOUT MANAGEMENT ENDPOINTS
  // ============================================================

  // Get all suspended accounts (Admin only)
  app.get("/api/admin/suspended-accounts", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const suspendedUsers = await storage.getUsersByStatus('suspended');

      // Remove sensitive data
      const sanitizedUsers = suspendedUsers.map(user => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });

      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Failed to fetch suspended accounts:', error);
      res.status(500).json({ message: "Failed to fetch suspended accounts" });
    }
  });

  // Unlock/unsuspend account (Admin only)
  app.post("/api/admin/unlock-account/:userId", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.status !== 'suspended') {
        return res.status(400).json({ message: "Account is not suspended" });
      }

      // Unlock account by changing status to active
      const updatedUser = await storage.updateUserStatus(
        userId,
        'active',
        req.user!.id,
        reason || `Account unlocked by admin ${req.user!.email}`
      );

      // Clear any lockout violations for this user
      if (user.email) lockoutViolations.delete(user.email);
      if (user.username) lockoutViolations.delete(user.username);

      console.log(`Admin ${req.user!.email} unlocked account ${user.email || user.username}`);

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "Account unlocked successfully",
        user: safeUser
      });
    } catch (error) {
      console.error('Failed to unlock account:', error);
      res.status(500).json({ message: "Failed to unlock account" });
    }
  });

  // ============================================================
  // INVITE SYSTEM ENDPOINTS
  // ============================================================

  // Create invite (Admin only)
  app.post("/api/invites", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { email, roleId } = z.object({
        email: z.string().email(),
        roleId: z.number()
      }).parse(req.body);

      // Validate role exists and is either Admin or Teacher
      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(400).json({ message: "Invalid role" });
      }

      if (roleId !== ROLES.ADMIN && roleId !== ROLES.TEACHER) {
        return res.status(400).json({ message: "Invites can only be sent for Admin or Teacher roles" });
      }

      // Check if user already exists with this email
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Check for pending invite
      const existingInvite = await storage.getPendingInviteByEmail(email);
      if (existingInvite) {
        return res.status(400).json({ message: "Pending invite already exists for this email" });
      }

      // Generate secure token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');

      // Set expiry to 7 days from now
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create invite
      const invite = await storage.createInvite({
        email,
        roleId,
        token,
        createdBy: req.user!.id,
        expiresAt
      });

      // In production, send email with invite link
      // For development, return the token
      const inviteLink = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/invite/${token}`;

      if (process.env.NODE_ENV === 'development') {
        console.log(`Invite created for ${email}: ${inviteLink}`);
        return res.json({
          message: "Invite created successfully",
          invite: {
            id: invite.id,
            email: invite.email,
            roleId: invite.roleId,
            token: invite.token,
            inviteLink,
            expiresAt: invite.expiresAt
          },
          developmentOnly: true
        });
      }

      res.json({
        message: "Invite sent successfully",
        invite: {
          id: invite.id,
          email: invite.email,
          roleId: invite.roleId,
          expiresAt: invite.expiresAt
        }
      });
    } catch (error) {
      console.error('Create invite error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      res.status(500).json({ message: "Failed to create invite" });
    }
  });

  // List all invites (Admin only)
  app.get("/api/invites", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites = await storage.getAllInvites();
      res.json(invites);
    } catch (error) {
      console.error('List invites error:', error);
      res.status(500).json({ message: "Failed to list invites" });
    }
  });

  // List pending invites (Admin only)
  app.get("/api/invites/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites = await storage.getPendingInvites();
      res.json(invites);
    } catch (error) {
      console.error('List pending invites error:', error);
      res.status(500).json({ message: "Failed to list pending invites" });
    }
  });

  // Get invite by token (public - for verification)
  app.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(404).json({ message: "Invalid or expired invite" });
      }

      // Return invite info without sensitive data
      res.json({
        email: invite.email,
        roleId: invite.roleId,
        expiresAt: invite.expiresAt
      });
    } catch (error) {
      console.error('Get invite error:', error);
      res.status(500).json({ message: "Failed to get invite" });
    }
  });

  // Accept invite (public)
  app.post("/api/invites/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        password: z.string().min(6).max(100)
      }).parse(req.body);

      // Verify invite exists and is valid
      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(400).json({ message: "Invalid or expired invite" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(invite.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Generate THS username for the new staff member
      const { generateUsername } = await import('./auth-utils');
      const currentYear = new Date().getFullYear().toString();
      const existingUsernames = await storage.getAllUsernames();
      const { getNextUserNumber } = await import('./auth-utils');
      const nextNumber = getNextUserNumber(existingUsernames, invite.roleId, currentYear);
      const username = generateUsername(invite.roleId, currentYear, '', nextNumber);

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Create user account
      const user = await storage.createUser({
        email: invite.email,
        username,
        firstName,
        lastName,
        roleId: invite.roleId,
        passwordHash,
        authProvider: 'local',
        status: 'active',
        createdVia: 'invite',
        mustChangePassword: false
      });

      // Mark invite as accepted
      await storage.markInviteAsAccepted(invite.id, user.id);

      // Generate JWT token
      const token_jwt = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        SECRET_KEY,
        { expiresIn: '24h' }
      );

      console.log(`Invite accepted by ${user.email} (${username})`);

      res.json({
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId
        },
        token: token_jwt
      });
    } catch (error) {
      console.error('Accept invite error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });

  // Cancel/Delete invite (Admin only)
  app.delete("/api/invites/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const inviteId = parseInt(req.params.id);

      const deleted = await storage.deleteInvite(inviteId);
      if (!deleted) {
        return res.status(404).json({ message: "Invite not found" });
      }

      res.json({ message: "Invite deleted successfully" });
    } catch (error) {
      console.error('Delete invite error:', error);
      res.status(500).json({ message: "Failed to delete invite" });
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

  // User management - Admin only - OPTIMIZED for speed
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
        // PERFORMANCE: Get all users in parallel instead of sequential
        const allRoles = await storage.getRoles();
        const userPromises = allRoles.map(userRole => storage.getUsersByRole(userRole.id));
        const userArrays = await Promise.all(userPromises);
        users = userArrays.flat();
      }

      // PERFORMANCE: Fetch roles once for enrichment
      const allRoles = await storage.getRoles();
      const roleMap = new Map(allRoles.map(r => [r.id, r.name]));

      // Remove sensitive data and add role names
      const sanitizedUsers = users.map(user => {
        const { passwordHash, ...safeUser } = user;
        return {
          ...safeUser,
          roleName: roleMap.get(user.roleId) || 'Unknown'
        };
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get pending users (for admin approval) - OPTIMIZED with batch role lookup
  app.get("/api/users/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const pendingUsers = await storage.getUsersByStatus('pending');

      // PERFORMANCE: Fetch all roles once instead of per-user
      const allRoles = await storage.getRoles();
      const roleMap = new Map(allRoles.map(r => [r.id, r.name]));

      // Remove sensitive data and enrich with role information
      const enrichedUsers = pendingUsers.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return {
          ...safeUser,
          roleName: roleMap.get(user.roleId) || 'Unknown'
        };
      });

      res.json(enrichedUsers);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });

  // Approve a pending user
  app.post("/api/users/:id/approve", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists and is pending
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.status !== 'pending') {
        return res.status(400).json({ message: `Cannot approve user with status: ${user.status}` });
      }

      // Approve the user
      const approvedUser = await storage.approveUser(id, adminUser.id);

      // PERFORMANCE: Log audit event asynchronously (non-blocking for instant response)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_approved',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: 'pending' }),
        newValue: JSON.stringify({ userId: user.id, status: 'active' }),
        reason: `Admin ${adminUser.email} approved user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      // Remove sensitive data
      const { passwordHash, ...safeUser } = approvedUser;

      res.json({
        message: "User approved successfully",
        user: safeUser
      });
    } catch (error) {
      console.error('Error approving user:', error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });

  // Verify user (Admin only) - Activates user account
  app.post("/api/users/:id/verify", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = user.status;

      // Update the user status to active
      const updatedUser = await storage.updateUserStatus(id, 'active', adminUser.id, 'User verified by admin');

      // PERFORMANCE: Log audit event asynchronously
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_verified',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'active' }),
        reason: `Admin ${adminUser.email} verified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User verified and activated successfully",
        user: safeUser
      });
    } catch (error) {
      console.error('Error verifying user:', error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });

  // Unverify user (Admin only) - Moves user back to pending status
  app.post("/api/users/:id/unverify", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = user.status;

      // Update the user status to pending
      const updatedUser = await storage.updateUserStatus(id, 'pending', adminUser.id, 'User unverified by admin - awaiting approval');

      // PERFORMANCE: Log audit event asynchronously
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_unverified',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'pending' }),
        reason: `Admin ${adminUser.email} unverified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User unverified and moved to pending status",
        user: safeUser
      });
    } catch (error) {
      console.error('Error unverifying user:', error);
      res.status(500).json({ message: "Failed to unverify user" });
    }
  });

  // Suspend user (Admin only) - Temporarily blocks access
  app.post("/api/users/:id/suspend", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = user.status;

      // Update the user status to suspended
      const updatedUser = await storage.updateUserStatus(id, 'suspended', adminUser.id, reason || 'Account suspended by admin');

      // PERFORMANCE: Log audit event asynchronously (non-blocking for instant response)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_suspended',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'suspended' }),
        reason: reason || `Admin ${adminUser.email} suspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User suspended successfully",
        user: safeUser
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });

  // Unsuspend user (Admin only) - Restores access
  app.post("/api/users/:id/unsuspend", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = user.status;

      // Update the user status to active
      const updatedUser = await storage.updateUserStatus(id, 'active', adminUser.id, 'Suspension lifted by admin');

      // PERFORMANCE: Log audit event asynchronously
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_unsuspended',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'active' }),
        reason: `Admin ${adminUser.email} unsuspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User unsuspended successfully",
        user: safeUser
      });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      res.status(500).json({ message: "Failed to unsuspend user" });
    }
  });

  // Update user status (reject, suspend, disable)
  app.post("/api/users/:id/status", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Validate status
      const validStatuses = ['pending', 'active', 'suspended', 'disabled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const oldStatus = user.status;

      // Update the user status
      const updatedUser = await storage.updateUserStatus(id, status, adminUser.id, reason);

      // PERFORMANCE: Log audit event asynchronously (non-blocking for instant response)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_status_changed',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status }),
        reason: reason || `Admin ${adminUser.email} changed status of user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: `User status updated to ${status}`,
        user: safeUser
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Delete user (permanent removal - Admin only) - ENHANCED with retry logic and comprehensive error handling
  app.delete("/api/users/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    const startTime = Date.now();

    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log(`🗑️ DELETE REQUEST: Admin ${adminUser.email} attempting to delete user ${id}`);

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`❌ DELETE FAILED: User ${id} not found`);
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent deleting your own account
      if (user.id === adminUser.id) {
        console.warn(`❌ DELETE BLOCKED: Admin attempted to delete own account`);
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      console.log(`📋 DELETING USER: ${user.email || user.username} (ID: ${id}, Role: ${user.roleId})`);

      // RETRY LOGIC: Attempt delete with retries for transient errors
      let deleted = false;
      let lastError = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔄 DELETE ATTEMPT ${attempt}/${maxRetries} for user ${id}`);
          deleted = await storage.deleteUser(id);

          if (deleted) {
            console.log(`✅ DELETE SUCCESS on attempt ${attempt}: User ${id} deleted in ${Date.now() - startTime}ms`);
            break;
          } else {
            console.warn(`⚠️ DELETE RETURNED FALSE on attempt ${attempt}: User ${id}`);
          }
        } catch (deleteError: any) {
          lastError = deleteError;
          console.error(`❌ DELETE ERROR on attempt ${attempt}:`, deleteError);

          // Check for Supabase RLS or permission errors
          if (deleteError?.code === '42501' || deleteError?.message?.includes('permission denied')) {
            console.error(`🚫 RLS/PERMISSION ERROR: Supabase Row Level Security may be blocking delete for user ${id}`);
            return res.status(403).json({
              message: "Database permission error: Cannot delete user due to Row Level Security policies. Please check Supabase RLS settings or use 'Disable Account' instead.",
              technicalDetails: "RLS_PERMISSION_DENIED"
            });
          }

          // If it's not a transient error, break the retry loop
          if (deleteError?.code !== 'ECONNRESET' && !deleteError?.message?.includes('timeout')) {
            break;
          }

          // Wait before retry (TRUE exponential backoff: 100ms, 200ms, 400ms)
          if (attempt < maxRetries) {
            const backoffMs = 100 * Math.pow(2, attempt - 1);
            console.log(`⏱️ RETRY BACKOFF: Waiting ${backoffMs}ms before attempt ${attempt + 1}`);
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }

      if (!deleted) {
        const errorMsg = lastError?.message || "Unknown error";
        console.error(`❌ DELETE FAILED AFTER ${maxRetries} ATTEMPTS: ${errorMsg}`);

        // Provide specific error messages
        if (lastError?.cause?.code === '23503' || errorMsg.includes('foreign key')) {
          const relatedTable = lastError?.cause?.table_name || 'related records';
          return res.status(409).json({
            message: `Cannot delete user: This user has associated ${relatedTable}. Please disable the account instead.`,
            technicalDetails: "FOREIGN_KEY_CONSTRAINT"
          });
        }

        return res.status(500).json({
          message: "Failed to delete user after multiple attempts",
          technicalDetails: errorMsg
        });
      }

      // Verify deletion was successful
      const verifyUser = await storage.getUser(id);
      if (verifyUser) {
        console.error(`🚨 CRITICAL: User ${id} still exists after delete operation! Possible RLS issue.`);
        return res.status(500).json({
          message: "Delete operation completed but user still exists. This may be a database policy issue.",
          technicalDetails: "DELETE_VERIFICATION_FAILED"
        });
      }

      console.log(`✅ DELETE VERIFIED: User ${id} successfully removed from database`);

      // PERFORMANCE: Log audit event asynchronously (non-blocking for instant response)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_deleted',
        entityType: 'user',
        entityId: BigInt(0),
        oldValue: JSON.stringify({
          userId: user.id,
          email: user.email,
          username: user.username,
          roleId: user.roleId
        }),
        newValue: null,
        reason: `Admin ${adminUser.email} permanently deleted user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Audit log failed (non-critical):', err));

      const totalTime = Date.now() - startTime;
      console.log(`⚡ DELETE COMPLETED in ${totalTime}ms`);

      res.json({
        message: "User deleted successfully",
        deletedUserId: id,
        executionTime: `${totalTime}ms`
      });
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error(`💥 UNEXPECTED DELETE ERROR after ${totalTime}ms:`, error);
      console.error('Error stack:', error.stack);

      res.status(500).json({
        message: "An unexpected error occurred while deleting user",
        technicalDetails: error.message
      });
    }
  });

  // Reset user password (Admin only)
  app.post("/api/users/:id/reset-password", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword, forceChange } = z.object({
        newPassword: z.string().min(6, "Password must be at least 6 characters"),
        forceChange: z.boolean().optional().default(true)
      }).parse(req.body);
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

      // Update user with new password and force change flag
      const updatedUser = await storage.updateUser(id, {
        passwordHash,
        mustChangePassword: forceChange
      });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }

      // Log audit event
      await storage.createAuditLog({
        userId: adminUser.id,
        action: 'password_reset',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, mustChangePassword: user.mustChangePassword }),
        newValue: JSON.stringify({ userId: user.id, mustChangePassword: forceChange }),
        reason: `Admin ${adminUser.email} reset password for user ${user.email || user.username}${forceChange ? ' (force change on next login)' : ''}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash: _, ...safeUser } = updatedUser;

      res.json({
        message: `Password reset successfully${forceChange ? '. User must change password on next login.' : ''}`,
        user: safeUser
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Change user role (Admin only)
  app.post("/api/users/:id/role", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { roleId } = z.object({
        roleId: z.number().int().positive()
      }).parse(req.body);
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Validate role exists
      const newRole = await storage.getRole(roleId);
      if (!newRole) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Prevent changing your own role
      if (user.id === adminUser.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const oldRole = await storage.getRole(user.roleId);

      // Update user role
      const updatedUser = await storage.updateUser(id, { roleId });

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }

      // Log audit event
      await storage.createAuditLog({
        userId: adminUser.id,
        action: 'role_changed',
        entityType: 'user',
        entityId: BigInt(0), // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, roleId: user.roleId, roleName: oldRole?.name }),
        newValue: JSON.stringify({ userId: user.id, roleId: roleId, roleName: newRole.name }),
        reason: `Admin ${adminUser.email} changed role of user ${user.email || user.username} from ${oldRole?.name} to ${newRole.name}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: `User role updated to ${newRole.name}`,
        user: safeUser
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to change user role" });
    }
  });

  // Get audit logs (Admin only)
  app.get("/api/audit-logs", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { limit, offset, action, entityType } = z.object({
        limit: z.coerce.number().int().positive().max(1000).optional().default(100),
        offset: z.coerce.number().int().nonnegative().optional().default(0),
        action: z.string().optional(),
        entityType: z.string().optional()
      }).parse(req.query);

      const logs = await storage.getAuditLogs({
        limit,
        offset,
        action,
        entityType
      });

      // Enrich logs with user information
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const user = await storage.getUser(log.userId);
        return {
          ...log,
          userEmail: user?.email,
          userName: `${user?.firstName} ${user?.lastName}`
        };
      }));

      res.json(enrichedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to fetch audit logs" });
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

  app.put("/api/users/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const requestUser = req.user!;

      // Authorization: Users can update their own profile, admins can update any
      if (requestUser.id !== id && requestUser.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

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
      console.error('User update error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid user data",
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // CSV Upload for bulk user provisioning
  app.post("/api/admin/upload-users-csv", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single('csvFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required" });
      }

      // Read and parse CSV file
      const csvContent = await fs.readFile(req.file.path, 'utf-8');
      const lines = csvContent.trim().split('\n');

      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must contain header and at least one row" });
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      // Expected columns: studentName, class, parentName, parentEmail
      const requiredColumns = ['studentname', 'class', 'parentname', 'parentemail'];
      const hasRequiredColumns = requiredColumns.every(col => headers.includes(col));

      if (!hasRequiredColumns) {
        return res.status(400).json({
          message: "CSV must contain columns: studentName, class, parentName, parentEmail"
        });
      }

      const currentYear = new Date().getFullYear().toString();
      const { generateUsername, generatePassword } = await import('./auth-utils');

      // Get all existing usernames to ensure uniqueness
      const existingUsernames = await storage.getAllUsernames();
      const createdUsers: any[] = [];
      const errors: string[] = [];

      // Get roles
      const studentRoleData = await storage.getRoleByName('Student');
      const parentRoleData = await storage.getRoleByName('Parent');

      if (!studentRoleData || !parentRoleData) {
        return res.status(500).json({ message: "Required roles (Student, Parent) not found in database" });
      }

      // Parse each row
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        try {
          // Extract data
          const studentName = row['studentname'];
          const className = row['class'];
          const rollNo = row['rollno'] || String(i);
          const parentName = row['parentname'];
          const parentEmail = row['parentemail'];

          if (!studentName || !className || !parentName || !parentEmail) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            continue;
          }

          // Split student name
          const [studentFirstName, ...studentLastParts] = studentName.split(' ');
          const studentLastName = studentLastParts.join(' ') || studentFirstName;

          // Split parent name
          const [parentFirstName, ...parentLastParts] = parentName.split(' ');
          const parentLastName = parentLastParts.join(' ') || parentFirstName;

          // Check if parent already exists
          let parent = await storage.getUserByEmail(parentEmail);
          let parentId: string;
          let parentCredentials = null;

          if (!parent) {
            // Create parent account - calculate correct sequence number
            const parentCount = existingUsernames.filter(u => u.startsWith(`THS-PAR-${currentYear}-`)).length + 1;
            const parentUsername = generateUsername(parentRoleData.id, currentYear, '', parentCount);
            const parentPassword = generatePassword(currentYear);
            const parentPasswordHash = await bcrypt.hash(parentPassword, BCRYPT_ROUNDS);

            parent = await storage.createUser({
              username: parentUsername,
              email: parentEmail,
              passwordHash: parentPasswordHash,
              roleId: parentRoleData.id,
              firstName: parentFirstName,
              lastName: parentLastName,
              mustChangePassword: true
            });

            // CRITICAL: Track newly created username to prevent duplicates in same batch
            existingUsernames.push(parentUsername);
            parentCredentials = { username: parentUsername, password: parentPassword };
            parentId = parent.id;
          } else {
            parentId = parent.id;
          }

          // Get class
          const classObj = await storage.getClasses(); // Assuming this fetches classes
          const studentClass = classObj.find(c => c.name.toLowerCase() === className.toLowerCase());

          if (!studentClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }

          // Create student account - calculate correct sequence number
          const classPrefix = `THS-STU-${currentYear}-${className.toUpperCase()}-`;
          const studentCount = existingUsernames.filter(u => u.startsWith(classPrefix)).length + 1;
          const studentUsername = generateUsername(studentRoleData.id, currentYear, className.toUpperCase(), studentCount);
          const studentPassword = generatePassword(currentYear);
          const studentPasswordHash = await bcrypt.hash(studentPassword, BCRYPT_ROUNDS);

          const studentUser = await storage.createUser({
            username: studentUsername,
            email: `${studentUsername.toLowerCase()}@ths.edu`, // Auto-generated email
            passwordHash: studentPasswordHash,
            firstName: studentFirstName,
            lastName: studentLastName,
            mustChangePassword: true
          });

          // CRITICAL: Track newly created username to prevent duplicates in same batch
          existingUsernames.push(studentUsername);

          // Create student record
          const admissionNumber = studentUsername;
          await storage.createStudent({
            id: studentUser.id,
            admissionNumber,
            classId: studentClass.id,
            parentId: parentId
          });

          createdUsers.push({
            type: 'student',
            name: studentName,
            username: studentUsername,
            password: studentPassword,
            class: className,
            parent: {
              name: parentName,
              email: parentEmail,
              credentials: parentCredentials
            }
          });

        } catch (error) {
          console.error(`Error processing row ${i + 1}:`, error);
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json({
        message: `Successfully created ${createdUsers.length} users`,
        users: createdUsers,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });

  // Generate printable login slips (PDF)
  app.post("/api/users/generate-login-slips", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { users } = req.body;

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(400).json({ message: "Users array is required and must not be empty" });
      }

      // Create PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="THS-Login-Slips-${new Date().toISOString().split('T')[0]}.pdf"`);

      // Pipe PDF to response
      doc.pipe(res);

      // Add header
      doc.fontSize(20).font('Helvetica-Bold').text('Treasure-Home School', { align: 'center' });
      doc.fontSize(12).font('Helvetica').text('Login Credentials', { align: 'center' });
      doc.moveDown(2);

      // Generate login slips for each user
      users.forEach((user: any, index: number) => {
        if (index > 0) {
          doc.addPage();
        }

        // Draw a border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();

        // Title
        doc.fontSize(18).font('Helvetica-Bold').text('Login Information', 50, 60, { align: 'center' });
        doc.moveDown(1.5);

        // User details
        const startY = 120;
        doc.fontSize(14).font('Helvetica-Bold');
        doc.text('Name:', 70, startY);
        doc.font('Helvetica').text(`${user.firstName} ${user.lastName}`, 200, startY);

        doc.font('Helvetica-Bold').text('Role:', 70, startY + 30);
        const roleNames = { 1: 'Admin', 2: 'Teacher', 3: 'Student', 4: 'Parent' };
        doc.font('Helvetica').text(roleNames[user.roleId as keyof typeof roleNames] || 'Unknown', 200, startY + 30);

        doc.font('Helvetica-Bold').text('Username:', 70, startY + 60);
        doc.font('Helvetica-Bold').fontSize(16).text(user.username, 200, startY + 60);

        doc.fontSize(14).font('Helvetica-Bold').text('Password:', 70, startY + 90);
        doc.font('Helvetica-Bold').fontSize(16).text(user.password, 200, startY + 90);

        // Important notice
        doc.fontSize(12).font('Helvetica-Oblique').text('⚠️ Please change your password immediately after first login', 70, startY + 140, {
          width: doc.page.width - 140,
          align: 'center'
        });

        // Instructions
        doc.fontSize(11).font('Helvetica').text('Login Instructions:', 70, startY + 180);
        doc.fontSize(10).text('1. Go to the school portal login page', 90, startY + 200);
        doc.text('2. Enter your username and password exactly as shown above', 90, startY + 220);
        doc.text('3. You will be prompted to create a new secure password', 90, startY + 240);
        doc.text('4. Keep your new password safe and do not share it with anyone', 90, startY + 260);

        // Footer
        doc.fontSize(9).font('Helvetica-Oblique').text(
          `Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`,
          50,
          doc.page.height - 80,
          { align: 'center' }
        );

        doc.fontSize(10).font('Helvetica-Bold').text(
          'For assistance, contact the school administrator',
          50,
          doc.page.height - 60,
          { align: 'center' }
        );
      });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error('Login slip generation error:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate login slips" });
      }
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
      console.log('Creating student with auto-generated credentials');

      // Date validation helper
      const isValidDate = (dateString: string): boolean => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;

        const [year, month, day] = dateString.split('-').map(Number);
        if (year < 1900 || year > 2100) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;

        if (month === 2) {
          const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
          if (day > (isLeapYear ? 29 : 28)) return false;
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
          return false;
        }

        return true;
      };

      // Enhanced schema validation with date checks - email and password are now optional
      const sharedCreateStudentSchema = createStudentSchema.extend({
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
        dateOfBirth: createStudentSchema.shape.dateOfBirth.refine(isValidDate, "Invalid date of birth"),
        admissionDate: createStudentSchema.shape.admissionDate.refine(isValidDate, "Invalid admission date"),
        medicalInfo: z.string().nullable().optional().transform(val => val === null ? '' : val),
      });

      // Clean up empty/null fields before validation
      for (const field of ['phone', 'address', 'medicalInfo', 'parentId', 'email', 'password']) {
        if (req.body[field] == null || req.body[field] === '') {
          delete req.body[field];
        }
      }

      const validatedData = sharedCreateStudentSchema.parse(req.body);

      // Get class information for username generation
      const classInfo = await storage.getClass(validatedData.classId);
      if (!classInfo) {
        return res.status(400).json({ message: "Invalid class ID" });
      }

      // Generate credentials automatically
      const currentYear = new Date().getFullYear().toString();
      const { generateStudentUsername, generateStudentPassword } = await import('./auth-utils');

      // Get existing students to calculate next number
      const existingStudents = await storage.getAllStudents(true);
      const existingUsernames = existingStudents.map(s => s.admissionNumber).filter(Boolean);
      const nextNumber = getNextUserNumber(existingUsernames, ROLES.STUDENT, currentYear);

      // Generate username and password only - NO EMAIL
      const generatedUsername = generateStudentUsername(classInfo.name, currentYear, nextNumber);
      const generatedPassword = generateStudentPassword(currentYear);

      // Check if username already exists and increment if needed
      let finalUsername = generatedUsername;
      let attemptNumber = nextNumber;
      let existingUser = await storage.getUserByUsername(finalUsername);

      while (existingUser) {
        attemptNumber++;
        finalUsername = generateStudentUsername(classInfo.name, currentYear, attemptNumber);
        existingUser = await storage.getUserByUsername(finalUsername);
      }

      // Hash the generated password
      const passwordHash = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);

      // Create user account with auto-generated credentials - NO EMAIL REQUIRED
      const userData: InsertUser = {
        email: `${finalUsername.toLowerCase()}@internal.ths`, // Internal placeholder only - not used for login
        username: finalUsername,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        dateOfBirth: validatedData.dateOfBirth, // Store exact YYYY-MM-DD string
        gender: validatedData.gender,
        profileImageUrl: validatedData.profileImageUrl || null,
        roleId: ROLES.STUDENT, // Always set to student role
        isActive: true,
        mustChangePassword: true, // ✅ Student must change password on first login
        status: 'active',
        authProvider: 'local',
      };

      console.log('Creating user for student with username:', generatedUsername);
      const user = await storage.createUser(userData);
      console.log('User created with ID:', user.id);

      try {
        // 🔗 SMART AUTO-LINK SYSTEM: Handle parent account creation/linking
        let parentId = validatedData.parentId || null;
        let parentCredentials: { username: string; password: string } | null = null;
        let parentCreated = false;

        // Check if parent phone is provided and no explicit parentId - NO EMAIL MATCHING
        if (validatedData.parentPhone && !parentId) {
          console.log('🔍 Checking for existing parent account by phone...');

          // Try to find existing parent by phone ONLY
          let existingParent = null;
          const allParents = await storage.getUsersByRole(ROLES.PARENT);
          existingParent = allParents.find((p: any) => p.phone === validatedData.parentPhone);

          if (existingParent) {
            // ✅ Link to existing parent
            console.log('✅ Found existing parent by phone, linking to student');
            parentId = existingParent.id;
          } else {
            // 🆕 Auto-create new parent account - USERNAME/PASSWORD ONLY
            console.log('🆕 No existing parent found, auto-creating parent account');

            const parentUsername = generateUsername(ROLES.PARENT, currentYear, '',
              getNextUserNumber(await storage.getAllUsernames(), ROLES.PARENT, currentYear));
            const parentPassword = generatePassword(currentYear);
            const parentPasswordHash = await bcrypt.hash(parentPassword, BCRYPT_ROUNDS);

            const parentData: InsertUser = {
              username: parentUsername,
              email: `${parentUsername.toLowerCase()}@internal.ths`, // Internal placeholder - not used for login
              passwordHash: parentPasswordHash,
              firstName: validatedData.guardianName?.split(' ')[0] || validatedData.firstName,
              lastName: validatedData.guardianName?.split(' ').slice(1).join(' ') || `Parent`,
              phone: validatedData.parentPhone || null,
              roleId: ROLES.PARENT,
              isActive: true,
              mustChangePassword: true,
              status: 'active',
              authProvider: 'local',
              createdVia: 'admin',
              createdBy: req.user?.id,
            };

            const parentUser = await storage.createUser(parentData);
            parentId = parentUser.id;
            parentCreated = true;

            // Store parent credentials to return
            parentCredentials = {
              username: parentUsername,
              password: parentPassword,
            };

            console.log('✅ Parent account created:', parentUsername);
          }
        }

        // Prepare student data - admission number ALWAYS auto-generated from username
        const studentData: UpdateStudentSchema = {
          id: user.id, // Use the same ID as the user
          admissionNumber: finalUsername, // ALWAYS use final unique username as admission number
          classId: validatedData.classId,
          parentId: parentId,
          admissionDate: validatedData.admissionDate,
          emergencyContact: validatedData.emergencyContact,
          medicalInfo: validatedData.medicalInfo || null,
          guardianName: validatedData.guardianName || null,
        };

        // Create student record
        console.log('Creating student record...');
        const student = await storage.createStudent(studentData);
        console.log('Student created successfully with credentials');

        // Build response with both student and parent credentials
        const response: any = {
          message: parentCreated
            ? "Student and Parent accounts created successfully"
            : "Student created successfully",
          student,
          user: {
            id: user.id,
            email: user.email,
            username: finalUsername,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          credentials: {
            student: {
              username: finalUsername,
              password: generatedPassword,
            }
          }
        };

        // Add parent credentials if created
        if (parentCreated && parentCredentials) {
          response.credentials.parent = parentCredentials;
          response.parentCreated = true;
        }

        res.json(response);

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

  // Bulk upload students from CSV
  app.post("/api/students/bulk-upload", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = await fs.readFile(req.file.path, 'utf-8');
      const lines = fileContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ message: "CSV file is empty or invalid" });
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const createdStudents: any[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });

          const firstName = row['first name'] || row['firstname'];
          const lastName = row['last name'] || row['lastname'];
          const className = row['class'];
          const gender = row['gender'];
          const dateOfBirth = row['date of birth'] || row['dob'];
          const parentEmail = row['parent email'] || row['parentemail'];
          const parentPhone = row['parent phone'] || row['parentphone'];

          if (!firstName || !lastName || !className) {
            errors.push(`Row ${i + 1}: Missing required fields (first name, last name, or class)`);
            continue;
          }

          const classInfo = await storage.getClasses();
          const matchingClass = classInfo.find((c: any) =>
            c.name.toLowerCase() === className.toLowerCase()
          );

          if (!matchingClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }

          const classCode = matchingClass.name.replace(/\s+/g, '').toUpperCase().substring(0, 4);
          const currentYear = new Date().getFullYear().toString();
          const nextNumber = await storage.getNextSequence(matchingClass.name, currentYear); // Use class name and year for sequence
          const username = generateStudentUsername(matchingClass.name, currentYear, nextNumber); // Use class name for clarity
          const password = generateStudentPassword(currentYear);
          const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

          const userData = {
            username,
            email: `${username.toLowerCase()}@ths.edu.ng`, // Auto-generated email
            passwordHash,
            mustChangePassword: true,
            firstName,
            lastName,
            phone: null,
            address: null,
            dateOfBirth: dateOfBirth || null,
            gender: (gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'female' || gender?.toLowerCase() === 'other') ? gender as any : null,
            profileImageUrl: null,
            roleId: ROLES.STUDENT,
            isActive: true,
            status: 'active',
            createdVia: 'bulk',
            createdBy: req.user?.id,
          };

          const user = await storage.createUser(userData);

          const studentData = {
            id: user.id,
            admissionNumber: `THS/${currentYear.substring(2)}/${String(nextNumber).padStart(4, '0')}`, // THS/25/001 format
            classId: matchingClass.id,
            parentId: null, // Will be updated below if parent is found or created
            admissionDate: new Date().toISOString().split('T')[0], // Current date as admission date
            emergencyContact: parentPhone || null,
            medicalInfo: null,
            guardianName: parentId ? `${firstName} (Parent)` : null, // Placeholder for guardian name
          };

          await storage.createStudent(studentData);

          createdStudents.push({
            id: user.id,
            firstName,
            lastName,
            username,
            password, // Return plaintext password for admin to share
            email: userData.email,
            class: matchingClass.name,
            parentEmail: parentEmail || null,
          });

        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      await fs.unlink(req.file.path);

      res.json({
        message: `Successfully created ${createdStudents.length} students`,
        students: createdStudents,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('CSV upload error:', error);
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch {}
      }
      res.status(500).json({ message: "Failed to process CSV file" });
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
        userPatch.mustChangePassword = true; // Force password change on next login if password is reset
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
        return res.status(401).json({ message: 'Unauthorized' });
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
          message = "Invalid exam reference - please ensure valid class, subject, and term are selected";
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
          console.log(`Filtered to ${exams.length}published exams for student`);
        } else {
          console.log('Student notfound or has no class assigned');
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
      res.status(500).json({ message:"Failed to fetch exams for class" });
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
      // First get the exam to check ownership
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
          // Check if exam exists and was created by the teacher
          const exam = await storage.getExamById(parseInt(examId));
          if (!exam || exam.createdBy !== user.id) {
            return res.status(403).json({ message: "Teachers can only view questions for their own exams" });
          }
        }
        // Admins can view all
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
        .filter(id => !isNaN(id));

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

      // Trigger score merge after manual grade submission (non-blocking)
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

          // Validate options for multiple choice questions
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

      // First get the resource to find the file path
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

  // PROFILE ONBOARDING ROUTES
  // Get current user's profile with completion status
  app.get("/api/profile/me", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const roleId = (req as any).user.roleId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get role-specific profile
      let roleProfile = null;
      if (roleId === ROLES.TEACHER) {
        roleProfile = await storage.getTeacherProfile(userId);
      } else if (roleId === ROLES.ADMIN) {
        roleProfile = await storage.getAdminProfile(userId);
      } else if (roleId === ROLES.PARENT) {
        roleProfile = await storage.getParentProfile(userId);
      } else if (roleId === ROLES.STUDENT) {
        roleProfile = await storage.getStudent(userId);
      }

      // Calculate completion percentage
      const completionPercentage = await storage.calculateProfileCompletion(userId, roleId);
      const profileCompleted = user.profileCompleted || false;

      res.json({
        user,
        roleProfile,
        completionPercentage,
        profileCompleted
      });
    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Update user profile (all steps combined for MVP)
  app.put("/api/profile/me", authenticateUser, async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const roleId = (req as any).user.roleId;
      const { personalInfo, contactInfo, roleSpecific, security } = req.body;

      // Update user basic info
      const userUpdates: Partial<InsertUser> = {};
      if (personalInfo) {
        if (personalInfo.firstName) userUpdates.firstName = personalInfo.firstName;
        if (personalInfo.lastName) userUpdates.lastName = personalInfo.lastName;
        if (personalInfo.dateOfBirth) userUpdates.dateOfBirth = personalInfo.dateOfBirth;
        if (personalInfo.gender) userUpdates.gender = personalInfo.gender;
        if (personalInfo.profileImageUrl) userUpdates.profileImageUrl = personalInfo.profileImageUrl;
      }

      if (contactInfo) {
        if (contactInfo.phone) userUpdates.phone = contactInfo.phone;
        if (contactInfo.address) userUpdates.address = contactInfo.address;
        if (contactInfo.state) userUpdates.state = contactInfo.state;
        if (contactInfo.country) userUpdates.country = contactInfo.country;
      }

      if (security) {
        if (security.securityQuestion) userUpdates.securityQuestion = security.securityQuestion;
        if (security.securityAnswer) {
          const bcrypt = require('bcrypt');
          userUpdates.securityAnswerHash = await bcrypt.hash(security.securityAnswer, 10);
        }
        if (security.dataPolicyAgreed) {
          userUpdates.dataPolicyAgreed = true;
          userUpdates.dataPolicyAgreedAt = new Date();
        }
      }

      // Update user
      const updatedUser = await storage.updateUserProfile(userId, userUpdates);

      // Update role-specific profile
      if (roleSpecific) {
        if (roleId === ROLES.TEACHER) {
          const existing = await storage.getTeacherProfile(userId);
          if (existing) {
            await storage.updateTeacherProfile(userId, roleSpecific);
          } else {
            await storage.createTeacherProfile({ userId, ...roleSpecific });
          }
        } else if (roleId === ROLES.ADMIN) {
          const existing = await storage.getAdminProfile(userId);
          if (existing) {
            await storage.updateAdminProfile(userId, roleSpecific);
          } else {
            await storage.createAdminProfile({ userId, ...roleSpecific });
          }
        } else if (roleId === ROLES.PARENT) {
          const existing = await storage.getParentProfile(userId);
          if (existing) {
            await storage.updateParentProfile(userId, roleSpecific);
          } else {
            await storage.createParentProfile({ userId, ...roleSpecific });
          }
        } else if (roleId === ROLES.STUDENT) {
          const existing = await storage.getStudent(userId);
          if (existing && roleSpecific.guardianName) {
            await storage.updateStudent(userId, {
              studentPatch: { guardianName: roleSpecific.guardianName }
            });
          }
        }
      }

      // Calculate new completion percentage
      const completionPercentage = await storage.calculateProfileCompletion(userId, roleId);
      const profileCompleted = completionPercentage >= 100;

      // Update completion status
      await storage.updateUser(userId, {
        profileCompletionPercentage: completionPercentage,
        profileCompleted
      });

      res.json({
        message: "Profile updated successfully",
        completionPercentage,
        profileCompleted
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin: Get all users with profile completion status
  app.get("/api/admin/profile-completion", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers();

      const usersWithCompletion = await Promise.all(
        allUsers.map(async (user) => {
          const role = await storage.getRole(user.roleId);
          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: role?.name || 'Unknown',
            status: user.status,
            lastLogin: user.lastLoginAt,
            completionPercentage: user.profileCompletionPercentage || 0,
            profileCompleted: user.profileCompleted || false
          };
        })
      );

      res.json(usersWithCompletion);
    } catch (error) {
      console.error('Profile completion fetch error:', error);
      res.status(500).json({ message: "Failed to fetch profile completion data" });
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

      console.log('📊 Testing session:', { sessionId: session.id, studentId: session.studentId, examId: session.examId, Completed: session.isCompleted });

      const startTime = Date.now();

      try {
        // Test the auto-scoring function directly
        await autoScoreExamSession(sessionId, storage);

        const totalTime = Date.now() - startTime;
        console.log(`✅ AUTO-SCORING TEST SUCCESS: Completed in ${totalTime}ms`);

        // Get the results to verify success
        const results = await storage.getExamResultsByStudent(session.studentId);
        const examResult = results.find(r => r.examId === examId);

        if (examResult) {
          console.log(`🎉 VERIFIED: Auto-scored result found - ${examResult.score}/${examResult.maxScore}`);
          return res.json({
            success: true,
            message: "Auto-scoring test completed successfully",
            testDetails: {
              sessionId: sessionId,
              studentId: session.studentId,
              examId: session.examId,
              duration: totalTime,
              result: {
                score: examResult.score,
                maxScore: examResult.maxScore,
                autoScored: examResult.autoScored,
                resultId: examResult.id
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
              allResults: results.filter(r => r.examId === session.examId)
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
      const user = req.user!;
      const { examId, studentId } = req.body;
      const examIdNum = parseInt(examId);

      console.log('🚀 EXAM SUBMISSION: Student', user.id, 'submitting exam', examIdNum);

      if (isNaN(examIdNum)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }

      // Ensure student can only create sessions for themselves
      if (studentId !== user.id) {
        console.error('❌ Authorization failure: Student trying to create session for another student:', { requestedStudentId: studentId, authenticatedUserId: user.id });
        return res.status(403).json({ message: "Students can only create exam sessions for themselves" });
      }

      // Check if exam exists and is published
      const exam = await storage.getExamById(examIdNum);
      if (!exam) {
        console.error('❌ Exam not found:', examIdNum);
        return res.status(404).json({ message: "Exam not found" });
      }

      console.log('📋 Exam details:', { id: exam.id, name: exam.name, isPublished: exam.isPublished, timeLimit: exam.timeLimit });

      if (!exam.isPublished) {
        console.error('❌ Exam not published:', examIdNum);
        return res.status(403).json({ message: "Exam is not published" });
      }

      // Check if student already has an active session for this exam
      const existingSession = await storage.getActiveExamSession(examIdNum, studentId);
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
        } else if (dbError.code === 'ECONNRESET' || dbError.code === 'ETIMEDOUT') {
          return res.status(408).json({ message: "Database connection timeout. Please try again." });
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

  // Get active exam sessions for a student
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
      if (error?.code) {
        if (error?.code === '23503') {
          return res.status(400).json({ message: "Invalid question or session reference" });
        } else if (error?.code === '23505') {
          return res.status(409).json({ message: "Answer already exists for this question" });
        } else if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
          return res.status(408).json({ message: "Database connection timeout. Please try again." });
        }
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
            console.log(`👨‍ öğretmen Assigning grading tasks to class-subject teacher: ${assignedTeacherId}`);
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
          action: 'manual_grade',
          entityType: 'student_answer',
          entityId: result.answer.id,
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

      // Parent can only view their own children
      if (user.roleId === ROLES.PARENT && user.id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const reportCards = await storage.getReportCardsByStudentId(studentId);
      res.json(reportCards);
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
          entityId: 0, // Placeholder, needs proper entity ID if applicable
          newValue: `Attempted to access student ${studentId}`,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });
        return res.status(403).json({
          message: "Access denied. You can only view records for children linked to your account."
        });
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
          return res.status(403).json({
            message: "Access denied. Parents can only view their own children's report cards."
          });
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

      // Generate actual PDF using PDFKit
      const term = await storage.getAcademicTerm(report.termId);
      const classInfo = await storage.getClass(report.classId);
      const studentUser = await storage.getUser(report.studentId);
      const items = await storage.getReportCardItems(report.id);

      // Get subject names for items
      const itemsWithSubjects = await Promise.all(items.map(async (item: any) => {
        const subject = await storage.getSubject(item.subjectId);
        return {
          ...item,
          subjectName: subject?.name || 'Unknown'
        };
      }));

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-card-${studentUser?.firstName}-${studentUser?.lastName}-${term?.name}-${term?.year}.pdf"`);

      // Pipe PDF to response
      doc.pipe(res);

      // Header - School Name
      doc.fontSize(24)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('Treasure-Home School', { align: 'center' });

      doc.fontSize(16)
        .fillColor('#666666')
        .text('Seriki-Soyinka Ifo, Ogun State, Nigeria', { align: 'center' });

      doc.moveDown(0.5);
      doc.fontSize(20)
        .fillColor('#1e40af')
        .text('Student Report Card', { align: 'center' });

      doc.moveDown(1.5);

      // Student Information Box
      const infoBoxY = doc.y;
      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#000000');

      // Left column
      doc.text(`Student: ${studentUser?.firstName} ${studentUser?.lastName}`, 50, infoBoxY);
      doc.text(`Class: ${classInfo?.name || 'N/A'}`, 50, infoBoxY + 20);

      // Right column
      doc.text(`Term: ${term?.name || 'N/A'} ${term?.year || ''}`, 350, infoBoxY);
      doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 350, infoBoxY + 20);

      doc.moveDown(2);

      // Overall Performance Summary Box
      const summaryBoxY = doc.y;
      doc.roundedRect(50, summaryBoxY, 495, 60, 5)
        .fillAndStroke('#f0f9ff', '#3b82f6');

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('Overall Performance', 60, summaryBoxY + 10);

      doc.fontSize(11)
        .font('Helvetica')
        .fillColor('#000000');

      doc.text(`Average: ${report.averagePercentage || 0}%`, 60, summaryBoxY + 30);
      doc.text(`Grade: ${report.overallGrade || 'N/A'}`, 250, summaryBoxY + 30);
      doc.text(`Status: ${report.status}`, 400, summaryBoxY + 30);

      doc.moveDown(3);

      // Subject Performance Table
      doc.fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#1e40af')
        .text('Subject Performance', 50, doc.y);

      doc.moveDown(0.5);

      // Table headers
      const tableTop = doc.y;
      const colWidths = [180, 70, 70, 70, 80];
      const colPositions = [50, 230, 300, 370, 440];

      doc.fontSize(10)
        .font('Helvetica-Bold')
        .fillColor('#ffffff');

      // Header background
      doc.rect(50, tableTop, 495, 25)
        .fill('#3b82f6');

      doc.text('Subject', colPositions[0] + 5, tableTop + 8);
      doc.text('Test (40)', colPositions[1] + 5, tableTop + 8);
      doc.text('Exam (60)', colPositions[2] + 5, tableTop + 8);
      doc.text('Total (100)', colPositions[3] + 5, tableTop + 8);
      doc.text('Grade', colPositions[4] + 5, tableTop + 8);

      // Table rows
      let rowY = tableTop + 30;
      doc.fontSize(10)
        .font('Helvetica')
        .fillColor('#000000');

      itemsWithSubjects.forEach((item: any, index: number) => {
        // Alternate row colors
        if (index % 2 === 0) {
          doc.rect(50, rowY - 5, 495, 25).fill('#f8fafc');
        }

        doc.fillColor('#000000');
        doc.text(item.subjectName, colPositions[0] + 5, rowY, { width: colWidths[0] - 10, lineBreak: false, ellipsis: true });
        doc.text(`${item.testWeightedScore || 0}/40`, colPositions[1] + 5, rowY);
        doc.text(`${item.examWeightedScore || 0}/60`, colPositions[2] + 5, rowY);
        doc.text(`${item.obtainedMarks || 0}/100`, colPositions[3] + 5, rowY);
        doc.text(item.grade || 'N/A', colPositions[4] + 5, rowY);

        rowY += 25;
      });

      // Table border
      doc.rect(50, tableTop, 495, rowY - tableTop)
        .stroke('#cbd5e1');

      // Teacher's Remarks
      if (report.teacherRemarks) {
        doc.moveDown(2);
        doc.fontSize(12)
          .font('Helvetica-Bold')
          .fillColor('#1e40af')
          .text('Teacher\'s Remarks', 50, doc.y);

        doc.fontSize(10)
          .font('Helvetica')
          .fillColor('#000000');

        const remarksBoxY = doc.y + 10;
        doc.roundedRect(50, remarksBoxY, 495, 60, 5)
          .stroke('#cbd5e1');

        doc.text(report.teacherRemarks, 60, remarksBoxY + 10, {
          width: 475,
          align: 'left'
        });
      }

      // Footer
      doc.fontSize(8)
        .fillColor('#666666')
        .text(
          '© 2024 Treasure-Home School | "Honesty and Success" | treasurehomeschool@gmail.com',
          50,
          doc.page.height - 30,
          { align: 'center', width: 495 }
        );

      // Finalize PDF
      doc.end();
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

  // Create academic term (Admin only)
  app.post("/api/terms", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { name, year, startDate, endDate, isCurrent } = req.body;

      // If setting as current, unset all other current terms
      if (isCurrent) {
        await storage.db.update(storage.schema.academicTerms)
          .set({ isCurrent: false });
      }

      const term = await storage.db.insert(storage.schema.academicTerms).values({
        name,
        year,
        startDate,
        endDate,
        isCurrent: isCurrent || false
      }).returning();

      res.json(term[0]);
    } catch (error) {
      console.error('Create term error:', error);
      res.status(500).json({ message: "Failed to create academic term" });
    }
  });

  // Fetch subjects
  // Removed useQuery hook as it's client-side and shouldn't be in server code.
  // Subjects are fetched on the client side in the component that needs them

  // ==================== TEACHER PROFILE SETUP ROUTES ====================

  // Check teacher first-login status
  app.get("/api/teacher/profile/status", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const userId = req.user!.id;
      const profile = await storage.getTeacherProfile(userId);

      res.json({
        firstLogin: profile?.firstLogin ?? true,
        profileCompleted: profile?.verified ?? false,
        hasProfile: !!profile
      });
    } catch (error) {
      console.error('Error checking teacher profile status:', error);
      res.status(500).json({ message: "Failed to check profile status" });
    }
  });

  // Get teacher profile
  app.get("/api/teacher/profile", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      const profile = await storage.getTeacherProfile(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          dateOfBirth: user.dateOfBirth,
          profileImageUrl: user.profileImageUrl
        },
        profile: profile || null
      });
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      res.status(500).json({ message: "Failed to fetch teacher profile" });
    }
  });

  // Submit/Update teacher profile
  app.post("/api/teacher/profile", authenticateUser, authorizeRoles(ROLES.TEACHER), upload.single('signature'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const profileData = req.body;

      // Handle arrays that come as JSON strings
      if (typeof profileData.subjects === 'string') {
        profileData.subjects = JSON.parse(profileData.subjects);
      }
      if (typeof profileData.assignedClasses === 'string') {
        profileData.assignedClasses = JSON.parse(profileData.assignedClasses).map((c: string) => parseInt(c));
      }

      // Handle signature file upload
      let signatureUrl = profileData.signatureUrl;
      if (req.file) {
        signatureUrl = `/uploads/${req.file.filename}`;
      }

      const existingProfile = await storage.getTeacherProfile(userId);

      const profilePayload = {
        userId,
        staffId: profileData.staffId,
        subjects: profileData.subjects || [],
        assignedClasses: profileData.assignedClasses || [],
        qualification: profileData.qualification,
        yearsOfExperience: profileData.yearsOfExperience ? parseInt(profileData.yearsOfExperience) : null,
        specialization: profileData.specialization,
        department: profileData.department,
        signatureUrl,
        gradingMode: profileData.gradingMode || '100_marks',
        notificationPreference: profileData.notificationPreference || 'email',
        availability: profileData.availability,
        firstLogin: false, // Mark as completed
        verified: true // Auto-verify on completion
      };

      let profile;
      if (existingProfile) {
        profile = await storage.updateTeacherProfile(userId, profilePayload);
      } else {
        profile = await storage.createTeacherProfile(profilePayload);
      }

      // Update user profile data if provided
      if (profileData.phone || profileData.dateOfBirth || profileData.gender) {
        await storage.updateUser(userId, {
          phone: profileData.phone,
          dateOfBirth: profileData.dateOfBirth,
          gender: profileData.gender
        });
      }

      // Create notification for admin (informational only)
      const admins = await storage.getUsersByRole(ROLES.ADMIN);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'teacher_profile_created',
          title: 'New Teacher Profile Created',
          message: `${req.user!.firstName} ${req.user!.lastName} has completed their profile setup and can now access the dashboard.`,
          relatedEntityType: 'teacher_profile',
          relatedEntityId: userId
        });
      }

      res.json(profile);
    } catch (error) {
      console.error('Error submitting teacher profile:', error);
      res.status(500).json({ message: "Failed to submit teacher profile" });
    }
  });

  // Admin: Get all pending teacher profiles
  app.get("/api/admin/teacher-profiles/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const teachers = await storage.getUsersByRole(ROLES.TEACHER);
      const pendingProfiles = [];

      for (const teacher of teachers) {
        const profile = await storage.getTeacherProfile(teacher.id);
        if (profile && !profile.verified) {
          pendingProfiles.push({
            teacher: {
              id: teacher.id,
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              email: teacher.email,
              profileImageUrl: teacher.profileImageUrl
            },
            profile
          });
        }
      }

      res.json(pendingProfiles);
    } catch (error) {
      console.error('Error fetching pending teacher profiles:', error);
      res.status(500).json({ message: "Failed to fetch pending profiles" });
    }
  });

  // Admin: Get all verified teacher profiles
  app.get("/api/admin/teacher-profiles/verified", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const teachers = await storage.getUsersByRole(ROLES.TEACHER);
      const verifiedProfiles = [];

      for (const teacher of teachers) {
        const profile = await storage.getTeacherProfile(teacher.id);
        if (profile && profile.verified) {
          verifiedProfiles.push({
            teacher: {
              id: teacher.id,
              firstName: teacher.firstName,
              lastName: teacher.lastName,
              email: teacher.email,
              profileImageUrl: teacher.profileImageUrl
            },
            profile
          });
        }
      }

      res.json(verifiedProfiles);
    } catch (error) {
      console.error('Error fetching verified teacher profiles:', error);
      res.status(500).json({ message: "Failed to fetch verified profiles" });
    }
  });

  // Admin: Get specific teacher profile details
  app.get("/api/admin/teacher-profiles/:userId", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId } = req.params;
      const teacher = await storage.getUser(userId);
      const profile = await storage.getTeacherProfile(userId);

      if (!teacher || !profile) {
        return res.status(404).json({ message: "Teacher profile not found" });
      }

      // Get assigned classes details
      let assignedClassDetails = [];
      if (profile.assignedClasses && profile.assignedClasses.length > 0) {
        const classesPromises = profile.assignedClasses.map(classId =>
          storage.db.select().from(storage.schema.classes).where(eq(storage.schema.classes.id, classId)).limit(1)
        );
        const classesResults = await Promise.all(classesPromises);
        assignedClassDetails = classesResults.map(r => r[0]).filter(Boolean);
      }

      res.json({
        teacher: {
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          phone: teacher.phone,
          gender: teacher.gender,
          dateOfBirth: teacher.dateOfBirth,
          profileImageUrl: teacher.profileImageUrl
        },
        profile,
        assignedClassDetails
      });
    } catch (error) {
      console.error('Error fetching teacher profile details:', error);
      res.status(500).json({ message: "Failed to fetch teacher profile details" });
    }
  });

  // Admin: Verify teacher profile
  app.post("/api/admin/teacher-profiles/verify", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId, action } = req.body; // action: 'approve' or 'reject'
      const adminId = req.user!.id;

      if (action === 'approve') {
        const profile = await storage.updateTeacherProfile(userId, {
          verified: true,
          verifiedBy: adminId,
          verifiedAt: new Date()
        });

        // Create notification for teacher
        await storage.createNotification({
          userId: userId,
          type: 'profile_verified',
          title: '```typescript
          message: 'Your teacher profile has been verified by the administrator. You now have full access to the portal.',
          relatedEntityType: 'teacher_profile',
          relatedEntityId: userId
        });

        // Update user status to active if pending
        const user = await storage.getUser(userId);
        if (user && user.status === 'pending') {
          await storage.approveUser(userId, adminId);
        }

        res.json({ success: true, profile });
      } else if (action === 'reject') {
        // Create notification for teacher
        await storage.createNotification({
          userId: userId,
          type: 'profile_rejected',
          title: 'Profile Requires Revision',
          message: 'Your teacher profile requires some revisions. Please review and resubmit.',
          relatedEntityType: 'teacher_profile',
          relatedEntityId: userId
        });

        res.json({ success: true, message: 'Profile marked for revision' });
      } else {
        res.status(400).json({ message: 'Invalid action' });
      }
    } catch (error) {
      console.error('Error verifying teacher profile:', error);
      res.status(500).json({ message: "Failed to verify teacher profile" });
    }
  });

  // ==================== END TEACHER PROFILE ROUTES ====================

  // ==================== MODULE 1: SETTINGS MANAGEMENT ====================

  // Get all settings (Admin only)
  app.get("/api/admin/settings", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Get specific setting
  app.get("/api/admin/settings/:key", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { key } = req.params;
      const setting = await storage.getSetting(key);
      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  // Create or update setting
  app.post("/api/admin/settings", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { key, value, description, dataType } = req.body;
      const adminId = req.user!.id;

      const existingSetting = await storage.getSetting(key);
      let result;

      if (existingSetting) {
        result = await storage.updateSetting(key, value, adminId);
        await storage.createAuditLog({
          userId: adminId,
          action: 'setting_updated',
          entityType: 'setting',
          entityId: existingSetting.id,
          oldValue: existingSetting.value,
          newValue: value,
          reason: 'Admin updated system setting',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } else {
        result = await storage.createSetting({
          key,
          value,
          description,
          dataType: dataType || 'string',
          updatedBy: adminId
        });
        await storage.createAuditLog({
          userId: adminId,
          action: 'setting_created',
          entityType: 'setting',
          entityId: result.id,
          oldValue: null,
          newValue: value,
          reason: 'Admin created new system setting',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      res.json(result);
    } catch (error) {
      console.error('Error creating/updating setting:', error);
      res.status(500).json({ message: "Failed to save setting" });
    }
  });

  // Delete setting
  app.delete("/api/admin/settings/:key", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { key } = req.params;
      const adminId = req.user!.id;
      const setting = await storage.getSetting(key);

      if (!setting) {
        return res.status(404).json({ message: "Setting not found" });
      }

      const deleted = await storage.deleteSetting(key);
      if (deleted) {
        await storage.createAuditLog({
          userId: adminId,
          action: 'setting_deleted',
          entityType: 'setting',
          entityId: setting.id,
          oldValue: setting.value,
          newValue: null,
          reason: 'Admin deleted system setting',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      }

      res.json({ success: deleted });
    } catch (error) {
      console.error('Error deleting setting:', error);
      res.status(500).json({ message: "Failed to delete setting" });
    }
  });

  // ==================== MODULE 1: CSV IMPORT ENDPOINTS ====================

  // Preview CSV import (validate and return preview)
  app.post("/api/admin/import/preview", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = await fs.readFile(req.file.path, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file is empty or invalid" });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['studentName', 'class', 'parentName', 'parentEmail'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

      if (missingHeaders.length > 0) {
        return res.status(400).json({
          message: `Missing required columns: ${missingHeaders.join(', ')}`,
          requiredHeaders
        });
      }

      const preview = [];
      const errors = [];
      const classes = await storage.getClasses();
      const currentYear = new Date().getFullYear().toString();

      for (let i = 1; i < Math.min(lines.length, 101); i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        const rowErrors = [];
        if (!row.studentName) rowErrors.push('Missing student name');
        if (!row.class) rowErrors.push('Missing class');

        const matchingClass = classes.find(c => c.name.toLowerCase() === row.class.toLowerCase());
        if (!matchingClass) rowErrors.push(`Class "${row.class}" not found`);

        const existingUsernames = (await storage.getAllUsers()).map(u => u.username).filter(Boolean);
        const studentUsername = matchingClass
          ? generateStudentUsername(matchingClass.name, currentYear, await storage.getNextSequence(matchingClass.name, currentYear))
          : '';

        const parentExists = row.parentEmail ? await storage.getUserByEmail(row.parentEmail) : null;

        preview.push({
          rowNumber: i,
          data: row,
          computed: {
            studentUsername,
            classId: matchingClass?.id,
            parentExists: !!parentExists
          },
          errors: rowErrors,
          warnings: []
        });

        if (rowErrors.length > 0) {
          errors.push({
            row: i,
            errors: rowErrors
          });
        }
      }

      await fs.unlink(req.file.path);

      res.json({
        preview,
        summary: {
          totalRows: lines.length - 1,
          previewRows: preview.length,
          errorCount: errors.length,
          validCount: preview.length - errors.length
        },
        errors
      });
    } catch (error) {
      console.error('Error previewing CSV:', error);
      res.status(500).json({ message: "Failed to preview CSV" });
    }
  });

  // Commit CSV import (create users from validated CSV)
  app.post("/api/students/csv-commit", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { validRows } = req.body; // Expecting an array of validated rows from the preview step

      if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
        return res.status(400).json({ message: "No valid rows provided for import" });
      }

      const adminId = req.user!.id;
      const created = [];
      const failed = [];
      const currentYear = new Date().getFullYear().toString();
      const studentRole = await storage.getRoleByName('Student');
      const parentRole = await storage.getRoleByName('Parent');

      if (!studentRole || !parentRole) {
        return res.status(500).json({ message: "Required roles not found" });
      }

      // Fetch existing usernames once to avoid redundant queries
      const existingUsernames = await storage.getAllUsernames();

      for (const rowData of validRows) {
        try {
          const { data, computed } = rowData;

          const firstName = data.studentName.split(' ')[0];
          const lastName = data.studentName.split(' ').slice(1).join(' ') || firstName;

          const parentFirstName = data.parentName.split(' ')[0];
          const parentLastName = data.parentName.split(' ').slice(1).join(' ') || parentFirstName;

          let parentUser = null;
          let parentId: string | null = null;
          let parentCredentials = null;

          if (data.parentEmail) {
            parentUser = await storage.getUserByEmail(data.parentEmail);

            if (!parentUser) {
              const parentPassword = generatePassword(currentYear);
              const parentPasswordHash = await bcrypt.hash(parentPassword, BCRYPT_ROUNDS);
              const parentSequence = await storage.getNextSequence('PARENT', currentYear);
              const parentUsername = generateUsername(parentRole.id, currentYear, '', parentSequence);

              parentUser = await storage.createUser({
                username: parentUsername,
                email: data.parentEmail,
                passwordHash: parentPasswordHash,
                roleId: parentRole.id,
                firstName: parentFirstName,
                lastName: parentLastName,
                mustChangePassword: true,
                authProvider: 'local',
                status: 'active',
                createdVia: 'bulk',
                createdBy: adminId
              });

              existingUsernames.push(parentUsername);
              parentCredentials = { username: parentUsername, password: parentPassword };
            }
            parentId = parentUser.id;
          }

          const studentUsername = computed.studentUsername; // Already computed during preview
          const studentPassword = generateStudentPassword(currentYear);
          const studentPasswordHash = await bcrypt.hash(studentPassword, BCRYPT_ROUNDS);

          const studentUser = await storage.createUser({
            username: studentUsername,
            email: `${studentUsername.toLowerCase()}@ths.edu.ng`,
            passwordHash: studentPasswordHash,
            firstName,
            lastName,
            roleId: studentRole.id,
            mustChangePassword: true,
            authProvider: 'local',
            status: 'active',
            createdVia: 'bulk',
            createdBy: adminId
          });

          existingUsernames.push(studentUsername);

          const admissionNumber = `THS-${currentYear.slice(-2)}-${await storage.getNextSequence(matchingClass.name, currentYear).toString().padStart(4, '0')}`;
          await storage.createStudent({
            id: studentUser.id,
            admissionNumber,
            classId: computed.classId,
            parentId: parentId,
            admissionDate: new Date().toISOString().split('T')[0]
          });

          created.push({
            student: {
              username: studentUsername,
              password: studentPassword,
              admissionNumber,
              name: data.studentName
            },
            parent: parentCredentials ? {
              name: data.parentName,
              email: data.parentEmail,
              credentials: parentCredentials
            } : null
          });

        } catch (rowError) {
          failed.push({ row: rowData.rowNumber, error: rowError instanceof Error ? rowError.message : 'Unknown error' });
        }
      }

      res.json({
        message: `Successfully imported ${created.length} students`,
        created,
        failed
      });
    } catch (error) {
      console.error('Error committing CSV import:', error);
      res.status(500).json({ message: "Failed to import students" });
    }
  });


  // ==================== END MODULE 1 ROUTES ====================

  const httpServer = createServer(app);
  return httpServer;
}