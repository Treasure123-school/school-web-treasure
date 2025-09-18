import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, bigserial, integer, date, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const genderEnum = pgEnum('gender', ['Male', 'Female', 'Other']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['Present', 'Absent', 'Late', 'Excused']);
export const reportCardStatusEnum = pgEnum('report_card_status', ['draft', 'finalized', 'published']);

// Roles table
export const roles = pgTable("roles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  permissions: text("permissions").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  roleId: integer("role_id").references(() => roles.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Academic terms table
export const academicTerms = pgTable("academic_terms", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  year: varchar("year", { length: 9 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Classes table
export const classes = pgTable("classes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  level: varchar("level", { length: 20 }).notNull(),
  capacity: integer("capacity").default(30),
  classTeacherId: uuid("class_teacher_id").references(() => users.id),
  currentTermId: integer("current_term_id").references(() => academicTerms.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Subjects table
export const subjects = pgTable("subjects", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: uuid("id").references(() => users.id).primaryKey(),
  admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
  classId: integer("class_id").references(() => classes.id),
  parentId: uuid("parent_id").references(() => users.id),
  admissionDate: date("admission_date").defaultNow(),
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  medicalInfo: text("medical_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Attendance table
export const attendance = pgTable("attendance", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status"),
  recordedBy: uuid("recorded_by").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exams table
export const exams = pgTable("exams", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  totalMarks: integer("total_marks").notNull(),
  date: date("date").notNull(),
  termId: integer("term_id").references(() => academicTerms.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  // Enhanced exam delivery fields
  timeLimit: integer("time_limit"), // in minutes
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  instructions: text("instructions"),
  isPublished: boolean("is_published").default(false),
  allowRetakes: boolean("allow_retakes").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exam questions table
export const examQuestions = pgTable("exam_questions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // 'multiple_choice', 'text', 'essay'
  points: integer("points").default(1),
  orderNumber: integer("order_number").notNull(),
  imageUrl: text("image_url"), // for questions with images
  createdAt: timestamp("created_at").defaultNow(),
});

// Question options table (for multiple choice questions)
export const questionOptions = pgTable("question_options", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  questionId: integer("question_id").references(() => examQuestions.id).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  orderNumber: integer("order_number").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student exam sessions table
export const examSessions = pgTable("exam_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeRemaining: integer("time_remaining"), // in seconds
  isCompleted: boolean("is_completed").default(false),
  score: integer("score"),
  maxScore: integer("max_score"),
  status: varchar("status", { length: 20 }).default('in_progress'), // 'in_progress', 'submitted', 'graded'
  createdAt: timestamp("created_at").defaultNow(),
});

// Student answers table
export const studentAnswers = pgTable("student_answers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: integer("session_id").references(() => examSessions.id).notNull(),
  questionId: integer("question_id").references(() => examQuestions.id).notNull(),
  selectedOptionId: integer("selected_option_id").references(() => questionOptions.id), // for multiple choice
  textAnswer: text("text_answer"), // for text/essay questions
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
  answeredAt: timestamp("answered_at").defaultNow(),
});

// Exam results table
export const examResults = pgTable("exam_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score"),
  marksObtained: integer("marks_obtained"), // Legacy field for backward compatibility
  grade: varchar("grade", { length: 5 }),
  remarks: text("remarks"),
  autoScored: boolean("auto_scored").default(false),
  recordedBy: uuid("recorded_by").notNull(), // UUID field to match database schema
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  targetRoles: varchar("target_roles", { length: 20 }).array().default(sql`'{"All"}'::varchar[]`),
  targetClasses: integer("target_classes").array().default(sql`'{}'::integer[]`),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gallery categories table
export const galleryCategories = pgTable("gallery_categories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gallery table
export const gallery = pgTable("gallery", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  categoryId: integer("category_id").references(() => galleryCategories.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Home page content management
export const homePageContent = pgTable("home_page_content", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  contentType: varchar("content_type", { length: 50 }).notNull(), // 'hero_image', 'gallery_preview_1', 'gallery_preview_2', etc.
  imageUrl: text("image_url"),
  altText: text("alt_text"),
  caption: text("caption"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact messages table for permanent storage of contact form submissions
export const contactMessages = pgTable("contact_messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  respondedAt: timestamp("responded_at"),
  respondedBy: uuid("responded_by").references(() => users.id),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Report cards table for consolidated term-based student reports
export const reportCards = pgTable("report_cards", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  termId: integer("term_id").references(() => academicTerms.id).notNull(),
  averagePercentage: integer("average_percentage"), // Overall percentage
  overallGrade: varchar("overall_grade", { length: 5 }), // A+, A, B+, etc.
  teacherRemarks: text("teacher_remarks"),
  status: reportCardStatusEnum("status").default('draft'),
  locked: boolean("locked").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
  finalizedAt: timestamp("finalized_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Report card items table for per-subject breakdown
export const reportCardItems = pgTable("report_card_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  reportCardId: integer("report_card_id").references(() => reportCards.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  totalMarks: integer("total_marks").notNull(),
  obtainedMarks: integer("obtained_marks").notNull(),
  percentage: integer("percentage").notNull(),
  grade: varchar("grade", { length: 5 }), // A+, A, B+, etc.
  teacherRemarks: text("teacher_remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ createdAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true });
export const insertExamResultSchema = createInsertSchema(examResults).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertGalleryCategorySchema = createInsertSchema(galleryCategories).omit({ id: true, createdAt: true });
export const insertGallerySchema = createInsertSchema(gallery).omit({ id: true, createdAt: true });
export const insertHomePageContentSchema = createInsertSchema(homePageContent).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
export const insertReportCardSchema = createInsertSchema(reportCards).omit({ id: true, createdAt: true });
export const insertReportCardItemSchema = createInsertSchema(reportCardItems).omit({ id: true, createdAt: true });

// Shared schema for creating students - prevents drift between frontend and backend
export const createStudentSchema = z.object({
  // User fields  
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: "Gender is required" }),
  profileImageUrl: z.string().optional(),
  // Student-specific fields
  admissionNumber: z.string().min(1, "Admission number is required"),
  classId: z.coerce.number().positive("Please select a valid class"),
  parentId: z.string().uuid("Invalid parent selection").optional().nullable(),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  medicalInfo: z.string().optional(),
});

export type CreateStudentRequest = z.infer<typeof createStudentSchema>;

// New exam delivery schemas
export const insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true, createdAt: true });
export const insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({ id: true, createdAt: true });
// For exam sessions, only require examId from client - studentId is set from authenticated user
export const insertExamSessionSchema = createInsertSchema(examSessions).omit({ 
  id: true, 
  createdAt: true, 
  startedAt: true,
  studentId: true  // Server sets this from authenticated user
}).partial().required({ 
  examId: true
}).extend({
  // Handle date strings from frontend (JSON serialization converts Date objects to strings)
  submittedAt: z.union([z.date(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      return new Date(val);
    }
    return val;
  })
});

// For updating exam sessions - SECURITY: Only allow students to update safe fields
export const updateExamSessionSchema = z.object({
  // Students can only update these specific fields when submitting exams
  isCompleted: z.boolean().optional(),
  submittedAt: z.coerce.date().refine(d => !isNaN(d.getTime()), 'Invalid date').optional(),
  timeRemaining: z.number().int().min(0).optional(),
  // Only allow valid status transitions for student updates
  status: z.enum(['in_progress', 'submitted']).optional()
}).strict(); // .strict() prevents any additional fields from being accepted
export const insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true });

// Types
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Class = typeof classes.$inferSelect;
export type Subject = typeof subjects.$inferSelect;
export type AcademicTerm = typeof academicTerms.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type ExamResult = typeof examResults.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type GalleryCategory = typeof galleryCategories.$inferSelect;
export type Gallery = typeof gallery.$inferSelect;
export type HomePageContent = typeof homePageContent.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type ReportCard = typeof reportCards.$inferSelect;
export type ReportCardItem = typeof reportCardItems.$inferSelect;

// New exam delivery types
export type ExamQuestion = typeof examQuestions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type ExamSession = typeof examSessions.$inferSelect;
export type StudentAnswer = typeof studentAnswers.$inferSelect;

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertGalleryCategory = z.infer<typeof insertGalleryCategorySchema>;
export type InsertGallery = z.infer<typeof insertGallerySchema>;
export type InsertHomePageContent = z.infer<typeof insertHomePageContentSchema>;
export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type InsertReportCard = z.infer<typeof insertReportCardSchema>;
export type InsertReportCardItem = z.infer<typeof insertReportCardItemSchema>;

// New exam delivery insert types
export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;
export type InsertQuestionOption = z.infer<typeof insertQuestionOptionSchema>;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type UpdateExamSession = z.infer<typeof updateExamSessionSchema>;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;
