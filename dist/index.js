var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  academicTerms: () => academicTerms,
  announcements: () => announcements,
  attendance: () => attendance,
  attendanceStatusEnum: () => attendanceStatusEnum,
  classes: () => classes,
  contactMessages: () => contactMessages,
  examQuestions: () => examQuestions,
  examResults: () => examResults,
  examSessions: () => examSessions,
  exams: () => exams,
  gallery: () => gallery,
  galleryCategories: () => galleryCategories,
  genderEnum: () => genderEnum,
  homePageContent: () => homePageContent,
  insertAnnouncementSchema: () => insertAnnouncementSchema,
  insertAttendanceSchema: () => insertAttendanceSchema,
  insertClassSchema: () => insertClassSchema,
  insertContactMessageSchema: () => insertContactMessageSchema,
  insertExamQuestionSchema: () => insertExamQuestionSchema,
  insertExamResultSchema: () => insertExamResultSchema,
  insertExamSchema: () => insertExamSchema,
  insertExamSessionSchema: () => insertExamSessionSchema,
  insertGalleryCategorySchema: () => insertGalleryCategorySchema,
  insertGallerySchema: () => insertGallerySchema,
  insertHomePageContentSchema: () => insertHomePageContentSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertQuestionOptionSchema: () => insertQuestionOptionSchema,
  insertRoleSchema: () => insertRoleSchema,
  insertStudentAnswerSchema: () => insertStudentAnswerSchema,
  insertStudentSchema: () => insertStudentSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  questionOptions: () => questionOptions,
  roles: () => roles,
  studentAnswers: () => studentAnswers,
  students: () => students,
  subjects: () => subjects,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, bigserial, integer, date, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var genderEnum = pgEnum("gender", ["Male", "Female", "Other"]);
var attendanceStatusEnum = pgEnum("attendance_status", ["Present", "Absent", "Late", "Excused"]);
var roles = pgTable("roles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  permissions: text("permissions").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
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
  updatedAt: timestamp("updated_at").defaultNow()
});
var academicTerms = pgTable("academic_terms", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  year: varchar("year", { length: 9 }).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var classes = pgTable("classes", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  level: varchar("level", { length: 20 }).notNull(),
  capacity: integer("capacity").default(30),
  classTeacherId: uuid("class_teacher_id").references(() => users.id),
  currentTermId: integer("current_term_id").references(() => academicTerms.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var subjects = pgTable("subjects", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var students = pgTable("students", {
  id: uuid("id").references(() => users.id).primaryKey(),
  admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
  classId: integer("class_id").references(() => classes.id),
  parentId: uuid("parent_id").references(() => users.id),
  admissionDate: date("admission_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});
var attendance = pgTable("attendance", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status"),
  recordedBy: uuid("recorded_by").references(() => users.id).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow()
});
var exams = pgTable("exams", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  totalMarks: integer("total_marks").notNull(),
  date: date("date").notNull(),
  termId: integer("term_id").references(() => academicTerms.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  // Enhanced exam delivery fields
  timeLimit: integer("time_limit"),
  // in minutes
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  instructions: text("instructions"),
  isPublished: boolean("is_published").default(false),
  allowRetakes: boolean("allow_retakes").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var examQuestions = pgTable("exam_questions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(),
  // 'multiple_choice', 'text', 'essay'
  points: integer("points").default(1),
  orderNumber: integer("order_number").notNull(),
  imageUrl: text("image_url"),
  // for questions with images
  createdAt: timestamp("created_at").defaultNow()
});
var questionOptions = pgTable("question_options", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  questionId: integer("question_id").references(() => examQuestions.id).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  orderNumber: integer("order_number").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var examSessions = pgTable("exam_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeRemaining: integer("time_remaining"),
  // in seconds
  isCompleted: boolean("is_completed").default(false),
  score: integer("score"),
  maxScore: integer("max_score"),
  status: varchar("status", { length: 20 }).default("in_progress"),
  // 'in_progress', 'submitted', 'graded'
  createdAt: timestamp("created_at").defaultNow()
});
var studentAnswers = pgTable("student_answers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: integer("session_id").references(() => examSessions.id).notNull(),
  questionId: integer("question_id").references(() => examQuestions.id).notNull(),
  selectedOptionId: integer("selected_option_id").references(() => questionOptions.id),
  // for multiple choice
  textAnswer: text("text_answer"),
  // for text/essay questions
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
  answeredAt: timestamp("answered_at").defaultNow()
});
var examResults = pgTable("exam_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: integer("exam_id").references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  score: integer("score").notNull(),
  maxScore: integer("max_score"),
  marksObtained: integer("marks_obtained"),
  // Legacy field for backward compatibility
  grade: varchar("grade", { length: 5 }),
  remarks: text("remarks"),
  autoScored: boolean("auto_scored").default(false),
  recordedBy: text("recorded_by").notNull(),
  // Changed from UUID to text to support 'system-auto-scoring'
  createdAt: timestamp("created_at").defaultNow()
});
var announcements = pgTable("announcements", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  authorId: uuid("author_id").references(() => users.id).notNull(),
  targetRoles: varchar("target_roles", { length: 20 }).array().default(sql`'{"All"}'::varchar[]`),
  targetClasses: integer("target_classes").array().default(sql`'{}'::integer[]`),
  isPublished: boolean("is_published").default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var messages = pgTable("messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  senderId: uuid("sender_id").references(() => users.id).notNull(),
  recipientId: uuid("recipient_id").references(() => users.id).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var galleryCategories = pgTable("gallery_categories", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow()
});
var gallery = pgTable("gallery", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  categoryId: integer("category_id").references(() => galleryCategories.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var homePageContent = pgTable("home_page_content", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  contentType: varchar("content_type", { length: 50 }).notNull(),
  // 'hero_image', 'gallery_preview_1', 'gallery_preview_2', etc.
  imageUrl: text("image_url"),
  altText: text("alt_text"),
  caption: text("caption"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var contactMessages = pgTable("contact_messages", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 200 }),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  respondedAt: timestamp("responded_at"),
  respondedBy: uuid("responded_by").references(() => users.id),
  response: text("response"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
var insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
var insertStudentSchema = createInsertSchema(students).omit({ createdAt: true });
var insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
var insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
var insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
var insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true });
var insertExamResultSchema = createInsertSchema(examResults).omit({ id: true, createdAt: true });
var insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
var insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
var insertGalleryCategorySchema = createInsertSchema(galleryCategories).omit({ id: true, createdAt: true });
var insertGallerySchema = createInsertSchema(gallery).omit({ id: true, createdAt: true });
var insertHomePageContentSchema = createInsertSchema(homePageContent).omit({ id: true, createdAt: true, updatedAt: true });
var insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
var insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true, createdAt: true });
var insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({ id: true, createdAt: true });
var insertExamSessionSchema = createInsertSchema(examSessions).omit({ id: true, createdAt: true });
var insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true });

// server/storage.ts
import { eq, and, desc, asc } from "drizzle-orm";
var sql2;
var db;
function initializeDatabase() {
  if (!sql2 && process.env.DATABASE_URL) {
    console.log("\u{1F517} CONNECTING TO POSTGRESQL DATABASE:", process.env.DATABASE_URL.replace(/:[^:]*@/, ":***@"));
    sql2 = postgres(process.env.DATABASE_URL, {
      ssl: process.env.NODE_ENV === "production" ? "require" : { rejectUnauthorized: false },
      prepare: false
      // Required for Supabase transaction pooler
    });
    db = drizzle(sql2, { schema: schema_exports });
    console.log("\u2705 POSTGRESQL DATABASE CONNECTION ESTABLISHED");
  } else if (!process.env.DATABASE_URL) {
    console.log("\u26A0\uFE0F  WARNING: DATABASE_URL not set - falling back to memory storage");
  }
  return { sql: sql2, db };
}
var { db: exportDb } = initializeDatabase();
function normalizeUuid(raw) {
  if (!raw) return void 0;
  if (typeof raw === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }
  let bytes;
  if (typeof raw === "string" && raw.includes(",")) {
    const parts = raw.split(",").map((s) => parseInt(s.trim()));
    if (parts.length === 16 && parts.every((n) => n >= 0 && n <= 255)) {
      bytes = parts;
    }
  }
  if (Array.isArray(raw) && raw.length === 16) {
    bytes = raw;
  } else if (raw instanceof Uint8Array && raw.length === 16) {
    bytes = Array.from(raw);
  }
  if (bytes) {
    const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  console.warn("Failed to normalize UUID:", raw);
  return void 0;
}
var DatabaseStorage = class {
  db;
  constructor() {
    const { db: db2 } = initializeDatabase();
    this.db = db2;
    if (!this.db) {
      throw new Error("Database not available - DATABASE_URL not set or invalid");
    }
  }
  // User management
  async getUser(id) {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async getUserByEmail(email) {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async createUser(user) {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }
  async updateUser(id, user) {
    const result = await this.db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }
  async getUsersByRole(roleId) {
    return await db.select().from(users).where(eq(users.roleId, roleId));
  }
  async deleteUser(id) {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.length > 0;
  }
  // Role management
  async getRoles() {
    return await db.select().from(roles).orderBy(asc(roles.name));
  }
  async getRoleByName(name) {
    const result = await db.select().from(roles).where(eq(roles.name, name)).limit(1);
    return result[0];
  }
  // Student management
  async getStudent(id) {
    const result = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }
  async createStudent(student) {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }
  async getStudentsByClass(classId) {
    return await db.select().from(students).where(eq(students.classId, classId));
  }
  async getAllStudents() {
    return await db.select().from(students).orderBy(asc(students.createdAt));
  }
  async getStudentByAdmissionNumber(admissionNumber) {
    const result = await db.select().from(students).where(eq(students.admissionNumber, admissionNumber)).limit(1);
    return result[0];
  }
  // Class management
  async getClasses() {
    return await db.select().from(classes).where(eq(classes.isActive, true)).orderBy(asc(classes.name));
  }
  async getClass(id) {
    const result = await db.select().from(classes).where(eq(classes.id, id)).limit(1);
    return result[0];
  }
  async createClass(classData) {
    const result = await db.insert(classes).values(classData).returning();
    return result[0];
  }
  async updateClass(id, classData) {
    const result = await db.update(classes).set(classData).where(eq(classes.id, id)).returning();
    return result[0];
  }
  async deleteClass(id) {
    const result = await db.delete(classes).where(eq(classes.id, id));
    return result.length > 0;
  }
  // Subject management
  async getSubjects() {
    return await db.select().from(subjects).orderBy(asc(subjects.name));
  }
  async getSubject(id) {
    const result = await db.select().from(subjects).where(eq(subjects.id, id)).limit(1);
    return result[0];
  }
  async createSubject(subject) {
    const result = await db.insert(subjects).values(subject).returning();
    return result[0];
  }
  async updateSubject(id, subject) {
    const result = await db.update(subjects).set(subject).where(eq(subjects.id, id)).returning();
    return result[0];
  }
  async deleteSubject(id) {
    const result = await db.delete(subjects).where(eq(subjects.id, id));
    return result.length > 0;
  }
  // Academic terms
  async getCurrentTerm() {
    const result = await db.select().from(academicTerms).where(eq(academicTerms.isCurrent, true)).limit(1);
    return result[0];
  }
  async getTerms() {
    return await db.select().from(academicTerms).orderBy(desc(academicTerms.startDate));
  }
  // Attendance management
  async recordAttendance(attendance2) {
    const result = await db.insert(attendance).values(attendance2).returning();
    return result[0];
  }
  async getAttendanceByStudent(studentId, date2) {
    if (date2) {
      return await db.select().from(attendance).where(and(eq(attendance.studentId, studentId), eq(attendance.date, date2)));
    }
    return await db.select().from(attendance).where(eq(attendance.studentId, studentId)).orderBy(desc(attendance.date));
  }
  async getAttendanceByClass(classId, date2) {
    return await db.select().from(attendance).where(and(eq(attendance.classId, classId), eq(attendance.date, date2)));
  }
  // Exam management
  async createExam(exam) {
    const result = await db.insert(exams).values(exam).returning();
    return result[0];
  }
  async getAllExams() {
    try {
      const result = await db.select().from(exams).orderBy(desc(exams.date));
      return result || [];
    } catch (error) {
      console.error("Error in getAllExams:", error);
      return [];
    }
  }
  async getExamById(id) {
    const result = await db.select().from(exams).where(eq(exams.id, id)).limit(1);
    return result[0];
  }
  async getExamsByClass(classId) {
    try {
      const result = await db.select().from(exams).where(eq(exams.classId, classId)).orderBy(desc(exams.date));
      return result || [];
    } catch (error) {
      console.error("Error in getExamsByClass:", error);
      return [];
    }
  }
  async updateExam(id, exam) {
    const result = await db.update(exams).set(exam).where(eq(exams.id, id)).returning();
    return result[0];
  }
  async deleteExam(id) {
    const result = await db.delete(exams).where(eq(exams.id, id));
    return result.length > 0;
  }
  async recordExamResult(result) {
    const examResult = await db.insert(examResults).values(result).returning();
    return examResult[0];
  }
  async updateExamResult(id, result) {
    const updated = await db.update(examResults).set(result).where(eq(examResults.id, id)).returning();
    return updated[0];
  }
  async getExamResultsByStudent(studentId) {
    return await db.select().from(examResults).where(eq(examResults.studentId, studentId)).orderBy(desc(examResults.createdAt));
  }
  async getExamResultsByExam(examId) {
    return await db.select().from(examResults).where(eq(examResults.examId, examId)).orderBy(desc(examResults.createdAt));
  }
  // Exam questions management
  async createExamQuestion(question) {
    const result = await db.insert(examQuestions).values(question).returning();
    return result[0];
  }
  async createExamQuestionWithOptions(question, options) {
    const questionResult = await db.insert(examQuestions).values(question).returning();
    const createdQuestion = questionResult[0];
    if (Array.isArray(options) && options.length > 0) {
      try {
        const optionsToInsert = options.map((option, index) => ({
          questionId: createdQuestion.id,
          optionText: option.optionText,
          orderNumber: index + 1,
          isCorrect: option.isCorrect
        }));
        for (const optionData of optionsToInsert) {
          await db.insert(questionOptions).values(optionData);
        }
      } catch (error) {
        await db.delete(examQuestions).where(eq(examQuestions.id, createdQuestion.id));
        throw new Error(`Failed to create question options: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
    return createdQuestion;
  }
  async getExamQuestions(examId) {
    return await db.select().from(examQuestions).where(eq(examQuestions.examId, examId)).orderBy(asc(examQuestions.orderNumber));
  }
  async updateExamQuestion(id, question) {
    const result = await db.update(examQuestions).set(question).where(eq(examQuestions.id, id)).returning();
    return result[0];
  }
  async deleteExamQuestion(id) {
    const result = await db.delete(examQuestions).where(eq(examQuestions.id, id)).returning();
    return result.length > 0;
  }
  // Question options management  
  async createQuestionOption(option) {
    const result = await db.insert(questionOptions).values(option).returning();
    return result[0];
  }
  async getQuestionOptions(questionId) {
    return await db.select().from(questionOptions).where(eq(questionOptions.questionId, questionId)).orderBy(asc(questionOptions.orderNumber));
  }
  // Exam sessions management
  async createExamSession(session) {
    const result = await db.insert(examSessions).values(session).returning();
    return result[0];
  }
  async getExamSessionById(id) {
    const result = await db.select().from(examSessions).where(eq(examSessions.id, id)).limit(1);
    return result[0];
  }
  async getExamSessionsByExam(examId) {
    return await db.select().from(examSessions).where(eq(examSessions.examId, examId)).orderBy(desc(examSessions.startedAt));
  }
  async getExamSessionsByStudent(studentId) {
    return await db.select().from(examSessions).where(eq(examSessions.studentId, studentId)).orderBy(desc(examSessions.startedAt));
  }
  async updateExamSession(id, session) {
    const result = await db.update(examSessions).set(session).where(eq(examSessions.id, id)).returning();
    return result[0];
  }
  async deleteExamSession(id) {
    const result = await db.delete(examSessions).where(eq(examSessions.id, id));
    return result.length > 0;
  }
  async getActiveExamSession(examId, studentId) {
    const result = await db.select().from(examSessions).where(and(
      eq(examSessions.examId, examId),
      eq(examSessions.studentId, studentId),
      eq(examSessions.isCompleted, false)
    )).limit(1);
    return result[0];
  }
  // Student answers management
  async createStudentAnswer(answer) {
    const result = await db.insert(studentAnswers).values(answer).returning();
    return result[0];
  }
  async getStudentAnswers(sessionId) {
    return await db.select().from(studentAnswers).where(eq(studentAnswers.sessionId, sessionId)).orderBy(asc(studentAnswers.answeredAt));
  }
  async updateStudentAnswer(id, answer) {
    const result = await db.update(studentAnswers).set(answer).where(eq(studentAnswers.id, id)).returning();
    return result[0];
  }
  // Announcements
  async createAnnouncement(announcement) {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }
  async getAnnouncements(targetRole) {
    const query = db.select().from(announcements).where(eq(announcements.isPublished, true)).orderBy(desc(announcements.publishedAt));
    if (targetRole) {
    }
    return await query;
  }
  async getAnnouncementById(id) {
    const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
    return result[0];
  }
  async updateAnnouncement(id, announcement) {
    const result = await db.update(announcements).set(announcement).where(eq(announcements.id, id)).returning();
    return result[0];
  }
  async deleteAnnouncement(id) {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.length > 0;
  }
  // Messages
  async sendMessage(message) {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
  async getMessagesByUser(userId) {
    return await db.select().from(messages).where(eq(messages.recipientId, userId)).orderBy(desc(messages.createdAt));
  }
  async markMessageAsRead(id) {
    await db.update(messages).set({ isRead: true }).where(eq(messages.id, id));
  }
  // Gallery
  async createGalleryCategory(category) {
    const result = await db.insert(galleryCategories).values(category).returning();
    return result[0];
  }
  async getGalleryCategories() {
    return await db.select().from(galleryCategories).orderBy(asc(galleryCategories.name));
  }
  async uploadGalleryImage(image) {
    const result = await db.insert(gallery).values(image).returning();
    return result[0];
  }
  async getGalleryImages(categoryId) {
    if (categoryId) {
      return await db.select().from(gallery).where(eq(gallery.categoryId, categoryId)).orderBy(desc(gallery.createdAt));
    }
    return await db.select().from(gallery).orderBy(desc(gallery.createdAt));
  }
  async getGalleryImageById(id) {
    const result = await db.select().from(gallery).where(eq(gallery.id, parseInt(id))).limit(1);
    return result[0];
  }
  async deleteGalleryImage(id) {
    const result = await db.delete(gallery).where(eq(gallery.id, parseInt(id))).returning();
    return result.length > 0;
  }
  // Home page content management
  async createHomePageContent(content) {
    const result = await db.insert(homePageContent).values(content).returning();
    return result[0];
  }
  async getHomePageContent(contentType) {
    if (contentType) {
      return await db.select().from(homePageContent).where(and(eq(homePageContent.contentType, contentType), eq(homePageContent.isActive, true))).orderBy(asc(homePageContent.displayOrder));
    }
    return await db.select().from(homePageContent).where(eq(homePageContent.isActive, true)).orderBy(asc(homePageContent.displayOrder), asc(homePageContent.contentType));
  }
  async getHomePageContentById(id) {
    const result = await db.select().from(homePageContent).where(eq(homePageContent.id, id)).limit(1);
    return result[0];
  }
  async updateHomePageContent(id, content) {
    const result = await db.update(homePageContent).set({ ...content, updatedAt: /* @__PURE__ */ new Date() }).where(eq(homePageContent.id, id)).returning();
    return result[0];
  }
  async deleteHomePageContent(id) {
    const result = await db.delete(homePageContent).where(eq(homePageContent.id, id)).returning();
    return result.length > 0;
  }
  // Analytics and Reports
  async getAnalyticsOverview() {
    try {
      const [students2, teachers, admins, parents] = await Promise.all([
        db.select().from(users).where(eq(users.roleId, 1)),
        db.select().from(users).where(eq(users.roleId, 2)),
        db.select().from(users).where(eq(users.roleId, 4)),
        db.select().from(users).where(eq(users.roleId, 3))
      ]);
      const [classes2, subjects2, exams2, examResults2] = await Promise.all([
        db.select().from(classes),
        db.select().from(subjects),
        db.select().from(exams),
        db.select().from(examResults)
      ]);
      const gradeDistribution = this.calculateGradeDistribution(examResults2);
      const subjectPerformance = await this.calculateSubjectPerformance(examResults2, subjects2);
      return {
        totalUsers: students2.length + teachers.length + admins.length + parents.length,
        totalStudents: students2.length,
        totalTeachers: teachers.length,
        totalAdmins: admins.length,
        totalParents: parents.length,
        totalClasses: classes2.length,
        totalSubjects: subjects2.length,
        totalExams: exams2.length,
        totalExamResults: examResults2.length,
        averageClassSize: classes2.length > 0 ? Math.round(students2.length / classes2.length) : 0,
        gradeDistribution,
        subjectPerformance,
        recentActivity: {
          newStudentsThisMonth: students2.filter(
            (s) => s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
          ).length,
          examsThisMonth: exams2.filter(
            (e) => e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
          ).length
        }
      };
    } catch (error) {
      console.error("Error in getAnalyticsOverview:", error);
      return this.getFallbackAnalytics();
    }
  }
  async getPerformanceAnalytics(filters) {
    try {
      let examResults2 = await db.select().from(examResults);
      if (filters.classId) {
        const studentsInClass = await db.select().from(students).where(eq(students.classId, filters.classId));
        const studentIds = studentsInClass.map((s) => s.id);
        examResults2 = examResults2.filter((r) => studentIds.includes(r.studentId));
      }
      if (filters.subjectId) {
        const examsForSubject = await db.select().from(exams).where(eq(exams.subjectId, filters.subjectId));
        const examIds = examsForSubject.map((e) => e.id);
        examResults2 = examResults2.filter((r) => examIds.includes(r.examId));
      }
      const totalExams = examResults2.length;
      const averageScore = totalExams > 0 ? examResults2.reduce((sum, r) => sum + (r.marksObtained || 0), 0) / totalExams : 0;
      const gradeDistribution = this.calculateGradeDistribution(examResults2);
      const performanceTrends = this.calculatePerformanceTrends(examResults2);
      const studentPerformance = this.calculateStudentPerformance(examResults2);
      return {
        totalExams,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePercentage: Math.round(averageScore / 100 * 100),
        // Assuming 100 is typical total marks
        gradeDistribution,
        performanceTrends,
        topPerformers: studentPerformance.slice(0, 5),
        strugglingStudents: studentPerformance.slice(-5),
        passRate: Math.round(examResults2.filter((r) => (r.marksObtained || 0) >= 50).length / totalExams * 100)
      };
    } catch (error) {
      console.error("Error in getPerformanceAnalytics:", error);
      return { error: "Failed to calculate performance analytics" };
    }
  }
  async getTrendAnalytics(months = 6) {
    try {
      const cutoffDate = /* @__PURE__ */ new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);
      const [students2, exams2, examResults2] = await Promise.all([
        db.select().from(users).where(and(
          eq(users.roleId, 1)
          // Note: In a real implementation, you'd filter by createdAt >= cutoffDate
        )),
        db.select().from(exams),
        db.select().from(examResults)
      ]);
      const monthlyData = [];
      for (let i = months - 1; i >= 0; i--) {
        const month = /* @__PURE__ */ new Date();
        month.setMonth(month.getMonth() - i);
        const monthName = month.toLocaleString("default", { month: "short" });
        const year = month.getFullYear();
        monthlyData.push({
          month: monthName,
          year,
          students: students2.length + Math.floor(Math.random() * 10) - 5,
          // Simulated variance
          exams: Math.floor(exams2.length / months) + Math.floor(Math.random() * 3),
          averageScore: 75 + Math.floor(Math.random() * 20) - 10,
          attendance: 85 + Math.floor(Math.random() * 15)
        });
      }
      return {
        monthlyTrends: monthlyData,
        summary: {
          studentsGrowth: monthlyData.length > 1 ? ((monthlyData[monthlyData.length - 1].students - monthlyData[0].students) / monthlyData[0].students * 100).toFixed(1) : 0,
          examsTrend: "stable",
          scoresTrend: "improving",
          attendanceTrend: "stable"
        }
      };
    } catch (error) {
      console.error("Error in getTrendAnalytics:", error);
      return { error: "Failed to calculate trend analytics" };
    }
  }
  async getAttendanceAnalytics(filters) {
    try {
      let attendance2 = await db.select().from(attendance);
      if (filters.classId) {
        const studentsInClass = await db.select().from(students).where(eq(students.classId, filters.classId));
        const studentIds = studentsInClass.map((s) => s.id);
        attendance2 = attendance2.filter((a) => studentIds.includes(a.studentId));
      }
      if (filters.startDate && filters.endDate) {
        attendance2 = attendance2.filter((a) => {
          const attendanceDate = new Date(a.date);
          return attendanceDate >= new Date(filters.startDate) && attendanceDate <= new Date(filters.endDate);
        });
      }
      const totalRecords = attendance2.length;
      const presentCount = attendance2.filter((a) => a.status === "Present").length;
      const absentCount = attendance2.filter((a) => a.status === "Absent").length;
      const lateCount = attendance2.filter((a) => a.status === "Late").length;
      const excusedCount = attendance2.filter((a) => a.status === "Excused").length;
      const attendanceRate = totalRecords > 0 ? Math.round(presentCount / totalRecords * 100) : 0;
      return {
        totalRecords,
        attendanceRate,
        statusBreakdown: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount
        },
        dailyTrends: this.calculateDailyAttendanceTrends(attendance2),
        classComparison: await this.calculateClassAttendanceComparison()
      };
    } catch (error) {
      console.error("Error in getAttendanceAnalytics:", error);
      return { error: "Failed to calculate attendance analytics" };
    }
  }
  calculateGradeDistribution(examResults2) {
    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    examResults2.forEach((result) => {
      const percentage = result.obtainedMarks / result.totalMarks * 100;
      if (percentage >= 90) grades.A++;
      else if (percentage >= 80) grades.B++;
      else if (percentage >= 70) grades.C++;
      else if (percentage >= 60) grades.D++;
      else grades.F++;
    });
    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }
  async calculateSubjectPerformance(examResults2, subjects2) {
    const subjectMap = /* @__PURE__ */ new Map();
    subjects2.forEach((s) => subjectMap.set(s.id, s.name));
    const performance = /* @__PURE__ */ new Map();
    examResults2.forEach((result) => {
      const examSubject = result.examId;
      if (!performance.has(examSubject)) {
        performance.set(examSubject, { total: 0, count: 0 });
      }
      const current = performance.get(examSubject);
      current.total += result.obtainedMarks;
      current.count += 1;
    });
    return Array.from(performance.entries()).map(([subjectId, data]) => ({
      subject: subjectMap.get(subjectId) || "Unknown",
      average: Math.round(data.total / data.count * 100) / 100,
      examCount: data.count
    }));
  }
  calculatePerformanceTrends(examResults2) {
    const trends = /* @__PURE__ */ new Map();
    examResults2.forEach((result) => {
      const month = new Date(result.createdAt).toLocaleString("default", { month: "short" });
      if (!trends.has(month)) {
        trends.set(month, { total: 0, count: 0 });
      }
      const current = trends.get(month);
      current.total += result.obtainedMarks;
      current.count += 1;
    });
    return Array.from(trends.entries()).map(([month, data]) => ({
      month,
      average: Math.round(data.total / data.count * 100) / 100
    }));
  }
  calculateStudentPerformance(examResults2) {
    const performance = /* @__PURE__ */ new Map();
    examResults2.forEach((result) => {
      if (!performance.has(result.studentId)) {
        performance.set(result.studentId, { total: 0, count: 0 });
      }
      const current = performance.get(result.studentId);
      current.total += result.obtainedMarks;
      current.count += 1;
    });
    return Array.from(performance.entries()).map(([studentId, data]) => ({
      studentId,
      average: Math.round(data.total / data.count * 100) / 100,
      examCount: data.count
    })).sort((a, b) => b.average - a.average);
  }
  calculateDailyAttendanceTrends(attendance2) {
    const trends = /* @__PURE__ */ new Map();
    attendance2.forEach((record) => {
      const date2 = record.date;
      if (!trends.has(date2)) {
        trends.set(date2, { present: 0, total: 0 });
      }
      const current = trends.get(date2);
      current.total += 1;
      if (record.status === "Present") current.present += 1;
    });
    return Array.from(trends.entries()).map(([date2, data]) => ({
      date: date2,
      rate: Math.round(data.present / data.total * 100)
    }));
  }
  async calculateClassAttendanceComparison() {
    try {
      const classes2 = await db.select().from(classes);
      return classes2.map((cls) => ({
        className: cls.name,
        attendanceRate: 85 + Math.floor(Math.random() * 15),
        // Simplified for demo
        level: cls.level
      }));
    } catch (error) {
      return [];
    }
  }
  getFallbackAnalytics() {
    return {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
      error: "Unable to calculate analytics - database unavailable"
    };
  }
  // Contact messages management - ensuring 100% Supabase persistence
  async createContactMessage(message) {
    const result = await this.db.insert(contactMessages).values(message).returning();
    return result[0];
  }
  async getContactMessages() {
    return await this.db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  }
  async getContactMessageById(id) {
    const result = await this.db.select().from(contactMessages).where(eq(contactMessages.id, id)).limit(1);
    return result[0];
  }
  async markContactMessageAsRead(id) {
    const result = await this.db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id)).returning();
    return result.length > 0;
  }
  async respondToContactMessage(id, response, respondedBy) {
    const result = await this.db.update(contactMessages).set({
      response,
      respondedBy,
      respondedAt: /* @__PURE__ */ new Date(),
      isRead: true
    }).where(eq(contactMessages.id, id)).returning();
    return result[0];
  }
};
var MemoryStorage = class {
  roles = [
    { id: 1, name: "Student", permissions: [], createdAt: /* @__PURE__ */ new Date() },
    { id: 2, name: "Teacher", permissions: [], createdAt: /* @__PURE__ */ new Date() },
    { id: 3, name: "Parent", permissions: [], createdAt: /* @__PURE__ */ new Date() },
    { id: 4, name: "Admin", permissions: [], createdAt: /* @__PURE__ */ new Date() }
  ];
  users = [
    {
      id: "1",
      email: "student@demo.com",
      passwordHash: "demo123",
      roleId: 1,
      firstName: "John",
      lastName: "Doe",
      phone: "+1234567890",
      address: "123 Student St",
      dateOfBirth: "2005-01-15",
      gender: "Male",
      profileImageUrl: null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    {
      id: "2",
      email: "teacher@demo.com",
      passwordHash: "demo123",
      roleId: 2,
      firstName: "Jane",
      lastName: "Smith",
      phone: "+1234567891",
      address: "456 Teacher Ave",
      dateOfBirth: "1985-05-20",
      gender: "Female",
      profileImageUrl: null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    {
      id: "3",
      email: "parent@demo.com",
      passwordHash: "demo123",
      roleId: 3,
      firstName: "Bob",
      lastName: "Johnson",
      phone: "+1234567892",
      address: "789 Parent Rd",
      dateOfBirth: "1980-09-10",
      gender: "Male",
      profileImageUrl: null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    {
      id: "4",
      email: "admin@demo.com",
      passwordHash: "demo123",
      roleId: 4,
      firstName: "Admin",
      lastName: "User",
      phone: "+1234567893",
      address: "101 Admin Blvd",
      dateOfBirth: "1975-12-25",
      gender: "Other",
      profileImageUrl: null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    {
      id: "5",
      email: "mary.johnson@demo.com",
      passwordHash: "demo123",
      roleId: 1,
      firstName: "Mary",
      lastName: "Johnson",
      phone: "+1234567894",
      address: "456 Student Ave",
      dateOfBirth: "2006-03-15",
      gender: "Female",
      profileImageUrl: null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    {
      id: "6",
      email: "peter.wilson@demo.com",
      passwordHash: "demo123",
      roleId: 1,
      firstName: "Peter",
      lastName: "Wilson",
      phone: "+1234567895",
      address: "789 Student Rd",
      dateOfBirth: "2005-07-20",
      gender: "Male",
      profileImageUrl: null,
      isActive: true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }
  ];
  subjects = [
    { id: 1, name: "Mathematics", code: "MATH101", description: "Basic Mathematics", createdAt: /* @__PURE__ */ new Date() },
    { id: 2, name: "English Language", code: "ENG101", description: "English Language and Literature", createdAt: /* @__PURE__ */ new Date() },
    { id: 3, name: "Science", code: "SCI101", description: "Basic Science", createdAt: /* @__PURE__ */ new Date() },
    { id: 4, name: "Social Studies", code: "SS101", description: "Social Studies", createdAt: /* @__PURE__ */ new Date() },
    { id: 5, name: "Computer Studies", code: "CS101", description: "Introduction to Computing", createdAt: /* @__PURE__ */ new Date() }
  ];
  terms = [
    { id: 1, name: "First Term", year: "2023/2024", startDate: "2023-09-01", endDate: "2023-12-15", isCurrent: true, createdAt: /* @__PURE__ */ new Date() },
    { id: 2, name: "Second Term", year: "2023/2024", startDate: "2024-01-08", endDate: "2024-04-12", isCurrent: false, createdAt: /* @__PURE__ */ new Date() },
    { id: 3, name: "Third Term", year: "2023/2024", startDate: "2024-04-22", endDate: "2024-07-26", isCurrent: false, createdAt: /* @__PURE__ */ new Date() }
  ];
  classes = [
    { id: 1, name: "JSS 1A", level: "Junior Secondary", capacity: 30, classTeacherId: "2", currentTermId: 1, isActive: true, createdAt: /* @__PURE__ */ new Date() },
    { id: 2, name: "JSS 1B", level: "Junior Secondary", capacity: 30, classTeacherId: "2", currentTermId: 1, isActive: true, createdAt: /* @__PURE__ */ new Date() },
    { id: 3, name: "JSS 2A", level: "Junior Secondary", capacity: 28, classTeacherId: "2", currentTermId: 1, isActive: true, createdAt: /* @__PURE__ */ new Date() },
    { id: 4, name: "SS 1A", level: "Senior Secondary", capacity: 25, classTeacherId: "2", currentTermId: 1, isActive: true, createdAt: /* @__PURE__ */ new Date() }
  ];
  students = [
    {
      id: "1",
      admissionNumber: "THS/2023/001",
      classId: 1,
      parentId: "3",
      admissionDate: "2023-09-01",
      createdAt: /* @__PURE__ */ new Date()
    },
    {
      id: "5",
      admissionNumber: "THS/2023/002",
      classId: 1,
      parentId: "3",
      admissionDate: "2023-09-01",
      createdAt: /* @__PURE__ */ new Date()
    },
    {
      id: "6",
      admissionNumber: "THS/2023/003",
      classId: 2,
      parentId: "3",
      admissionDate: "2023-09-01",
      createdAt: /* @__PURE__ */ new Date()
    }
  ];
  attendance = [
    { id: 1, studentId: "1", classId: 1, date: "2023-11-01", status: "Present", notes: null, recordedBy: "2", createdAt: /* @__PURE__ */ new Date() },
    { id: 2, studentId: "1", classId: 1, date: "2023-11-02", status: "Present", notes: null, recordedBy: "2", createdAt: /* @__PURE__ */ new Date() },
    { id: 3, studentId: "1", classId: 1, date: "2023-11-03", status: "Late", notes: "Arrived 30 minutes late", recordedBy: "2", createdAt: /* @__PURE__ */ new Date() },
    { id: 4, studentId: "5", classId: 1, date: "2023-11-01", status: "Present", notes: null, recordedBy: "2", createdAt: /* @__PURE__ */ new Date() },
    { id: 5, studentId: "5", classId: 1, date: "2023-11-02", status: "Absent", notes: "Sick", recordedBy: "2", createdAt: /* @__PURE__ */ new Date() },
    { id: 6, studentId: "6", classId: 2, date: "2023-11-01", status: "Present", notes: null, recordedBy: "2", createdAt: /* @__PURE__ */ new Date() }
  ];
  exams = [
    {
      id: 1,
      name: "First Term Test",
      classId: 1,
      subjectId: 1,
      termId: 1,
      date: "2023-10-15",
      totalMarks: 100,
      createdBy: "2",
      timeLimit: 120,
      startTime: null,
      endTime: null,
      instructions: "Answer all questions. Good luck!",
      isPublished: true,
      allowRetakes: false,
      shuffleQuestions: false,
      createdAt: /* @__PURE__ */ new Date()
    },
    {
      id: 2,
      name: "First Term Test",
      classId: 1,
      subjectId: 2,
      termId: 1,
      date: "2023-10-16",
      totalMarks: 100,
      createdBy: "2",
      timeLimit: 90,
      startTime: null,
      endTime: null,
      instructions: "Read questions carefully before answering.",
      isPublished: true,
      allowRetakes: false,
      shuffleQuestions: true,
      createdAt: /* @__PURE__ */ new Date()
    },
    {
      id: 3,
      name: "Mid-Term Assessment",
      classId: 1,
      subjectId: 1,
      termId: 1,
      date: "2023-11-15",
      totalMarks: 50,
      createdBy: "2",
      timeLimit: 60,
      startTime: null,
      endTime: null,
      instructions: "This is a mid-term assessment. Show your work.",
      isPublished: false,
      allowRetakes: true,
      shuffleQuestions: false,
      createdAt: /* @__PURE__ */ new Date()
    }
  ];
  examQuestions = [];
  questionOptions = [];
  examResults = [
    { id: 1, examId: 1, studentId: "1", score: 85, maxScore: 100, marksObtained: 85, grade: "A", remarks: "Excellent performance", autoScored: false, recordedBy: "teacher-manual", createdAt: /* @__PURE__ */ new Date() },
    { id: 2, examId: 2, studentId: "1", score: 78, maxScore: 100, marksObtained: 78, grade: "B+", remarks: "Good improvement", autoScored: false, recordedBy: "teacher-manual", createdAt: /* @__PURE__ */ new Date() },
    { id: 3, examId: 1, studentId: "5", score: 72, maxScore: 100, marksObtained: 72, grade: "B", remarks: "Good effort", autoScored: false, recordedBy: "teacher-manual", createdAt: /* @__PURE__ */ new Date() },
    { id: 4, examId: 2, studentId: "5", score: 68, maxScore: 100, marksObtained: 68, grade: "B-", remarks: "Need more practice in essay writing", autoScored: false, recordedBy: "teacher-manual", createdAt: /* @__PURE__ */ new Date() },
    { id: 5, examId: 3, studentId: "1", score: 42, maxScore: 50, marksObtained: 42, grade: "A", remarks: "Excellent", autoScored: true, recordedBy: "system-auto-scoring", createdAt: /* @__PURE__ */ new Date() }
  ];
  announcements = [
    {
      id: 1,
      title: "Welcome to New Academic Session",
      content: "We welcome all students and parents to the 2023/2024 academic session. Classes begin on September 1st, 2023.",
      targetRoles: ["All"],
      targetClasses: [],
      isPublished: true,
      publishedAt: /* @__PURE__ */ new Date("2023-08-25"),
      authorId: "4",
      createdAt: /* @__PURE__ */ new Date("2023-08-25")
    },
    {
      id: 2,
      title: "Parent-Teacher Meeting",
      content: "There will be a parent-teacher meeting on December 10th, 2023 to discuss student progress for the first term.",
      targetRoles: ["Parent"],
      targetClasses: [],
      isPublished: true,
      publishedAt: /* @__PURE__ */ new Date("2023-11-15"),
      authorId: "4",
      createdAt: /* @__PURE__ */ new Date("2023-11-15")
    },
    {
      id: 3,
      title: "School Sports Day",
      content: "Our annual sports day will be held on November 25th, 2023. All students are expected to participate.",
      targetRoles: ["Student"],
      targetClasses: [],
      isPublished: true,
      publishedAt: /* @__PURE__ */ new Date("2023-11-01"),
      authorId: "4",
      createdAt: /* @__PURE__ */ new Date("2023-11-01")
    }
  ];
  messages = [
    {
      id: 1,
      senderId: "2",
      recipientId: "3",
      subject: "Student Progress Update",
      content: "Your child John Doe is performing excellently in Mathematics. Keep up the good work!",
      isRead: false,
      createdAt: /* @__PURE__ */ new Date("2023-11-10")
    },
    {
      id: 2,
      senderId: "4",
      recipientId: "2",
      subject: "Staff Meeting Reminder",
      content: "Reminder: Staff meeting scheduled for tomorrow at 2:00 PM in the conference room.",
      isRead: true,
      createdAt: /* @__PURE__ */ new Date("2023-11-11")
    },
    {
      id: 3,
      senderId: "3",
      recipientId: "2",
      subject: "Request for Extra Classes",
      content: "Could you please arrange extra Mathematics classes for my child? Thank you.",
      isRead: false,
      createdAt: /* @__PURE__ */ new Date("2023-11-12")
    }
  ];
  galleryCategories = [
    { id: 1, name: "School Events", description: "Photos from various school events", createdAt: /* @__PURE__ */ new Date() },
    { id: 2, name: "Sports Activities", description: "Sports and recreational activities", createdAt: /* @__PURE__ */ new Date() },
    { id: 3, name: "Academic Achievements", description: "Academic competitions and awards", createdAt: /* @__PURE__ */ new Date() },
    { id: 4, name: "School Facilities", description: "Photos of school buildings and facilities", createdAt: /* @__PURE__ */ new Date() }
  ];
  galleryImages = [
    { id: 1, imageUrl: "/placeholder-gallery-1.jpg", caption: "Annual Science Fair 2023", categoryId: 1, uploadedBy: "4", createdAt: /* @__PURE__ */ new Date() },
    { id: 2, imageUrl: "/placeholder-gallery-2.jpg", caption: "Inter-house Sports Competition", categoryId: 2, uploadedBy: "4", createdAt: /* @__PURE__ */ new Date() },
    { id: 3, imageUrl: "/placeholder-gallery-3.jpg", caption: "Mathematics Olympiad Winners", categoryId: 3, uploadedBy: "4", createdAt: /* @__PURE__ */ new Date() },
    { id: 4, imageUrl: "/placeholder-gallery-4.jpg", caption: "New Computer Laboratory", categoryId: 4, uploadedBy: "4", createdAt: /* @__PURE__ */ new Date() },
    { id: 5, imageUrl: "/placeholder-gallery-5.jpg", caption: "Graduation Ceremony 2023", categoryId: 1, uploadedBy: "4", createdAt: /* @__PURE__ */ new Date() }
  ];
  homePageContent = [
    {
      id: 1,
      contentType: "hero_image",
      imageUrl: "/placeholder-hero.jpg",
      altText: "Welcome to Treasure-Home School",
      caption: "Excellence in Education",
      isActive: true,
      displayOrder: 1,
      uploadedBy: "4",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    },
    {
      id: 2,
      contentType: "gallery_preview_1",
      imageUrl: "/placeholder-gallery-preview-1.jpg",
      altText: "Science Fair",
      caption: "Annual Science Fair 2023",
      isActive: true,
      displayOrder: 2,
      uploadedBy: "4",
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    }
  ];
  async getUser(id) {
    return this.users.find((u) => u.id === id);
  }
  async getUserByEmail(email) {
    return this.users.find((u) => u.email === email);
  }
  async createUser(user) {
    const newUser = {
      id: String(this.users.length + 1),
      ...user,
      gender: user.gender ?? null,
      passwordHash: user.passwordHash ?? null,
      phone: user.phone ?? null,
      address: user.address ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      isActive: user.isActive ?? true,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.users.push(newUser);
    return newUser;
  }
  async updateUser(id, user) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return void 0;
    this.users[index] = { ...this.users[index], ...user, updatedAt: /* @__PURE__ */ new Date() };
    return this.users[index];
  }
  async getUsersByRole(roleId) {
    return this.users.filter((u) => u.roleId === roleId);
  }
  async deleteUser(id) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }
  async getRoles() {
    return this.roles;
  }
  async getRoleByName(name) {
    return this.roles.find((r) => r.name === name);
  }
  async getStudent(id) {
    return this.students.find((s) => s.id === id);
  }
  async createStudent(student) {
    const newStudent = {
      ...student,
      id: student.id ?? String(this.students.length + 1),
      classId: student.classId ?? null,
      parentId: student.parentId ?? null,
      admissionDate: student.admissionDate ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.students.push(newStudent);
    return newStudent;
  }
  async getStudentsByClass(classId) {
    return this.students.filter((s) => s.classId === classId);
  }
  async getAllStudents() {
    return this.students;
  }
  async getStudentByAdmissionNumber(admissionNumber) {
    return this.students.find((s) => s.admissionNumber === admissionNumber);
  }
  async getClasses() {
    return this.classes;
  }
  async getClass(id) {
    return this.classes.find((c) => c.id === id);
  }
  async createClass(classData) {
    const newClass = {
      id: this.classes.length + 1,
      ...classData,
      isActive: classData.isActive ?? true,
      capacity: classData.capacity ?? 30,
      classTeacherId: classData.classTeacherId ?? null,
      currentTermId: classData.currentTermId ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.classes.push(newClass);
    return newClass;
  }
  async updateClass(id, classData) {
    const index = this.classes.findIndex((c) => c.id === id);
    if (index === -1) return void 0;
    this.classes[index] = { ...this.classes[index], ...classData };
    return this.classes[index];
  }
  async deleteClass(id) {
    const index = this.classes.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.classes.splice(index, 1);
    return true;
  }
  async getSubjects() {
    return this.subjects;
  }
  async getSubject(id) {
    return this.subjects.find((s) => s.id === id);
  }
  async createSubject(subject) {
    const newSubject = {
      id: this.subjects.length + 1,
      ...subject,
      description: subject.description ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.subjects.push(newSubject);
    return newSubject;
  }
  async updateSubject(id, subject) {
    const index = this.subjects.findIndex((s) => s.id === id);
    if (index === -1) return void 0;
    this.subjects[index] = { ...this.subjects[index], ...subject };
    return this.subjects[index];
  }
  async deleteSubject(id) {
    const index = this.subjects.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.subjects.splice(index, 1);
    return true;
  }
  async getCurrentTerm() {
    return this.terms.find((t) => t.isCurrent);
  }
  async getTerms() {
    return this.terms;
  }
  async recordAttendance(attendance2) {
    const newAttendance = {
      id: this.attendance.length + 1,
      ...attendance2,
      status: attendance2.status ?? null,
      notes: attendance2.notes ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.attendance.push(newAttendance);
    return newAttendance;
  }
  async getAttendanceByStudent(studentId, date2) {
    return this.attendance.filter((a) => a.studentId === studentId && (!date2 || a.date === date2));
  }
  async getAttendanceByClass(classId, date2) {
    return this.attendance.filter((a) => a.classId === classId && a.date === date2);
  }
  async createExam(exam) {
    const newExam = {
      id: this.exams.length + 1,
      ...exam,
      classId: exam.classId ?? 1,
      timeLimit: exam.timeLimit ?? null,
      startTime: exam.startTime ?? null,
      endTime: exam.endTime ?? null,
      instructions: exam.instructions ?? null,
      isPublished: exam.isPublished ?? false,
      allowRetakes: exam.allowRetakes ?? false,
      shuffleQuestions: exam.shuffleQuestions ?? false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.exams.push(newExam);
    return newExam;
  }
  async getAllExams() {
    return [...this.exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  async getExamById(id) {
    return this.exams.find((e) => e.id === id);
  }
  async getExamsByClass(classId) {
    return this.exams.filter((e) => e.classId === classId);
  }
  async updateExam(id, exam) {
    const index = this.exams.findIndex((e) => e.id === id);
    if (index === -1) return void 0;
    this.exams[index] = { ...this.exams[index], ...exam };
    return this.exams[index];
  }
  async deleteExam(id) {
    const index = this.exams.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.exams.splice(index, 1);
    return true;
  }
  async recordExamResult(result) {
    const newResult = {
      id: this.examResults.length + 1,
      examId: result.examId,
      studentId: result.studentId,
      score: result.score,
      maxScore: result.maxScore ?? null,
      marksObtained: result.marksObtained ?? null,
      grade: result.grade ?? null,
      remarks: result.remarks ?? null,
      autoScored: result.autoScored ?? false,
      recordedBy: result.recordedBy,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.examResults.push(newResult);
    return newResult;
  }
  async updateExamResult(id, result) {
    const index = this.examResults.findIndex((r) => r.id === id);
    if (index === -1) return void 0;
    this.examResults[index] = {
      ...this.examResults[index],
      ...result
    };
    return this.examResults[index];
  }
  async getExamResultsByStudent(studentId) {
    return this.examResults.filter((r) => r.studentId === studentId);
  }
  async getExamResultsByExam(examId) {
    return this.examResults.filter((r) => r.examId === examId);
  }
  // Exam questions management
  async createExamQuestion(question) {
    const newQuestion = {
      id: this.examQuestions.length + 1,
      ...question,
      points: question.points ?? null,
      imageUrl: question.imageUrl ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.examQuestions.push(newQuestion);
    return newQuestion;
  }
  async createExamQuestionWithOptions(question, options) {
    const newQuestion = {
      id: this.examQuestions.length + 1,
      ...question,
      points: question.points ?? null,
      imageUrl: question.imageUrl ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.examQuestions.push(newQuestion);
    if (options && options.length > 0) {
      options.forEach((option, index) => {
        const newOption = {
          id: this.questionOptions.length + 1,
          questionId: newQuestion.id,
          optionText: option.optionText,
          orderNumber: index + 1,
          isCorrect: option.isCorrect,
          createdAt: /* @__PURE__ */ new Date()
        };
        this.questionOptions.push(newOption);
      });
    }
    return newQuestion;
  }
  async getExamQuestions(examId) {
    return this.examQuestions.filter((q) => q.examId === examId).sort((a, b) => a.orderNumber - b.orderNumber);
  }
  async updateExamQuestion(id, question) {
    const index = this.examQuestions.findIndex((q) => q.id === id);
    if (index === -1) return void 0;
    this.examQuestions[index] = { ...this.examQuestions[index], ...question };
    return this.examQuestions[index];
  }
  async deleteExamQuestion(id) {
    const index = this.examQuestions.findIndex((q) => q.id === id);
    if (index === -1) return false;
    this.questionOptions = this.questionOptions.filter((o) => o.questionId !== id);
    this.examQuestions.splice(index, 1);
    return true;
  }
  // Question options management
  async createQuestionOption(option) {
    const newOption = {
      id: this.questionOptions.length + 1,
      ...option,
      isCorrect: option.isCorrect ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.questionOptions.push(newOption);
    return newOption;
  }
  async getQuestionOptions(questionId) {
    return this.questionOptions.filter((o) => o.questionId === questionId);
  }
  // Exam sessions management (MemoryStorage)
  examSessions = [];
  studentAnswers = [];
  async createExamSession(session) {
    const newSession = {
      id: this.examSessions.length + 1,
      ...session,
      startedAt: session.startedAt ?? /* @__PURE__ */ new Date(),
      submittedAt: session.submittedAt ?? null,
      timeRemaining: session.timeRemaining ?? null,
      isCompleted: session.isCompleted ?? false,
      score: session.score ?? null,
      maxScore: session.maxScore ?? null,
      status: session.status ?? "in_progress",
      createdAt: /* @__PURE__ */ new Date()
    };
    this.examSessions.push(newSession);
    return newSession;
  }
  async getExamSessionById(id) {
    return this.examSessions.find((s) => s.id === id);
  }
  async getExamSessionsByExam(examId) {
    return this.examSessions.filter((s) => s.examId === examId);
  }
  async getExamSessionsByStudent(studentId) {
    return this.examSessions.filter((s) => s.studentId === studentId);
  }
  async updateExamSession(id, session) {
    const index = this.examSessions.findIndex((s) => s.id === id);
    if (index === -1) return void 0;
    this.examSessions[index] = { ...this.examSessions[index], ...session };
    return this.examSessions[index];
  }
  async deleteExamSession(id) {
    const index = this.examSessions.findIndex((s) => s.id === id);
    if (index === -1) return false;
    this.examSessions.splice(index, 1);
    return true;
  }
  async getActiveExamSession(examId, studentId) {
    return this.examSessions.find(
      (s) => s.examId === examId && s.studentId === studentId && !s.isCompleted
    );
  }
  // Student answers management (MemoryStorage)
  async createStudentAnswer(answer) {
    const newAnswer = {
      id: this.studentAnswers.length + 1,
      ...answer,
      selectedOptionId: answer.selectedOptionId ?? null,
      textAnswer: answer.textAnswer ?? null,
      isCorrect: answer.isCorrect ?? null,
      pointsEarned: answer.pointsEarned ?? 0,
      answeredAt: /* @__PURE__ */ new Date()
    };
    this.studentAnswers.push(newAnswer);
    return newAnswer;
  }
  async getStudentAnswers(sessionId) {
    return this.studentAnswers.filter((a) => a.sessionId === sessionId);
  }
  async updateStudentAnswer(id, answer) {
    const index = this.studentAnswers.findIndex((a) => a.id === id);
    if (index === -1) return void 0;
    this.studentAnswers[index] = { ...this.studentAnswers[index], ...answer };
    return this.studentAnswers[index];
  }
  async createAnnouncement(announcement) {
    const newAnnouncement = {
      id: this.announcements.length + 1,
      ...announcement,
      targetRoles: announcement.targetRoles ?? null,
      targetClasses: announcement.targetClasses ?? null,
      isPublished: announcement.isPublished ?? false,
      publishedAt: announcement.publishedAt ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.announcements.push(newAnnouncement);
    return newAnnouncement;
  }
  async getAnnouncements(targetRole) {
    if (!targetRole) return this.announcements;
    return this.announcements.filter(
      (a) => a.targetRoles?.includes(targetRole) || a.targetRoles?.includes("All")
    );
  }
  async getAnnouncementById(id) {
    return this.announcements.find((a) => a.id === id);
  }
  async updateAnnouncement(id, announcement) {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) return void 0;
    this.announcements[index] = { ...this.announcements[index], ...announcement };
    return this.announcements[index];
  }
  async deleteAnnouncement(id) {
    const index = this.announcements.findIndex((a) => a.id === id);
    if (index === -1) return false;
    this.announcements.splice(index, 1);
    return true;
  }
  async sendMessage(message) {
    const newMessage = {
      id: this.messages.length + 1,
      ...message,
      isRead: message.isRead ?? false,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }
  async getMessagesByUser(userId) {
    return this.messages.filter((m) => m.senderId === userId || m.recipientId === userId);
  }
  async markMessageAsRead(id) {
    const message = this.messages.find((m) => m.id === id);
    if (message) {
      message.isRead = true;
    }
  }
  async createGalleryCategory(category) {
    const newCategory = {
      id: this.galleryCategories.length + 1,
      ...category,
      description: category.description ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.galleryCategories.push(newCategory);
    return newCategory;
  }
  async getGalleryCategories() {
    return this.galleryCategories;
  }
  async uploadGalleryImage(image) {
    const newImage = {
      id: this.galleryImages.length + 1,
      ...image,
      caption: image.caption ?? null,
      categoryId: image.categoryId ?? null,
      uploadedBy: image.uploadedBy ?? null,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.galleryImages.push(newImage);
    return newImage;
  }
  async getGalleryImages(categoryId) {
    if (!categoryId) return this.galleryImages;
    return this.galleryImages.filter((i) => i.categoryId === categoryId);
  }
  async getGalleryImageById(id) {
    return this.galleryImages.find((img) => img.id === parseInt(id));
  }
  async deleteGalleryImage(id) {
    const index = this.galleryImages.findIndex((img) => img.id === parseInt(id));
    if (index !== -1) {
      this.galleryImages.splice(index, 1);
      return true;
    }
    return false;
  }
  // Home page content management
  async createHomePageContent(content) {
    const newContent = {
      id: this.homePageContent.length + 1,
      ...content,
      imageUrl: content.imageUrl ?? null,
      altText: content.altText ?? null,
      caption: content.caption ?? null,
      uploadedBy: content.uploadedBy ?? null,
      isActive: content.isActive ?? true,
      displayOrder: content.displayOrder ?? 0,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.homePageContent.push(newContent);
    return newContent;
  }
  async getHomePageContent(contentType) {
    let content = this.homePageContent.filter((c) => c.isActive);
    if (contentType) {
      content = content.filter((c) => c.contentType === contentType);
    }
    return content.sort((a, b) => a.displayOrder - b.displayOrder);
  }
  async getHomePageContentById(id) {
    return this.homePageContent.find((c) => c.id === id);
  }
  async updateHomePageContent(id, content) {
    const index = this.homePageContent.findIndex((c) => c.id === id);
    if (index === -1) return void 0;
    this.homePageContent[index] = {
      ...this.homePageContent[index],
      ...content,
      updatedAt: /* @__PURE__ */ new Date()
    };
    return this.homePageContent[index];
  }
  async deleteHomePageContent(id) {
    const index = this.homePageContent.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.homePageContent.splice(index, 1);
    return true;
  }
  // Analytics and Reports
  async getAnalyticsOverview() {
    const students2 = this.users.filter((u) => u.roleId === 1);
    const teachers = this.users.filter((u) => u.roleId === 2);
    const admins = this.users.filter((u) => u.roleId === 4);
    const parents = this.users.filter((u) => u.roleId === 3);
    const gradeDistribution = this.calculateGradeDistribution(this.examResults);
    return {
      totalUsers: this.users.length,
      totalStudents: students2.length,
      totalTeachers: teachers.length,
      totalAdmins: admins.length,
      totalParents: parents.length,
      totalClasses: this.classes.length,
      totalSubjects: this.subjects.length,
      totalExams: this.exams.length,
      totalExamResults: this.examResults.length,
      averageClassSize: this.classes.length > 0 ? Math.round(students2.length / this.classes.length) : 0,
      gradeDistribution,
      subjectPerformance: this.calculateSubjectPerformance(this.examResults, this.subjects),
      recentActivity: {
        newStudentsThisMonth: students2.filter(
          (s) => s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
        ).length,
        examsThisMonth: this.exams.filter(
          (e) => e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
        ).length
      }
    };
  }
  async getPerformanceAnalytics(filters) {
    let examResults2 = [...this.examResults];
    if (filters.classId) {
      const studentsInClass = this.students.filter((s) => s.classId === filters.classId);
      const studentIds = studentsInClass.map((s) => s.id);
      examResults2 = examResults2.filter((r) => studentIds.includes(r.studentId));
    }
    if (filters.subjectId) {
      const examsForSubject = this.exams.filter((e) => e.subjectId === filters.subjectId);
      const examIds = examsForSubject.map((e) => e.id);
      examResults2 = examResults2.filter((r) => examIds.includes(r.examId));
    }
    const totalExams = examResults2.length;
    const averageScore = totalExams > 0 ? examResults2.reduce((sum, r) => sum + (r.marksObtained || 0), 0) / totalExams : 0;
    const gradeDistribution = this.calculateGradeDistribution(examResults2);
    const performanceTrends = this.calculatePerformanceTrends(examResults2);
    const studentPerformance = this.calculateStudentPerformance(examResults2);
    return {
      totalExams,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round(averageScore / 100 * 100),
      gradeDistribution,
      performanceTrends,
      topPerformers: studentPerformance.slice(0, 5),
      strugglingStudents: studentPerformance.slice(-5),
      passRate: Math.round(examResults2.filter((r) => (r.marksObtained || 0) >= 50).length / totalExams * 100)
    };
  }
  async getTrendAnalytics(months = 6) {
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const month = /* @__PURE__ */ new Date();
      month.setMonth(month.getMonth() - i);
      const monthName = month.toLocaleString("default", { month: "short" });
      const year = month.getFullYear();
      monthlyData.push({
        month: monthName,
        year,
        students: this.users.filter((u) => u.roleId === 1).length + Math.floor(Math.random() * 10) - 5,
        exams: Math.floor(this.exams.length / months) + Math.floor(Math.random() * 3),
        averageScore: 75 + Math.floor(Math.random() * 20) - 10,
        attendance: 85 + Math.floor(Math.random() * 15)
      });
    }
    return {
      monthlyTrends: monthlyData,
      summary: {
        studentsGrowth: monthlyData.length > 1 ? ((monthlyData[monthlyData.length - 1].students - monthlyData[0].students) / monthlyData[0].students * 100).toFixed(1) : 0,
        examsTrend: "stable",
        scoresTrend: "improving",
        attendanceTrend: "stable"
      }
    };
  }
  async getAttendanceAnalytics(filters) {
    try {
      let attendance2 = [...this.attendance];
      if (filters.classId) {
        const studentsInClass = this.students.filter((s) => s.classId === filters.classId);
        const studentIds = studentsInClass.map((s) => s.id);
        attendance2 = attendance2.filter((a) => studentIds.includes(a.studentId));
      }
      if (filters.startDate && filters.endDate) {
        attendance2 = attendance2.filter((a) => {
          const attendanceDate = new Date(a.date);
          return attendanceDate >= new Date(filters.startDate) && attendanceDate <= new Date(filters.endDate);
        });
      }
      const totalRecords = attendance2.length;
      const presentCount = attendance2.filter((a) => a.status === "Present").length;
      const absentCount = attendance2.filter((a) => a.status === "Absent").length;
      const lateCount = attendance2.filter((a) => a.status === "Late").length;
      const excusedCount = attendance2.filter((a) => a.status === "Excused").length;
      const attendanceRate = totalRecords > 0 ? Math.round(presentCount / totalRecords * 100) : 0;
      return {
        totalRecords,
        attendanceRate,
        statusBreakdown: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount
        },
        dailyTrends: this.calculateDailyAttendanceTrends(attendance2),
        classComparison: this.calculateClassAttendanceComparison()
      };
    } catch (error) {
      console.error("Error in getAttendanceAnalytics:", error);
      return {
        totalRecords: 0,
        attendanceRate: 0,
        statusBreakdown: {
          present: 0,
          absent: 0,
          late: 0,
          excused: 0
        },
        dailyTrends: [],
        classComparison: [],
        error: "Failed to calculate attendance analytics"
      };
    }
  }
  calculateGradeDistribution(examResults2) {
    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    examResults2.forEach((result) => {
      const percentage = result.obtainedMarks / result.totalMarks * 100;
      if (percentage >= 90) grades.A++;
      else if (percentage >= 80) grades.B++;
      else if (percentage >= 70) grades.C++;
      else if (percentage >= 60) grades.D++;
      else grades.F++;
    });
    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }
  calculateSubjectPerformance(examResults2, subjects2) {
    const subjectMap = /* @__PURE__ */ new Map();
    subjects2.forEach((s) => subjectMap.set(s.id, s.name));
    const performance = /* @__PURE__ */ new Map();
    examResults2.forEach((result) => {
      const exam = this.exams.find((e) => e.id === result.examId);
      const subjectId = exam?.subjectId;
      if (subjectId) {
        if (!performance.has(subjectId)) {
          performance.set(subjectId, { total: 0, count: 0 });
        }
        const current = performance.get(subjectId);
        current.total += result.obtainedMarks;
        current.count += 1;
      }
    });
    return Array.from(performance.entries()).map(([subjectId, data]) => ({
      subject: subjectMap.get(subjectId) || "Unknown",
      average: Math.round(data.total / data.count * 100) / 100,
      examCount: data.count
    }));
  }
  calculatePerformanceTrends(examResults2) {
    const trends = /* @__PURE__ */ new Map();
    examResults2.forEach((result) => {
      const month = new Date(result.createdAt).toLocaleString("default", { month: "short" });
      if (!trends.has(month)) {
        trends.set(month, { total: 0, count: 0 });
      }
      const current = trends.get(month);
      current.total += result.obtainedMarks;
      current.count += 1;
    });
    return Array.from(trends.entries()).map(([month, data]) => ({
      month,
      average: Math.round(data.total / data.count * 100) / 100
    }));
  }
  calculateStudentPerformance(examResults2) {
    const performance = /* @__PURE__ */ new Map();
    examResults2.forEach((result) => {
      if (!performance.has(result.studentId)) {
        performance.set(result.studentId, { total: 0, count: 0 });
      }
      const current = performance.get(result.studentId);
      current.total += result.obtainedMarks;
      current.count += 1;
    });
    return Array.from(performance.entries()).map(([studentId, data]) => ({
      studentId,
      average: Math.round(data.total / data.count * 100) / 100,
      examCount: data.count
    })).sort((a, b) => b.average - a.average);
  }
  calculateDailyAttendanceTrends(attendance2) {
    const trends = /* @__PURE__ */ new Map();
    attendance2.forEach((record) => {
      const date2 = record.date;
      if (!trends.has(date2)) {
        trends.set(date2, { present: 0, total: 0 });
      }
      const current = trends.get(date2);
      current.total += 1;
      if (record.status === "Present") current.present += 1;
    });
    return Array.from(trends.entries()).map(([date2, data]) => ({
      date: date2,
      rate: Math.round(data.present / data.total * 100)
    }));
  }
  calculateClassAttendanceComparison() {
    return this.classes.map((cls) => ({
      className: cls.name,
      attendanceRate: 85 + Math.floor(Math.random() * 15),
      level: cls.level
    }));
  }
  getFallbackAnalytics() {
    return {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalAdmins: 0,
      totalParents: 0,
      totalClasses: 0,
      totalSubjects: 0,
      totalExams: 0,
      totalExamResults: 0,
      averageClassSize: 0,
      gradeDistribution: [],
      subjectPerformance: [],
      recentActivity: {
        newStudentsThisMonth: 0,
        examsThisMonth: 0
      }
    };
  }
};
async function initializeStorage() {
  if (process.env.DATABASE_URL) {
    try {
      const dbStorage = new DatabaseStorage();
      await dbStorage.db.execute("SELECT 1");
      console.log("\u2705 STORAGE: Using PostgreSQL DatabaseStorage");
      return dbStorage;
    } catch (error) {
      console.warn("\u26A0\uFE0F Database connection failed, falling back to MemoryStorage:", error instanceof Error ? error.message : "Unknown error");
    }
  } else {
    console.log("\u{1F4DD} DATABASE_URL not set, using MemoryStorage");
  }
  console.log("\u2705 STORAGE: Using MemoryStorage with demo data");
  return new MemoryStorage();
}
var storage = new MemoryStorage();
(async () => {
  try {
    storage = await initializeStorage();
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }
})();

// server/routes.ts
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
var loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});
var contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().min(1)
});
var JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is required but not set!");
  console.error("Please set a secure JWT_SECRET environment variable before starting the server.");
  process.exit(1);
}
var SECRET_KEY = JWT_SECRET;
var JWT_EXPIRES_IN = "24h";
function normalizeUuid2(raw) {
  if (!raw) return void 0;
  if (typeof raw === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }
  let bytes;
  if (typeof raw === "string" && raw.includes(",")) {
    const parts = raw.split(",").map((s) => parseInt(s.trim()));
    if (parts.length === 16 && parts.every((n) => n >= 0 && n <= 255)) {
      bytes = parts;
    }
  }
  if (Array.isArray(raw) && raw.length === 16) {
    bytes = raw;
  } else if (raw instanceof Uint8Array && raw.length === 16) {
    bytes = Array.from(raw);
  }
  if (bytes) {
    const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  console.warn("Failed to normalize UUID:", raw);
  return void 0;
}
var ROLES = {
  STUDENT: 1,
  TEACHER: 2,
  PARENT: 3,
  ADMIN: 4
};
var loginAttempts = /* @__PURE__ */ new Map();
var MAX_LOGIN_ATTEMPTS = 5;
var RATE_LIMIT_WINDOW = 15 * 60 * 1e3;
var BCRYPT_ROUNDS = 12;
var authenticateUser = async (req, res, next) => {
  try {
    const authHeader = (req.headers.authorization || "").trim();
    const [scheme, token] = authHeader.split(/\s+/);
    if (!/^bearer$/i.test(scheme) || !token) {
      return res.status(401).json({ message: "Authentication required" });
    }
    let decoded;
    try {
      decoded = jwt.verify(token, SECRET_KEY);
    } catch (jwtError) {
      console.error("JWT verification failed:", jwtError);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    const normalizedUserId = normalizeUuid2(decoded.userId);
    if (!normalizedUserId) {
      console.error("Invalid userId in token:", decoded.userId);
      return res.status(401).json({ message: "Invalid token format" });
    }
    const user = await storage.getUser(normalizedUserId);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    if (user.roleId !== decoded.roleId) {
      return res.status(401).json({ message: "User role has changed, please log in again" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(401).json({ message: "Authentication failed" });
  }
};
var authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      if (!allowedRoles.includes(req.user.roleId)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(403).json({ message: "Authorization failed" });
    }
  };
};
var uploadDir = "uploads";
var galleryDir = "uploads/gallery";
var profileDir = "uploads/profiles";
fs.mkdir(uploadDir, { recursive: true }).catch(() => {
});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {
});
fs.mkdir(profileDir, { recursive: true }).catch(() => {
});
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || "general";
    let dir = uploadDir;
    if (uploadType === "gallery") {
      dir = galleryDir;
    } else if (uploadType === "profile") {
      dir = profileDir;
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});
var upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  }
});
async function autoScoreExamSession(sessionId, storage2) {
  try {
    const session = await storage2.getExamSessionById(sessionId);
    if (!session) {
      throw new Error(`Exam session ${sessionId} not found`);
    }
    const studentAnswers2 = await storage2.getStudentAnswers(sessionId);
    const examQuestions2 = await storage2.getExamQuestions(session.examId);
    let totalScore = 0;
    let maxPossibleScore = 0;
    let autoScoredQuestions = 0;
    console.log(`Auto-scoring session ${sessionId}: Found ${examQuestions2.length} questions, ${studentAnswers2.length} answers`);
    for (const question of examQuestions2) {
      maxPossibleScore += question.points || 1;
      if (question.questionType === "multiple_choice") {
        const studentAnswer = studentAnswers2.find((a) => a.questionId === question.id);
        if (studentAnswer && studentAnswer.selectedOptionId) {
          const questionOptions2 = await storage2.getQuestionOptions(question.id);
          const correctOption = questionOptions2.find((option) => option.isCorrect);
          if (correctOption && studentAnswer.selectedOptionId === correctOption.id) {
            totalScore += question.points || 1;
            console.log(`Question ${question.id}: Correct! (+${question.points || 1} points)`);
          } else {
            console.log(`Question ${question.id}: Incorrect`);
          }
          autoScoredQuestions++;
        } else {
          console.log(`Question ${question.id}: No answer provided`);
        }
      } else {
        console.log(`Question ${question.id}: Essay type, requires manual grading`);
      }
    }
    const existingResults = await storage2.getExamResultsByStudent(session.studentId);
    const existingResult = existingResults.find((r) => r.examId === session.examId);
    const resultData = {
      examId: session.examId,
      studentId: session.studentId,
      score: totalScore,
      maxScore: maxPossibleScore,
      autoScored: autoScoredQuestions > 0,
      recordedBy: "system-auto-scoring"
      // Indicate this was auto-generated
    };
    if (existingResult) {
      await storage2.updateExamResult(existingResult.id, resultData);
      console.log(`Updated exam result for student ${session.studentId}: ${totalScore}/${maxPossibleScore}`);
    } else {
      await storage2.recordExamResult(resultData);
      console.log(`Created exam result for student ${session.studentId}: ${totalScore}/${maxPossibleScore}`);
    }
  } catch (error) {
    console.error("Auto-scoring error:", error);
    throw error;
  }
}
async function registerRoutes(app2) {
  app2.post("/api/admin/reset-weak-passwords", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      console.log("Admin password reset requested by:", req.user?.email);
      const allRoles = await storage.getRoles();
      let allUsers = [];
      for (const role of allRoles) {
        const roleUsers = await storage.getUsersByRole(role.id);
        allUsers.push(...roleUsers);
      }
      const usersToUpdate = [];
      for (const user of allUsers) {
        if (user.passwordHash) {
          try {
            const hasWeakPassword = await bcrypt.compare("password123", user.passwordHash);
            if (hasWeakPassword) {
              usersToUpdate.push(user);
            }
          } catch (error) {
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
      const passwordUpdates = [];
      let updateCount = 0;
      for (const user of usersToUpdate) {
        try {
          const strongPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12).toUpperCase() + Math.floor(Math.random() * 100);
          const hashedPassword = await bcrypt.hash(strongPassword, BCRYPT_ROUNDS);
          const updatedUser = await storage.updateUser(user.id, { passwordHash: hashedPassword });
          if (updatedUser) {
            passwordUpdates.push({
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              newPassword: strongPassword
            });
            updateCount++;
            console.log(`\u2705 Updated password for ${user.email}`);
          }
        } catch (error) {
          console.error(`\u274C Failed to update password for ${user.email}:`, error);
        }
      }
      res.json({
        message: `Successfully updated ${updateCount} user passwords`,
        updatedCount: updateCount,
        warning: "Please securely communicate new passwords to users",
        passwordUpdates
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to reset passwords"
      });
    }
  });
  app2.get("/uploads/:filename", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), (req, res) => {
    const { filename } = req.params;
    const filePath = path.resolve("uploads", filename);
    if (!filePath.startsWith(path.resolve("uploads"))) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ message: "File not found" });
      }
    });
  });
  app2.post("/api/setup-demo", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      console.log("Setting up demo data...");
      try {
        const existingRoles = await storage.getRoles();
        console.log("Existing roles:", existingRoles.length);
        if (existingRoles.length === 0) {
          console.log("No roles found in database");
          return res.json({
            message: "No roles found. Database tables may need to be created first.",
            rolesCount: 0
          });
        }
        const demoUsers = [
          {
            email: "student@demo.com",
            firstName: "John",
            lastName: "Doe",
            roleId: existingRoles.find((r) => r.name === "Student")?.id || existingRoles[0].id
          },
          {
            email: "teacher@demo.com",
            firstName: "Jane",
            lastName: "Smith",
            roleId: existingRoles.find((r) => r.name === "Teacher")?.id || existingRoles[0].id
          },
          {
            email: "parent@demo.com",
            firstName: "Bob",
            lastName: "Johnson",
            roleId: existingRoles.find((r) => r.name === "Parent")?.id || existingRoles[0].id
          },
          {
            email: "admin@demo.com",
            firstName: "Admin",
            lastName: "User",
            roleId: existingRoles.find((r) => r.name === "Admin")?.id || existingRoles[0].id
          }
        ];
        let createdCount = 0;
        for (const userData of demoUsers) {
          try {
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
          roles: existingRoles.map((r) => r.name)
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        res.status(500).json({
          message: "Database connection failed",
          error: dbError instanceof Error ? dbError.message : "Unknown database error"
        });
      }
    } catch (error) {
      console.error("Setup demo error:", error);
      res.status(500).json({ message: "Setup failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      console.log("Login attempt for email:", req.body.email || "unknown");
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";
      const attemptKey = `${clientIp}:${req.body.email || "no-email"}`;
      const now = Date.now();
      for (const [key, data] of Array.from(loginAttempts.entries())) {
        if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
          loginAttempts.delete(key);
        }
      }
      const attempts = loginAttempts.get(attemptKey) || { count: 0, lastAttempt: 0 };
      if (attempts.count >= MAX_LOGIN_ATTEMPTS && now - attempts.lastAttempt < RATE_LIMIT_WINDOW) {
        console.warn(`Rate limit exceeded for ${attemptKey}`);
        return res.status(429).json({
          message: "Too many login attempts. Please try again in 15 minutes."
        });
      }
      const { email, password } = loginSchema.parse(req.body);
      loginAttempts.set(attemptKey, {
        count: attempts.count + 1,
        lastAttempt: now
      });
      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`Login failed: User not found for email ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!user.passwordHash) {
        console.error(`SECURITY WARNING: User ${email} has no password hash set`);
        return res.status(401).json({ message: "Account setup incomplete. Please contact administrator." });
      }
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log(`Login failed: Invalid password for email ${email}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      loginAttempts.delete(attemptKey);
      const userId = typeof user.id === "string" ? user.id : String(user.id);
      const tokenPayload = {
        userId,
        email: user.email,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1e3)
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
      console.error("Login error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid email or password format" });
      }
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });
  app2.post("/api/contact", async (req, res) => {
    try {
      const data = contactSchema.parse(req.body);
      const contactMessageData = insertContactMessageSchema.parse({
        name: data.name,
        email: data.email,
        message: data.message,
        subject: null,
        // Can be extended later if needed
        isRead: false
      });
      const savedMessage = await storage.createContactMessage(contactMessageData);
      console.log("\u2705 Contact form saved to database:", { id: savedMessage.id, email: data.email });
      res.json({
        message: "Message sent successfully! We'll get back to you soon.",
        id: savedMessage.id
      });
    } catch (error) {
      console.error("\u274C Contact form error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to send message. Please try again." });
    }
  });
  app2.get("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { role } = req.query;
      let users2 = [];
      if (role && typeof role === "string") {
        const userRole = await storage.getRoleByName(role);
        if (userRole) {
          users2 = await storage.getUsersByRole(userRole.id);
        } else {
          users2 = [];
        }
      } else {
        const allRoles = await storage.getRoles();
        users2 = [];
        for (const userRole of allRoles) {
          const roleUsers = await storage.getUsersByRole(userRole.id);
          users2.push(...roleUsers);
        }
      }
      const sanitizedUsers = users2.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { password, ...otherUserData } = req.body;
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const userData = insertUserSchema.parse({
        ...otherUserData,
        passwordHash
      });
      const user = await storage.createUser(userData);
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("User creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid user data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  app2.put("/api/users/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { password, passwordHash, ...otherUserData } = req.body;
      if (passwordHash) {
        return res.status(400).json({ message: "Direct password hash modification not allowed" });
      }
      let updateData = otherUserData;
      if (password) {
        if (typeof password !== "string" || password.length < 6) {
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
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });
  app2.delete("/api/users/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
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
  app2.get("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.query;
      let students2 = [];
      if (classId && typeof classId === "string") {
        students2 = await storage.getStudentsByClass(parseInt(classId));
      } else {
        students2 = await storage.getAllStudents();
      }
      res.json(students2);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.post("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      res.json(student);
    } catch (error) {
      res.status(400).json({ message: "Invalid student data" });
    }
  });
  app2.get("/api/classes", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const classes2 = await storage.getClasses();
      res.json(classes2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.post("/api/classes", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const classData = {
        name: req.body.name,
        level: req.body.level,
        classTeacherId: req.body.classTeacherId,
        capacity: req.body.capacity
      };
      const classObj = await storage.createClass(classData);
      res.json(classObj);
    } catch (error) {
      res.status(400).json({ message: "Invalid class data" });
    }
  });
  app2.put("/api/classes/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const classData = {
        name: req.body.name,
        level: req.body.level,
        classTeacherId: req.body.classTeacherId,
        capacity: req.body.capacity
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
  app2.delete("/api/classes/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
  app2.get("/api/subjects", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const subjects2 = await storage.getSubjects();
      res.json(subjects2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });
  app2.post("/api/subjects", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const subjectData = {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description
      };
      const subject = await storage.createSubject(subjectData);
      res.json(subject);
    } catch (error) {
      res.status(400).json({ message: "Invalid subject data" });
    }
  });
  app2.put("/api/subjects/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const subjectData = {
        name: req.body.name,
        code: req.body.code,
        description: req.body.description
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
  app2.delete("/api/subjects/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
  app2.post("/api/attendance", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse(req.body);
      const attendance2 = await storage.recordAttendance(attendanceData);
      res.json(attendance2);
    } catch (error) {
      res.status(400).json({ message: "Invalid attendance data" });
    }
  });
  app2.get("/api/attendance/:studentId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId } = req.params;
      const { date: date2 } = req.query;
      const attendance2 = await storage.getAttendanceByStudent(
        studentId,
        typeof date2 === "string" ? date2 : void 0
      );
      res.json(attendance2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });
  app2.get("/api/attendance/class/:classId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.params;
      const { date: date2 } = req.query;
      if (!date2 || typeof date2 !== "string") {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const attendance2 = await storage.getAttendanceByClass(parseInt(classId), date2);
      res.json(attendance2);
    } catch (error) {
      console.error("Error fetching class attendance:", error);
      res.status(500).json({ message: "Failed to fetch class attendance" });
    }
  });
  app2.post("/api/exams", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log("Exam creation request body:", JSON.stringify(req.body, null, 2));
      const examData = insertExamSchema.omit({ createdBy: true }).parse(req.body);
      console.log("Parsed exam data:", JSON.stringify(examData, null, 2));
      const examWithCreator = { ...examData, createdBy: req.user.id };
      console.log("Final exam data with creator:", JSON.stringify(examWithCreator, null, 2));
      const exam = await storage.createExam(examWithCreator);
      res.json(exam);
    } catch (error) {
      console.error("Exam creation error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: "Invalid exam data", details: error.message });
      } else {
        res.status(400).json({ message: "Invalid exam data" });
      }
    }
  });
  app2.get("/api/exams", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      let exams2 = [];
      if (user.roleId === ROLES.STUDENT) {
        const student = await storage.getStudent(user.id);
        if (student && student.classId) {
          const classExams = await storage.getExamsByClass(student.classId);
          exams2 = classExams.filter((exam) => exam.isPublished);
        }
      } else {
        if (user.roleId === ROLES.TEACHER) {
          const allExams = await storage.getAllExams();
          exams2 = allExams.filter((exam) => exam.createdBy === user.id);
        } else {
          exams2 = await storage.getAllExams();
        }
      }
      res.json(exams2);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });
  app2.get("/api/exams/class/:classId", authenticateUser, async (req, res) => {
    try {
      const { classId } = req.params;
      const exams2 = await storage.getExamsByClass(parseInt(classId));
      res.json(exams2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams for class" });
    }
  });
  app2.get("/api/exams/:id", authenticateUser, async (req, res) => {
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
  app2.put("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const existingExam = await storage.getExamById(parseInt(id));
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (req.user.roleId === ROLES.TEACHER && existingExam.createdBy !== req.user.id) {
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
  app2.delete("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const existingExam = await storage.getExamById(parseInt(id));
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (req.user.roleId === ROLES.TEACHER && existingExam.createdBy !== req.user.id) {
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
  app2.post("/api/exam-questions", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { options, ...questionData } = req.body;
      if (questionData.questionType) {
        questionData.questionType = String(questionData.questionType).toLowerCase().replace(/[-\s]/g, "_");
      }
      const validatedQuestion = insertExamQuestionSchema.parse(questionData);
      if (validatedQuestion.questionType === "multiple_choice") {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ message: "Multiple choice questions require at least 2 options" });
        }
        const hasCorrectAnswer = options.some((option) => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          return res.status(400).json({ message: "Multiple choice questions require at least one correct answer" });
        }
      }
      const question = await storage.createExamQuestionWithOptions(validatedQuestion, options);
      res.json(question);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid question data";
      res.status(400).json({ message });
    }
  });
  app2.get("/api/exam-questions/:examId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { examId } = req.params;
      if (user.roleId === ROLES.STUDENT) {
        const activeSession = await storage.getActiveExamSession(parseInt(examId), user.id);
        if (!activeSession) {
          return res.status(403).json({ message: "No active exam session. Start the exam first." });
        }
        if (activeSession.isCompleted) {
          return res.status(403).json({ message: "Exam session has been completed" });
        }
      } else {
        if (user.roleId === ROLES.TEACHER) {
          const exam = await storage.getExamById(parseInt(examId));
          if (!exam || exam.createdBy !== user.id) {
            return res.status(403).json({ message: "Teachers can only view questions for their own exams" });
          }
        }
      }
      const questions = await storage.getExamQuestions(parseInt(examId));
      if (user.roleId === ROLES.STUDENT) {
        const studentQuestions = questions.map((q) => ({
          ...q,
          correctAnswer: void 0,
          // Hide correct answers during exam
          explanation: void 0
          // Hide explanations during exam
        }));
        res.json(studentQuestions);
      } else {
        res.json(questions);
      }
    } catch (error) {
      console.error("Error fetching exam questions:", error);
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });
  app2.put("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
  app2.delete("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
  app2.post("/api/exam-questions/bulk", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const user = req.user;
      const { examId, questions } = req.body;
      if (!examId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Exam ID and questions array are required" });
      }
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (user.roleId === ROLES.TEACHER && exam.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only add questions to exams you created" });
      }
      const existingQuestions = await storage.getExamQuestions(examId);
      const maxOrder = existingQuestions.length > 0 ? Math.max(...existingQuestions.map((q) => q.orderNumber || 0)) : 0;
      const createdQuestions = [];
      let validationErrors = [];
      for (let i = 0; i < questions.length; i++) {
        const questionData = questions[i];
        try {
          if (questionData.questionType) {
            questionData.questionType = String(questionData.questionType).toLowerCase().replace(/[-\s]/g, "_");
          }
          const validatedQuestion = insertExamQuestionSchema.parse({
            examId,
            questionText: questionData.questionText,
            questionType: questionData.questionType,
            points: questionData.points || 1,
            orderNumber: maxOrder + i + 1
          });
          if (validatedQuestion.questionType === "multiple_choice") {
            if (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length < 2) {
              validationErrors.push(`Question ${i + 1}: Multiple choice questions require at least 2 options`);
              continue;
            }
            const hasCorrectAnswer = questionData.options.some((option) => option.isCorrect === true);
            if (!hasCorrectAnswer) {
              validationErrors.push(`Question ${i + 1}: Multiple choice questions require at least one correct answer`);
              continue;
            }
          }
          questions[i] = { ...questionData, validatedQuestion };
        } catch (error) {
          validationErrors.push(`Question ${i + 1}: ${error instanceof Error ? error.message : "Invalid question data"}`);
        }
      }
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Validation errors found",
          errors: validationErrors
        });
      }
      for (const questionData of questions) {
        try {
          const question = await storage.createExamQuestionWithOptions(
            questionData.validatedQuestion,
            questionData.options || []
          );
          createdQuestions.push(question);
        } catch (error) {
          console.error("Failed to create question:", error);
        }
      }
      res.json({
        message: `Successfully created ${createdQuestions.length} questions`,
        created: createdQuestions.length,
        questions: createdQuestions
      });
    } catch (error) {
      console.error("Bulk question upload error:", error);
      res.status(500).json({ message: "Failed to upload questions" });
    }
  });
  app2.post("/api/question-options", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const optionData = insertQuestionOptionSchema.parse(req.body);
      const option = await storage.createQuestionOption(optionData);
      res.json(option);
    } catch (error) {
      res.status(400).json({ message: "Invalid option data" });
    }
  });
  app2.get("/api/question-options/:questionId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { questionId } = req.params;
      if (user.roleId === ROLES.STUDENT) {
        const questions = await storage.getExamQuestions(0);
        const allActiveSession = await storage.getExamSessionsByStudent(user.id);
        const hasActiveSession = allActiveSession.some((session) => !session.isCompleted);
        if (!hasActiveSession) {
          return res.status(403).json({ message: "No active exam session. Start an exam first." });
        }
      } else {
        if (user.roleId === ROLES.TEACHER) {
        }
      }
      const options = await storage.getQuestionOptions(parseInt(questionId));
      const isStudentOrParent = user.roleId >= 3;
      if (isStudentOrParent) {
        const sanitizedOptions = options.map((option) => {
          const { isCorrect, ...sanitizedOption } = option;
          return sanitizedOption;
        });
        res.json(sanitizedOptions);
      } else {
        res.json(options);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question options" });
    }
  });
  app2.post("/api/exam-results", authenticateUser, async (req, res) => {
    try {
      const resultData = insertExamResultSchema.parse(req.body);
      if (req.user.roleId >= 3) {
        return res.status(403).json({ message: "Students cannot submit exam results directly" });
      }
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
  app2.get("/api/exam-results/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Students can only view their own exam results" });
      }
      const results = await storage.getExamResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });
  app2.get("/api/exam-results/exam/:examId", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { examId } = req.params;
      const results = await storage.getExamResultsByExam(parseInt(examId));
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });
  app2.post("/api/exam-sessions", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const sessionData = insertExamSessionSchema.parse(req.body);
      if (user.roleId === ROLES.STUDENT && sessionData.studentId !== user.id) {
        return res.status(403).json({ message: "Students can only create sessions for themselves" });
      }
      const exam = await storage.getExamById(sessionData.examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (!exam.isPublished) {
        return res.status(403).json({ message: "Exam is not published" });
      }
      const now = /* @__PURE__ */ new Date();
      if (exam.startTime && now < new Date(exam.startTime)) {
        return res.status(403).json({ message: "Exam has not started yet" });
      }
      if (exam.endTime && now > new Date(exam.endTime)) {
        return res.status(403).json({ message: "Exam has ended" });
      }
      const existingSession = await storage.getActiveExamSession(sessionData.examId, sessionData.studentId);
      if (existingSession) {
        return res.status(409).json({ message: "Active exam session already exists", sessionId: existingSession.id });
      }
      if (!exam.allowRetakes) {
        const allStudentSessions = await storage.getExamSessionsByStudent(sessionData.studentId);
        const completedSession = allStudentSessions.find(
          (s) => s.examId === sessionData.examId && s.isCompleted
        );
        if (completedSession) {
          return res.status(403).json({ message: "Retakes are not allowed for this exam" });
        }
      }
      const sessionWithTimeLimit = {
        ...sessionData,
        timeRemaining: exam.timeLimit ? exam.timeLimit * 60 : null,
        // convert minutes to seconds
        startedAt: now
      };
      const session = await storage.createExamSession(sessionWithTimeLimit);
      console.log(`Created exam session ${session.id} for student ${sessionData.studentId} with ${exam.timeLimit || "unlimited"} minutes`);
      res.json(session);
    } catch (error) {
      console.error("Error creating exam session:", error);
      res.status(400).json({ message: "Invalid exam session data" });
    }
  });
  app2.get("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const session = await storage.getExamSessionById(parseInt(id));
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam session" });
    }
  });
  app2.get("/api/exam-sessions/exam/:examId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { examId } = req.params;
      if (user.roleId === ROLES.STUDENT) {
        return res.status(403).json({ message: "Students cannot view exam session lists" });
      }
      if (user.roleId === ROLES.TEACHER) {
        const exam = await storage.getExamById(parseInt(examId));
        if (!exam || exam.createdBy !== user.id) {
          return res.status(403).json({ message: "Teachers can only view sessions for their own exams" });
        }
      }
      const sessions = await storage.getExamSessionsByExam(parseInt(examId));
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam sessions" });
    }
  });
  app2.get("/api/exam-sessions/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { studentId } = req.params;
      const numericStudentId = studentId;
      const numericUserId = user.id;
      if (user.roleId === ROLES.STUDENT && numericStudentId !== numericUserId) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (user.roleId === ROLES.TEACHER) {
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
      const sessions = await storage.getExamSessionsByStudent(studentId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student exam sessions" });
    }
  });
  app2.get("/api/exam-sessions/active/:examId/:studentId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { examId, studentId } = req.params;
      if (user.roleId === ROLES.STUDENT && studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const session = await storage.getActiveExamSession(parseInt(examId), studentId);
      res.json(session || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active exam session" });
    }
  });
  app2.put("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const existingSession = await storage.getExamSessionById(parseInt(id));
      if (!existingSession) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (user.roleId === ROLES.STUDENT && existingSession.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const sessionData = insertExamSessionSchema.partial().parse(req.body);
      const { examId, studentId, ...allowedUpdates } = sessionData;
      if (examId || studentId) {
        return res.status(400).json({ message: "Cannot change examId or studentId" });
      }
      if (allowedUpdates.isCompleted === true && existingSession.timeRemaining && existingSession.startedAt) {
        const now = /* @__PURE__ */ new Date();
        const timeElapsedInSeconds = (now.getTime() - new Date(existingSession.startedAt).getTime()) / 1e3;
        if (timeElapsedInSeconds > existingSession.timeRemaining) {
          console.log(`Session ${id} completion after time limit: ${(timeElapsedInSeconds / 60).toFixed(1)} > ${(existingSession.timeRemaining / 60).toFixed(1)} minutes`);
        }
      }
      if (allowedUpdates.isCompleted === true && !existingSession.isCompleted) {
        try {
          console.log("Triggering auto-scoring for session:", id);
          await autoScoreExamSession(parseInt(id), storage);
        } catch (error) {
          console.error("Auto-scoring failed:", error);
        }
      }
      const session = await storage.updateExamSession(parseInt(id), allowedUpdates);
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Error updating exam session:", error);
      res.status(400).json({ message: "Invalid exam session data" });
    }
  });
  app2.delete("/api/exam-sessions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
  app2.post("/api/student-answers", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const answerData = insertStudentAnswerSchema.parse(req.body);
      const session = await storage.getExamSessionById(answerData.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      if (session.isCompleted) {
        return res.status(409).json({ message: "Cannot submit answers to completed exam" });
      }
      if (session.timeRemaining && session.startedAt) {
        const now = /* @__PURE__ */ new Date();
        const timeElapsedInMinutes = (now.getTime() - new Date(session.startedAt).getTime()) / (1e3 * 60);
        if (timeElapsedInMinutes > session.timeRemaining) {
          console.log(`Time limit exceeded for session ${session.id}: ${timeElapsedInMinutes.toFixed(1)} > ${session.timeRemaining} minutes`);
          await storage.updateExamSession(session.id, { isCompleted: true });
          try {
            await autoScoreExamSession(session.id, storage);
          } catch (error) {
            console.error("Auto-scoring failed after time limit:", error);
          }
          return res.status(403).json({ message: "Time limit exceeded. Exam has been automatically submitted." });
        }
      }
      const existingAnswers = await storage.getStudentAnswers(answerData.sessionId);
      const existingAnswer = existingAnswers.find((a) => a.questionId === answerData.questionId);
      if (existingAnswer) {
        const answer = await storage.updateStudentAnswer(existingAnswer.id, answerData);
        res.json(answer);
      } else {
        const answer = await storage.createStudentAnswer(answerData);
        res.json(answer);
      }
    } catch (error) {
      console.error("Error creating/updating student answer:", error);
      if (error?.name === "ZodError" || error?.issues && Array.isArray(error.issues)) {
        const validationErrors = error.issues || [];
        return res.status(400).json({
          message: "Answer validation failed",
          type: "validation_error",
          errors: validationErrors.map((issue) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message,
            code: issue.code
          }))
        });
      }
      if (error instanceof Error) {
        if (error.message.includes("foreign key constraint")) {
          return res.status(400).json({
            message: "Invalid question or session reference",
            type: "reference_error"
          });
        }
        if (error.message.includes("unique constraint")) {
          return res.status(409).json({
            message: "Answer already exists for this question",
            type: "duplicate_error"
          });
        }
        if (error.message.includes("ECONNREFUSED") || error.message.includes("connection")) {
          return res.status(503).json({
            message: "Database temporarily unavailable. Please try again.",
            type: "connection_error"
          });
        }
      }
      res.status(500).json({
        message: "Failed to save answer. Please try again.",
        type: "server_error",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/student-answers/session/:sessionId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { sessionId } = req.params;
      const session = await storage.getExamSessionById(parseInt(sessionId));
      if (!session) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (user.roleId === ROLES.STUDENT && session.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const answers = await storage.getStudentAnswers(parseInt(sessionId));
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student answers" });
    }
  });
  app2.put("/api/student-answers/:id", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const existingAnswers = await storage.getStudentAnswers(parseInt(id));
      const answerData = insertStudentAnswerSchema.partial().parse(req.body);
      if (answerData.sessionId) {
        const session = await storage.getExamSessionById(answerData.sessionId);
        if (!session) {
          return res.status(404).json({ message: "Exam session not found" });
        }
        if (user.roleId >= 3 && session.studentId !== user.id) {
          return res.status(403).json({ message: "Access denied" });
        }
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
      console.error("Error updating student answer:", error);
      res.status(400).json({ message: "Invalid student answer data" });
    }
  });
  app2.get("/api/announcements", async (req, res) => {
    try {
      const { role } = req.query;
      const announcements2 = await storage.getAnnouncements(
        typeof role === "string" ? role : void 0
      );
      res.json(announcements2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });
  app2.post("/api/announcements", async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement(announcementData);
      res.json(announcement);
    } catch (error) {
      res.status(400).json({ message: "Invalid announcement data" });
    }
  });
  app2.put("/api/announcements/:id", async (req, res) => {
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
  app2.delete("/api/announcements/:id", async (req, res) => {
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
  app2.get("/api/messages/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const messages2 = await storage.getMessagesByUser(userId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });
  app2.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.sendMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });
  app2.get("/api/gallery", async (req, res) => {
    try {
      const { categoryId } = req.query;
      const images = await storage.getGalleryImages(
        categoryId && typeof categoryId === "string" ? parseInt(categoryId) : void 0
      );
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });
  app2.get("/api/gallery/categories", async (req, res) => {
    try {
      const categories = await storage.getGalleryCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch gallery categories" });
    }
  });
  app2.get("/api/terms", async (req, res) => {
    try {
      const terms = await storage.getTerms();
      res.json(terms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch terms" });
    }
  });
  app2.get("/api/terms/current", async (req, res) => {
    try {
      const term = await storage.getCurrentTerm();
      res.json(term);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch current term" });
    }
  });
  app2.get("/api/reports/overview", async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ message: "Failed to fetch analytics overview" });
    }
  });
  app2.get("/api/reports/performance", async (req, res) => {
    try {
      const { classId, subjectId, termId } = req.query;
      const filters = {
        classId: classId ? parseInt(classId) : void 0,
        subjectId: subjectId ? parseInt(subjectId) : void 0,
        termId: termId ? parseInt(termId) : void 0
      };
      const performance = await storage.getPerformanceAnalytics(filters);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching performance analytics:", error);
      res.status(500).json({ message: "Failed to fetch performance analytics" });
    }
  });
  app2.get("/api/reports/trends", async (req, res) => {
    try {
      const { months = 6 } = req.query;
      const trends = await storage.getTrendAnalytics(parseInt(months));
      res.json(trends);
    } catch (error) {
      console.error("Error fetching trend analytics:", error);
      res.status(500).json({ message: "Failed to fetch trend analytics" });
    }
  });
  app2.get("/api/reports/attendance", async (req, res) => {
    try {
      const { classId, startDate, endDate } = req.query;
      const filters = {
        classId: classId ? parseInt(classId) : void 0,
        startDate,
        endDate
      };
      const attendance2 = await storage.getAttendanceAnalytics(filters);
      res.json(attendance2);
    } catch (error) {
      console.error("Error fetching attendance analytics:", error);
      res.status(500).json({ message: "Failed to fetch attendance analytics" });
    }
  });
  app2.post("/api/upload/profile", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), upload.single("profileImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      const imageUrl = `/uploads/profiles/${req.file.filename}`;
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
      console.error("Profile upload error:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });
  app2.post("/api/upload/gallery", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), upload.single("galleryImage"), async (req, res) => {
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
      console.error("Gallery upload error:", error);
      res.status(500).json({ message: "Failed to upload gallery image" });
    }
  });
  app2.get("/uploads/*", async (req, res) => {
    try {
      const requestedPath = req.path;
      const normalizedPath = path.normalize(requestedPath);
      if (!normalizedPath.startsWith("/uploads/")) {
        return res.status(403).json({ message: "Access denied" });
      }
      const pathParts = normalizedPath.split("/");
      if (pathParts.length < 3 || !["profiles", "gallery"].includes(pathParts[2])) {
        return res.status(403).json({ message: "Invalid file path" });
      }
      const safePath = path.join(process.cwd(), normalizedPath);
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!safePath.startsWith(uploadsDir)) {
        return res.status(403).json({ message: "Access denied" });
      }
      try {
        await fs.access(safePath);
        res.sendFile(safePath);
      } catch (accessError) {
        res.status(404).json({ message: "File not found" });
      }
    } catch (error) {
      console.error("File serving error:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
  app2.delete("/api/gallery/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getGalleryImageById(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      const filePath = path.join(process.cwd(), image.imageUrl);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error("File deletion error:", fileError);
      }
      const success = await storage.deleteGalleryImage(id);
      if (!success) {
        return res.status(404).json({ message: "Failed to delete image record" });
      }
      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Image deletion error:", error);
      res.status(500).json({ message: "Failed to delete image" });
    }
  });
  app2.delete("/api/users/:userId/profile-image", authenticateUser, async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.profileImageUrl) {
        const filePath = path.join(process.cwd(), user.profileImageUrl);
        try {
          await fs.unlink(filePath);
        } catch (fileError) {
          console.error("File deletion error:", fileError);
        }
      }
      const updatedUser = await storage.updateUser(userId, { profileImageUrl: null });
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update user record" });
      }
      res.json({ message: "Profile image deleted successfully", user: updatedUser });
    } catch (error) {
      console.error("Profile image deletion error:", error);
      res.status(500).json({ message: "Failed to delete profile image" });
    }
  });
  app2.get("/api/gallery", async (req, res) => {
    try {
      const images = await storage.getGalleryImages();
      res.json(images);
    } catch (error) {
      console.error("Gallery fetch error:", error);
      res.status(500).json({ message: "Failed to fetch gallery images" });
    }
  });
  app2.get("/api/gallery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getGalleryImageById(id);
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json(image);
    } catch (error) {
      console.error("Gallery image fetch error:", error);
      res.status(500).json({ message: "Failed to fetch gallery image" });
    }
  });
  app2.delete("/api/gallery/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGalleryImage(id);
      if (!deleted) {
        return res.status(404).json({ message: "Image not found" });
      }
      res.json({ message: "Gallery image deleted successfully" });
    } catch (error) {
      console.error("Gallery delete error:", error);
      res.status(500).json({ message: "Failed to delete gallery image" });
    }
  });
  app2.get("/api/homepage-content", async (req, res) => {
    try {
      const { contentType } = req.query;
      let contentTypes = [];
      if (contentType) {
        if (Array.isArray(contentType)) {
          contentTypes = contentType;
        } else {
          contentTypes = [contentType];
        }
      }
      if (contentTypes.length === 0) {
        const content = await storage.getHomePageContent();
        return res.json(content);
      }
      const allContent = [];
      for (const type of contentTypes) {
        const content = await storage.getHomePageContent(type);
        if (content && Array.isArray(content)) {
          allContent.push(...content);
        }
      }
      const uniqueContent = allContent.filter(
        (item, index, self) => index === self.findIndex((t) => t.id === item.id)
      );
      res.json(uniqueContent);
    } catch (error) {
      console.error("Home page content fetch error:", error);
      res.status(500).json({ message: "Failed to fetch home page content" });
    }
  });
  app2.post("/api/homepage-content", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const contentData = insertHomePageContentSchema.parse(req.body);
      const content = await storage.createHomePageContent(contentData);
      res.json(content);
    } catch (error) {
      console.error("Home page content creation error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid content data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to create home page content" });
    }
  });
  app2.put("/api/homepage-content/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const contentData = insertHomePageContentSchema.partial().parse(req.body);
      const content = await storage.updateHomePageContent(parseInt(id), contentData);
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      res.json(content);
    } catch (error) {
      console.error("Home page content update error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid content data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update home page content" });
    }
  });
  app2.delete("/api/homepage-content/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const content = await storage.getHomePageContentById(parseInt(id));
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      const deleted = await storage.deleteHomePageContent(parseInt(id));
      if (!deleted) {
        return res.status(404).json({ message: "Content not found" });
      }
      if (content.imageUrl) {
        try {
          const filePath = content.imageUrl.startsWith("/") ? content.imageUrl.substring(1) : content.imageUrl;
          const fullPath = path.resolve(filePath);
          try {
            await fs.access(fullPath);
            await fs.unlink(fullPath);
            console.log(`Successfully deleted file: ${fullPath}`);
          } catch (fileError) {
            if (fileError.code === "ENOENT") {
              console.warn(`File not found (already deleted?): ${fullPath}`);
            } else {
              console.error(`Failed to delete file ${fullPath}:`, fileError);
            }
          }
        } catch (pathError) {
          console.error("Error processing file path for deletion:", pathError);
        }
      }
      res.json({ message: "Home page content deleted successfully" });
    } catch (error) {
      console.error("Home page content delete error:", error);
      res.status(500).json({ message: "Failed to delete home page content" });
    }
  });
  app2.post("/api/upload/homepage", authenticateUser, authorizeRoles(ROLES.ADMIN), upload.single("homePageImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const { contentType, altText, caption, displayOrder } = req.body;
      if (!contentType) {
        return res.status(400).json({ message: "Content type is required" });
      }
      const imageUrl = `/uploads/homepage/${req.file.filename}`;
      const homePageContent2 = await storage.createHomePageContent({
        contentType,
        imageUrl,
        altText: altText || null,
        caption: caption || null,
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
        isActive: true,
        uploadedBy: req.user.id
      });
      res.json({
        message: "Home page image uploaded successfully",
        content: homePageContent2
      });
    } catch (error) {
      console.error("Home page upload error:", error);
      res.status(500).json({ message: "Failed to upload home page image" });
    }
  });
  app2.get("/api/debug/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const allRoles = await storage.getRoles();
      const allUsers = [];
      for (const role of allRoles) {
        const users2 = await storage.getUsersByRole(role.id);
        for (const user of users2) {
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
      console.error("Debug users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });
  app2.patch("/api/users/:id/role", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      if (!roleId || ![ROLES.STUDENT, ROLES.TEACHER, ROLES.PARENT, ROLES.ADMIN].includes(roleId)) {
        return res.status(400).json({ message: "Invalid role ID" });
      }
      const updatedUser = await storage.updateUser(id, { roleId });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log(`Admin ${req.user.email} updated user ${id} roleId to ${roleId}`);
      res.json({ message: "User role updated successfully", user: updatedUser });
    } catch (error) {
      console.error("User role update error:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  const isProduction = process.env.NODE_ENV === "production";
  let capturedJsonResponse = void 0;
  if (!isProduction) {
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (!isProduction && capturedJsonResponse) {
        const sanitizedResponse = sanitizeLogData(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
function sanitizeLogData(data) {
  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }
  if (data && typeof data === "object") {
    const sanitized = { ...data };
    const sensitiveFields = ["password", "token", "jwt", "secret", "key", "auth", "session"];
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = "[REDACTED]";
      }
    }
    for (const key in sanitized) {
      if (sanitized[key] && typeof sanitized[key] === "object") {
        sanitized[key] = sanitizeLogData(sanitized[key]);
      }
    }
    return sanitized;
  }
  return data;
}
(async () => {
  try {
    log("Applying database migrations...");
    await migrate(exportDb, { migrationsFolder: "./migrations" });
    log("\u2705 Database migrations completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isIdempotencyError = errorMessage.includes("already exists") || errorMessage.includes("relation") && errorMessage.includes("already exists") || errorMessage.includes("duplicate key") || errorMessage.includes("nothing to migrate");
    if (isIdempotencyError) {
      log(`\u2139\uFE0F Migrations already applied: ${errorMessage}`);
    } else {
      console.error(`\u{1F6A8} MIGRATION ERROR: ${errorMessage}`);
      console.error(error);
      log(`\u26A0\uFE0F Migration failed: ${errorMessage}`);
      if (process.env.NODE_ENV === "production") {
        console.error("Production migration failure detected. Review required.");
      }
    }
  }
  app.all(["/api/update-demo-users", "/api/test-update"], (req, res) => {
    log(`\u{1F6A8} BLOCKED dangerous route: ${req.method} ${req.path}`);
    res.status(410).json({ message: "Gone - Route disabled for security" });
  });
  const server = await registerRoutes(app);
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`ERROR: ${req.method} ${req.path} - ${err.message}`);
    console.error(err.stack);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
