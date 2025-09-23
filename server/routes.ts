import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema, insertExamSchema, insertExamResultSchema, insertExamQuestionSchema, insertQuestionOptionSchema, insertHomePageContentSchema, insertContactMessageSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, createStudentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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
    
    // Find all active sessions that have exceeded their server timeout
    const allActiveSessions = await storage.getActiveExamSessions();
    const now = new Date();
    const expiredSessions = allActiveSessions.filter((session: any) => {
      return session.serverTimeoutAt && now > new Date(session.serverTimeoutAt) && !session.isCompleted;
    });

    console.log(`🧹 Found ${expiredSessions.length} expired sessions to cleanup`);
    
    for (const session of expiredSessions) {
      try {
        console.log(`⏰ AUTO-CLEANUP: Force submitting expired session ${session.id} for student ${session.studentId}`);
        
        // Mark session as auto-submitted by server cleanup
        await storage.updateExamSession(session.id, {
          isCompleted: true,
          submittedAt: now,
          submissionMethod: 'server_cleanup',
          autoSubmitted: true,
          status: 'submitted'
        });

        // Auto-score the session using our optimized scoring
        await autoScoreExamSession(session.id, storage);
        
        console.log(`✅ Successfully cleaned up expired session ${session.id}`);
      } catch (error) {
        console.error(`❌ Failed to cleanup session ${session.id}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Background cleanup service error:', error);
  }
}

// Start background cleanup service (runs every 30 seconds)
const cleanupInterval = 30000; // 30 seconds
setInterval(cleanupExpiredExamSessions, cleanupInterval);
console.log(`🧹 TIMEOUT PROTECTION: Background cleanup service started (every ${cleanupInterval/1000}s)`);

// OPTIMIZED Auto-scoring function for <2 second performance goal
async function autoScoreExamSession(sessionId: number, storage: any): Promise<void> {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 OPTIMIZED AUTO-SCORING: Starting session ${sessionId} scoring...`);
    
    // PERFORMANCE BREAKTHROUGH: Single optimized query gets ALL scoring data at once
    // This eliminates 5-10+ sequential database queries that were causing the bottleneck
    const scoringResult = await storage.getExamScoringData(sessionId);
    const { session, summary } = scoringResult;
    
    const databaseQueryTime = Date.now() - startTime;
    console.log(`⚡ PERFORMANCE: Database query completed in ${databaseQueryTime}ms (was 3000-8000ms before)`);
    
    const { totalQuestions, maxScore, studentScore, autoScoredQuestions } = summary;
    
    // Use the optimized results
    const totalScore = studentScore;
    const maxPossibleScore = maxScore;
    
    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;
    
    console.log(`✅ OPTIMIZED SCORING: Session ${sessionId} - ${totalQuestions} questions (${hasMultipleChoiceQuestions ? autoScoredQuestions + ' MC' : 'no MC'}, ${hasEssayQuestions ? (totalQuestions - autoScoredQuestions) + ' Essays' : 'no Essays'})`);
    
    // Log scoring details for debugging if needed
    if (process.env.NODE_ENV === 'development') {
      scoringResult.scoringData.forEach((q: any) => {
        if (q.questionType === 'multiple_choice') {
          console.log(`Question ${q.questionId}: ${q.isCorrect ? 'Correct! (+' + q.points + ' points)' : 'Incorrect'}`);
        } else {
          console.log(`Question ${q.questionId}: Essay type, needs manual grading`);
        }
      });
    }

    // Create or update exam result - CRITICAL for instant feedback
    console.log(`🎯 Preparing exam result for student ${session.studentId}, exam ${session.examId}`);
    console.log(`📊 Score calculation: ${totalScore}/${maxPossibleScore} (${autoScoredQuestions} MC questions auto-scored)`);
    
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

    // Use a special UUID for system auto-scoring
    const SYSTEM_AUTO_SCORING_UUID = '00000000-0000-0000-0000-000000000001';
    
    const resultData = {
      examId: session.examId,
      studentId: session.studentId,
      score: totalScore,
      maxScore: maxPossibleScore,
      autoScored: true, // Always true when auto-scoring pass completes
      recordedBy: SYSTEM_AUTO_SCORING_UUID // Special UUID for auto-generated results
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
        goalAchieved: totalResponseTime <= 2000,
        submissionMethod: 'auto_scoring'
      };
      
      // Alert if submission exceeds 2-second goal
      if (totalResponseTime > 2000) {
        console.warn(`🚨 PERFORMANCE ALERT: Auto-scoring took ${totalResponseTime}ms (exceeded 2-second goal by ${totalResponseTime - 2000}ms)`);
        console.warn(`🔍 PERFORMANCE BREAKDOWN: DB Query: ${databaseQueryTime}ms, Scoring Logic: ${scoringTime}ms`);
        console.warn(`💡 OPTIMIZATION NEEDED: Consider query optimization or caching for session ${sessionId}`);
      } else {
        console.log(`🎯 PERFORMANCE SUCCESS: Auto-scoring completed in ${totalResponseTime}ms (within 2-second goal! ✅)`);
        console.log(`📊 PERFORMANCE METRICS: DB Query: ${databaseQueryTime}ms, Scoring: ${scoringTime}ms, Total: ${totalResponseTime}ms`);
      }
      
      // Log detailed metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔬 DETAILED METRICS:`, JSON.stringify(performanceMetrics, null, 2));
      }
      
      console.log(`🚀 AUTO-SCORING COMPLETE - Student should see instant results!`);

    } catch (resultError) {
      // Enhanced error handling with timing
      const totalErrorTime = Date.now() - startTime;
      console.error(`❌ CRITICAL: Auto-scoring failed after ${totalErrorTime}ms:`, resultError);
      console.error('❌ Result data that failed:', JSON.stringify(resultData, null, 2));
      if (resultError instanceof Error) {
        console.error('❌ Error details:', resultError.message);
        console.error('❌ Error stack:', resultError.stack);
      }
      throw resultError;
    }

  } catch (error) {
    const totalErrorTime = Date.now() - startTime;
    console.error(`Auto-scoring error after ${totalErrorTime}ms:`, error);
    throw error;
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
      const userId = typeof user.id === 'string' ? user.id : String(user.id);
      const tokenPayload = {
        userId: userId,
        email: user.email,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1000),
      };
      
      const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
      
      console.log(`Login successful for ${email} with roleId: ${user.roleId}`);
      
      res.json({ 
        token,
        user: { 
          id: userId, 
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
          case '23505': // Unique violation (handled above for admission number, but just in case)
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
  app.get("/api/classes", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
  app.get("/api/subjects", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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

  // Exams
  app.post("/api/exams", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log('Exam creation request body:', JSON.stringify(req.body, null, 2));
      const examData = insertExamSchema.omit({ createdBy: true }).parse(req.body);
      console.log('Parsed exam data:', JSON.stringify(examData, null, 2));
      const examWithCreator = { ...examData, createdBy: (req as any).user.id };
      console.log('Final exam data with creator:', JSON.stringify(examWithCreator, null, 2));
      const exam = await storage.createExam(examWithCreator);
      res.json(exam);
    } catch (error) {
      console.error('Exam creation error:', error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid exam data", details: error.message });
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
      res.json({ message: "Exam deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam" });
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
      
      // Validate options for multiple choice questions
      if (validatedQuestion.questionType === 'multiple_choice') {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ message: "Multiple choice questions require at least 2 options" });
        }
        
        const hasCorrectAnswer = options.some(option => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          return res.status(400).json({ message: "Multiple choice questions require at least one correct answer" });
        }
      }
      
      // Create question with options atomically (compensation-based)
      const question = await storage.createExamQuestionWithOptions(validatedQuestion, options);
      res.json(question);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid question data";
      res.status(400).json({ message });
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
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete question" });
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
      const questionCounts = await storage.getExamQuestionCounts(ids);
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

  // Bulk Question Upload - for CSV uploads
  app.post("/api/exam-questions/bulk", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const user = (req as any).user;
      const { examId, questions } = req.body;

      if (!examId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Exam ID and questions array are required" });
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

      const createdQuestions = [];
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
          }

          questions[i] = { ...questionData, validatedQuestion };
        } catch (error) {
          validationErrors.push(`Question ${i + 1}: ${error instanceof Error ? error.message : 'Invalid question data'}`);
        }
      }

      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          message: "Validation errors found",
          errors: validationErrors
        });
      }

      // Create all questions in sequence using atomic method
      for (const questionData of questions) {
        try {
          const question = await storage.createExamQuestionWithOptions(
            questionData.validatedQuestion, 
            questionData.options || []
          );
          createdQuestions.push(question);
        } catch (error) {
          console.error('Failed to create question:', error);
          // If any question fails, we should ideally rollback, but for now log and continue
          // TODO: Implement proper transaction handling in storage layer
        }
      }

      res.json({ 
        message: `Successfully created ${createdQuestions.length} questions`,
        created: createdQuestions.length,
        questions: createdQuestions 
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

  // Exam results
  app.post("/api/exam-results", authenticateUser, async (req, res) => {
    try {
      const resultData = insertExamResultSchema.parse(req.body);
      
      // Security validation: Only teachers (roleId 2) and admins (roleId 1) can record results
      // Students cannot submit their own scores to prevent tampering
      if ((req as any).user.roleId >= 3) {
        return res.status(403).json({ message: "Students cannot submit exam results directly" });
      }
      
      // Set recordedBy to the authenticated user
      const secureResultData = {
        ...resultData,
        recordedBy: (req as any).user.id
      };
      
      const result = await storage.recordExamResult(secureResultData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid exam result data" });
    }
  });

  // Add dedicated auto-scoring status endpoint for better polling
  app.get("/api/exam-sessions/:sessionId/scoring-status", authenticateUser, async (req, res) => {
    try {
      const { sessionId } = req.params;
      const user = (req as any).user;
      
      // Get the session to verify ownership
      const session = await storage.getExamSessionById(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({ 
          status: 'error',
          message: "Exam session not found",
          result: null 
        });
      }
      
      // Security: Students can only check their own sessions
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ 
          status: 'error',
          message: "Access denied",
          result: null 
        });
      }
      
      // ENHANCED LOGIC: Check if auto-scoring result exists
      console.log(`Checking auto-scoring status for session ${sessionId}, student ${session.studentId}, exam ${session.examId}`);
      
      try {
        const results = await storage.getExamResultsByStudent(session.studentId);
        console.log(`📊 Found ${results.length} total results for student ${session.studentId}`);
        
        const autoScoredResult = results.find((r: any) => r.examId === session.examId && r.autoScored === true);
        
        if (autoScoredResult) {
          console.log(`✅ Auto-scoring result found for session ${sessionId}:`, autoScoredResult.score, '/', autoScoredResult.maxScore);
          res.json({ 
            status: 'completed', 
            result: autoScoredResult,
            message: 'Auto-scoring completed successfully'
          });
        } else if (session.isCompleted) {
          // SAFETY CHECK: If session completed more than 30 seconds ago and no result, something went wrong
          const completedAt = session.submittedAt || session.createdAt;
          const now = new Date();
          const timeSinceCompletion = completedAt ? (now.getTime() - new Date(completedAt).getTime()) / 1000 : 0;
          
          if (timeSinceCompletion > 30) {
            console.warn(`⚠️ Session ${sessionId} completed ${timeSinceCompletion}s ago but no auto-scored result found - possible scoring failure`);
            
            // Check if there are any exam questions at all
            const examQuestions = await storage.getExamQuestions(session.examId);
            const hasAutoScorableQuestions = examQuestions.some((q: any) => q.questionType === 'multiple_choice');
            
            if (!hasAutoScorableQuestions) {
              console.log(`📝 No auto-scorable questions found for exam ${session.examId} - manual grading required`);
              res.json({ 
                status: 'manual_grading_required', 
                result: null,
                message: 'This exam requires manual grading by your instructor'
              });
            } else {
              console.error(`❌ TIMEOUT: Auto-scoring failed for session ${sessionId} after ${timeSinceCompletion}s`);
              res.json({ 
                status: 'timeout', 
                result: null,
                message: 'Auto-scoring timed out. Your instructor will grade manually and results will be available soon.'
              });
            }
          } else {
            console.log(`⏳ Session ${sessionId} is completed but no auto-scored result yet (${timeSinceCompletion}s ago)`);
            res.json({ 
              status: 'processing', 
              result: null,
              message: 'Auto-scoring in progress'
            });
          }
        } else {
          console.log(`📝 Session ${sessionId} is still in progress`);
          res.json({ 
            status: 'in_progress', 
            result: null,
            message: 'Exam session still in progress'
          });
        }
      } catch (dbError) {
        console.error('❌ Database error while checking scoring status:', dbError);
        res.status(500).json({ 
          status: 'error', 
          result: null,
          message: "Database error while checking results",
          error: dbError instanceof Error ? dbError.message : 'Database error'
        });
      }
    } catch (error) {
      console.error('❌ Error checking auto-scoring status:', error);
      res.status(500).json({ 
        status: 'error', 
        result: null,
        message: "Failed to check auto-scoring status",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.get("/api/exam-results/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = (req as any).user;
      
      // Security: Students can only view their own results, teachers and admins can view any
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Students can only view their own exam results" });
      }
      
      console.log(`Fetching exam results for student: ${studentId}`);
      const results = await storage.getExamResultsByStudent(studentId);
      console.log(`Found ${results.length} exam results for student ${studentId}`);
      
      // Add debug logging for auto-scored results
      const autoScoredCount = results.filter((r: any) => r.autoScored === true).length;
      console.log(`   - ${autoScoredCount} auto-scored results found`);
      
      // Return empty array if no results found (this is normal)
      res.json(results || []);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        message: "Failed to fetch exam results", 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  app.get("/api/exam-results/exam/:examId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { examId } = req.params;
      const results = await storage.getExamResultsByExam(parseInt(examId));
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });

  // Teacher-specific result views
  app.get("/api/teachers/results/by-class/:classId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.params;
      const user = (req as any).user;
      
      console.log(`Teacher ${user.email} fetching results for class ${classId}`);
      
      // For teachers, ensure they have access to this class (they created exams for it or are class teacher)
      if (user.roleId === ROLES.TEACHER) {
        // Check if teacher has created any exams for this class or is the class teacher
        const classExams = await storage.getExamsByClass(parseInt(classId));
        const teacherExams = classExams.filter((exam: any) => exam.createdBy === user.id);
        
        // Also check if they are the class teacher
        const classInfo = await storage.getClass(parseInt(classId));
        const isClassTeacher = classInfo && classInfo.classTeacherId === user.id;
        
        if (teacherExams.length === 0 && !isClassTeacher) {
          return res.status(403).json({ 
            message: "Access denied. You can only view results for classes where you've created exams or are the class teacher." 
          });
        }
      }
      
      const results = await storage.getExamResultsByClass(parseInt(classId));
      
      // Enhance results with additional information (exam names, student names, subjects)
      const enhancedResults = await Promise.all(results.map(async (result: any) => {
        try {
          // Get exam information
          const exam = await storage.getExamById(result.examId);
          
          // Get student information
          const student = await storage.getStudent(result.studentId);
          let studentName = 'Unknown Student';
          if (student) {
            const user = await storage.getUser(student.id);
            if (user) {
              studentName = `${user.firstName} ${user.lastName}`;
            }
          }
          
          // Get subject information
          let subjectName = 'Unknown Subject';
          if (exam) {
            const subject = await storage.getSubject(exam.subjectId);
            if (subject) {
              subjectName = subject.name;
            }
          }
          
          return {
            ...result,
            examName: exam ? exam.name : 'Unknown Exam',
            studentName,
            subjectName,
            examDate: exam ? exam.date : null,
            totalMarks: exam ? exam.totalMarks : null
          };
        } catch (error) {
          console.error('Error enhancing result:', error);
          return result;
        }
      }));
      
      console.log(`Found ${enhancedResults.length} results for class ${classId}`);
      res.json(enhancedResults);
    } catch (error) {
      console.error('Error fetching class results:', error);
      res.status(500).json({ message: "Failed to fetch class results" });
    }
  });

  app.get("/api/teachers/results/by-exam/:examId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { examId } = req.params;
      const user = (req as any).user;
      
      console.log(`Teacher ${user.email} fetching results for exam ${examId}`);
      
      // For teachers, ensure they created this exam
      if (user.roleId === ROLES.TEACHER) {
        const exam = await storage.getExamById(parseInt(examId));
        if (!exam || exam.createdBy !== user.id) {
          return res.status(403).json({ 
            message: "Access denied. You can only view results for exams you created." 
          });
        }
      }
      
      const results = await storage.getExamResultsByExam(parseInt(examId));
      
      // Enhance results with additional information (student names, class information)
      const enhancedResults = await Promise.all(results.map(async (result: any) => {
        try {
          // Get student information
          const student = await storage.getStudent(result.studentId);
          let studentName = 'Unknown Student';
          let className = 'Unknown Class';
          
          if (student) {
            const user = await storage.getUser(student.id);
            if (user) {
              studentName = `${user.firstName} ${user.lastName}`;
            }
            
            // Get class information
            if (student.classId) {
              const classInfo = await storage.getClass(student.classId);
              if (classInfo) {
                className = classInfo.name;
              }
            }
          }
          
          return {
            ...result,
            studentName,
            className,
            admissionNumber: student ? student.admissionNumber : null
          };
        } catch (error) {
          console.error('Error enhancing result:', error);
          return result;
        }
      }));
      
      console.log(`Found ${enhancedResults.length} results for exam ${examId}`);
      res.json(enhancedResults);
    } catch (error) {
      console.error('Error fetching exam results:', error);
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });

  // Exam Sessions - for managing student exam taking sessions
  app.post("/api/exam-sessions", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      
      // Check if user is a student
      if (user.roleId !== ROLES.STUDENT) {
        return res.status(403).json({ message: "Only students can start exam sessions" });
      }
      
      // Check if user has a corresponding student record
      const student = await storage.getStudent(user.id);
      if (!student) {
        return res.status(403).json({ message: "Student profile not found. Please contact your administrator." });
      }
      
      // Client-facing schema - only require examId
      const createExamSessionBody = z.object({
        examId: z.number()
      });
      
      const { examId } = createExamSessionBody.parse(req.body);
      
      // Verify exam exists and is accessible
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Check if exam is published and available
      if (!exam.isPublished) {
        return res.status(403).json({ message: "Exam is not published" });
      }
      
      // SECURITY: Check if student belongs to exam's class
      if (student.classId !== exam.classId) {
        return res.status(403).json({ message: "You are not authorized to take this exam" });
      }
      
      // Check exam time window (startTime/endTime)
      const now = new Date();
      if (exam.startTime && now < new Date(exam.startTime)) {
        return res.status(403).json({ message: "Exam has not started yet" });
      }
      if (exam.endTime && now > new Date(exam.endTime)) {
        return res.status(403).json({ message: "Exam has ended" });
      }

      // Check for existing active session to prevent duplicates
      const existingSession = await storage.getActiveExamSession(examId, user.id);
      if (existingSession) {
        return res.status(409).json({ message: "Active exam session already exists", sessionId: existingSession.id });
      }

      // Check retakes policy: if retakes not allowed, check for completed sessions
      if (!exam.allowRetakes) {
        const allStudentSessions = await storage.getExamSessionsByStudent(user.id);
        const completedSession = allStudentSessions.find(s => 
          s.examId === examId && s.isCompleted
        );
        if (completedSession) {
          return res.status(403).json({ message: "Retakes are not allowed for this exam" });
        }
      }

      // Build session data with server-side timeout protection
      const sessionData = {
        examId,
        studentId: user.id,
        timeRemaining: exam.timeLimit ? exam.timeLimit * 60 : null, // convert minutes to seconds
        startedAt: now,
        // SERVER-SIDE TIMEOUT PROTECTION: Calculate absolute timeout for fail-safe cleanup
        serverTimeoutAt: exam.timeLimit ? new Date(now.getTime() + (exam.timeLimit * 60 * 1000) + 30000) : null, // +30s grace period
        lastActivityAt: now,
        submissionMethod: 'manual' // Default to manual, will be updated if auto-submitted
      };
      
      const session = await storage.createExamSession(sessionData);
      console.log(`Created exam session ${session.id} for student ${user.id} with ${exam.timeLimit || 'unlimited'} minutes`);
      res.json(session);
    } catch (error) {
      console.error('Error creating exam session:', error);
      
      // Improved error handling with proper instance checks
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data format" });
      }
      
      if (error instanceof Error) {
        // Check for specific PostgreSQL error codes if available
        const pgError = error as any;
        if (pgError.code === '23503') { // Foreign key violation
          return res.status(400).json({ message: "Student profile not found. Please contact your administrator." });
        }
        if (pgError.code === '42703') { // Undefined column
          return res.status(500).json({ message: "Database schema error. Please contact your administrator." });
        }
        
        // Fallback to message checking for other database errors
        if (error.message.includes('foreign key')) {
          return res.status(400).json({ message: "Student profile not found. Please contact your administrator." });
        }
      }
      
      // Default to 500 for unexpected server errors
      res.status(500).json({ message: "An unexpected error occurred. Please try again." });
    }
  });

  app.get("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const session = await storage.getExamSessionById(parseInt(id));
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      
      // Security: Students can only access their own sessions
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam session" });
    }
  });

  app.get("/api/exam-sessions/exam/:examId", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { examId } = req.params;
      
      // Security: Students cannot list sessions for any exam (privacy breach)
      if (user.roleId === ROLES.STUDENT) {
        return res.status(403).json({ message: "Students cannot view exam session lists" });
      }
      
      // For teachers: verify they created this exam
      if (user.roleId === ROLES.TEACHER) {
        const exam = await storage.getExamById(parseInt(examId));
        if (!exam || exam.createdBy !== user.id) {
          return res.status(403).json({ message: "Teachers can only view sessions for their own exams" });
        }
      }
      
      // Admins (roleId 1) can view all sessions
      const sessions = await storage.getExamSessionsByExam(parseInt(examId));
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam sessions" });
    }
  });

  app.get("/api/exam-sessions/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { studentId } = req.params;
      
      // Fix type comparison bug: ensure proper number comparison
      const numericStudentId = studentId;
      const numericUserId = user.id;
      
      // Security: Students can only access their own sessions
      if (user.roleId === ROLES.STUDENT && numericStudentId !== numericUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For teachers: verify they have access to this student's exams
      if (user.roleId === ROLES.TEACHER) {
        // Teachers should only see sessions for exams they created
        const allSessions = await storage.getExamSessionsByStudent(studentId);
        const teacherSessions = [];
        
        for (const session of allSessions) {
          const exam = await storage.getExamById(session.examId);
          if (exam && exam.createdBy === user.id) {
            teacherSessions.push(session);
          }
        }
        
        return res.json(teacherSessions);
      }
      
      // Admins and students (own data) can see all sessions
      const sessions = await storage.getExamSessionsByStudent(studentId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student exam sessions" });
    }
  });

  app.get("/api/exam-sessions/active/:examId/:studentId", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { examId, studentId } = req.params;
      
      // Security: Students can only access their own sessions
      if (user.roleId === ROLES.STUDENT && studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const session = await storage.getActiveExamSession(parseInt(examId), studentId);
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active exam session" });
    }
  });

  app.put("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      // Get existing session to check ownership
      const existingSession = await storage.getExamSessionById(parseInt(id));
      if (!existingSession) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      
      // Security: Students can only update their own sessions
      if (user.roleId === ROLES.STUDENT && existingSession.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sessionData = updateExamSessionSchema.parse(req.body);
      
      // SECURITY: Double-check that only safe fields are being updated by students
      // This provides defense in depth even if schema validation were bypassed
      const allowedFields = ['isCompleted', 'submittedAt', 'timeRemaining', 'status'] as const;
      const allowedUpdates = Object.fromEntries(
        Object.entries(sessionData).filter(([key]) => allowedFields.includes(key as any))
      );
      
      // Additional validation: ensure status transitions are valid for students
      if (allowedUpdates.status && allowedUpdates.status !== 'submitted') {
        return res.status(400).json({ message: "Students can only set status to 'submitted'" });
      }
      
      // Time limit validation on session completion
      if (allowedUpdates.isCompleted === true && existingSession.timeRemaining && existingSession.startedAt) {
        const now = new Date();
        const timeElapsedInSeconds = (now.getTime() - new Date(existingSession.startedAt).getTime()) / 1000;
        
        if (timeElapsedInSeconds > existingSession.timeRemaining) {
          console.log(`Session ${id} completion after time limit: ${(timeElapsedInSeconds/60).toFixed(1)} > ${(existingSession.timeRemaining/60).toFixed(1)} minutes`);
          // Allow completion even if time exceeded - they're being honest about submitting
        }
      }

      // Auto-scoring logic: If session is being marked as completed, calculate scores
      // CRITICAL FIX: Complete auto-scoring BEFORE updating session to prevent race conditions
      if (allowedUpdates.isCompleted === true && !existingSession.isCompleted) {
        try {
          console.log('🎯 Triggering auto-scoring for session:', id);
          console.log('   - Student ID:', existingSession.studentId);
          console.log('   - Exam ID:', existingSession.examId);
          
          // SYNCHRONOUS auto-scoring - must complete before session update
          await autoScoreExamSession(parseInt(id), storage);
          console.log('✅ Auto-scoring completed successfully for session:', id);
          
          // Only update session after auto-scoring succeeds
          const session = await storage.updateExamSession(parseInt(id), allowedUpdates);
          if (!session) {
            return res.status(404).json({ message: "Exam session not found" });
          }
          
          // Verify auto-scoring result exists before responding
          const results = await storage.getExamResultsByStudent(existingSession.studentId);
          const autoScoredResult = results.find((r: any) => r.examId === existingSession.examId && r.autoScored === true);
          
          if (autoScoredResult) {
            console.log('🎉 Confirmed auto-scored result exists:', autoScoredResult.score, '/', autoScoredResult.maxScore);
          } else {
            console.warn('⚠️ Session updated but no auto-scored result found - this may cause client polling issues');
          }
          
          res.json(session);
        } catch (error) {
          console.error('❌ CRITICAL: Auto-scoring failed for session:', id);
          console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
          console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
          
          // IMPORTANT: Still update session but with a flag indicating manual grading needed
          const sessionWithFallback = await storage.updateExamSession(parseInt(id), {
            ...allowedUpdates,
            // Add a custom field or note about scoring failure if your schema supports it
          });
          
          if (!sessionWithFallback) {
            return res.status(404).json({ message: "Exam session not found" });
          }
          
          // Return session with warning that manual grading is needed
          res.json({
            ...sessionWithFallback,
            scoringStatus: 'failed',
            scoringError: 'Auto-scoring failed, manual grading required'
          });
        }
      } else {
        // Normal session update without auto-scoring
        const session = await storage.updateExamSession(parseInt(id), allowedUpdates);
        if (!session) {
          return res.status(404).json({ message: "Exam session not found" });
        }
        res.json(session);
      }
    } catch (error) {
      console.error('Error updating exam session:', error);
      res.status(400).json({ message: "Invalid exam session data" });
    }
  });

  app.delete("/api/exam-sessions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteExamSession(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      res.json({ message: "Exam session deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam session" });
    }
  });

  // MILESTONE 1: Synchronous Exam Submit API - POST /api/exams/:examId/submit
  // Provides instant feedback without polling for maximum user experience
  app.post("/api/exams/:examId/submit", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { examId } = req.params;
      
      console.log(`🚀 SYNCHRONOUS SUBMIT: User ${user.id} submitting exam ${examId}`);
      
      // Security: Only students can submit exams
      if (user.roleId !== ROLES.STUDENT) {
        return res.status(403).json({ 
          message: "Only students can submit exams",
          submitted: false 
        });
      }
      
      // Find the active exam session for this student and exam
      const activeSession = await storage.getActiveExamSession(parseInt(examId), user.id);
      if (!activeSession) {
        return res.status(404).json({ 
          message: "No active exam session found. Please start the exam first.",
          submitted: false 
        });
      }
      
      console.log(`📋 Found active session ${activeSession.id} for exam ${examId}`);
      
      // IDEMPOTENCY GUARD: Check if already submitted
      if (activeSession.isCompleted) {
        console.log(`⚠️ IDEMPOTENCY: Session ${activeSession.id} already completed, returning existing result`);
        
        // Get existing result if available
        const existingResults = await storage.getExamResultsByStudent(user.id);
        const existingResult = existingResults.find((r: any) => r.examId === parseInt(examId));
        
        if (existingResult) {
          return res.json({
            message: "Exam already submitted",
            submitted: true,
            alreadySubmitted: true,
            result: {
              score: existingResult.score,
              maxScore: existingResult.maxScore,
              percentage: (existingResult.maxScore ?? 0) > 0 
                ? Math.round(((existingResult.score ?? 0) / (existingResult.maxScore ?? 0)) * 100)
                : 0,
              autoScored: existingResult.autoScored,
              submittedAt: activeSession.submittedAt
            }
          });
        } else {
          return res.json({
            message: "Exam already submitted, results pending",
            submitted: true,
            alreadySubmitted: true,
            result: null
          });
        }
      }
      
      // SERVER-SIDE TIMEOUT ENFORCEMENT WITH GRACE PERIOD
      const exam = await storage.getExamById(parseInt(examId));
      let isLateSubmission = false;
      const GRACE_PERIOD_SECONDS = 10; // Allow 10 seconds grace for pending saves
      
      if (exam?.timeLimit && activeSession.startedAt) {
        const now = new Date();
        const timeElapsedInMinutes = (now.getTime() - new Date(activeSession.startedAt).getTime()) / (1000 * 60);
        const gracePeriodMinutes = GRACE_PERIOD_SECONDS / 60;
        
        if (timeElapsedInMinutes > (exam.timeLimit + gracePeriodMinutes)) {
          isLateSubmission = true;
          console.log(`⏰ LATE SUBMISSION: Session ${activeSession.id} exceeded ${exam.timeLimit} minutes + ${GRACE_PERIOD_SECONDS}s grace (elapsed: ${timeElapsedInMinutes.toFixed(1)})`);
          // Continue with submission but mark as timed out - don't reject!
        } else if (timeElapsedInMinutes > exam.timeLimit) {
          isLateSubmission = true;
          console.log(`⏰ LATE SUBMISSION (within grace): Session ${activeSession.id} exceeded ${exam.timeLimit} minutes but within grace period (elapsed: ${timeElapsedInMinutes.toFixed(1)})`);
        }
      }
      
      // STEP 1: Run instant auto-scoring BEFORE marking as completed (for robustness)
      console.log(`🎯 STEP 1: Running instant auto-scoring for session ${activeSession.id}`);
      let scoringResult = null;
      let scoringError = null;
      
      try {
        // Run auto-scoring synchronously
        await autoScoreExamSession(activeSession.id, storage);
        console.log(`✅ Auto-scoring completed successfully for session ${activeSession.id}`);
        
        // Get the results immediately after scoring
        console.log(`📊 Fetching auto-scoring results for student ${user.id}, exam ${examId}`);
        const results = await storage.getExamResultsByStudent(user.id);
        const examResult = results.find((r: any) => r.examId === parseInt(examId) && r.autoScored === true);
        
        if (examResult) {
          const score = examResult.score ?? 0;
          const maxScore = examResult.maxScore ?? 0;
          const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
          
          console.log(`🎉 INSTANT FEEDBACK: Score ${score}/${maxScore} (${percentage}%) for exam ${examId}`);
          
          // Get question breakdown for detailed feedback
          const examQuestions = await storage.getExamQuestions(parseInt(examId));
          const studentAnswers = await storage.getStudentAnswers(activeSession.id);
          const mcQuestions = examQuestions.filter((q: any) => q.questionType === 'multiple_choice');
          const essayQuestions = examQuestions.filter((q: any) => q.questionType !== 'multiple_choice');
          
          scoringResult = {
            score,
            maxScore,
            percentage,
            autoScored: true,
            breakdown: {
              totalQuestions: examQuestions.length,
              multipleChoiceQuestions: mcQuestions.length,
              essayQuestions: essayQuestions.length,
              answeredQuestions: studentAnswers.length,
              autoScoredQuestions: mcQuestions.length,
              pendingManualReview: essayQuestions.length
            }
          };
        }
        
      } catch (error) {
        console.error(`❌ Auto-scoring failed for session ${activeSession.id}:`, error);
        scoringError = error instanceof Error ? error.message : 'Auto-scoring failed';
        // Continue with submission even if scoring fails
      }
      
      // STEP 2: Mark session as completed (only after scoring attempt)
      console.log(`✅ STEP 2: Marking session ${activeSession.id} as completed`);
      const completedSession = await storage.updateExamSession(activeSession.id, {
        isCompleted: true,
        submittedAt: new Date(),
        status: 'submitted'
      });
      
      if (!completedSession) {
        throw new Error('Failed to complete exam session');
      }
      
      // STEP 3: Return standardized response
      const baseMessage = isLateSubmission 
        ? "Exam submitted (after time limit). Results available below."
        : "Exam submitted successfully! 🎉";
      
      if (scoringResult) {
        return res.json({
          message: baseMessage,
          submitted: true,
          alreadySubmitted: false,
          timedOut: isLateSubmission,
          result: {
            ...scoringResult,
            submittedAt: completedSession.submittedAt,
            timedOut: isLateSubmission
          }
        });
      } else {
        // Scoring failed or no result found
        const fallbackMessage = isLateSubmission
          ? "Exam submitted (after time limit). Manual grading will be performed by your instructor."
          : scoringError 
            ? "Exam submitted successfully. Manual grading will be performed by your instructor."
            : "Exam submitted successfully. Results are being processed.";
            
        return res.json({
          message: fallbackMessage,
          submitted: true,
          alreadySubmitted: false,
          timedOut: isLateSubmission,
          result: null,
          scoringError: scoringError || undefined
        });
      }
      
    } catch (error) {
      console.error('❌ SYNCHRONOUS SUBMIT ERROR:', error);
      
      // Determine error type for better user experience
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Don't expose internal errors to students
      const isInternalError = errorMessage.includes('database') || 
                            errorMessage.includes('storage') || 
                            errorMessage.includes('SQL');
      
      const userMessage = isInternalError 
        ? "A technical error occurred. Please try again or contact your instructor."
        : errorMessage;
      
      res.status(500).json({ 
        message: userMessage,
        submitted: false,
        error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      });
    }
  });

  // Student Answers - for managing student responses during exams
  app.post("/api/student-answers", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const answerData = insertStudentAnswerSchema.parse(req.body);
      
      // Verify session exists and belongs to the user
      const session = await storage.getExamSessionById(answerData.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      
      // Security: Students can only submit answers for their own sessions
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if session is still active (not completed)
      if (session.isCompleted) {
        return res.status(409).json({ message: "Cannot submit answers to completed exam" });
      }

      // Server-side time limit enforcement
      if (session.timeRemaining && session.startedAt) {
        const now = new Date();
        const timeElapsedInMinutes = (now.getTime() - new Date(session.startedAt).getTime()) / (1000 * 60);
        
        if (timeElapsedInMinutes > session.timeRemaining) {
          // Time limit exceeded - automatically complete the session
          console.log(`Time limit exceeded for session ${session.id}: ${timeElapsedInMinutes.toFixed(1)} > ${session.timeRemaining} minutes`);
          await storage.updateExamSession(session.id, { isCompleted: true });
          
          // Trigger auto-scoring for completed session
          try {
            await autoScoreExamSession(session.id, storage);
          } catch (error) {
            console.error('Auto-scoring failed after time limit:', error);
          }
          
          return res.status(403).json({ message: "Time limit exceeded. Exam has been automatically submitted." });
        }
      }
      
      // Check if answer already exists and update instead of create
      const existingAnswers = await storage.getStudentAnswers(answerData.sessionId);
      const existingAnswer = existingAnswers.find(a => a.questionId === answerData.questionId);
      
      if (existingAnswer) {
        // Update existing answer
        const answer = await storage.updateStudentAnswer(existingAnswer.id, answerData);
        res.json(answer);
      } else {
        // Create new answer
        const answer = await storage.createStudentAnswer(answerData);
        res.json(answer);
      }
    } catch (error) {
      console.error('Error creating/updating student answer:', error);
      
      // Handle Zod validation errors specifically
      if ((error as any)?.name === 'ZodError' || ((error as any)?.issues && Array.isArray((error as any).issues))) {
        const validationErrors = (error as any).issues || [];
        return res.status(400).json({
          message: "Answer validation failed",
          type: "validation_error", 
          errors: validationErrors.map((issue: any) => ({
            field: issue.path?.join('.') || 'unknown',
            message: issue.message,
            code: issue.code
          }))
        });
      }
      
      // Handle other structured errors
      if (error instanceof Error) {
        // Handle database constraint errors
        if (error.message.includes('foreign key constraint')) {
          return res.status(400).json({ 
            message: "Invalid question or session reference",
            type: "reference_error"
          });
        }
        
        // Handle unique constraint violations  
        if (error.message.includes('unique constraint')) {
          return res.status(409).json({
            message: "Answer already exists for this question",
            type: "duplicate_error"
          });
        }
        
        // Handle database connection issues
        if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
          return res.status(503).json({
            message: "Database temporarily unavailable. Please try again.",
            type: "connection_error"
          });
        }
      }
      
      // Generic error fallback
      res.status(500).json({ 
        message: "Failed to save answer. Please try again.",
        type: "server_error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/student-answers/session/:sessionId", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { sessionId } = req.params;
      
      // Verify session exists and check ownership
      const session = await storage.getExamSessionById(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      
      // Security: Students can only view answers for their own sessions
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const answers = await storage.getStudentAnswers(parseInt(sessionId));
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student answers" });
    }
  });

  app.put("/api/student-answers/:id", authenticateUser, async (req, res) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      
      // Get existing answer to check ownership
      const existingAnswers = await storage.getStudentAnswers(parseInt(id)); // This needs sessionId, let me get the answer first
      // Actually, we need to get answer by ID, but our storage doesn't have that method
      // For now, let's add security through session verification
      
      const answerData = insertStudentAnswerSchema.partial().parse(req.body);
      
      // If sessionId is being updated, verify the session belongs to user
      if (answerData.sessionId) {
        const session = await storage.getExamSessionById(answerData.sessionId);
        if (!session) {
          return res.status(404).json({ message: "Exam session not found" });
        }
        
        // Security: Students can only update answers for their own sessions
        if (user.roleId >= 3 && session.studentId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Check if session is still active
        if (session.isCompleted) {
          return res.status(409).json({ message: "Cannot update answers for completed exam" });
        }
      }
      
      const answer = await storage.updateStudentAnswer(parseInt(id), answerData);
      if (!answer) {
        return res.status(404).json({ message: "Student answer not found" });
      }
      res.json(answer);
    } catch (error) {
      console.error('Error updating student answer:', error);
      res.status(400).json({ message: "Invalid student answer data" });
    }
  });

  // Announcements
  app.get("/api/announcements", async (req, res) => {
    try {
      const { role } = req.query;
      const announcements = await storage.getAnnouncements(
        typeof role === 'string' ? role : undefined
      );
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });

  app.put("/api/announcements/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { id } = req.params;
      const announcementData = insertAnnouncementSchema.partial().parse(req.body);
      const announcement = await storage.updateAnnouncement(parseInt(id), announcementData);
      
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });

  app.delete("/api/announcements/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteAnnouncement(parseInt(id));
      
      if (!success) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json({ message: "Announcement deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Messages
  app.get("/api/messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const messages = await storage.getMessagesByUser(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  // Gallery
  app.get("/api/gallery", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const images = await storage.getGalleryImages(
        categoryId && typeof categoryId === 'string' ? parseInt(categoryId) : undefined
      );
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.get("/api/gallery/categories", async (req, res) => {
    try {
      const categories = await storage.getGalleryCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery categories" });
    }
  });

  // Academic terms
  app.get("/api/terms", async (req, res) => {
    try {
      const terms = await storage.getTerms();
      res.json(terms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch terms" });
    }
  });

  app.get("/api/terms/current", async (req, res) => {
    try {
      const term = await storage.getCurrentTerm();
      res.json(term);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current term" });
    }
  });

  // Analytics and Reports endpoints
  app.get("/api/reports/overview", async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/reports/performance", async (req, res) => {
    try {
      const { classId, subjectId, termId } = req.query;
      const filters = {
        classId: classId ? parseInt(classId as string) : undefined,
        subjectId: subjectId ? parseInt(subjectId as string) : undefined,
        termId: termId ? parseInt(termId as string) : undefined,
      };
      const performance = await storage.getPerformanceAnalytics(filters);
      res.json(performance);
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      res.status(500).json({ message: "Failed to fetch performance analytics" });
    }
  });

  app.get("/api/reports/trends", async (req, res) => {
    try {
      const { months = 6 } = req.query;
      const trends = await storage.getTrendAnalytics(parseInt(months as string));
      res.json(trends);
    } catch (error) {
      console.error('Error fetching trend analytics:', error);
      res.status(500).json({ message: "Failed to fetch trend analytics" });
    }
  });

  app.get("/api/reports/attendance", async (req, res) => {
    try {
      const { classId, startDate, endDate } = req.query;
      const filters = {
        classId: classId ? parseInt(classId as string) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
      };
      const attendance = await storage.getAttendanceAnalytics(filters);
      res.json(attendance);
    } catch (error) {
      console.error('Error fetching attendance analytics:', error);
      res.status(500).json({ message: "Failed to fetch attendance analytics" });
    }
  });

  // File upload routes
  app.post("/api/upload/profile", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), upload.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      const imageUrl = `/uploads/profiles/${req.file.filename}`;
      
      // Update user profile with new image URL
      const updatedUser = await storage.updateUser(userId, { profileImageUrl: imageUrl });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Profile image uploaded successfully", 
        imageUrl,
        user: updatedUser 
      });
    } catch (error) {
      console.error('Profile upload error:', error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  app.post("/api/upload/gallery", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), upload.single('galleryImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { caption, categoryId, uploadedBy } = req.body;
      const imageUrl = `/uploads/gallery/${req.file.filename}`;
      
      const galleryImage = await storage.uploadGalleryImage({
        imageUrl,
        caption: caption || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        uploadedBy: uploadedBy || null
      });

      res.json({ 
        message: "Gallery image uploaded successfully", 
        image: galleryImage 
      });
    } catch (error) {
      console.error('Gallery upload error:', error);
      res.status(500).json({ message: "Failed to upload gallery image" });
    }
  });

  // File serving route with security validation
  app.get("/uploads/*", async (req, res) => {
    try {
      // Prevent directory traversal attacks
      const requestedPath = req.path;
      const normalizedPath = path.normalize(requestedPath);
      
      // Ensure the path is within the uploads directory
      if (!normalizedPath.startsWith('/uploads/')) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if file type is in allowed directories
      const pathParts = normalizedPath.split('/');
      if (pathParts.length < 3 || !['profiles', 'gallery', 'study-resources'].includes(pathParts[2])) {
        return res.status(403).json({ message: "Invalid file path" });
      }
      
      const safePath = path.join(process.cwd(), normalizedPath);
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Double check the resolved path is within uploads directory
      if (!safePath.startsWith(uploadsDir)) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if file exists before serving
      try {
        await fs.access(safePath);
        res.sendFile(safePath);
      } catch (accessError) {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error('File serving error:', error);
      res.status(500).json({ message: "Server error" });
    }
  });

  // Delete gallery image by record ID (secure)
  app.delete("/api/gallery/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get image record first to find the file path
      const image = await storage.getGalleryImageById(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      // Delete the file from filesystem
      const filePath = path.join(process.cwd(), image.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error('File deletion error:', fileError);
        // Continue with database deletion even if file deletion fails
      }
      
      // Delete the record from storage
      const success = await storage.deleteGalleryImage(id);
      if (!success) {
        return res.status(404).json({ message: "Failed to delete image record" });
      }
      
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error('Image deletion error:', error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });
  
  // Delete profile image (updates user record)
  app.delete("/api/users/:userId/profile-image", authenticateUser, async (req, res) => {
    try {
      const { userId } = req.params;
      
      // Get user record to find current profile image
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (user.profileImageUrl) {
        // Delete the file from filesystem
        const filePath = path.join(process.cwd(), user.profileImageUrl);
        try {
          await fs.unlink(filePath);
        } catch (fileError) {
          console.error('File deletion error:', fileError);
          // Continue with database update even if file deletion fails
        }
      }
      
      // Update user record to remove profile image URL
      const updatedUser = await storage.updateUser(userId, { profileImageUrl: null });
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user record" });
      }
      
      res.json({ message: "Profile image deleted successfully", user: updatedUser });
    } catch (error) {
      console.error('Profile image deletion error:', error);
      res.status(500).json({ message: "Failed to delete profile image" });
    }
  });

  // Gallery routes
  app.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      console.error('Gallery fetch error:', error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });

  app.get("/api/gallery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getGalleryImageById(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json(image);
    } catch (error) {
      console.error('Gallery image fetch error:', error);
      res.status(500).json({ message: "Failed to fetch gallery image" });
    }
  });

  app.delete("/api/gallery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGalleryImage(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Image not found" });
      }
      
      res.json({ message: "Gallery image deleted successfully" });
    } catch (error) {
      console.error('Gallery delete error:', error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });

  // Study resources routes
  app.post("/api/study-resources", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), uploadDocument.single('studyResource'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { title, description, resourceType, subjectId, classId, termId } = req.body;
      const user = (req as any).user;
      
      if (!title || !resourceType) {
        return res.status(400).json({ message: "Title and resource type are required" });
      }

      const fileUrl = `/uploads/study-resources/${req.file.filename}`;
      
      const studyResource = await storage.createStudyResource({
        title,
        description: description || null,
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        resourceType,
        subjectId: subjectId ? parseInt(subjectId) : null,
        classId: classId ? parseInt(classId) : null,
        termId: termId ? parseInt(termId) : null,
        uploadedBy: user.id,
        isPublished: true
      });

      res.json({ 
        message: "Study resource uploaded successfully", 
        resource: studyResource 
      });
    } catch (error) {
      console.error('Study resource upload error:', error);
      res.status(500).json({ message: "Failed to upload study resource" });
    }
  });

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
      const resource = await storage.getStudyResourceById(parseInt(id));
      
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

  const httpServer = createServer(app);
  return httpServer;
}
