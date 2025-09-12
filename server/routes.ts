import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema, insertExamSchema, insertExamResultSchema, insertExamQuestionSchema, insertQuestionOptionSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

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

// Rate limiting for login attempts (simple in-memory store)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const BCRYPT_ROUNDS = 12;

// Secure JWT authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Extract JWT token from Bearer header
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    // Verify JWT token
    let decoded: any;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    
    // Validate user still exists in database
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
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

// Ensure upload directories exist
fs.mkdir(uploadDir, { recursive: true }).catch(() => {});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {});
fs.mkdir(profileDir, { recursive: true }).catch(() => {});

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || 'general';
    let dir = uploadDir;
    
    if (uploadType === 'gallery') {
      dir = galleryDir;
    } else if (uploadType === 'profile') {
      dir = profileDir;
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Static file serving for uploads
  app.use('/uploads', express.static(path.resolve('uploads')));
  
  // Setup/Demo data route (for development)
  app.post("/api/setup-demo", async (req, res) => {
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
      
      // Generate JWT token with user claims
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1000),
      };
      
      const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
      
      console.log(`Login successful for ${email}`);
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

  // Public contact form
  app.post("/api/contact", async (req, res) => {
    try {
      const data = contactSchema.parse(req.body);
      
      // In a real app, you'd send an email or save to database
      console.log("Contact form submission:", data);
      
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User management
  app.get("/api/users", async (req, res) => {
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
      
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
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
  app.get("/api/students", async (req, res) => {
    try {
      const { classId } = req.query;
      let students: any[] = [];
      
      if (classId && typeof classId === 'string') {
        students = await storage.getStudentsByClass(parseInt(classId));
      } else {
        // Get all students
        students = await storage.getAllStudents();
      }
      
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Invalid student data" });
    }
  });

  // Class management
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", async (req, res) => {
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

  app.put("/api/classes/:id", async (req, res) => {
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

  app.delete("/api/classes/:id", async (req, res) => {
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
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
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

  app.put("/api/subjects/:id", async (req, res) => {
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

  app.delete("/api/subjects/:id", async (req, res) => {
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
  app.post("/api/attendance", async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.recordAttendance(attendanceData);
      res.json(attendance);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });

  app.get("/api/attendance/:studentId", async (req, res) => {
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

  app.get("/api/attendance/class/:classId", async (req, res) => {
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
  app.post("/api/exams", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
    try {
      const examData = insertExamSchema.omit({ createdBy: true }).parse(req.body);
      const examWithCreator = { ...examData, createdBy: req.user.id };
      const exam = await storage.createExam(examWithCreator);
      res.json(exam);
    } catch (error) {
      res.status(400).json({ message: "Invalid exam data" });
    }
  });

  app.get("/api/exams", async (req, res) => {
    try {
      const exams = await storage.getAllExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/class/:classId", async (req, res) => {
    try {
      const { classId } = req.params;
      const exams = await storage.getExamsByClass(parseInt(classId));
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams for class" });
    }
  });

  app.get("/api/exams/:id", async (req, res) => {
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

  app.put("/api/exams/:id", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
    try {
      const { id } = req.params;
      
      // First get the existing exam to check ownership
      const existingExam = await storage.getExamById(parseInt(id));
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Ownership check: Teachers (roleId 2) can only modify their own exams
      // Admins (roleId 1) can modify any exam
      if (req.user.roleId === 2 && existingExam.createdBy !== req.user.id) {
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

  app.delete("/api/exams/:id", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
    try {
      const { id } = req.params;
      
      // First get the existing exam to check ownership
      const existingExam = await storage.getExamById(parseInt(id));
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Ownership check: Teachers (roleId 2) can only delete their own exams
      // Admins (roleId 1) can delete any exam
      if (req.user.roleId === 2 && existingExam.createdBy !== req.user.id) {
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
  app.post("/api/exam-questions", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
    try {
      const questionData = insertExamQuestionSchema.parse(req.body);
      const question = await storage.createExamQuestion(questionData);
      res.json(question);
    } catch (error) {
      res.status(400).json({ message: "Invalid question data" });
    }
  });

  app.get("/api/exam-questions/:examId", authenticateUser, async (req, res) => {
    try {
      const { examId } = req.params;
      const questions = await storage.getExamQuestions(parseInt(examId));
      
      // Students (roleId 3+) should not see certain sensitive data during active exams
      // For now, return all questions but options will be filtered separately
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });

  app.put("/api/exam-questions/:id", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
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

  app.delete("/api/exam-questions/:id", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
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

  // Question Options routes  
  app.post("/api/question-options", authenticateUser, authorizeRoles(1, 2), async (req, res) => {
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
      const { questionId } = req.params;
      const options = await storage.getQuestionOptions(parseInt(questionId));
      
      // Hide answer keys from students (roleId 3+ are students/parents)
      // Only admin (roleId 1) and teachers (roleId 2) can see correct answers
      const isStudentOrParent = req.user.roleId >= 3;
      
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
      if (req.user.roleId >= 3) {
        return res.status(403).json({ message: "Students cannot submit exam results directly" });
      }
      
      // Set recordedBy to the authenticated user
      const secureResultData = {
        ...resultData,
        recordedBy: req.user.id
      };
      
      const result = await storage.recordExamResult(secureResultData);
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid exam result data" });
    }
  });

  app.get("/api/exam-results/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const results = await storage.getExamResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });

  app.get("/api/exam-results/exam/:examId", async (req, res) => {
    try {
      const { examId } = req.params;
      const results = await storage.getExamResultsByExam(parseInt(examId));
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam results" });
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

  app.post("/api/announcements", async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });

  app.put("/api/announcements/:id", async (req, res) => {
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

  app.delete("/api/announcements/:id", async (req, res) => {
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
  app.post("/api/upload/profile", authenticateUser, upload.single('profileImage'), async (req, res) => {
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

  app.post("/api/upload/gallery", authenticateUser, upload.single('galleryImage'), async (req, res) => {
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
      if (pathParts.length < 3 || !['profiles', 'gallery'].includes(pathParts[2])) {
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

  const httpServer = createServer(app);
  return httpServer;
}
