import { sql, eq } from "drizzle-orm";
import { pgTable, text, varchar, uuid, bigserial, bigint, integer, date, boolean, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const genderEnum = pgEnum('gender', ['Male', 'Female', 'Other']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['Present', 'Absent', 'Late', 'Excused']);
export const reportCardStatusEnum = pgEnum('report_card_status', ['draft', 'finalized', 'published']);
export const examTypeEnum = pgEnum('exam_type', ['test', 'exam']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'suspended', 'disabled']);
export const createdViaEnum = pgEnum('created_via', ['bulk', 'invite', 'self', 'google', 'admin']);

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
  username: varchar("username", { length: 100 }).unique(),
  email: varchar("email", { length: 255 }).notNull(),
  recoveryEmail: varchar("recovery_email", { length: 255 }), // For password recovery
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
  authProvider: varchar("auth_provider", { length: 20 }).default('local'),
  googleId: varchar("google_id", { length: 255 }).unique(),

  // Security & audit fields
  status: userStatusEnum("status").default('pending'), // New accounts require approval
  createdVia: createdViaEnum("created_via").default('admin'),
  createdBy: uuid("created_by"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: varchar("last_login_ip", { length: 45 }),
  mfaEnabled: boolean("mfa_enabled").default(false),
  mfaSecret: text("mfa_secret"),
  accountLockedUntil: timestamp("account_locked_until"), // For suspicious activity lock

  // Profile completion fields
  profileCompleted: boolean("profile_completed").default(false),
  profileCompletionPercentage: integer("profile_completion_percentage").default(0),
  state: varchar("state", { length: 100 }),
  country: varchar("country", { length: 100 }),
  securityQuestion: text("security_question"),
  securityAnswerHash: text("security_answer_hash"),
  dataPolicyAgreed: boolean("data_policy_agreed").default(false),
  dataPolicyAgreedAt: timestamp("data_policy_agreed_at"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  usersEmailIdx: index("users_email_idx").on(table.email),
  usersStatusIdx: index("users_status_idx").on(table.status),
  usersGoogleIdIdx: index("users_google_id_idx").on(table.googleId),
  usersRoleIdIdx: index("users_role_id_idx").on(table.roleId),
  usersUsernameIdx: index("users_username_idx").on(table.username),
}));

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  ipAddress: varchar("ip_address", { length: 45 }), // Track IP for security
  resetBy: uuid("reset_by").references(() => users.id), // Admin who initiated reset, null if self-service
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  passwordResetTokensUserIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
  passwordResetTokensTokenIdx: index("password_reset_tokens_token_idx").on(table.token),
}));

// Password reset attempts table - for rate limiting
export const passwordResetAttempts = pgTable("password_reset_attempts", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  identifier: varchar("identifier", { length: 255 }).notNull(), // Email or username
  ipAddress: varchar("ip_address", { length: 45 }).notNull(),
  attemptedAt: timestamp("attempted_at").defaultNow(),
  success: boolean("success").default(false),
}, (table) => ({
  passwordResetAttemptsIdentifierIdx: index("password_reset_attempts_identifier_idx").on(table.identifier),
  passwordResetAttemptsIpIdx: index("password_reset_attempts_ip_idx").on(table.ipAddress),
  passwordResetAttemptsTimeIdx: index("password_reset_attempts_time_idx").on(table.attemptedAt),
}));

// Invites table for staff onboarding
export const invites = pgTable("invites", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull(),
  roleId: bigint("role_id", { mode: "number" }).references(() => roles.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  acceptedBy: uuid("accepted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  invitesTokenIdx: index("invites_token_idx").on(table.token),
  invitesEmailIdx: index("invites_email_idx").on(table.email),
}));

// Notifications table for admin alerts
export const notifications = pgTable("notifications", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(), // Admin receiving the notification
  type: varchar("type", { length: 50 }).notNull(), // 'pending_user', 'approval_request', etc.
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  relatedEntityType: varchar("related_entity_type", { length: 50 }), // 'user', 'student', etc.
  relatedEntityId: varchar("related_entity_id", { length: 255 }), // ID of the related entity
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  notificationsUserIdIdx: index("notifications_user_id_idx").on(table.userId),
  notificationsIsReadIdx: index("notifications_is_read_idx").on(table.isRead),
}));

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
  guardianName: varchar("guardian_name", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Teacher profiles table
export const teacherProfiles = pgTable("teacher_profiles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  subjects: text("subjects").array(),
  assignedClasses: integer("assigned_classes").array(),
  qualification: text("qualification"),
  yearsOfExperience: integer("years_of_experience"),
  specialization: varchar("specialization", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Admin profiles table
export const adminProfiles = pgTable("admin_profiles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  department: varchar("department", { length: 100 }),
  roleDescription: text("role_description"),
  accessLevel: varchar("access_level", { length: 50 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Parent profiles table
export const parentProfiles = pgTable("parent_profiles", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull().unique(),
  occupation: varchar("occupation", { length: 100 }),
  contactPreference: varchar("contact_preference", { length: 50 }),
  linkedStudents: uuid("linked_students").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id).notNull(),
  subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id).notNull(),
  totalMarks: integer("total_marks").notNull(),
  date: text("date").notNull(), // Store as YYYY-MM-DD string to avoid Date object conversion
  termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  teacherInChargeId: uuid("teacher_in_charge_id").references(() => users.id), // Teacher responsible for grading
  createdAt: timestamp("created_at").defaultNow(),
  // Exam type: 'test' (40 marks) or 'exam' (60 marks)
  examType: examTypeEnum("exam_type").notNull().default('exam'),
  // Timer mode: 'global' (fixed start/end times) or 'individual' (duration per student)
  timerMode: varchar("timer_mode", { length: 20 }).default('individual'), // 'global' or 'individual'
  // Enhanced exam delivery fields
  timeLimit: integer("time_limit"), // in minutes (used for individual timer mode)
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  instructions: text("instructions"),
  isPublished: boolean("is_published").default(false),
  allowRetakes: boolean("allow_retakes").default(false),
  shuffleQuestions: boolean("shuffle_questions").default(false),
  // Enhanced auto-grading features (will be added via migration)
  autoGradingEnabled: boolean("auto_grading_enabled").default(true),
  instantFeedback: boolean("instant_feedback").default(false), // Show correct/incorrect immediately
  showCorrectAnswers: boolean("show_correct_answers").default(false), // Show answers after submission
  passingScore: integer("passing_score"), // Minimum score to pass (percentage)
  gradingScale: text("grading_scale").default('standard'), // 'standard', 'custom'
});

// Exam questions table
export const examQuestions = pgTable("exam_questions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
  questionText: text("question_text").notNull(),
  questionType: varchar("question_type", { length: 50 }).notNull(), // 'multiple_choice', 'text', 'essay', 'true_false', 'fill_blank'
  points: integer("points").default(1),
  orderNumber: integer("order_number").notNull(),
  imageUrl: text("image_url"), // for questions with images
  // Enhanced auto-grading features
  autoGradable: boolean("auto_gradable").default(true), // Can this question be auto-graded?
  expectedAnswers: text("expected_answers").array(), // For text questions - expected answer variations
  caseSensitive: boolean("case_sensitive").default(false), // For text answers
  allowPartialCredit: boolean("allow_partial_credit").default(false),
  partialCreditRules: text("partial_credit_rules"), // JSON config for partial credit
  explanationText: text("explanation_text"), // Explanation shown after answering
  hintText: text("hint_text"), // Optional hint for students
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // PERFORMANCE INDEX: Critical for scoring JOIN queries
  examQuestionsExamIdIdx: index("exam_questions_exam_id_idx").on(table.examId),
  examQuestionsOrderIdx: index("exam_questions_order_idx").on(table.examId, table.orderNumber),
}));

// Question options table (for multiple choice questions)
export const questionOptions = pgTable("question_options", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  questionId: bigint("question_id", { mode: "number" }).references(() => examQuestions.id).notNull(),
  optionText: text("option_text").notNull(),
  isCorrect: boolean("is_correct").default(false),
  orderNumber: integer("order_number").notNull(),
  // Enhanced auto-grading features
  partialCreditValue: integer("partial_credit_value").default(0), // Points if selected (for partial credit)
  explanationText: text("explanation_text"), // Why this option is correct/incorrect
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // PERFORMANCE INDEX: Critical for scoring JOIN queries - find correct options fast
  questionOptionsQuestionIdIdx: index("question_options_question_id_idx").on(table.questionId),
  questionOptionsCorrectIdx: index("question_options_correct_idx").on(table.questionId, table.isCorrect),
}));

// Student exam sessions table
export const examSessions = pgTable("exam_sessions", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  startedAt: timestamp("started_at").defaultNow(),
  submittedAt: timestamp("submitted_at"),
  timeRemaining: integer("time_remaining"), // in seconds
  isCompleted: boolean("is_completed").default(false),
  score: integer("score"),
  maxScore: integer("max_score"),
  status: varchar("status", { length: 20 }).default('in_progress'), // 'in_progress', 'submitted', 'graded'
  metadata: text("metadata"), // JSON string for violation tracking, progress saving, etc.
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // PERFORMANCE INDEX: Critical for session lookups
  examSessionsExamStudentIdx: index("exam_sessions_exam_student_idx").on(table.examId, table.studentId),
  examSessionsStudentCompletedIdx: index("exam_sessions_student_completed_idx").on(table.studentId, table.isCompleted),
  examSessionsActiveSessionsIdx: index("exam_sessions_active_idx").on(table.examId, table.studentId, table.isCompleted),
  // UNIQUE CONSTRAINT: Prevent duplicate active sessions (critical for circuit breaker fix)
  examSessionsActiveUniqueIdx: uniqueIndex("exam_sessions_active_unique_idx").on(table.examId, table.studentId).where(eq(table.isCompleted, false)),
}));

// Student answers table
export const studentAnswers = pgTable("student_answers", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id).notNull(),
  questionId: bigint("question_id", { mode: "number" }).references(() => examQuestions.id).notNull(),
  selectedOptionId: bigint("selected_option_id", { mode: "number" }).references(() => questionOptions.id), // for multiple choice
  textAnswer: text("text_answer"), // for text/essay questions
  isCorrect: boolean("is_correct"),
  pointsEarned: integer("points_earned").default(0),
  answeredAt: timestamp("answered_at").defaultNow(),
  // Enhanced auto-grading features
  autoScored: boolean("auto_scored").default(false), // Was this answer auto-scored?
  manualOverride: boolean("manual_override").default(false), // Teacher manually adjusted score
  feedbackText: text("feedback_text"), // Instant feedback shown to student
  partialCreditReason: text("partial_credit_reason"), // Why partial credit was given
}, (table) => ({
  // PERFORMANCE INDEX: Critical for scoring JOIN queries - fetch all answers for a session fast
  studentAnswersSessionIdIdx: index("student_answers_session_id_idx").on(table.sessionId),
  studentAnswersSessionQuestionIdx: index("student_answers_session_question_idx").on(table.sessionId, table.questionId),
  studentAnswersQuestionIdx: index("student_answers_question_id_idx").on(table.questionId),
}));

// Exam results table
export const examResults = pgTable("exam_results", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  score: integer("score"),
  maxScore: integer("max_score"),
  marksObtained: integer("marks_obtained"), // Legacy field for backward compatibility
  grade: varchar("grade", { length: 5 }),
  remarks: text("remarks"),
  autoScored: boolean("auto_scored").default(false),
  recordedBy: uuid("recorded_by").notNull(), // UUID field to match database schema
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // PERFORMANCE INDEX: Critical for fast result lookups by exam/student
  examResultsExamIdIdx: index("exam_results_exam_id_idx").on(table.examId),
  examResultsStudentIdIdx: index("exam_results_student_id_idx").on(table.studentId),
  examResultsExamStudentIdx: index("exam_results_exam_student_idx").on(table.examId, table.studentId),
  examResultsAutoScoredIdx: index("exam_results_auto_scored_idx").on(table.autoScored, table.examId),
}));

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
  // Test and Exam scores with their respective exam IDs for reference
  testExamId: bigint("test_exam_id", { mode: "number" }).references(() => exams.id),
  testScore: integer("test_score"), // Score obtained in test (out of testMaxScore)
  testMaxScore: integer("test_max_score"), // Maximum marks for test
  testWeightedScore: integer("test_weighted_score"), // Normalized to 40
  examExamId: bigint("exam_exam_id", { mode: "number" }).references(() => exams.id),
  examScore: integer("exam_score"), // Score obtained in exam (out of examMaxScore)
  examMaxScore: integer("exam_max_score"), // Maximum marks for exam
  examWeightedScore: integer("exam_weighted_score"), // Normalized to 60
  // Combined scores
  totalMarks: integer("total_marks").notNull().default(100), // Always 100 for the weighted system
  obtainedMarks: integer("obtained_marks").notNull(), // testWeightedScore + examWeightedScore
  percentage: integer("percentage").notNull(),
  grade: varchar("grade", { length: 5 }), // A+, A, B+, etc.
  teacherRemarks: text("teacher_remarks"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Study resources table for past papers and study materials
export const studyResources = pgTable("study_resources", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"), // in bytes
  resourceType: varchar("resource_type", { length: 50 }).notNull(), // 'past_paper', 'study_guide', 'notes', 'assignment'
  subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id),
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id),
  termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  isPublished: boolean("is_published").default(true),
  downloads: integer("downloads").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance events table for monitoring and analytics
export const performanceEvents = pgTable("performance_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'submission', 'auto_submit', 'timeout_cleanup', 'answer_save'
  duration: integer("duration").notNull(), // in milliseconds
  goalAchieved: boolean("goal_achieved").notNull(), // whether it met the < 2000ms goal
  metadata: text("metadata"), // JSON string for additional data
  clientSide: boolean("client_side").default(false), // whether logged from client or server
  userId: uuid("user_id").references(() => users.id), // for attribution
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for analytics queries
  performanceEventsTypeIdx: index("performance_events_type_idx").on(table.eventType),
  performanceEventsDateIdx: index("performance_events_date_idx").on(table.createdAt),
  performanceEventsGoalIdx: index("performance_events_goal_idx").on(table.goalAchieved, table.eventType),
}));

// Teacher class assignments table for mapping which teachers teach which subjects in which classes
export const teacherClassAssignments = pgTable("teacher_class_assignments", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  teacherId: uuid("teacher_id").references(() => users.id).notNull(),
  classId: bigint("class_id", { mode: "number" }).references(() => classes.id).notNull(),
  subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id).notNull(),
  termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for quick teacher assignment lookups
  teacherAssignmentsTeacherIdx: index("teacher_assignments_teacher_idx").on(table.teacherId, table.isActive),
  teacherAssignmentsClassSubjectIdx: index("teacher_assignments_class_subject_idx").on(table.classId, table.subjectId),
}));

// Manual grading tasks queue table for essays and subjective questions
export const gradingTasks = pgTable("grading_tasks", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id, { onDelete: 'cascade' }).notNull(),
  answerId: bigint("answer_id", { mode: "number" }).references(() => studentAnswers.id, { onDelete: 'cascade' }).notNull(),
  assignedTeacherId: uuid("assigned_teacher_id").references(() => users.id), // Teacher assigned to grade this
  status: varchar("status", { length: 20 }).default('pending'), // 'pending', 'in_progress', 'completed', 'skipped'
  priority: integer("priority").default(0), // Higher number = higher priority
  assignedAt: timestamp("assigned_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for grading queue management
  gradingTasksAssignedIdx: index("grading_tasks_assigned_idx").on(table.assignedTeacherId, table.status),
  gradingTasksStatusIdx: index("grading_tasks_status_idx").on(table.status, table.priority),
  gradingTasksSessionIdx: index("grading_tasks_session_idx").on(table.sessionId),
  // Unique constraint to prevent duplicate tasks for the same answer
  gradingTasksAnswerUniqueIdx: uniqueIndex("grading_tasks_answer_unique_idx").on(table.answerId),
}));

// Audit logs table for tracking all grade changes and important actions
export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  userId: uuid("user_id").references(() => users.id).notNull(), // Who made the change
  action: varchar("action", { length: 100 }).notNull(), // 'grade_change', 'manual_override', 'report_publish', etc.
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'exam_result', 'student_answer', 'report_card'
  entityId: bigint("entity_id", { mode: "number" }).notNull(), // ID of the affected entity
  oldValue: text("old_value"), // JSON of old values
  newValue: text("new_value"), // JSON of new values
  reason: text("reason"), // Why the change was made
  ipAddress: varchar("ip_address", { length: 45 }), // IPv4 or IPv6
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Performance indexes for audit queries
  auditLogsUserIdx: index("audit_logs_user_idx").on(table.userId),
  auditLogsEntityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  auditLogsDateIdx: index("audit_logs_date_idx").on(table.createdAt),
  auditLogsActionIdx: index("audit_logs_action_idx").on(table.action),
}));


// Insert schemas
export const insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
export const insertPasswordResetAttemptSchema = createInsertSchema(passwordResetAttempts).omit({ id: true, attemptedAt: true });
export const insertInviteSchema = createInsertSchema(invites).omit({ id: true, createdAt: true });
export const insertStudentSchema = createInsertSchema(students).omit({ createdAt: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
// Enhanced exam schema with proper data coercion and empty string handling
export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true }).extend({
  // Coerce string IDs to numbers (forms often send IDs as strings)
  classId: z.coerce.number().positive("Please select a valid class"),
  subjectId: z.coerce.number().positive("Please select a valid subject"),
  termId: z.coerce.number().positive("Please select a valid term"),
  totalMarks: z.coerce.number().positive("Total marks must be a positive number"),

  // Handle date string from frontend - keep as string for database with improved validation
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine((dateStr) => {
      const date = new Date(dateStr);
      return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
    }, "Please enter a valid date"),

  // Optional numeric fields - convert empty strings to undefined
  timeLimit: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().int().min(1, "Time limit must be at least 1 minute").optional()),
  passingScore: z.preprocess((val) => val === '' ? undefined : val, z.coerce.number().int().min(0).max(100, "Passing score must be between 0 and 100").optional()),

  // Optional timestamp fields - convert empty strings to undefined
  startTime: z.preprocess((val) => val === '' ? undefined : val, z.coerce.date().optional()),
  endTime: z.preprocess((val) => val === '' ? undefined : val, z.coerce.date().optional()),

  // Text fields - convert empty strings to undefined for optional fields
  instructions: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  gradingScale: z.preprocess((val) => val === '' ? 'standard' : val, z.string().default('standard')),
});
export const insertExamResultSchema = createInsertSchema(examResults).omit({ id: true, createdAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertGalleryCategorySchema = createInsertSchema(galleryCategories).omit({ id: true, createdAt: true });
export const insertGallerySchema = createInsertSchema(gallery).omit({ id: true, createdAt: true });
export const insertHomePageContentSchema = createInsertSchema(homePageContent).omit({ id: true, createdAt: true, updatedAt: true });
export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
export const insertReportCardSchema = createInsertSchema(reportCards).omit({ id: true, createdAt: true });
export const insertReportCardItemSchema = createInsertSchema(reportCardItems).omit({ id: true, createdAt: true });
export const insertStudyResourceSchema = createInsertSchema(studyResources).omit({ id: true, createdAt: true, downloads: true });
export const insertPerformanceEventSchema = createInsertSchema(performanceEvents).omit({ id: true, createdAt: true });
export const insertTeacherClassAssignmentSchema = createInsertSchema(teacherClassAssignments).omit({ id: true, createdAt: true });
export const insertGradingTaskSchema = createInsertSchema(gradingTasks).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// Shared schema for creating students with auto-generated credentials (admin use)
export const createStudentWithAutoCredsSchema = z.object({
  // User fields - email/password/username auto-generated
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
  parentEmail: z.string().email("Invalid parent email").optional(), // For linking/creating parent accounts
  parentPhone: z.string().optional(), // For linking/creating parent accounts
});

export type CreateStudentWithAutoCredsRequest = z.infer<typeof createStudentWithAutoCredsSchema>;

// Shared schema for creating students - AUTO-GENERATION MODE
// email/password/admissionNumber optional (auto-generated by system)
export const createStudentSchema = z.object({
  email: z.string().email().optional(), // Now optional - auto-generated if not provided
  password: z.string().min(6).max(100).optional(), // Now optional - auto-generated
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: "Gender is required" }),
  profileImageUrl: z.string().optional(),
  admissionNumber: z.string().optional(), // Now optional - auto-generated if not provided
  classId: z.coerce.number().positive("Please select a valid class"),
  parentId: z.string().uuid("Invalid parent selection").optional().nullable(),
  parentEmail: z.string().email("Invalid parent email").optional(), // For auto-linking
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format"),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  medicalInfo: z.string().optional(),
  guardianName: z.string().optional(),
});

export type CreateStudentRequest = z.infer<typeof createStudentSchema>;

// CSV bulk upload schema for students
export const csvStudentSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  class: z.string().min(1, "Class is required"),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: "Gender is required" }),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  parentEmail: z.string().email("Invalid parent email").optional(),
  parentPhone: z.string().optional(),
  emergencyContact: z.string().min(1, "Emergency contact is required"),
  admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format").optional(),
  medicalInfo: z.string().optional(),
  guardianName: z.string().optional(),
});

export type CsvStudentData = z.infer<typeof csvStudentSchema>;

// New exam delivery schemas with proper coercion for numeric fields
export const insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true, createdAt: true }).extend({
  // Coerce string IDs and numeric values to numbers (forms and CSV often send these as strings)
  examId: z.coerce.number().positive("Please select a valid exam"),
  questionText: z.string().min(1, "Question text is required"),
  questionType: z.enum(['multiple_choice', 'text', 'essay', 'true_false', 'fill_blank'], { required_error: "Question type is required" }),
  points: z.preprocess((val) => val === '' ? 1 : val, z.coerce.number().int().min(0, "Points must be a non-negative number").default(1)),
  orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),

  // Handle optional text fields - convert empty strings to undefined
  imageUrl: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  expectedAnswers: z.preprocess((val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(s => s !== '');
    return undefined;
  }, z.array(z.string()).optional()),
  explanationText: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  hintText: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  partialCreditRules: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  // Added fields for theory questions
  instructions: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
  sampleAnswer: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
});

export const insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({ id: true, createdAt: true }).extend({
  // Coerce string IDs and numeric values to numbers
  questionId: z.coerce.number().positive("Please select a valid question"),
  orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),

  // Handle optional numeric fields - convert empty strings to undefined or 0
  partialCreditValue: z.preprocess((val) => val === '' ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)),

  // Handle optional text fields - convert empty strings to undefined
  explanationText: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
});

// Schema for creating question options during question creation (without questionId)
export const createQuestionOptionSchema = insertQuestionOptionSchema.omit({ questionId: true, orderNumber: true }).extend({
  // Optional fields that can be provided during creation
  partialCreditValue: z.preprocess((val) => val === '' ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)).optional(),
  explanationText: z.preprocess((val) => val === '' ? undefined : val, z.string().optional()),
});
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
  status: z.enum(['in_progress', 'submitted']).optional(),
  // Server-side fields for auto-submission and tracking
  submissionMethod: z.string().optional(),
  autoSubmitted: z.boolean().optional()
}).strict(); // .strict() prevents any additional fields from being accepted
export const insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true });

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export const insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAdminProfileSchema = createInsertSchema(adminProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertParentProfileSchema = createInsertSchema(parentProfiles).omit({ id: true, createdAt: true, updatedAt: true });

// Types
export type Role = typeof roles.$inferSelect;
export type User = typeof users.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type PasswordResetAttempt = typeof passwordResetAttempts.$inferSelect;
export type Invite = typeof invites.$inferSelect;
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
export type StudyResource = typeof studyResources.$inferSelect;
export type PerformanceEvent = typeof performanceEvents.$inferSelect;
export type TeacherClassAssignment = typeof teacherClassAssignments.$inferSelect;
export type GradingTask = typeof gradingTasks.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type TeacherProfile = typeof teacherProfiles.$inferSelect;
export type AdminProfile = typeof adminProfiles.$inferSelect;
export type ParentProfile = typeof parentProfiles.$inferSelect;

// New exam delivery types
export type ExamQuestion = typeof examQuestions.$inferSelect;
export type QuestionOption = typeof questionOptions.$inferSelect;
export type ExamSession = typeof examSessions.$inferSelect;
export type StudentAnswer = typeof studentAnswers.$inferSelect;

export type InsertRole = z.infer<typeof insertRoleSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type InsertPasswordResetAttempt = z.infer<typeof insertPasswordResetAttemptSchema>;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
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
export type InsertStudyResource = z.infer<typeof insertStudyResourceSchema>;
export type InsertPerformanceEvent = z.infer<typeof insertPerformanceEventSchema>;
export type InsertTeacherClassAssignment = z.infer<typeof insertTeacherClassAssignmentSchema>;
export type InsertGradingTask = z.infer<typeof insertGradingTaskSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertTeacherProfile = z.infer<typeof insertTeacherProfileSchema>;
export type InsertAdminProfile = z.infer<typeof insertAdminProfileSchema>;
export type InsertParentProfile = z.infer<typeof insertParentProfileSchema>;

// New exam delivery insert types
export type InsertExamQuestion = z.infer<typeof insertExamQuestionSchema>;
export type InsertQuestionOption = z.infer<typeof insertQuestionOptionSchema>;
export type CreateQuestionOption = z.infer<typeof createQuestionOptionSchema>;
export type InsertExamSession = z.infer<typeof insertExamSessionSchema>;
export type UpdateExamSession = z.infer<typeof updateExamSessionSchema>;
export type InsertStudentAnswer = z.infer<typeof insertStudentAnswerSchema>;