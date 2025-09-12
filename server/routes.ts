import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.string()
});

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1)
});

// Simple authentication middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const { userId } = req.body;
    const authHeader = req.headers.authorization;
    
    // For demo purposes, allow uploads if userId is provided
    // In production, this would validate JWT tokens or sessions
    if (!userId && !authHeader) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    // Basic validation - ensure user exists
    if (userId) {
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: "Authentication failed" });
  }
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
      console.log('Login attempt with data:', req.body);
      const { email, password, role } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      console.log('User found:', user ? 'Yes' : 'No');
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, you'd verify the password hash here
      // For now, we'll simulate successful login
      
      const userRole = await storage.getRoleByName(role);
      console.log('User role found:', userRole ? userRole.name : 'No');
      if (!userRole || user.roleId !== userRole.id) {
        console.log('Role mismatch - user roleId:', user.roleId, 'expected roleId:', userRole?.id);
        return res.status(401).json({ message: "Invalid role for user" });
      }

      res.json({ 
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
      res.status(400).json({ message: "Invalid request data" });
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
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
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

  // Exam results
  app.get("/api/exam-results/:studentId", async (req, res) => {
    try {
      const { studentId } = req.params;
      const results = await storage.getExamResultsByStudent(studentId);
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
