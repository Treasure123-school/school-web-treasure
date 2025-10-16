// This commit addresses an issue where exam submission was failing due to server-side errors returning HTML instead of JSON.
// The exam submission endpoint has been refactored to handle errors gracefully and ensure valid JSON responses,
// improving the reliability of the exam submission and auto-scoring process.
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema, insertExamSchema, insertExamResultSchema, insertExamQuestionSchema, insertQuestionOptionSchema, createQuestionOptionSchema, insertHomePageContentSchema, insertContactMessageSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, createQuestionOptionSchema, createStudentSchema, InsertUser, InsertStudentAnswer, UpdateExamSessionSchema, UpdateUserStatusSchema, UpdateStudentSchema } from "@shared/schema";
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
import { initializeStorageBuckets, uploadFileToSupabase, deleteFileFromSupabase, STORAGE_BUCKETS, isSupabaseStorageEnabled, extractFilePathFromUrl } from "./supabase-storage";

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

// JWT secret - use environment variable for production, fallback for development
const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-secret-key-change-in-production' : undefined);
if (!JWT_SECRET) {
  console.error('CRITICAL: JWT_SECRET environment variable is required but not set!');
  console.error('Please set a secure JWT_SECRET environment variable before starting the server.');
  process.exit(1);
}
if (process.env.NODE_ENV === 'development' && JWT_SECRET === 'dev-secret-key-change-in-production') {
  console.warn('⚠️ WARNING: Using default JWT_SECRET for development. Set JWT_SECRET environment variable for production!');
}
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
const homepageDir = 'uploads/homepage';

// Ensure upload directories exist
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {});
fs.mkdir(profileDir, { recursive: true }).catch(() => {});
fs.mkdir(studyResourcesDir, { recursive: true }).catch(() => {});
fs.mkdir(homepageDir, { recursive: true }).catch(() => {});

// Use memory storage for Supabase uploads, disk storage for local filesystem
const storage_multer = isSupabaseStorageEnabled
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadType = req.body.uploadType || 'general';
        let dir = uploadDir;

        if (uploadType === 'gallery') {
          dir = galleryDir;
        } else if (uploadType === 'profile') {
          dir = profileDir;
        } else if (uploadType === 'study-resource') {
          dir = studyResourcesDir;
        } else if (uploadType === 'homepage') {
          dir = homepageDir;
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

    // CRITICAL FIX: Ensure recordedBy uses a valid user ID that exists in users table
    let SYSTEM_AUTO_SCORING_UUID: string;

    // STRATEGY: Try multiple fallbacks to find a valid user ID
    // 1. Try to find an admin user first (best practice)
    // 2. Verify the student ID exists in users table
    // 3. Find any active user as last resort
    try {
      const adminUsers = await storage.getUsersByRole(ROLES.ADMIN);
      if (adminUsers && adminUsers.length > 0 && adminUsers[0].id) {
        SYSTEM_AUTO_SCORING_UUID = adminUsers[0].id;
        console.log(`✅ Using admin user ${SYSTEM_AUTO_SCORING_UUID} for auto-scoring recordedBy`);
      } else {
        // No admin found, verify student ID exists in users table
        console.log(`⚠️ No admin users found, verifying student ${session.studentId} exists in users table...`);
        
        try {
          const studentUser = await storage.getUser(session.studentId);
          if (studentUser && studentUser.id) {
            SYSTEM_AUTO_SCORING_UUID = studentUser.id;
            console.log(`✅ Verified student ${SYSTEM_AUTO_SCORING_UUID} exists in users table, using for recordedBy`);
          } else {
            throw new Error(`Student ${session.studentId} not found in users table`);
          }
        } catch (studentError) {
          // Last resort: Find ANY active user
          console.error(`❌ Student ${session.studentId} not found in users table:`, studentError);
          console.log(`🔄 Last resort: Finding any active user for recordedBy...`);
          
          const allUsers = await storage.getAllUsers();
          const activeUser = allUsers.find((u: any) => u.isActive && u.id);
          
          if (activeUser && activeUser.id) {
            SYSTEM_AUTO_SCORING_UUID = activeUser.id;
            console.log(`✅ Using active user ${SYSTEM_AUTO_SCORING_UUID} as fallback for recordedBy`);
          } else {
            throw new Error('CRITICAL: No valid user ID found for auto-scoring recordedBy - cannot save exam result');
          }
        }
      }
    } catch (userError) {
      console.error('❌ CRITICAL ERROR: Failed to find valid user for auto-scoring recordedBy:', userError);
      throw new Error(`Auto-scoring failed: Cannot find valid user ID for recordedBy. Error: ${userError instanceof Error ? userError.message : String(userError)}`);
    }

    // Validate UUID before using
    if (!SYSTEM_AUTO_SCORING_UUID || typeof SYSTEM_AUTO_SCORING_UUID !== 'string') {
      throw new Error(`CRITICAL: Invalid recordedBy UUID: ${SYSTEM_AUTO_SCORING_UUID}`);
    }

    console.log(`📝 Final recordedBy UUID: ${SYSTEM_AUTO_SCORING_UUID}`);

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
      console.log(`🔍 DEBUG: Found ${verificationResults.length} results. Looking for examId ${session.examId} (type: ${typeof session.examId})`);
      console.log(`🔍 DEBUG: Result examIds:`, verificationResults.map((r: any) => `${r.examId} (type: ${typeof r.examId})`));
      const savedResult = verificationResults.find((r: any) => Number(r.examId) === Number(session.examId));

      if (!savedResult) {
        console.error(`❌ VERIFICATION FAILED: Could not find result for examId ${session.examId}`);
        console.error(`❌ Available results:`, JSON.stringify(verificationResults, null, 2));
        throw new Error('CRITICAL: Result was not properly saved - verification fetch failed to find the result');
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

// Create Grading Tasks Function: Triggered after auto-scoring or manual grading
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

    // Filter for essay/theory questions that require manual grading
    const manualGradingQuestions = examQuestions.filter((q: any) => {
      return q.questionType === 'text' || q.questionType === 'essay';
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
          console.log(`👨‍ teacher Assigning grading tasks to class-subject teacher: ${assignedTeacherId}`);
        } else {
          console.log(`ℹ️ No specific teacher found for class ${exam.classId} and subject ${exam.subjectId}. Using exam creator ${exam.createdBy}.`);
        }
      } catch (error) {
        console.warn(`⚠️ Could not find class-subject teacher, using exam creator: ${error}`);
      }
    } else {
      console.log(`ℹ️ Exam ${examId} has no classId or subjectId, assigning to exam creator ${exam.createdBy}.`);
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
        } else {
          console.log(`ℹ️ Grading task for answer ${studentAnswer.id} already exists. Skipping.`);
        }
      } else {
        console.warn(`⚠️ No student answer found for question ${question.id} in session ${sessionId}. Cannot create grading task.`);
      }
    }

    console.log(`✅ Created ${tasksCreated} new grading tasks for session ${sessionId}.`);
  } catch (error) {
    console.error(`❌ Error creating grading tasks for session ${sessionId}:`, error);
    throw error; // Re-throw to indicate failure
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

  // Exam management routes
  // Get all exams
  app.get('/api/exams', authenticateUser, async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Create exam
  app.post('/api/exams', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examData = insertExamSchema.parse({
        ...req.body,
        createdBy: req.user!.id
      });

      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error: any) {
      console.error('Error creating exam:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid exam data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create exam' });
    }
  });

  // Get single exam
  app.get('/api/exams/:id', authenticateUser, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExamById(examId);

      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.json(exam);
    } catch (error) {
      console.error('Error fetching exam:', error);
      res.status(500).json({ message: 'Failed to fetch exam' });
    }
  });

  // Update exam
  app.patch('/api/exams/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.updateExam(examId, req.body);

      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.json(exam);
    } catch (error) {
      console.error('Error updating exam:', error);
      res.status(500).json({ message: 'Failed to update exam' });
    }
  });

  // Delete exam
  app.delete('/api/exams/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const success = await storage.deleteExam(examId);

      if (!success) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({ message: 'Failed to delete exam' });
    }
  });

  // Toggle exam publish status
  app.patch('/api/exams/:id/publish', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const { isPublished } = req.body;

      const exam = await storage.updateExam(examId, { isPublished });

      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.json(exam);
    } catch (error) {
      console.error('Error updating exam publish status:', error);
      res.status(500).json({ message: 'Failed to update exam publish status' });
    }
  });

  // Submit exam - synchronous with instant scoring
  app.post('/api/exams/:examId/submit', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const studentId = req.user!.id;
      const startTime = Date.now();

      console.log(`🚀 SUBMIT EXAM: Student ${studentId} submitting exam ${examId}`);

      // Find the active exam session
      const sessions = await storage.getExamSessionsByStudent(studentId);
      const activeSession = sessions.find(s => s.examId === examId && !s.isCompleted);

      if (!activeSession) {
        return res.status(404).json({ message: 'No active exam session found' });
      }

      // Check if already submitted
      if (activeSession.isCompleted) {
        return res.status(409).json({ message: 'Exam already submitted' });
      }

      const now = new Date();

      // Mark session as submitted
      await storage.updateExamSession(activeSession.id, {
        isCompleted: true,
        submittedAt: now,
        status: 'submitted'
      });

      console.log(`✅ SUBMIT: Session ${activeSession.id} marked as submitted`);

      // Auto-score the exam
      const scoringStartTime = Date.now();
      await autoScoreExamSession(activeSession.id, storage);
      const scoringTime = Date.now() - scoringStartTime;

      console.log(`⚡ SCORING: Completed in ${scoringTime}ms`);

      // Get the updated session with scores
      const updatedSession = await storage.getExamSessionById(activeSession.id);
      
      // Get detailed results for student
      const studentAnswers = await storage.getStudentAnswers(activeSession.id);
      const examQuestions = await storage.getExamQuestions(examId);

      // Build question details for frontend
      const questionDetails = examQuestions.map(q => {
        const answer = studentAnswers.find(a => a.questionId === q.id);
        return {
          questionId: q.id,
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points,
          studentAnswer: answer?.textAnswer || null,
          selectedOptionId: answer?.selectedOptionId || null,
          isCorrect: answer?.isCorrect || false,
          pointsAwarded: answer?.pointsEarned || 0,
          feedback: answer?.feedbackText || null
        };
      });

      const totalTime = Date.now() - startTime;
      console.log(`📊 TOTAL SUBMISSION TIME: ${totalTime}ms`);

      // Return instant results
      res.json({
        submitted: true,
        result: {
          sessionId: activeSession.id,
          score: updatedSession?.score || 0,
          maxScore: updatedSession?.maxScore || 0,
          percentage: updatedSession?.maxScore ? ((updatedSession?.score || 0) / updatedSession.maxScore) * 100 : 0,
          submittedAt: now.toISOString(),
          questionDetails,
          breakdown: {
            totalQuestions: examQuestions.length,
            answered: studentAnswers.filter(a => a.textAnswer || a.selectedOptionId).length,
            correct: studentAnswers.filter(a => a.isCorrect).length,
            autoScored: studentAnswers.filter(a => a.isCorrect !== null).length
          }
        },
        performance: {
          totalTime,
          scoringTime
        }
      });
    } catch (error: any) {
      console.error('❌ SUBMIT ERROR:', error);
      res.status(500).json({ message: error.message || 'Failed to submit exam' });
    }
  });

  // Get exam question counts
  app.get('/api/exams/question-counts', authenticateUser, async (req, res) => {
    try {
      const examIdsParam = req.query.examIds;
      let examIds: number[] = [];

      if (typeof examIdsParam === 'string') {
        examIds = [parseInt(examIdsParam)];
      } else if (Array.isArray(examIdsParam)) {
        examIds = examIdsParam.map((id) => parseInt(id as string));
      }

      const counts: Record<number, number> = {};

      for (const examId of examIds) {
        const questions = await storage.getExamQuestions(examId);
        counts[examId] = questions.length;
      }

      res.json(counts);
    } catch (error) {
      console.error('Error fetching question counts:', error);
      res.status(500).json({ message: 'Failed to fetch question counts' });
    }
  });

  // Exam questions routes
  // Get exam questions
  app.get('/api/exam-questions/:examId', authenticateUser, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const questions = await storage.getExamQuestions(examId);
      res.json(questions);
    } catch (error) {
      console.error('Error fetching exam questions:', error);
      res.status(500).json({ message: 'Failed to fetch exam questions' });
    }
  });

  // Create exam question
  app.post('/api/exam-questions', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { options, ...questionData } = req.body;

      if (options && Array.isArray(options)) {
        const question = await storage.createExamQuestionWithOptions(questionData, options);
        res.status(201).json(question);
      } else {
        const question = await storage.createExamQuestion(questionData);
        res.status(201).json(question);
      }
    } catch (error: any) {
      console.error('Error creating exam question:', error);
      res.status(500).json({ message: error.message || 'Failed to create exam question' });
    }
  });

  // Update exam question
  app.patch('/api/exam-questions/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.updateExamQuestion(questionId, req.body);

      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.json(question);
    } catch (error) {
      console.error('Error updating exam question:', error);
      res.status(500).json({ message: 'Failed to update exam question' });
    }
  });

  // Delete exam question
  app.delete('/api/exam-questions/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const success = await storage.deleteExamQuestion(questionId);

      if (!success) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting exam question:', error);
      res.status(500).json({ message: 'Failed to delete exam question' });
    }
  });

  // Get question options
  app.get('/api/question-options/:questionId', authenticateUser, async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const options = await storage.getQuestionOptions(questionId);
      res.json(options);
    } catch (error) {
      console.error('Error fetching question options:', error);
      res.status(500).json({ message: 'Failed to fetch question options' });
    }
  });

  // Bulk upload exam questions from CSV
  app.post('/api/exam-questions/bulk', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { examId, questions } = req.body;

      if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
      }

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Questions array is required and must not be empty' });
      }

      console.log(`📤 Bulk upload: ${questions.length} questions for exam ${examId}`);

      // Prepare questions data with examId and order number
      const questionsData = questions.map((q, index) => ({
        question: {
          examId,
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points || 1,
          orderNumber: index + 1,
          instructions: q.instructions,
          sampleAnswer: q.sampleAnswer,
          expectedAnswers: q.expectedAnswers,
        },
        options: q.options || []
      }));

      const result = await storage.createExamQuestionsBulk(questionsData);

      console.log(`✅ Bulk upload complete: ${result.created} created, ${result.errors.length} errors`);

      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error in bulk question upload:', error);
      res.status(500).json({
        message: error.message || 'Failed to upload questions',
        created: 0,
        errors: [error.message || 'Unknown error occurred']
      });
    }
  });

  // Exam Sessions - Student exam taking functionality

  // Start exam - Create new exam session
  app.post('/api/exam-sessions', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { examId } = req.body;
      const studentId = req.user!.id;

      if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
      }

      console.log(`🎯 Starting exam ${examId} for student ${studentId}`);

      // Get exam details to calculate end time
      const exam = await storage.getExamById(examId);

      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      if (!exam.isPublished) {
        return res.status(403).json({ message: 'Exam is not published yet' });
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + (exam.duration || 60) * 60 * 1000);

      const sessionData = {
        examId,
        studentId,
        startedAt: now,
        timeRemaining: (exam.duration || 60) * 60,
        isCompleted: false,
        status: 'in_progress' as const,
        endTime,
        maxScore: exam.totalMarks || 0,
      };

      // Use idempotent session creation to prevent duplicates
      const session = await storage.createOrGetActiveExamSession(examId, studentId, sessionData);

      console.log(`✅ Exam session ${session.wasCreated ? 'created' : 'retrieved'}:`, session.id);

      res.status(201).json(session);
    } catch (error: any) {
      console.error('Error starting exam:', error);
      res.status(500).json({ message: error.message || 'Failed to start exam' });
    }
  });

  // Get active exam session for student
  app.get('/api/exam-sessions/student/:studentId/active', authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;

      // Ensure student can only access their own session
      if (req.user!.id !== studentId && req.user!.role !== ROLES.ADMIN) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const session = await storage.getStudentActiveSession(studentId);

      if (!session) {
        return res.json(null);
      }

      res.json(session);
    } catch (error) {
      console.error('Error fetching active session:', error);
      res.status(500).json({ message: 'Failed to fetch active session' });
    }
  });

  // Get exam session by ID
  app.get('/api/exam-sessions/:id', authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session = await storage.getExamSessionById(sessionId);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Ensure student can only access their own session
      if (req.user!.id !== session.studentId && req.user!.role !== ROLES.ADMIN && req.user!.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      res.json(session);
    } catch (error) {
      console.error('Error fetching exam session:', error);
      res.status(500).json({ message: 'Failed to fetch exam session' });
    }
  });

  // Update exam session metadata (tab switches, violations)
  app.patch('/api/exam-sessions/:id/metadata', authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { metadata } = req.body;

      const session = await storage.updateExamSession(sessionId, { metadata });

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Error updating session metadata:', error);
      res.status(500).json({ message: 'Failed to update session metadata' });
    }
  });

  // Update exam session progress (current question, time remaining)
  app.patch('/api/exam-sessions/:id/progress', authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { currentQuestionIndex, timeRemaining, tabSwitchCount, violationPenalty } = req.body;

      const updates: any = {};

      if (currentQuestionIndex !== undefined) updates.currentQuestionIndex = currentQuestionIndex;
      if (timeRemaining !== undefined) updates.timeRemaining = timeRemaining;
      if (tabSwitchCount !== undefined) updates.tabSwitchCount = tabSwitchCount;
      if (violationPenalty !== undefined) updates.violationPenalty = violationPenalty;

      const session = await storage.updateExamSession(sessionId, updates);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      console.error('Error updating session progress:', error);
      res.status(500).json({ message: 'Failed to update session progress' });
    }
  });

  // Save student answer during exam
  app.post('/api/student-answers', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { sessionId, questionId, selectedOptionId, textAnswer } = req.body;
      const studentId = req.user!.id;

      // Validate required fields
      if (!sessionId || !questionId) {
        return res.status(400).json({ message: 'Missing required fields: sessionId and questionId' });
      }

      // Verify the session belongs to this student
      const session = await storage.getExamSessionById(sessionId);
      if (!session) {
        return res.status(404).json({ message: 'Exam session not found' });
      }

      if (session.studentId !== studentId) {
        return res.status(403).json({ message: 'Unauthorized access to this exam session' });
      }

      if (session.isCompleted) {
        return res.status(409).json({ message: 'Cannot save answer - exam is already completed' });
      }

      // Get the question to validate
      const question = await storage.getExamQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ message: 'Question not found' });
      }

      // CRITICAL SECURITY CHECK: Verify question belongs to the exam in this session
      if (question.examId !== session.examId) {
        return res.status(403).json({ message: 'Question does not belong to this exam' });
      }

      // Prepare answer data based on what was provided
      let answerData: Partial<InsertStudentAnswer> = {};

      if (selectedOptionId !== undefined && selectedOptionId !== null) {
        // Multiple choice answer - validate question type
        if (question.questionType !== 'multiple_choice') {
          return res.status(400).json({ message: 'Cannot submit multiple choice answer for non-MCQ question' });
        }

        const optionId = typeof selectedOptionId === 'number' ? selectedOptionId : parseInt(selectedOptionId);

        const option = await storage.getQuestionOptionById(optionId);
        if (!option) {
          return res.status(400).json({ message: 'Invalid option selected' });
        }

        if (option.questionId !== questionId) {
          return res.status(400).json({ message: 'Selected option does not belong to this question' });
        }

        answerData.selectedOptionId = optionId;
        answerData.textAnswer = null;
      } else if (textAnswer !== undefined) {
        // Text/essay answer - validate question type
        if (question.questionType === 'multiple_choice') {
          return res.status(400).json({ message: 'Cannot submit text answer for multiple choice question' });
        }

        answerData.textAnswer = textAnswer || '';
        answerData.selectedOptionId = null;
      } else {
        return res.status(400).json({ message: 'No answer provided' });
      }

      // Upsert the student answer
      const savedAnswer = await storage.upsertStudentAnswer(
        sessionId,
        questionId,
        answerData
      );

      res.json({ 
        success: true, 
        data: { 
          answerId: savedAnswer.id,
          questionId: savedAnswer.questionId,
          sessionId: savedAnswer.sessionId,
          status: 'saved'
        } 
      });
    } catch (error: any) {
      console.error('Error saving student answer:', error);
      res.status(500).json({ message: error.message || 'Failed to save answer' });
    }
  });

  // Get student answers for a session
  app.get('/api/student-answers/session/:sessionId', authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getExamSessionById(sessionId);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Ensure student can only access their own answers
      if (req.user!.id !== session.studentId && req.user!.role !== ROLES.ADMIN && req.user!.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const answers = await storage.getStudentAnswers(sessionId);
      res.json(answers);
    } catch (error) {
      console.error('Error fetching student answers:', error);
      res.status(500).json({ message: 'Failed to fetch student answers' });
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
              `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000')}/portal/admin/teachers`
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
  // CRITICAL: Session must support cross-domain for Render (backend) + Vercel (frontend)
  const isProduction = process.env.NODE_ENV === 'production';
  const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-session-secret-change-in-production' : process.env.JWT_SECRET || SECRET_KEY);
  
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: SESSION_SECRET not set in production! Using JWT_SECRET as fallback. Set SESSION_SECRET for better security.');
  }
  
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: 'sessionId', // Custom cookie name
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent JavaScript access (XSS protection)
      sameSite: isProduction ? 'none' : 'lax', // 'none' required for cross-domain in production
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/', // Cookie available for all routes
      // DO NOT set domain attribute for cross-domain (Render ↔ Vercel)
    }
  }));

  // Initialize Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Initialize Supabase Storage buckets
  await initializeStorageBuckets();

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
        // Frontend URL Configuration - Environment-aware
        // PRIORITY ORDER:
        // 1. Development (Replit): Use REPLIT_DEV_DOMAIN if available
        // 2. Production: Use FRONTEND_URL env var
        // 3. Fallback: Default production URL
        const REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
        const frontendUrl = REPLIT_DEV_DOMAIN 
          ? `https://${REPLIT_DEV_DOMAIN}` 
          : (process.env.FRONTEND_URL || 'https://treasurehomeschool.vercel.app');
        
        console.log('🔄 OAuth redirect to frontend:', frontendUrl);
        
        if (err) {
          console.error('❌ Google OAuth error:', err);
          console.error('Error details:', { message: err.message, stack: err.stack });
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed&message=` + encodeURIComponent('Authentication failed. Please try again.'));
        }

        if (!user) {
          const message = info?.message || 'Authentication failed';
          console.error('❌ Google OAuth: No user returned. Info:', info);
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed&message=` + encodeURIComponent(message));
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
            return res.redirect(`${frontendUrl}/login?status=pending_verification&role=${roleName.toLowerCase()}`);
          } catch (error) {
            console.error('❌ Error creating pending account:', error);
            return res.redirect(`${frontendUrl}/login?error=account_creation_failed&message=` + encodeURIComponent('Failed to create your account. Please contact the administrator.'));
          }
        }

        // Existing active user - allow login
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error('Login error:', loginErr);
            return res.redirect(`${frontendUrl}/login?error=login_failed&message=` + encodeURIComponent('Failed to complete login'));
          }

          const token = jwt.sign({ userId: user.id, roleId: user.roleId }, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
          res.redirect(`${frontendUrl}/login?token=${token}&provider=google`);
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

  // Classes API endpoint
  app.get('/api/classes', authenticateUser, async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      console.error('Error fetching classes:', error);
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });

  // Subjects API endpoint
  app.get('/api/subjects', authenticateUser, async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  // Academic Terms API endpoints
  app.get('/api/terms', authenticateUser, async (req, res) => {
    try {
      console.log('📅 Fetching academic terms for user:', req.user?.email);
      const terms = await storage.getAcademicTerms();
      console.log(`✅ Found ${terms.length} academic terms`);
      res.json(terms);
    } catch (error) {
      console.error('❌ Error fetching academic terms:', error);
      res.status(500).json({ message: 'Failed to fetch academic terms' });
    }
  });

  app.post('/api/terms', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      console.log('📅 Creating academic term:', req.body);

      // Validate required fields
      if (!req.body.name || !req.body.year || !req.body.startDate || !req.body.endDate) {
        return res.status(400).json({ message: 'Missing required fields: name, year, startDate, endDate' });
      }

      const term = await storage.createAcademicTerm(req.body);
      console.log('✅ Academic term created successfully:', term.id);
      res.json(term);
    } catch (error: any) {
      console.error('❌ Error creating academic term:', error);
      res.status(500).json({ message: error.message || 'Failed to create academic term' });
    }
  });

  app.put('/api/terms/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);

      if (isNaN(termId)) {
        return res.status(400).json({ message: 'Invalid term ID' });
      }

      console.log('📅 Updating academic term:', termId, req.body);

      // Check if term exists first
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        console.warn(`⚠️ Term ${termId} not found for update`);
        return res.status(404).json({ message: 'Academic term not found' });
      }

      const term = await storage.updateAcademicTerm(termId, req.body);
      console.log('✅ Academic term updated successfully:', term?.id);
      res.json(term);
    } catch (error: any) {
      console.error('❌ Error updating academic term:', error);
      res.status(500).json({ message: error.message || 'Failed to update academic term' });
    }
  });

  app.delete('/api/terms/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);

      if (isNaN(termId)) {
        return res.status(400).json({ message: 'Invalid term ID' });
      }

      console.log('📅 DELETE REQUEST: Attempting to delete academic term:', termId);

      const success = await storage.deleteAcademicTerm(termId);

      if (!success) {
        console.error(`❌ DELETE FAILED: Term ${termId} deletion returned false`);
        return res.status(500).json({
          message: 'Failed to delete academic term. The term may not exist or could not be removed from the database.'
        });
      }

      console.log('✅ DELETE SUCCESS: Academic term deleted:', termId);
      res.json({
        message: 'Academic term deleted successfully',
        id: termId,
        success: true
      });
    } catch (error: any) {
      console.error('❌ DELETE ERROR:', error);

      // Handle specific errors
      if (error.code === '23503' || error.message?.includes('linked to it')) {
        return res.status(400).json({
          message: error.message || 'Cannot delete this term because it is being used by other records.'
        });
      }

      res.status(500).json({
        message: error.message || 'Failed to delete academic term',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      });
    }
  });

  app.put('/api/terms/:id/mark-current', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);

      if (isNaN(termId)) {
        return res.status(400).json({ message: 'Invalid term ID' });
      }

      console.log('📅 Marking term as current:', termId);

      // Check if term exists first
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        console.warn(`⚠️ Term ${termId} not found`);
        return res.status(404).json({ message: 'Academic term not found' });
      }

      const term = await storage.markTermAsCurrent(termId);
      console.log('✅ Term marked as current successfully:', term?.id);
      res.json(term);
    } catch (error: any) {
      console.error('❌ Error marking term as current:', error);
      res.status(500).json({ message: error.message || 'Failed to mark term as current' });
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

      let fileUrl: string;

      // Use Supabase Storage if enabled, otherwise fall back to local filesystem
      if (isSupabaseStorageEnabled) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const uploadResult = await uploadFileToSupabase(
          STORAGE_BUCKETS.PROFILES,
          fileName,
          req.file.buffer,
          req.file.mimetype
        );

        if (!uploadResult) {
          return res.status(500).json({ message: 'Failed to upload file to cloud storage' });
        }

        fileUrl = uploadResult.publicUrl;
        console.log(`📦 Profile image uploaded to Supabase Storage: ${fileUrl}`);
      } else {
        fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
        console.log(`💾 Profile image saved to local filesystem: ${fileUrl}`);
      }

      res.json({ url: fileUrl });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  // ==================== HOMEPAGE CONTENT MANAGEMENT ROUTES ====================
  
  // Homepage image upload endpoint
  app.post('/api/upload/homepage', authenticateUser, authorizeRoles(ROLES.ADMIN), upload.single('homePageImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { contentType, altText, caption, displayOrder } = req.body;

      if (!contentType) {
        return res.status(400).json({ message: 'Content type is required' });
      }

      let fileUrl: string;

      // Use Supabase Storage if enabled, otherwise fall back to local filesystem
      if (isSupabaseStorageEnabled) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const uploadResult = await uploadFileToSupabase(
          STORAGE_BUCKETS.HOMEPAGE,
          fileName,
          req.file.buffer,
          req.file.mimetype
        );

        if (!uploadResult) {
          return res.status(500).json({ message: 'Failed to upload file to cloud storage' });
        }

        fileUrl = uploadResult.publicUrl;
        console.log(`📦 Uploaded to Supabase Storage: ${fileUrl}`);
      } else {
        fileUrl = `/${req.file.path.replace(/\\/g, '/')}`;
        console.log(`💾 Saved to local filesystem: ${fileUrl}`);
      }

      // Create homepage content record
      const content = await storage.createHomePageContent({
        contentType,
        imageUrl: fileUrl,
        altText: altText || '',
        caption: caption || null,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: true,
        uploadedBy: req.user!.id
      });

      res.json({
        message: 'Homepage image uploaded successfully',
        content
      });
    } catch (error) {
      console.error('Homepage image upload error:', error);
      res.status(500).json({ message: 'Failed to upload homepage image' });
    }
  });

  // Get all homepage content
  app.get('/api/homepage-content', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { contentType } = req.query;
      const content = await storage.getHomePageContent(contentType as string);
      res.json(content);
    } catch (error) {
      console.error('Get homepage content error:', error);
      res.status(500).json({ message: 'Failed to get homepage content' });
    }
  });

  // Update homepage content
  app.put('/api/homepage-content/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { altText, caption, displayOrder, isActive } = req.body;

      const updated = await storage.updateHomePageContent(id, {
        altText,
        caption,
        displayOrder,
        isActive
      });

      if (!updated) {
        return res.status(404).json({ message: 'Homepage content not found' });
      }

      res.json({
        message: 'Homepage content updated successfully',
        content: updated
      });
    } catch (error) {
      console.error('Update homepage content error:', error);
      res.status(500).json({ message: 'Failed to update homepage content' });
    }
  });

  // Delete homepage content
  app.delete('/api/homepage-content/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the content first to retrieve the image URL
      const contentList = await storage.getHomePageContent();
      const content = contentList.find((c: any) => c.id === id);
      
      if (!content) {
        return res.status(404).json({ message: 'Homepage content not found' });
      }

      // Delete file from Supabase Storage if enabled
      if (isSupabaseStorageEnabled && content.imageUrl) {
        const filePath = extractFilePathFromUrl(content.imageUrl);
        if (filePath) {
          await deleteFileFromSupabase(STORAGE_BUCKETS.HOMEPAGE, filePath);
          console.log(`🗑️ Deleted from Supabase Storage: ${filePath}`);
        }
      }

      const deleted = await storage.deleteHomePageContent(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Homepage content not found' });
      }

      res.json({ message: 'Homepage content deleted successfully' });
    } catch (error) {
      console.error('Delete homepage content error:', error);
      res.status(500).json({ message: 'Failed to delete homepage content' });
    }
  });

  // Public homepage content endpoint (no auth required for public website)
  app.get('/api/homepage-content/:contentType', async (req, res) => {
    try {
      const { contentType } = req.params;
      const content = await storage.getHomePageContent(contentType);
      res.json(content);
    } catch (error) {
      console.error('Get public homepage content error:', error);
      res.status(500).json({ message: 'Failed to get homepage content' });
    }
  });

  // ==================== END HOMEPAGE CONTENT MANAGEMENT ROUTES ====================

  // Public file serving for homepage uploads (no auth required)
  app.get('/uploads/homepage/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = path.resolve('uploads', 'homepage', filename);

    // Security: Prevent path traversal attacks
    if (!filePath.startsWith(path.resolve('uploads', 'homepage'))) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ message: "File not found" });
      }
    });
  });

  // Secure file serving for other uploads - require authentication
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

      // Try to find user by email or username FIRST to check suspension
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
      const resetLink = `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000')}/reset-password?token=${resetToken}`;

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
      const inviteLink = `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000')}/invite/${token}`;

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

  // Health check endpoint for monitoring
  app.get("/api/health", async (_req, res) => {
    try {
      // Simple database connection check using raw SQL
      await db.execute(sql`SELECT 1`);
      
      res.json({
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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
      await storage.updateUser(id, {
        passwordHash,
        mustChangePassword: forceChange
      });

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
      const { passwordHash: _, ...safeUser } = user; // Keeping the original user object to get email/username

      res.json({
        message: `Password reset successfully${forceChange ? '. User must change password on next login.' : ''}`,
        user: { ...safeUser, email: user.email, username: user.username }, // Include email/username for response
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
      const { users, createdCredentials } = req.body;

      if (!users || !Array.isArray(users) || users.length === 0) {
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
          '© 2024 Treasure-Home School | "Honesty and Success" | treasurehomeschool@gmail.com',
          50,
          doc.page.height - 80,
          { align: 'center', width: 495 }
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

      // Get all students to calculate next number
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
        const studentData = {
          id: user.id, // Use the same ID as the user
          admissionNumber: `THS/${currentYear.slice(-2)}/${String(nextNumber).padStart(4, '0')}`, // THS/25/001 format
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
            admissionNumber: `THS/${currentYear.slice(-2)}/${String(nextNumber).padStart(4, '0')}`, // THS/25/001 format
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

  // Preview CSV import (validate and return preview)
  app.post('/api/admin/import/preview', authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const csvContent = await fs.readFile(req.file.path, 'utf-8');
      const { previewCSVImport } = await import('./csv-import-service');

      const preview = await previewCSVImport(csvContent);

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json(preview);
    } catch (error: any) {
      console.error('CSV preview error:', error);
      res.status(500).json({ message: error.message || 'Failed to preview CSV' });
    }
  });

  // Preview CSV import (student endpoint - same as admin/import/preview)
  app.post('/api/students/csv-preview', authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const csvContent = await fs.readFile(req.file.path, 'utf-8');
      const { previewCSVImport } = await import('./csv-import-service');

      const preview = await previewCSVImport(csvContent);

      // Clean up uploaded file
      await fs.unlink(req.file.path);

      res.json(preview);
    } catch (error: any) {
      console.error('CSV preview error:', error);
      res.status(500).json({ message: error.message || 'Failed to preview CSV' });
    }
  });

  // Commit CSV import (create users from validated CSV)
  app.post('/api/students/csv-commit', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { validRows } = req.body;

      if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
        return res.status(400).json({ message: 'No valid rows to import' });
      }

      const { commitCSVImport } = await import('./csv-import-service');
      const adminUserId = req.user!.id;

      const result = await commitCSVImport(validRows, adminUserId);

      // Log audit event
      await storage.createAuditLog({
        userId: adminUserId,
        action: 'bulk_student_import',
        entityType: 'student',
        entityId: BigInt(0), // Bulk operation
        newValue: JSON.stringify({ count: result.successCount, failed: result.failedRows.length }),
        reason: `Bulk imported ${result.successCount} students via CSV`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || null
      });

      res.json({
        message: `Successfully imported ${result.successCount} students`,
        successCount: result.successCount,
        failedRows: result.failedRows,
        credentials: result.credentials
      });
    } catch (error: any) {
      console.error('CSV commit error:', error);
      res.status(500).json({ message: error.message || 'Failed to import students' });
    }
  });

  // ==================== STUDENT PROFILE ROUTES ====================

  // Get student profile by ID
  app.get('/api/students/:id', authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      
      // Ensure student can only access their own profile (or admin/teacher can access)
      if (req.user!.id !== studentId && req.user!.role !== ROLES.ADMIN && req.user!.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Failed to fetch student data' });
    }
  });

  // Get student's assigned classes
  app.get('/api/students/:id/classes', authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      
      // Ensure student can only access their own classes (or admin/teacher can access)
      if (req.user!.id !== studentId && req.user!.role !== ROLES.ADMIN && req.user!.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const classes = await storage.getStudentClasses(studentId);
      res.json(classes);
    } catch (error) {
      console.error('Error fetching student classes:', error);
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });

  // Update student profile
  app.patch('/api/students/:id', authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      
      // Ensure student can only update their own profile (or admin can update)
      if (req.user!.id !== studentId && req.user!.role !== ROLES.ADMIN) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const updates = req.body;
      
      // Update student record
      const updatedStudent = await storage.updateStudent(studentId, updates);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: 'Failed to update student profile' });
    }
  });

  // Get student profile status (check if profile is complete)
  app.get('/api/student/profile/status', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const student = await storage.getStudent(studentId);

      const status = {
        hasProfile: !!student,
        isComplete: !!(student?.phone && student?.address),
        firstLogin: student?.firstLogin !== false
      };

      res.json(status);
    } catch (error) {
      console.error('Error checking student profile status:', error);
      res.status(500).json({ message: 'Failed to check profile status' });
    }
  });

  // Student profile setup (first-time login)
  app.post('/api/student/profile/setup', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const studentId = req.user!.id;
      const profileData = req.body;

      // Update student record with profile information
      const updatedStudent = await storage.updateStudent(studentId, {
        ...profileData,
        firstLogin: false
      });

      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json({ 
        message: 'Profile setup completed successfully',
        student: updatedStudent 
      });
    } catch (error) {
      console.error('Error setting up student profile:', error);
      res.status(500).json({ message: 'Failed to setup profile' });
    }
  });

  // ==================== END STUDENT PROFILE ROUTES ====================


  // ==================== STUDENT SELF-REGISTRATION ROUTES ====================

  // Import registration utilities
  const {
    validateRegistrationData,
    checkParentExists,
    generateStudentUsername,
    generateParentUsername,
    generateTempPassword
  } = await import('./registration-utils');
  
  // Import email notifications
  const { sendParentNotificationEmail, sendParentNotificationSMS } = await import('./email-notifications');

  // Rate limiting store for registration attempts
  const registrationAttempts = new Map<string, { count: number; lastAttempt: number }>();

  // Rate limit middleware for registration
  function checkRegistrationRateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 10 * 60 * 1000; // 10 minutes
    const maxAttempts = 5;

    const attempts = registrationAttempts.get(ip);
    
    if (attempts) {
      // Reset if window expired
      if (now - attempts.lastAttempt > windowMs) {
        registrationAttempts.set(ip, { count: 1, lastAttempt: now });
        return next();
      }

      if (attempts.count >= maxAttempts) {
        return res.status(429).json({ 
          message: 'Too many registration attempts. Please try again in 10 minutes.' 
        });
      }

      attempts.count++;
      attempts.lastAttempt = now;
    } else {
      registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    }

    next();
  }

  // POST /api/self-register/student/preview - Preview registration details
  app.post('/api/self-register/student/preview', checkRegistrationRateLimit, async (req, res) => {
    try {
      const data = req.body;
      const errors = validateRegistrationData(data);

      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      // Generate suggested username
      const suggestedUsername = await generateStudentUsername(data.classCode);

      // Check if parent exists
      const parentCheck = await checkParentExists(data.parentEmail);

      res.json({
        suggestedUsername,
        parentExists: parentCheck.exists,
        errors: []
      });
    } catch (error) {
      console.error('Error in registration preview:', error);
      res.status(500).json({ 
        errors: ['Failed to generate preview. Please try again.'] 
      });
    }
  });

  // POST /api/self-register/student/commit - Complete registration
  app.post('/api/self-register/student/commit', checkRegistrationRateLimit, async (req, res) => {
    try {
      const { fullName, classCode, gender, dateOfBirth, parentEmail, parentPhone, password } = req.body;

      // Validate registration data
      const errors = validateRegistrationData({ fullName, classCode, gender, dateOfBirth, parentEmail, parentPhone });
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }

      // Validate password
      if (!password || password.length < 6) {
        return res.status(400).json({ errors: ['Password must be at least 6 characters'] });
      }

      // Check if registration is allowed (default to true if setting doesn't exist)
      try {
        const setting = await storage.getSetting('allow_student_self_registration');
        if (setting && setting.value === 'false') {
          return res.status(403).json({ 
            errors: ['Student self-registration is currently disabled'] 
          });
        }
      } catch (error) {
        // If settings table doesn't exist or query fails, allow registration by default
        console.warn('Could not check registration setting, allowing by default:', error);
      }

      // Get student role
      const studentRole = await storage.getRoleByName('student');
      const parentRole = await storage.getRoleByName('parent');
      if (!studentRole || !parentRole) {
        return res.status(500).json({ errors: ['System configuration error'] });
      }

      // Split full name
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;

      // Generate student username
      const studentUsername = await generateStudentUsername(classCode);

      // Check if parent exists and create if needed
      let parentUserId: string;
      let parentCreated = false;
      let parentUsername: string | undefined;
      let parentPassword: string | undefined;

      const parentCheck = await checkParentExists(parentEmail);

      if (parentCheck.exists && parentCheck.userId) {
        // Link to existing parent
        parentUserId = parentCheck.userId;
      } else {
        // Create new parent user
        parentUsername = generateParentUsername();
        parentPassword = generateTempPassword();
        const parentPasswordHash = await bcrypt.hash(parentPassword, 10);

        const parentUser = await storage.createUser({
          username: parentUsername,
          email: parentEmail,
          passwordHash: parentPasswordHash,
          mustChangePassword: true,
          roleId: parentRole.id,
          firstName: `Parent of ${firstName}`,
          lastName: lastName,
          phone: parentPhone || '',
          isActive: true,
          status: 'active',
          createdVia: 'self',
          profileCompleted: false
        });

        parentUserId = parentUser.id;
        parentCreated = true;

        // Create parent profile
        await storage.createParentProfile({
          userId: parentUserId,
          linkedStudents: []
        });
      }

      // Hash student password
      const studentPasswordHash = await bcrypt.hash(password, 10);

      // Create student user
      const studentUser = await storage.createUser({
        username: studentUsername,
        email: parentEmail, // Use parent email for recovery
        passwordHash: studentPasswordHash,
        mustChangePassword: true,
        roleId: studentRole.id,
        firstName,
        lastName,
        dateOfBirth: dateOfBirth,
        gender: gender as 'Male' | 'Female' | 'Other',
        isActive: true,
        status: 'active',
        createdVia: 'self',
        profileCompleted: false
      });

      // Get the class by code (name)
      const classes = await storage.getAllClasses();
      const studentClass = classes.find(c => c.name === classCode);

      // Create student record
      await storage.createStudent({
        id: studentUser.id,
        admissionNumber: `ADM-${new Date().getFullYear()}-${studentUsername.split('-').pop()}`,
        classId: studentClass?.id || null,
        parentId: parentUserId
      });

      // Update parent profile to link student
      const parentProfile = await storage.getParentProfile(parentUserId);
      if (parentProfile) {
        const linkedStudents = parentProfile.linkedStudents || [];
        await storage.updateParentProfile(parentUserId, {
          linkedStudents: [...linkedStudents, studentUser.id]
        });
      }

      // Send notification to parent if new account was created
      if (parentCreated && parentUsername && parentPassword) {
        try {
          // Send email notification
          if (parentEmail) {
            await sendParentNotificationEmail({
              parentEmail: parentEmail,
              parentUsername,
              parentPassword,
              studentName: fullName,
              studentUsername
            });
          }
          
          // Send SMS notification if phone is provided
          if (parentPhone) {
            await sendParentNotificationSMS(parentPhone, parentUsername, parentPassword);
          }
        } catch (error) {
          console.error('Failed to send parent notification:', error);
          // Don't fail the registration if notification fails
        }
      }

      // Create audit log
      await storage.createAuditLog({
        userId: null,
        action: 'student_self_register',
        entityType: 'student',
        entityId: 0,
        oldValue: null,
        newValue: JSON.stringify({ studentUsername, parentCreated, classCode }),
        reason: 'Student self-registration',
        ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
      });

      // Return response with credentials (show parent password only once)
      res.json({
        studentUsername,
        parentCreated,
        parentUsername: parentCreated ? parentUsername : undefined,
        parentPassword: parentCreated ? parentPassword : undefined,
        message: 'Registration successful! Please save your credentials.'
      });

    } catch (error) {
      console.error('Error in registration commit:', error);
      res.status(500).json({ 
        errors: ['Registration failed. Please try again.'] 
      });
    }
  });

  // GET /api/self-register/status/:username - Check registration status
  app.get('/api/self-register/status/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ 
          exists: false,
          message: 'User not found' 
        });
      }

      res.json({
        exists: true,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive
      });
    } catch (error) {
      console.error('Error checking registration status:', error);
      res.status(500).json({ message: 'Failed to check status' });
    }
  });

  // ==================== END STUDENT SELF-REGISTRATION ROUTES ====================

  // ==================== JOB VACANCY SYSTEM ROUTES ====================

  // Public routes - Job Vacancies (no auth required)
  app.get('/api/vacancies', async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const vacancies = await storage.getAllVacancies(status);
      res.json(vacancies);
    } catch (error) {
      console.error('Error fetching vacancies:', error);
      res.status(500).json({ message: 'Failed to fetch vacancies' });
    }
  });

  app.get('/api/vacancies/:id', async (req: Request, res: Response) => {
    try {
      const vacancy = await storage.getVacancy(req.params.id);
      if (!vacancy) {
        return res.status(404).json({ message: 'Vacancy not found' });
      }
      res.json(vacancy);
    } catch (error) {
      console.error('Error fetching vacancy:', error);
      res.status(500).json({ message: 'Failed to fetch vacancy' });
    }
  });

  // Teacher Application Submission (public)
  const teacherApplicationSchema = z.object({
    vacancyId: z.string().optional().nullable(),
    fullName: z.string().min(1),
    googleEmail: z.string().email().regex(/@gmail\.com$/, 'Must be a Gmail address'),
    phone: z.string().min(1),
    subjectSpecialty: z.string().min(1),
    qualification: z.string().min(1),
    experienceYears: z.number().min(0),
    bio: z.string().min(1),
    resumeUrl: z.string().optional().nullable(),
  });

  app.post('/api/teacher-applications', async (req: Request, res: Response) => {
    try {
      const validatedData = teacherApplicationSchema.parse(req.body);

      // Check if email already has a pending or approved application
      const existingApplications = await storage.getAllTeacherApplications();
      const existingApp = existingApplications.find(
        app => app.googleEmail === validatedData.googleEmail && 
        (app.status === 'pending' || app.status === 'approved')
      );

      if (existingApp) {
        return res.status(400).json({ 
          message: existingApp.status === 'approved' 
            ? 'This email has already been approved' 
            : 'You already have a pending application' 
        });
      }

      const application = await storage.createTeacherApplication(validatedData);
      
      // Create notification for admins
      const admins = await storage.getUsersByRole(ROLES.ADMIN);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: 'teacher_application',
          title: 'New Teacher Application',
          message: `${validatedData.fullName} has applied for a teaching position`,
          relatedEntityType: 'teacher_application',
          relatedEntityId: application.id,
        });
      }

      res.status(201).json({ 
        message: 'Application submitted successfully. You will be notified once reviewed.',
        application 
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error('Error submitting teacher application:', error);
      res.status(500).json({ message: 'Failed to submit application' });
    }
  });

  // Admin-only routes for managing vacancies
  app.post('/api/admin/vacancies', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
    try {
      const vacancy = await storage.createVacancy({
        ...req.body,
        createdBy: req.user!.id,
      });
      res.status(201).json(vacancy);
    } catch (error) {
      console.error('Error creating vacancy:', error);
      res.status(500).json({ message: 'Failed to create vacancy' });
    }
  });

  app.patch('/api/admin/vacancies/:id/close', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
    try {
      const vacancy = await storage.updateVacancy(req.params.id, { status: 'closed' });
      if (!vacancy) {
        return res.status(404).json({ message: 'Vacancy not found' });
      }
      res.json(vacancy);
    } catch (error) {
      console.error('Error closing vacancy:', error);
      res.status(500).json({ message: 'Failed to close vacancy' });
    }
  });

  // Admin routes for managing teacher applications
  app.get('/api/admin/applications', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
    try {
      const status = req.query.status as string | undefined;
      const applications = await storage.getAllTeacherApplications(status);
      res.json(applications);
    } catch (error) {
      console.error('Error fetching teacher applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  });

  app.patch('/api/admin/applications/:id/status', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
    try {
      const { status } = req.body;
      
      if (status === 'approved') {
        const result = await storage.approveTeacherApplication(req.params.id, req.user!.id);
        
        // Create notification for the applicant (if they have an account)
        const applicantUser = await storage.getUserByEmail(result.application.googleEmail);
        if (applicantUser) {
          await storage.createNotification({
            userId: applicantUser.id,
            type: 'application_approved',
            title: 'Application Approved',
            message: 'Your teacher application has been approved. You can now sign in with Google.',
            relatedEntityType: 'teacher_application',
            relatedEntityId: result.application.id,
          });
        }

        res.json({ 
          message: 'Application approved successfully',
          ...result 
        });
      } else if (status === 'rejected') {
        const { reason } = req.body;
        const application = await storage.rejectTeacherApplication(req.params.id, req.user!.id, reason || 'No reason provided');
        if (!application) {
          return res.status(404).json({ message: 'Application not found' });
        }

        res.json({ 
          message: 'Application rejected',
          application 
        });
      } else {
        res.status(400).json({ message: 'Invalid status' });
      }
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Failed to update application' });
    }
  });

  // Get approved teachers (admin only)
  app.get('/api/admin/approved-teachers', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
    try {
      const approvedTeachers = await storage.getAllApprovedTeachers();
      res.json(approvedTeachers);
    } catch (error) {
      console.error('Error fetching approved teachers:', error);
      res.status(500).json({ message: 'Failed to fetch approved teachers' });
    }
  });

  // ==================== END JOB VACANCY SYSTEM ROUTES ====================

  // ==================== END MODULE 1 ROUTES ====================

  // Catch-all for non-API routes - redirect to frontend (PRODUCTION ONLY)
  // In development, Vite dev server handles this
  // In production with FRONTEND_URL set, redirect to separate frontend
  if (process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL) {
    app.get('*', (req: Request, res: Response) => {
      // Only handle non-API routes
      if (!req.path.startsWith('/api/') && !req.path.startsWith('/uploads/')) {
        const frontendUrl = process.env.FRONTEND_URL;
        res.status(200).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Treasure Home School - Backend API</title>
              <meta http-equiv="refresh" content="3;url=${frontendUrl}">
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  margin: 0;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                }
                .container {
                  text-align: center;
                  padding: 2rem;
                  background: rgba(255, 255, 255, 0.1);
                  border-radius: 12px;
                  backdrop-filter: blur(10px);
                }
                h1 { margin: 0 0 1rem 0; }
                a {
                  color: #ffd700;
                  text-decoration: none;
                  font-weight: bold;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>🎓 Treasure Home School</h1>
                <p>This is the backend API server.</p>
                <p>Redirecting you to the main website...</p>
                <p><a href="${frontendUrl}">Click here if not redirected automatically</a></p>
              </div>
            </body>
          </html>
        `);
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}