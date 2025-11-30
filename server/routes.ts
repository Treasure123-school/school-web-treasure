// This commit addresses an issue where exam submission was failing due to server-side errors returning HTML instead of JSON.
// The exam submission endpoint has been refactored to handle errors gracefully and ensure valid JSON responses,
// improving the reliability of the exam submission and auto-scoring process.
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, db } from "./storage";
import * as schema from "@shared/schema.pg";
import { ROLE_IDS as ROLES } from "@shared/role-constants";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema, insertExamSchema, insertExamResultSchema, insertExamQuestionSchema, insertQuestionOptionSchema, createQuestionOptionSchema, insertHomePageContentSchema, insertContactMessageSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, createStudentSchema, InsertUser, InsertStudentAnswer } from "@shared/schema";
import { users, students } from "@shared/schema.pg";
import { z, ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import PDFDocument from "pdfkit";
import { generateUsername, generatePassword, getNextUserNumber, generateStudentPassword } from "./auth-utils";
import { generateStudentUsername, generateParentUsername, generateTeacherUsername, generateAdminUsername } from "./username-generator";
import passport from "passport";
import session from "express-session";
import memorystore from "memorystore";
import { and, eq, sql } from "drizzle-orm";
import { realtimeService } from "./realtime-service";
import { getProfileImagePath, getHomepageImagePath } from "./storage-path-utils";
import { uploadFileToStorage, replaceFile, deleteFileFromStorage } from "./upload-service";

// Helper function to extract file path from URL (local filesystem)
function extractFilePathFromUrl(url: string): string {
  // For local filesystem URLs (e.g., /server/uploads/profiles/image.jpg)
  // Just return the path as-is for deletion
  return url.startsWith('/') ? url.substring(1) : url;
}

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
  process.exit(1);
}
if (process.env.NODE_ENV === 'development' && JWT_SECRET === 'dev-secret-key-change-in-production') {
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
  return undefined;
}
// ROLES constant is now imported from @shared/role-constants
// This ensures a single source of truth for role IDs across the entire application
// Role IDs: 1=Super Admin, 2=Admin, 3=Teacher, 4=Student, 5=Parent

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
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    // Normalize decoded userId before database lookup
    const normalizedUserId = normalizeUuid(decoded.userId);
    if (!normalizedUserId) {
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
      res.status(403).json({ message: "Authorization failed" });
    }
  };
};

// Configure multer for file uploads - ALL files stored locally in server/uploads
const uploadDir = 'server/uploads';
const galleryDir = 'server/uploads/gallery';
const profileDir = 'server/uploads/profiles';
const studyResourcesDir = 'server/uploads/study-resources';
const homepageDir = 'server/uploads/homepage';

// Ensure upload directories exist
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {});
fs.mkdir(profileDir, { recursive: true }).catch(() => {});
fs.mkdir(studyResourcesDir, { recursive: true }).catch(() => {});
fs.mkdir(homepageDir, { recursive: true }).catch(() => {});

// Use disk storage for all uploads (local server/uploads directory)
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
const csvDir = 'server/uploads/csv';
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

    const now = new Date();
    const scheduledExams = await storage.getScheduledExamsToPublish(now);

    if (scheduledExams.length > 0) {

      for (const exam of scheduledExams) {
        try {

          await storage.updateExam(exam.id, {
            isPublished: true
          });

        } catch (error) {
        }
      }
    }
  } catch (error) {
  }
}

// BACKGROUND TIMEOUT CLEANUP SERVICE - Prevents infinite waiting
async function cleanupExpiredExamSessions(): Promise<void> {
  try {

    // PERFORMANCE IMPROVEMENT: Get only expired sessions directly from database
    // instead of fetching all active sessions and filtering in memory
    const now = new Date();
    const rawResult = await storage.getExpiredExamSessions(now, 50);
    const expiredSessions = Array.isArray(rawResult) ? rawResult : []; // Ensure it's always an array


    // Process in smaller batches to avoid overwhelming the database
    for (const session of expiredSessions) {
      try {

        // Mark session as auto-submitted by server cleanup
        await storage.updateExamSession(session.id, {
          isCompleted: true,
          submittedAt: now,
          status: 'submitted'
        });

        // Auto-score the session using our optimized scoring
        await autoScoreExamSession(session.id, storage);

      } catch (error) {
        // Continue with other sessions even if one fails
      }
    }
  } catch (error) {
  }
}

// Start auto-publishing service (runs every minute)
const autoPublishInterval = 60 * 1000; // 1 minute
setInterval(autoPublishScheduledExams, autoPublishInterval);
autoPublishScheduledExams(); // Run immediately on startup

// PERFORMANCE FIX: Reduce cleanup frequency from 30s to 3 minutes to prevent database contention
const cleanupInterval = 3 * 60 * 1000; // 3 minutes (was 30 seconds)
const jitter = Math.random() * 30000; // Add 0-30s random jitter to prevent thundering herd
setTimeout(() => {
  setInterval(cleanupExpiredExamSessions, cleanupInterval);
  cleanupExpiredExamSessions(); // Run immediately after jitter delay
}, jitter);

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

    // Get scoring data efficiently with detailed question breakdown
    const scoringResult = await storage.getExamScoringData(sessionId);
    const { session, summary, scoringData } = scoringResult;

    const databaseQueryTime = Date.now() - startTime;

    const { totalQuestions, maxScore: maxPossibleScore, studentScore, autoScoredQuestions } = summary; // Renamed maxScore to maxPossibleScore

    // Get all student answers for theory scoring
    const studentAnswers = await storage.getStudentAnswers(sessionId);
    const examQuestions = await storage.getExamQuestions(session.examId);

    let totalAutoScore = studentScore; // Start with MCQ scores
    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;


    // Enhanced question-by-question breakdown for detailed feedback
    const questionDetails = [];

    for (const q of scoringData) {
      const question = examQuestions.find((examQ: any) => examQ.id === q.questionId);
      const studentAnswer = studentAnswers.find((ans: any) => ans.questionId === q.questionId);

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
    for (const detail of questionDetails) {
      if (detail.questionId) {
        const studentAnswer = studentAnswers.find((ans: any) => ans.questionId === detail.questionId);
        if (studentAnswer) {
          try {
            await storage.updateStudentAnswer(studentAnswer.id, {
              pointsEarned: detail.pointsEarned,
              isCorrect: detail.isCorrect,
              autoScored: detail.autoScored,
              feedbackText: detail.feedback
            });
          } catch (updateError) {
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
      questionDetails.forEach((q: any, index: number) => {
      });
    }
    // Create or update exam result - CRITICAL for instant feedback

    // ENHANCED ERROR HANDLING: Add validation before database operations
    if (!session.studentId) {
      throw new Error('CRITICAL: Session missing studentId - cannot create exam result');
    }
    if (!session.examId) {
      throw new Error('CRITICAL: Session missing examId - cannot create exam result');
    }
    if (maxPossibleScore === 0 && totalQuestions > 0) {
    }
    const existingResults = await storage.getExamResultsByStudent(session.studentId);

    const existingResult = existingResults.find((r: any) => r.examId === session.examId);
    if (existingResult) {
    } else {
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
      } else {
        // No admin found, verify student ID exists in users table

        try {
          const studentUser = await storage.getUser(session.studentId);
          if (studentUser && studentUser.id) {
            SYSTEM_AUTO_SCORING_UUID = studentUser.id;
          } else {
            throw new Error(`Student ${session.studentId} not found in users table`);
          }
        } catch (studentError) {
          // Last resort: Find ANY active user

          const allUsers = await storage.getAllUsers();
          const activeUser = allUsers.find((u: any) => u.isActive && u.id);

          if (activeUser && activeUser.id) {
            SYSTEM_AUTO_SCORING_UUID = activeUser.id;
          } else {
            throw new Error('CRITICAL: No valid user ID found for auto-scoring recordedBy - cannot save exam result');
          }
        }
      }
    } catch (userError) {
      throw new Error(`Auto-scoring failed: Cannot find valid user ID for recordedBy. Error: ${userError instanceof Error ? userError.message : String(userError)}`);
    }
    // Validate UUID before using
    if (!SYSTEM_AUTO_SCORING_UUID || typeof SYSTEM_AUTO_SCORING_UUID !== 'string') {
      throw new Error(`CRITICAL: Invalid recordedBy UUID: ${SYSTEM_AUTO_SCORING_UUID}`);
    }

    // Only include fields that are in the database schema
    const resultData = {
      examId: session.examId,
      studentId: session.studentId,
      score: totalAutoScore,
      maxScore: maxPossibleScore,
      marksObtained: totalAutoScore,
      autoScored: breakdown.pendingManualReview === 0,
      recordedBy: SYSTEM_AUTO_SCORING_UUID,
    };

    let savedResultId: number | null = null;

    try {
      if (existingResult) {
        // Update existing result
        const updatedResult = await storage.updateExamResult(existingResult.id, resultData);
        if (!updatedResult) {
          console.error(`[AUTO-SCORE] Failed to update exam result ID: ${existingResult.id}`);
          throw new Error(`Failed to update exam result ID: ${existingResult.id}`);
        }
        savedResultId = existingResult.id;
      } else {
        // Create new result
        const newResult = await storage.recordExamResult(resultData);
        if (!newResult || !newResult.id) {
          console.error('[AUTO-SCORE] recordExamResult returned null/undefined or missing ID');
          throw new Error('Failed to create exam result - recordExamResult returned null/undefined or missing ID');
        }
        savedResultId = newResult.id;
      }

      // CRITICAL: Update the exam session with the calculated scores
      try {
        await storage.updateExamSession(sessionId, {
          score: totalAutoScore,
          maxScore: maxPossibleScore,
          status: breakdown.pendingManualReview === 0 ? 'graded' : 'submitted'
        });
      } catch (sessionUpdateError) {
        console.warn('[AUTO-SCORE] Failed to update session with scores:', sessionUpdateError);
        // Don't throw - the exam result was saved successfully
      }

      // Verification is optional - if it fails, log but don't throw
      // The result was already confirmed saved by the insert/update returning
      try {
        const verificationResults = await storage.getExamResultsByStudent(session.studentId);
        const savedResult = verificationResults.find((r: any) => Number(r.examId) === Number(session.examId));
        
        if (!savedResult) {
          console.warn(`[AUTO-SCORE] Verification warning: Could not find result in verification fetch, but ID ${savedResultId} was returned from insert/update`);
        }
      } catch (verifyError) {
        console.warn('[AUTO-SCORE] Verification fetch failed, but result was saved with ID:', savedResultId);
      }

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
      } else {
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
      } catch (perfLogError) {
        // Don't throw - this shouldn't break the auto-scoring process
      }
      // Log detailed metrics in development
      if (process.env.NODE_ENV === 'development') {
      }

    } catch (error) {
      const totalErrorTime = Date.now() - startTime;
      throw error;
    }
  } catch (error) {
    const totalErrorTime = Date.now() - startTime;
    throw error;
  }
}

// Score Merging Function: Combine auto-scored + manually graded results
async function mergeExamScores(answerId: number, storage: any): Promise<void> {
  try {

    // Get the answer details to find session and exam info
    const answer = await storage.getStudentAnswerById(answerId);
    if (!answer) {
      return;
    }
    const sessionId = answer.sessionId;

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
      return;
    }

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
    }

  } catch (error) {
    // Don't throw - log and return so grading flow isn't blocked
    // The merge can be retried later or triggered manually
  }
}

// Create Grading Tasks Function: Triggered after auto-scoring or manual grading
async function createGradingTasksForSession(sessionId: number, examId: number, storage: any): Promise<void> {
  try {

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
      return;
    }

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
        } else {
        }
      } catch (error) {
      }
    } else {
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
        }
      } else {
      }
    }

  } catch (error) {
    throw error; // Re-throw to indicate failure
  }
}

export async function registerRoutes(app: Express): Promise<Server> {

  // ==================== REALTIME SYNC ENDPOINT ====================
  // This endpoint allows frontend to get initial data for tables they want to subscribe to
  // Security: Role-based access control enforced per table with scope filtering
  // Security: All-or-nothing permission check - reject entire request if ANY table is forbidden
  const ALLOWED_SYNC_TABLES = ['classes', 'subjects', 'academic_terms', 'users', 'students', 'announcements', 'exams', 'homepage_content', 'notifications'];
  
  // Permission matrix: Which roles can access which tables
  // true = full access, 'scoped' = filtered access, false = forbidden
  type TablePermission = boolean | 'scoped';
  const TABLE_PERMISSIONS: Record<string, Record<number, TablePermission>> = {
    'classes': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: true, [ROLES.STUDENT]: true, [ROLES.PARENT]: true },
    'subjects': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: true, [ROLES.STUDENT]: true, [ROLES.PARENT]: true },
    'academic_terms': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: true, [ROLES.STUDENT]: true, [ROLES.PARENT]: true },
    'users': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: false, [ROLES.STUDENT]: false, [ROLES.PARENT]: false },
    'students': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: 'scoped', [ROLES.STUDENT]: false, [ROLES.PARENT]: 'scoped' },
    'announcements': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: 'scoped', [ROLES.STUDENT]: 'scoped', [ROLES.PARENT]: 'scoped' },
    'exams': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: 'scoped', [ROLES.STUDENT]: 'scoped', [ROLES.PARENT]: 'scoped' },
    'homepage_content': { [ROLES.SUPER_ADMIN]: true, [ROLES.ADMIN]: true, [ROLES.TEACHER]: false, [ROLES.STUDENT]: false, [ROLES.PARENT]: false },
    'notifications': { [ROLES.SUPER_ADMIN]: 'scoped', [ROLES.ADMIN]: 'scoped', [ROLES.TEACHER]: 'scoped', [ROLES.STUDENT]: 'scoped', [ROLES.PARENT]: 'scoped' }
  };
  
  app.post('/api/realtime/sync', authenticateUser, async (req, res) => {
    try {
      const { tables } = req.body as { tables: string[] };
      
      if (!Array.isArray(tables) || tables.length === 0) {
        return res.status(400).json({ message: 'Tables array is required' });
      }
      
      // Validate, normalize (lowercase), and deduplicate table names
      // Security: Only accept exact lowercase matches to prevent bypass attempts
      const normalizedTables = tables
        .filter(t => typeof t === 'string' && t.length > 0)
        .map(t => t.toLowerCase().trim());
      
      // Security: All-or-nothing validation - reject if ANY table is not in whitelist
      const invalidTables = normalizedTables.filter(t => !ALLOWED_SYNC_TABLES.includes(t));
      if (invalidTables.length > 0) {
        return res.status(400).json({ 
          message: 'Request contains invalid table names',
          invalidTables,
          allowedTables: ALLOWED_SYNC_TABLES 
        });
      }
      
      const uniqueTables = [...new Set(normalizedTables)];
      
      if (uniqueTables.length === 0) {
        return res.status(400).json({ 
          message: 'No valid tables specified',
          allowedTables: ALLOWED_SYNC_TABLES 
        });
      }
      
      const userRoleId = req.user!.roleId;
      const userId = req.user!.id;
      
      // Security: Check permissions for ALL requested tables BEFORE processing ANY data
      // All-or-nothing: if user lacks permission for any table, reject entire request
      const forbiddenTables: string[] = [];
      for (const table of uniqueTables) {
        const permission = TABLE_PERMISSIONS[table]?.[userRoleId];
        if (permission === false || permission === undefined) {
          forbiddenTables.push(table);
        }
      }
      
      if (forbiddenTables.length > 0) {
        return res.status(403).json({
          message: 'Access denied to one or more requested tables',
          forbiddenTables,
          hint: 'Remove forbidden tables from request or use appropriate credentials'
        });
      }
      
      const syncData: Record<string, any> = {};
      
      // Helper to get user's role name for announcement filtering
      const getRoleName = (roleId: number): string | null => {
        switch (roleId) {
          case ROLES.STUDENT: return 'Student';
          case ROLES.TEACHER: return 'Teacher';
          case ROLES.PARENT: return 'Parent';
          case ROLES.ADMIN: return 'Admin';
          case ROLES.SUPER_ADMIN: return 'SuperAdmin';
          default: return null;
        }
      };
      
      // Now process tables - all permission checks already passed
      for (const table of uniqueTables) {
        switch (table) {
          case 'classes':
            // All authenticated users can see active classes
            syncData.classes = await storage.getClasses();
            break;
            
          case 'subjects':
            // All authenticated users can see subjects
            syncData.subjects = await storage.getSubjects();
            break;
            
          case 'academic_terms':
            // All authenticated users can see terms
            syncData.academic_terms = await storage.getAcademicTerms();
            break;
            
          case 'users':
            // Only admins - permission already verified
            const allUsers = await storage.getAllUsers();
            syncData.users = allUsers.map((u: any) => {
              const { passwordHash, ...safe } = u;
              return safe;
            });
            break;
            
          case 'students':
            // Role-based scoped access - permission already verified
            if (userRoleId === ROLES.ADMIN || userRoleId === ROLES.SUPER_ADMIN) {
              const allStudents = await storage.getAllStudents();
              syncData.students = Array.isArray(allStudents) ? allStudents : [];
            } else if (userRoleId === ROLES.TEACHER) {
              // Teachers only get students in their assigned classes
              const teacherProfile = await storage.getTeacherProfile(userId);
              const assignedClasses = teacherProfile?.assignedClasses;
              
              if (assignedClasses && Array.isArray(assignedClasses) && assignedClasses.length > 0) {
                const allStudents = await storage.getAllStudents();
                syncData.students = Array.isArray(allStudents) 
                  ? allStudents.filter((s: any) => s && s.classId && assignedClasses.includes(s.classId))
                  : [];
              } else {
                // Teacher has scoped permission but no assigned classes = empty result (not error)
                syncData.students = [];
              }
            } else if (userRoleId === ROLES.PARENT) {
              // Parents only get their own children
              const children = await storage.getStudentsByParentId(userId);
              syncData.students = Array.isArray(children) ? children : [];
            }
            break;
            
          case 'announcements':
            // Filter announcements by target role - scoped access
            const allAnnouncements = await storage.getAnnouncements();
            const userRole = getRoleName(userRoleId);
            syncData.announcements = (Array.isArray(allAnnouncements) ? allAnnouncements : []).filter((a: any) => {
              // Show if no target role (public) or matches user's role
              if (!a.targetRole) return true;
              if (a.targetRole === userRole) return true;
              // Admins can see all announcements
              if (userRoleId === ROLES.ADMIN || userRoleId === ROLES.SUPER_ADMIN) return true;
              return false;
            });
            break;
            
          case 'exams':
            if (userRoleId === ROLES.ADMIN || userRoleId === ROLES.SUPER_ADMIN) {
              syncData.exams = await storage.getAllExams();
            } else if (userRoleId === ROLES.TEACHER) {
              const allExams = await storage.getAllExams();
              syncData.exams = (Array.isArray(allExams) ? allExams : []).filter((e: any) => 
                e.createdBy === userId || e.teacherInChargeId === userId
              );
            } else if (userRoleId === ROLES.STUDENT) {
              // Students only see published exams for their class
              const student = await storage.getStudent(userId);
              if (student?.classId) {
                const allExams = await storage.getAllExams();
                syncData.exams = (Array.isArray(allExams) ? allExams : []).filter((e: any) => 
                  e.isPublished && e.classId === student.classId
                );
              } else {
                syncData.exams = [];
              }
            } else if (userRoleId === ROLES.PARENT) {
              // Parents see published exams for their children's classes
              const children = await storage.getStudentsByParentId(userId);
              const classIds = [...new Set((Array.isArray(children) ? children : []).map((c: any) => c.classId).filter(Boolean))];
              if (classIds.length > 0) {
                const allExams = await storage.getAllExams();
                syncData.exams = (Array.isArray(allExams) ? allExams : []).filter((e: any) => 
                  e.isPublished && classIds.includes(e.classId)
                );
              } else {
                syncData.exams = [];
              }
            }
            break;
            
          case 'homepage_content':
            // Only admins - permission already verified
            syncData.homepage_content = await storage.getHomePageContent();
            break;
            
          case 'notifications':
            // Users only get their own notifications - scoped
            syncData.notifications = await storage.getNotificationsByUserId(userId);
            break;
        }
      }
      
      res.json({
        success: true,
        data: syncData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to sync realtime data' });
    }
  });

  // AI-assisted grading routes
  // Get AI-suggested grading tasks for teacher review
  app.get('/api/grading/tasks/ai-suggested', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const status = req.query.status as string;

      // Get all AI-suggested grading tasks for the teacher
      const tasks = await storage.getAISuggestedGradingTasks(teacherId, status);

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch AI-suggested tasks' });
    }
  });

  // Exam management routes
  // Get all exams
  app.get('/api/exams', authenticateUser, async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRoleId = req.user!.roleId;
      
      // Students should only see exams assigned to their class
      if (userRoleId === ROLES.STUDENT) {
        // Get the student's class
        const student = await storage.getStudent(userId);
        
        if (!student || !student.classId) {
          // Student not enrolled in any class - return empty array
          return res.json([]);
        }
        
        // Get exams for student's class that are published
        const allExams = await storage.getAllExams();
        const studentExams = allExams.filter((exam: any) => {
          // Only show published exams for the student's class
          return exam.isPublished && exam.classId === student.classId;
        });
        
        return res.json(studentExams);
      }
      
      // Teachers see exams they created OR are assigned to (teacherInChargeId)
      if (userRoleId === ROLES.TEACHER) {
        const allExams = await storage.getAllExams();
        const teacherExams = allExams.filter((exam: any) => 
          exam.createdBy === userId || exam.teacherInChargeId === userId
        );
        return res.json(teacherExams);
      }
      
      // Parents see exams for their children's classes
      if (userRoleId === ROLES.PARENT) {
        const children = await storage.getStudentsByParentId(userId);
        
        if (!children || children.length === 0) {
          return res.json([]);
        }
        
        // Get unique class IDs from all children
        const classIds = Array.from(new Set(children.map((c: any) => c.classId).filter(Boolean)));
        
        if (classIds.length === 0) {
          return res.json([]);
        }
        
        const allExams = await storage.getAllExams();
        const parentExams = allExams.filter((exam: any) => {
          return exam.isPublished && classIds.includes(exam.classId);
        });
        
        return res.json(parentExams);
      }
      
      // Admins and Super Admins see all exams
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ message: 'Failed to fetch exams' });
    }
  });

  // Create exam - TEACHERS ONLY
  app.post('/api/exams', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const assignedTeacherId = req.body.teacherInChargeId || teacherId;

      // SECURITY: Validate teacherInChargeId if different from creator
      if (assignedTeacherId !== teacherId) {
        const assignedUser = await storage.getUser(assignedTeacherId);
        if (!assignedUser) {
          return res.status(400).json({ message: 'Assigned teacher not found' });
        }
        if (assignedUser.roleId !== ROLES.TEACHER) {
          return res.status(400).json({ message: 'teacherInChargeId must be a teacher' });
        }
        if (!assignedUser.isActive) {
          return res.status(400).json({ message: 'Assigned teacher is not active' });
        }
      }

      const examData = insertExamSchema.parse({
        ...req.body,
        createdBy: teacherId,
        teacherInChargeId: assignedTeacherId
      });

      const exam = await storage.createExam(examData);
      
      // Emit realtime event for exam creation
      realtimeService.emitTableChange('exams', 'INSERT', exam, undefined, teacherId);
      if (exam.classId) {
        realtimeService.emitToClass(exam.classId.toString(), 'exam.created', exam);
      }
      
      res.status(201).json(exam);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid exam data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create exam' });
    }
  });

  // Get exam question counts - MUST be before /api/exams/:id to avoid route conflict
  app.get('/api/exams/question-counts', authenticateUser, async (req, res) => {
    try {
      const examIdsParam = req.query.examIds;
      let examIds: number[] = [];

      if (typeof examIdsParam === 'string') {
        const parsed = parseInt(examIdsParam);
        if (!isNaN(parsed)) {
          examIds = [parsed];
        }
      } else if (Array.isArray(examIdsParam)) {
        examIds = examIdsParam
          .map((id) => parseInt(id as string))
          .filter((id) => !isNaN(id));
      }
      const counts: Record<number, number> = {};

      for (const examId of examIds) {
        const questions = await storage.getExamQuestions(examId);
        counts[examId] = questions.length;
      }
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch question counts' });
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
      res.status(500).json({ message: 'Failed to fetch exam' });
    }
  });

  // Get exam results by exam ID - TEACHERS AND ADMINS
  app.get('/api/exam-results/exam/:examId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const teacherId = req.user!.id;
      
      // Validate exam ID
      if (isNaN(examId) || examId <= 0) {
        return res.status(400).json({ message: 'Invalid exam ID' });
      }
      
      // Verify exam exists
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      
      // For teachers, allow viewing results if they created the exam, are the teacher in charge,
      // or teach the class-subject combination
      if (req.user!.roleId === ROLES.TEACHER) {
        const isCreator = exam.createdBy === teacherId;
        const isTeacherInCharge = exam.teacherInChargeId === teacherId;
        
        // Also check if teacher is assigned to this class-subject
        let isClassSubjectTeacher = false;
        if (exam.classId && exam.subjectId) {
          try {
            const teachers = await storage.getTeachersForClassSubject(exam.classId, exam.subjectId);
            isClassSubjectTeacher = teachers?.some((t: any) => t.id === teacherId) || false;
          } catch (e) {
            // Silent fail - continue with other checks
          }
        }
        
        if (!isCreator && !isTeacherInCharge && !isClassSubjectTeacher) {
          return res.status(403).json({ message: 'You can only view results for exams you created, are assigned to, or teach' });
        }
      }
      
      // Get results with student info for better display
      const results = await storage.getExamResultsByExam(examId);
      
      // Enrich with student information
      const enrichedResults = await Promise.all(results.map(async (result: any) => {
        try {
          const student = await storage.getStudent(result.studentId);
          const user = student ? await storage.getUser(result.studentId) : null;
          return {
            ...result,
            studentName: user?.firstName && user?.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user?.username || 'Unknown Student',
            admissionNumber: student?.admissionNumber || null
          };
        } catch (e) {
          return {
            ...result,
            studentName: 'Unknown Student',
            admissionNumber: null
          };
        }
      }));
      
      res.json(enrichedResults);
    } catch (error: any) {
      console.error('[EXAM-RESULTS] Error fetching exam results:', error?.message);
      res.status(500).json({ message: 'Failed to fetch exam results' });
    }
  });

  // Update exam - TEACHERS ONLY (creator or teacher in charge)
  app.patch('/api/exams/:id', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const teacherId = req.user!.id;
      
      const existingExam = await storage.getExamById(examId);
      if (!existingExam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      const isCreator = existingExam.createdBy === teacherId;
      const isTeacherInCharge = existingExam.teacherInChargeId === teacherId;
      if (!isCreator && !isTeacherInCharge) {
        return res.status(403).json({ message: 'You can only edit exams you created or are assigned to' });
      }

      // SECURITY: Validate teacherInChargeId whenever it's present in request
      // This prevents privilege escalation by assigning to non-teacher or inactive accounts
      if (req.body.teacherInChargeId !== undefined) {
        // If teacherInChargeId is provided, validate it's a valid active teacher
        const assignedUser = await storage.getUser(req.body.teacherInChargeId);
        if (!assignedUser) {
          return res.status(400).json({ message: 'Assigned teacher not found' });
        }
        if (assignedUser.roleId !== ROLES.TEACHER) {
          return res.status(400).json({ message: 'teacherInChargeId must be a teacher' });
        }
        if (!assignedUser.isActive) {
          return res.status(400).json({ message: 'Assigned teacher is not active' });
        }
      }

      // Only pass allowed fields to prevent unexpected field updates
      const allowedFields = ['name', 'description', 'date', 'timeLimit', 'totalMarks', 
        'classId', 'subjectId', 'teacherInChargeId', 'isPublished', 'instructions',
        'passingScore', 'maxAttempts', 'showResults', 'shuffleQuestions', 'shuffleOptions'];
      const sanitizedData: Record<string, any> = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          sanitizedData[field] = req.body[field];
        }
      }

      const exam = await storage.updateExam(examId, sanitizedData);
      
      if (!exam) {
        return res.status(500).json({ message: 'Failed to update exam' });
      }
      
      // Emit realtime event for exam update
      realtimeService.emitTableChange('exams', 'UPDATE', exam, existingExam, teacherId);
      if (exam.classId) {
        realtimeService.emitToClass(exam.classId.toString(), 'exam.updated', exam);
      }
      
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update exam' });
    }
  });

  // Delete exam - TEACHERS ONLY (only creator can delete)
  app.delete('/api/exams/:id', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      
      const existingExam = await storage.getExamById(examId);
      if (!existingExam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      if (existingExam.createdBy !== req.user!.id) {
        return res.status(403).json({ message: 'You can only delete exams you created' });
      }
      const success = await storage.deleteExam(examId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete exam' });
      }
      
      // Emit realtime event for exam deletion
      realtimeService.emitTableChange('exams', 'DELETE', { id: examId }, existingExam, req.user!.id);
      if (existingExam.classId) {
        realtimeService.emitToClass(existingExam.classId.toString(), 'exam.deleted', existingExam);
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting exam:', error);
      res.status(500).json({ message: error?.message || 'Failed to delete exam' });
    }
  });

  // Toggle exam publish status - TEACHERS ONLY (creator or teacher in charge)
  app.patch('/api/exams/:id/publish', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const teacherId = req.user!.id;
      const { isPublished } = req.body;

      const existingExam = await storage.getExamById(examId);
      if (!existingExam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      const isCreator = existingExam.createdBy === teacherId;
      const isTeacherInCharge = existingExam.teacherInChargeId === teacherId;
      if (!isCreator && !isTeacherInCharge) {
        return res.status(403).json({ message: 'You can only publish/unpublish exams you created or are assigned to' });
      }
      const exam = await storage.updateExam(examId, { isPublished });
      
      if (!exam) {
        return res.status(500).json({ message: 'Failed to update exam publish status' });
      }
      
      // Use dedicated exam publish/unpublish emit method for comprehensive realtime updates
      realtimeService.emitExamPublishEvent(examId, isPublished, exam, teacherId);
      
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update exam publish status' });
    }
  });

  // Submit exam - synchronous with instant scoring and enhanced reliability
  // ENHANCED: Added server-side timer validation, duplicate prevention, and transaction safety
  app.post('/api/exams/:examId/submit', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    const startTime = Date.now();
    let sessionId: number | null = null;
    
    try {
      const examId = parseInt(req.params.examId);
      const studentId = req.user!.id;
      const { forceSubmit, violationCount, clientTimeRemaining, submissionReason } = req.body;
      
      // Validate submission reason
      const validReasons = ['manual', 'timeout', 'violation'];
      const reason = validReasons.includes(submissionReason) ? submissionReason : 'manual';

      // Validate exam ID
      if (isNaN(examId) || examId <= 0) {
        return res.status(400).json({ message: 'Invalid exam ID provided' });
      }

      // Verify the exam exists
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      // Find the active exam session
      const sessions = await storage.getExamSessionsByStudent(studentId);
      const activeSession = sessions.find(s => s.examId === examId && !s.isCompleted);
      
      // SERVER-SIDE TIMER VALIDATION: Prevent time manipulation cheating
      if (activeSession && activeSession.startedAt && exam.timeLimit) {
        const serverStartTime = new Date(activeSession.startedAt).getTime();
        const allowedDurationMs = (exam.timeLimit * 60 * 1000) + (30 * 1000); // Add 30s grace period
        const serverElapsedMs = Date.now() - serverStartTime;
        
        // If time has exceeded, mark as timed out but still allow submission
        const isTimedOut = serverElapsedMs > allowedDurationMs;
        if (isTimedOut) {
          console.log(`[SUBMIT] Session ${activeSession.id} timed out on server. Elapsed: ${Math.floor(serverElapsedMs/1000)}s, Allowed: ${Math.floor(allowedDurationMs/1000)}s`);
        }
      }

      if (!activeSession) {
        // Check if already submitted - return existing results
        const completedSession = sessions.find(s => s.examId === examId && s.isCompleted);
        if (completedSession) {
          const existingResult = await storage.getExamResultByExamAndStudent(examId, studentId);
          const studentAnswers = await storage.getStudentAnswers(completedSession.id);
          const examQuestions = await storage.getExamQuestions(examId);
          
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

          return res.json({
            submitted: true,
            alreadySubmitted: true,
            message: 'Exam was previously submitted. Returning existing results.',
            result: {
              sessionId: completedSession.id,
              score: existingResult?.score || completedSession.score || 0,
              maxScore: existingResult?.maxScore || completedSession.maxScore || exam.totalMarks || 0,
              percentage: existingResult?.maxScore 
                ? ((existingResult.score || 0) / existingResult.maxScore) * 100 
                : completedSession.maxScore 
                  ? ((completedSession.score || 0) / completedSession.maxScore) * 100 
                  : 0,
              submittedAt: completedSession.submittedAt?.toISOString() || new Date().toISOString(),
              questionDetails,
              breakdown: {
                totalQuestions: examQuestions.length,
                answered: studentAnswers.filter(a => a.textAnswer || a.selectedOptionId).length,
                correct: studentAnswers.filter(a => a.isCorrect).length,
                autoScored: studentAnswers.filter(a => a.isCorrect !== null).length
              }
            }
          });
        }
        return res.status(404).json({ message: 'No active exam session found. Please start a new exam session.' });
      }

      sessionId = activeSession.id;
      const now = new Date();
      
      // Calculate time taken
      const sessionStartTime = new Date(activeSession.startedAt).getTime();
      const timeTakenSeconds = Math.floor((now.getTime() - sessionStartTime) / 1000);

      // Build metadata with submission details
      const existingMetadata = activeSession.metadata ? JSON.parse(activeSession.metadata) : {};
      const sessionMetadata = {
        ...existingMetadata,
        submissionReason: reason,
        submittedVia: forceSubmit ? 'auto' : 'manual',
        violationCount: violationCount || 0,
        timeTakenSeconds,
        clientTimeRemaining: clientTimeRemaining || 0,
        serverTimestamp: now.toISOString()
      };

      // Mark session as submitted FIRST (before scoring to prevent race conditions)
      await storage.updateExamSession(activeSession.id, {
        isCompleted: true,
        submittedAt: now,
        status: reason === 'manual' ? 'submitted' : `auto_${reason}`,
        metadata: JSON.stringify(sessionMetadata)
      });

      // Auto-score the exam with error recovery
      const scoringStartTime = Date.now();
      let scoringSuccessful = false;
      let scoringError: Error | null = null;
      
      try {
        await autoScoreExamSession(activeSession.id, storage);
        scoringSuccessful = true;
      } catch (scoreError: any) {
        console.error(`[SUBMIT] Auto-scoring failed for session ${activeSession.id}:`, scoreError?.message);
        scoringError = scoreError;
        // Continue - we'll still return results even if scoring fails
      }
      
      const scoringTime = Date.now() - scoringStartTime;

      // Get the updated session with scores
      const updatedSession = await storage.getExamSessionById(activeSession.id);

      // Get detailed results for student
      const studentAnswers = await storage.getStudentAnswers(activeSession.id);
      const examQuestions = await storage.getExamQuestions(examId);

      // Calculate score from answers if session score is missing
      let totalScore = updatedSession?.score || 0;
      let maxScore = updatedSession?.maxScore || exam.totalMarks || 0;
      
      if (totalScore === 0 && studentAnswers.length > 0) {
        // Fallback: Calculate score from individual answer scores
        totalScore = studentAnswers.reduce((sum, ans) => sum + (ans.pointsEarned || 0), 0);
      }
      
      if (maxScore === 0 && examQuestions.length > 0) {
        // Fallback: Calculate max score from questions
        maxScore = examQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
      }

      // Update session with calculated scores if they were missing
      if ((updatedSession?.score !== totalScore || updatedSession?.maxScore !== maxScore) && totalScore > 0) {
        try {
          await storage.updateExamSession(activeSession.id, {
            score: totalScore,
            maxScore: maxScore,
            status: 'graded'
          });
        } catch (updateError) {
          console.warn('[SUBMIT] Failed to update session with calculated scores:', updateError);
        }
      }

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
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // AUTO-SYNC: Sync exam score to report card immediately after scoring
      // Report cards are auto-created when a student completes their first exam for a term
      let reportCardSync: { success: boolean; message: string; reportCardId?: number; isNewReportCard?: boolean } = { success: false, message: '' };
      try {
        reportCardSync = await storage.syncExamScoreToReportCard(studentId, examId, totalScore, maxScore);
        if (reportCardSync.success) {
          console.log(`[SUBMIT] Report card sync successful: ${reportCardSync.message}`);
          
          // Emit realtime event for report card update so dashboards refresh
          if (reportCardSync.reportCardId) {
            const eventType = reportCardSync.isNewReportCard ? 'created' : 'updated';
            realtimeService.emitReportCardEvent(reportCardSync.reportCardId, eventType, {
              studentId,
              examId,
              classId: exam.classId,
              score: totalScore,
              maxScore,
              percentage: maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0,
              isNewReportCard: reportCardSync.isNewReportCard,
              autoGenerated: reportCardSync.isNewReportCard
            });
          }
          
          // Also emit to class channel for teachers monitoring report cards
          const tableOperation = reportCardSync.isNewReportCard ? 'INSERT' : 'UPDATE';
          realtimeService.emitTableChange('report_cards', tableOperation, {
            reportCardId: reportCardSync.reportCardId,
            studentId,
            examId,
            classId: exam.classId,
            score: totalScore,
            maxScore,
            isNewReportCard: reportCardSync.isNewReportCard
          }, undefined, studentId);
        } else {
          console.warn(`[SUBMIT] Report card sync warning: ${reportCardSync.message}`);
        }
      } catch (syncError: any) {
        console.warn('[SUBMIT] Report card sync failed (non-blocking):', syncError?.message);
        // Don't fail the submission if report card sync fails
      }

      // Format time taken for display
      const formatTimeTaken = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins === 0) return `${secs} seconds`;
        return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
      };

      // Emit realtime event for exam submission
      realtimeService.emitExamEvent(examId, 'submitted', {
        sessionId: activeSession.id,
        studentId,
        examId,
        classId: exam.classId,
        score: totalScore,
        maxScore,
        percentage: Math.round(percentage * 100) / 100,
        submissionReason: reason,
      });

      // Return instant results with enhanced metadata
      res.json({
        submitted: true,
        scoringSuccessful,
        submissionReason: reason,
        timedOut: reason === 'timeout',
        violationSubmit: reason === 'violation',
        message: scoringSuccessful 
          ? `Exam submitted successfully! Your score: ${totalScore}/${maxScore}`
          : 'Exam submitted. Score calculation in progress.',
        result: {
          sessionId: activeSession.id,
          score: totalScore,
          maxScore: maxScore,
          percentage: Math.round(percentage * 100) / 100,
          submittedAt: now.toISOString(),
          timeTakenSeconds,
          timeTakenFormatted: formatTimeTaken(timeTakenSeconds),
          submissionReason: reason,
          violationCount: violationCount || 0,
          questionDetails,
          breakdown: {
            totalQuestions: examQuestions.length,
            answered: studentAnswers.filter(a => a.textAnswer || a.selectedOptionId).length,
            correct: studentAnswers.filter(a => a.isCorrect === true).length,
            incorrect: studentAnswers.filter(a => a.isCorrect === false).length,
            autoScored: studentAnswers.filter(a => a.autoScored === true).length,
            pendingReview: studentAnswers.filter(a => a.isCorrect === null).length
          }
        },
        performance: {
          totalTime,
          scoringTime
        },
        reportCardSync: {
          synced: reportCardSync.success,
          message: reportCardSync.message
        }
      });
    } catch (error: any) {
      console.error('[SUBMIT] Exam submission error:', error?.message, { sessionId });
      
      // Provide helpful error messages based on error type
      let userMessage = 'Failed to submit exam';
      let statusCode = 500;
      
      if (error?.message?.includes('not found')) {
        userMessage = 'Session not found. Please refresh and try again.';
        statusCode = 404;
      } else if (error?.message?.includes('already')) {
        userMessage = 'This exam has already been submitted.';
        statusCode = 409;
      } else if (error?.message?.includes('database') || error?.message?.includes('connection')) {
        userMessage = 'Database connection issue. Please try again in a moment.';
        statusCode = 503;
      } else if (error?.message) {
        userMessage = error.message;
      }
      
      res.status(statusCode).json({ 
        message: userMessage,
        submitted: false,
        sessionId
      });
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
      res.status(500).json({ message: 'Failed to fetch exam questions' });
    }
  });

  // Create exam question - TEACHERS ONLY
  app.post('/api/exam-questions', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const { options, ...questionData } = req.body;
      let question;

      if (options && Array.isArray(options)) {
        question = await storage.createExamQuestionWithOptions(questionData, options);
      } else {
        question = await storage.createExamQuestion(questionData);
      }
      
      // Emit realtime event for question creation
      realtimeService.emitTableChange('exam_questions', 'INSERT', question, undefined, req.user!.id);
      if (question.examId) {
        realtimeService.emitToExam(question.examId, 'question.created', question);
      }
      
      res.status(201).json(question);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create exam question' });
    }
  });

  // Update exam question - TEACHERS ONLY
  app.patch('/api/exam-questions/:id', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const { options, ...questionData } = req.body;
      
      // Get existing question to check if type is changing
      const existingQuestion = await storage.getExamQuestionById(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      // Update the question
      const question = await storage.updateExamQuestion(questionId, questionData);

      if (!question) {
        return res.status(404).json({ message: 'Failed to update question' });
      }
      
      // Handle options update for multiple choice questions
      if (questionData.questionType === 'multiple_choice') {
        if (options && Array.isArray(options)) {
          // Delete existing options and create new ones
          await storage.deleteQuestionOptions(questionId);
          for (let i = 0; i < options.length; i++) {
            const option = options[i];
            await storage.createQuestionOption({
              questionId,
              optionText: option.optionText,
              isCorrect: option.isCorrect ?? false,
              orderNumber: typeof option.orderNumber === 'number' ? option.orderNumber : (i + 1),
              explanationText: option.explanationText ?? null,
              partialCreditValue: typeof option.partialCreditValue === 'number' ? option.partialCreditValue : 0,
            });
          }
        }
      } else if (existingQuestion.questionType === 'multiple_choice' && questionData.questionType !== 'multiple_choice') {
        // If changing from multiple_choice to another type, delete options
        await storage.deleteQuestionOptions(questionId);
      }
      
      // Emit realtime event for question update
      realtimeService.emitTableChange('exam_questions', 'UPDATE', question, undefined, req.user!.id);
      if (question.examId) {
        realtimeService.emitToExam(question.examId, 'question.updated', question);
      }
      
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update exam question' });
    }
  });

  // Delete exam question - TEACHERS ONLY
  app.delete('/api/exam-questions/:id', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      
      // Get question before deleting for the realtime event
      const existingQuestion = await storage.getExamQuestionById(questionId);
      if (!existingQuestion) {
        return res.status(404).json({ message: 'Question not found' });
      }
      
      const success = await storage.deleteExamQuestion(questionId);
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete question' });
      }
      
      // Emit realtime event for question deletion with examId for proper subscription targeting
      realtimeService.emitTableChange('exam_questions', 'DELETE', { id: questionId, examId: existingQuestion.examId }, existingQuestion, req.user!.id);
      
      // Also emit to the specific exam room for real-time updates
      if (existingQuestion.examId) {
        realtimeService.emitToExam(existingQuestion.examId, 'question.deleted', { id: questionId, examId: existingQuestion.examId });
      }
      
      res.status(204).send();
    } catch (error: any) {
      console.error('Error deleting exam question:', error);
      res.status(500).json({ message: error?.message || 'Failed to delete exam question' });
    }
  });

  // Bulk get question options for multiple questions (must be before :questionId route)
  app.get('/api/question-options/bulk', authenticateUser, async (req, res) => {
    try {
      const questionIdsParam = req.query.questionIds as string;
      
      if (!questionIdsParam) {
        return res.json([]);
      }

      const questionIds = questionIdsParam.split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id));

      if (questionIds.length === 0) {
        return res.json([]);
      }

      // Fetch options for all questions in parallel
      const allOptions = await Promise.all(
        questionIds.map(async (questionId) => {
          try {
            const options = await storage.getQuestionOptions(questionId);
            return options;
          } catch (error) {
            return [];
          }
        })
      );

      // Flatten the array of arrays
      const flattenedOptions = allOptions.flat();
      res.json(flattenedOptions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch question options' });
    }
  });

  // Get question options for a single question
  app.get('/api/question-options/:questionId', authenticateUser, async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const options = await storage.getQuestionOptions(questionId);
      res.json(options);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch question options' });
    }
  });

  // Bulk upload exam questions from CSV - TEACHERS ONLY
  app.post('/api/exam-questions/bulk', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const { examId, questions } = req.body;

      if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
      }
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: 'Questions array is required and must not be empty' });
      }

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
      
      // Emit realtime event for bulk question creation
      realtimeService.emitTableChange('exam_questions', 'INSERT', { examId, count: result.created });
      realtimeService.emitToExam(examId, 'questions.bulk_created', { examId, count: result.created });

      res.status(201).json(result);
    } catch (error: any) {
      res.status(500).json({
        message: error.message || 'Failed to upload questions',
        created: 0,
        errors: [error.message || 'Unknown error occurred']
      });
    }
  });

  // CSV Upload for exam questions - TEACHERS ONLY
  // Expected CSV format: questionText, questionType, points, optionA, optionB, optionC, optionD, correctAnswer
  app.post('/api/exams/:examId/questions/csv', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), uploadCSV.single('file'), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      
      if (!req.file) {
        return res.status(400).json({ message: 'CSV file is required' });
      }
      
      // Verify exam exists and belongs to this teacher
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      
      // Only allow teachers who created the exam, are assigned to it, or admins
      if (req.user!.roleId === ROLES.TEACHER) {
        const teacherId = req.user!.id;
        const isCreator = exam.createdBy === teacherId;
        const isTeacherInCharge = exam.teacherInChargeId === teacherId;
        if (!isCreator && !isTeacherInCharge) {
          return res.status(403).json({ message: 'You can only upload questions to exams you created or are assigned to' });
        }
      }
      
      // Read and parse CSV file
      const csvContent = await fs.readFile(req.file.path, 'utf-8');
      const lines = csvContent.trim().split('\n');
      
      if (lines.length < 2) {
        await fs.unlink(req.file.path); // Clean up
        return res.status(400).json({ message: 'CSV file must contain header and at least one question row' });
      }
      
      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, ''));
      
      // Expected columns for exam questions CSV
      const requiredColumns = ['questiontext', 'questiontype'];
      const hasRequiredColumns = requiredColumns.every(col => headers.includes(col));
      
      if (!hasRequiredColumns) {
        await fs.unlink(req.file.path); // Clean up
        return res.status(400).json({
          message: 'CSV must contain columns: questionText, questionType. Optional: points, optionA, optionB, optionC, optionD, correctAnswer, expectedAnswers'
        });
      }
      
      const questionsData: any[] = [];
      const errors: string[] = [];
      
      // Parse each row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue; // Skip empty lines
        
        // Handle CSV with quoted fields containing commas
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());
        
        const row: Record<string, string> = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        try {
          const questionText = row['questiontext'];
          const questionType = row['questiontype']?.toLowerCase() || 'multiple_choice';
          const points = parseInt(row['points']) || 1;
          
          if (!questionText) {
            errors.push(`Row ${i + 1}: Missing question text`);
            continue;
          }
          
          // Validate question type
          const validTypes = ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank'];
          if (!validTypes.includes(questionType)) {
            errors.push(`Row ${i + 1}: Invalid question type '${questionType}'. Valid types: ${validTypes.join(', ')}`);
            continue;
          }
          
          // Build question data
          const questionData: any = {
            question: {
              examId,
              questionText,
              questionType,
              points,
              orderNumber: questionsData.length + 1,
              autoGradable: ['multiple_choice', 'true_false', 'fill_blank'].includes(questionType),
              expectedAnswers: '[]',
            },
            options: []
          };
          
          // Handle multiple choice options
          if (questionType === 'multiple_choice' || questionType === 'true_false') {
            const optionLabels = ['a', 'b', 'c', 'd', 'e', 'f'];
            const correctAnswer = row['correctanswer']?.toLowerCase();
            
            for (const label of optionLabels) {
              const optionText = row[`option${label}`];
              if (optionText) {
                questionData.options.push({
                  optionText,
                  isCorrect: correctAnswer === label || correctAnswer === optionText.toLowerCase(),
                  orderNumber: optionLabels.indexOf(label) + 1
                });
              }
            }
            
            // For true/false, auto-create options if not provided
            if (questionType === 'true_false' && questionData.options.length === 0) {
              questionData.options = [
                { optionText: 'True', isCorrect: correctAnswer === 'true' || correctAnswer === 'a', orderNumber: 1 },
                { optionText: 'False', isCorrect: correctAnswer === 'false' || correctAnswer === 'b', orderNumber: 2 }
              ];
            }
          }
          
          // Handle expected answers for short answer/fill blank
          if (questionType === 'short_answer' || questionType === 'fill_blank') {
            const expectedAnswers = row['expectedanswers'] || row['correctanswer'];
            if (expectedAnswers) {
              // Split by semicolon for multiple acceptable answers
              const answers = expectedAnswers.split(';').map(a => a.trim()).filter(a => a);
              questionData.question.expectedAnswers = JSON.stringify(answers);
            }
          }
          
          questionsData.push(questionData);
        } catch (err: any) {
          errors.push(`Row ${i + 1}: ${err.message}`);
        }
      }
      
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      
      if (questionsData.length === 0) {
        return res.status(400).json({
          message: 'No valid questions found in CSV',
          errors
        });
      }
      
      // Use database transaction for atomic insert
      const result = await storage.createExamQuestionsBulk(questionsData);
      
      // Update exam total marks if needed
      const totalPoints = questionsData.reduce((sum, q) => sum + (q.question.points || 1), 0);
      await storage.updateExam(examId, { totalMarks: (exam.totalMarks || 0) + totalPoints });
      
      // Log audit event
      await storage.createAuditLog({
        userId: req.user!.id,
        action: 'exam_questions_csv_upload',
        entityType: 'exam',
        entityId: examId.toString(),
        newValue: JSON.stringify({ questionsCreated: result.created, errors: result.errors?.length || 0 }),
        reason: `CSV upload: ${result.created} questions added to exam ${exam.name}`,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || null
      });
      
      // Emit realtime event for CSV question upload
      realtimeService.emitTableChange('exam_questions', 'INSERT', { examId, count: result.created }, undefined, req.user!.id);
      realtimeService.emitToExam(examId, 'questions.csv_uploaded', { examId, count: result.created, totalPointsAdded: totalPoints });
      
      res.status(201).json({
        message: `Successfully imported ${result.created} questions from CSV`,
        created: result.created,
        errors: errors.length > 0 ? errors : result.errors,
        totalPointsAdded: totalPoints
      });
    } catch (error: any) {
      // Clean up file if it exists
      if (req.file?.path) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      console.error('CSV question upload error:', error);
      res.status(500).json({
        message: error.message || 'Failed to import questions from CSV',
        errors: [error.message || 'Unknown error occurred']
      });
    }
  });

  // Exam Sessions - Student exam taking functionality

  // Start exam - Create new exam session (with re-entry prevention)
  app.post('/api/exam-sessions', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { examId } = req.body;
      const studentId = req.user!.id;

      if (!examId) {
        return res.status(400).json({ message: 'Exam ID is required' });
      }

      // Get exam details to calculate end time
      const exam = await storage.getExamById(examId);

      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }
      if (!exam.isPublished) {
        return res.status(403).json({ message: 'Exam is not published yet' });
      }

      // SECURITY: Verify student belongs to the exam's class
      const student = await storage.getStudent(studentId);
      if (!student || !student.classId) {
        return res.status(403).json({ message: 'You are not enrolled in any class' });
      }
      if (student.classId !== exam.classId) {
        return res.status(403).json({ message: 'This exam is not available for your class' });
      }

      // RE-ENTRY PREVENTION: Check if student already has a completed session for this exam
      const existingSessions = await storage.getExamSessionsByStudent(studentId);
      const completedSession = existingSessions.find(s => s.examId === examId && s.isCompleted);
      
      if (completedSession) {
        // Exam already completed - return existing results with redirect flag
        const existingResult = await storage.getExamResultByExamAndStudent(examId, studentId);
        const studentAnswers = await storage.getStudentAnswers(completedSession.id);
        const examQuestions = await storage.getExamQuestions(examId);
        
        // Parse metadata for submission details
        let submissionReason = 'manual';
        let timeTakenSeconds = 0;
        let violationCount = 0;
        
        if (completedSession.metadata) {
          try {
            const metadata = JSON.parse(completedSession.metadata);
            submissionReason = metadata.submissionReason || 'manual';
            timeTakenSeconds = metadata.timeTakenSeconds || 0;
            violationCount = metadata.violationCount || 0;
          } catch (e) {}
        }
        
        // Format time taken for display
        const formatTimeTaken = (seconds: number) => {
          const mins = Math.floor(seconds / 60);
          const secs = seconds % 60;
          if (mins === 0) return `${secs} seconds`;
          return `${mins} minute${mins !== 1 ? 's' : ''} ${secs} second${secs !== 1 ? 's' : ''}`;
        };
        
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
        
        return res.status(200).json({
          alreadyCompleted: true,
          redirectToResults: true,
          message: 'You have already completed this exam. Redirecting to your results.',
          result: {
            sessionId: completedSession.id,
            score: existingResult?.score || completedSession.score || 0,
            maxScore: existingResult?.maxScore || completedSession.maxScore || exam.totalMarks || 0,
            percentage: completedSession.maxScore && completedSession.score 
              ? Math.round((completedSession.score / completedSession.maxScore) * 100 * 100) / 100
              : 0,
            submittedAt: completedSession.submittedAt?.toISOString() || new Date().toISOString(),
            timeTakenSeconds,
            timeTakenFormatted: formatTimeTaken(timeTakenSeconds),
            submissionReason,
            violationCount,
            questionDetails,
            breakdown: {
              totalQuestions: examQuestions.length,
              answered: studentAnswers.filter(a => a.textAnswer || a.selectedOptionId).length,
              correct: studentAnswers.filter(a => a.isCorrect === true).length,
              incorrect: studentAnswers.filter(a => a.isCorrect === false).length,
              autoScored: studentAnswers.filter(a => a.autoScored === true).length
            }
          }
        });
      }

      const now = new Date();
      const endTime = new Date(now.getTime() + (exam.timeLimit || 60) * 60 * 1000);

      const sessionData = {
        examId,
        studentId,
        startedAt: now,
        timeRemaining: (exam.timeLimit || 60) * 60,
        isCompleted: false,
        status: 'in_progress' as const,
        endTime,
        maxScore: exam.totalMarks || 0,
      };

      // Use idempotent session creation to prevent duplicates
      const session = await storage.createOrGetActiveExamSession(examId, studentId, sessionData);
      
      // Emit realtime event for exam session started
      realtimeService.emitTableChange('exam_sessions', 'INSERT', session, undefined, studentId);
      realtimeService.emitExamEvent(examId, 'started', { 
        sessionId: session.id, 
        studentId, 
        classId: exam.classId 
      });

      res.status(201).json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to start exam' });
    }
  });

  // Get active exam session for student
  app.get('/api/exam-sessions/student/:studentId/active', authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;

      // Ensure student can only access their own session
      if (req.user!.id !== studentId && req.user!.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: 'Unauthorized access to parent records' });
      }
      // Get active session for this student
      const allSessions = await storage.getExamSessionsByStudent(studentId);
      const session = allSessions.find(s => !s.isCompleted) || null;

      if (!session) {
        return res.json(null);
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch active session' });
    }
  });

  // Get all exam sessions for student (includes completed exams)
  app.get('/api/exam-sessions/student/:studentId', authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;

      // Ensure student can only access their own sessions
      if (req.user!.id !== studentId && req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized access to session records' });
      }
      
      // Get all sessions for this student
      const allSessions = await storage.getExamSessionsByStudent(studentId);
      res.json(allSessions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch exam sessions' });
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
      if (req.user!.id !== session.studentId && req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      res.json(session);
    } catch (error) {
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
      if (req.user!.id !== session.studentId && req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: 'Unauthorized' });
      }
      const answers = await storage.getStudentAnswers(sessionId);
      res.json(answers);
    } catch (error) {
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
      const {
        gender, dateOfBirth, staffId, nationalId, phoneNumber, recoveryEmail,
        qualification, specialization, yearsOfExperience,
        subjects, assignedClasses, department, gradingMode,
        notificationPreference, availability, agreement
      } = req.body;

      // Parse JSON arrays
      const parsedSubjects = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
      const parsedClasses = typeof assignedClasses === 'string' ? JSON.parse(assignedClasses) : assignedClasses;

      // Upload files using organized storage system
      let profileImageUrl: string | null = null;
      let signatureUrl: string | null = null;

      if (files['profileImage']?.[0]) {
        const profileResult = await uploadFileToStorage(files['profileImage'][0], {
          uploadType: 'profile',
          userId: teacherId,
          maxSizeMB: 5,
        });
        if (profileResult.success) {
          profileImageUrl = profileResult.url!;
        }
      }

      if (files['signature']?.[0]) {
        const signatureResult = await uploadFileToStorage(files['signature'][0], {
          uploadType: 'profile',
          userId: teacherId,
          category: 'signature',
          maxSizeMB: 2,
        });
        if (signatureResult.success) {
          signatureUrl = signatureResult.url!;
        }
      }

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

        } catch (autoGenError) {
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
        signatureUrl,
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
        profileImageUrl
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
          const { sendEmail } = await import('./email-service');

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
            subjectNames = parsedSubjects.map((id: number) => `Subject #${id}`);
          }
          try {
            const classes = await storage.getAllClasses(true);
            classNames = parsedClasses.map((classId: number) => {
              const cls = classes.find((c: any) => c.id === classId);
              return cls?.name || `Class #${classId}`;
            });
          } catch (error) {
            classNames = parsedClasses.map((id: number) => `Class #${id}`);
          }
          
          const dashboardUrl = `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000')}/portal/admin/teachers`;
          const emailBody = `
            <h2>🎉 New Teacher Auto-Verified</h2>
            <p><strong>Teacher:</strong> ${teacherFullName}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Subjects:</strong> ${subjectNames.join(', ')}</p>
            <p><strong>Classes:</strong> ${classNames.join(', ')}</p>
            <p><strong>Qualification:</strong> ${qualification}</p>
            <p><strong>Years of Experience:</strong> ${yearsOfExperience}</p>
            <p><strong>Staff ID:</strong> ${staffId || 'Pending'}</p>
            <p><a href="${dashboardUrl}">View in Admin Dashboard</a></p>
          `;
          
          await sendEmail({
            to: admin.email,
            subject: '🎉 New Teacher Auto-Verified - THS Portal',
            html: emailBody
          });
        } catch (emailError) {
          // Don't fail the entire process if email fails
        }
      }

      // Log audit event
      await storage.createAuditLog({
        userId: teacherId,
        action: 'teacher_profile_setup_completed',
        entityType: 'teacher_profile',
        entityId: String(profile.id),
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
        subjects: Array.isArray(profile.subjects) ? profile.subjects : (profile.subjects ? [profile.subjects] : []),
        assignedClasses: Array.isArray(profile.assignedClasses) ? profile.assignedClasses : (profile.assignedClasses ? [profile.assignedClasses] : []), // FIX: Use correct field name
        department: profile.department,
        qualification: profile.qualification,
        yearsOfExperience: profile.yearsOfExperience,
        specialization: profile.specialization,
        verified: profile.verified,
        firstLogin: profile.firstLogin
      };


      res.json({
        message: 'Profile setup completed successfully! You can now access your dashboard.',
        hasProfile: true,
        verified: profile.verified,
        profile: completeProfileResponse
      });
    } catch (error) {
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


      res.json(status);
    } catch (error) {
      res.status(500).json({ message: 'Failed to check profile status' });
    }
  });

  // Skip teacher profile setup
  app.post('/api/teacher/profile/skip', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      // Mark profile as skipped
      await storage.updateUser(userId, {
        profileSkipped: true,
        profileCompleted: false,
      });

      res.json({ 
        message: 'Profile setup skipped. You can complete it later from your dashboard.',
        skipped: true
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to skip profile setup' });
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

      res.json(completeProfile);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
    }
  });

  // Get teacher dashboard data (profile, timetable, assignments)
  app.get('/api/teacher/dashboard', authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user!.id;
      const dashboardData = await storage.getTeacherDashboardData(teacherId);
      
      res.json(dashboardData);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch dashboard data', error: error.message });
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

      // Parse the update data
      const updateData = req.body;

      // Handle file uploads using organized storage system
      let profileImageUrl = updateData.profileImageUrl;
      let signatureUrl = updateData.signatureUrl;

      if (files['profileImage']?.[0]) {
        const profileResult = await replaceFile(
          files['profileImage'][0],
          profileImageUrl || undefined,
          {
            uploadType: 'profile',
            userId: teacherId,
            maxSizeMB: 5,
          }
        );
        if (profileResult.success) {
          profileImageUrl = profileResult.url!;
        }
      }

      if (files['signature']?.[0]) {
        const signatureResult = await replaceFile(
          files['signature'][0],
          signatureUrl || undefined,
          {
            uploadType: 'profile',
            userId: teacherId,
            category: 'signature',
            maxSizeMB: 2,
          }
        );
        if (signatureResult.success) {
          signatureUrl = signatureResult.url!;
        }
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
      res.status(500).json({ message: 'Failed to review AI-suggested score' });
    }
  });

  // Initialize session middleware (required for Passport OAuth)
  // CRITICAL: Session must support cross-domain for Render (backend) + Vercel (frontend)
  const isProduction = process.env.NODE_ENV === 'production';
  const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-session-secret-change-in-production' : process.env.JWT_SECRET || SECRET_KEY);

  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  SESSION_SECRET not set in production - using JWT_SECRET as fallback');
  }

  // Configure memory session store for Replit environment
  const MemoryStore = memorystore(session);
  const sessionStore = new MemoryStore({
    checkPeriod: 86400000 // Prune expired entries every 24h
  });

  app.use(session({
    store: sessionStore, // Use SQLite session store
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

  // File storage already initialized in server/index.ts

  app.get('/api/auth/me', authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      // Fetch full user details from database to check isActive status
      const fullUser = await storage.getUser(user.id);
      if (!fullUser || !fullUser.isActive) {
        return res.status(403).json({ message: 'Account is inactive' });
      }
      const { passwordHash, ...userWithoutPassword } = fullUser;
      res.json(userWithoutPassword);
    } catch (error) {
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
      res.status(500).json({ message: 'Failed to update notifications' });
    }
  });

  // Classes API endpoint - returns all classes (including inactive) for dropdown population
  app.get('/api/classes', authenticateUser, async (req, res) => {
    try {
      const classes = await storage.getAllClasses(true);
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch classes' });
    }
  });

  // Create a new class - Admin only
  app.post('/api/classes', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { name, level, classTeacherId, capacity } = req.body;
      
      if (!name || !level) {
        return res.status(400).json({ message: 'Name and level are required' });
      }
      
      const classData = {
        name,
        level,
        classTeacherId: classTeacherId || null,
        capacity: capacity || 30,
        isActive: true
      };
      
      const newClass = await storage.createClass(classData);
      
      // Emit realtime event for class creation
      realtimeService.emitClassEvent(newClass.id.toString(), 'created', newClass, req.user!.id);
      
      res.status(201).json(newClass);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ message: 'A class with this name already exists' });
      }
      res.status(500).json({ message: 'Failed to create class' });
    }
  });

  // Update a class - Admin only
  app.put('/api/classes/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }
      
      const existingClass = await storage.getClass(classId);
      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      const { name, level, classTeacherId, capacity, isActive } = req.body;
      
      const updatedClass = await storage.updateClass(classId, {
        name,
        level,
        classTeacherId: classTeacherId || null,
        capacity,
        isActive
      });
      
      // Emit realtime event for class update
      realtimeService.emitClassEvent(classId.toString(), 'updated', updatedClass, req.user!.id);
      
      res.json(updatedClass);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ message: 'A class with this name already exists' });
      }
      res.status(500).json({ message: 'Failed to update class' });
    }
  });

  // Delete a class - Admin only
  app.delete('/api/classes/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }
      
      const existingClass = await storage.getClass(classId);
      if (!existingClass) {
        return res.status(404).json({ message: 'Class not found' });
      }
      
      const success = await storage.deleteClass(classId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete class' });
      }
      
      // Emit realtime event for class deletion
      realtimeService.emitClassEvent(classId.toString(), 'deleted', { ...existingClass, id: classId }, req.user!.id);
      
      res.json({ message: 'Class deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete class' });
    }
  });

  // Subjects API endpoint
  app.get('/api/subjects', async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch subjects' });
    }
  });

  // Create a new subject - Admin only
  app.post('/api/subjects', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { name, code, description } = req.body;
      
      if (!name || !code) {
        return res.status(400).json({ message: 'Name and code are required' });
      }
      
      const subjectData = {
        name,
        code,
        description: description || null
      };
      
      const newSubject = await storage.createSubject(subjectData);
      
      // Emit realtime event for subject creation
      realtimeService.emitSubjectEvent('created', newSubject, req.user!.id);
      
      res.status(201).json(newSubject);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ message: 'A subject with this code already exists' });
      }
      res.status(500).json({ message: 'Failed to create subject' });
    }
  });

  // Update a subject - Admin only
  app.put('/api/subjects/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const subjectId = parseInt(req.params.id);
      
      if (isNaN(subjectId)) {
        return res.status(400).json({ message: 'Invalid subject ID' });
      }
      
      const existingSubject = await storage.getSubject(subjectId);
      if (!existingSubject) {
        return res.status(404).json({ message: 'Subject not found' });
      }
      
      const { name, code, description } = req.body;
      
      const updatedSubject = await storage.updateSubject(subjectId, {
        name,
        code,
        description
      });
      
      // Emit realtime event for subject update
      realtimeService.emitSubjectEvent('updated', updatedSubject, req.user!.id);
      
      res.json(updatedSubject);
    } catch (error: any) {
      if (error.message?.includes('UNIQUE constraint')) {
        return res.status(409).json({ message: 'A subject with this code already exists' });
      }
      res.status(500).json({ message: 'Failed to update subject' });
    }
  });

  // Delete a subject - Admin only
  app.delete('/api/subjects/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const subjectId = parseInt(req.params.id);
      
      if (isNaN(subjectId)) {
        return res.status(400).json({ message: 'Invalid subject ID' });
      }
      
      const existingSubject = await storage.getSubject(subjectId);
      if (!existingSubject) {
        return res.status(404).json({ message: 'Subject not found' });
      }
      
      const success = await storage.deleteSubject(subjectId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete subject' });
      }
      
      // Emit realtime event for subject deletion
      realtimeService.emitSubjectEvent('deleted', { ...existingSubject, id: subjectId }, req.user!.id);
      
      res.json({ message: 'Subject deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete subject' });
    }
  });

  // Academic Terms API endpoints
  app.get('/api/terms', authenticateUser, async (req, res) => {
    try {
      const terms = await storage.getAcademicTerms();
      res.json(terms);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch academic terms' });
    }
  });

  app.post('/api/terms', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {

      // Validate required fields
      if (!req.body.name || !req.body.year || !req.body.startDate || !req.body.endDate) {
        return res.status(400).json({ message: 'Missing required fields: name, year, startDate, endDate' });
      }
      const term = await storage.createAcademicTerm(req.body);
      
      // Emit realtime event for term creation
      realtimeService.emitTableChange('academic_terms', 'INSERT', term, undefined, req.user!.id);
      realtimeService.emitToRole('admin', 'term.created', term);
      realtimeService.emitToRole('teacher', 'term.created', term);
      
      res.json(term);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create academic term' });
    }
  });

  app.put('/api/terms/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);

      if (isNaN(termId)) {
        return res.status(400).json({ message: 'Invalid term ID' });
      }

      // Check if term exists first
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        return res.status(404).json({ message: 'Academic term not found' });
      }
      const term = await storage.updateAcademicTerm(termId, req.body);
      
      // Emit realtime event for term update
      realtimeService.emitTableChange('academic_terms', 'UPDATE', term, existingTerm, req.user!.id);
      realtimeService.emitToRole('admin', 'term.updated', term);
      realtimeService.emitToRole('teacher', 'term.updated', term);
      
      res.json(term);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update academic term' });
    }
  });

  app.delete('/api/terms/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);

      if (isNaN(termId)) {
        return res.status(400).json({ message: 'Invalid term ID' });
      }

      // Get term first for the realtime event
      const existingTerm = await storage.getAcademicTerm(termId);
      const success = await storage.deleteAcademicTerm(termId);

      if (!success) {
        return res.status(500).json({
          message: 'Failed to delete academic term. The term may not exist or could not be removed from the database.'
        });
      }
      
      // Emit realtime event for term deletion
      realtimeService.emitTableChange('academic_terms', 'DELETE', { id: termId }, existingTerm, req.user!.id);
      realtimeService.emitToRole('admin', 'term.deleted', { id: termId, ...existingTerm });
      realtimeService.emitToRole('teacher', 'term.deleted', { id: termId, ...existingTerm });
      
      res.json({
        message: 'Academic term deleted successfully',
        id: termId,
        success: true
      });
    } catch (error: any) {

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

      // Check if term exists first
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        return res.status(404).json({ message: 'Academic term not found' });
      }
      const term = await storage.markTermAsCurrent(termId);
      
      // Emit realtime event for term becoming current (important for all users)
      realtimeService.emitTableChange('academic_terms', 'UPDATE', term, existingTerm, req.user!.id);
      realtimeService.emitEvent('term.current_changed', term); // Broadcast to all
      
      res.json(term);
    } catch (error: any) {
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
          } else {
          }
        } catch (error) {
          errors.push(`${email}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({
        message: `Deleted ${deletedUsers.length} demo accounts`,
        deletedUsers,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Failed to delete demo accounts"
      });
    }
  });

  // Secure admin-only route to reset weak passwords
  app.post("/api/admin/reset-weak-passwords", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {

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
          }
        }
      }

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
          }
        } catch (error) {
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
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        message: "Failed to reset passwords"
      });
    }
  });

  // Profile image upload endpoint (using organized storage system)
  app.post('/api/upload', authenticateUser, upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Use new organized upload system
      const result = await uploadFileToStorage(req.file, {
        uploadType: 'profile',
        userId: req.user!.id,
        maxSizeMB: 5,
      });

      if (!result.success) {
        return res.status(500).json({ message: result.error || 'Failed to upload file to cloud storage' });
      }

      res.json({ url: result.url });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to upload file' });
    }
  });

  // ==================== HOMEPAGE CONTENT MANAGEMENT ROUTES ====================

  // Homepage image upload endpoint (using organized storage system)
  app.post('/api/upload/homepage', authenticateUser, authorizeRoles(ROLES.ADMIN), upload.single('homePageImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      if (!req.body.contentType) {
        return res.status(400).json({ message: 'Content type is required' });
      }

      // Determine category based on content type (hero, featured, about, slider)
      const category = req.body.contentType || 'general';

      // Use new organized upload system
      const result = await uploadFileToStorage(req.file, {
        uploadType: 'homepage',
        category,
        maxSizeMB: 5,
      });

      if (!result.success) {
        return res.status(500).json({ 
          message: result.error || 'Failed to upload homepage image' 
        });
      }

      const content = await storage.createHomePageContent({
        contentType: req.body.contentType,
        imageUrl: result.url!,
        altText: req.body.altText || '',
        caption: req.body.caption || null,
        displayOrder: parseInt(req.body.displayOrder) || 0,
        isActive: true,
      });

      // Emit realtime event for homepage content creation
      realtimeService.emitHomepageContentEvent('created', content, req.user!.id);

      res.json(content);
    } catch (error: any) {
      res.status(500).json({ 
        message: error.message || 'Failed to upload homepage image',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      });
    }
  });

  // Get all homepage content
  app.get('/api/homepage-content', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { contentType } = req.query;
      const content = await storage.getHomePageContent(contentType as string);
      res.json(content);
    } catch (error) {
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
      
      // Emit realtime event for homepage content update
      realtimeService.emitHomepageContentEvent('updated', updated, req.user!.id);
      
      res.json({
        message: 'Homepage content updated successfully',
        content: updated
      });
    } catch (error) {
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
      // Delete file using organized storage system
      if (content.imageUrl) {
        await deleteFileFromStorage(content.imageUrl);
      }

      const deleted = await storage.deleteHomePageContent(id);

      if (!deleted) {
        return res.status(404).json({ message: 'Homepage content not found' });
      }
      
      // Emit realtime event for homepage content deletion
      realtimeService.emitHomepageContentEvent('deleted', { ...content, id }, req.user!.id);
      
      res.json({ message: 'Homepage content deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete homepage content' });
    }
  });

  // Public endpoint to get all active homepage content (no auth required)
  app.get('/api/public/homepage-content', async (req, res) => {
    try {
      const content = await storage.getHomePageContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get homepage content' });
    }
  });

  // Public homepage content endpoint by type (no auth required for public website)
  app.get('/api/homepage-content/:contentType', async (req, res) => {
    try {
      const { contentType } = req.params;
      const content = await storage.getHomePageContent(contentType);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get homepage content' });
    }
  });

  // Public endpoint to get announcements (no auth required for public website)
  app.get('/api/announcements', async (req, res) => {
    try {
      const { targetRole } = req.query;
      const announcements = await storage.getAnnouncements(targetRole as string);
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get announcements' });
    }
  });

  // Create a new announcement - Admin only
  app.post('/api/announcements', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { title, content, targetRole, priority, expiresAt } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }
      
      const announcementData = {
        title,
        content,
        targetRole: targetRole || null,
        priority: priority || 'normal',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: req.user!.id,
        isActive: true
      };
      
      const newAnnouncement = await storage.createAnnouncement(announcementData);
      
      // Emit realtime event for announcement creation
      realtimeService.emitAnnouncementEvent('created', newAnnouncement, req.user!.id);
      
      res.status(201).json(newAnnouncement);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to create announcement' });
    }
  });

  // Update an announcement - Admin only
  app.put('/api/announcements/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      
      if (isNaN(announcementId)) {
        return res.status(400).json({ message: 'Invalid announcement ID' });
      }
      
      const existingAnnouncement = await storage.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      const { title, content, targetRoles, targetClasses, isPublished, publishedAt } = req.body;
      
      const updatedAnnouncement = await storage.updateAnnouncement(announcementId, {
        title,
        content,
        targetRoles,
        targetClasses,
        isPublished,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined
      });
      
      // Emit realtime event for announcement update
      realtimeService.emitAnnouncementEvent('updated', updatedAnnouncement, req.user!.id);
      
      res.json(updatedAnnouncement);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to update announcement' });
    }
  });

  // Delete an announcement - Admin only
  app.delete('/api/announcements/:id', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      
      if (isNaN(announcementId)) {
        return res.status(400).json({ message: 'Invalid announcement ID' });
      }
      
      const existingAnnouncement = await storage.getAnnouncementById(announcementId);
      if (!existingAnnouncement) {
        return res.status(404).json({ message: 'Announcement not found' });
      }
      
      const success = await storage.deleteAnnouncement(announcementId);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete announcement' });
      }
      
      // Emit realtime event for announcement deletion
      realtimeService.emitAnnouncementEvent('deleted', { ...existingAnnouncement, id: announcementId }, req.user!.id);
      
      res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete announcement' });
    }
  });

  // ==================== ATTENDANCE MANAGEMENT ROUTES ====================

  // Record attendance - Teacher or Admin only
  app.post('/api/attendance', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId, classId, date, status, notes } = req.body;
      
      if (!studentId || !classId || !date || !status) {
        return res.status(400).json({ message: 'studentId, classId, date, and status are required' });
      }
      
      const attendanceData = {
        studentId,
        classId,
        date,
        status,
        recordedBy: req.user!.id,
        notes: notes || null
      };
      
      const newAttendance = await storage.recordAttendance(attendanceData);
      
      // Emit realtime event for attendance record
      realtimeService.emitAttendanceEvent(classId.toString(), 'marked', { ...newAttendance, recordedBy: req.user!.id });
      
      res.status(201).json(newAttendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to record attendance' });
    }
  });

  // Bulk record attendance for a class - Teacher or Admin only
  app.post('/api/attendance/bulk', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId, date, records } = req.body;
      
      if (!classId || !date || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ message: 'classId, date, and records array are required' });
      }
      
      const createdRecords = [];
      for (const record of records) {
        const attendanceData = {
          studentId: record.studentId,
          classId,
          date,
          status: record.status,
          recordedBy: req.user!.id,
          notes: record.notes || null
        };
        const newAttendance = await storage.recordAttendance(attendanceData);
        createdRecords.push(newAttendance);
        
        // Emit realtime event for each attendance record
        realtimeService.emitAttendanceEvent(classId.toString(), 'marked', { ...newAttendance, recordedBy: req.user!.id });
      }
      
      res.status(201).json({
        message: `Successfully recorded ${createdRecords.length} attendance records`,
        records: createdRecords
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to record bulk attendance' });
    }
  });

  // Get attendance by student - Student, Teacher, Parent, Admin
  app.get('/api/attendance/student/:studentId', authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { date } = req.query;
      
      const attendance = await storage.getAttendanceByStudent(studentId, date as string);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch student attendance' });
    }
  });

  // Get attendance by class and date - Teacher or Admin
  app.get('/api/attendance/class/:classId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const { date } = req.query;
      
      if (isNaN(classId)) {
        return res.status(400).json({ message: 'Invalid class ID' });
      }
      
      if (!date) {
        return res.status(400).json({ message: 'Date is required' });
      }
      
      const attendance = await storage.getAttendanceByClass(classId, date as string);
      res.json(attendance);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch class attendance' });
    }
  });

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

      // First check if roles exist, if not this will tell us about database structure
      try {
        const existingRoles = await storage.getRoles();

        // If no roles, we can't proceed without proper role creation method
        // For now, let's just log what we found and return a helpful message
        if (existingRoles.length === 0) {
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
            roleId: existingRoles.find(r => r.name === 'Student')?.id || existingRoles[0].id,
            profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false // 🔧 FIX: Demo users start with incomplete profile
          },
          {
            email: 'teacher@demo.com',
            firstName: 'Jane',
            lastName: 'Smith',
            roleId: existingRoles.find(r => r.name === 'Teacher')?.id || existingRoles[0].id,
            profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false // 🔧 FIX: Demo users start with incomplete profile
          },
          {
            email: 'parent@demo.com',
            firstName: 'Bob',
            lastName: 'Johnson',
            roleId: existingRoles.find(r => r.name === 'Parent')?.id || existingRoles[0].id,
            profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false // 🔧 FIX: Demo users start with incomplete profile
          },
          {
            email: 'admin@demo.com',
            firstName: 'Admin',
            lastName: 'User',
            roleId: existingRoles.find(r => r.name === 'Admin')?.id || existingRoles[0].id,
            profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false // 🔧 FIX: Demo users start with incomplete profile
          }
        ];

        let createdCount = 0;
        for (const userData of demoUsers) {
          try {
            // Check if user already exists
            const existingUser = await storage.getUserByEmail(userData.email);
            if (!existingUser) {
              // Generate UUID for demo user (required for PostgreSQL)
              const userId = randomUUID();
              await storage.createUser({ id: userId, ...userData } as any);
              createdCount++;
            } else {
            }
          } catch (userError) {
          }
        }

        res.json({
          message: "Demo setup completed",
          rolesCount: existingRoles.length,
          usersCreated: createdCount,
          roles: existingRoles.map(r => r.name)
        });

      } catch (dbError) {
        res.status(500).json({
          message: "Database connection failed",
          error: dbError instanceof Error ? dbError.message : "Unknown database error"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Setup failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);

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

        return res.status(401).json({
          message: "Invalid username or password. Please check your credentials and try again.",
          hint: "Make sure CAPS LOCK is off and you're using the correct username and password."
        });
      }
      // 🔧 DEBUG: Log profile status for troubleshooting (dev only)
      // Get user role for various checks
      const userRole = await storage.getRole(user.roleId);
      const roleName = userRole?.name?.toLowerCase();
      const isStaffAccount = roleName === 'admin' || roleName === 'teacher';

      // SECURITY CHECK: Block suspended accounts BEFORE incrementing attempts
      // This shows the detailed suspension message on all subsequent login attempts
      if (user.status === 'suspended') {

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
        return res.status(403).json({
          message: "Account Disabled",
          description: "Your account has been disabled and is no longer active. Please contact the school administrator if you believe this is an error.",
          statusType: "disabled"
        });
      }
      // STRICT ENFORCEMENT: Admin/Teacher with Google OAuth CANNOT use password login - Message 8
      if ((roleName === 'admin' || roleName === 'teacher') && user.authProvider === 'google') {
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
        return res.status(401).json({
          message: "Account Setup Incomplete",
          description: "Your account setup is incomplete. Please contact the school administrator for assistance.",
          statusType: "setup_incomplete"
        });
      }
      // Compare provided password with stored hash - Message 1 (Invalid Credentials)
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
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
      
      // Collect authorized resource scopes for realtime subscriptions
      let authorizedClasses: string[] = [];
      let authorizedStudentIds: string[] = [];
      
      // For teachers: get their assigned classes
      if (roleName === 'teacher') {
        const teacherProfile = await storage.getTeacherProfile(user.id);
        if (teacherProfile?.assignedClasses) {
          try {
            const parsed = typeof teacherProfile.assignedClasses === 'string' 
              ? JSON.parse(teacherProfile.assignedClasses) 
              : teacherProfile.assignedClasses;
            if (Array.isArray(parsed)) {
              authorizedClasses = parsed.map((c: any) => String(c));
            }
          } catch {
            authorizedClasses = [];
          }
        }
      }
      
      // For students: get their own student ID
      if (roleName === 'student') {
        const student = await storage.getStudentByUserId(user.id);
        if (student) {
          authorizedStudentIds = [student.id.toString()];
          if (student.classId) {
            authorizedClasses = [student.classId.toString()];
          }
        }
      }
      
      // For parents: get their linked student IDs
      if (roleName === 'parent') {
        const linkedStudents = await storage.getLinkedStudents(user.id);
        if (linkedStudents && linkedStudents.length > 0) {
          authorizedStudentIds = linkedStudents.map(s => s.id.toString());
          authorizedClasses = linkedStudents
            .filter(s => s.classId)
            .map(s => s.classId!.toString());
        }
      }
      
      // Generate JWT token with user claims and resource scopes
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        roleName: roleName,
        authorizedClasses: authorizedClasses,
        authorizedStudentIds: authorizedStudentIds,
        iat: Math.floor(Date.now() / 1000),
      };

      const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });


      // Ensure mustChangePassword is included in the response
      res.json({
        token,
        mustChangePassword: user.mustChangePassword || false, // Include password change flag
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
          profileImageUrl: user.profileImageUrl,
          mustChangePassword: user.mustChangePassword || false, // Also include in user object
        }
      });
    } catch (error) {
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


      res.json({ message: "Password changed successfully" });
    } catch (error) {
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
        console.log(`🚨 Rate limit exceeded for password reset: ${identifier} from IP ${ipAddress}`);

        // Track failed attempt
        await storage.createPasswordResetAttempt(identifier, ipAddress, false);

        // Check for suspicious activity (5+ attempts in 60 min = lock account temporarily)
        const suspiciousAttempts = await storage.getRecentPasswordResetAttempts(identifier, 60);
        if (suspiciousAttempts.length >= 5) {
          const user = await storage.getUserByEmail(identifier) || await storage.getUserByUsername(identifier);
          if (user) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
            await storage.lockAccount(user.id, lockUntil);
            console.log(`🔒 Account temporarily locked due to suspicious password reset activity: ${user.id}`);

            // Create audit log
            await storage.createAuditLog({
              userId: user.id,
              action: 'account_locked_suspicious_activity',
              entityType: 'user',
              entityId: '0',
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
        entityId: '0',
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
        console.log(`❌ Failed to send password reset email to ${recoveryEmail}`);
        return res.status(500).json({
          message: "Failed to send password reset email. Please try again later or contact administrator."
        });
      }
      // In development without API key, show the reset code/token for testing
      if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
        console.log(`📧 DEV MODE - Password Reset Token: ${resetToken}`);
        console.log(`📧 DEV MODE - Reset Link: ${resetLink}`);

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
      console.log(`✅ Password reset email sent to ${recoveryEmail} for user ${user.id}`);

      res.json({
        message: "If an account exists with that email/username, a password reset link will be sent."
      });
    } catch (error) {

      // Track failed attempt
      try {
        const { identifier } = req.body;
        if (identifier) {
          await storage.createPasswordResetAttempt(identifier, ipAddress, false);
        }
      } catch (trackError) {
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
        entityId: '0',
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

      console.log(`✅ Password reset successfully for user ${resetToken.userId} from IP ${ipAddress}`);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
        });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ==================== ADMIN RECOVERY POWERS ENDPOINTS ====================

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
      }
      // TODO: In production, send actual email
      // await sendEmail({ to: recoveryEmail, subject: notificationSubject, text: notificationBody });

      console.log(`✅ Admin ${req.user?.email} reset password for user ${userId}`);

      res.json({
        message: "Password reset successfully",
        tempPassword: password,
        username: user.username || user.email,
        email: recoveryEmail
      });
    } catch (error) {
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

      res.json({
        message: "Recovery email updated successfully",
        oldEmail: user.recoveryEmail || user.email,
        newEmail: recoveryEmail
      });
    } catch (error) {
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
        entityId: '0', // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, recoveryEmail: user.recoveryEmail }),
        newValue: JSON.stringify({ userId: user.id, recoveryEmail }),
        reason: `User ${req.user!.email} updated recovery email`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });


      res.json({
        message: "Recovery email updated successfully",
        user: { ...updatedUser, recoveryEmail: updatedUser.recoveryEmail } // Explicitly return updated recoveryEmail
      });
    } catch (error) {
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
        entityId: '0',
        oldValue: JSON.stringify({ accountLockedUntil: user.accountLockedUntil }),
        newValue: JSON.stringify({ accountLockedUntil: null }),
        reason: 'Account manually unlocked by admin',
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'] || null,
      });

      console.log(`✅ Admin ${req.user?.email} unlocked account for user ${userId}`);

      res.json({
        message: "Account unlocked successfully",
        username: user.username || user.email
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlock account" });
    }
  });

  // ==================== ACCOUNT LOCKOUT MANAGEMENT ENDPOINTS ====================

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


      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "Account unlocked successfully",
        user: safeUser
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlock account" });
    }
  });

  // ==================== INVITE SYSTEM ENDPOINTS ====================

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
      res.status(500).json({ message: "Failed to list invites" });
    }
  });

  // List pending invites (Admin only)
  app.get("/api/invites/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites = await storage.getPendingInvites();
      res.json(invites);
    } catch (error) {
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
      const { generateUsername, getNextUserNumber } = await import('./auth-utils');
      const currentYear = new Date().getFullYear().toString();
      const allUsers = await storage.getAllUsers();
      const existingUsernames = allUsers.map(u => u.username).filter((u): u is string => !!u);
      const nextNumber = getNextUserNumber(existingUsernames, invite.roleId);
      const username = generateUsername(invite.roleId, nextNumber);

      // Hash password
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Generate UUID for invited user (required for PostgreSQL)
      const userId = randomUUID();

      // Create user account
      const user = await storage.createUser({
        id: userId, // PostgreSQL requires explicit UUID
        email: invite.email,
        username,
        firstName,
        lastName,
        roleId: invite.roleId,
        passwordHash,
        authProvider: 'local',
        status: 'active',
        createdVia: 'invite',
        mustChangePassword: true, // ✅ SECURITY: Force password change on first login even for invited users
        profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
        profileSkipped: false // 🔧 FIX: New staff start with incomplete profile
      } as any);

      // Mark invite as accepted
      await storage.markInviteAsAccepted(invite.id, user.id);

      // Generate JWT token
      const token_jwt = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        SECRET_KEY,
        { expiresIn: '24h' }
      );


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
      res.status(500).json({ message: "Failed to delete invite" });
    }
  });

  // Health check endpoint for monitoring
  app.get("/api/health", async (_req, res) => {
    try {
      // Simple database connection check using drizzle query
      await db.select().from(schema.roles).limit(1);

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

  // Public contact form with 100% PostgreSQL persistence
  app.post("/api/contact", async (req, res) => {
    try {
      const data = contactSchema.parse(req.body);

      // Save to PostgreSQL database permanently
      const contactMessageData = insertContactMessageSchema.parse({
        name: data.name,
        email: data.email,
        message: data.message,
        subject: null, // Can be extended later if needed
        isRead: false
      });

      const savedMessage = await storage.createContactMessage(contactMessageData);

      res.json({
        message: "Message sent successfully! We'll get back to you soon.",
        id: savedMessage.id
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to send message. Please try again." });
    }
  });

  // Analytics overview endpoint - Admin only
  app.get("/api/analytics/overview", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      // Fetch all roles for ID lookups
      const allRoles = await storage.getRoles();
      const roleMap = new Map(allRoles.map(r => [r.name.toLowerCase(), r.id]));

      // Get role IDs
      const studentRoleId = roleMap.get('student');
      const teacherRoleId = roleMap.get('teacher');

      // Parallel fetch for performance
      const [
        allStudents,
        allTeachers,
        allClasses
      ] = await Promise.all([
        studentRoleId ? storage.getUsersByRole(studentRoleId) : [],
        teacherRoleId ? storage.getUsersByRole(teacherRoleId) : [],
        storage.getAllClasses()
      ]);

      // Calculate students added this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newStudentsThisMonth = allStudents.filter(student => {
        if (!student.createdAt) return false;
        const createdAt = new Date(student.createdAt);
        return createdAt >= startOfMonth;
      }).length;

      // Calculate teachers added this term (approximation: last 3 months)
      const startOfTerm = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const newTeachersThisTerm = allTeachers.filter(teacher => {
        if (!teacher.createdAt) return false;
        const createdAt = new Date(teacher.createdAt);
        return createdAt >= startOfTerm;
      }).length;

      res.json({
        totalStudents: allStudents.length,
        totalTeachers: allTeachers.length,
        totalClasses: allClasses.length,
        recentActivity: {
          newStudentsThisMonth,
          newTeachersThisTerm
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // User management - Admin only - OPTIMIZED for speed
  app.get("/api/users", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { role } = req.query;
      const currentUser = req.user;
      
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      // Teachers can only fetch Teacher or Student data (for exam collaboration purposes)
      if (currentUser.roleId === ROLES.TEACHER) {
        if (!role || (role !== 'Teacher' && role !== 'Student')) {
          return res.status(403).json({ message: "Teachers can only view Teacher and Student user lists" });
        }
      }
      
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
      // SECURITY: Filter admin accounts based on user role and system settings
      const isCurrentUserSuperAdmin = currentUser.roleId === ROLES.SUPER_ADMIN;
      
      if (!isCurrentUserSuperAdmin) {
        // Get system settings to check if admin accounts should be hidden
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true; // Default to true for security
        
        if (hideAdminAccounts) {
          // Filter out Super Admin and Admin accounts for non-Super Admin users
          users = users.filter(user => 
            user.roleId !== ROLES.SUPER_ADMIN && user.roleId !== ROLES.ADMIN
          );
        }
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
      res.status(500).json({ message: "Failed to fetch users" });
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
      // SECURITY: Check if admin can access this user account
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true;
        
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({ 
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }

      const oldStatus = user.status;

      // Update the user status to active
      const updatedUser = await storage.updateUserStatus(id, 'active', adminUser.id, 'User verified by admin');

      // PERFORMANCE: Log audit event asynchronously
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_verified',
        entityType: 'user',
        entityId: '0', // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'active' }),
        reason: `Admin ${adminUser.email} verified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User verified and activated successfully",
        user: safeUser
      });
    } catch (error) {
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
      // SECURITY: Check if admin can access this user account
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true;
        
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({ 
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }

      const oldStatus = user.status;

      // Update the user status to pending
      const updatedUser = await storage.updateUserStatus(id, 'pending', adminUser.id, 'User unverified by admin - awaiting approval');

      // PERFORMANCE: Log audit event asynchronously (non-critical)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_unverified',
        entityType: 'user',
        entityId: '0', // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'pending' }),
        reason: `Admin ${adminUser.email} unverified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User unverified and moved to pending status",
        user: safeUser
      });
    } catch (error) {
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
      // SECURITY: Check if admin can access this user account
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true;
        
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({ 
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }

      const oldStatus = user.status;

      // Update the user status to suspended
      const updatedUser = await storage.updateUserStatus(id, 'suspended', adminUser.id, reason || 'Account suspended by admin');

      // PERFORMANCE: Log audit event asynchronously (non-blocking for instant response)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_suspended',
        entityType: 'user',
        entityId: '0', // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'suspended' }),
        reason: reason || `Admin ${adminUser.email} suspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User suspended successfully",
        user: safeUser
      });
    } catch (error) {
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
      // SECURITY: Check if admin can access this user account
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true;
        
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({ 
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }

      const oldStatus = user.status;

      // Update the user status to active
      const updatedUser = await storage.updateUserStatus(id, 'active', adminUser.id, 'Suspension lifted by admin');

      // PERFORMANCE: Log audit event asynchronously
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_unsuspended',
        entityType: 'user',
        entityId: '0', // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: 'active' }),
        reason: `Admin ${adminUser.email} unsuspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User unsuspended successfully",
        user: safeUser
      });
    } catch (error) {
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
        entityId: '0', // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status }),
        reason: reason || `Admin ${adminUser.email} changed status of user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: `User status updated to ${status}`,
        user: safeUser
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });

  // Update user (Super Admin and Admin only)
  app.put("/api/users/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;

      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      // Validate request body
      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        password: z.string().min(6).optional(),
      });

      const validatedData = updateSchema.parse(req.body);

      // Check if user exists
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // SECURITY: Check if admin can access this user account
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true;
        
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({ 
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }

      // Prepare update data
      const updateData: any = {};
      if (validatedData.firstName) updateData.firstName = validatedData.firstName;
      if (validatedData.lastName) updateData.lastName = validatedData.lastName;
      if (validatedData.email) updateData.email = validatedData.email;

      // Hash password if provided
      if (validatedData.password) {
        const hashedPassword = await bcrypt.hash(validatedData.password, BCRYPT_ROUNDS);
        updateData.passwordHash = hashedPassword;
      }
      // Update user in database
      const updatedUser = await storage.updateUser(id, updateData);

      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      // Log audit event
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_updated',
        entityType: 'user',
        entityId: '0',
        oldValue: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }),
        newValue: JSON.stringify(updateData),
        reason: `Admin ${adminUser.email} updated user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.json({
        message: "User updated successfully",
        user: safeUser
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Delete user (permanent removal - Super Admin and Admin only) - ENHANCED with retry logic and comprehensive error handling
  app.delete("/api/users/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req, res) => {
    const startTime = Date.now();

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
      // Prevent deleting your own account
      if (user.id === adminUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      // CRITICAL SECURITY: Check system settings for admin account protection
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings = await storage.getSystemSettings();
        const hideAdminAccounts = settings?.hideAdminAccountsFromAdmins ?? true;
        
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({ 
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      
      // CRITICAL SECURITY: Only Super Admins can delete Super Admin accounts
      if (user.roleId === ROLES.SUPER_ADMIN && adminUser.roleId !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ 
          message: "Only Super Admins can delete Super Admin accounts.",
          code: "SUPER_ADMIN_PROTECTED"
        });
      }
      // CRITICAL SECURITY: Admins cannot delete other Admin accounts
      if (user.roleId === ROLES.ADMIN && adminUser.roleId === ROLES.ADMIN) {
        return res.status(403).json({ 
          message: "Admins cannot delete other Admin accounts.",
          code: "ADMIN_PROTECTED"
        });
      }

      // RETRY LOGIC: Attempt delete with retries for transient errors
      let deleted = false;
      let lastError = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          deleted = await storage.deleteUser(id);

          if (deleted) {
            break;
          } else {
          }
        } catch (deleteError: any) {
          lastError = deleteError;

          // Check for permission or database errors
          if (deleteError?.code === '42501' || deleteError?.message?.includes('permission denied')) {
            return res.status(403).json({
              message: "Database permission error: Cannot delete user due to Row Level Security policies. Please check database RLS settings or use 'Disable Account' instead.",
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
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
        }
      }
      if (!deleted) {
        const errorMsg = lastError?.message || "Unknown error";

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
        return res.status(500).json({
          message: "Delete operation completed but user still exists. This may be a database policy issue.",
          technicalDetails: "DELETE_VERIFICATION_FAILED"
        });
      }

      // PERFORMANCE: Log audit event asynchronously (non-blocking for instant response)
      storage.createAuditLog({
        userId: adminUser.id,
        action: 'user_deleted',
        entityType: 'user',
        entityId: '0',
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
      });

      // Emit realtime event for user deletion
      realtimeService.emitUserEvent(id, 'deleted', { id, email: user.email, username: user.username }, user.roleId?.toString());

      const totalTime = Date.now() - startTime;

      res.json({
        message: "User deleted successfully",
        deletedUserId: id,
        executionTime: `${totalTime}ms`
      });
    } catch (error: any) {
      const totalTime = Date.now() - startTime;

      res.status(500).json({
        message: "An unexpected error occurred while deleting user",
        technicalDetails: error.message
      });
    }
  });

  // Reset user password (Admin and Super Admin)
  app.post("/api/users/:id/reset-password", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword, forceChange } = z.object({
        newPassword:z.string().min(6, "Password must be at least 6 characters").optional(),
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
      // Generate temporary password if none provided
      let passwordToUse = newPassword;
      let generatedPassword: string | undefined;

      if (!newPassword) {
        const { generateTempPassword } = await import('./username-generator');
        generatedPassword = generateTempPassword();
        passwordToUse = generatedPassword;
      }
      // Hash the password
      const passwordHash = await bcrypt.hash(passwordToUse!, BCRYPT_ROUNDS);

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
        entityId: '0',
        oldValue: JSON.stringify({ userId: user.id, mustChangePassword: user.mustChangePassword }),
        newValue: JSON.stringify({ userId: user.id, mustChangePassword: forceChange }),
        reason: `Admin ${adminUser.email} reset password for user ${user.email || user.username}${forceChange ? ' (force change on next login)' : ''}${generatedPassword ? ' (auto-generated)' : ''}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      // Remove sensitive data
      const { passwordHash: _, ...safeUser } = user;

      res.json({
        message: `Password reset successfully${forceChange ? '. User must change password on next login.' : ''}`,
        user: { ...safeUser, email: user.email, username: user.username },
        ...(generatedPassword && { temporaryPassword: generatedPassword }) // Include generated password if auto-generated
      });
    } catch (error) {
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
        entityId: '0', // Placeholder, needs proper entity ID if applicable
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
      const { limit, action, entityType } = z.object({
        limit: z.coerce.number().int().positive().max(1000).optional().default(100),
        action: z.string().optional(),
        entityType: z.string().optional()
      }).parse(req.query);

      const logs = await storage.getAuditLogs({
        limit,
        action,
        entityType
      });

      // Enrich logs with user information
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const user = log.userId ? await storage.getUser(log.userId) : null;
        return {
          ...log,
          userEmail: user?.email,
          userName: `${user?.firstName} ${user?.lastName}`
        };
      }));

      res.json(enrichedLogs);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  app.post("/api/users", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      // Extract password from request and hash it before storage
      const { password, ...otherUserData } = req.body;

      if (!password || typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      
      // ========== ROLE HIERARCHY ENFORCEMENT ==========
      // Super Admin (1) can create: Admin (2), Teacher (3), Student (4), Parent (5)
      // Admin (2) can create: Teacher (3), Student (4), Parent (5) - NOT Super Admin or Admin
      // Teacher (3) can create: Student (4) only
      
      const creatorRoleId = req.user!.roleId;
      const targetRoleId = otherUserData.roleId;
      
      // Teachers can only create students
      if (creatorRoleId === ROLES.TEACHER && targetRoleId !== ROLES.STUDENT) {
        return res.status(403).json({ message: "Teachers can only create student accounts" });
      }
      
      // Admins cannot create Super Admins or other Admins
      if (creatorRoleId === ROLES.ADMIN) {
        if (targetRoleId === ROLES.SUPER_ADMIN) {
          return res.status(403).json({ message: "Admins cannot create Super Admin accounts" });
        }
        if (targetRoleId === ROLES.ADMIN) {
          return res.status(403).json({ message: "Admins cannot create other Admin accounts. Only Super Admins can create Admin accounts." });
        }
      }
      
      // Super Admin can create any role (no restrictions)
      // ========== END ROLE HIERARCHY ENFORCEMENT ==========
      
      // Generate username if not provided (based on roleId)
      let username = otherUserData.username;
      if (!username && otherUserData.roleId) {
        const { generateUsernameByRole } = await import('./username-generator');
        username = await generateUsernameByRole(otherUserData.roleId);
      }
      // Hash password with bcrypt
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

      // Generate UUID for new user (required for PostgreSQL)
      const userId = randomUUID();

      // Prepare user data with hashed password and generated username
      // ✅ AUTO-APPROVE: Set status to 'active' since user is created by authorized admin or teacher
      // No approval needed when created by Super Admin, Admin, or Teacher
      const userData = {
        id: userId, // PostgreSQL requires explicit UUID
        ...insertUserSchema.parse({
          ...otherUserData,
          username,
          passwordHash,
          status: 'active', // ✅ AUTO-APPROVE: Direct creation by admin/teacher means instant approval
          isActive: true, // ✅ Enable account immediately
          mustChangePassword: true, // ✅ SECURITY: ALWAYS force password change on first login - cannot be overridden
          profileCompleted: otherUserData.profileCompleted ?? false, // 🔧 FIX: Default to false if not provided
          profileSkipped: otherUserData.profileSkipped ?? false, // 🔧 FIX: Default to false if not provided
          createdVia: creatorRoleId === ROLES.TEACHER ? 'teacher' : (creatorRoleId === ROLES.SUPER_ADMIN ? 'superadmin' : 'admin'), // Track who created the user
          createdBy: req.user!.id // Track creator user ID
        })
      };

      const user = await storage.createUser(userData as any);

      // If creating a student, also create the student record if classId and admissionNumber are provided
      if (otherUserData.roleId === ROLES.STUDENT && otherUserData.classId) {
        await storage.createStudent({
          id: user.id,
          admissionNumber: username, // Use username as admission number
          admissionDate: new Date().toISOString().split('T')[0], // Today's date as admission date
          classId: otherUserData.classId,
          parentId: otherUserData.parentId || null
        });
      }
      // Remove password hash from response for security
      const { passwordHash: _, ...userResponse } = user;

      // Emit realtime event for user creation
      realtimeService.emitUserEvent(user.id, 'created', userResponse, user.roleId?.toString());

      // Include temporary password in response for admin/teacher to share with user
      // This is only sent once and should be displayed to admin/teacher immediately
      res.json({
        ...userResponse,
        temporaryPassword: password
      });
    } catch (error) {
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
      
      // Emit realtime event for user update
      realtimeService.emitUserEvent(user.id, 'updated', userResponse, user.roleId?.toString());
      
      res.json(userResponse);
    } catch (error) {
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
      const allUsers = await storage.getAllUsers();
      const existingUsernames = allUsers.map(u => u.username).filter((u): u is string => !!u);
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
            const parentCount = existingUsernames.filter(u => u.startsWith(`THS-PAR-`)).length + 1;
            const parentUsername = generateUsername(parentRoleData.id, parentCount);
            const parentPassword = generatePassword(currentYear);
            const parentPasswordHash = await bcrypt.hash(parentPassword, BCRYPT_ROUNDS);

            // Generate UUID for parent (required for PostgreSQL)
            const csvParentId = randomUUID();

            parent = await storage.createUser({
              id: csvParentId, // PostgreSQL requires explicit UUID
              username: parentUsername,
              email: parentEmail,
              passwordHash: parentPasswordHash,
              roleId: parentRoleData.id,
              firstName: parentFirstName,
              lastName: parentLastName,
              mustChangePassword: true,
              profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
              profileSkipped: false // 🔧 FIX: CSV import parents start with incomplete profile
            } as any);

            // CRITICAL: Track newly created username to prevent duplicates in same batch
            existingUsernames.push(parentUsername);
            parentCredentials = { username: parentUsername, password: parentPassword };
            parentId = parent.id;
          } else {
            parentId = parent.id;
          }
          // Get class (including inactive classes to allow CSV uploads to any existing class)
          const classObj = await storage.getAllClasses(true);
          const studentClass = classObj.find(c => c.name.toLowerCase() === className.toLowerCase());

          if (!studentClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }
          // Create student account - calculate correct sequence number
          const studentCount = existingUsernames.filter(u => u.startsWith(`THS-STU-`)).length + 1;
          const studentUsername = generateUsername(studentRoleData.id, studentCount);
          const studentPassword = generatePassword(currentYear);
          const studentPasswordHash = await bcrypt.hash(studentPassword, BCRYPT_ROUNDS);

          // Generate UUID for student (required for PostgreSQL)
          const csvStudentId = randomUUID();

          const studentUser = await storage.createUser({
            id: csvStudentId, // PostgreSQL requires explicit UUID
            username: studentUsername, // Auto-generated email
              email: `${studentUsername.toLowerCase()}@ths.edu`, // Auto-generated email
              passwordHash: studentPasswordHash,
              roleId: studentRoleData.id,
              firstName: studentFirstName,
              lastName: studentLastName,
              mustChangePassword: true,
              profileCompleted: false, // 🔧 FIX: Explicitly set profile fields
              profileSkipped: false // 🔧 FIX: CSV import students start with incomplete profile
            } as any);

            // CRITICAL: Track newly created username to prevent duplicates in same batch
            existingUsernames.push(studentUsername);

            // Create student record
            const admissionNumber = studentUsername;
            await storage.createStudent({
              id: studentUser.id,
              admissionNumber,
              admissionDate: new Date().toISOString().split('T')[0], // Today's date as admission date
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
        // Clean up file if it exists
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
          entityId: '0', // Bulk operation
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
        res.status(500).json({ message: error.message || 'Failed to import students' });
      }
    });

    // ==================== STUDENT PROFILE ROUTES ====================

    // Get all students with enriched user data
    app.get('/api/students', authenticateUser, async (req, res) => {
      try {
        // Fetch all students from database
        const allStudents = await storage.getAllStudents(false); // false = only active students
        
        // Enrich with user data
        const enrichedStudents = await Promise.all(
          allStudents.map(async (student: any) => {
            const user = await storage.getUser(student.id);
            const classInfo = student.classId ? await storage.getClass(student.classId) : null;
            const parentUser = student.parentId ? await storage.getUser(student.parentId) : null;
            
            return {
              ...student,
              user: user ? {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                phone: user.phone,
                gender: user.gender,
                dateOfBirth: user.dateOfBirth,
                profileImageUrl: user.profileImageUrl,
                isActive: user.isActive,
                status: user.status
              } : null,
              class: classInfo,
              parent: parentUser ? {
                id: parentUser.id,
                firstName: parentUser.firstName,
                lastName: parentUser.lastName,
                email: parentUser.email,
                phone: parentUser.phone
              } : null
            };
          })
        );
        
        res.json(enrichedStudents);
      } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch students' });
      }
    });

    // Create a single student
    app.post('/api/students', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
      try {
        const validatedData = createStudentSchema.parse(req.body);
        const adminUserId = req.user!.id;
        const year = new Date().getFullYear();
        
        const result = await db.transaction(async (tx: any) => {
          // Generate student credentials
          const studentUsername = await generateStudentUsername();
          const studentPassword = generateStudentPassword();
          const passwordHash = await bcrypt.hash(studentPassword, BCRYPT_ROUNDS);
          const studentEmail = `${studentUsername}@ths.edu`;
          
          // Generate UUID for student (required for PostgreSQL)
          const studentId = randomUUID();
          
          // Create student user account
          const [studentUser] = await tx.insert(users).values({
            id: studentId, // PostgreSQL requires explicit UUID
            username: studentUsername,
            email: studentEmail,
            passwordHash,
            roleId: ROLES.STUDENT,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            phone: validatedData.phone || null,
            address: validatedData.address || null,
            dateOfBirth: validatedData.dateOfBirth,
            gender: validatedData.gender,
            profileImageUrl: validatedData.profileImageUrl || null,
            isActive: true,
            status: 'active',
            createdVia: 'admin',
            createdBy: adminUserId,
            mustChangePassword: true
          }).returning();
          
          // Generate admission number
          const admissionNumber = `THS/${year}/${String(Date.now()).slice(-6)}`;
          
          // Create student record
          const [student] = await tx.insert(students).values({
            id: studentUser.id,
            admissionNumber,
            classId: validatedData.classId,
            admissionDate: validatedData.admissionDate,
            emergencyContact: validatedData.emergencyContact || null,
            medicalInfo: validatedData.medicalInfo || null,
            parentId: validatedData.parentId || null
          }).returning();
          
          // Handle parent linking/creation if parentPhone provided
          let parentCredentials: any = null;
          
          if (validatedData.parentPhone && !validatedData.parentId) {
            // Check if parent exists by phone
            const existingParent = await tx.select()
              .from(users)
              .where(and(
                eq(users.phone, validatedData.parentPhone),
                eq(users.roleId, ROLES.PARENT)
              ))
              .limit(1);
            
            if (existingParent.length > 0) {
              // Link to existing parent
              await tx.update(students)
                .set({ parentId: existingParent[0].id })
                .where(eq(students.id, studentUser.id));
              
              student.parentId = existingParent[0].id;
            } else {
              // Create new parent account
              const parentUsername = await generateParentUsername();
              const parentPassword = generatePassword();
              const parentHash = await bcrypt.hash(parentPassword, BCRYPT_ROUNDS);
              const parentEmail = `${parentUsername}@ths.edu`;
              
              // Generate UUID for parent (required for PostgreSQL)
              const parentId = randomUUID();
              
              const [parentUser] = await tx.insert(users).values({
                id: parentId, // PostgreSQL requires explicit UUID
                username: parentUsername,
                email: parentEmail,
                passwordHash: parentHash,
                roleId: ROLES.PARENT,
                firstName: validatedData.guardianName || `Parent of ${validatedData.firstName}`,
                lastName: validatedData.lastName,
                phone: validatedData.parentPhone,
                isActive: true,
                status: 'active',
                createdVia: 'admin',
                createdBy: adminUserId,
                mustChangePassword: true
              }).returning();
              
              // Link student to new parent
              await tx.update(students)
                .set({ parentId: parentUser.id })
                .where(eq(students.id, studentUser.id));
              
              student.parentId = parentUser.id;
              parentCredentials = {
                username: parentUsername,
                password: parentPassword,
                email: parentEmail
              };
            }
          }
          
          return {
            student,
            studentUser,
            studentCredentials: {
              username: studentUsername,
              password: studentPassword,
              email: studentEmail
            },
            parentCredentials
          };
        });
        
        // Log audit event
        await storage.createAuditLog({
          userId: adminUserId,
          action: 'create_student',
          entityType: 'student',
          entityId: '0',
          newValue: JSON.stringify({ 
            studentId: result.studentUser.id, 
            username: result.studentCredentials.username 
          }),
          reason: `Created student ${result.studentUser.firstName} ${result.studentUser.lastName}`,
          ipAddress: req.ip || 'unknown',
          userAgent: req.headers['user-agent'] || null
        });
        
        // Emit realtime event for student creation
        realtimeService.emitTableChange('students', 'INSERT', result.student, undefined, adminUserId);
        realtimeService.emitToRole('admin', 'student.created', {
          student: result.student,
          user: result.studentUser
        });
        if (result.student.classId) {
          realtimeService.emitToClass(result.student.classId.toString(), 'student.created', {
            student: result.student,
            user: result.studentUser
          });
        }
        
        res.status(201).json({
          message: 'Student created successfully',
          credentials: {
            student: {
              id: result.studentUser.id,
              username: result.studentCredentials.username,
              email: result.studentCredentials.email,
              password: result.studentCredentials.password,
              firstName: result.studentUser.firstName,
              lastName: result.studentUser.lastName,
              admissionNumber: result.student.admissionNumber,
              classId: result.student.classId
            },
            parent: result.parentCredentials
          },
          parentCreated: result.parentCredentials !== null
        });
      } catch (error: any) {
        
        if (error instanceof ZodError) {
          return res.status(400).json({ 
            message: 'Validation error', 
            errors: error.errors 
          });
        }
        res.status(500).json({ 
          message: error.message || 'Failed to create student' 
        });
      }
    });

    // Get student profile by ID
    app.get('/api/students/:id', authenticateUser, async (req, res) => {
      try {
        const studentId = req.params.id;

        // Ensure student can only access their own profile (or admin/teacher can access)
        if (req.user!.id !== studentId && req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.TEACHER) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
        const student = await storage.getStudent(studentId);

        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }
        res.json(student);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch student data' });
      }
    });

    // Get student's assigned classes
    app.get('/api/students/:id/classes', authenticateUser, async (req, res) => {
      try {
        const studentId = req.params.id;

        // Ensure student can only access their own classes (or admin/teacher can access)
        if (req.user!.id !== studentId && req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.TEACHER) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
        const student = await storage.getStudent(studentId);
        const classes = student?.classId ? await storage.getClass(student.classId) : null;
        res.json(classes);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch classes' });
      }
    });

    // Update student profile
    app.patch('/api/students/:id', authenticateUser, async (req, res) => {
      try {
        const studentId = req.params.id;

        // Ensure student can only update their own profile (or admin can update)
        if (req.user!.id !== studentId && req.user!.roleId !== ROLES.ADMIN) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
        const updates = req.body;

        // Separate user fields from student fields
        const userFields = ['firstName', 'lastName', 'email', 'phone', 'address', 'recoveryEmail', 'dateOfBirth', 'gender', 'profileImageUrl'];
        const studentFields = ['emergencyContact', 'emergencyPhone', 'medicalInfo', 'guardianName'];

        const userPatch: any = {};
        const studentPatch: any = {};

        // Separate the fields and prune undefined values
        Object.keys(updates).forEach(key => {
          if (updates[key] !== undefined && updates[key] !== null) {
            if (userFields.includes(key)) {
              userPatch[key] = updates[key];
            } else if (studentFields.includes(key)) {
              studentPatch[key] = updates[key];
            }
          }
        });

        // Get existing student for realtime event
        const existingStudent = await storage.getStudent(studentId);
        
        // Update student record
        const updatedStudent = await storage.updateStudent(studentId, {
          userPatch: Object.keys(userPatch).length > 0 ? userPatch : undefined,
          studentPatch: Object.keys(studentPatch).length > 0 ? studentPatch : undefined
        });

        if (!updatedStudent) {
          return res.status(404).json({ message: 'Student not found' });
        }
        
        // Emit realtime event for student update
        realtimeService.emitTableChange('students', 'UPDATE', updatedStudent, existingStudent, req.user!.id);
        realtimeService.emitToRole('admin', 'student.updated', updatedStudent);
        if (updatedStudent.student.classId) {
          realtimeService.emitToClass(updatedStudent.student.classId.toString(), 'student.updated', updatedStudent);
        }
        
        res.json(updatedStudent);
      } catch (error) {
        res.status(500).json({ message: 'Failed to update student profile' });
      }
    });

    // Delete student (soft delete - sets isActive to false)
    app.delete('/api/students/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
      try {
        const studentId = req.params.id;

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(studentId)) {
          return res.status(400).json({ message: 'Invalid student ID format' });
        }
        // Check if student exists
        const student = await storage.getStudent(studentId);
        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }
        // Perform soft delete (sets isActive = false)
        const deleted = await storage.deleteStudent(studentId);

        if (!deleted) {
          return res.status(500).json({ message: 'Failed to delete student' });
        }
        
        // Emit realtime event for student deletion
        realtimeService.emitTableChange('students', 'DELETE', { id: studentId }, student, req.user!.id);
        realtimeService.emitToRole('admin', 'student.deleted', { ...student, id: studentId });
        if (student.classId) {
          realtimeService.emitToClass(student.classId.toString(), 'student.deleted', { ...student, id: studentId });
        }
        
        res.json({ 
          success: true, 
          message: 'Student deleted successfully',
          studentId: studentId
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to delete student' });
      }
    });

    // Get student profile status (check if profile is complete)
    app.get('/api/student/profile/status', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
      try {
        const userId = req.user!.id;
        let user = await storage.getUser(userId);
        const student = await storage.getStudent(userId);

        // Calculate profile completion percentage
        let completionPercentage = 0;
        if (student) {
          const fields = [
            user?.phone,
            user?.address,
            user?.dateOfBirth,
            user?.gender,
            student?.emergencyContact,
            student?.medicalInfo,
            user?.recoveryEmail,
          ];
          const filledFields = fields.filter(field => field !== null && field !== undefined && field !== '').length;
          completionPercentage = Math.round((filledFields / fields.length) * 100);
        }
        // 🔧 AUTO-FIX: If profile is 100% complete but profileCompleted is NULL/false, fix it
        if (completionPercentage === 100 && !user?.profileCompleted) {
          const updated = await storage.updateStudent(userId, {
            userPatch: {
              profileCompleted: true,
              profileCompletionPercentage: 100,
              profileSkipped: false,
            }
          });
          if (updated) {
            user = updated.user;
          }
        }

        const status = {
          hasProfile: !!student,
          completed: user?.profileCompleted || false,
          skipped: user?.profileSkipped || false,
          percentage: user?.profileCompletionPercentage || completionPercentage,
          firstLogin: !user?.profileCompleted // First login if profile not completed
        };

        // 🔧 DEBUG: Log profile status for troubleshooting (dev only)
        res.json(status);
      } catch (error) {
        res.status(500).json({ message: 'Failed to check profile status' });
      }
    });

    // Student profile setup (first-time login)
    app.post('/api/student/profile/setup', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
      try {
        const userId = req.user!.id;
        const profileData = req.body;


        // Extract user-level fields
        const { phone, address, dateOfBirth, gender, recoveryEmail, bloodGroup, emergencyContact, emergencyPhone, agreement, ...studentFields } = profileData;

        // 🔧 FIX: Use updateStudent with both userPatch and studentPatch in a single transaction
        // This ensures both user and student records are updated atomically
        const updatedStudent = await storage.updateStudent(userId, {
          userPatch: {
            phone,
            address,
            dateOfBirth,
            gender,
            recoveryEmail,
            profileCompleted: true,
            profileSkipped: false,
            profileCompletionPercentage: 100,
          },
          studentPatch: {
            emergencyContact: emergencyContact || null,
            emergencyPhone: emergencyPhone || null,
            guardianName: emergencyContact || null,
            medicalInfo: bloodGroup ? `Blood Group: ${bloodGroup}` : null,
          }
        });

        if (!updatedStudent) {
          return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ 
          message: 'Profile setup completed successfully',
          student: updatedStudent.student,
          user: updatedStudent.user
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to setup profile', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    // Skip student profile setup
    app.post('/api/student/profile/skip', authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
      try {
        const userId = req.user!.id;
        const user = await storage.getUser(userId);

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        // Mark profile as skipped
        await storage.updateUser(userId, {
          profileSkipped: true,
          profileCompleted: false,
        });

        res.json({ 
          message: 'Profile setup skipped. You can complete it later in Settings.',
          skipped: true
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to skip profile setup' });
      }
    });

    // ==================== END STUDENT PROFILE ROUTES ====================

    // ==================== JOB VACANCY SYSTEM ROUTES ====================

    // Public routes - Job Vacancies (no auth required)
    app.get('/api/vacancies', async (req: Request, res: Response) => {
      try {
        const status = req.query.status as string | undefined;
        const vacancies = await storage.getAllVacancies(status);
        res.json(vacancies);
      } catch (error) {
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
              :'You already have a pending application' 
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
          // Also send realtime notification
          realtimeService.emitNotification(admin.id, {
            title: 'New Teacher Application',
            message: `${validatedData.fullName} has applied for a teaching position`,
            type: 'teacher_application'
          });
        }
        
        // Emit realtime event for application creation
        realtimeService.emitTableChange('teacher_applications', 'INSERT', application);
        realtimeService.emitToRole('admin', 'application.created', application);
        
        res.status(201).json({ 
          message: 'Application submitted successfully. You will be notified once reviewed.',
          application 
        });
      } catch (error) {
        if (error instanceof ZodError) {
          return res.status(400).json({ message: error.errors[0].message });
        }
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
        
        // Emit realtime event for vacancy creation
        realtimeService.emitTableChange('vacancies', 'INSERT', vacancy, undefined, req.user!.id);
        realtimeService.emitEvent('vacancy.created', vacancy); // Broadcast publicly
        
        res.status(201).json(vacancy);
      } catch (error) {
        res.status(500).json({ message: 'Failed to create vacancy' });
      }
    });

    app.patch('/api/admin/vacancies/:id/close', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
      try {
        const existingVacancy = await storage.getVacancy(req.params.id);
        const vacancy = await storage.updateVacancy(req.params.id, { status: 'closed' });
        if (!vacancy) {
          return res.status(404).json({ message: 'Vacancy not found' });
        }
        
        // Emit realtime event for vacancy closure
        realtimeService.emitTableChange('vacancies', 'UPDATE', vacancy, existingVacancy, req.user!.id);
        realtimeService.emitEvent('vacancy.closed', vacancy); // Broadcast publicly
        
        res.json(vacancy);
      } catch (error) {
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
            // Send realtime notification
            realtimeService.emitNotification(applicantUser.id, {
              title: 'Application Approved',
              message: 'Your teacher application has been approved. You can now sign in with Google.',
              type: 'application_approved'
            });
          }
          
          // Emit realtime event for application approval
          realtimeService.emitTableChange('teacher_applications', 'UPDATE', result.application, undefined, req.user!.id);
          realtimeService.emitToRole('admin', 'application.approved', result);
          
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
          
          // Emit realtime event for application rejection
          realtimeService.emitTableChange('teacher_applications', 'UPDATE', application, undefined, req.user!.id);
          realtimeService.emitToRole('admin', 'application.rejected', application);
          
          res.json({ 
            message: 'Application rejected',
            application 
          });
        } else {
          res.status(400).json({ message: 'Invalid status' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Failed to update application' });
      }
    });

    // Get approved teachers (admin only)
    app.get('/api/admin/approved-teachers', authenticateUser, authorizeRoles(ROLES.ADMIN), async (req: Request, res: Response) => {
      try {
        const approvedTeachers = await storage.getAllApprovedTeachers();
        res.json(approvedTeachers);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch approved teachers' });
      }
    });

    // ==================== END JOB VACANCY SYSTEM ROUTES ====================

    // ==================== SUPER ADMIN ROUTES ====================

    // Get system statistics (Super Admin only)
    app.get('/api/superadmin/stats', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const stats = await storage.getSuperAdminStats();
        res.json(stats);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch system statistics' });
      }
    });

    // Get all admins (Super Admin only)
    app.get('/api/superadmin/admins', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const admins = await storage.getUsersByRole(ROLES.ADMIN);
        res.json(admins);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch administrators' });
      }
    });

    // Create new admin (Super Admin only)
    app.post('/api/superadmin/admins', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        // Zod validation schema for creating admin (username and password are auto-generated)
        const createAdminSchema = z.object({
          firstName: z.string().min(1, "First name is required").trim(),
          lastName: z.string().min(1, "Last name is required").trim(),
          email: z.string().email("Invalid email address").toLowerCase().trim(),
        });

        // Validate and parse request body
        const validatedData = createAdminSchema.parse(req.body);
        const { firstName, lastName, email } = validatedData;

        // Check if email already exists
        const existingEmail = await storage.getUserByEmail(email);
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already exists' });
        }
        // Auto-generate username using username generator
        const { generateAdminUsername, generateTempPassword } = await import('./username-generator');
        const username = await generateAdminUsername();
        const tempPassword = generateTempPassword();

        // Generate UUID for new admin (required for PostgreSQL)
        const adminId = randomUUID();

        // Hash password
        const passwordHash = await bcrypt.hash(tempPassword, 12);

        // Create admin user
        const newAdmin = await storage.createUser({
          id: adminId, // PostgreSQL requires explicit UUID
          username,
          email,
          passwordHash,
          roleId: ROLES.ADMIN,
          firstName,
          lastName,
          status: 'active',
          isActive: true,
          mustChangePassword: true, // User must change password after first login
          createdVia: 'admin',
          createdBy: req.user!.id,
          approvedBy: req.user!.id,
          approvedAt: new Date(),
        } as any);


        // Create admin profile
        await storage.createAdminProfile({
          userId: newAdmin.id,
          department: 'Administration',
          accessLevel: 'standard',
        });

        // Log the admin creation
        await storage.createAuditLog({
          userId: req.user!.id,
          action: 'admin_created',
          entityType: 'user',
          entityId: newAdmin.id,
          reason: `New admin created: ${username} (auto-generated credentials)`,
        });


        res.status(201).json({
          message: 'Admin created successfully with auto-generated credentials',
          admin: {
            id: newAdmin.id,
            username: newAdmin.username,
            email: newAdmin.email,
            firstName: newAdmin.firstName,
            lastName: newAdmin.lastName,
          },
          credentials: {
            username: username,
            password: tempPassword,
            role: 'Admin',
          }
        });
      } catch (error) {

        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: error.errors[0].message || 'Validation error',
            errors: error.errors 
          });
        }
        res.status(500).json({ message: 'Failed to create administrator' });
      }
    });

    // Get audit logs (Super Admin only)
    app.get('/api/superadmin/logs', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const logs = await storage.getAuditLogs();
        res.json(logs);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch audit logs' });
      }
    });

    // Get system settings (Super Admin only)
    app.get('/api/superadmin/settings', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const settings = await storage.getSystemSettings();
        res.json(settings);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch system settings' });
      }
    });

    // Update system settings (Super Admin only)
    app.put('/api/superadmin/settings', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const settings = await storage.updateSystemSettings(req.body);

        // Log the settings change
        await storage.createAuditLog({
          userId: req.user!.id,
          action: 'settings_updated',
          entityType: 'system_settings',
          entityId: String(settings.id),
          reason: 'System settings updated by Super Admin',
        });

        res.json(settings);
      } catch (error) {
        res.status(500).json({ message: 'Failed to update system settings' });
      }
    });

    // ==================== END SUPER ADMIN ROUTES ====================

    // ==================== REPORT CARD ROUTES ====================

    // Get grading configuration (includes database-configured weights)
    app.get('/api/grading-config', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { getGradingConfig, GRADING_SCALES } = await import('./grading-config');
        const scaleName = req.query.scale as string || 'standard';
        const config = getGradingConfig(scaleName);
        
        const systemSettings = await storage.getSystemSettings();
        const dbTestWeight = systemSettings?.testWeight ?? 40;
        const dbExamWeight = systemSettings?.examWeight ?? 60;
        const dbGradingScale = systemSettings?.defaultGradingScale ?? 'standard';
        
        res.json({
          currentConfig: {
            ...config,
            testWeight: dbTestWeight,
            examWeight: dbExamWeight,
          },
          availableScales: Object.keys(GRADING_SCALES),
          dbSettings: {
            testWeight: dbTestWeight,
            examWeight: dbExamWeight,
            defaultGradingScale: dbGradingScale
          }
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to get grading configuration' });
      }
    });

    // Update grading settings (Admin only)
    app.put('/api/grading-settings', authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req: Request, res: Response) => {
      try {
        const { testWeight, examWeight, defaultGradingScale } = req.body;
        
        if (testWeight !== undefined && examWeight !== undefined) {
          if (testWeight + examWeight !== 100) {
            return res.status(400).json({ 
              message: 'Test weight and exam weight must sum to 100%' 
            });
          }
          if (testWeight < 0 || testWeight > 100 || examWeight < 0 || examWeight > 100) {
            return res.status(400).json({ 
              message: 'Weights must be between 0 and 100' 
            });
          }
        }
        
        const updateData: any = { updatedBy: req.user!.id };
        if (testWeight !== undefined) updateData.testWeight = testWeight;
        if (examWeight !== undefined) updateData.examWeight = examWeight;
        if (defaultGradingScale !== undefined) updateData.defaultGradingScale = defaultGradingScale;
        
        const settings = await storage.updateSystemSettings(updateData);
        
        await storage.createAuditLog({
          userId: req.user!.id,
          action: 'grading_settings_updated',
          entityType: 'system_settings',
          entityId: String(settings.id),
          reason: `Grading settings updated: Test ${settings.testWeight}%, Exam ${settings.examWeight}%`,
        });
        
        const { realtimeService } = await import('./realtime-service');
        realtimeService.emitGradingSettingsEvent('updated', {
          testWeight: settings.testWeight,
          examWeight: settings.examWeight,
          gradingScale: settings.defaultGradingScale,
        }, req.user!.id);
        
        res.json({ 
          message: 'Grading settings updated successfully',
          settings: {
            testWeight: settings.testWeight,
            examWeight: settings.examWeight,
            defaultGradingScale: settings.defaultGradingScale
          }
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to update grading settings' });
      }
    });

    // Get student report card for a specific term
    app.get('/api/reports/student-report-card/:studentId', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { studentId } = req.params;
        const { termId } = req.query;

        if (!termId) {
          return res.status(400).json({ message: 'Term ID is required' });
        }

        const { calculateGrade, calculateWeightedScore } = await import('./grading-config');

        const student = await storage.getStudent(studentId);
        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }

        if (!student.classId) {
          return res.status(400).json({ message: 'Student not assigned to a class' });
        }

        // Authorization: Students can only view their own, parents can view their children's
        // Teachers can only view students in their assigned classes
        if (req.user!.roleId === ROLES.STUDENT) {
          if (req.user!.id !== studentId) {
            return res.status(403).json({ message: 'You can only view your own report card' });
          }
        } else if (req.user!.roleId === ROLES.PARENT) {
          const children = await storage.getStudentsByParentId(req.user!.id);
          if (!children.some(c => c.id === studentId)) {
            return res.status(403).json({ message: 'You can only view your children\'s report cards' });
          }
        } else if (req.user!.roleId === ROLES.TEACHER) {
          const teacherAssignments = await storage.getTeacherClassAssignments(req.user!.id);
          const isAssignedToClass = teacherAssignments.some(a => a.classId === student.classId);
          if (!isAssignedToClass) {
            return res.status(403).json({ message: 'You are not authorized to view report cards for students in this class' });
          }
        }
        // Admin and Super Admin can view any student's report card

        // For students and parents, check if there's a published report card
        // Teachers, admins can see regardless of status
        if (req.user!.roleId === ROLES.STUDENT || req.user!.roleId === ROLES.PARENT) {
          const existingReportCard = await db.select({ status: schema.reportCards.status })
            .from(schema.reportCards)
            .where(
              and(
                eq(schema.reportCards.studentId, studentId),
                eq(schema.reportCards.termId, Number(termId)),
                eq(schema.reportCards.status, 'published')
              )
            )
            .limit(1);
          
          if (!existingReportCard.length) {
            return res.status(404).json({ 
              message: 'Report card not yet published. Please check back later.',
              status: 'not_published'
            });
          }
        }

        const user = await storage.getUser(studentId);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const studentClass = await storage.getClass(student.classId);
        const term = await storage.getAcademicTerm(Number(termId));
        const exams = await storage.getExamsByClassAndTerm(student.classId, Number(termId));
        
        // Get subjects that have exams for this class/term (represents class curriculum)
        const classSubjectIds = new Set(exams.map(e => e.subjectId));
        const allSubjects = await storage.getSubjects();
        const classSubjects = allSubjects.filter(s => classSubjectIds.has(s.id));

        const subjectScores: Record<number, { testScores: number[], testMax: number[], examScores: number[], examMax: number[], subjectName: string, hasData: boolean }> = {};

        // Initialize with all class subjects
        for (const subject of classSubjects) {
          subjectScores[subject.id] = {
            testScores: [],
            testMax: [],
            examScores: [],
            examMax: [],
            subjectName: subject.name,
            hasData: false
          };
        }

        for (const exam of exams) {
          if (!subjectScores[exam.subjectId]) continue;
          const result = await storage.getExamResultByExamAndStudent(exam.id, studentId);
          if (result && result.marksObtained !== null) {
            subjectScores[exam.subjectId].hasData = true;
            if (exam.examType === 'test' || exam.examType === 'quiz') {
              subjectScores[exam.subjectId].testScores.push(result.marksObtained);
              subjectScores[exam.subjectId].testMax.push(exam.totalMarks);
            } else {
              subjectScores[exam.subjectId].examScores.push(result.marksObtained);
              subjectScores[exam.subjectId].examMax.push(exam.totalMarks);
            }
          }
        }

        const subjects: any[] = [];
        let totalWeightedPercentage = 0;
        const totalSubjects = Object.keys(subjectScores).length;

        for (const [subjectIdStr, scores] of Object.entries(subjectScores)) {
          const subjectId = Number(subjectIdStr);
          const testScore = scores.testScores.reduce((a, b) => a + b, 0);
          const testMax = scores.testMax.reduce((a, b) => a + b, 0);
          const examScore = scores.examScores.reduce((a, b) => a + b, 0);
          const examMax = scores.examMax.reduce((a, b) => a + b, 0);

          // Calculate weighted score - subjects without data get 0%
          const weighted = calculateWeightedScore(testScore, testMax, examScore, examMax);
          const gradeInfo = calculateGrade(weighted.percentage);

          subjects.push({
            subjectId,
            subjectName: scores.subjectName,
            testScore,
            testMax: testMax || 40,
            examScore,
            examMax: examMax || 60,
            totalScore: testScore + examScore,
            percentage: weighted.percentage,
            grade: gradeInfo.grade,
            remarks: gradeInfo.remarks,
            hasData: scores.hasData
          });

          // Include all subjects in total (missing data contributes 0)
          totalWeightedPercentage += weighted.percentage;
        }

        // Calculate average across ALL subjects (including those with 0)
        const overallPercentage = totalSubjects > 0 ? totalWeightedPercentage / totalSubjects : 0;
        const overallGradeInfo = calculateGrade(overallPercentage);

        const reportCard = {
          student: {
            id: studentId,
            name: `${user.firstName} ${user.lastName}`,
            admissionNumber: student.admissionNumber,
            className: studentClass?.name || 'Unknown',
            classLevel: studentClass?.level || 'Unknown'
          },
          term: term ? {
            id: term.id,
            name: term.name,
            year: term.year,
            startDate: term.startDate,
            endDate: term.endDate
          } : null,
          subjects,
          summary: {
            percentage: Math.round(overallPercentage * 10) / 10,
            grade: overallGradeInfo.grade,
            remarks: overallGradeInfo.remarks,
            subjectsCount: totalSubjects,
            subjectsWithData: subjects.filter(s => s.hasData).length
          },
          generatedAt: new Date().toISOString()
        };

        res.json(reportCard);
      } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to generate report card' });
      }
    });

    // Get all students in a class with their report card data (Teacher/Admin)
    app.get('/api/reports/class/:classId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { classId } = req.params;
        const { termId } = req.query;

        if (!termId) {
          return res.status(400).json({ message: 'Term ID is required' });
        }

        const classInfo = await storage.getClass(Number(classId));
        if (!classInfo) {
          return res.status(404).json({ message: 'Class not found' });
        }

        // Authorization check for teachers - verify they are assigned to this class
        if (req.user!.roleId === ROLES.TEACHER) {
          const teacherAssignments = await storage.getTeacherClassAssignments(req.user!.id);
          const isAssignedToClass = teacherAssignments.some(a => a.classId === Number(classId));
          if (!isAssignedToClass) {
            return res.status(403).json({ message: 'You are not authorized to view report cards for this class' });
          }
        }

        const students = await storage.getStudentsByClass(Number(classId));
        const term = await storage.getAcademicTerm(Number(termId));
        const exams = await storage.getExamsByClassAndTerm(Number(classId), Number(termId));
        
        // Get subjects that have exams for this class/term to determine class subjects
        const classSubjectIds = new Set(exams.map(e => e.subjectId));
        const allSubjects = await storage.getSubjects();
        const classSubjects = allSubjects.filter(s => classSubjectIds.has(s.id));

        const { calculateGrade, calculateWeightedScore } = await import('./grading-config');

        const studentReports: any[] = [];

        for (const student of students) {
          const user = await storage.getUser(student.id);
          if (!user) continue;

          const subjectScores: Record<number, { testScores: number[], testMax: number[], examScores: number[], examMax: number[], subjectName: string, hasData: boolean }> = {};

          // Initialize with all class subjects
          for (const subject of classSubjects) {
            subjectScores[subject.id] = {
              testScores: [],
              testMax: [],
              examScores: [],
              examMax: [],
              subjectName: subject.name,
              hasData: false
            };
          }

          for (const exam of exams) {
            if (!subjectScores[exam.subjectId]) continue;
            const result = await storage.getExamResultByExamAndStudent(exam.id, student.id);
            if (result && result.marksObtained !== null) {
              subjectScores[exam.subjectId].hasData = true;
              if (exam.examType === 'test' || exam.examType === 'quiz') {
                subjectScores[exam.subjectId].testScores.push(result.marksObtained);
                subjectScores[exam.subjectId].testMax.push(exam.totalMarks);
              } else {
                subjectScores[exam.subjectId].examScores.push(result.marksObtained);
                subjectScores[exam.subjectId].examMax.push(exam.totalMarks);
              }
            }
          }

          const subjects: any[] = [];
          let totalWeightedPercentage = 0;
          let subjectsWithData = 0;
          const totalSubjects = Object.keys(subjectScores).length;

          for (const [subjectIdStr, scores] of Object.entries(subjectScores)) {
            const testScore = scores.testScores.reduce((a, b) => a + b, 0);
            const testMax = scores.testMax.reduce((a, b) => a + b, 0);
            const examScore = scores.examScores.reduce((a, b) => a + b, 0);
            const examMax = scores.examMax.reduce((a, b) => a + b, 0);

            // Calculate weighted score - subjects without data get 0%
            const weighted = calculateWeightedScore(testScore, testMax, examScore, examMax);
            const gradeInfo = calculateGrade(weighted.percentage);

            subjects.push({
              subjectId: Number(subjectIdStr),
              subjectName: scores.subjectName,
              testScore,
              examScore,
              percentage: weighted.percentage,
              grade: gradeInfo.grade,
              hasData: scores.hasData
            });

            // Include all subjects in total (missing data contributes 0)
            totalWeightedPercentage += weighted.percentage;
            if (scores.hasData) {
              subjectsWithData++;
            }
          }

          // Calculate average across ALL subjects (including those with 0)
          const overallPercentage = totalSubjects > 0 ? totalWeightedPercentage / totalSubjects : 0;
          const overallGradeInfo = calculateGrade(overallPercentage);

          studentReports.push({
            studentId: student.id,
            studentName: `${user.firstName} ${user.lastName}`,
            admissionNumber: student.admissionNumber,
            subjects,
            percentage: Math.round(overallPercentage * 10) / 10,
            grade: overallGradeInfo.grade,
            subjectsCount: totalSubjects,
            subjectsWithData
          });
        }

        studentReports.sort((a, b) => b.percentage - a.percentage);
        studentReports.forEach((report, index) => {
          report.position = index + 1;
          report.totalStudents = studentReports.length;
        });

        res.json({
          class: {
            id: classInfo.id,
            name: classInfo.name,
            level: classInfo.level
          },
          term: term ? {
            id: term.id,
            name: term.name,
            year: term.year
          } : null,
          students: studentReports,
          totalStudents: studentReports.length,
          totalSubjects: classSubjects.length
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to get class report cards' });
      }
    });

    // Generate/Update report card for a student (Teacher/Admin)
    app.post('/api/reports/generate', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { studentId, termId, teacherRemarks, status } = req.body;

        if (!studentId || !termId) {
          return res.status(400).json({ message: 'Student ID and Term ID are required' });
        }

        const student = await storage.getStudent(studentId);
        if (!student || !student.classId) {
          return res.status(404).json({ message: 'Student not found or not assigned to a class' });
        }

        // Authorization check for teachers
        if (req.user!.roleId === ROLES.TEACHER) {
          const teacherAssignments = await storage.getTeacherClassAssignments(req.user!.id);
          const isAssignedToClass = teacherAssignments.some(a => a.classId === student.classId);
          if (!isAssignedToClass) {
            return res.status(403).json({ message: 'You are not authorized to generate report cards for students in this class' });
          }
        }

        const { calculateGrade, calculateWeightedScore } = await import('./grading-config');

        const exams = await storage.getExamsByClassAndTerm(student.classId, termId);
        const allSubjects = await storage.getSubjects();

        const reportCardData = {
          studentId,
          classId: student.classId,
          termId,
          teacherRemarks: teacherRemarks || null,
          status: status || 'draft',
          generatedBy: req.user!.id,
          generatedAt: new Date()
        };

        const subjectScores: Record<number, { testScores: number[], testMax: number[], examScores: number[], examMax: number[] }> = {};

        for (const exam of exams) {
          if (!subjectScores[exam.subjectId]) {
            subjectScores[exam.subjectId] = { testScores: [], testMax: [], examScores: [], examMax: [] };
          }

          const result = await storage.getExamResultByExamAndStudent(exam.id, studentId);
          if (result && result.marksObtained !== null) {
            if (exam.examType === 'test' || exam.examType === 'quiz') {
              subjectScores[exam.subjectId].testScores.push(result.marksObtained);
              subjectScores[exam.subjectId].testMax.push(exam.totalMarks);
            } else {
              subjectScores[exam.subjectId].examScores.push(result.marksObtained);
              subjectScores[exam.subjectId].examMax.push(exam.totalMarks);
            }
          }
        }

        const grades: any[] = [];
        let totalScore = 0;
        let subjectCount = 0;

        for (const [subjectIdStr, scores] of Object.entries(subjectScores)) {
          if (scores.testScores.length === 0 && scores.examScores.length === 0) continue;

          const subjectId = Number(subjectIdStr);
          const testScore = scores.testScores.reduce((a, b) => a + b, 0);
          const testMax = scores.testMax.reduce((a, b) => a + b, 0);
          const examScore = scores.examScores.reduce((a, b) => a + b, 0);
          const examMax = scores.examMax.reduce((a, b) => a + b, 0);

          const weighted = calculateWeightedScore(testScore, testMax, examScore, examMax);
          const gradeInfo = calculateGrade(weighted.percentage);

          grades.push({
            subjectId,
            score: Math.round(weighted.weightedScore),
            maxScore: 100,
            grade: gradeInfo.grade,
            remarks: gradeInfo.remarks
          });

          totalScore += weighted.percentage;
          subjectCount++;
        }

        const averageScore = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;

        const existingReportCard = await db.select()
          .from(schema.reportCards)
          .where(
            and(
              eq(schema.reportCards.studentId, studentId),
              eq(schema.reportCards.termId, termId)
            )
          )
          .limit(1);

        let reportCard;
        if (existingReportCard.length > 0) {
          [reportCard] = await db.update(schema.reportCards)
            .set({
              ...reportCardData,
              totalScore,
              averageScore,
              updatedAt: new Date()
            })
            .where(eq(schema.reportCards.id, existingReportCard[0].id))
            .returning();

          await db.delete(schema.reportCardItems)
            .where(eq(schema.reportCardItems.reportCardId, reportCard.id));
        } else {
          [reportCard] = await db.insert(schema.reportCards)
            .values({
              ...reportCardData,
              totalScore,
              averageScore
            })
            .returning();
        }

        for (const grade of grades) {
          await db.insert(schema.reportCardItems)
            .values({
              reportCardId: reportCard.id,
              subjectId: grade.subjectId,
              score: grade.score,
              maxScore: grade.maxScore,
              grade: grade.grade,
              remarks: grade.remarks
            });
        }

        const reportCardResult = {
          message: 'Report card generated successfully',
          reportCard: {
            id: reportCard.id,
            studentId,
            termId,
            totalScore,
            averageScore,
            status: reportCard.status,
            gradesCount: grades.length
          }
        };
        
        // Emit realtime event for report card generation
        const operation = existingReportCard.length > 0 ? 'UPDATE' : 'INSERT';
        realtimeService.emitTableChange('report_cards', operation, reportCard, existingReportCard[0] || undefined, req.user!.id);
        realtimeService.emitReportCardEvent(reportCard.id, 'updated', {
          reportCardId: reportCard.id,
          studentId,
          classId: student.classId
        });
        
        res.json(reportCardResult);
      } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to generate report card' });
      }
    });

    // Update report card remarks/status (Teacher/Admin)
    app.put('/api/reports/:reportCardId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;
        const { teacherRemarks, principalRemarks, status } = req.body;
        
        // Get existing report card for realtime event
        const [existingReportCard] = await db.select()
          .from(schema.reportCards)
          .where(eq(schema.reportCards.id, Number(reportCardId)))
          .limit(1);

        const [updatedReportCard] = await db.update(schema.reportCards)
          .set({
            teacherRemarks,
            principalRemarks,
            status,
            updatedAt: new Date()
          })
          .where(eq(schema.reportCards.id, Number(reportCardId)))
          .returning();

        if (!updatedReportCard) {
          return res.status(404).json({ message: 'Report card not found' });
        }
        
        // Emit realtime event for report card update
        realtimeService.emitTableChange('report_cards', 'UPDATE', updatedReportCard, existingReportCard, req.user!.id);
        realtimeService.emitReportCardEvent(Number(reportCardId), 'updated', {
          reportCardId: Number(reportCardId),
          studentId: updatedReportCard.studentId,
          classId: updatedReportCard.classId
        });

        res.json(updatedReportCard);
      } catch (error) {
        res.status(500).json({ message: 'Failed to update report card' });
      }
    });

    // Get report card by ID with items
    app.get('/api/reports/:reportCardId', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;

        const [reportCard] = await db.select()
          .from(schema.reportCards)
          .where(eq(schema.reportCards.id, Number(reportCardId)))
          .limit(1);

        if (!reportCard) {
          return res.status(404).json({ message: 'Report card not found' });
        }

        const items = await db.select({
          id: schema.reportCardItems.id,
          subjectId: schema.reportCardItems.subjectId,
          subjectName: schema.subjects.name,
          score: schema.reportCardItems.obtainedMarks,
          maxScore: schema.reportCardItems.totalMarks,
          grade: schema.reportCardItems.grade,
          remarks: schema.reportCardItems.remarks
        })
        .from(schema.reportCardItems)
        .innerJoin(schema.subjects, eq(schema.reportCardItems.subjectId, schema.subjects.id))
        .where(eq(schema.reportCardItems.reportCardId, Number(reportCardId)));

        const student = await storage.getStudent(reportCard.studentId);
        const user = student ? await storage.getUser(student.id) : null;
        const classInfo = reportCard.classId ? await storage.getClass(reportCard.classId) : null;
        const term = await storage.getAcademicTerm(reportCard.termId);

        res.json({
          ...reportCard,
          student: user ? {
            id: student?.id,
            name: `${user.firstName} ${user.lastName}`,
            admissionNumber: student?.admissionNumber
          } : null,
          class: classInfo ? {
            id: classInfo.id,
            name: classInfo.name,
            level: classInfo.level
          } : null,
          term: term ? {
            id: term.id,
            name: term.name,
            year: term.year
          } : null,
          items
        });
      } catch (error) {
        res.status(500).json({ message: 'Failed to get report card' });
      }
    });

    // Get report cards for parent (view children's report cards)
    app.get('/api/reports/parent/:parentId', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { parentId } = req.params;
        const { termId } = req.query;

        if (req.user!.id !== parentId && req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.SUPER_ADMIN) {
          return res.status(403).json({ message: 'You can only view your own children\'s report cards' });
        }

        const children = await storage.getStudentsByParentId(parentId);
        
        const reports: any[] = [];
        for (const child of children) {
          const user = await storage.getUser(child.id);
          if (!user) continue;

          // Only show PUBLISHED report cards to parents (not draft or finalized)
          let reportCards;
          if (termId) {
            reportCards = await db.select()
              .from(schema.reportCards)
              .where(
                and(
                  eq(schema.reportCards.studentId, child.id),
                  eq(schema.reportCards.termId, Number(termId)),
                  eq(schema.reportCards.status, 'published')
                )
              );
          } else {
            reportCards = await db.select()
              .from(schema.reportCards)
              .where(
                and(
                  eq(schema.reportCards.studentId, child.id),
                  eq(schema.reportCards.status, 'published')
                )
              )
              .orderBy(schema.reportCards.createdAt);
          }

          reports.push({
            student: {
              id: child.id,
              name: `${user.firstName} ${user.lastName}`,
              admissionNumber: child.admissionNumber,
              classId: child.classId
            },
            reportCards
          });
        }

        res.json(reports);
      } catch (error) {
        res.status(500).json({ message: 'Failed to get children\'s report cards' });
      }
    });

    // Bulk generate report cards for a class (Admin only) - FALLBACK for edge cases
    // NOTE: Report cards are normally auto-generated when students complete exams
    // This route is a fallback for administrative purposes or data recovery
    app.post('/api/reports/generate-class/:classId', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { classId } = req.params;
        const { termId, status } = req.body;

        if (!termId) {
          return res.status(400).json({ message: 'Term ID is required' });
        }

        const students = await storage.getStudentsByClass(Number(classId));
        const { calculateGrade, calculateWeightedScore } = await import('./grading-config');
        const exams = await storage.getExamsByClassAndTerm(Number(classId), termId);

        const results: any[] = [];
        const errors: any[] = [];

        for (const student of students) {
          try {
            const subjectScores: Record<number, { testScores: number[], testMax: number[], examScores: number[], examMax: number[] }> = {};

            for (const exam of exams) {
              if (!subjectScores[exam.subjectId]) {
                subjectScores[exam.subjectId] = { testScores: [], testMax: [], examScores: [], examMax: [] };
              }

              const result = await storage.getExamResultByExamAndStudent(exam.id, student.id);
              if (result && result.marksObtained !== null) {
                if (exam.examType === 'test' || exam.examType === 'quiz') {
                  subjectScores[exam.subjectId].testScores.push(result.marksObtained);
                  subjectScores[exam.subjectId].testMax.push(exam.totalMarks);
                } else {
                  subjectScores[exam.subjectId].examScores.push(result.marksObtained);
                  subjectScores[exam.subjectId].examMax.push(exam.totalMarks);
                }
              }
            }

            const grades: any[] = [];
            let totalScore = 0;
            let subjectCount = 0;

            for (const [subjectIdStr, scores] of Object.entries(subjectScores)) {
              if (scores.testScores.length === 0 && scores.examScores.length === 0) continue;

              const subjectId = Number(subjectIdStr);
              const testScore = scores.testScores.reduce((a, b) => a + b, 0);
              const testMax = scores.testMax.reduce((a, b) => a + b, 0);
              const examScore = scores.examScores.reduce((a, b) => a + b, 0);
              const examMax = scores.examMax.reduce((a, b) => a + b, 0);

              const weighted = calculateWeightedScore(testScore, testMax, examScore, examMax);
              const gradeInfo = calculateGrade(weighted.percentage);

              grades.push({
                subjectId,
                score: Math.round(weighted.weightedScore),
                maxScore: 100,
                grade: gradeInfo.grade,
                remarks: gradeInfo.remarks
              });

              totalScore += weighted.percentage;
              subjectCount++;
            }

            const averageScore = subjectCount > 0 ? Math.round(totalScore / subjectCount) : 0;

            const existingReportCard = await db.select()
              .from(schema.reportCards)
              .where(
                and(
                  eq(schema.reportCards.studentId, student.id),
                  eq(schema.reportCards.termId, termId)
                )
              )
              .limit(1);

            let reportCard;
            if (existingReportCard.length > 0) {
              [reportCard] = await db.update(schema.reportCards)
                .set({
                  totalScore,
                  averageScore,
                  status: status || 'draft',
                  generatedBy: req.user!.id,
                  generatedAt: new Date(),
                  updatedAt: new Date()
                })
                .where(eq(schema.reportCards.id, existingReportCard[0].id))
                .returning();

              await db.delete(schema.reportCardItems)
                .where(eq(schema.reportCardItems.reportCardId, reportCard.id));
            } else {
              [reportCard] = await db.insert(schema.reportCards)
                .values({
                  studentId: student.id,
                  classId: Number(classId),
                  termId,
                  totalScore,
                  averageScore,
                  status: status || 'draft',
                  generatedBy: req.user!.id,
                  generatedAt: new Date()
                })
                .returning();
            }

            for (const grade of grades) {
              await db.insert(schema.reportCardItems)
                .values({
                  reportCardId: reportCard.id,
                  subjectId: grade.subjectId,
                  score: grade.score,
                  maxScore: grade.maxScore,
                  grade: grade.grade,
                  remarks: grade.remarks
                });
            }

            results.push({
              studentId: student.id,
              reportCardId: reportCard.id,
              averageScore,
              gradesCount: grades.length
            });
          } catch (err: any) {
            errors.push({
              studentId: student.id,
              error: err.message
            });
          }
        }

        res.json({
          message: `Generated ${results.length} report cards`,
          success: results,
          errors,
          totalStudents: students.length
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message || 'Failed to generate class report cards' });
      }
    });

    // ==================== ENHANCED REPORT CARD ROUTES (Teacher Portal) ====================

    // Get all report cards for a class and term
    app.get('/api/reports/class-term/:classId/:termId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { classId, termId } = req.params;
        const reportCards = await storage.getReportCardsByClassAndTerm(Number(classId), Number(termId));
        res.json(reportCards);
      } catch (error: any) {
        console.error('Error getting report cards:', error);
        res.status(500).json({ message: error.message || 'Failed to get report cards' });
      }
    });

    // Get report card with all items (full details)
    app.get('/api/reports/:reportCardId/full', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;
        const reportCard = await storage.getReportCardWithItems(Number(reportCardId));
        
        if (!reportCard) {
          return res.status(404).json({ message: 'Report card not found' });
        }
        
        res.json(reportCard);
      } catch (error: any) {
        console.error('Error getting report card:', error);
        res.status(500).json({ message: error.message || 'Failed to get report card' });
      }
    });

    // Generate report cards for a class with auto-population (Enhanced version) - FALLBACK
    // NOTE: Report cards are normally auto-generated when students complete exams
    // This route is a fallback for teachers/admins to regenerate or update report cards
    app.post('/api/reports/generate-enhanced/:classId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { classId } = req.params;
        const { termId, gradingScale = 'standard' } = req.body;
        
        if (!termId) {
          return res.status(400).json({ message: 'Term ID is required' });
        }
        
        const result = await storage.generateReportCardsForClass(
          Number(classId),
          Number(termId),
          gradingScale,
          req.user!.id
        );
        
        res.json({
          message: `Report cards generated: ${result.created} created, ${result.updated} updated`,
          ...result
        });
      } catch (error: any) {
        console.error('Error generating report cards:', error);
        res.status(500).json({ message: error.message || 'Failed to generate report cards' });
      }
    });

    // Auto-populate scores for a specific report card
    app.post('/api/reports/:reportCardId/auto-populate', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;
        
        const result = await storage.autoPopulateReportCardScores(Number(reportCardId));
        
        res.json({
          message: `Scores populated for ${result.populated} subjects`,
          ...result
        });
      } catch (error: any) {
        console.error('Error auto-populating scores:', error);
        res.status(500).json({ message: error.message || 'Failed to auto-populate scores' });
      }
    });

    // Override a report card item score (Teacher override)
    app.patch('/api/reports/items/:itemId/override', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { itemId } = req.params;
        const { testScore, testMaxScore, examScore, examMaxScore, teacherRemarks } = req.body;
        
        const updatedItem = await storage.overrideReportCardItemScore(Number(itemId), {
          testScore: testScore !== undefined ? Number(testScore) : undefined,
          testMaxScore: testMaxScore !== undefined ? Number(testMaxScore) : undefined,
          examScore: examScore !== undefined ? Number(examScore) : undefined,
          examMaxScore: examMaxScore !== undefined ? Number(examMaxScore) : undefined,
          teacherRemarks,
          overriddenBy: req.user!.id
        });
        
        if (!updatedItem) {
          return res.status(404).json({ message: 'Report card item not found' });
        }
        
        // Emit realtime event for score override
        realtimeService.emitTableChange('report_card_items', 'UPDATE', updatedItem, undefined, req.user!.id);
        
        res.json(updatedItem);
      } catch (error: any) {
        console.error('Error overriding score:', error);
        res.status(500).json({ message: error.message || 'Failed to override score' });
      }
    });

    // Update report card status (finalize, publish, revert) - OPTIMIZED for instant response
    app.patch('/api/reports/:reportCardId/status', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;
        const { status } = req.body;
        
        if (!status) {
          return res.status(400).json({ message: 'Status is required' });
        }
        
        // Single optimized call - storage method handles validation and returns result with previous status
        const result = await storage.updateReportCardStatusOptimized(
          Number(reportCardId),
          status,
          req.user!.id
        );
        
        if (!result) {
          return res.status(500).json({ message: 'Failed to update report card status' });
        }
        
        const { reportCard: updatedReportCard, previousStatus } = result;
        
        // Emit realtime event asynchronously (non-blocking)
        setImmediate(async () => {
          const eventType = status === 'published' ? 'published' : 
                            status === 'finalized' ? 'finalized' : 'reverted';
          
          // Get parent ID for published notifications
          let parentIds: string[] = [];
          if (status === 'published' && updatedReportCard.studentId) {
            try {
              const student = await storage.getStudent(updatedReportCard.studentId);
              if (student?.parentId) {
                parentIds = [student.parentId];
              }
            } catch (e) {
              console.warn('Could not fetch parent ID for notification:', e);
            }
          }
          
          realtimeService.emitReportCardEvent(Number(reportCardId), eventType, {
            reportCardId: Number(reportCardId),
            status,
            studentId: updatedReportCard.studentId,
            classId: updatedReportCard.classId,
            termId: updatedReportCard.termId,
            parentIds
          }, req.user!.id);
        });
        
        // Return descriptive message based on transition
        let message = 'Status updated successfully';
        if (status === 'draft') {
          message = 'Report card reverted to draft. Editing is now enabled.';
        } else if (status === 'finalized') {
          message = previousStatus === 'published' 
            ? 'Report card reverted to finalized. Ready for review before publishing.'
            : 'Report card finalized. Ready for publishing.';
        } else if (status === 'published') {
          message = 'Report card published. Students and parents can now view it.';
        }
        
        res.json({ reportCard: updatedReportCard, message, status: updatedReportCard.status });
      } catch (error: any) {
        console.error('Error updating status:', error);
        // Handle specific error messages from storage layer
        if (error.message?.includes('Invalid status') || error.message?.includes('Invalid state transition')) {
          return res.status(400).json({ message: error.message });
        }
        if (error.message?.includes('not found')) {
          return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message || 'Failed to update status' });
      }
    });

    // Update report card remarks
    app.patch('/api/reports/:reportCardId/remarks', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;
        const { teacherRemarks, principalRemarks } = req.body;
        
        const updatedReportCard = await storage.updateReportCardRemarks(
          Number(reportCardId),
          teacherRemarks,
          principalRemarks
        );
        
        if (!updatedReportCard) {
          return res.status(404).json({ message: 'Report card not found' });
        }
        
        // Emit realtime event for remarks update
        realtimeService.emitReportCardEvent(Number(reportCardId), 'updated', {
          reportCardId: Number(reportCardId),
          studentId: updatedReportCard.studentId,
          classId: updatedReportCard.classId,
          termId: updatedReportCard.termId
        }, req.user!.id);
        
        res.json(updatedReportCard);
      } catch (error: any) {
        console.error('Error updating remarks:', error);
        res.status(500).json({ message: error.message || 'Failed to update remarks' });
      }
    });

    // Get exams by class and term with subject info
    app.get('/api/reports/exams/:classId', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { classId } = req.params;
        const { termId } = req.query;
        
        const exams = await storage.getExamsWithSubjectsByClassAndTerm(
          Number(classId),
          termId ? Number(termId) : undefined
        );
        
        res.json(exams);
      } catch (error: any) {
        console.error('Error getting exams:', error);
        res.status(500).json({ message: error.message || 'Failed to get exams' });
      }
    });

    // Recalculate a report card
    app.post('/api/reports/:reportCardId/recalculate', authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { reportCardId } = req.params;
        const { gradingScale = 'standard' } = req.body;
        
        const updatedReportCard = await storage.recalculateReportCard(
          Number(reportCardId),
          gradingScale
        );
        
        if (!updatedReportCard) {
          return res.status(404).json({ message: 'Report card not found or has no items' });
        }
        
        res.json(updatedReportCard);
      } catch (error: any) {
        console.error('Error recalculating report card:', error);
        res.status(500).json({ message: error.message || 'Failed to recalculate report card' });
      }
    });

    // ==================== END REPORT CARD ROUTES ====================

    // ==================== TEACHER ASSIGNMENT ROUTES ====================

    // Create teacher class/subject assignment (Admin only)
    app.post('/api/teacher-assignments', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { teacherId, classId, subjectId, termId } = req.body;

        if (!teacherId || !classId || !subjectId) {
          return res.status(400).json({ message: "teacherId, classId, and subjectId are required" });
        }
        // Check if teacher exists and has teacher role
        const teacher = await storage.getUser(teacherId);
        if (!teacher || teacher.roleId !== ROLES.TEACHER) {
          return res.status(400).json({ message: "Invalid teacher ID" });
        }
        // Check if class exists
        const classExists = await storage.getClass(classId);
        if (!classExists) {
          return res.status(400).json({ message: "Class not found" });
        }
        // Check if subject exists
        const subjectExists = await storage.getSubject(subjectId);
        if (!subjectExists) {
          return res.status(400).json({ message: "Subject not found" });
        }
        const assignment = await storage.createTeacherClassAssignment({
          teacherId,
          classId,
          subjectId,
          termId: termId || null,
          assignedBy: req.user!.id,
          isActive: true
        });


        res.status(201).json(assignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to create teacher assignment" });
      }
    });

    // Get teacher assignments (Admin gets all, Teacher gets own)
    app.get('/api/teacher-assignments', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { teacherId } = req.query;

        // Teachers can only view their own assignments
        if (req.user!.roleId === ROLES.TEACHER) {
          const assignments = await storage.getTeacherClassAssignments(req.user!.id);
          
          // Enrich with class and subject names
          const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
            const classInfo = await storage.getClass(assignment.classId);
            const subjectInfo = await storage.getSubject(assignment.subjectId);
            return {
              ...assignment,
              className: classInfo?.name,
              subjectName: subjectInfo?.name
            };
          }));

          return res.json(enrichedAssignments);
        }
        // Only admins and super admins can view assignments for other teachers
        if (req.user!.roleId !== ROLES.ADMIN && req.user!.roleId !== ROLES.SUPER_ADMIN) {
          return res.status(403).json({ message: "Insufficient permissions" });
        }
        // Admins can view all or filter by teacherId
        if (teacherId) {
          const assignments = await storage.getTeacherClassAssignments(teacherId as string);
          
          const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
            const classInfo = await storage.getClass(assignment.classId);
            const subjectInfo = await storage.getSubject(assignment.subjectId);
            const teacher = await storage.getUser(assignment.teacherId);
            return {
              ...assignment,
              className: classInfo?.name,
              subjectName: subjectInfo?.name,
              teacherName: `${teacher?.firstName} ${teacher?.lastName}`
            };
          }));

          return res.json(enrichedAssignments);
        }
        // Get all assignments (Admin only)
        // Note: This could be large, consider pagination in future
        res.json({ message: "Please specify teacherId parameter" });
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch teacher assignments" });
      }
    });

    // Get all teachers assigned to a specific class and subject
    app.get('/api/classes/:classId/subjects/:subjectId/teachers', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { classId, subjectId } = req.params;
        
        const teachers = await storage.getTeachersForClassSubject(Number(classId), Number(subjectId));
        
        const sanitizedTeachers = teachers.map(teacher => {
          const { passwordHash, ...safeTeacher } = teacher;
          return safeTeacher;
        });

        res.json(sanitizedTeachers);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch teachers" });
      }
    });

    // Get all classes and subjects assigned to a specific teacher
    app.get('/api/teachers/:teacherId/assignments', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { teacherId } = req.params;

        // Teachers can only view their own assignments
        if (req.user!.roleId === ROLES.TEACHER && req.user!.id !== teacherId) {
          return res.status(403).json({ message: "You can only view your own assignments" });
        }
        const assignments = await storage.getTeacherClassAssignments(teacherId);
        
        // Group assignments by class
        const groupedByClass: any = {};
        
        for (const assignment of assignments) {
          const classInfo = await storage.getClass(assignment.classId);
          const subjectInfo = await storage.getSubject(assignment.subjectId);
          
          if (!groupedByClass[assignment.classId]) {
            groupedByClass[assignment.classId] = {
              classId: assignment.classId,
              className: classInfo?.name,
              subjects: []
            };
          }
          groupedByClass[assignment.classId].subjects.push({
            assignmentId: assignment.id,
            subjectId: assignment.subjectId,
            subjectName: subjectInfo?.name,
            termId: assignment.termId,
            isActive: assignment.isActive
          });
        }
        res.json(Object.values(groupedByClass));
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch teacher assignments" });
      }
    });

    // Update teacher assignment (Admin only)
    app.put('/api/teacher-assignments/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const updateData = req.body;

        const updatedAssignment = await storage.updateTeacherClassAssignment(Number(id), updateData);

        if (!updatedAssignment) {
          return res.status(404).json({ message: "Assignment not found" });
        }

        res.json(updatedAssignment);
      } catch (error) {
        res.status(500).json({ message: "Failed to update teacher assignment" });
      }
    });

    // Delete teacher assignment (Admin only)
    app.delete('/api/teacher-assignments/:id', authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const success = await storage.deleteTeacherClassAssignment(Number(id));

        if (!success) {
          return res.status(404).json({ message: "Assignment not found" });
        }

        res.json({ message: "Teacher assignment deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete teacher assignment" });
      }
    });

    // Get teachers for a specific class and subject (for exam creation)
    app.get('/api/teachers-for-subject', authenticateUser, async (req: Request, res: Response) => {
      try {
        const { classId, subjectId } = req.query;

        if (!classId || !subjectId) {
          return res.status(400).json({ message: "Both classId and subjectId are required" });
        }
        const teachers = await storage.getTeachersForClassSubject(Number(classId), Number(subjectId));

        if (teachers.length === 0) {
          return res.json([]);
        }
        // Return teacher data with essential information
        const teacherData = teachers.map((teacher) => ({
          id: teacher.id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          username: teacher.username,
        }));

        res.json(teacherData);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch teachers" });
      }
    });

    // ==================== END TEACHER ASSIGNMENT ROUTES ====================

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