var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/auth-utils.ts
var auth_utils_exports = {};
__export(auth_utils_exports, {
  generatePassword: () => generatePassword,
  generateUsername: () => generateUsername,
  getNextUserNumber: () => getNextUserNumber,
  getRoleIdFromCode: () => getRoleIdFromCode,
  isValidThsUsername: () => isValidThsUsername,
  parseUsername: () => parseUsername
});
function generateRandomString(length) {
  const crypto = __require("crypto");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
function generateUsername(roleId, year, optional = "", number) {
  const roleCode = ROLE_CODES[roleId] || "USR";
  const paddedNumber = String(number).padStart(3, "0");
  if (optional) {
    return `THS-${roleCode}-${year}-${optional}-${paddedNumber}`;
  }
  return `THS-${roleCode}-${year}-${paddedNumber}`;
}
function generatePassword(year) {
  const randomPart = generateRandomString(12);
  return `THS@${year}#${randomPart}`;
}
function parseUsername(username) {
  const parts = username.split("-");
  if (parts.length < 4 || parts[0] !== "THS") {
    return null;
  }
  if (parts.length === 4) {
    return {
      prefix: parts[0],
      roleCode: parts[1],
      year: parts[2],
      number: parts[3]
    };
  } else if (parts.length === 5) {
    return {
      prefix: parts[0],
      roleCode: parts[1],
      year: parts[2],
      optional: parts[3],
      number: parts[4]
    };
  }
  return null;
}
function getNextUserNumber(existingUsernames, roleId, year, optional = "") {
  const roleCode = ROLE_CODES[roleId] || "USR";
  const prefix = optional ? `THS-${roleCode}-${year}-${optional}-` : `THS-${roleCode}-${year}-`;
  const numbers = existingUsernames.filter((username) => username.startsWith(prefix)).map((username) => {
    const parts = username.split("-");
    const numStr = parts[parts.length - 1];
    return parseInt(numStr, 10);
  }).filter((num) => !isNaN(num));
  if (numbers.length === 0) {
    return 1;
  }
  return Math.max(...numbers) + 1;
}
function isValidThsUsername(username) {
  const parsed = parseUsername(username);
  if (!parsed) return false;
  const validRoleCodes = ["ADM", "TCH", "STU", "PAR"];
  if (!validRoleCodes.includes(parsed.roleCode)) return false;
  if (!/^\d{4}$/.test(parsed.year)) return false;
  if (!/^\d{3}$/.test(parsed.number)) return false;
  if (parsed.optional && !/^[A-Z0-9]{2,4}$/i.test(parsed.optional)) return false;
  return true;
}
function getRoleIdFromCode(roleCode) {
  const entries = Object.entries(ROLE_CODES);
  for (const [id, code] of entries) {
    if (code === roleCode) {
      return parseInt(id, 10);
    }
  }
  return null;
}
var ROLE_CODES;
var init_auth_utils = __esm({
  "server/auth-utils.ts"() {
    "use strict";
    ROLE_CODES = {
      1: "ADM",
      // Admin
      2: "TCH",
      // Teacher
      3: "STU",
      // Student
      4: "PAR"
      // Parent
    };
  }
});

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
  auditLogs: () => auditLogs,
  classes: () => classes,
  contactMessages: () => contactMessages,
  createQuestionOptionSchema: () => createQuestionOptionSchema,
  createStudentSchema: () => createStudentSchema,
  examQuestions: () => examQuestions,
  examResults: () => examResults,
  examSessions: () => examSessions,
  examTypeEnum: () => examTypeEnum,
  exams: () => exams,
  gallery: () => gallery,
  galleryCategories: () => galleryCategories,
  genderEnum: () => genderEnum,
  gradingTasks: () => gradingTasks,
  homePageContent: () => homePageContent,
  insertAnnouncementSchema: () => insertAnnouncementSchema,
  insertAttendanceSchema: () => insertAttendanceSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertClassSchema: () => insertClassSchema,
  insertContactMessageSchema: () => insertContactMessageSchema,
  insertExamQuestionSchema: () => insertExamQuestionSchema,
  insertExamResultSchema: () => insertExamResultSchema,
  insertExamSchema: () => insertExamSchema,
  insertExamSessionSchema: () => insertExamSessionSchema,
  insertGalleryCategorySchema: () => insertGalleryCategorySchema,
  insertGallerySchema: () => insertGallerySchema,
  insertGradingTaskSchema: () => insertGradingTaskSchema,
  insertHomePageContentSchema: () => insertHomePageContentSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertPerformanceEventSchema: () => insertPerformanceEventSchema,
  insertQuestionOptionSchema: () => insertQuestionOptionSchema,
  insertReportCardItemSchema: () => insertReportCardItemSchema,
  insertReportCardSchema: () => insertReportCardSchema,
  insertRoleSchema: () => insertRoleSchema,
  insertStudentAnswerSchema: () => insertStudentAnswerSchema,
  insertStudentSchema: () => insertStudentSchema,
  insertStudyResourceSchema: () => insertStudyResourceSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertTeacherClassAssignmentSchema: () => insertTeacherClassAssignmentSchema,
  insertUserSchema: () => insertUserSchema,
  messages: () => messages,
  passwordResetTokens: () => passwordResetTokens,
  performanceEvents: () => performanceEvents,
  questionOptions: () => questionOptions,
  reportCardItems: () => reportCardItems,
  reportCardStatusEnum: () => reportCardStatusEnum,
  reportCards: () => reportCards,
  roles: () => roles,
  studentAnswers: () => studentAnswers,
  students: () => students,
  studyResources: () => studyResources,
  subjects: () => subjects,
  teacherClassAssignments: () => teacherClassAssignments,
  updateExamSessionSchema: () => updateExamSessionSchema,
  users: () => users
});
import { sql, eq } from "drizzle-orm";
import { pgTable, text, varchar, uuid, bigserial, bigint, integer, date, boolean, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var genderEnum = pgEnum("gender", ["Male", "Female", "Other"]);
var attendanceStatusEnum = pgEnum("attendance_status", ["Present", "Absent", "Late", "Excused"]);
var reportCardStatusEnum = pgEnum("report_card_status", ["draft", "finalized", "published"]);
var examTypeEnum = pgEnum("exam_type", ["test", "exam"]);
var roles = pgTable("roles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  permissions: text("permissions").array().default(sql`'{}'::text[]`),
  createdAt: timestamp("created_at").defaultNow()
});
var users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: text("password_hash"),
  mustChangePassword: boolean("must_change_password").default(true),
  roleId: bigint("role_id", { mode: "number" }).references(() => roles.id).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  dateOfBirth: date("date_of_birth"),
  gender: genderEnum("gender"),
  profileImageUrl: text("profile_image_url"),
  isActive: boolean("is_active").default(true),
  authProvider: varchar("auth_provider", { length: 20 }).default("local"),
  googleId: varchar("google_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  passwordResetTokensUserIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  passwordResetTokensTokenIdx: index("password_reset_tokens_token_idx").on(table.token)
}));
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
  emergencyContact: varchar("emergency_contact", { length: 20 }),
  medicalInfo: text("medical_info"),
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
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id).notNull(),
  subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id).notNull(),
  totalMarks: integer("total_marks").notNull(),
  date: text("date").notNull(),
  // Store as YYYY-MM-DD string to avoid Date object conversion
  termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  // Exam type: 'test' (40 marks) or 'exam' (60 marks)
  examType: examTypeEnum("exam_type").notNull().default("exam"),
  // Enhanced exam delivery fields
  timeLimit: integer("time_limit"),
  // in minutes
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  instructions: text("instructions"),
  isPublished: boolean("is_published").default(false),
  allowRetakes: boolean("allow_retakes").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  // Enhanced auto-grading features (will be added via migration)
  autoGradingEnabled: boolean("auto_grading_enabled").default(true),
  instantFeedback: boolean("instant_feedback").default(false),
  // Show correct/incorrect immediately
  showCorrectAnswers: boolean("show_correct_answers").default(false),
  // Show answers after submission
  passingScore: integer("passing_score"),
  // Minimum score to pass (percentage)
  gradingScale: text("grading_scale").default("standard")
  // 'standard', 'custom'
});
var examQuestions = pgTable("exam_questions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(),
  // 'multiple_choice', 'text', 'essay', 'true_false', 'fill_blank'
  points: integer("points").default(1),
  orderNumber: integer("order_number").notNull(),
  imageUrl: text("image_url"),
  // for questions with images
  // Enhanced auto-grading features
  autoGradable: boolean("auto_gradable").default(true),
  // Can this question be auto-graded?
  expectedAnswers: text("expected_answers").array(),
  // For text questions - expected answer variations
  caseSensitive: boolean("case_sensitive").default(false),
  // For text answers
  allowPartialCredit: boolean("allow_partial_credit").default(false),
  partialCreditRules: text("partial_credit_rules"),
  // JSON config for partial credit
  explanationText: text("explanation_text"),
  // Explanation shown after answering
  hintText: text("hint_text"),
  // Optional hint for students
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // PERFORMANCE INDEX: Critical for scoring JOIN queries
  examQuestionsExamIdIdx: index("exam_questions_exam_id_idx").on(table.examId),
  examQuestionsOrderIdx: index("exam_questions_order_idx").on(table.examId, table.orderNumber)
}));
var questionOptions = pgTable("question_options", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  questionId: bigint("question_id", { mode: "number" }).references(() => examQuestions.id).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  orderNumber: integer("order_number").notNull(),
  // Enhanced auto-grading features
  partialCreditValue: integer("partial_credit_value").default(0),
  // Points if selected (for partial credit)
  explanationText: text("explanation_text"),
  // Why this option is correct/incorrect
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // PERFORMANCE INDEX: Critical for scoring JOIN queries - find correct options fast
  questionOptionsQuestionIdIdx: index("question_options_question_id_idx").on(table.questionId),
  questionOptionsCorrectIdx: index("question_options_correct_idx").on(table.questionId, table.isCorrect)
}));
var examSessions = pgTable("exam_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
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
}, (table) => ({
  // PERFORMANCE INDEX: Critical for session lookups
  examSessionsExamStudentIdx: index("exam_sessions_exam_student_idx").on(table.examId, table.studentId),
  examSessionsStudentCompletedIdx: index("exam_sessions_student_completed_idx").on(table.studentId, table.isCompleted),
  examSessionsActiveSessionsIdx: index("exam_sessions_active_idx").on(table.examId, table.studentId, table.isCompleted),
  // UNIQUE CONSTRAINT: Prevent duplicate active sessions (critical for circuit breaker fix)
  examSessionsActiveUniqueIdx: uniqueIndex("exam_sessions_active_unique_idx").on(table.examId, table.studentId).where(eq(table.isCompleted, false))
}));
var studentAnswers = pgTable("student_answers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id).notNull(),
  questionId: bigint("question_id", { mode: "number" }).references(() => examQuestions.id).notNull(),
  selectedOptionId: bigint("selected_option_id", { mode: "number" }).references(() => questionOptions.id),
  // for multiple choice
  textAnswer: text("text_answer"),
  // for text/essay questions
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
  answeredAt: timestamp("answered_at").defaultNow(),
  // Enhanced auto-grading features
  autoScored: boolean("auto_scored").default(false),
  // Was this answer auto-scored?
  manualOverride: boolean("manual_override").default(false),
  // Teacher manually adjusted score
  feedbackText: text("feedback_text"),
  // Instant feedback shown to student
  partialCreditReason: text("partial_credit_reason")
  // Why partial credit was given
}, (table) => ({
  // PERFORMANCE INDEX: Critical for scoring JOIN queries - fetch all answers for a session fast
  studentAnswersSessionIdIdx: index("student_answers_session_id_idx").on(table.sessionId),
  studentAnswersSessionQuestionIdx: index("student_answers_session_question_idx").on(table.sessionId, table.questionId),
  studentAnswersQuestionIdx: index("student_answers_question_id_idx").on(table.questionId)
}));
var examResults = pgTable("exam_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  score: integer("score"),
  maxScore: integer("max_score"),
  marksObtained: integer("marks_obtained"),
  // Legacy field for backward compatibility
  grade: varchar("grade", { length: 5 }),
  remarks: text("remarks"),
  autoScored: boolean("auto_scored").default(false),
  recordedBy: uuid("recorded_by").notNull(),
  // UUID field to match database schema
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // PERFORMANCE INDEX: Critical for fast result lookups by exam/student
  examResultsExamIdIdx: index("exam_results_exam_id_idx").on(table.examId),
  examResultsStudentIdIdx: index("exam_results_student_id_idx").on(table.studentId),
  examResultsExamStudentIdx: index("exam_results_exam_student_idx").on(table.examId, table.studentId),
  examResultsAutoScoredIdx: index("exam_results_auto_scored_idx").on(table.autoScored, table.examId)
}));
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
var reportCards = pgTable("report_cards", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  classId: integer("class_id").references(() => classes.id).notNull(),
  termId: integer("term_id").references(() => academicTerms.id).notNull(),
  averagePercentage: integer("average_percentage"),
  // Overall percentage
  overallGrade: varchar("overall_grade", { length: 5 }),
  // A+, A, B+, etc.
  teacherRemarks: text("teacher_remarks"),
  status: reportCardStatusEnum("status").default("draft"),
  locked: boolean("locked").default(false),
  generatedAt: timestamp("generated_at").defaultNow(),
  finalizedAt: timestamp("finalized_at"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var reportCardItems = pgTable("report_card_items", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  reportCardId: integer("report_card_id").references(() => reportCards.id).notNull(),
  subjectId: integer("subject_id").references(() => subjects.id).notNull(),
  // Test and Exam scores with their respective exam IDs for reference
  testExamId: bigint("test_exam_id", { mode: "number" }).references(() => exams.id),
  testScore: integer("test_score"),
  // Score obtained in test (out of testMaxScore)
  testMaxScore: integer("test_max_score"),
  // Maximum marks for test
  testWeightedScore: integer("test_weighted_score"),
  // Normalized to 40
  examExamId: bigint("exam_exam_id", { mode: "number" }).references(() => exams.id),
  examScore: integer("exam_score"),
  // Score obtained in exam (out of examMaxScore)
  examMaxScore: integer("exam_max_score"),
  // Maximum marks for exam
  examWeightedScore: integer("exam_weighted_score"),
  // Normalized to 60
  // Combined scores
  totalMarks: integer("total_marks").notNull().default(100),
  // Always 100 for the weighted system
  obtainedMarks: integer("obtained_marks").notNull(),
  // testWeightedScore + examWeightedScore
  percentage: integer("percentage").notNull(),
  grade: varchar("grade", { length: 5 }),
  // A+, A, B+, etc.
  teacherRemarks: text("teacher_remarks"),
  createdAt: timestamp("created_at").defaultNow()
});
var studyResources = pgTable("study_resources", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  // in bytes
  resourceType: varchar("resource_type", { length: 50 }).notNull(),
  // 'past_paper', 'study_guide', 'notes', 'assignment'
  subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id),
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id),
  termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  isPublished: boolean("is_published").default(true),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow()
});
var performanceEvents = pgTable("performance_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  // 'submission', 'auto_submit', 'timeout_cleanup', 'answer_save'
  duration: integer("duration").notNull(),
  // in milliseconds
  goalAchieved: boolean("goal_achieved").notNull(),
  // whether it met the < 2000ms goal
  metadata: text("metadata"),
  // JSON string for additional data
  clientSide: boolean("client_side").default(false),
  // whether logged from client or server
  userId: uuid("user_id").references(() => users.id),
  // for attribution
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // Performance indexes for analytics queries
  performanceEventsTypeIdx: index("performance_events_type_idx").on(table.eventType),
  performanceEventsDateIdx: index("performance_events_date_idx").on(table.createdAt),
  performanceEventsGoalIdx: index("performance_events_goal_idx").on(table.goalAchieved, table.eventType)
}));
var teacherClassAssignments = pgTable("teacher_class_assignments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id).notNull(),
  subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id).notNull(),
  termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // Performance indexes for quick teacher assignment lookups
  teacherAssignmentsTeacherIdx: index("teacher_assignments_teacher_idx").on(table.teacherId, table.isActive),
  teacherAssignmentsClassSubjectIdx: index("teacher_assignments_class_subject_idx").on(table.classId, table.subjectId)
}));
var gradingTasks = pgTable("grading_tasks", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id, { onDelete: "cascade" }).notNull(),
  answerId: bigint("answer_id", { mode: "number" }).references(() => studentAnswers.id, { onDelete: "cascade" }).notNull(),
  assignedTeacherId: uuid("assigned_teacher_id").references(() => users.id),
  // Teacher assigned to grade this
  status: varchar("status", { length: 20 }).default("pending"),
  // 'pending', 'in_progress', 'completed', 'skipped'
  priority: integer("priority").default(0),
  // Higher number = higher priority
  assignedAt: timestamp("assigned_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // Performance indexes for grading queue management
  gradingTasksAssignedIdx: index("grading_tasks_assigned_idx").on(table.assignedTeacherId, table.status),
  gradingTasksStatusIdx: index("grading_tasks_status_idx").on(table.status, table.priority),
  gradingTasksSessionIdx: index("grading_tasks_session_idx").on(table.sessionId),
  // Unique constraint to prevent duplicate tasks for the same answer
  gradingTasksAnswerUniqueIdx: uniqueIndex("grading_tasks_answer_unique_idx").on(table.answerId)
}));
var auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  // Who made the change
  action: varchar("action", { length: 100 }).notNull(),
  // 'grade_change', 'manual_override', 'report_publish', etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(),
  // 'exam_result', 'student_answer', 'report_card'
  entityId: bigint("entity_id", { mode: "number" }).notNull(),
  // ID of the affected entity
  oldValue: text("old_value"),
  // JSON of old values
  newValue: text("new_value"),
  // JSON of new values
  reason: text("reason"),
  // Why the change was made
  ipAddress: varchar("ip_address", { length: 45 }),
  // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  // Performance indexes for audit queries
  auditLogsUserIdx: index("audit_logs_user_idx").on(table.userId),
  auditLogsEntityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  auditLogsDateIdx: index("audit_logs_date_idx").on(table.createdAt),
  auditLogsActionIdx: index("audit_logs_action_idx").on(table.action)
}));
var insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
var insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
var insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
var insertStudentSchema = createInsertSchema(students).omit({ createdAt: true });
var insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
var insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
var insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
var insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true }).extend({
  // Coerce string IDs to numbers (forms often send IDs as strings)
  classId: z.coerce.number().positive("Please select a valid class"),
  subjectId: z.coerce.number().positive("Please select a valid subject"),
  termId: z.coerce.number().positive("Please select a valid term"),
  totalMarks: z.coerce.number().positive("Total marks must be a positive number"),
  // Handle date string from frontend - keep as string for database with improved validation
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine((dateStr) => {
    const date2 = new Date(dateStr);
    return !isNaN(date2.getTime()) && date2.toISOString().startsWith(dateStr);
  }, "Please enter a valid date"),
  // Optional numeric fields - convert empty strings to undefined
  timeLimit: z.preprocess((val) => val === "" ? void 0 : val, z.coerce.number().int().min(1, "Time limit must be at least 1 minute").optional()),
  passingScore: z.preprocess((val) => val === "" ? void 0 : val, z.coerce.number().int().min(0).max(100, "Passing score must be between 0 and 100").optional()),
  // Optional timestamp fields - convert empty strings to undefined
  startTime: z.preprocess((val) => val === "" ? void 0 : val, z.coerce.date().optional()),
  endTime: z.preprocess((val) => val === "" ? void 0 : val, z.coerce.date().optional()),
  // Text fields - convert empty strings to undefined for optional fields
  instructions: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
  gradingScale: z.preprocess((val) => val === "" ? "standard" : val, z.string().default("standard"))
});
var insertExamResultSchema = createInsertSchema(examResults).omit({ id: true, createdAt: true });
var insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
var insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
var insertGalleryCategorySchema = createInsertSchema(galleryCategories).omit({ id: true, createdAt: true });
var insertGallerySchema = createInsertSchema(gallery).omit({ id: true, createdAt: true });
var insertHomePageContentSchema = createInsertSchema(homePageContent).omit({ id: true, createdAt: true, updatedAt: true });
var insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
var insertReportCardSchema = createInsertSchema(reportCards).omit({ id: true, createdAt: true });
var insertReportCardItemSchema = createInsertSchema(reportCardItems).omit({ id: true, createdAt: true });
var insertStudyResourceSchema = createInsertSchema(studyResources).omit({ id: true, createdAt: true, downloads: true });
var insertPerformanceEventSchema = createInsertSchema(performanceEvents).omit({ id: true, createdAt: true });
var insertTeacherClassAssignmentSchema = createInsertSchema(teacherClassAssignments).omit({ id: true, createdAt: true });
var insertGradingTaskSchema = createInsertSchema(gradingTasks).omit({ id: true, createdAt: true });
var insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
var createStudentSchema = z.object({
  // User fields  
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
  profileImageUrl: z.string().optional(),
  // Student-specific fields
  admissionNumber: z.string().min(1, "Admission number is required"),
  classId: z.coerce.number().positive("Please select a valid class"),
  parentId: z.string().uuid("Invalid parent selection").optional().nullable(),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  medicalInfo: z.string().optional()
});
var insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true, createdAt: true }).extend({
  // Coerce string IDs and numeric values to numbers (forms and CSV often send these as strings)
  examId: z.coerce.number().positive("Please select a valid exam"),
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(["multiple_choice", "text", "essay", "true_false", "fill_blank"], { required_error: "Question type is required" }),
  points: z.preprocess((val) => val === "" ? 1 : val, z.coerce.number().int().min(0, "Points must be a non-negative number").default(1)),
  orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),
  // Handle optional text fields - convert empty strings to undefined
  imageUrl: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
  expectedAnswers: z.preprocess((val) => {
    if (val === "" || val === null || val === void 0) return void 0;
    if (Array.isArray(val)) return val;
    if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter((s) => s !== "");
    return void 0;
  }, z.array(z.string()).optional()),
  explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
  hintText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
  partialCreditRules: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
  // Added fields for theory questions
  instructions: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
  sampleAnswer: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
});
var insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({ id: true, createdAt: true }).extend({
  // Coerce string IDs and numeric values to numbers
  questionId: z.coerce.number().positive("Please select a valid question"),
  orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),
  // Handle optional numeric fields - convert empty strings to undefined or 0
  partialCreditValue: z.preprocess((val) => val === "" ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)),
  // Handle optional text fields - convert empty strings to undefined
  explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
});
var createQuestionOptionSchema = insertQuestionOptionSchema.omit({ questionId: true, orderNumber: true }).extend({
  // Optional fields that can be provided during creation
  partialCreditValue: z.preprocess((val) => val === "" ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)).optional(),
  explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
});
var insertExamSessionSchema = createInsertSchema(examSessions).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  studentId: true
  // Server sets this from authenticated user
}).partial().required({
  examId: true
}).extend({
  // Handle date strings from frontend (JSON serialization converts Date objects to strings)
  submittedAt: z.union([z.date(), z.string()]).optional().transform((val) => {
    if (typeof val === "string") {
      return new Date(val);
    }
    return val;
  })
});
var updateExamSessionSchema = z.object({
  // Students can only update these specific fields when submitting exams
  isCompleted: z.boolean().optional(),
  submittedAt: z.coerce.date().refine((d) => !isNaN(d.getTime()), "Invalid date").optional(),
  timeRemaining: z.number().int().min(0).optional(),
  // Only allow valid status transitions for student updates
  status: z.enum(["in_progress", "submitted"]).optional(),
  // Server-side fields for auto-submission and tracking
  submissionMethod: z.string().optional(),
  autoSubmitted: z.boolean().optional()
}).strict();
var insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true });

// server/storage.ts
import { eq as eq2, and, desc, asc, sql as sql2, sql as dsql, inArray } from "drizzle-orm";
var pg;
var db;
function initializeDatabase() {
  if (!pg && process.env.DATABASE_URL) {
    console.log("\u{1F517} CONNECTING TO POSTGRESQL DATABASE:", process.env.DATABASE_URL.replace(/:[^:]*@/, ":***@"));
    const connectionConfig = {
      ssl: { rejectUnauthorized: false },
      // Supabase handles SSL certificates properly
      prepare: false,
      // Required for Supabase transaction pooler
      // Optimized connection pool settings
      max: 20,
      // Maximum connections in pool (increased from default 10)
      idle_timeout: 300,
      // Close idle connections after 5 minutes
      connect_timeout: 30,
      // Connection timeout: 30 seconds
      max_lifetime: 3600,
      // Maximum connection lifetime: 1 hour
      // Enhanced logging for debugging (development only)
      debug: process.env.NODE_ENV === "development" ? (connection, query, params) => {
        const queryString = typeof query === "string" ? query : query?.text || String(query);
        if (queryString?.includes("ERROR") || queryString?.includes("TIMEOUT")) {
          console.warn(`\u{1F50D} Database Debug - Query: ${queryString.slice(0, 100)}...`);
        }
      } : false,
      // Connection health checks
      onnotice: (notice) => {
        if (notice.severity === "WARNING" || notice.severity === "ERROR") {
          console.warn(`\u{1F4CA} Database Notice [${notice.severity}]: ${notice.message}`);
        }
      },
      // Connection parameter logging
      onparameter: (key, value) => {
        if (key === "server_version") {
          console.log(`\u{1F5C4}\uFE0F Connected to PostgreSQL version: ${value}`);
        } else if (key === "application_name") {
          console.log(`\u{1F4F1} Application name set: ${value}`);
        }
      },
      // Connection lifecycle events
      onconnect: async (connection) => {
        try {
          await connection.query("SET application_name = $1", ["treasure_home_school"]);
          await connection.query("SET statement_timeout = $1", ["60s"]);
          await connection.query("SET lock_timeout = $1", ["30s"]);
        } catch (error) {
          console.warn("\u26A0\uFE0F Failed to set connection parameters:", error);
        }
      }
    };
    pg = postgres(process.env.DATABASE_URL, connectionConfig);
    db = drizzle(pg, { schema: schema_exports });
    console.log("\u2705 POSTGRESQL DATABASE CONNECTION ESTABLISHED");
    console.log(`\u{1F4CA} Connection Pool: max=${connectionConfig.max}, idle_timeout=${connectionConfig.idle_timeout}s`);
  } else if (!process.env.DATABASE_URL) {
    console.log("\u26A0\uFE0F  WARNING: DATABASE_URL not set - falling back to memory storage");
  }
  return { pg, db };
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
    const result = await this.db.select().from(users).where(eq2(users.id, id)).limit(1);
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
    const result = await this.db.select().from(users).where(eq2(users.email, email)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async getUserByUsername(username) {
    const result = await this.db.select().from(users).where(eq2(users.username, username)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async getUserByGoogleId(googleId) {
    const result = await this.db.select().from(users).where(eq2(users.googleId, googleId)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async createPasswordResetToken(userId, token, expiresAt) {
    const result = await this.db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt
    }).returning();
    return result[0];
  }
  async getPasswordResetToken(token) {
    const result = await this.db.select().from(passwordResetTokens).where(and(
      eq2(passwordResetTokens.token, token),
      dsql`${passwordResetTokens.expiresAt} > NOW()`,
      dsql`${passwordResetTokens.usedAt} IS NULL`
    )).limit(1);
    return result[0];
  }
  async markPasswordResetTokenAsUsed(token) {
    const result = await this.db.update(passwordResetTokens).set({ usedAt: dsql`NOW()` }).where(eq2(passwordResetTokens.token, token)).returning();
    return result.length > 0;
  }
  async deleteExpiredPasswordResetTokens() {
    await this.db.delete(passwordResetTokens).where(dsql`${passwordResetTokens.expiresAt} < NOW()`);
    return true;
  }
  async createUser(user) {
    const result = await this.db.insert(users).values(user).returning();
    const createdUser = result[0];
    if (createdUser && createdUser.id) {
      const normalizedId = normalizeUuid(createdUser.id);
      if (normalizedId) {
        createdUser.id = normalizedId;
      }
    }
    return createdUser;
  }
  async updateUser(id, user) {
    const result = await this.db.update(users).set(user).where(eq2(users.id, id)).returning();
    const updatedUser = result[0];
    if (updatedUser && updatedUser.id) {
      const normalizedId = normalizeUuid(updatedUser.id);
      if (normalizedId) {
        updatedUser.id = normalizedId;
      }
    }
    return updatedUser;
  }
  async deleteUser(id) {
    const result = await this.db.delete(users).where(eq2(users.id, id)).returning();
    return result.length > 0;
  }
  async getUsersByRole(roleId) {
    const result = await this.db.select().from(users).where(eq2(users.roleId, roleId));
    return result.map((user) => {
      if (user && user.id) {
        const normalizedId = normalizeUuid(user.id);
        if (normalizedId) {
          user.id = normalizedId;
        }
      }
      return user;
    });
  }
  // Role management
  async getRoles() {
    return await this.db.select().from(roles);
  }
  async getRoleByName(name) {
    const result = await this.db.select().from(roles).where(eq2(roles.name, name)).limit(1);
    return result[0];
  }
  // Student management
  async getStudent(id) {
    const result = await this.db.select().from(students).where(eq2(students.id, id)).limit(1);
    const student = result[0];
    if (student && student.id) {
      const normalizedId = normalizeUuid(student.id);
      if (normalizedId) {
        student.id = normalizedId;
      }
    }
    return student;
  }
  async getAllUsernames() {
    const result = await this.db.select({ username: users.username }).from(users).where(sql2`${users.username} IS NOT NULL`);
    return result.map((r) => r.username).filter((u) => u !== null);
  }
  async createStudent(student) {
    const result = await db.insert(students).values(student).returning();
    return result[0];
  }
  async updateStudent(id, updates) {
    return await this.db.transaction(async (tx) => {
      let updatedUser;
      let updatedStudent;
      if (updates.userPatch && Object.keys(updates.userPatch).length > 0) {
        const userResult = await tx.update(users).set(updates.userPatch).where(eq2(users.id, id)).returning();
        updatedUser = userResult[0];
      } else {
        const userResult = await tx.select().from(users).where(eq2(users.id, id)).limit(1);
        updatedUser = userResult[0];
      }
      if (updates.studentPatch && Object.keys(updates.studentPatch).length > 0) {
        const studentResult = await tx.update(students).set(updates.studentPatch).where(eq2(students.id, id)).returning();
        updatedStudent = studentResult[0];
      } else {
        const studentResult = await tx.select().from(students).where(eq2(students.id, id)).limit(1);
        updatedStudent = studentResult[0];
      }
      if (updatedUser && updatedStudent) {
        return { user: updatedUser, student: updatedStudent };
      }
      return void 0;
    });
  }
  async setUserActive(id, isActive) {
    const result = await this.db.update(users).set({ isActive }).where(eq2(users.id, id)).returning();
    return result[0];
  }
  async deleteStudent(id) {
    const result = await this.db.update(users).set({ isActive: false }).where(eq2(users.id, id)).returning();
    return result.length > 0;
  }
  async hardDeleteStudent(id) {
    return await this.db.transaction(async (tx) => {
      try {
        const examSessions2 = await tx.select({ id: examSessions.id }).from(examSessions).where(eq2(examSessions.studentId, id));
        const sessionIds = examSessions2.map((session2) => session2.id);
        if (sessionIds.length > 0) {
          await tx.delete(studentAnswers).where(inArray(studentAnswers.sessionId, sessionIds));
        }
        await tx.delete(examSessions).where(eq2(examSessions.studentId, id));
        await tx.delete(examResults).where(eq2(examResults.studentId, id));
        await tx.delete(attendance).where(eq2(attendance.studentId, id));
        await tx.delete(students).where(eq2(students.id, id));
        const userResult = await tx.delete(users).where(eq2(users.id, id)).returning();
        return userResult.length > 0;
      } catch (error) {
        console.error("Error in hard delete transaction:", error);
        throw error;
      }
    });
  }
  async getStudentsByClass(classId) {
    return await db.select().from(students).where(eq2(students.classId, classId));
  }
  async getAllStudents(includeInactive = false) {
    if (includeInactive) {
      return await this.db.select().from(students).orderBy(asc(students.createdAt));
    } else {
      return await this.db.select({
        id: students.id,
        admissionNumber: students.admissionNumber,
        classId: students.classId,
        parentId: students.parentId,
        admissionDate: students.admissionDate,
        emergencyContact: students.emergencyContact,
        medicalInfo: students.medicalInfo,
        createdAt: students.createdAt
      }).from(students).innerJoin(users, eq2(students.id, users.id)).where(eq2(users.isActive, true)).orderBy(asc(students.createdAt));
    }
  }
  async getStudentByAdmissionNumber(admissionNumber) {
    const result = await db.select().from(students).where(eq2(students.admissionNumber, admissionNumber)).limit(1);
    return result[0];
  }
  // Class management
  async getClasses() {
    return await db.select().from(classes).where(eq2(classes.isActive, true)).orderBy(asc(classes.name));
  }
  async getClass(id) {
    const result = await db.select().from(classes).where(eq2(classes.id, id)).limit(1);
    return result[0];
  }
  async createClass(classData) {
    const result = await db.insert(classes).values(classData).returning();
    return result[0];
  }
  async updateClass(id, classData) {
    const result = await db.update(classes).set(classData).where(eq2(classes.id, id)).returning();
    return result[0];
  }
  async deleteClass(id) {
    const result = await db.delete(classes).where(eq2(classes.id, id));
    return result.length > 0;
  }
  // Subject management
  async getSubjects() {
    return await db.select().from(subjects).orderBy(asc(subjects.name));
  }
  async getSubject(id) {
    const result = await db.select().from(subjects).where(eq2(subjects.id, id)).limit(1);
    return result[0];
  }
  async createSubject(subject) {
    const result = await db.insert(subjects).values(subject).returning();
    return result[0];
  }
  async updateSubject(id, subject) {
    const result = await db.update(subjects).set(subject).where(eq2(subjects.id, id)).returning();
    return result[0];
  }
  async deleteSubject(id) {
    const result = await db.delete(subjects).where(eq2(subjects.id, id));
    return result.length > 0;
  }
  // Academic terms
  async getCurrentTerm() {
    const result = await db.select().from(academicTerms).where(eq2(academicTerms.isCurrent, true)).limit(1);
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
      return await db.select().from(attendance).where(and(eq2(attendance.studentId, studentId), eq2(attendance.date, date2)));
    }
    return await db.select().from(attendance).where(eq2(attendance.studentId, studentId)).orderBy(desc(attendance.date));
  }
  async getAttendanceByClass(classId, date2) {
    return await db.select().from(attendance).where(and(eq2(attendance.classId, classId), eq2(attendance.date, date2)));
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
    const result = await db.select().from(exams).where(eq2(exams.id, id)).limit(1);
    return result[0];
  }
  async getExamsByClass(classId) {
    try {
      const result = await db.select().from(exams).where(eq2(exams.classId, classId)).orderBy(desc(exams.date));
      return result || [];
    } catch (error) {
      console.error("Error in getExamsByClass:", error);
      return [];
    }
  }
  async updateExam(id, exam) {
    const result = await db.update(exams).set(exam).where(eq2(exams.id, id)).returning();
    return result[0];
  }
  async deleteExam(id) {
    try {
      await db.delete(studentAnswers).where(sql2`${studentAnswers.questionId} IN (SELECT id FROM ${examQuestions} WHERE exam_id = ${id})`);
      await db.delete(questionOptions).where(sql2`${questionOptions.questionId} IN (SELECT id FROM ${examQuestions} WHERE exam_id = ${id})`);
      await db.delete(examQuestions).where(eq2(examQuestions.examId, id));
      await db.delete(examResults).where(eq2(examResults.examId, id));
      await db.delete(examSessions).where(eq2(examSessions.examId, id));
      const result = await db.delete(exams).where(eq2(exams.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteExam:", error);
      throw error;
    }
  }
  async recordExamResult(result) {
    try {
      const examResult = await db.insert(examResults).values(result).returning();
      return examResult[0];
    } catch (error) {
      if (error?.cause?.code === "42703" && error?.cause?.message?.includes("auto_scored")) {
        console.log("\u26A0\uFE0F Database schema mismatch detected - auto_scored column missing, using fallback insert");
        const { autoScored, ...resultWithoutAutoScored } = result;
        const compatibleResult = {
          ...resultWithoutAutoScored,
          marksObtained: result.score || 0
        };
        const examResult = await db.insert(examResults).values(compatibleResult).returning();
        return {
          ...examResult[0],
          autoScored: result.recordedBy === "00000000-0000-0000-0000-000000000001",
          score: examResult[0].marksObtained || 0
        };
      }
      throw error;
    }
  }
  async updateExamResult(id, result) {
    try {
      const updated = await db.update(examResults).set(result).where(eq2(examResults.id, id)).returning();
      return updated[0];
    } catch (error) {
      if (error?.cause?.code === "42703" && error?.cause?.message?.includes("auto_scored")) {
        console.log("\u26A0\uFE0F Database schema mismatch detected - auto_scored column missing, using fallback update");
        const { autoScored, ...resultWithoutAutoScored } = result;
        const compatibleResult = {
          ...resultWithoutAutoScored,
          marksObtained: result.score || 0
        };
        const updated = await db.update(examResults).set(compatibleResult).where(eq2(examResults.id, id)).returning();
        return {
          ...updated[0],
          autoScored: result.recordedBy === "00000000-0000-0000-0000-000000000001",
          score: updated[0].marksObtained || 0
        };
      }
      throw error;
    }
  }
  async getExamResultsByStudent(studentId) {
    try {
      console.log(`\u{1F50D} Fetching exam results for student: ${studentId}`);
      const SYSTEM_AUTO_SCORING_UUID = "00000000-0000-0000-0000-000000000001";
      try {
        const results = await this.db.select({
          id: examResults.id,
          examId: examResults.examId,
          studentId: examResults.studentId,
          score: examResults.marksObtained,
          maxScore: exams.totalMarks,
          marksObtained: examResults.marksObtained,
          grade: examResults.grade,
          remarks: examResults.remarks,
          recordedBy: examResults.recordedBy,
          createdAt: examResults.createdAt,
          autoScored: sql2`COALESCE(${examResults.autoScored}, ${examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as("autoScored")
        }).from(examResults).leftJoin(exams, eq2(examResults.examId, exams.id)).where(eq2(examResults.studentId, studentId)).orderBy(desc(examResults.createdAt));
        console.log(`\u{1F4CA} Found ${results.length} exam results for student ${studentId}`);
        return results;
      } catch (mainError) {
        console.warn("Main query failed, trying fallback:", mainError);
        const fallbackResults = await this.db.select({
          id: examResults.id,
          examId: examResults.examId,
          studentId: examResults.studentId,
          marksObtained: examResults.marksObtained,
          grade: examResults.grade,
          remarks: examResults.remarks,
          recordedBy: examResults.recordedBy,
          createdAt: examResults.createdAt,
          score: examResults.marksObtained,
          maxScore: sql2`100`.as("maxScore"),
          // Default to 100 if join fails
          autoScored: sql2`(${examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as("autoScored")
        }).from(examResults).where(eq2(examResults.studentId, studentId)).orderBy(desc(examResults.createdAt));
        for (const result of fallbackResults) {
          try {
            const exam = await this.db.select({ totalMarks: exams.totalMarks }).from(exams).where(eq2(exams.id, result.examId)).limit(1);
            if (exam[0]?.totalMarks) {
              result.maxScore = exam[0].totalMarks;
            }
          } catch (examError) {
            console.warn(`Failed to get exam details for examId ${result.examId}:`, examError);
          }
        }
        console.log(`\u2705 Fallback query successful, found ${fallbackResults.length} results`);
        return fallbackResults;
      }
    } catch (error) {
      console.error(`\u274C Error fetching exam results for student ${studentId}:`, error);
      return [];
    }
  }
  async getExamResultsByExam(examId) {
    try {
      return await db.select().from(examResults).where(eq2(examResults.examId, examId)).orderBy(desc(examResults.createdAt));
    } catch (error) {
      if (error?.cause?.code === "42703" && error?.cause?.message?.includes("column") && error?.cause?.message?.includes("does not exist")) {
        console.log("\u26A0\uFE0F Database schema mismatch detected, using fallback query with existing columns only");
        try {
          return await db.select({
            id: examResults.id,
            examId: examResults.examId,
            studentId: examResults.studentId,
            marksObtained: examResults.marksObtained,
            // Use legacy field
            grade: examResults.grade,
            remarks: examResults.remarks,
            recordedBy: examResults.recordedBy,
            createdAt: examResults.createdAt,
            // Map marksObtained to score for compatibility
            score: examResults.marksObtained,
            maxScore: dsql`null`.as("maxScore"),
            // Since auto_scored column doesn't exist, determine from recordedBy
            autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as("autoScored")
          }).from(examResults).where(eq2(examResults.examId, examId)).orderBy(desc(examResults.createdAt));
        } catch (fallbackError) {
          console.error("\u274C Fallback query also failed:", fallbackError);
          return [];
        }
      }
      throw error;
    }
  }
  async getExamResultByExamAndStudent(examId, studentId) {
    const result = await db.select().from(examResults).where(
      sql2`${examResults.examId} = ${examId} AND ${examResults.studentId} = ${studentId}`
    ).limit(1);
    return result[0];
  }
  async getExamResultsByClass(classId) {
    try {
      const results = await db.select({
        id: examResults.id,
        examId: examResults.examId,
        studentId: examResults.studentId,
        score: examResults.score,
        maxScore: examResults.maxScore,
        marksObtained: examResults.marksObtained,
        grade: examResults.grade,
        remarks: examResults.remarks,
        recordedBy: examResults.recordedBy,
        autoScored: examResults.autoScored,
        createdAt: examResults.createdAt,
        examName: exams.name,
        examType: exams.examType,
        examDate: exams.date,
        totalMarks: exams.totalMarks,
        admissionNumber: students.admissionNumber,
        studentName: sql2`${users.firstName} || ' ' || ${users.lastName}`.as("studentName"),
        className: classes.name,
        subjectName: subjects.name
      }).from(examResults).innerJoin(exams, eq2(examResults.examId, exams.id)).innerJoin(students, eq2(examResults.studentId, students.id)).innerJoin(users, eq2(students.id, users.id)).leftJoin(classes, eq2(exams.classId, classes.id)).leftJoin(subjects, eq2(exams.subjectId, subjects.id)).where(eq2(exams.classId, classId)).orderBy(desc(examResults.createdAt));
      return results;
    } catch (error) {
      console.error("Error in getExamResultsByClass:", error);
      if (error?.cause?.code === "42703" && error?.cause?.message?.includes("column") && error?.cause?.message?.includes("does not exist")) {
        console.log("\u26A0\uFE0F Database schema mismatch detected, using fallback query for getExamResultsByClass");
        try {
          const results = await db.select({
            id: examResults.id,
            examId: examResults.examId,
            studentId: examResults.studentId,
            marksObtained: examResults.marksObtained,
            grade: examResults.grade,
            remarks: examResults.remarks,
            recordedBy: examResults.recordedBy,
            createdAt: examResults.createdAt,
            // Map marksObtained to score for compatibility
            score: examResults.marksObtained,
            maxScore: dsql`null`.as("maxScore"),
            // Infer autoScored based on recordedBy
            autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as("autoScored")
          }).from(examResults).innerJoin(exams, eq2(examResults.examId, exams.id)).where(eq2(exams.classId, classId)).orderBy(desc(examResults.createdAt));
          return results;
        } catch (fallbackError) {
          console.error("\u274C Fallback query also failed for getExamResultsByClass:", fallbackError);
          return [];
        }
      }
      throw error;
    }
  }
  // Exam questions management
  async createExamQuestion(question) {
    const questionData = {
      examId: question.examId,
      questionText: question.questionText,
      questionType: question.questionType,
      points: question.points,
      orderNumber: question.orderNumber,
      imageUrl: question.imageUrl,
      autoGradable: question.autoGradable ?? true,
      expectedAnswers: question.expectedAnswers,
      caseSensitive: question.caseSensitive ?? false,
      allowPartialCredit: question.allowPartialCredit ?? false,
      partialCreditRules: question.partialCreditRules,
      explanationText: question.explanationText,
      hintText: question.hintText
    };
    const result = await db.insert(examQuestions).values(questionData).returning();
    return result[0];
  }
  async createExamQuestionWithOptions(question, options) {
    return await db.transaction(async (tx) => {
      try {
        const questionData = {
          examId: question.examId,
          questionText: question.questionText,
          questionType: question.questionType,
          points: question.points,
          orderNumber: question.orderNumber,
          imageUrl: question.imageUrl,
          autoGradable: question.autoGradable ?? true,
          expectedAnswers: question.expectedAnswers,
          caseSensitive: question.caseSensitive ?? false,
          allowPartialCredit: question.allowPartialCredit ?? false,
          partialCreditRules: question.partialCreditRules,
          explanationText: question.explanationText,
          hintText: question.hintText
        };
        const questionResult = await tx.insert(examQuestions).values(questionData).returning();
        const createdQuestion = questionResult[0];
        if (Array.isArray(options) && options.length > 0) {
          const optionsToInsert = options.map((option, index2) => ({
            questionId: createdQuestion.id,
            optionText: option.optionText,
            orderNumber: index2 + 1,
            isCorrect: option.isCorrect
          }));
          const BATCH_SIZE = 5;
          for (let i = 0; i < optionsToInsert.length; i += BATCH_SIZE) {
            const batch = optionsToInsert.slice(i, i + BATCH_SIZE);
            for (const optionData of batch) {
              await tx.insert(questionOptions).values(optionData);
            }
          }
        }
        return createdQuestion;
      } catch (error) {
        console.error("\u274C Failed to create exam question with options:", error);
        throw new Error(`Failed to create question with options: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });
  }
  async createExamQuestionsBulk(questionsData) {
    const createdQuestions = [];
    const errors = [];
    console.log(`\u{1F504} Starting SEQUENTIAL bulk creation of ${questionsData.length} questions`);
    for (let i = 0; i < questionsData.length; i++) {
      const { question, options } = questionsData[i];
      try {
        console.log(`\u{1F4DD} Creating question ${i + 1}/${questionsData.length}: "${question.questionText.substring(0, 50)}..."`);
        const createdQuestion = await this.createExamQuestionWithOptions(question, options);
        createdQuestions.push(createdQuestion);
        console.log(`\u2705 Successfully created question ${i + 1}`);
        if (i < questionsData.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } catch (error) {
        const errorMsg = `Question ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
        console.error(`\u274C Failed to create question ${i + 1}:`, errorMsg);
        errors.push(errorMsg);
        if (error instanceof Error && (error.message.includes("circuit") || error.message.includes("breaker") || error.message.includes("pool") || error.message.includes("connection"))) {
          console.warn(`\u26A0\uFE0F Detected potential circuit breaker issue. Implementing backoff...`);
          await new Promise((resolve) => setTimeout(resolve, 1e3));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }
    console.log(`\u2705 SEQUENTIAL bulk creation completed: ${createdQuestions.length} created, ${errors.length} errors`);
    return {
      created: createdQuestions.length,
      questions: createdQuestions,
      errors
    };
  }
  async getExamQuestions(examId) {
    return await db.select({
      id: examQuestions.id,
      examId: examQuestions.examId,
      questionText: examQuestions.questionText,
      questionType: examQuestions.questionType,
      points: examQuestions.points,
      orderNumber: examQuestions.orderNumber,
      imageUrl: examQuestions.imageUrl,
      createdAt: examQuestions.createdAt
    }).from(examQuestions).where(eq2(examQuestions.examId, examId)).orderBy(asc(examQuestions.orderNumber));
  }
  async getExamQuestionCount(examId) {
    const result = await db.select({ count: dsql`count(*)` }).from(examQuestions).where(eq2(examQuestions.examId, examId));
    return Number(result[0]?.count || 0);
  }
  // Get question counts for multiple exams
  async getExamQuestionCounts(examIds) {
    const counts = {};
    for (const examId of examIds) {
      try {
        const count = await this.getExamQuestionCount(examId);
        counts[examId] = count;
      } catch (error) {
        console.warn(`Failed to get question count for exam ${examId}:`, error);
        counts[examId] = 0;
      }
    }
    return counts;
  }
  async updateExamQuestion(id, question) {
    const result = await db.update(examQuestions).set(question).where(eq2(examQuestions.id, id)).returning();
    return result[0];
  }
  async deleteExamQuestion(id) {
    try {
      await db.delete(questionOptions).where(eq2(questionOptions.questionId, id));
      await db.delete(studentAnswers).where(eq2(studentAnswers.questionId, id));
      const result = await db.delete(examQuestions).where(eq2(examQuestions.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error in deleteExamQuestion:", error);
      throw error;
    }
  }
  // Question options management
  async createQuestionOption(option) {
    const result = await db.insert(questionOptions).values(option).returning();
    return result[0];
  }
  async getQuestionOptions(questionId) {
    return await db.select({
      id: questionOptions.id,
      questionId: questionOptions.questionId,
      optionText: questionOptions.optionText,
      isCorrect: questionOptions.isCorrect,
      orderNumber: questionOptions.orderNumber,
      createdAt: questionOptions.createdAt
    }).from(questionOptions).where(eq2(questionOptions.questionId, questionId)).orderBy(asc(questionOptions.orderNumber));
  }
  // PERFORMANCE: Bulk fetch question options to eliminate N+1 queries
  async getQuestionOptionsBulk(questionIds) {
    if (questionIds.length === 0) {
      return [];
    }
    return await db.select({
      id: questionOptions.id,
      questionId: questionOptions.questionId,
      optionText: questionOptions.optionText,
      isCorrect: questionOptions.isCorrect,
      orderNumber: questionOptions.orderNumber,
      createdAt: questionOptions.createdAt
    }).from(questionOptions).where(inArray(questionOptions.questionId, questionIds)).orderBy(asc(questionOptions.questionId), asc(questionOptions.orderNumber));
  }
  // Exam sessions management
  async createExamSession(session2) {
    const result = await db.insert(examSessions).values(session2).returning();
    return result[0];
  }
  async getExamSessionById(id) {
    const result = await db.select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    }).from(examSessions).where(eq2(examSessions.id, id)).limit(1);
    return result[0];
  }
  async getExamSessionsByExam(examId) {
    return await db.select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    }).from(examSessions).where(eq2(examSessions.examId, examId)).orderBy(desc(examSessions.startedAt));
  }
  async getExamSessionsByStudent(studentId) {
    return await db.select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    }).from(examSessions).where(eq2(examSessions.studentId, studentId)).orderBy(desc(examSessions.startedAt));
  }
  async updateExamSession(id, session2) {
    const allowedFields = {};
    const existingColumns = ["examId", "studentId", "startedAt", "submittedAt", "timeRemaining", "isCompleted", "score", "maxScore", "status"];
    for (const [key, value] of Object.entries(session2)) {
      if (existingColumns.includes(key) && value !== void 0) {
        allowedFields[key] = value;
      }
    }
    const result = await db.update(examSessions).set(allowedFields).where(eq2(examSessions.id, id)).returning({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    });
    return result[0];
  }
  async deleteExamSession(id) {
    const result = await db.delete(examSessions).where(eq2(examSessions.id, id));
    return result.length > 0;
  }
  async getActiveExamSession(examId, studentId) {
    const result = await db.select().from(examSessions).where(and(
      eq2(examSessions.examId, examId),
      eq2(examSessions.studentId, studentId),
      eq2(examSessions.isCompleted, false)
    )).limit(1);
    return result[0];
  }
  // Get all active exam sessions for background cleanup service
  async getActiveExamSessions() {
    return await db.select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    }).from(examSessions).where(eq2(examSessions.isCompleted, false)).orderBy(desc(examSessions.startedAt));
  }
  // PERFORMANCE OPTIMIZED: Get only expired sessions directly from database
  async getExpiredExamSessions(now, limit = 100) {
    return await db.select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    }).from(examSessions).where(and(
      eq2(examSessions.isCompleted, false),
      // Fallback: Use startedAt + reasonable timeout estimate for expired sessions
      dsql`${examSessions.startedAt} + interval '2 hours' < ${now.toISOString()}`
    )).orderBy(asc(examSessions.startedAt)).limit(limit);
  }
  // CIRCUIT BREAKER FIX: Idempotent session creation using UPSERT to prevent connection pool exhaustion
  async createOrGetActiveExamSession(examId, studentId, sessionData) {
    try {
      const insertResult = await db.insert(examSessions).values({
        examId: sessionData.examId,
        studentId,
        startedAt: /* @__PURE__ */ new Date(),
        timeRemaining: sessionData.timeRemaining,
        isCompleted: false,
        status: "in_progress"
      }).onConflictDoNothing().returning({
        id: examSessions.id,
        examId: examSessions.examId,
        studentId: examSessions.studentId,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt,
        timeRemaining: examSessions.timeRemaining,
        isCompleted: examSessions.isCompleted,
        score: examSessions.score,
        maxScore: examSessions.maxScore,
        status: examSessions.status,
        createdAt: examSessions.createdAt
      });
      if (insertResult.length > 0) {
        console.log(`Created new exam session ${insertResult[0].id} for student ${studentId} exam ${examId}`);
        return { ...insertResult[0], wasCreated: true };
      }
      const existingSession = await db.select({
        id: examSessions.id,
        examId: examSessions.examId,
        studentId: examSessions.studentId,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt,
        timeRemaining: examSessions.timeRemaining,
        isCompleted: examSessions.isCompleted,
        score: examSessions.score,
        maxScore: examSessions.maxScore,
        status: examSessions.status,
        createdAt: examSessions.createdAt
      }).from(examSessions).where(and(
        eq2(examSessions.examId, examId),
        eq2(examSessions.studentId, studentId),
        eq2(examSessions.isCompleted, false)
      )).limit(1);
      if (existingSession.length > 0) {
        console.log(`Retrieved existing exam session ${existingSession[0].id} for student ${studentId} exam ${examId}`);
        return { ...existingSession[0], wasCreated: false };
      }
      throw new Error(`Unable to create or retrieve exam session for student ${studentId} exam ${examId}`);
    } catch (error) {
      console.error("Error in createOrGetActiveExamSession:", error);
      throw error;
    }
  }
  // Enhanced session management for students
  async getStudentActiveSession(studentId) {
    const result = await this.db.select({
      id: examSessions.id,
      examId: examSessions.examId,
      studentId: examSessions.studentId,
      startedAt: examSessions.startedAt,
      submittedAt: examSessions.submittedAt,
      timeRemaining: examSessions.timeRemaining,
      isCompleted: examSessions.isCompleted,
      score: examSessions.score,
      maxScore: examSessions.maxScore,
      status: examSessions.status,
      createdAt: examSessions.createdAt
    }).from(examSessions).where(and(
      eq2(examSessions.studentId, studentId),
      eq2(examSessions.isCompleted, false)
    )).orderBy(desc(examSessions.createdAt)).limit(1);
    return result[0];
  }
  async updateSessionProgress(sessionId, progress) {
    const updates = {};
    if (typeof progress.timeRemaining === "number") {
      updates.timeRemaining = progress.timeRemaining;
    }
    if (typeof progress.currentQuestionIndex === "number") {
      updates.metadata = JSON.stringify({ currentQuestionIndex: progress.currentQuestionIndex });
    }
    if (Object.keys(updates).length > 0) {
      await this.db.update(examSessions).set(updates).where(eq2(examSessions.id, sessionId));
    }
  }
  // Student answers management
  async createStudentAnswer(answer) {
    const result = await db.insert(studentAnswers).values(answer).returning();
    return result[0];
  }
  async getStudentAnswers(sessionId) {
    return await db.select().from(studentAnswers).where(eq2(studentAnswers.sessionId, sessionId)).orderBy(asc(studentAnswers.answeredAt));
  }
  async getStudentAnswerById(id) {
    const result = await db.select().from(studentAnswers).where(eq2(studentAnswers.id, id)).limit(1);
    return result[0];
  }
  async updateStudentAnswer(id, answer) {
    const result = await db.update(studentAnswers).set(answer).where(eq2(studentAnswers.id, id)).returning();
    return result[0];
  }
  // OPTIMIZED SCORING: Get all scoring data in a single query for <2s performance
  async getExamScoringData(sessionId) {
    try {
      console.log(`\u{1F50D} DIAGNOSTIC: Starting scoring data fetch for session ${sessionId}`);
      const sessionResult = await this.db.select({
        id: examSessions.id,
        examId: examSessions.examId,
        studentId: examSessions.studentId,
        startedAt: examSessions.startedAt,
        submittedAt: examSessions.submittedAt,
        timeRemaining: examSessions.timeRemaining,
        isCompleted: examSessions.isCompleted,
        score: examSessions.score,
        maxScore: examSessions.maxScore,
        status: examSessions.status,
        createdAt: examSessions.createdAt
      }).from(examSessions).where(eq2(examSessions.id, sessionId)).limit(1);
      if (!sessionResult[0]) {
        throw new Error(`Exam session ${sessionId} not found`);
      }
      const session2 = sessionResult[0];
      console.log(`\u{1F50D} DIAGNOSTIC: Found session for exam ${session2.examId}, student ${session2.studentId}`);
      const questionsQuery = await this.db.select({
        questionId: examQuestions.id,
        questionType: examQuestions.questionType,
        points: examQuestions.points,
        autoGradable: examQuestions.autoGradable,
        expectedAnswers: examQuestions.expectedAnswers,
        caseSensitive: examQuestions.caseSensitive,
        allowPartialCredit: examQuestions.allowPartialCredit,
        partialCreditRules: examQuestions.partialCreditRules,
        studentSelectedOptionId: studentAnswers.selectedOptionId,
        textAnswer: studentAnswers.textAnswer
      }).from(examQuestions).leftJoin(studentAnswers, and(
        eq2(studentAnswers.questionId, examQuestions.id),
        eq2(studentAnswers.sessionId, sessionId)
      )).where(eq2(examQuestions.examId, session2.examId)).orderBy(asc(examQuestions.orderNumber));
      const correctOptionsQuery = await this.db.select({
        questionId: questionOptions.questionId,
        correctOptionId: questionOptions.id
      }).from(questionOptions).innerJoin(examQuestions, eq2(questionOptions.questionId, examQuestions.id)).where(
        and(
          eq2(examQuestions.examId, session2.examId),
          eq2(questionOptions.isCorrect, true)
        )
      );
      const selectedOptionsQuery = await this.db.select({
        questionId: questionOptions.questionId,
        optionId: questionOptions.id,
        partialCreditValue: questionOptions.partialCreditValue,
        isCorrect: questionOptions.isCorrect
      }).from(questionOptions).innerJoin(studentAnswers, eq2(questionOptions.id, studentAnswers.selectedOptionId)).where(eq2(studentAnswers.sessionId, sessionId));
      const correctOptionsMap = /* @__PURE__ */ new Map();
      for (const option of correctOptionsQuery) {
        correctOptionsMap.set(option.questionId, option.correctOptionId);
      }
      const selectedOptionsMap = /* @__PURE__ */ new Map();
      for (const option of selectedOptionsQuery) {
        selectedOptionsMap.set(option.questionId, {
          optionId: option.optionId,
          partialCreditValue: option.partialCreditValue,
          isCorrect: option.isCorrect
        });
      }
      const questionMap = /* @__PURE__ */ new Map();
      for (const question of questionsQuery) {
        const correctOptionId = correctOptionsMap.get(question.questionId) || null;
        const selectedOptionData = selectedOptionsMap.get(question.questionId);
        questionMap.set(question.questionId, {
          questionType: question.questionType,
          points: question.points || 1,
          autoGradable: question.autoGradable,
          expectedAnswers: question.expectedAnswers,
          caseSensitive: question.caseSensitive,
          allowPartialCredit: question.allowPartialCredit,
          partialCreditRules: question.partialCreditRules,
          studentSelectedOptionId: question.studentSelectedOptionId,
          textAnswer: question.textAnswer,
          correctOptionId,
          isCorrect: false,
          partialCreditEarned: 0
        });
        if ((question.questionType === "multiple_choice" || question.questionType === "true_false" || question.questionType === "true/false") && correctOptionId && question.studentSelectedOptionId === correctOptionId) {
          questionMap.get(question.questionId).isCorrect = true;
        }
        if (question.allowPartialCredit && selectedOptionData && selectedOptionData.partialCreditValue) {
          const questionData = questionMap.get(question.questionId);
          if (!questionData.isCorrect && selectedOptionData.partialCreditValue > 0) {
            questionData.partialCreditEarned = Math.min(
              questionData.points,
              selectedOptionData.partialCreditValue
            );
            console.log(`\u{1F524} OPTION PARTIAL CREDIT: Question ${question.questionId} awarded ${questionData.partialCreditEarned}/${questionData.points} pts for selected option`);
          }
        }
      }
      for (const [questionId, question] of Array.from(questionMap.entries())) {
        if (!question.autoGradable) continue;
        if ((question.questionType === "text" || question.questionType === "fill_blank") && question.expectedAnswers && question.textAnswer) {
          const studentAnswer = question.textAnswer.trim();
          if (!studentAnswer) continue;
          console.log(`\u{1F524} AUTO-SCORING TEXT: Question ${questionId} - Student: "${studentAnswer}", Expected: [${question.expectedAnswers.join(", ")}]`);
          for (const expectedAnswer of question.expectedAnswers) {
            const normalizedExpected = question.caseSensitive ? expectedAnswer.trim() : expectedAnswer.trim().toLowerCase();
            const normalizedStudent = question.caseSensitive ? studentAnswer : studentAnswer.toLowerCase();
            if (normalizedStudent === normalizedExpected) {
              question.isCorrect = true;
              console.log(`\u2705 TEXT MATCH: Exact match found for question ${questionId}`);
              break;
            }
            if (question.allowPartialCredit && !question.isCorrect) {
              const similarity = this.calculateTextSimilarity(normalizedStudent, normalizedExpected);
              try {
                const partialRules = question.partialCreditRules ? JSON.parse(question.partialCreditRules) : { minSimilarity: 0.8, partialPercentage: 0.5 };
                if (similarity >= (partialRules.minSimilarity || 0.8)) {
                  question.partialCreditEarned = Math.ceil(question.points * (partialRules.partialPercentage || 0.5));
                  console.log(`\u{1F524} PARTIAL CREDIT: Question ${questionId} similarity ${similarity.toFixed(2)} awarded ${question.partialCreditEarned}/${question.points} points`);
                  break;
                }
              } catch (err) {
                console.warn(`\u26A0\uFE0F Invalid partial credit rules for question ${questionId}:`, err);
              }
            }
          }
        }
      }
      const scoringData = Array.from(questionMap.entries()).map(([questionId, data]) => ({
        questionId,
        ...data
      }));
      let totalQuestions = scoringData.length;
      let maxScore = 0;
      let studentScore = 0;
      let autoScoredQuestions = 0;
      console.log(`\u{1F50D} DIAGNOSTIC: Found ${totalQuestions} total questions for scoring`);
      const questionTypeCount = {};
      for (const question of scoringData) {
        maxScore += question.points;
        questionTypeCount[question.questionType] = (questionTypeCount[question.questionType] || 0) + 1;
        if (question.autoGradable === true) {
          autoScoredQuestions++;
          if (question.isCorrect) {
            studentScore += question.points;
            console.log(`\u{1F50D} DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): CORRECT (+${question.points} pts) - Full credit awarded`);
          } else if (question.partialCreditEarned > 0) {
            studentScore += question.partialCreditEarned;
            console.log(`\u{1F50D} DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): PARTIAL CREDIT (+${question.partialCreditEarned}/${question.points} pts)`);
          } else {
            console.log(`\u{1F50D} DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): INCORRECT (0 pts)`);
          }
        } else {
          console.log(`\u{1F50D} DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): MANUAL GRADING REQUIRED`);
        }
      }
      console.log(`\u{1F50D} DIAGNOSTIC: Question type breakdown:`, questionTypeCount);
      console.log(`\u{1F50D} DIAGNOSTIC: Auto-scored questions: ${autoScoredQuestions}/${totalQuestions}`);
      console.log(`\u{1F50D} DIAGNOSTIC: Student score: ${studentScore}/${maxScore}`);
      return {
        session: session2,
        scoringData,
        summary: {
          totalQuestions,
          maxScore,
          studentScore,
          autoScoredQuestions
        }
      };
    } catch (error) {
      console.error("\u{1F6A8} OPTIMIZED SCORING ERROR:", error);
      throw error;
    }
  }
  // Text similarity calculation for partial credit scoring
  calculateTextSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    if (longer.length === 0) return 1;
    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  getEditDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          // deletion
          matrix[j - 1][i] + 1,
          // insertion
          matrix[j - 1][i - 1] + indicator
          // substitution
        );
      }
    }
    return matrix[str2.length][str1.length];
  }
  // Announcements
  async createAnnouncement(announcement) {
    const result = await db.insert(announcements).values(announcement).returning();
    return result[0];
  }
  async getAnnouncements(targetRole) {
    const query = db.select().from(announcements).where(eq2(announcements.isPublished, true)).orderBy(desc(announcements.publishedAt));
    if (targetRole) {
    }
    return await query;
  }
  async getAnnouncementById(id) {
    const result = await db.select().from(announcements).where(eq2(announcements.id, id)).limit(1);
    return result[0];
  }
  async updateAnnouncement(id, announcement) {
    const result = await db.update(announcements).set(announcement).where(eq2(announcements.id, id)).returning();
    return result[0];
  }
  async deleteAnnouncement(id) {
    const result = await db.delete(announcements).where(eq2(announcements.id, id));
    return result.length > 0;
  }
  // Messages
  async sendMessage(message) {
    const result = await db.insert(messages).values(message).returning();
    return result[0];
  }
  async getMessagesByUser(userId) {
    return await db.select().from(messages).where(eq2(messages.recipientId, userId)).orderBy(desc(messages.createdAt));
  }
  async markMessageAsRead(id) {
    await db.update(messages).set({ isRead: true }).where(eq2(messages.id, id));
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
      return await db.select().from(gallery).where(eq2(gallery.categoryId, categoryId)).orderBy(desc(gallery.createdAt));
    }
    return await db.select().from(gallery).orderBy(desc(gallery.createdAt));
  }
  async getGalleryImageById(id) {
    const result = await db.select().from(gallery).where(eq2(gallery.id, parseInt(id))).limit(1);
    return result[0];
  }
  async deleteGalleryImage(id) {
    const result = await db.delete(gallery).where(eq2(gallery.id, parseInt(id))).returning();
    return result.length > 0;
  }
  // Study resources management
  async createStudyResource(resource) {
    const result = await db.insert(studyResources).values(resource).returning();
    return result[0];
  }
  async getStudyResources(filters) {
    let query = db.select().from(studyResources).where(eq2(studyResources.isPublished, true));
    if (filters?.classId) {
      query = query.where(eq2(studyResources.classId, filters.classId));
    }
    if (filters?.subjectId) {
      query = query.where(eq2(studyResources.subjectId, filters.subjectId));
    }
    if (filters?.termId) {
      query = query.where(eq2(studyResources.termId, filters.termId));
    }
    if (filters?.resourceType) {
      query = query.where(eq2(studyResources.resourceType, filters.resourceType));
    }
    return await query.orderBy(desc(studyResources.createdAt));
  }
  async getStudyResourceById(id) {
    const result = await db.select().from(studyResources).where(eq2(studyResources.id, id)).limit(1);
    return result[0];
  }
  async incrementStudyResourceDownloads(id) {
    await db.update(studyResources).set({ downloads: dsql`${studyResources.downloads} + 1` }).where(eq2(studyResources.id, id));
  }
  async deleteStudyResource(id) {
    const result = await db.delete(studyResources).where(eq2(studyResources.id, id)).returning();
    return result.length > 0;
  }
  // Home page content management
  async createHomePageContent(content) {
    const result = await db.insert(homePageContent).values(content).returning();
    return result[0];
  }
  // Manual Grading System Methods
  async getGradingTasks(teacherId, status) {
    try {
      let query = `
        SELECT 
          sa.id,
          es.student_id,
          u.first_name || ' ' || u.last_name as student_name,
          es.exam_id,
          e.name as exam_title,
          eq.id as question_id,
          eq.question_text,
          eq.question_type,
          eq.points as max_marks,
          sa.text_answer as student_answer,
          es.submitted_at,
          CASE 
            WHEN sa.id IN (SELECT answer_id FROM manual_scores) THEN 'graded'
            ELSE 'pending'
          END as status,
          ms.awarded_marks as current_score,
          ms.comment as grader_comment
        FROM student_answers sa
        JOIN exam_sessions es ON sa.session_id = es.id
        JOIN exams e ON es.exam_id = e.id
        JOIN exam_questions eq ON sa.question_id = eq.id
        JOIN users u ON es.student_id = u.id
        LEFT JOIN manual_scores ms ON sa.id = ms.answer_id
        WHERE e.created_by = $1
        AND eq.question_type IN ('text', 'essay')
        AND es.is_completed = true
      `;
      const params = [teacherId];
      if (status && status !== "all") {
        if (status === "pending") {
          query += " AND sa.id NOT IN (SELECT answer_id FROM manual_scores)";
        } else if (status === "graded") {
          query += " AND sa.id IN (SELECT answer_id FROM manual_scores)";
        }
      }
      query += " ORDER BY es.submitted_at DESC";
      const result = await sql2.unsafe(query, params);
      return result;
    } catch (error) {
      console.error("Error fetching grading tasks:", error);
      throw error;
    }
  }
  async submitManualGrade(gradeData) {
    try {
      const { taskId, score, comment, graderId } = gradeData;
      const result = await sql2`
        INSERT INTO manual_scores (answer_id, grader_id, awarded_marks, comment, graded_at)
        VALUES (${taskId}, ${graderId}, ${score}, ${comment}, NOW())
        ON CONFLICT (answer_id) 
        DO UPDATE SET 
          awarded_marks = EXCLUDED.awarded_marks,
          comment = EXCLUDED.comment,
          graded_at = EXCLUDED.graded_at,
          grader_id = EXCLUDED.grader_id
        RETURNING *
      `;
      await sql2`
        UPDATE student_answers 
        SET points_earned = ${score}
        WHERE id = ${taskId}
      `;
      return result[0];
    } catch (error) {
      console.error("Error submitting manual grade:", error);
      throw error;
    }
  }
  async getAllExamSessions() {
    try {
      const result = await sql2`
        SELECT 
          es.*,
          e.name as exam_title,
          u.first_name || ' ' || u.last_name as student_name,
          (
            SELECT COUNT(*) 
            FROM student_answers sa 
            WHERE sa.session_id = es.id 
            AND (sa.selected_option_id IS NOT NULL OR sa.text_answer IS NOT NULL)
          ) as answered_questions,
          (
            SELECT COUNT(*) 
            FROM exam_questions eq 
            WHERE eq.exam_id = es.exam_id
          ) as total_questions
        FROM exam_sessions es
        JOIN exams e ON es.exam_id = e.id
        JOIN users u ON es.student_id = u.id
        ORDER BY es.started_at DESC
      `;
      return result;
    } catch (error) {
      console.error("Error fetching exam sessions:", error);
      throw error;
    }
  }
  async getExamReports(filters) {
    try {
      let query = `
        SELECT 
          e.id as exam_id,
          e.name as exam_title,
          c.name as class_name,
          s.name as subject_name,
          e.date as exam_date,
          e.total_marks as max_score,
          COUNT(DISTINCT es.student_id) as total_students,
          COUNT(DISTINCT CASE WHEN es.is_completed THEN es.student_id END) as completed_students,
          COALESCE(AVG(CASE WHEN es.is_completed THEN er.marks_obtained END), 0) as average_score,
          COALESCE(
            COUNT(CASE WHEN es.is_completed AND er.marks_obtained >= (e.total_marks * 0.5) THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN es.is_completed THEN 1 END), 0), 
            0
          ) as pass_rate,
          COALESCE(MAX(CASE WHEN es.is_completed THEN er.marks_obtained END), 0) as highest_score,
          COALESCE(MIN(CASE WHEN es.is_completed THEN er.marks_obtained END), 0) as lowest_score,
          CASE 
            WHEN COUNT(DISTINCT CASE WHEN es.is_completed THEN es.student_id END) = 0 THEN 'ongoing'
            ELSE 'completed'
          END as status,
          COALESCE(
            COUNT(CASE WHEN es.is_completed AND er.id IS NOT NULL THEN 1 END) * 100.0 / 
            NULLIF(COUNT(CASE WHEN es.is_completed THEN 1 END), 0), 
            0
          ) as grading_progress
        FROM exams e
        JOIN classes c ON e.class_id = c.id
        JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN exam_sessions es ON e.id = es.exam_id
        LEFT JOIN exam_results er ON e.id = er.exam_id AND es.student_id = er.student_id
        WHERE e.is_published = true
      `;
      const params = [];
      let paramIndex = 1;
      if (filters.classId) {
        query += ` AND e.class_id = $${paramIndex}`;
        params.push(filters.classId);
        paramIndex++;
      }
      if (filters.subjectId) {
        query += ` AND e.subject_id = $${paramIndex}`;
        params.push(filters.subjectId);
        paramIndex++;
      }
      query += `
        GROUP BY e.id, e.name, c.name, s.name, e.date, e.total_marks
        ORDER BY e.date DESC
      `;
      const result = await sql2.unsafe(query, params);
      return result;
    } catch (error) {
      console.error("Error fetching exam reports:", error);
      throw error;
    }
  }
  async getExamStudentReports(examId) {
    try {
      const result = await sql2`
        SELECT 
          u.id as student_id,
          u.first_name || ' ' || u.last_name as student_name,
          st.admission_number,
          COALESCE(er.marks_obtained, 0) as score,
          COALESCE(er.marks_obtained * 100.0 / e.total_marks, 0) as percentage,
          CASE 
            WHEN er.marks_obtained >= e.total_marks * 0.9 THEN 'A'
            WHEN er.marks_obtained >= e.total_marks * 0.8 THEN 'B'
            WHEN er.marks_obtained >= e.total_marks * 0.7 THEN 'C'
            WHEN er.marks_obtained >= e.total_marks * 0.6 THEN 'D'
            ELSE 'F'
          END as grade,
          ROW_NUMBER() OVER (ORDER BY er.marks_obtained DESC) as rank,
          EXTRACT(EPOCH FROM (es.submitted_at - es.started_at)) as time_spent,
          es.submitted_at,
          er.auto_scored,
          CASE WHEN EXISTS (
            SELECT 1 FROM manual_scores ms 
            JOIN student_answers sa ON ms.answer_id = sa.id 
            WHERE sa.session_id = es.id
          ) THEN true ELSE false END as manual_scored
        FROM users u
        JOIN students st ON u.id = st.id
        JOIN exam_sessions es ON u.id = es.student_id
        JOIN exams e ON es.exam_id = e.id
        LEFT JOIN exam_results er ON e.id = er.exam_id AND u.id = er.student_id
        WHERE e.id = ${examId} AND es.is_completed = true
        ORDER BY er.marks_obtained DESC
      `;
      return result;
    } catch (error) {
      console.error("Error fetching student reports:", error);
      throw error;
    }
  }
  // Home page content management
  async getHomePageContent(contentType) {
    if (contentType) {
      return await db.select().from(homePageContent).where(and(eq2(homePageContent.contentType, contentType), eq2(homePageContent.isActive, true))).orderBy(asc(homePageContent.displayOrder));
    }
    return await db.select().from(homePageContent).where(eq2(homePageContent.isActive, true)).orderBy(asc(homePageContent.displayOrder), asc(homePageContent.contentType));
  }
  async getHomePageContentById(id) {
    const result = await db.select().from(homePageContent).where(eq2(homePageContent.id, id)).limit(1);
    return result[0];
  }
  async updateHomePageContent(id, content) {
    const result = await db.update(homePageContent).set({ ...content, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(homePageContent.id, id)).returning();
    return result[0];
  }
  async deleteHomePageContent(id) {
    const result = await db.delete(homePageContent).where(eq2(homePageContent.id, id)).returning();
    return result.length > 0;
  }
  // Comprehensive grade management
  async recordComprehensiveGrade(gradeData) {
    try {
      let reportCard = await db.select().from(reportCards).where(and(
        eq2(reportCards.studentId, gradeData.studentId),
        eq2(reportCards.termId, gradeData.termId)
      )).limit(1);
      let reportCardId;
      if (reportCard.length === 0) {
        const newReportCard = await db.insert(reportCards).values({
          studentId: gradeData.studentId,
          classId: gradeData.classId || 1,
          // Should be provided
          termId: gradeData.termId,
          status: "draft"
        }).returning();
        reportCardId = newReportCard[0].id;
      } else {
        reportCardId = reportCard[0].id;
      }
      const existingItem = await db.select().from(reportCardItems).where(and(
        eq2(reportCardItems.reportCardId, reportCardId),
        eq2(reportCardItems.subjectId, gradeData.subjectId)
      )).limit(1);
      const comprehensiveGradeData = {
        reportCardId,
        subjectId: gradeData.subjectId,
        testScore: gradeData.testScore,
        testMaxScore: gradeData.testMaxScore,
        testWeightedScore: gradeData.testWeightedScore || Math.round(gradeData.testScore / gradeData.testMaxScore * 40),
        examScore: gradeData.examScore,
        examMaxScore: gradeData.examMaxScore,
        examWeightedScore: gradeData.examWeightedScore || Math.round(gradeData.examScore / gradeData.examMaxScore * 60),
        obtainedMarks: gradeData.testWeightedScore + gradeData.examWeightedScore || Math.round(gradeData.testScore / gradeData.testMaxScore * 40 + gradeData.examScore / gradeData.examMaxScore * 60),
        percentage: gradeData.percentage || Math.round(gradeData.testScore / gradeData.testMaxScore * 40 + gradeData.examScore / gradeData.examMaxScore * 60),
        grade: gradeData.grade,
        teacherRemarks: gradeData.teacherRemarks
      };
      if (existingItem.length > 0) {
        const result = await db.update(reportCardItems).set(comprehensiveGradeData).where(eq2(reportCardItems.id, existingItem[0].id)).returning();
        return result[0];
      } else {
        const result = await db.insert(reportCardItems).values(comprehensiveGradeData).returning();
        return result[0];
      }
    } catch (error) {
      console.error("Error recording comprehensive grade:", error);
      throw error;
    }
  }
  async getComprehensiveGradesByStudent(studentId, termId) {
    try {
      let query = db.select({
        id: reportCardItems.id,
        subjectId: reportCardItems.subjectId,
        subjectName: subjects.name,
        testScore: reportCardItems.testScore,
        testMaxScore: reportCardItems.testMaxScore,
        testWeightedScore: reportCardItems.testWeightedScore,
        examScore: reportCardItems.examScore,
        examMaxScore: reportCardItems.examMaxScore,
        examWeightedScore: reportCardItems.examWeightedScore,
        obtainedMarks: reportCardItems.obtainedMarks,
        percentage: reportCardItems.percentage,
        grade: reportCardItems.grade,
        teacherRemarks: reportCardItems.teacherRemarks,
        termId: reportCards.termId,
        createdAt: reportCardItems.createdAt
      }).from(reportCardItems).innerJoin(reportCards, eq2(reportCardItems.reportCardId, reportCards.id)).innerJoin(subjects, eq2(reportCardItems.subjectId, subjects.id)).where(eq2(reportCards.studentId, studentId));
      if (termId) {
        query = query.where(and(
          eq2(reportCards.studentId, studentId),
          eq2(reportCards.termId, termId)
        ));
      }
      return await query.orderBy(subjects.name);
    } catch (error) {
      console.error("Error fetching comprehensive grades by student:", error);
      return [];
    }
  }
  async getComprehensiveGradesByClass(classId, termId) {
    try {
      let query = db.select({
        studentId: reportCards.studentId,
        studentName: sql2`CONCAT(${users.firstName}, ' ', ${users.lastName})`.as("studentName"),
        admissionNumber: students.admissionNumber,
        subjectName: subjects.name,
        testScore: reportCardItems.testScore,
        examScore: reportCardItems.examScore,
        obtainedMarks: reportCardItems.obtainedMarks,
        grade: reportCardItems.grade,
        teacherRemarks: reportCardItems.teacherRemarks
      }).from(reportCardItems).innerJoin(reportCards, eq2(reportCardItems.reportCardId, reportCards.id)).innerJoin(students, eq2(reportCards.studentId, students.id)).innerJoin(users, eq2(students.id, users.id)).innerJoin(subjects, eq2(reportCardItems.subjectId, subjects.id)).where(eq2(students.classId, classId));
      if (termId) {
        query = query.where(and(
          eq2(students.classId, classId),
          eq2(reportCards.termId, termId)
        ));
      }
      return await query.orderBy(users.firstName, users.lastName, subjects.name);
    } catch (error) {
      console.error("Error fetching comprehensive grades by class:", error);
      return [];
    }
  }
  async createReportCard(reportCardData, grades) {
    return await this.db.transaction(async (tx) => {
      try {
        const reportCard = await tx.insert(reportCards).values(reportCardData).returning();
        if (grades.length > 0) {
          const gradeUpdates = grades.map(
            (grade) => tx.update(reportCardItems).set({ reportCardId: reportCard[0].id }).where(eq2(reportCardItems.id, grade.id))
          );
          await Promise.all(gradeUpdates);
        }
        return {
          reportCard: reportCard[0],
          grades
        };
      } catch (error) {
        console.error("Error creating report card:", error);
        throw error;
      }
    });
  }
  async getReportCard(id) {
    try {
      const result = await db.select().from(reportCards).where(eq2(reportCards.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching report card:", error);
      return void 0;
    }
  }
  async getReportCardsByStudentId(studentId) {
    try {
      return await db.select().from(reportCards).where(eq2(reportCards.studentId, studentId)).orderBy(desc(reportCards.generatedAt));
    } catch (error) {
      console.error("Error fetching student report cards:", error);
      return [];
    }
  }
  async getReportCardItems(reportCardId) {
    try {
      return await db.select().from(reportCardItems).where(eq2(reportCardItems.reportCardId, reportCardId));
    } catch (error) {
      console.error("Error fetching report card items:", error);
      return [];
    }
  }
  async getStudentsByParentId(parentId) {
    try {
      return await db.select().from(students).where(eq2(students.parentId, parentId));
    } catch (error) {
      console.error("Error fetching students by parent:", error);
      return [];
    }
  }
  async getAcademicTerm(id) {
    try {
      const result = await db.select().from(academicTerms).where(eq2(academicTerms.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching academic term:", error);
      return void 0;
    }
  }
  // Analytics and Reports
  async getAnalyticsOverview() {
    try {
      const [students2, teachers, admins, parents] = await Promise.all([
        db.select().from(users).where(eq2(users.roleId, 1)),
        db.select().from(users).where(eq2(users.roleId, 2)),
        db.select().from(users).where(eq2(users.roleId, 4)),
        db.select().from(users).where(eq2(users.roleId, 3))
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
        const studentsInClass = await db.select().from(students).where(eq2(students.classId, filters.classId));
        const studentIds = studentsInClass.map((s) => s.id);
        examResults2 = examResults2.filter((r) => studentIds.includes(r.studentId));
      }
      if (filters.subjectId) {
        const examsForSubject = await db.select().from(exams).where(eq2(exams.subjectId, filters.subjectId));
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
          eq2(users.roleId, 1)
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
        const studentsInClass = await db.select().from(students).where(eq2(students.classId, filters.classId));
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
  // Report finalization methods
  async getExamResultById(id) {
    try {
      const result = await this.db.select().from(examResults).where(eq2(examResults.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error fetching exam result by ID:", error);
      return void 0;
    }
  }
  async getFinalizedReportsByExams(examIds, filters) {
    try {
      const results = await this.db.select().from(examResults).where(and(
        inArray(examResults.examId, examIds)
        // Add teacherFinalized field check when column exists
        // eq(schema.examResults.teacherFinalized, true)
      )).orderBy(desc(examResults.createdAt));
      return results;
    } catch (error) {
      console.error("Error fetching finalized reports by exams:", error);
      return [];
    }
  }
  async getAllFinalizedReports(filters) {
    try {
      const results = await this.db.select().from(examResults).orderBy(desc(examResults.createdAt));
      return results;
    } catch (error) {
      console.error("Error fetching all finalized reports:", error);
      return [];
    }
  }
  async getContactMessageById(id) {
    const result = await this.db.select().from(contactMessages).where(eq2(contactMessages.id, id)).limit(1);
    return result[0];
  }
  async markContactMessageAsRead(id) {
    const result = await this.db.update(contactMessages).set({ isRead: true }).where(eq2(contactMessages.id, id)).returning();
    return result.length > 0;
  }
  async respondToContactMessage(id, response, respondedBy) {
    const result = await this.db.update(contactMessages).set({
      response,
      respondedBy,
      respondedAt: /* @__PURE__ */ new Date(),
      isRead: true
    }).where(eq2(contactMessages.id, id)).returning();
    return result[0];
  }
  // Performance monitoring implementation
  async logPerformanceEvent(event) {
    const result = await this.db.insert(performanceEvents).values(event).returning();
    return result[0];
  }
  async getPerformanceMetrics(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1e3);
    const events = await this.db.select().from(performanceEvents).where(dsql`${performanceEvents.createdAt} >= ${cutoffTime}`);
    const totalEvents = events.length;
    const goalAchievedCount = events.filter((e) => e.goalAchieved).length;
    const goalAchievementRate = totalEvents > 0 ? goalAchievedCount / totalEvents * 100 : 0;
    const averageDuration = totalEvents > 0 ? events.reduce((sum, e) => sum + e.duration, 0) / totalEvents : 0;
    const slowSubmissions = events.filter((e) => e.duration > 2e3).length;
    const eventsByType = {};
    events.forEach((e) => {
      eventsByType[e.eventType] = (eventsByType[e.eventType] || 0) + 1;
    });
    return {
      totalEvents,
      goalAchievementRate: Math.round(goalAchievementRate * 100) / 100,
      averageDuration: Math.round(averageDuration),
      slowSubmissions,
      eventsByType
    };
  }
  async getRecentPerformanceAlerts(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1e3);
    return await this.db.select().from(performanceEvents).where(
      and(
        dsql`${performanceEvents.createdAt} >= ${cutoffTime}`,
        eq2(performanceEvents.goalAchieved, false)
      )
    ).orderBy(desc(performanceEvents.createdAt)).limit(50);
  }
  // Teacher class assignments implementation
  async createTeacherClassAssignment(assignment) {
    const result = await this.db.insert(teacherClassAssignments).values(assignment).returning();
    return result[0];
  }
  async getTeacherClassAssignments(teacherId) {
    return await this.db.select().from(teacherClassAssignments).where(and(
      eq2(teacherClassAssignments.teacherId, teacherId),
      eq2(teacherClassAssignments.isActive, true)
    )).orderBy(teacherClassAssignments.createdAt);
  }
  async getTeachersForClassSubject(classId, subjectId) {
    const assignments = await this.db.select({
      user: users
    }).from(teacherClassAssignments).innerJoin(users, eq2(teacherClassAssignments.teacherId, users.id)).where(and(
      eq2(teacherClassAssignments.classId, classId),
      eq2(teacherClassAssignments.subjectId, subjectId),
      eq2(teacherClassAssignments.isActive, true)
    ));
    return assignments.map((a) => a.user);
  }
  async updateTeacherClassAssignment(id, assignment) {
    const result = await this.db.update(teacherClassAssignments).set(assignment).where(eq2(teacherClassAssignments.id, id)).returning();
    return result[0];
  }
  async deleteTeacherClassAssignment(id) {
    const result = await this.db.delete(teacherClassAssignments).where(eq2(teacherClassAssignments.id, id)).returning();
    return result.length > 0;
  }
  // Manual grading task queue implementation
  async createGradingTask(task) {
    const result = await this.db.insert(gradingTasks).values(task).returning();
    return result[0];
  }
  async assignGradingTask(taskId, teacherId) {
    const result = await this.db.update(gradingTasks).set({
      assignedTeacherId: teacherId,
      assignedAt: /* @__PURE__ */ new Date(),
      status: "in_progress"
    }).where(eq2(gradingTasks.id, taskId)).returning();
    return result[0];
  }
  async getGradingTasksByTeacher(teacherId, status) {
    const conditions = [eq2(gradingTasks.assignedTeacherId, teacherId)];
    if (status) {
      conditions.push(eq2(gradingTasks.status, status));
    }
    return await this.db.select().from(gradingTasks).where(and(...conditions)).orderBy(desc(gradingTasks.priority), gradingTasks.createdAt);
  }
  async getGradingTasksBySession(sessionId) {
    return await this.db.select().from(gradingTasks).where(eq2(gradingTasks.sessionId, sessionId)).orderBy(gradingTasks.createdAt);
  }
  async updateGradingTaskStatus(taskId, status, completedAt) {
    const updates = { status };
    if (status === "in_progress" && !completedAt) {
      updates.startedAt = /* @__PURE__ */ new Date();
    }
    if (status === "completed" || completedAt) {
      updates.completedAt = completedAt || /* @__PURE__ */ new Date();
    }
    const result = await this.db.update(gradingTasks).set(updates).where(eq2(gradingTasks.id, taskId)).returning();
    return result[0];
  }
  async completeGradingTask(taskId, pointsEarned, feedbackText) {
    try {
      const task = await this.db.select().from(gradingTasks).where(eq2(gradingTasks.id, taskId)).limit(1);
      if (!task || task.length === 0) return void 0;
      const answerResult = await this.db.update(studentAnswers).set({
        pointsEarned,
        feedbackText,
        manualOverride: true
      }).where(eq2(studentAnswers.id, task[0].answerId)).returning();
      if (!answerResult || answerResult.length === 0) return void 0;
      const taskResult = await this.db.update(gradingTasks).set({
        status: "completed",
        completedAt: /* @__PURE__ */ new Date()
      }).where(eq2(gradingTasks.id, taskId)).returning();
      return {
        task: taskResult[0],
        answer: answerResult[0]
      };
    } catch (error) {
      console.error("Error completing grading task:", error);
      throw error;
    }
  }
  // Audit logging implementation
  async createAuditLog(log2) {
    const result = await this.db.insert(auditLogs).values(log2).returning();
    return result[0];
  }
  async getAuditLogs(filters) {
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq2(auditLogs.userId, filters.userId));
    }
    if (filters?.entityType) {
      conditions.push(eq2(auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq2(auditLogs.entityId, filters.entityId));
    }
    if (filters?.action) {
      conditions.push(eq2(auditLogs.action, filters.action));
    }
    if (filters?.startDate) {
      conditions.push(dsql`${auditLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(dsql`${auditLogs.createdAt} <= ${filters.endDate}`);
    }
    let query = this.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt));
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    return await query;
  }
  async getAuditLogsByEntity(entityType, entityId) {
    return await this.db.select().from(auditLogs).where(and(
      eq2(auditLogs.entityType, entityType),
      eq2(auditLogs.entityId, entityId)
    )).orderBy(desc(auditLogs.createdAt));
  }
};
function initializeStorageSync() {
  if (!process.env.DATABASE_URL) {
    console.error("\u{1F6A8} CRITICAL: DATABASE_URL environment variable is required");
    console.error("\u{1F6A8} This application ONLY stores data in Supabase database");
    console.error("\u{1F6A8} Please ensure your Supabase DATABASE_URL is properly configured");
    process.exit(1);
  }
  try {
    const dbStorage = new DatabaseStorage();
    console.log("\u2705 STORAGE: Using SUPABASE PostgreSQL Database - ALL DATA STORED IN SUPABASE");
    return dbStorage;
  } catch (error) {
    console.error("\u{1F6A8} CRITICAL: Failed to connect to Supabase database");
    console.error("\u{1F6A8} All data MUST be stored in Supabase database as requested");
    console.error("\u{1F6A8} Database connection error:", error instanceof Error ? error.message : "Unknown error");
    console.error("\u{1F6A8} Application cannot continue without Supabase database connection");
    process.exit(1);
  }
}
var storage = initializeStorageSync();

// server/routes.ts
init_auth_utils();
import { z as z2, ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import PDFDocument from "pdfkit";
import passport2 from "passport";
import session from "express-session";

// server/google-auth.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
var BASE_URL = REPLIT_DEV_DOMAIN ? `https://${REPLIT_DEV_DOMAIN}` : "http://0.0.0.0:5000";
var GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/auth/google/callback`;
function setupGoogleAuth() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return false;
  }
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const googleId = profile.id;
          const firstName = profile.name?.givenName || "";
          const lastName = profile.name?.familyName || "";
          const profileImageUrl = profile.photos?.[0]?.value;
          if (!email) {
            return done(null, false, { message: "No email found in Google profile" });
          }
          const existingUser = await storage.getUserByGoogleId(googleId);
          if (existingUser) {
            return done(null, existingUser);
          }
          const existingEmailUser = await storage.getUserByEmail(email);
          if (existingEmailUser) {
            if (existingEmailUser.authProvider === "local") {
              return done(null, false, { message: "This email is already registered with a password. Please use password login instead." });
            }
            return done(null, existingEmailUser);
          }
          return done(null, {
            googleId,
            email,
            firstName,
            lastName,
            profileImageUrl,
            isNewUser: true
          });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user.id || user.googleId);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUserByGoogleId(id) || await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  return true;
}

// server/routes.ts
var loginSchema = z2.object({
  identifier: z2.string().min(1),
  // Can be username or email
  password: z2.string().min(1)
});
var changePasswordSchema = z2.object({
  currentPassword: z2.string().min(1),
  newPassword: z2.string().min(6).max(100)
});
var contactSchema = z2.object({
  name: z2.string().min(1),
  email: z2.string().email(),
  message: z2.string().min(1)
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
  ADMIN: 1,
  TEACHER: 2,
  STUDENT: 3,
  PARENT: 4
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
    if (user.isActive === false) {
      return res.status(401).json({ message: "Account has been deactivated. Please contact administrator." });
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
var studyResourcesDir = "uploads/study-resources";
fs.mkdir(uploadDir, { recursive: true }).catch(() => {
});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {
});
fs.mkdir(profileDir, { recursive: true }).catch(() => {
});
fs.mkdir(studyResourcesDir, { recursive: true }).catch(() => {
});
var storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || "general";
    let dir = uploadDir;
    if (uploadType === "gallery") {
      dir = galleryDir;
    } else if (uploadType === "profile") {
      dir = profileDir;
    } else if (uploadType === "study-resource") {
      dir = studyResourcesDir;
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
var uploadDocument = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024
    // 10MB limit for documents
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|rtf|odt|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = /application\/(pdf|msword|vnd\.openxmlformats-officedocument|vnd\.oasis\.opendocument|text\/plain|vnd\.ms-powerpoint|vnd\.ms-excel)/.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only document files (PDF, DOC, DOCX, TXT, RTF, ODT, PPT, PPTX, XLS, XLSX) are allowed!"));
    }
  }
});
var csvDir = "uploads/csv";
fs.mkdir(csvDir, { recursive: true }).catch(() => {
});
var uploadCSV = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, csvDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, "users-" + uniqueSuffix + ".csv");
    }
  }),
  limits: {
    fileSize: 2 * 1024 * 1024
    // 2MB limit for CSV
  },
  fileFilter: (req, file, cb) => {
    const isCSV = /csv|txt/.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = /text\/(csv|plain)|application\/(vnd\.ms-excel|csv)/.test(file.mimetype);
    if (isCSV || mimeOk) {
      return cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed!"));
    }
  }
});
async function cleanupExpiredExamSessions() {
  try {
    console.log("\u{1F9F9} TIMEOUT CLEANUP: Checking for expired exam sessions...");
    const now = /* @__PURE__ */ new Date();
    const rawResult = await storage.getExpiredExamSessions(now, 50);
    const expiredSessions = Array.isArray(rawResult) ? rawResult : [];
    console.log(`\u{1F9F9} Found ${expiredSessions.length} expired sessions to cleanup`);
    for (const session2 of expiredSessions) {
      try {
        console.log(`\u23F0 AUTO-CLEANUP: Force submitting expired session ${session2.id} for student ${session2.studentId}`);
        await storage.updateExamSession(session2.id, {
          isCompleted: true,
          submittedAt: now,
          status: "submitted"
        });
        await autoScoreExamSession(session2.id, storage);
        console.log(`\u2705 Successfully cleaned up expired session ${session2.id}`);
      } catch (error) {
        console.error(`\u274C Failed to cleanup session ${session2.id}:`, error);
      }
    }
  } catch (error) {
    console.error("\u274C Background cleanup service error:", error);
  }
}
var cleanupInterval = 3 * 60 * 1e3;
var jitter = Math.random() * 3e4;
setTimeout(() => {
  setInterval(cleanupExpiredExamSessions, cleanupInterval);
  cleanupExpiredExamSessions();
}, jitter);
console.log(`\u{1F9F9} TIMEOUT PROTECTION: Background cleanup service started (every ${cleanupInterval / 1e3 / 60} minutes with jitter)`);
async function autoScoreExamSession(sessionId, storage2) {
  const startTime = Date.now();
  try {
    console.log(`\u{1F680} OPTIMIZED AUTO-SCORING: Starting session ${sessionId} scoring...`);
    const scoringResult = await storage2.getExamScoringData(sessionId);
    const { session: session2, summary, scoringData } = scoringResult;
    const databaseQueryTime = Date.now() - startTime;
    console.log(`\u26A1 PERFORMANCE: Database query completed in ${databaseQueryTime}ms (was 3000-8000ms before)`);
    const { totalQuestions, maxScore, studentScore, autoScoredQuestions } = summary;
    const totalScore = studentScore;
    const maxPossibleScore = maxScore;
    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;
    console.log(`\u2705 OPTIMIZED SCORING: Session ${sessionId} - ${totalQuestions} questions (${hasMultipleChoiceQuestions ? autoScoredQuestions + " MC" : "no MC"}, ${hasEssayQuestions ? totalQuestions - autoScoredQuestions + " Essays" : "no Essays"})`);
    const questionDetails = scoringData.map((q) => {
      const questionDetail = {
        questionId: q.questionId,
        questionType: q.questionType,
        points: q.points,
        maxPoints: q.points,
        pointsEarned: q.isCorrect ? q.points : 0,
        isCorrect: q.questionType === "multiple_choice" ? q.isCorrect : null,
        // null for manual review needed
        autoScored: q.questionType === "multiple_choice",
        feedback: null
      };
      if (q.questionType === "multiple_choice") {
        if (q.isCorrect) {
          questionDetail.feedback = `Correct! You earned ${q.points} point${q.points !== 1 ? "s" : ""}.`;
        } else {
          questionDetail.feedback = `Incorrect. This question was worth ${q.points} point${q.points !== 1 ? "s" : ""}.`;
        }
      } else {
        questionDetail.feedback = `This ${q.questionType} question will be manually reviewed by your instructor.`;
      }
      return questionDetail;
    });
    console.log("\u{1F4BE} Persisting MCQ scores to student_answers for score merging...");
    const studentAnswers2 = await storage2.getStudentAnswers(sessionId);
    for (const detail of questionDetails) {
      if (detail.autoScored && detail.questionId) {
        const studentAnswer = studentAnswers2.find((sa) => sa.questionId === detail.questionId);
        if (studentAnswer) {
          try {
            await storage2.updateStudentAnswer(studentAnswer.id, {
              pointsEarned: detail.pointsEarned,
              isCorrect: detail.isCorrect,
              autoScored: true
            });
            console.log(`\u2705 Updated answer ${studentAnswer.id} with ${detail.pointsEarned} points`);
          } catch (updateError) {
            console.error(`\u274C Failed to update answer ${studentAnswer.id}:`, updateError);
          }
        }
      }
    }
    const breakdown = {
      totalQuestions,
      autoScoredQuestions,
      correctAnswers: questionDetails.filter((q) => q.isCorrect === true).length,
      incorrectAnswers: questionDetails.filter((q) => q.isCorrect === false).length,
      pendingManualReview: questionDetails.filter((q) => q.isCorrect === null).length,
      maxScore: maxPossibleScore,
      earnedScore: totalScore
    };
    if (process.env.NODE_ENV === "development") {
      console.log(`\u{1F4CA} DETAILED BREAKDOWN:`, breakdown);
      questionDetails.forEach((q, index2) => {
        console.log(`Question ${index2 + 1} (ID: ${q.questionId}): ${q.isCorrect !== null ? q.isCorrect ? "Correct!" : "Incorrect" : "Manual Review"} - ${q.pointsEarned}/${q.points} points`);
      });
    }
    console.log(`\u{1F3AF} Preparing exam result for student ${session2.studentId}, exam ${session2.examId}`);
    console.log(`\u{1F4CA} Score calculation: ${totalScore}/${maxPossibleScore} (${breakdown.correctAnswers} correct, ${breakdown.incorrectAnswers} incorrect, ${breakdown.pendingManualReview} pending manual review)`);
    if (!session2.studentId) {
      throw new Error("CRITICAL: Session missing studentId - cannot create exam result");
    }
    if (!session2.examId) {
      throw new Error("CRITICAL: Session missing examId - cannot create exam result");
    }
    if (maxPossibleScore === 0 && totalQuestions > 0) {
      console.warn("\u26A0\uFE0F WARNING: Max possible score is 0 but exam has questions - check question points configuration");
    }
    const existingResults = await storage2.getExamResultsByStudent(session2.studentId);
    console.log(`\u{1F50D} Found ${existingResults.length} existing results for student ${session2.studentId}`);
    const existingResult = existingResults.find((r) => r.examId === session2.examId);
    if (existingResult) {
      console.log(`\u{1F4CB} Found existing result ID ${existingResult.id} for exam ${session2.examId} - will update`);
    } else {
      console.log(`\u{1F195} No existing result found for exam ${session2.examId} - will create new`);
    }
    let SYSTEM_AUTO_SCORING_UUID = "00000000-0000-0000-0000-000000000001";
    try {
      const adminUsers = await storage2.getUsersByRole(ROLES.ADMIN);
      if (adminUsers && adminUsers.length > 0) {
        SYSTEM_AUTO_SCORING_UUID = adminUsers[0].id;
        console.log(`Using admin user ${SYSTEM_AUTO_SCORING_UUID} for auto-scoring recordedBy`);
      } else {
        SYSTEM_AUTO_SCORING_UUID = session2.studentId;
        console.log(`No admin found, using student ${SYSTEM_AUTO_SCORING_UUID} for auto-scoring recordedBy`);
      }
    } catch (userError) {
      console.warn("Failed to find admin for auto-scoring, using student ID:", userError);
      SYSTEM_AUTO_SCORING_UUID = session2.studentId;
    }
    const resultData = {
      examId: session2.examId,
      studentId: session2.studentId,
      score: totalScore,
      maxScore: maxPossibleScore,
      marksObtained: totalScore,
      // ✅ CRITICAL FIX: Ensure database constraint compatibility
      autoScored: true,
      // Always true when auto-scoring pass completes
      recordedBy: SYSTEM_AUTO_SCORING_UUID,
      // Special UUID for auto-generated results
      // Include detailed feedback in the result data
      questionDetails,
      breakdown,
      immediateResults: {
        questions: questionDetails,
        summary: breakdown
      }
    };
    console.log("\u{1F4BE} Result data to save:", JSON.stringify(resultData, null, 2));
    try {
      if (existingResult) {
        console.log(`\u{1F504} Updating existing exam result ID: ${existingResult.id}`);
        const updatedResult = await storage2.updateExamResult(existingResult.id, resultData);
        if (!updatedResult) {
          throw new Error(`Failed to update exam result ID: ${existingResult.id} - updateExamResult returned null/undefined`);
        }
        console.log(`\u2705 Updated exam result for student ${session2.studentId}: ${totalScore}/${maxPossibleScore} (ID: ${existingResult.id})`);
        console.log(`\u{1F389} INSTANT FEEDBACK READY: Result updated successfully!`);
      } else {
        console.log("\u{1F195} Creating new exam result...");
        const newResult = await storage2.recordExamResult(resultData);
        if (!newResult || !newResult.id) {
          throw new Error("Failed to create exam result - recordExamResult returned null/undefined or missing ID");
        }
        console.log(`\u2705 Created new exam result for student ${session2.studentId}: ${totalScore}/${maxPossibleScore} (ID: ${newResult.id})`);
        console.log(`\u{1F389} INSTANT FEEDBACK READY: New result created successfully!`);
      }
      console.log(`\u{1F50D} Verifying result was saved - fetching results for student ${session2.studentId}...`);
      const verificationResults = await storage2.getExamResultsByStudent(session2.studentId);
      const savedResult = verificationResults.find((r) => r.examId === session2.examId && r.autoScored === true);
      if (!savedResult) {
        throw new Error("CRITICAL: Result was not properly saved - verification fetch failed to find the auto-scored result");
      }
      console.log(`\u2705 Verification successful: Result found with score ${savedResult.score}/${savedResult.maxScore}, autoScored: ${savedResult.autoScored}`);
      const totalResponseTime = Date.now() - startTime;
      const scoringTime = totalResponseTime - databaseQueryTime;
      const performanceMetrics = {
        sessionId,
        startTime: new Date(startTime).toISOString(),
        databaseQueryTime,
        scoringTime,
        totalResponseTime,
        goalAchieved: totalResponseTime <= 2e3
      };
      if (totalResponseTime > 2e3) {
        console.warn(`\u{1F6A8} PERFORMANCE ALERT: Auto-scoring took ${totalResponseTime}ms (exceeded 2-second goal by ${totalResponseTime - 2e3}ms)`);
        console.warn(`\u{1F4A1} OPTIMIZATION NEEDED: Consider query optimization or caching for session ${sessionId}`);
      } else {
        console.log(`\u{1F3AF} PERFORMANCE SUCCESS: Auto-scoring completed in ${totalResponseTime}ms (within 2-second goal! \u2705)`);
        console.log(`\u{1F4CA} PERFORMANCE METRICS: DB Query: ${databaseQueryTime}ms, Scoring: ${scoringTime}ms, Total: ${totalResponseTime}ms`);
      }
      try {
        await storage2.logPerformanceEvent({
          sessionId,
          eventType: "auto_scoring",
          duration: totalResponseTime,
          goalAchieved: totalResponseTime <= 2e3,
          metadata: JSON.stringify({
            databaseQueryTime,
            scoringTime,
            studentId: session2.studentId,
            examId: session2.examId
          }),
          userId: session2.studentId,
          // Track which student's exam was auto-scored
          clientSide: false
          // Server-side auto-scoring
        });
        console.log(`\u{1F4CA} Performance event logged to database: ${totalResponseTime}ms auto-scoring`);
      } catch (perfLogError) {
        console.warn("\u26A0\uFE0F Failed to log performance event to database:", perfLogError);
      }
      if (process.env.NODE_ENV === "development") {
        console.log(`\u{1F52C} DETAILED METRICS:`, JSON.stringify(performanceMetrics, null, 2));
      }
      console.log(`\u{1F680} AUTO-SCORING COMPLETE - Student should see instant results!`);
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
async function mergeExamScores(answerId, storage2) {
  try {
    console.log(`\u{1F504} SCORE MERGE: Starting merge for answer ${answerId}...`);
    const answer = await storage2.getStudentAnswerById(answerId);
    if (!answer) {
      console.error(`\u274C SCORE MERGE: Answer ${answerId} not found`);
      return;
    }
    const sessionId = answer.sessionId;
    console.log(`\u{1F4DD} SCORE MERGE: Processing session ${sessionId}`);
    const allAnswers = await storage2.getStudentAnswers(sessionId);
    const session2 = await storage2.getExamSessionById(sessionId);
    const examQuestions2 = await storage2.getExamQuestions(session2.examId);
    const essayQuestions = examQuestions2.filter(
      (q) => q.questionType === "text" || q.questionType === "essay"
    );
    const gradedEssayAnswers = allAnswers.filter((a) => {
      const question = examQuestions2.find((q) => q.id === a.questionId);
      const isEssay = question?.questionType === "text" || question?.questionType === "essay";
      return isEssay && a.pointsEarned !== null && a.pointsEarned !== void 0;
    });
    const allEssaysGraded = essayQuestions.length === gradedEssayAnswers.length;
    if (!allEssaysGraded) {
      console.log(`\u23F3 SCORE MERGE: Not all essays graded yet (${gradedEssayAnswers.length}/${essayQuestions.length}). Skipping merge.`);
      return;
    }
    console.log(`\u2705 SCORE MERGE: All essays graded! Calculating final score...`);
    let totalScore = 0;
    let maxScore = 0;
    for (const question of examQuestions2) {
      maxScore += question.points || 0;
      const studentAnswer = allAnswers.find((a) => a.questionId === question.id);
      if (studentAnswer) {
        totalScore += studentAnswer.pointsEarned || 0;
      }
    }
    console.log(`\u{1F4CA} SCORE MERGE: Final score = ${totalScore}/${maxScore}`);
    const existingResult = await storage2.getExamResultByExamAndStudent(session2.examId, session2.studentId);
    if (existingResult) {
      await storage2.updateExamResult(existingResult.id, {
        score: totalScore,
        maxScore,
        marksObtained: totalScore,
        autoScored: false
        // Now includes manual scores
      });
      console.log(`\u2705 SCORE MERGE: Updated exam result ${existingResult.id} with merged score`);
    } else {
      await storage2.recordExamResult({
        examId: session2.examId,
        studentId: session2.studentId,
        score: totalScore,
        maxScore,
        marksObtained: totalScore,
        autoScored: false,
        recordedBy: session2.studentId
        // System recorded
      });
      console.log(`\u2705 SCORE MERGE: Created new exam result with merged score`);
    }
    console.log(`\u{1F389} SCORE MERGE: Complete! Final score saved.`);
  } catch (error) {
    console.error(`\u274C SCORE MERGE ERROR:`, error);
  }
}
async function registerRoutes(app2) {
  app2.use(session({
    secret: process.env.JWT_SECRET || SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1e3
      // 24 hours
    }
  }));
  app2.use(passport2.initialize());
  app2.use(passport2.session());
  const googleOAuthEnabled = setupGoogleAuth();
  if (googleOAuthEnabled) {
    console.log("\u2705 Google OAuth authentication enabled");
  } else {
    console.log("\u26A0\uFE0F  Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)");
  }
  app2.get("/api/auth/google", passport2.authenticate("google", {
    scope: ["profile", "email"]
  }));
  app2.get(
    "/api/auth/google/callback",
    (req, res, next) => {
      console.log("\u{1F4E7} Google OAuth callback received:", {
        query: req.query,
        hasCode: !!req.query.code,
        hasError: !!req.query.error
      });
      passport2.authenticate("google", (err, user, info) => {
        if (err) {
          console.error("\u274C Google OAuth error:", err);
          console.error("Error details:", { message: err.message, stack: err.stack });
          return res.redirect("/login?error=google_auth_failed&message=" + encodeURIComponent("Authentication failed. Please try again."));
        }
        if (!user) {
          const message = info?.message || "Authentication failed";
          console.error("\u274C Google OAuth: No user returned. Info:", info);
          return res.redirect("/login?error=google_auth_failed&message=" + encodeURIComponent(message));
        }
        if (user.isNewUser) {
          req.session.pendingUser = user;
          return res.redirect("/login?oauth=google&step=role_selection");
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.redirect("/login?error=google_auth_failed&message=" + encodeURIComponent("Failed to complete login"));
          }
          const token = jwt.sign({ userId: user.id, roleId: user.roleId }, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
          res.redirect(`/login?token=${token}&provider=google`);
        });
      })(req, res, next);
    }
  );
  app2.post("/api/auth/google/complete-signup", async (req, res) => {
    try {
      const { roleId } = req.body;
      const pendingUser = req.session.pendingUser;
      if (!pendingUser) {
        return res.status(400).json({ message: "No pending signup found" });
      }
      if (roleId !== ROLES.ADMIN && roleId !== ROLES.TEACHER) {
        return res.status(400).json({ message: "Google OAuth is only available for Admin and Teacher roles" });
      }
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const existingUsers = await storage.getUsersByRole(roleId);
      const existingUsernames = existingUsers.map((u) => u.username).filter(Boolean);
      const nextNumber = getNextUserNumber(existingUsernames, roleId, currentYear);
      const username = generateUsername(roleId, currentYear, "", nextNumber);
      const newUser = await storage.createUser({
        email: pendingUser.email,
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        username,
        roleId,
        authProvider: "google",
        googleId: pendingUser.googleId,
        profileImageUrl: pendingUser.profileImageUrl,
        mustChangePassword: false,
        passwordHash: null,
        isActive: true
      });
      delete req.session.pendingUser;
      const token = jwt.sign({ userId: newUser.id, roleId: newUser.roleId }, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
      res.json({ token, user: newUser, message: "Account created successfully" });
    } catch (error) {
      console.error("Error completing Google signup:", error);
      res.status(500).json({ message: "Failed to complete signup" });
    }
  });
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
      const { identifier, password } = loginSchema.parse(req.body);
      console.log("Login attempt for:", identifier || "unknown");
      const clientIp = req.ip || req.connection.remoteAddress || "unknown";
      const attemptKey = `${clientIp}:${identifier || "no-identifier"}`;
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
      loginAttempts.set(attemptKey, {
        count: attempts.count + 1,
        lastAttempt: now
      });
      let user;
      if (identifier.includes("@")) {
        user = await storage.getUserByEmail(identifier);
      } else {
        user = await storage.getUserByUsername(identifier);
        if (!user) {
          user = await storage.getUserByEmail(identifier);
        }
      }
      if (!user) {
        console.log(`Login failed: User not found for identifier ${identifier}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!user.passwordHash) {
        console.error(`SECURITY WARNING: User ${identifier} has no password hash set`);
        return res.status(401).json({ message: "Account setup incomplete. Please contact administrator." });
      }
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log(`Login failed: Invalid password for identifier ${identifier}`);
        return res.status(401).json({ message: "Invalid credentials" });
      }
      loginAttempts.delete(attemptKey);
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        roleId: user.roleId,
        iat: Math.floor(Date.now() / 1e3)
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
      console.error("Login error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid identifier or password format" });
      }
      res.status(500).json({ message: "Login failed. Please try again." });
    }
  });
  app2.post("/api/auth/change-password", authenticateUser, async (req, res) => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(404).json({ message: "User not found" });
      }
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await storage.updateUser(userId, {
        passwordHash: newPasswordHash,
        mustChangePassword: false
      });
      console.log(`Password changed successfully for user ${userId}`);
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Password change error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid password format" });
      }
      res.status(500).json({ message: "Password change failed. Please try again." });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { identifier } = z2.object({ identifier: z2.string().min(1) }).parse(req.body);
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      if (!user) {
        return res.json({ message: "If an account exists with that email/username, a password reset link will be sent." });
      }
      const crypto = __require("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);
      if (process.env.NODE_ENV === "development") {
        console.log(`Password reset token for ${identifier}: ${resetToken}`);
        return res.json({
          message: "Password reset token generated",
          token: resetToken,
          developmentOnly: true
        });
      }
      res.json({ message: "If an account exists with that email/username, a password reset link will be sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = z2.object({
        token: z2.string().min(1),
        newPassword: z2.string().min(6).max(100)
      }).parse(req.body);
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await storage.updateUser(resetToken.userId, {
        passwordHash: newPasswordHash,
        mustChangePassword: false
      });
      await storage.markPasswordResetTokenAsUsed(token);
      console.log(`Password reset successfully for user ${resetToken.userId}`);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/admin/reset-user-password", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId, newPassword } = z2.object({
        userId: z2.string().uuid(),
        newPassword: z2.string().min(6).max(100).optional()
      }).parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { generatePassword: generatePassword2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const password = newPassword || generatePassword2(currentYear);
      const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await storage.updateUser(userId, {
        passwordHash,
        mustChangePassword: true
      });
      console.log(`Admin ${req.user?.email} reset password for user ${userId}`);
      res.json({
        message: "Password reset successfully",
        tempPassword: password,
        username: user.username || user.email
      });
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
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
      if (error instanceof z2.ZodError) {
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
      if (error instanceof z2.ZodError) {
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
  app2.post("/api/admin/upload-users-csv", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single("csvFile"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "CSV file is required" });
      }
      const csvContent = await fs.readFile(req.file.path, "utf-8");
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file must contain header and at least one row" });
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredColumns = ["studentname", "class", "parentname", "parentemail"];
      const hasRequiredColumns = requiredColumns.every((col) => headers.includes(col));
      if (!hasRequiredColumns) {
        return res.status(400).json({
          message: "CSV must contain columns: studentName, class, parentName, parentEmail"
        });
      }
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const { generateUsername: generateUsername2, generatePassword: generatePassword2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const existingUsernames = await storage.getAllUsernames();
      const createdUsers = [];
      const errors = [];
      const studentRole = await storage.getRoleByName("Student");
      const parentRole = await storage.getRoleByName("Parent");
      if (!studentRole || !parentRole) {
        return res.status(500).json({ message: "Required roles not found in database" });
      }
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row = {};
        headers.forEach((header, index2) => {
          row[header] = values[index2] || "";
        });
        try {
          const studentName = row["studentname"];
          const className = row["class"];
          const rollNo = row["rollno"] || String(i);
          const parentName = row["parentname"];
          const parentEmail = row["parentemail"];
          if (!studentName || !className || !parentName || !parentEmail) {
            errors.push(`Row ${i + 1}: Missing required fields`);
            continue;
          }
          const [studentFirstName, ...studentLastParts] = studentName.split(" ");
          const studentLastName = studentLastParts.join(" ") || studentFirstName;
          const [parentFirstName, ...parentLastParts] = parentName.split(" ");
          const parentLastName = parentLastParts.join(" ") || parentFirstName;
          let parent = await storage.getUserByEmail(parentEmail);
          let parentId;
          let parentCredentials = null;
          if (!parent) {
            const parentCount = existingUsernames.filter((u) => u.startsWith(`THS-PAR-${currentYear}-`)).length + 1;
            const parentUsername = generateUsername2(parentRole.id, currentYear, "", parentCount);
            const parentPassword = generatePassword2(currentYear);
            const parentPasswordHash = await bcrypt.hash(parentPassword, BCRYPT_ROUNDS);
            parent = await storage.createUser({
              username: parentUsername,
              email: parentEmail,
              passwordHash: parentPasswordHash,
              roleId: parentRole.id,
              firstName: parentFirstName,
              lastName: parentLastName,
              mustChangePassword: true
            });
            existingUsernames.push(parentUsername);
            parentCredentials = { username: parentUsername, password: parentPassword };
            parentId = parent.id;
          } else {
            parentId = parent.id;
          }
          const classObj = await storage.getClasses();
          const studentClass = classObj.find((c) => c.name.toLowerCase() === className.toLowerCase());
          if (!studentClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }
          const classPrefix = `THS-STU-${currentYear}-${className.toUpperCase()}-`;
          const studentCount = existingUsernames.filter((u) => u.startsWith(classPrefix)).length + 1;
          const studentUsername = generateUsername2(studentRole.id, currentYear, className.toUpperCase(), studentCount);
          const studentPassword = generatePassword2(currentYear);
          const studentPasswordHash = await bcrypt.hash(studentPassword, BCRYPT_ROUNDS);
          const studentUser = await storage.createUser({
            username: studentUsername,
            email: `${studentUsername.toLowerCase()}@ths.edu`,
            passwordHash: studentPasswordHash,
            roleId: studentRole.id,
            firstName: studentFirstName,
            lastName: studentLastName,
            mustChangePassword: true
          });
          existingUsernames.push(studentUsername);
          const admissionNumber = studentUsername;
          await storage.createStudent({
            id: studentUser.id,
            admissionNumber,
            classId: studentClass.id,
            parentId
          });
          createdUsers.push({
            type: "student",
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
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      await fs.unlink(req.file.path);
      res.json({
        message: `Successfully created ${createdUsers.length} users`,
        users: createdUsers,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("CSV upload error:", error);
      if (req.file?.path) {
        try {
          await fs.unlink(req.file.path);
        } catch {
        }
      }
      res.status(500).json({ message: "Failed to process CSV file" });
    }
  });
  app2.post("/api/users/generate-login-slips", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { users: users2 } = req.body;
      if (!Array.isArray(users2) || users2.length === 0) {
        return res.status(400).json({ message: "Users array is required and must not be empty" });
      }
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="THS-Login-Slips-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf"`);
      doc.pipe(res);
      doc.fontSize(20).font("Helvetica-Bold").text("Treasure-Home School", { align: "center" });
      doc.fontSize(12).font("Helvetica").text("Login Credentials", { align: "center" });
      doc.moveDown(2);
      users2.forEach((user, index2) => {
        if (index2 > 0) {
          doc.addPage();
        }
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke();
        doc.fontSize(18).font("Helvetica-Bold").text("Login Information", 50, 60, { align: "center" });
        doc.moveDown(1.5);
        const startY = 120;
        doc.fontSize(14).font("Helvetica-Bold");
        doc.text("Name:", 70, startY);
        doc.font("Helvetica").text(`${user.firstName} ${user.lastName}`, 200, startY);
        doc.font("Helvetica-Bold").text("Role:", 70, startY + 30);
        const roleNames = { 1: "Admin", 2: "Teacher", 3: "Student", 4: "Parent" };
        doc.font("Helvetica").text(roleNames[user.roleId] || "Unknown", 200, startY + 30);
        doc.font("Helvetica-Bold").text("Username:", 70, startY + 60);
        doc.font("Helvetica-Bold").fontSize(16).text(user.username, 200, startY + 60);
        doc.fontSize(14).font("Helvetica-Bold").text("Password:", 70, startY + 90);
        doc.font("Helvetica-Bold").fontSize(16).text(user.password, 200, startY + 90);
        doc.fontSize(12).font("Helvetica-Oblique").text("\u26A0\uFE0F Please change your password immediately after first login", 70, startY + 140, {
          width: doc.page.width - 140,
          align: "center"
        });
        doc.fontSize(11).font("Helvetica").text("Login Instructions:", 70, startY + 180);
        doc.fontSize(10).text("1. Go to the school portal login page", 90, startY + 200);
        doc.text("2. Enter your username and password exactly as shown above", 90, startY + 220);
        doc.text("3. You will be prompted to create a new secure password", 90, startY + 240);
        doc.text("4. Keep your new password safe and do not share it with anyone", 90, startY + 260);
        doc.fontSize(9).font("Helvetica-Oblique").text(
          `Generated on ${(/* @__PURE__ */ new Date()).toLocaleDateString()} at ${(/* @__PURE__ */ new Date()).toLocaleTimeString()}`,
          50,
          doc.page.height - 80,
          { align: "center" }
        );
        doc.fontSize(10).font("Helvetica-Bold").text(
          "For assistance, contact the school administrator",
          50,
          doc.page.height - 60,
          { align: "center" }
        );
      });
      doc.end();
    } catch (error) {
      console.error("Login slip generation error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to generate login slips" });
      }
    }
  });
  app2.post("/api/users/bulk-import", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { users: users2, year } = req.body;
      if (!Array.isArray(users2) || users2.length === 0) {
        return res.status(400).json({ message: "Users array is required and must not be empty" });
      }
      if (!year || typeof year !== "string") {
        return res.status(400).json({ message: "Year is required (e.g., '2025')" });
      }
      const existingUsernames = await storage.getAllUsernames();
      const results = [];
      const errors = [];
      for (const userData of users2) {
        try {
          const { roleId, firstName, lastName, email, phone, address, dateOfBirth, gender, classLevel, subject, parentId } = userData;
          if (!roleId || !firstName || !lastName) {
            errors.push({
              user: `${firstName} ${lastName}`,
              error: "Missing required fields (roleId, firstName, lastName)"
            });
            continue;
          }
          const optional = roleId === ROLES.STUDENT ? classLevel || "" : roleId === ROLES.TEACHER ? subject || "" : "";
          const nextNumber = getNextUserNumber(existingUsernames, roleId, year, optional);
          const username = generateUsername(roleId, year, optional, nextNumber);
          const password = generatePassword(year);
          const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
          const newUser = await storage.createUser({
            username,
            email: email || `${username.toLowerCase()}@ths.edu`,
            passwordHash,
            mustChangePassword: true,
            roleId,
            firstName,
            lastName,
            phone: phone || null,
            address: address || null,
            dateOfBirth: dateOfBirth || null,
            gender: gender || null,
            isActive: true
          });
          existingUsernames.push(username);
          if (roleId === ROLES.STUDENT) {
            const admissionNumber = username;
            await storage.createStudent({
              id: newUser.id,
              admissionNumber,
              classId: userData.classId || null,
              parentId: parentId || null,
              emergencyContact: phone || null,
              medicalInfo: null
            });
          }
          results.push({
            userId: newUser.id,
            username,
            password,
            // Return plain password for login slip generation
            firstName,
            lastName,
            roleId,
            email: newUser.email
          });
        } catch (error) {
          errors.push({
            user: `${userData.firstName} ${userData.lastName}`,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }
      res.json({
        message: `Provisioned ${results.length} users successfully`,
        results,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("Bulk import error:", error);
      res.status(500).json({ message: "Bulk import failed. Please try again." });
    }
  });
  app2.get("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.query;
      let students2 = [];
      if (classId && typeof classId === "string") {
        students2 = await storage.getStudentsByClass(parseInt(classId));
      } else {
        students2 = await storage.getAllStudents(true);
      }
      res.json(students2);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.post("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log("Creating student for email:", req.body.email);
      const isValidDate = (dateString) => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(dateString)) return false;
        const [year, month, day] = dateString.split("-").map(Number);
        if (year < 1900 || year > 2100) return false;
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        if (month === 2) {
          const isLeapYear = year % 4 === 0 && year % 100 !== 0 || year % 400 === 0;
          if (day > (isLeapYear ? 29 : 28)) return false;
        } else if ([4, 6, 9, 11].includes(month) && day > 30) {
          return false;
        }
        return true;
      };
      const sharedCreateStudentSchema = createStudentSchema.extend({
        dateOfBirth: createStudentSchema.shape.dateOfBirth.refine(isValidDate, "Invalid date of birth"),
        admissionDate: createStudentSchema.shape.admissionDate.refine(isValidDate, "Invalid admission date"),
        medicalInfo: z2.string().nullable().optional().transform((val) => val === null ? "" : val)
      });
      for (const field of ["phone", "address", "medicalInfo", "parentId"]) {
        if (req.body[field] == null || req.body[field] === "") {
          delete req.body[field];
        }
      }
      const validatedData = sharedCreateStudentSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(409).json({ message: "Email address already exists" });
      }
      const passwordHash = await bcrypt.hash(validatedData.password, BCRYPT_ROUNDS);
      const userData = {
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone || null,
        address: validatedData.address || null,
        dateOfBirth: validatedData.dateOfBirth,
        // Store exact YYYY-MM-DD string
        gender: validatedData.gender,
        profileImageUrl: validatedData.profileImageUrl || null,
        roleId: ROLES.STUDENT,
        // Always set to student role
        isActive: true
      };
      console.log("Creating user for student...");
      const user = await storage.createUser(userData);
      console.log("User created with ID:", user.id);
      try {
        const studentData = {
          id: user.id,
          // Use the same ID as the user
          admissionNumber: validatedData.admissionNumber,
          classId: validatedData.classId,
          parentId: validatedData.parentId || null,
          admissionDate: validatedData.admissionDate,
          // Store exact YYYY-MM-DD string
          emergencyContact: validatedData.emergencyContact,
          medicalInfo: validatedData.medicalInfo || null
        };
        console.log("Creating student record...");
        const student = await storage.createStudent(studentData);
        console.log("Student created successfully");
        res.json({
          message: "Student created successfully",
          student,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      } catch (studentError) {
        console.error("Student creation failed, rolling back user:", studentError);
        try {
          await storage.deleteUser(user.id);
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
        if (studentError.code === "23505") {
          return res.status(409).json({ message: "Admission number already exists" });
        }
        throw studentError;
      }
    } catch (error) {
      console.error("Error creating student:", error);
      if (error?.name === "ZodError" || error?.issues && Array.isArray(error.issues)) {
        const validationErrors = error.issues || [];
        const formattedErrors = validationErrors.map((err) => {
          const fieldPath = err.path.length > 0 ? err.path.join(".") : "unknown field";
          return `${fieldPath}: ${err.message}`;
        });
        console.error("Student creation validation errors:", formattedErrors);
        return res.status(400).json({
          message: "Validation failed",
          errors: formattedErrors.join(", "),
          details: validationErrors
          // Include full details for debugging
        });
      }
      if (error?.code) {
        switch (error.code) {
          case "23503":
            if (error.message.includes("role_id")) {
              return res.status(400).json({ message: "Invalid user role. Please contact administrator." });
            } else if (error.message.includes("class_id")) {
              return res.status(400).json({ message: "Selected class does not exist. Please select a valid class." });
            } else if (error.message.includes("parent_id")) {
              return res.status(400).json({ message: "Selected parent does not exist. Please select a valid parent." });
            }
            return res.status(400).json({ message: "Invalid reference data. Please check all selections." });
          case "22007":
            return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD format." });
          case "23505":
            if (error.message.includes("email")) {
              return res.status(409).json({ message: "Email address already exists" });
            } else if (error.message.includes("admission_number")) {
              return res.status(409).json({ message: "Admission number already exists" });
            }
            return res.status(409).json({ message: "Duplicate value detected" });
          default:
            console.error("Database error:", error.code, error.message);
        }
      }
      res.status(500).json({ message: "Failed to create student" });
    }
  });
  app2.patch("/api/students/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Updating student ${id}`);
      const { password, email, firstName, lastName, phone, address, dateOfBirth, gender, profileImageUrl, ...studentData } = req.body;
      let userPatch = {};
      if (email !== void 0) userPatch.email = email;
      if (firstName !== void 0) userPatch.firstName = firstName;
      if (lastName !== void 0) userPatch.lastName = lastName;
      if (phone !== void 0) userPatch.phone = phone;
      if (address !== void 0) userPatch.address = address;
      if (dateOfBirth !== void 0) userPatch.dateOfBirth = dateOfBirth;
      if (gender !== void 0) userPatch.gender = gender;
      if (profileImageUrl !== void 0) userPatch.profileImageUrl = profileImageUrl;
      if (password && password.length >= 6) {
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        userPatch.passwordHash = passwordHash;
      }
      let studentPatch = {};
      if (studentData.admissionNumber !== void 0) studentPatch.admissionNumber = studentData.admissionNumber;
      if (studentData.classId !== void 0) studentPatch.classId = studentData.classId;
      if (studentData.parentId !== void 0) studentPatch.parentId = studentData.parentId;
      if (studentData.admissionDate !== void 0) studentPatch.admissionDate = studentData.admissionDate;
      if (studentData.emergencyContact !== void 0) studentPatch.emergencyContact = studentData.emergencyContact;
      if (studentData.medicalInfo !== void 0) studentPatch.medicalInfo = studentData.medicalInfo;
      if (email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== id) {
          return res.status(409).json({ message: "Email address already exists" });
        }
      }
      if (studentPatch.admissionNumber) {
        const existingStudent = await storage.getStudentByAdmissionNumber(studentPatch.admissionNumber);
        if (existingStudent && existingStudent.id !== id) {
          return res.status(409).json({ message: "Admission number already exists" });
        }
      }
      const result = await storage.updateStudent(id, {
        userPatch: Object.keys(userPatch).length > 0 ? userPatch : void 0,
        studentPatch: Object.keys(studentPatch).length > 0 ? studentPatch : void 0
      });
      if (!result) {
        return res.status(404).json({ message: "Student not found" });
      }
      const { passwordHash: _, ...userResponse } = result.user;
      res.json({
        message: "Student updated successfully",
        user: userResponse,
        student: result.student
      });
    } catch (error) {
      console.error("Error updating student:", error);
      if (error?.code) {
        switch (error.code) {
          case "23503":
            if (error.message.includes("class_id")) {
              return res.status(400).json({ message: "Selected class does not exist. Please select a valid class." });
            } else if (error.message.includes("parent_id")) {
              return res.status(400).json({ message: "Selected parent does not exist. Please select a valid parent." });
            }
            return res.status(400).json({ message: "Invalid reference data. Please check all selections." });
          case "23505":
            if (error.message.includes("email")) {
              return res.status(409).json({ message: "Email address already exists" });
            } else if (error.message.includes("admission_number")) {
              return res.status(409).json({ message: "Admission number already exists" });
            }
            return res.status(409).json({ message: "Duplicate value detected" });
          default:
            console.error("Database error:", error.code, error.message);
        }
      }
      res.status(500).json({ message: "Failed to update student" });
    }
  });
  app2.patch("/api/students/:id/block", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "isActive must be a boolean value" });
      }
      console.log(`${isActive ? "Unblocking" : "Blocking"} student ${id}`);
      const result = await storage.setUserActive(id, isActive);
      if (!result) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({
        message: `Student ${isActive ? "unblocked" : "blocked"} successfully`,
        user: { id: result.id, isActive: result.isActive }
      });
    } catch (error) {
      console.error("Error blocking/unblocking student:", error);
      res.status(500).json({ message: "Failed to update student status" });
    }
  });
  app2.delete("/api/students/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
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
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });
  app2.get("/api/classes", authenticateUser, async (req, res) => {
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
  app2.get("/api/subjects", authenticateUser, async (req, res) => {
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
  app2.get("/api/student/attendance", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      const studentId = req.user.id;
      const { month, year } = req.query;
      const attendance2 = await storage.getAttendanceByStudent(studentId, void 0);
      let filteredAttendance = attendance2;
      if (month !== void 0 && year !== void 0) {
        filteredAttendance = attendance2.filter((record) => {
          const recordDate = new Date(record.date);
          return recordDate.getMonth() === parseInt(month) && recordDate.getFullYear() === parseInt(year);
        });
      }
      res.json(filteredAttendance);
    } catch (error) {
      console.error("Error fetching student attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });
  app2.post("/api/exams", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log("Exam creation request body:", JSON.stringify(req.body, null, 2));
      const sanitizedBody = { ...req.body };
      const optionalNumericFields = ["timeLimit", "passingScore"];
      const optionalDateFields = ["startTime", "endTime"];
      const optionalTextFields = ["instructions"];
      [...optionalNumericFields, ...optionalDateFields, ...optionalTextFields].forEach((field) => {
        if (sanitizedBody[field] === "") {
          sanitizedBody[field] = void 0;
        }
      });
      if (sanitizedBody.classId) sanitizedBody.classId = Number(sanitizedBody.classId);
      if (sanitizedBody.subjectId) sanitizedBody.subjectId = Number(sanitizedBody.subjectId);
      if (sanitizedBody.termId) sanitizedBody.termId = Number(sanitizedBody.termId);
      if (sanitizedBody.totalMarks) sanitizedBody.totalMarks = Number(sanitizedBody.totalMarks);
      console.log("Sanitized exam data:", JSON.stringify(sanitizedBody, null, 2));
      const examData = insertExamSchema.omit({ createdBy: true }).parse(sanitizedBody);
      console.log("Parsed exam data:", JSON.stringify(examData, null, 2));
      const examWithCreator = { ...examData, createdBy: req.user.id };
      console.log("Final exam data with creator:", JSON.stringify(examWithCreator, null, 2));
      const exam = await storage.createExam(examWithCreator);
      res.json(exam);
    } catch (error) {
      console.error("Exam creation error:", error);
      if (error instanceof Error) {
        let message = "Invalid exam data";
        let details = error.message;
        if (error.message.includes("positive")) {
          message = "Please check required fields: class, subject, term, and total marks must be selected/filled";
        } else if (error.message.includes("date")) {
          message = "Invalid date format - please use a valid date in YYYY-MM-DD format";
        } else if (error.message.includes("foreign key")) {
          message = "Invalid reference data - please ensure valid class, subject, and term are selected";
        }
        res.status(400).json({ message, details });
      } else {
        res.status(400).json({ message: "Invalid exam data" });
      }
    }
  });
  app2.get("/api/exams", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      let exams2 = [];
      console.log(`Fetching exams for user: ${user.email} (role: ${user.roleId})`);
      if (user.roleId === ROLES.STUDENT) {
        const student = await storage.getStudent(user.id);
        console.log(`Student data:`, student);
        if (student && student.classId) {
          const classExams = await storage.getExamsByClass(student.classId);
          console.log(`Found ${classExams.length} exams for class ${student.classId}`);
          exams2 = classExams.filter((exam) => exam.isPublished);
          console.log(`Filtered to ${exams2.length} published exams for student`);
        } else {
          console.log("Student not found or has no class assigned");
        }
      } else {
        if (user.roleId === ROLES.TEACHER) {
          const allExams = await storage.getAllExams();
          exams2 = allExams.filter((exam) => exam.createdBy === user.id);
          console.log(`Teacher sees ${exams2.length} exams they created`);
        } else {
          exams2 = await storage.getAllExams();
          console.log(`Admin sees all ${exams2.length} exams`);
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
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.post("/api/exam-questions", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { options, ...questionData } = req.body;
      if (questionData.questionType) {
        questionData.questionType = String(questionData.questionType).toLowerCase().replace(/[-\s]/g, "_");
      }
      const validatedQuestion = insertExamQuestionSchema.parse(questionData);
      let validatedOptions = [];
      if (validatedQuestion.questionType === "multiple_choice") {
        if (!options || !Array.isArray(options) || options.length < 2) {
          return res.status(400).json({ message: "Multiple choice questions require at least 2 options" });
        }
        const hasCorrectAnswer = options.some((option) => option.isCorrect === true);
        if (!hasCorrectAnswer) {
          return res.status(400).json({ message: "Multiple choice questions require at least one correct answer" });
        }
        try {
          validatedOptions = options.map((option) => createQuestionOptionSchema.parse(option));
        } catch (optionError) {
          return res.status(400).json({
            message: "Invalid option data",
            details: optionError instanceof ZodError ? optionError.errors : optionError
          });
        }
      }
      const question = await storage.createExamQuestionWithOptions(validatedQuestion, validatedOptions);
      res.json(question);
    } catch (error) {
      console.error("Question creation error:", error);
      let message = "Invalid question data";
      let details = "";
      if (error instanceof Error) {
        details = error.message;
        if (error.message.includes("options")) {
          message = "Invalid question options - multiple choice questions need at least 2 options with one marked as correct";
        } else if (error.message.includes("questionText")) {
          message = "Question text is required and must be at least 5 characters";
        } else if (error.message.includes("questionType")) {
          message = "Invalid question type - must be multiple_choice, text, or essay";
        } else if (error.message.includes("foreign key")) {
          message = "Invalid exam reference - please ensure the exam exists and you have permission to add questions";
        }
      }
      res.status(400).json({ message, details });
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
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exam question:", error);
      res.status(500).json({ message: "Failed to delete question", error: error instanceof Error ? error.message : String(error) });
    }
  });
  app2.get("/api/exams/question-counts", authenticateUser, async (req, res) => {
    try {
      const raw = req.query.examIds;
      if (!raw) {
        return res.status(400).json({ message: "examIds parameter is required" });
      }
      const ids = (Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : []).map((x) => parseInt(String(x), 10)).filter(Number.isFinite);
      if (ids.length === 0) {
        return res.status(400).json({ message: "No valid exam IDs provided" });
      }
      console.log("Fetching question counts for exam IDs:", ids);
      const questionCounts = {};
      for (const examId of ids) {
        try {
          const count = await storage.getExamQuestionCount(examId);
          questionCounts[examId] = count;
        } catch (examError) {
          console.warn(`Failed to get count for exam ${examId}:`, examError);
          questionCounts[examId] = 0;
        }
      }
      console.log("Question counts result:", questionCounts);
      res.json(questionCounts);
    } catch (error) {
      console.error("Error fetching question counts:", error);
      res.status(500).json({ message: "Failed to fetch question counts" });
    }
  });
  app2.patch("/api/exams/:id/publish", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { isPublished } = req.body;
      const exam = await storage.getExamById(parseInt(id));
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (user.roleId === ROLES.TEACHER && exam.createdBy !== user.id) {
        return res.status(403).json({ message: "You can only publish exams you created" });
      }
      const updatedExam = await storage.updateExam(parseInt(id), { isPublished });
      if (!updatedExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(updatedExam);
    } catch (error) {
      console.error("Error updating exam publish status:", error);
      res.status(500).json({ message: "Failed to update exam publish status" });
    }
  });
  app2.get("/api/grading/tasks", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { teacher_id, status } = req.query;
      if (!teacher_id) {
        return res.status(400).json({ message: "teacher_id parameter is required" });
      }
      const gradingTasks2 = await storage.getGradingTasks(teacher_id, status);
      res.json(gradingTasks2);
    } catch (error) {
      console.error("Error fetching grading tasks:", error);
      res.status(500).json({ message: "Failed to fetch grading tasks" });
    }
  });
  app2.post("/api/grading/tasks/:taskId/grade", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
      console.log("\u{1F504} SCORE MERGE: Manual grade submitted for answer", taskId);
      mergeExamScores(parseInt(taskId), storage).catch((error) => {
        console.error("\u274C SCORE MERGE: Failed to merge scores (non-blocking):", error);
      });
      res.json(result);
    } catch (error) {
      console.error("Error submitting grade:", error);
      res.status(500).json({ message: "Failed to submit grade" });
    }
  });
  app2.get("/api/exam-sessions", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const sessions = await storage.getAllExamSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching exam sessions:", error);
      res.status(500).json({ message: "Failed to fetch exam sessions" });
    }
  });
  app2.get("/api/exam-reports", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { subject, class: classId } = req.query;
      const reports = await storage.getExamReports({
        subjectId: subject ? parseInt(subject) : void 0,
        classId: classId ? parseInt(classId) : void 0
      });
      res.json(reports);
    } catch (error) {
      console.error("Error fetching exam reports:", error);
      res.status(500).json({ message: "Failed to fetch exam reports" });
    }
  });
  app2.get("/api/exam-reports/:examId/students", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { examId } = req.params;
      const studentReports = await storage.getExamStudentReports(parseInt(examId));
      res.json(studentReports);
    } catch (error) {
      console.error("Error fetching student reports:", error);
      res.status(500).json({ message: "Failed to fetch student reports" });
    }
  });
  app2.get("/api/exam-reports/filters", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const classes2 = await storage.getClasses();
      const subjects2 = await storage.getSubjects();
      res.json({ classes: classes2, subjects: subjects2 });
    } catch (error) {
      console.error("Error fetching filter options:", error);
      res.status(500).json({ message: "Failed to fetch filter options" });
    }
  });
  app2.post("/api/exam-questions/bulk", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const user = req.user;
      const { examId, questions } = req.body;
      if (!examId || !questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Exam ID and questions array are required" });
      }
      if (questions.length > 100) {
        return res.status(400).json({ message: "Too many questions - maximum 100 questions per upload" });
      }
      if (questions.length === 0) {
        return res.status(400).json({ message: "No questions provided for upload" });
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
      let createdQuestions = [];
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
            try {
              questionData.options = questionData.options.map((option) => createQuestionOptionSchema.parse(option));
            } catch (optionError) {
              if (optionError instanceof ZodError) {
                const fieldErrors = optionError.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
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
            const fieldErrors = error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join(", ");
            validationErrors.push(`Question ${i + 1}: ${fieldErrors}`);
          } else {
            validationErrors.push(`Question ${i + 1}: ${error instanceof Error ? error.message : "Invalid question data"}`);
          }
        }
      }
      if (validationErrors.length > 0) {
        return res.status(400).json({
          message: "Validation errors found",
          errors: validationErrors
        });
      }
      const questionsData = questions.map((questionData) => ({
        question: questionData.validatedQuestion,
        options: questionData.options || []
      }));
      const result = await storage.createExamQuestionsBulk(questionsData);
      createdQuestions = result.questions;
      if (result.errors.length > 0) {
        console.warn("\u26A0\uFE0F Some questions failed during bulk upload:", result.errors);
      }
      res.json({
        message: `Successfully created ${result.created} questions${result.errors.length > 0 ? ` (${result.errors.length} failed)` : ""}`,
        created: result.created,
        questions: result.questions,
        errors: result.errors.length > 0 ? result.errors : void 0
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
  app2.get("/api/question-options/bulk", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { questionIds } = req.query;
      if (!questionIds) {
        return res.status(400).json({ message: "questionIds parameter is required" });
      }
      const questionIdArray = questionIds.split(",").map((id) => parseInt(id.trim())).filter((id) => !isNaN(id));
      if (questionIdArray.length === 0) {
        return res.status(400).json({ message: "Valid questionIds are required" });
      }
      if (user.roleId === ROLES.STUDENT) {
        const allActiveSession = await storage.getExamSessionsByStudent(user.id);
        const hasActiveSession = allActiveSession.some((session2) => !session2.isCompleted);
        if (!hasActiveSession) {
          return res.status(403).json({ message: "No active exam session. Start an exam first." });
        }
      }
      const allOptions = await storage.getQuestionOptionsBulk(questionIdArray);
      const isStudentOrParent = user.roleId >= 3;
      if (isStudentOrParent) {
        const sanitizedOptions = allOptions.map((option) => {
          const { isCorrect, ...sanitizedOption } = option;
          return sanitizedOption;
        });
        res.json(sanitizedOptions);
      } else {
        res.json(allOptions);
      }
    } catch (error) {
      console.error("Error in bulk question options:", error);
      res.status(500).json({ message: "Failed to fetch question options" });
    }
  });
  app2.get("/api/question-options/:questionId", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { questionId } = req.params;
      if (user.roleId === ROLES.STUDENT) {
        const questions = await storage.getExamQuestions(0);
        const allActiveSession = await storage.getExamSessionsByStudent(user.id);
        const hasActiveSession = allActiveSession.some((session2) => !session2.isCompleted);
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
  app2.post("/api/comprehensive-grades", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const {
        studentId,
        subjectId,
        termId,
        testScore,
        testMaxScore = 40,
        // Default to 40 for test marks
        examScore,
        examMaxScore = 60,
        // Default to 60 for exam marks
        totalScore,
        grade,
        teacherRemarks,
        recordedBy
      } = req.body;
      if (!studentId || !subjectId || !termId) {
        return res.status(400).json({ message: "Student, subject, and term are required" });
      }
      if (testScore !== null && testScore < 0 || testScore > testMaxScore) {
        return res.status(400).json({ message: "Invalid test score. Score must be between 0 and max test score." });
      }
      if (examScore !== null && examScore < 0 || examScore > examMaxScore) {
        return res.status(400).json({ message: "Invalid exam score. Score must be between 0 and max exam score." });
      }
      if (totalScore !== null && (totalScore < 0 || totalScore > testMaxScore + examMaxScore)) {
        return res.status(400).json({ message: "Invalid total score. Score must be between 0 and max total score." });
      }
      if (grade && !["A+", "A", "B+", "B", "C", "F"].includes(grade)) {
        return res.status(400).json({ message: "Invalid grade. Allowed grades are A+, A, B+, B, C, F." });
      }
      const gradeData = {
        studentId,
        subjectId: parseInt(subjectId),
        // Ensure IDs are numbers
        termId: parseInt(termId),
        testScore: testScore === null ? null : Number(testScore),
        // Handle null scores
        testMaxScore: Number(testMaxScore),
        examScore: examScore === null ? null : Number(examScore),
        examMaxScore: Number(examMaxScore),
        totalScore: totalScore === null ? null : Number(totalScore),
        grade: grade || null,
        teacherRemarks: teacherRemarks || null,
        recordedBy: recordedBy || req.user.id,
        isFinalized: true,
        // Assuming this endpoint is for finalized grades
        recordedAt: /* @__PURE__ */ new Date()
      };
      const result = await storage.recordComprehensiveGrade(gradeData);
      res.json({
        message: "Comprehensive grade recorded successfully",
        grade: result
      });
    } catch (error) {
      console.error("Comprehensive grade recording error:", error);
      res.status(500).json({
        message: "Failed to record comprehensive grade",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/comprehensive-grades/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const { termId } = req.query;
      const numericTermId = termId ? parseInt(termId) : void 0;
      if (termId && isNaN(numericTermId)) {
        return res.status(400).json({ message: "Invalid termId format. Must be a number." });
      }
      const grades = await storage.getComprehensiveGradesByStudent(studentId, numericTermId);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching comprehensive grades:", error);
      res.status(500).json({ message: "Failed to fetch comprehensive grades" });
    }
  });
  app2.post("/api/report-cards/generate", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId, termId, classId } = req.body;
      if (!studentId || !termId || !classId) {
        return res.status(400).json({ message: "Student ID, Term ID, and Class ID are required" });
      }
      const grades = await storage.getComprehensiveGradesByStudent(studentId, parseInt(termId));
      const totalMarks = grades.reduce((sum, grade) => sum + (grade.totalScore || 0), 0);
      const totalPossibleMarks = grades.reduce((sum, grade) => sum + (grade.testMaxScore || 0) + (grade.examMaxScore || 0), 0);
      const averagePercentage = totalPossibleMarks > 0 ? Math.round(totalMarks / totalPossibleMarks * 100) : 0;
      let overallGrade = "F";
      if (averagePercentage >= 90) overallGrade = "A+";
      else if (averagePercentage >= 80) overallGrade = "A";
      else if (averagePercentage >= 70) overallGrade = "B+";
      else if (averagePercentage >= 60) overallGrade = "B";
      else if (averagePercentage >= 50) overallGrade = "C";
      const student = await storage.getStudent(studentId);
      const studentUser = student ? await storage.getUser(student.id) : null;
      const classData = await storage.getClass(parseInt(classId));
      const terms = await storage.getTerms();
      const term = terms.find((t) => t.id === parseInt(termId));
      const reportCardData = {
        studentId,
        classId: parseInt(classId),
        termId: parseInt(termId),
        averagePercentage,
        overallGrade,
        // Enhanced teacher remarks
        teacherRemarks: `Overall performance: ${overallGrade}. Keep up the excellent work!`,
        status: "finalized",
        finalizedAt: /* @__PURE__ */ new Date(),
        generatedBy: req.user.id,
        // Add student and class details for context if needed, or fetch dynamically on display
        studentName: studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : "Unknown Student",
        className: classData ? classData.name : "Unknown Class",
        termName: term ? `${term.name} (${term.year})` : "Unknown Term"
      };
      const reportCard = await storage.createReportCard(reportCardData, grades);
      res.json({
        message: "Report card generated successfully",
        reportCard,
        grades
        // Also return the grades used for generation
      });
    } catch (error) {
      console.error("Report card generation error:", error);
      res.status(500).json({
        message: "Failed to generate report card",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/exam-results", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { examId, studentId, score, maxScore, marksObtained, autoScored, recordedBy, questionDetails, breakdown, immediateResults } = req.body;
      if (!examId || !studentId || score === void 0 || maxScore === void 0) {
        return res.status(400).json({ message: "examId, studentId, score, and maxScore are required." });
      }
      const resultData = insertExamResultSchema.parse({
        examId,
        studentId,
        score: Number(score),
        maxScore: Number(maxScore),
        marksObtained: marksObtained !== void 0 ? Number(marksObtained) : Number(score),
        // Use score if marksObtained is not provided
        autoScored: autoScored || false,
        recordedBy: recordedBy || req.user.id,
        questionDetails: questionDetails || [],
        breakdown: breakdown || {},
        immediateResults: immediateResults || {},
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      });
      const existingResults = await storage.getExamResultsByStudent(studentId);
      const existingResult = existingResults.find((r) => r.examId === examId);
      let result;
      if (existingResult) {
        result = await storage.updateExamResult(existingResult.id, resultData);
      } else {
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
      console.error("Error saving exam result:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid input data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to save exam result" });
    }
  });
  app2.get("/api/exam-results/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Students can only view their own exam results" });
      }
      const results = await storage.getExamResultsByStudent(studentId);
      res.json(results);
    } catch (error) {
      console.error("Error fetching exam results for student:", error);
      res.status(500).json({ message: "Failed to fetch exam results" });
    }
  });
  app2.get("/api/exam-results/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const result = await storage.getExamResultById(parseInt(id));
      if (!result) {
        return res.status(404).json({ message: "Exam result not found" });
      }
      if (user.roleId === ROLES.STUDENT && user.id !== result.studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching exam result:", error);
      res.status(500).json({ message: "Failed to fetch exam result" });
    }
  });
  app2.put("/api/exam-results/:id", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { score, maxScore, remarks, questionDetails, breakdown, immediateResults, teacherFinalized, finalizedAt, finalizedBy, ...otherUpdates } = req.body;
      const updateData = {};
      if (score !== void 0) updateData.score = Number(score);
      if (maxScore !== void 0) updateData.maxScore = Number(maxScore);
      if (remarks !== void 0) updateData.remarks = remarks;
      if (questionDetails !== void 0) updateData.questionDetails = questionDetails;
      if (breakdown !== void 0) updateData.breakdown = breakdown;
      if (immediateResults !== void 0) updateData.immediateResults = immediateResults;
      if (teacherFinalized !== void 0) updateData.teacherFinalized = teacherFinalized;
      if (finalizedAt !== void 0) updateData.finalizedAt = finalizedAt;
      if (finalizedBy !== void 0) updateData.finalizedBy = finalizedBy;
      Object.assign(updateData, otherUpdates);
      if (updateData.score !== void 0) updateData.score = Number(updateData.score);
      if (updateData.maxScore !== void 0) updateData.maxScore = Number(updateData.maxScore);
      if (updateData.marksObtained !== void 0) updateData.marksObtained = Number(updateData.marksObtained);
      const updatedResult = await storage.updateExamResult(parseInt(id), updateData);
      if (!updatedResult) {
        return res.status(404).json({ message: "Exam result not found" });
      }
      res.json(updatedResult);
    } catch (error) {
      console.error("Error updating exam result:", error);
      res.status(500).json({ message: "Failed to update exam result" });
    }
  });
  app2.get("/api/study-resources", authenticateUser, async (req, res) => {
    try {
      const { classId, subjectId, termId, resourceType } = req.query;
      const user = req.user;
      let filters = {};
      if (user.roleId === ROLES.STUDENT) {
        const student = await storage.getStudent(user.id);
        if (student?.classId) {
          filters.classId = student.classId;
        }
      } else {
        if (classId) filters.classId = parseInt(classId);
      }
      if (subjectId) filters.subjectId = parseInt(subjectId);
      if (termId) filters.termId = parseInt(termId);
      if (resourceType) filters.resourceType = resourceType;
      const resources = await storage.getStudyResources(filters);
      res.json(resources);
    } catch (error) {
      console.error("Study resources fetch error:", error);
      res.status(500).json({ message: "Failed to fetch study resources" });
    }
  });
  app2.get("/api/study-resources/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
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
      console.error("Study resource fetch error:", error);
      res.status(500).json({ message: "Failed to fetch study resource" });
    }
  });
  app2.get("/api/study-resources/:id/download", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getStudyResourceById(parseInt(id));
      if (!resource) {
        return res.status(404).json({ message: "Study resource not found" });
      }
      await storage.incrementStudyResourceDownloads(parseInt(id));
      const filePath = path.join(process.cwd(), resource.fileUrl);
      res.download(filePath, resource.fileName);
    } catch (error) {
      console.error("Study resource download error:", error);
      res.status(500).json({ message: "Failed to download study resource" });
    }
  });
  app2.delete("/api/study-resources/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { id } = req.params;
      const resource = await storage.getStudyResourceById(parseInt(id));
      if (!resource) {
        return res.status(404).json({ message: "Study resource not found" });
      }
      const filePath = path.join(process.cwd(), resource.fileUrl);
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        console.error("File deletion error:", fileError);
      }
      const success = await storage.deleteStudyResource(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Failed to delete study resource record" });
      }
      res.json({ message: "Study resource deleted successfully" });
    } catch (error) {
      console.error("Study resource deletion error:", error);
      res.status(500).json({ message: "Failed to delete study resource" });
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
        (item, index2, self) => index2 === self.findIndex((t) => t.id === item.id)
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
      if (error instanceof z2.ZodError) {
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
      if (error instanceof z2.ZodError) {
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
  app2.get("/api/admin/performance-metrics", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const hoursNumber = parseInt(hours);
      const metrics = await storage.getPerformanceMetrics(hoursNumber);
      const recentAlerts = await storage.getRecentPerformanceAlerts(hoursNumber);
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
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        submissionGoal: 2e3,
        // 2 seconds in milliseconds
        currentStatus,
        systemHealth: {
          database: "connected",
          backgroundCleanup: "running",
          averageSubmissionTime: `${metrics.averageDuration}ms`
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
      console.error("Performance metrics error:", error);
      res.status(500).json({ message: "Failed to retrieve performance metrics" });
    }
  });
  app2.get("/api/admin/performance-alerts", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { hours = 24 } = req.query;
      const hoursNumber = parseInt(hours);
      const alerts = await storage.getRecentPerformanceAlerts(hoursNumber);
      res.json({
        alerts,
        summary: {
          totalAlerts: alerts.length,
          timeframe: `${hoursNumber} hours`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }
      });
    } catch (error) {
      console.error("Performance alerts error:", error);
      res.status(500).json({ message: "Failed to retrieve performance alerts" });
    }
  });
  app2.post("/api/test-auto-scoring", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return res.status(400).json({ message: "sessionId is required" });
      }
      console.log(`\u{1F9EA} ADMIN TEST: Testing auto-scoring for session ${sessionId}`);
      const session2 = await storage.getExamSessionById(sessionId);
      if (!session2) {
        return res.status(404).json({ message: `Exam session ${sessionId} not found` });
      }
      console.log(`\u{1F4CA} Testing session: ${session2.id}, Student: ${session2.studentId}, Exam: ${session2.examId}, Completed: ${session2.isCompleted}`);
      const startTime = Date.now();
      try {
        await autoScoreExamSession(sessionId, storage);
        const totalTime = Date.now() - startTime;
        console.log(`\u2705 AUTO-SCORING TEST SUCCESS: Completed in ${totalTime}ms`);
        const results = await storage.getExamResultsByStudent(session2.studentId);
        const testResult = results.find((r) => r.examId === session2.examId && r.autoScored === true);
        if (testResult) {
          console.log(`\u{1F389} VERIFIED: Auto-scored result found - ${testResult.score}/${testResult.maxScore}`);
          return res.json({
            success: true,
            message: "Auto-scoring test completed successfully",
            testDetails: {
              sessionId,
              studentId: session2.studentId,
              examId: session2.examId,
              duration: totalTime,
              result: {
                score: testResult.score,
                maxScore: testResult.maxScore,
                autoScored: testResult.autoScored,
                resultId: testResult.id
              }
            }
          });
        } else {
          console.warn(`\u26A0\uFE0F AUTO-SCORING COMPLETED but no auto-scored result found`);
          return res.json({
            success: false,
            message: "Auto-scoring completed but no auto-scored result was found",
            testDetails: {
              sessionId,
              duration: totalTime,
              allResults: results.filter((r) => r.examId === session2.examId)
            }
          });
        }
      } catch (scoringError) {
        const totalTime = Date.now() - startTime;
        console.error(`\u274C AUTO-SCORING TEST FAILED after ${totalTime}ms:`, scoringError);
        return res.status(500).json({
          success: false,
          message: "Auto-scoring test failed",
          error: scoringError instanceof Error ? scoringError.message : String(scoringError),
          testDetails: {
            sessionId,
            duration: totalTime,
            errorType: scoringError instanceof Error ? scoringError.constructor.name : "UnknownError"
          }
        });
      }
    } catch (error) {
      console.error("Test auto-scoring endpoint error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to run auto-scoring test",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  app2.post("/api/performance-events", authenticateUser, async (req, res) => {
    try {
      const { sessionId, eventType, duration, metadata } = req.body;
      const user = req.user;
      if (!eventType || typeof duration !== "number") {
        return res.status(400).json({ message: "eventType and duration are required" });
      }
      const sanitizedMetadata = metadata ? JSON.stringify(metadata).substring(0, 2e3) : null;
      const performanceEvent = {
        sessionId: sessionId || null,
        eventType,
        duration: Math.max(0, duration),
        // Ensure positive duration
        goalAchieved: duration <= 2e3,
        metadata: sanitizedMetadata,
        userId: user.id,
        // Track which user generated the event
        clientSide: true,
        // Flag this as client-side telemetry
        createdAt: /* @__PURE__ */ new Date()
      };
      const savedEvent = await storage.logPerformanceEvent(performanceEvent);
      if (process.env.NODE_ENV === "development") {
        console.log("\u{1F4CA} PERFORMANCE EVENT STORED:", JSON.stringify(savedEvent, null, 2));
      }
      if (duration > 2e3) {
        console.warn(`\u{1F6A8} PERFORMANCE ALERT: ${eventType} took ${duration}ms (exceeded 2-second goal)`);
        if (metadata) {
          console.warn(`\u{1F50D} METADATA:`, JSON.stringify(metadata, null, 2));
        }
      }
      res.status(204).send();
    } catch (error) {
      console.error("Performance event logging error:", error);
      res.status(500).json({ message: "Failed to log performance event" });
    }
  });
  app2.patch("/api/exam-results/:id/finalize", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { teacherRemarks, teacherFinalized, finalizedAt, finalizedBy } = req.body;
      const existingResult = await storage.getExamResultById(parseInt(id));
      if (!existingResult) {
        return res.status(404).json({ message: "Exam result not found" });
      }
      const exam = await storage.getExamById(existingResult.examId);
      if (!exam) {
        return res.status(404).json({ message: "Associated exam not found" });
      }
      if (req.user.roleId === ROLES.TEACHER && exam.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You can only finalize results for exams you created" });
      }
      const updateData = {
        remarks: teacherRemarks || existingResult.remarks
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
      console.error("Error finalizing report:", error);
      res.status(500).json({ message: "Failed to finalize report" });
    }
  });
  app2.get("/api/reports/finalized", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId, subjectId, termId } = req.query;
      const user = req.user;
      let results = [];
      if (user.roleId === ROLES.TEACHER) {
        const teacherExams = await storage.getAllExams();
        const teacherExamIds = teacherExams.filter((exam) => exam.createdBy === user.id).map((exam) => exam.id);
        if (teacherExamIds.length > 0) {
          results = await storage.getFinalizedReportsByExams(teacherExamIds, {
            classId: classId ? parseInt(classId) : void 0,
            subjectId: subjectId ? parseInt(subjectId) : void 0,
            termId: termId ? parseInt(termId) : void 0
          });
        }
      } else {
        results = await storage.getAllFinalizedReports({
          classId: classId ? parseInt(classId) : void 0,
          subjectId: subjectId ? parseInt(subjectId) : void 0,
          termId: termId ? parseInt(termId) : void 0
        });
      }
      res.json(results);
    } catch (error) {
      console.error("Error fetching finalized reports:", error);
      res.status(500).json({ message: "Failed to fetch finalized reports" });
    }
  });
  app2.post("/api/exam-sessions", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { examId, studentId } = req.body;
      const user = req.user;
      console.log("\u{1F4DD} Creating exam session:", { examId, studentId, userFromToken: user.id });
      if (!examId || !studentId) {
        return res.status(400).json({ message: "examId and studentId are required" });
      }
      if (studentId !== user.id) {
        console.error("\u274C Authorization failure: Student trying to create session for another student:", { requestedStudentId: studentId, authenticatedUserId: user.id });
        return res.status(403).json({ message: "Students can only create exam sessions for themselves" });
      }
      const exam = await storage.getExamById(examId);
      if (!exam) {
        console.error("\u274C Exam not found:", examId);
        return res.status(404).json({ message: "Exam not found" });
      }
      console.log("\u{1F4CB} Exam details:", { id: exam.id, name: exam.name, isPublished: exam.isPublished, timeLimit: exam.timeLimit });
      if (!exam.isPublished) {
        console.error("\u274C Exam not published:", examId);
        return res.status(403).json({ message: "Exam is not published" });
      }
      const existingSession = await storage.getActiveExamSession(examId, studentId);
      if (existingSession && !existingSession.isCompleted) {
        console.error("\u274C Student already has active session:", { sessionId: existingSession.id, examId, studentId });
        return res.status(409).json({
          message: "You already have an active session for this exam",
          sessionId: existingSession.id
        });
      }
      const sessionData = {
        examId: parseInt(examId),
        studentId,
        startedAt: /* @__PURE__ */ new Date(),
        isCompleted: false,
        status: "active",
        timeRemaining: exam.timeLimit ? exam.timeLimit * 60 : null
        // Convert minutes to seconds
      };
      console.log("\u{1F4BE} Creating session with data:", sessionData);
      const session2 = await storage.createExamSession(sessionData);
      if (!session2) {
        console.error("\u274C Failed to create session - storage returned null");
        return res.status(500).json({ message: "Failed to create exam session" });
      }
      console.log("\u2705 Exam session created successfully:", { sessionId: session2.id, examId, studentId });
      res.json(session2);
    } catch (error) {
      console.error("\u274C Exam session creation error:", error);
      if (error instanceof z2.ZodError) {
        console.error("\u274C Validation error:", error.errors);
        return res.status(400).json({
          message: "Invalid session data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      if (error?.code) {
        const dbError = error;
        console.error("\u274C Database error:", { code: dbError.code, message: dbError.message });
        if (dbError.code === "23503") {
          return res.status(400).json({ message: "Invalid exam or student reference" });
        }
        if (dbError.code === "23505") {
          return res.status(409).json({ message: "Session already exists for this exam" });
        }
      }
      res.status(500).json({
        message: "Failed to create exam session",
        error: process.env.NODE_ENV === "development" ? error.message : void 0
      });
    }
  });
  app2.get("/api/exam-sessions/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const { studentId } = req.params;
      const user = req.user;
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Students can only view their own exam sessions" });
      }
      const sessions = await storage.getExamSessionsByStudent(studentId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching exam sessions:", error);
      res.status(500).json({ message: "Failed to fetch exam sessions" });
    }
  });
  app2.get("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const session2 = await storage.getExamSessionById(parseInt(id));
      if (!session2) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (user.roleId === ROLES.STUDENT && user.id !== session2.studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error fetching exam session:", error);
      res.status(500).json({ message: "Failed to fetch exam session" });
    }
  });
  app2.patch("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const user = req.user;
      const updateData = req.body;
      const session2 = await storage.getExamSessionById(parseInt(id));
      if (!session2) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (user.roleId === ROLES.STUDENT && user.id !== session2.studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const validatedData = updateExamSessionSchema.parse(updateData);
      const updatedSession = await storage.updateExamSession(parseInt(id), validatedData);
      if (!updatedSession) {
        return res.status(404).json({ message: "Failed to update exam session" });
      }
      res.json(updatedSession);
    } catch (error) {
      console.error("Error updating exam session:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid update data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update exam session" });
    }
  });
  app2.get("/api/exam-sessions/student/:studentId/active", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { studentId } = req.params;
      if (user.roleId === ROLES.STUDENT && studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const sessions = await storage.getExamSessionsByStudent(studentId);
      const activeSession = sessions.find((session2) => !session2.isCompleted);
      if (activeSession) {
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
      console.error("Error checking active session:", error);
      res.status(500).json({ message: "Failed to check active session" });
    }
  });
  app2.patch("/api/exam-sessions/:id/progress", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const { id } = req.params;
      const { currentQuestionIndex, timeRemaining } = req.body;
      const session2 = await storage.getExamSessionById(parseInt(id));
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (user.roleId === ROLES.STUDENT && session2.studentId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      const updates = {};
      if (typeof timeRemaining === "number") updates.timeRemaining = timeRemaining;
      if (typeof currentQuestionIndex === "number") {
        updates.metadata = JSON.stringify({ currentQuestionIndex });
      }
      if (Object.keys(updates).length > 0) {
        await storage.updateExamSession(parseInt(id), updates);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating session progress:", error);
      res.status(500).json({ message: "Failed to update session progress" });
    }
  });
  app2.post("/api/student-answers", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const user = req.user;
      if (user.roleId !== ROLES.STUDENT) {
        return res.status(403).json({ message: "Only students can submit answers" });
      }
      const answerData = insertStudentAnswerSchema.parse(req.body);
      const session2 = await storage.getExamSessionById(answerData.sessionId);
      if (!session2) {
        console.error(`\u274C Session not found: ${answerData.sessionId}`);
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (session2.studentId !== user.id) {
        console.error(`\u274C Student ${user.id} trying to submit for session ${answerData.sessionId} belonging to ${session2.studentId}`);
        return res.status(403).json({ message: "You can only submit answers for your own exam session" });
      }
      if (session2.isCompleted) {
        console.error(`\u274C Attempt to submit answer for completed session: ${answerData.sessionId}`);
        return res.status(400).json({ message: "Cannot submit answers for a completed exam" });
      }
      const existingAnswers = await storage.getStudentAnswers(answerData.sessionId);
      const existingAnswer = existingAnswers.find((a) => a.questionId === answerData.questionId);
      let answer;
      if (existingAnswer) {
        console.log(`Updating existing answer for question ${answerData.questionId}`);
        answer = await storage.updateStudentAnswer(existingAnswer.id, {
          selectedOptionId: answerData.selectedOptionId,
          textAnswer: answerData.textAnswer,
          answeredAt: /* @__PURE__ */ new Date()
        });
        if (!answer) {
          throw new Error("Failed to update existing answer");
        }
      } else {
        console.log(`Creating new answer for question ${answerData.questionId}`);
        answer = await storage.createStudentAnswer(answerData);
      }
      res.json(answer);
    } catch (error) {
      console.error("Student answer submission error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid answer data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      if (error?.code === "23503") {
        return res.status(400).json({ message: "Invalid question or session reference" });
      } else if (error?.code === "23505") {
        return res.status(409).json({ message: "Answer already exists for this question" });
      } else if (error?.code === "ECONNRESET" || error?.code === "ETIMEDOUT") {
        return res.status(408).json({ message: "Database connection timeout. Please try again." });
      }
      res.status(500).json({
        message: "Failed to submit answer. Please try again.",
        error: process.env.NODE_ENV === "development" ? error.message : void 0
      });
    }
  });
  async function createGradingTasksForSession(sessionId, examId, storage2) {
    try {
      console.log(`\u{1F4DD} Creating grading tasks for session ${sessionId}, exam ${examId}`);
      const exam = await storage2.getExamById(examId);
      if (!exam) {
        throw new Error(`Exam ${examId} not found`);
      }
      const examQuestions2 = await storage2.getExamQuestions(examId);
      const manualGradingQuestions = examQuestions2.filter((q) => {
        return q.questionType !== "multiple_choice" && q.questionType !== "true_false";
      });
      if (manualGradingQuestions.length === 0) {
        console.log(`\u2705 No manual grading questions found for exam ${examId}`);
        return;
      }
      console.log(`\u{1F4DD} Found ${manualGradingQuestions.length} questions requiring manual grading`);
      const studentAnswers2 = await storage2.getStudentAnswers(sessionId);
      let assignedTeacherId = exam.createdBy;
      if (exam.classId && exam.subjectId) {
        try {
          const teachers = await storage2.getTeachersForClassSubject(exam.classId, exam.subjectId);
          if (teachers && teachers.length > 0) {
            assignedTeacherId = teachers[0].id;
            console.log(`\u{1F468}\u200D\u{1F3EB} Assigning grading tasks to class-subject teacher: ${assignedTeacherId}`);
          }
        } catch (error) {
          console.warn(`\u26A0\uFE0F Could not find class-subject teacher, using exam creator: ${error}`);
        }
      }
      let tasksCreated = 0;
      for (const question of manualGradingQuestions) {
        const studentAnswer = studentAnswers2.find((a) => a.questionId === question.id);
        if (studentAnswer) {
          const existingTasks = await storage2.getGradingTasksBySession(sessionId);
          const taskExists = existingTasks.some((t) => t.answerId === studentAnswer.id);
          if (!taskExists) {
            await storage2.createGradingTask({
              sessionId,
              answerId: studentAnswer.id,
              assignedTeacherId,
              status: "pending",
              priority: 0
              // Default priority
            });
            tasksCreated++;
          }
        }
      }
      console.log(`\u2705 Created ${tasksCreated} grading tasks for session ${sessionId}`);
    } catch (error) {
      console.error(`\u274C Error creating grading tasks for session ${sessionId}:`, error);
      throw error;
    }
  }
  app2.post("/api/exams/:examId/submit", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const user = req.user;
      const { examId } = req.params;
      const examIdNum = parseInt(examId);
      console.log(`\u{1F680} EXAM SUBMISSION: Student ${user.id} submitting exam ${examIdNum}`);
      if (isNaN(examIdNum)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      const activeSession = await storage.getActiveExamSession(examIdNum, user.id);
      if (!activeSession) {
        console.log(`\u274C No active session found for student ${user.id} exam ${examIdNum}`);
        return res.status(404).json({ message: "No active exam session found" });
      }
      if (activeSession.isCompleted) {
        console.log(`\u26A0\uFE0F Session ${activeSession.id} already completed`);
        const existingResults = await storage.getExamResultsByStudent(user.id);
        const examResult2 = existingResults.find((r) => r.examId === examIdNum);
        if (examResult2) {
          const maxScore = examResult2.maxScore || 100;
          const score = examResult2.score || examResult2.marksObtained || 0;
          return res.json({
            submitted: true,
            alreadySubmitted: true,
            message: "Exam already submitted",
            result: {
              score,
              maxScore,
              percentage: maxScore > 0 ? Math.round(score / maxScore * 100) : 0,
              autoScored: examResult2.autoScored || false
            }
          });
        }
        return res.status(409).json({ message: "Exam session already completed" });
      }
      const now = /* @__PURE__ */ new Date();
      await storage.updateExamSession(activeSession.id, {
        isCompleted: true,
        submittedAt: now,
        status: "submitted"
      });
      console.log(`\u2705 Session ${activeSession.id} marked as completed`);
      try {
        await autoScoreExamSession(activeSession.id, storage);
        console.log(`\u2705 Auto-scoring completed for session ${activeSession.id}`);
      } catch (scoringError) {
        console.error(`\u274C Auto-scoring failed for session ${activeSession.id}:`, scoringError);
      }
      try {
        await createGradingTasksForSession(activeSession.id, examIdNum, storage);
        console.log(`\u2705 Grading tasks created for session ${activeSession.id}`);
      } catch (taskError) {
        console.error(`\u274C Failed to create grading tasks for session ${activeSession.id}:`, taskError);
      }
      const results = await storage.getExamResultsByStudent(user.id);
      const examResult = results.find((r) => r.examId === examIdNum);
      if (examResult) {
        const maxScore = examResult.maxScore || 100;
        const score = examResult.score || examResult.marksObtained || 0;
        const percentage = maxScore > 0 ? Math.round(score / maxScore * 100) : 0;
        const response = {
          submitted: true,
          result: {
            score,
            totalScore: score,
            // Dual field for compatibility
            maxScore,
            percentage,
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
      console.error("\u274C Exam submission error:", error);
      res.status(500).json({
        message: "Failed to submit exam",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/teacher-assignments", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const user = req.user;
      const assignments = await storage.getTeacherClassAssignments(user.id);
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching teacher assignments:", error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });
  app2.post("/api/teacher-assignments", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const assignment = await storage.createTeacherClassAssignment(req.body);
      res.json(assignment);
    } catch (error) {
      console.error("Error creating teacher assignment:", error);
      res.status(500).json({ message: "Failed to create assignment" });
    }
  });
  app2.delete("/api/teacher-assignments/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const success = await storage.deleteTeacherClassAssignment(parseInt(req.params.id));
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Assignment not found" });
      }
    } catch (error) {
      console.error("Error deleting teacher assignment:", error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });
  app2.get("/api/grading-tasks", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const user = req.user;
      const status = req.query.status;
      const tasks = await storage.getGradingTasksByTeacher(user.id, status);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching grading tasks:", error);
      res.status(500).json({ message: "Failed to fetch grading tasks" });
    }
  });
  app2.post("/api/grading-tasks/:taskId/assign", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
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
      console.error("Error assigning grading task:", error);
      res.status(500).json({ message: "Failed to assign task" });
    }
  });
  app2.patch("/api/grading-tasks/:taskId/status", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
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
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });
  app2.post("/api/grading-tasks/:taskId/complete", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const taskId = parseInt(req.params.taskId);
      const { pointsEarned, feedbackText } = req.body;
      const user = req.user;
      const result = await storage.completeGradingTask(taskId, pointsEarned, feedbackText);
      if (result) {
        await storage.createAuditLog({
          userId: user.id,
          entityType: "student_answer",
          entityId: result.answer.id,
          action: "manual_grade",
          description: `Teacher manually graded question with ${pointsEarned} points`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
        res.json(result);
      } else {
        res.status(404).json({ message: "Task not found" });
      }
    } catch (error) {
      console.error("Error completing grading task:", error);
      res.status(500).json({ message: "Failed to complete grading task" });
    }
  });
  app2.get("/api/exam-sessions/:sessionId/scores", authenticateUser, async (req, res) => {
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
      console.error("Error fetching merged scores:", error);
      res.status(500).json({ message: "Failed to fetch scores" });
    }
  });
  app2.post("/api/report-cards/generate", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { studentId, termId, examIds } = req.body;
      const examResults2 = await storage.getExamResultsByStudent(studentId);
      let filteredResults = examResults2;
      if (termId) {
      }
      const reportData = filteredResults.map((result) => ({
        ...result
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
      console.error("Error generating report card:", error);
      res.status(500).json({ message: "Failed to generate report card" });
    }
  });
  app2.get("/api/report-cards/student/:studentId", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const user = req.user;
      if (user.roleId === ROLES.STUDENT && user.id !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const examResults2 = await storage.getExamResultsByStudent(studentId);
      res.json(examResults2);
    } catch (error) {
      console.error("Error fetching report cards:", error);
      res.status(500).json({ message: "Failed to fetch report cards" });
    }
  });
  app2.get("/api/parent/:parentId/children", authenticateUser, authorizeRoles(ROLES.PARENT), async (req, res) => {
    try {
      const parentId = req.params.parentId;
      const user = req.user;
      if (user.id !== parentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      const children = await storage.getStudentsByParentId(parentId);
      const childrenData = await Promise.all(children.map(async (student) => {
        const user2 = await storage.getUser(student.id);
        const classInfo = student.classId ? await storage.getClass(student.classId) : null;
        return {
          id: student.id,
          name: `${user2?.firstName} ${user2?.lastName}`,
          admissionNumber: student.admissionNumber,
          className: classInfo?.name || "Not assigned"
        };
      }));
      res.json(childrenData);
    } catch (error) {
      console.error("Error fetching parent children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });
  app2.get("/api/parent/child-reports/:studentId", authenticateUser, authorizeRoles(ROLES.PARENT), async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const user = req.user;
      const student = await storage.getStudent(studentId);
      if (!student) {
        console.warn(`\u{1F512} Security: Parent ${user.id} attempted to access non-existent student ${studentId}`);
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.parentId !== user.id) {
        console.warn(`\u{1F512} Security Alert: Parent ${user.id} attempted unauthorized access to student ${studentId} (belongs to ${student.parentId})`);
        await storage.createAuditLog({
          userId: user.id,
          action: "unauthorized_access_attempt",
          entityType: "student_report_cards",
          entityId: 0,
          newValue: `Attempted to access student ${studentId}`,
          ipAddress: req.ip,
          userAgent: req.get("user-agent")
        });
        return res.status(403).json({ message: "Access denied" });
      }
      const reportCards2 = await storage.getReportCardsByStudentId(studentId);
      const reportCardsData = await Promise.all(reportCards2.map(async (report) => {
        const term = await storage.getAcademicTerm(report.termId);
        const classInfo = await storage.getClass(report.classId);
        const studentUser = await storage.getUser(studentId);
        const items = await storage.getReportCardItems(report.id);
        const itemsData = await Promise.all(items.map(async (item) => {
          const subject = await storage.getSubject(item.subjectId);
          return {
            subjectName: subject?.name || "Unknown",
            testScore: item.testScore,
            testMaxScore: item.testMaxScore,
            testWeightedScore: item.testWeightedScore,
            examScore: item.examScore,
            examMaxScore: item.examMaxScore,
            examWeightedScore: item.examWeightedScore,
            obtainedMarks: item.obtainedMarks,
            percentage: item.percentage,
            grade: item.grade,
            teacherRemarks: item.teacherRemarks
          };
        }));
        return {
          id: report.id,
          studentId,
          studentName: `${studentUser?.firstName} ${studentUser?.lastName}`,
          className: classInfo?.name || "Unknown",
          termName: term?.name || "Unknown",
          termYear: term?.year || "",
          averagePercentage: report.averagePercentage,
          overallGrade: report.overallGrade,
          teacherRemarks: report.teacherRemarks,
          status: report.status,
          generatedAt: report.generatedAt,
          items: itemsData
        };
      }));
      res.json(reportCardsData);
    } catch (error) {
      console.error("Error fetching child report cards:", error);
      res.status(500).json({ message: "Failed to fetch report cards" });
    }
  });
  app2.get("/api/report-cards/:reportId/pdf", authenticateUser, async (req, res) => {
    try {
      const reportId = parseInt(req.params.reportId);
      const user = req.user;
      const report = await storage.getReportCard(reportId);
      if (!report) {
        return res.status(404).json({ message: "Report card not found" });
      }
      if (user.roleId === ROLES.PARENT) {
        const student = await storage.getStudent(report.studentId);
        if (!student) {
          console.warn(`\u{1F512} Security: Parent ${user.id} attempted to access PDF for non-existent student ${report.studentId}`);
          return res.status(404).json({ message: "Student not found" });
        }
        if (student.parentId !== user.id) {
          console.warn(`\u{1F512} Security Alert: Parent ${user.id} attempted unauthorized PDF access to report ${reportId} for student ${report.studentId} (belongs to ${student.parentId})`);
          await storage.createAuditLog({
            userId: user.id,
            action: "unauthorized_pdf_access_attempt",
            entityType: "report_card",
            entityId: reportId,
            newValue: `Attempted to access student ${report.studentId}`,
            ipAddress: req.ip,
            userAgent: req.get("user-agent")
          });
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (user.roleId === ROLES.STUDENT) {
        if (user.id !== report.studentId) {
          return res.status(403).json({ message: "Access denied" });
        }
      } else if (user.roleId !== ROLES.ADMIN && user.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Access denied" });
      }
      const term = await storage.getAcademicTerm(report.termId);
      const classInfo = await storage.getClass(report.classId);
      const studentUser = await storage.getUser(report.studentId);
      const items = await storage.getReportCardItems(report.id);
      const itemsWithSubjects = await Promise.all(items.map(async (item) => {
        const subject = await storage.getSubject(item.subjectId);
        return {
          ...item,
          subjectName: subject?.name || "Unknown"
        };
      }));
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="report-card-${studentUser?.firstName}-${studentUser?.lastName}-${term?.name}-${term?.year}.pdf"`);
      doc.pipe(res);
      doc.fontSize(24).font("Helvetica-Bold").fillColor("#1e40af").text("Treasure-Home School", { align: "center" });
      doc.fontSize(16).fillColor("#666666").text("Seriki-Soyinka Ifo, Ogun State, Nigeria", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(20).fillColor("#1e40af").text("Student Report Card", { align: "center" });
      doc.moveDown(1.5);
      const infoBoxY = doc.y;
      doc.fontSize(11).font("Helvetica").fillColor("#000000");
      doc.text(`Student: ${studentUser?.firstName} ${studentUser?.lastName}`, 50, infoBoxY);
      doc.text(`Class: ${classInfo?.name || "N/A"}`, 50, infoBoxY + 20);
      doc.text(`Term: ${term?.name || "N/A"} ${term?.year || ""}`, 350, infoBoxY);
      doc.text(`Date Generated: ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, 350, infoBoxY + 20);
      doc.moveDown(2);
      const summaryBoxY = doc.y;
      doc.roundedRect(50, summaryBoxY, 495, 60, 5).fillAndStroke("#f0f9ff", "#3b82f6");
      doc.fontSize(12).font("Helvetica-Bold").fillColor("#1e40af").text("Overall Performance", 60, summaryBoxY + 10);
      doc.fontSize(11).font("Helvetica").fillColor("#000000");
      doc.text(`Average: ${report.averagePercentage || 0}%`, 60, summaryBoxY + 30);
      doc.text(`Grade: ${report.overallGrade || "N/A"}`, 250, summaryBoxY + 30);
      doc.text(`Status: ${report.status}`, 400, summaryBoxY + 30);
      doc.moveDown(3);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1e40af").text("Subject Performance", 50, doc.y);
      doc.moveDown(0.5);
      const tableTop = doc.y;
      const colWidths = [180, 70, 70, 70, 80];
      const colPositions = [50, 230, 300, 370, 440];
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#ffffff");
      doc.rect(50, tableTop, 495, 25).fill("#3b82f6");
      doc.text("Subject", colPositions[0] + 5, tableTop + 8);
      doc.text("Test (40)", colPositions[1] + 5, tableTop + 8);
      doc.text("Exam (60)", colPositions[2] + 5, tableTop + 8);
      doc.text("Total (100)", colPositions[3] + 5, tableTop + 8);
      doc.text("Grade", colPositions[4] + 5, tableTop + 8);
      let rowY = tableTop + 30;
      doc.fontSize(10).font("Helvetica").fillColor("#000000");
      itemsWithSubjects.forEach((item, index2) => {
        if (index2 % 2 === 0) {
          doc.rect(50, rowY - 5, 495, 25).fill("#f8fafc");
        }
        doc.fillColor("#000000");
        doc.text(item.subjectName, colPositions[0] + 5, rowY, { width: colWidths[0] - 10, lineBreak: false, ellipsis: true });
        doc.text(`${item.testWeightedScore || 0}/40`, colPositions[1] + 5, rowY);
        doc.text(`${item.examWeightedScore || 0}/60`, colPositions[2] + 5, rowY);
        doc.text(`${item.obtainedMarks || 0}/100`, colPositions[3] + 5, rowY);
        doc.text(item.grade || "N/A", colPositions[4] + 5, rowY);
        rowY += 25;
      });
      doc.rect(50, tableTop, 495, rowY - tableTop).stroke("#cbd5e1");
      if (report.teacherRemarks) {
        doc.moveDown(2);
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#1e40af").text("Teacher's Remarks", 50, doc.y);
        doc.fontSize(10).font("Helvetica").fillColor("#000000");
        const remarksBoxY = doc.y + 10;
        doc.roundedRect(50, remarksBoxY, 495, 60, 5).stroke("#cbd5e1");
        doc.text(report.teacherRemarks, 60, remarksBoxY + 10, {
          width: 475,
          align: "left"
        });
      }
      doc.fontSize(8).fillColor("#666666").text(
        '\xA9 2024 Treasure-Home School | "Honesty and Success" | treasurehomeschool@gmail.com',
        50,
        doc.page.height - 30,
        { align: "center", width: 495 }
      );
      doc.end();
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });
  app2.get("/api/audit-logs", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const filters = {
        userId: req.query.userId,
        entityType: req.query.entityType,
        entityId: req.query.entityId ? parseInt(req.query.entityId) : void 0,
        action: req.query.action,
        limit: req.query.limit ? parseInt(req.query.limit) : 100
      };
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/audit-logs/:entityType/:entityId", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const logs = await storage.getAuditLogsByEntity(entityType, parseInt(entityId));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching entity audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
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
    const isIdempotencyError = errorMessage.includes("already exists") || errorMessage.includes("relation") && errorMessage.includes("already exists") || errorMessage.includes("duplicate key") || errorMessage.includes("nothing to migrate") || errorMessage.includes("PostgresError: relation") || error?.cause?.code === "42P07";
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
