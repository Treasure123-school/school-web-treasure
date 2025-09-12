import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertStudentSchema, insertAttendanceSchema, insertAnnouncementSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

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

export async function registerRoutes(app: Express): Promise<Server> {
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
          error: dbError.message 
        });
      }
    } catch (error) {
      console.error('Setup demo error:', error);
      res.status(500).json({ message: "Setup failed", error: error.message });
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

  // Subject management
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
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

  const httpServer = createServer(app);
  return httpServer;
}
