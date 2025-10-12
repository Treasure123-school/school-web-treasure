import { Router, Request, Response } from "express";
import { z } from "zod";
import { db } from "./storage";
import { users, students, parentProfiles, roles, settings } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  generateStudentUsernamePreview,
  generateStudentUsername,
  generateParentUsername,
  generateTempPassword,
  hashPassword
} from "./self-registration-utils";

const router = Router();

// Validation schemas
const selfRegisterPreviewSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  classCode: z.string().min(1, "Class code is required"),
  gender: z.enum(['Male', 'Female', 'Other']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  parentEmail: z.string().email("Invalid email format").optional(),
  parentPhone: z.string().min(10, "Phone must be at least 10 digits").optional(),
}).refine(
  (data) => data.parentEmail || data.parentPhone,
  {
    message: "Either parent email or phone is required",
    path: ["parentEmail"],
  }
);

const selfRegisterCommitSchema = selfRegisterPreviewSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

/**
 * POST /api/self-register/student/preview
 * Preview student registration without committing
 */
router.post("/student/preview", async (req: Request, res: Response) => {
  try {
    const data = selfRegisterPreviewSchema.parse(req.body);
    
    // Check if registration is enabled
    const [registrationSetting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'allow_student_self_registration'))
      .limit(1);
    
    if (!registrationSetting || registrationSetting.value !== 'true') {
      return res.status(403).json({
        success: false,
        error: "Student self-registration is currently disabled"
      });
    }
    
    // Generate suggested username
    const suggestedUsername = await generateStudentUsernamePreview(data.classCode);
    
    // Check if parent exists
    let parentExists = false;
    if (data.parentEmail) {
      const [parent] = await db
        .select({ id: users.id })
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(and(
          eq(users.email, data.parentEmail),
          eq(roles.name, 'Parent')
        ))
        .limit(1);
      
      parentExists = !!parent;
    }
    
    // Split full name into first and last name
    const nameParts = data.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    res.json({
      success: true,
      suggestedUsername,
      parentExists,
      firstName,
      lastName,
      errors: []
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error("Preview error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate preview"
    });
  }
});

/**
 * POST /api/self-register/student/commit
 * Complete student registration and create account
 */
router.post("/student/commit", async (req: Request, res: Response) => {
  try {
    const data = selfRegisterCommitSchema.parse(req.body);
    
    // Check if registration is enabled
    const [registrationSetting] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, 'allow_student_self_registration'))
      .limit(1);
    
    if (!registrationSetting || registrationSetting.value !== 'true') {
      return res.status(403).json({
        success: false,
        error: "Student self-registration is currently disabled"
      });
    }
    
    // Get student and parent role IDs
    const [studentRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Student'))
      .limit(1);
    
    const [parentRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, 'Parent'))
      .limit(1);
    
    if (!studentRole || !parentRole) {
      return res.status(500).json({
        success: false,
        error: "Required roles not found in system"
      });
    }
    
    // Split full name
    const nameParts = data.fullName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    // Hash student password
    const passwordHash = await hashPassword(data.password);
    
    let parentUserId: string;
    let parentUsername = '';
    let parentTempPassword = '';
    let parentCreated = false;
    
    // Check if parent exists
    if (data.parentEmail) {
      const [existingParent] = await db
        .select()
        .from(users)
        .innerJoin(roles, eq(users.roleId, roles.id))
        .where(and(
          eq(users.email, data.parentEmail),
          eq(roles.name, 'Parent')
        ))
        .limit(1);
      
      if (existingParent) {
        parentUserId = existingParent.users.id;
        parentUsername = existingParent.users.username || '';
      } else {
        // Create new parent
        parentUsername = generateParentUsername();
        parentTempPassword = generateTempPassword();
        const parentPasswordHash = await hashPassword(parentTempPassword);
        
        const [newParent] = await db.insert(users).values({
          username: parentUsername,
          email: data.parentEmail || '',
          phone: data.parentPhone || null,
          passwordHash: parentPasswordHash,
          roleId: parentRole.id,
          firstName: 'Parent of',
          lastName: firstName,
          mustChangePassword: true,
          status: 'active',
          createdVia: 'self',
        }).returning();
        
        parentUserId = newParent.id;
        parentCreated = true;
        
        // Create parent profile
        await db.insert(parentProfiles).values({
          userId: parentUserId,
          contactPreference: data.parentEmail ? 'email' : 'phone',
          linkedStudents: [],
        });
      }
    } else {
      // Create parent with phone only
      parentUsername = generateParentUsername();
      parentTempPassword = generateTempPassword();
      const parentPasswordHash = await hashPassword(parentTempPassword);
      
      const [newParent] = await db.insert(users).values({
        username: parentUsername,
        email: `${parentUsername.toLowerCase()}@temp.ths.edu`, // Temporary email
        phone: data.parentPhone || null,
        passwordHash: parentPasswordHash,
        roleId: parentRole.id,
        firstName: 'Parent of',
        lastName: firstName,
        mustChangePassword: true,
        status: 'active',
        createdVia: 'self',
      }).returning();
      
      parentUserId = newParent.id;
      parentCreated = true;
      
      // Create parent profile
      await db.insert(parentProfiles).values({
        userId: parentUserId,
        contactPreference: 'phone',
        linkedStudents: [],
      });
    }
    
    // Generate student username
    const studentUsername = await generateStudentUsername(data.classCode);
    
    // Create student user
    const [newStudent] = await db.insert(users).values({
      username: studentUsername,
      email: `${studentUsername.toLowerCase()}@student.ths.edu`,
      passwordHash,
      roleId: studentRole.id,
      firstName,
      lastName,
      dateOfBirth: data.dob,
      gender: data.gender,
      mustChangePassword: false, // Student chose their password
      status: 'active',
      createdVia: 'self',
    }).returning();
    
    // Create student profile
    await db.insert(students).values({
      id: newStudent.id,
      admissionNumber: studentUsername,
      parentId: parentUserId,
      admissionDate: new Date().toISOString().split('T')[0],
      guardianName: data.fullName,
    });
    
    // Update parent's linked students
    await db.execute(sql`
      UPDATE parent_profiles 
      SET linked_students = array_append(COALESCE(linked_students, ARRAY[]::uuid[]), ${newStudent.id}::uuid)
      WHERE user_id = ${parentUserId}::uuid
    `);
    
    // TODO: Send email/SMS notification to parent
    console.log(`📧 Email notification needed for parent: ${data.parentEmail || data.parentPhone}`);
    if (parentCreated) {
      console.log(`   Parent credentials: ${parentUsername} / ${parentTempPassword}`);
    }
    
    res.json({
      success: true,
      studentUsername,
      parentCreated,
      parentUsername: parentCreated ? parentUsername : null,
      parentPasswordShownOnce: parentCreated ? parentTempPassword : null,
      message: parentCreated 
        ? "Account created successfully. Parent credentials shown once - please save them."
        : "Account created successfully. Student linked to existing parent account."
    });
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
      });
    }
    
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      error: "Registration failed. Please try again."
    });
  }
});

/**
 * GET /api/self-register/status/:username
 * Check registration status
 */
router.get("/status/:username", async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    
    const [user] = await db
      .select({
        username: users.username,
        status: users.status,
        isActive: users.isActive,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      });
    }
    
    res.json({
      success: true,
      username: user.username,
      status: user.status,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    });
    
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to check status"
    });
  }
});

export default router;
