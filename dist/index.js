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

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  academicTerms: () => academicTerms,
  adminProfiles: () => adminProfiles,
  announcements: () => announcements,
  applicationStatusEnum: () => applicationStatusEnum,
  approvedTeachers: () => approvedTeachers,
  attendance: () => attendance,
  attendanceStatusEnum: () => attendanceStatusEnum,
  auditLogs: () => auditLogs,
  classes: () => classes,
  contactMessages: () => contactMessages,
  counters: () => counters,
  createQuestionOptionSchema: () => createQuestionOptionSchema,
  createStudentSchema: () => createStudentSchema,
  createStudentWithAutoCredsSchema: () => createStudentWithAutoCredsSchema,
  createdViaEnum: () => createdViaEnum,
  csvStudentSchema: () => csvStudentSchema,
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
  insertAcademicTermSchema: () => insertAcademicTermSchema,
  insertAdminProfileSchema: () => insertAdminProfileSchema,
  insertAnnouncementSchema: () => insertAnnouncementSchema,
  insertApprovedTeacherSchema: () => insertApprovedTeacherSchema,
  insertAttendanceSchema: () => insertAttendanceSchema,
  insertAuditLogSchema: () => insertAuditLogSchema,
  insertClassSchema: () => insertClassSchema,
  insertContactMessageSchema: () => insertContactMessageSchema,
  insertCounterSchema: () => insertCounterSchema,
  insertExamQuestionSchema: () => insertExamQuestionSchema,
  insertExamResultSchema: () => insertExamResultSchema,
  insertExamSchema: () => insertExamSchema,
  insertExamSessionSchema: () => insertExamSessionSchema,
  insertGalleryCategorySchema: () => insertGalleryCategorySchema,
  insertGallerySchema: () => insertGallerySchema,
  insertGradingTaskSchema: () => insertGradingTaskSchema,
  insertHomePageContentSchema: () => insertHomePageContentSchema,
  insertInviteSchema: () => insertInviteSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertNotificationSchema: () => insertNotificationSchema,
  insertParentProfileSchema: () => insertParentProfileSchema,
  insertPasswordResetAttemptSchema: () => insertPasswordResetAttemptSchema,
  insertPasswordResetTokenSchema: () => insertPasswordResetTokenSchema,
  insertPerformanceEventSchema: () => insertPerformanceEventSchema,
  insertQuestionOptionSchema: () => insertQuestionOptionSchema,
  insertReportCardItemSchema: () => insertReportCardItemSchema,
  insertReportCardSchema: () => insertReportCardSchema,
  insertRoleSchema: () => insertRoleSchema,
  insertSettingSchema: () => insertSettingSchema,
  insertStudentAnswerSchema: () => insertStudentAnswerSchema,
  insertStudentSchema: () => insertStudentSchema,
  insertStudyResourceSchema: () => insertStudyResourceSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertTeacherApplicationSchema: () => insertTeacherApplicationSchema,
  insertTeacherClassAssignmentSchema: () => insertTeacherClassAssignmentSchema,
  insertTeacherProfileSchema: () => insertTeacherProfileSchema,
  insertUserSchema: () => insertUserSchema,
  insertVacancySchema: () => insertVacancySchema,
  invites: () => invites,
  messages: () => messages,
  notifications: () => notifications,
  parentProfiles: () => parentProfiles,
  passwordResetAttempts: () => passwordResetAttempts,
  passwordResetTokens: () => passwordResetTokens,
  performanceEvents: () => performanceEvents,
  questionOptions: () => questionOptions,
  reportCardItems: () => reportCardItems,
  reportCardStatusEnum: () => reportCardStatusEnum,
  reportCards: () => reportCards,
  roles: () => roles,
  settings: () => settings,
  studentAnswers: () => studentAnswers,
  students: () => students,
  studyResources: () => studyResources,
  subjects: () => subjects,
  teacherApplications: () => teacherApplications,
  teacherClassAssignments: () => teacherClassAssignments,
  teacherProfiles: () => teacherProfiles,
  updateExamSessionSchema: () => updateExamSessionSchema,
  userStatusEnum: () => userStatusEnum,
  users: () => users,
  vacancies: () => vacancies,
  vacancyStatusEnum: () => vacancyStatusEnum
});
import { sql, eq } from "drizzle-orm";
import { pgTable, text, varchar, uuid, bigserial, bigint, integer, date, boolean, timestamp, pgEnum, index, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var genderEnum, attendanceStatusEnum, reportCardStatusEnum, examTypeEnum, userStatusEnum, createdViaEnum, roles, users, passwordResetTokens, passwordResetAttempts, invites, notifications, academicTerms, classes, subjects, students, teacherProfiles, adminProfiles, parentProfiles, attendance, exams, examQuestions, questionOptions, examSessions, studentAnswers, examResults, announcements, messages, galleryCategories, gallery, homePageContent, contactMessages, reportCards, reportCardItems, studyResources, performanceEvents, teacherClassAssignments, gradingTasks, auditLogs, settings, counters, insertRoleSchema, insertUserSchema, insertPasswordResetTokenSchema, insertPasswordResetAttemptSchema, insertInviteSchema, insertStudentSchema, insertClassSchema, insertSubjectSchema, insertAcademicTermSchema, insertAttendanceSchema, insertExamSchema, insertExamResultSchema, insertAnnouncementSchema, insertMessageSchema, insertGalleryCategorySchema, insertGallerySchema, insertHomePageContentSchema, insertContactMessageSchema, insertReportCardSchema, insertReportCardItemSchema, insertStudyResourceSchema, insertPerformanceEventSchema, insertTeacherClassAssignmentSchema, insertGradingTaskSchema, insertAuditLogSchema, insertSettingSchema, insertCounterSchema, createStudentWithAutoCredsSchema, createStudentSchema, csvStudentSchema, insertExamQuestionSchema, insertQuestionOptionSchema, createQuestionOptionSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, insertNotificationSchema, insertTeacherProfileSchema, insertAdminProfileSchema, insertParentProfileSchema, vacancyStatusEnum, applicationStatusEnum, vacancies, teacherApplications, approvedTeachers, insertVacancySchema, insertTeacherApplicationSchema, insertApprovedTeacherSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    genderEnum = pgEnum("gender", ["Male", "Female", "Other"]);
    attendanceStatusEnum = pgEnum("attendance_status", ["Present", "Absent", "Late", "Excused"]);
    reportCardStatusEnum = pgEnum("report_card_status", ["draft", "finalized", "published"]);
    examTypeEnum = pgEnum("exam_type", ["test", "exam"]);
    userStatusEnum = pgEnum("user_status", ["pending", "active", "suspended", "disabled"]);
    createdViaEnum = pgEnum("created_via", ["bulk", "invite", "self", "google", "admin"]);
    roles = pgTable("roles", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 50 }).notNull().unique(),
      permissions: text("permissions").array().default(sql`'{}'::text[]`),
      createdAt: timestamp("created_at").defaultNow()
    });
    users = pgTable("users", {
      id: uuid("id").defaultRandom().primaryKey(),
      username: varchar("username", { length: 100 }).unique(),
      email: varchar("email", { length: 255 }).notNull(),
      recoveryEmail: varchar("recovery_email", { length: 255 }),
      // For password recovery
      passwordHash: text("password_hash"),
      mustChangePassword: boolean("must_change_password").default(true),
      roleId: bigint("role_id", { mode: "number" }).references(() => roles.id).notNull(),
      firstName: varchar("first_name", { length: 100 }).notNull(),
      lastName: varchar("last_name", { length: 100 }).notNull(),
      phone: varchar("phone", { length: 20 }),
      address: text("address"),
      dateOfBirth: date("date_of_birth"),
      gender: genderEnum("gender"),
      nationalId: varchar("national_id", { length: 50 }),
      profileImageUrl: text("profile_image_url"),
      isActive: boolean("is_active").default(true),
      authProvider: varchar("auth_provider", { length: 20 }).default("local"),
      googleId: varchar("google_id", { length: 255 }).unique(),
      // Security & audit fields
      status: userStatusEnum("status").default("pending"),
      // New accounts require approval
      createdVia: createdViaEnum("created_via").default("admin"),
      createdBy: uuid("created_by"),
      approvedBy: uuid("approved_by"),
      approvedAt: timestamp("approved_at"),
      lastLoginAt: timestamp("last_login_at"),
      lastLoginIp: varchar("last_login_ip", { length: 45 }),
      mfaEnabled: boolean("mfa_enabled").default(false),
      mfaSecret: text("mfa_secret"),
      accountLockedUntil: timestamp("account_locked_until"),
      // For suspicious activity lock
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
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      usersEmailIdx: index("users_email_idx").on(table.email),
      usersStatusIdx: index("users_status_idx").on(table.status),
      usersGoogleIdIdx: index("users_google_id_idx").on(table.googleId),
      usersRoleIdIdx: index("users_role_id_idx").on(table.roleId),
      usersUsernameIdx: index("users_username_idx").on(table.username)
    }));
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      token: varchar("token", { length: 255 }).notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      usedAt: timestamp("used_at"),
      ipAddress: varchar("ip_address", { length: 45 }),
      // Track IP for security
      resetBy: uuid("reset_by").references(() => users.id, { onDelete: "set null" }),
      // Admin who initiated reset, null if self-service
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      passwordResetTokensUserIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
      passwordResetTokensTokenIdx: index("password_reset_tokens_token_idx").on(table.token)
    }));
    passwordResetAttempts = pgTable("password_reset_attempts", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      identifier: varchar("identifier", { length: 255 }).notNull(),
      // Email or username
      ipAddress: varchar("ip_address", { length: 45 }).notNull(),
      attemptedAt: timestamp("attempted_at").defaultNow(),
      success: boolean("success").default(false)
    }, (table) => ({
      passwordResetAttemptsIdentifierIdx: index("password_reset_attempts_identifier_idx").on(table.identifier),
      passwordResetAttemptsIpIdx: index("password_reset_attempts_ip_idx").on(table.ipAddress),
      passwordResetAttemptsTimeIdx: index("password_reset_attempts_time_idx").on(table.attemptedAt)
    }));
    invites = pgTable("invites", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      token: varchar("token", { length: 255 }).notNull().unique(),
      email: varchar("email", { length: 255 }).notNull(),
      roleId: bigint("role_id", { mode: "number" }).references(() => roles.id).notNull(),
      createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
      expiresAt: timestamp("expires_at").notNull(),
      acceptedAt: timestamp("accepted_at"),
      acceptedBy: uuid("accepted_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      invitesTokenIdx: index("invites_token_idx").on(table.token),
      invitesEmailIdx: index("invites_email_idx").on(table.email)
    }));
    notifications = pgTable("notifications", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
      // Admin receiving the notification
      type: varchar("type", { length: 50 }).notNull(),
      // 'pending_user', 'approval_request', etc.
      title: varchar("title", { length: 200 }).notNull(),
      message: text("message").notNull(),
      relatedEntityType: varchar("related_entity_type", { length: 50 }),
      // 'user', 'student', etc.
      relatedEntityId: varchar("related_entity_id", { length: 255 }),
      // ID of the related entity
      isRead: boolean("is_read").default(false),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      notificationsUserIdIdx: index("notifications_user_id_idx").on(table.userId),
      notificationsIsReadIdx: index("notifications_is_read_idx").on(table.isRead)
    }));
    academicTerms = pgTable("academic_terms", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 50 }).notNull(),
      year: varchar("year", { length: 9 }).notNull(),
      startDate: date("start_date").notNull(),
      endDate: date("end_date").notNull(),
      isCurrent: boolean("is_current").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    classes = pgTable("classes", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 50 }).notNull().unique(),
      level: varchar("level", { length: 20 }).notNull(),
      capacity: integer("capacity").default(30),
      classTeacherId: uuid("class_teacher_id").references(() => users.id, { onDelete: "set null" }),
      currentTermId: integer("current_term_id").references(() => academicTerms.id),
      isActive: boolean("is_active").default(true),
      createdAt: timestamp("created_at").defaultNow()
    });
    subjects = pgTable("subjects", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      code: varchar("code", { length: 20 }).notNull().unique(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    students = pgTable("students", {
      id: uuid("id").references(() => users.id, { onDelete: "cascade" }).primaryKey(),
      admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
      classId: integer("class_id").references(() => classes.id),
      parentId: uuid("parent_id").references(() => users.id, { onDelete: "set null" }),
      admissionDate: date("admission_date").defaultNow(),
      emergencyContact: varchar("emergency_contact", { length: 20 }),
      medicalInfo: text("medical_info"),
      guardianName: varchar("guardian_name", { length: 200 }),
      createdAt: timestamp("created_at").defaultNow()
    });
    teacherProfiles = pgTable("teacher_profiles", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      staffId: varchar("staff_id", { length: 50 }).unique(),
      subjects: integer("subjects").array(),
      assignedClasses: integer("assigned_classes").array(),
      qualification: varchar("qualification", { length: 100 }),
      yearsOfExperience: integer("years_of_experience").default(0),
      specialization: varchar("specialization", { length: 200 }),
      department: varchar("department", { length: 100 }),
      signatureUrl: text("signature_url"),
      gradingMode: varchar("grading_mode", { length: 50 }).default("manual"),
      autoGradeTheoryQuestions: boolean("auto_grade_theory_questions").default(false),
      theoryGradingInstructions: text("theory_grading_instructions"),
      notificationPreference: varchar("notification_preference", { length: 50 }).default("all"),
      availability: varchar("availability", { length: 50 }),
      firstLogin: boolean("first_login").default(true),
      verified: boolean("verified").default(false),
      verifiedBy: uuid("verified_by").references(() => users.id, { onDelete: "set null" }),
      verifiedAt: timestamp("verified_at"),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    adminProfiles = pgTable("admin_profiles", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      department: varchar("department", { length: 100 }),
      roleDescription: text("role_description"),
      accessLevel: varchar("access_level", { length: 50 }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    parentProfiles = pgTable("parent_profiles", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
      occupation: varchar("occupation", { length: 100 }),
      contactPreference: varchar("contact_preference", { length: 50 }),
      linkedStudents: uuid("linked_students").array(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    attendance = pgTable("attendance", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
      classId: integer("class_id").references(() => classes.id).notNull(),
      date: date("date").notNull(),
      status: attendanceStatusEnum("status"),
      recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
      notes: text("notes"),
      createdAt: timestamp("created_at").defaultNow()
    });
    exams = pgTable("exams", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      classId: bigint("class_id", { mode: "number" }).references(() => classes.id).notNull(),
      subjectId: bigint("subject_id", { mode: "number" }).references(() => subjects.id).notNull(),
      totalMarks: integer("total_marks").notNull(),
      date: text("date").notNull(),
      // Store as YYYY-MM-DD string to avoid Date object conversion
      termId: bigint("term_id", { mode: "number" }).references(() => academicTerms.id).notNull(),
      createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
      teacherInChargeId: uuid("teacher_in_charge_id").references(() => users.id, { onDelete: "set null" }),
      // Teacher responsible for grading
      createdAt: timestamp("created_at").defaultNow(),
      // Exam type: 'test' (40 marks) or 'exam' (60 marks)
      examType: examTypeEnum("exam_type").notNull().default("exam"),
      // Timer mode: 'global' (fixed start/end times) or 'individual' (duration per student)
      timerMode: varchar("timer_mode", { length: 20 }).default("individual"),
      // 'global' or 'individual'
      // Enhanced exam delivery fields
      timeLimit: integer("time_limit"),
      // in minutes (used for individual timer mode)
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
    examQuestions = pgTable("exam_questions", {
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
    questionOptions = pgTable("question_options", {
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
    examSessions = pgTable("exam_sessions", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
      studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
      startedAt: timestamp("started_at").defaultNow(),
      submittedAt: timestamp("submitted_at"),
      timeRemaining: integer("time_remaining"),
      // in seconds
      isCompleted: boolean("is_completed").default(false),
      score: integer("score"),
      maxScore: integer("max_score"),
      status: varchar("status", { length: 20 }).default("in_progress"),
      // 'in_progress', 'submitted', 'graded'
      metadata: text("metadata"),
      // JSON string for violation tracking, progress saving, etc.
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      // PERFORMANCE INDEX: Critical for session lookups
      examSessionsExamStudentIdx: index("exam_sessions_exam_student_idx").on(table.examId, table.studentId),
      examSessionsStudentCompletedIdx: index("exam_sessions_student_completed_idx").on(table.studentId, table.isCompleted),
      examSessionsActiveSessionsIdx: index("exam_sessions_active_idx").on(table.examId, table.studentId, table.isCompleted),
      // UNIQUE CONSTRAINT: Prevent duplicate active sessions (critical for circuit breaker fix)
      examSessionsActiveUniqueIdx: uniqueIndex("exam_sessions_active_unique_idx").on(table.examId, table.studentId).where(eq(table.isCompleted, false))
    }));
    studentAnswers = pgTable("student_answers", {
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
    examResults = pgTable("exam_results", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      examId: bigint("exam_id", { mode: "number" }).references(() => exams.id).notNull(),
      studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
      score: integer("score"),
      maxScore: integer("max_score"),
      marksObtained: integer("marks_obtained"),
      // Legacy field for backward compatibility
      grade: varchar("grade", { length: 5 }),
      remarks: text("remarks"),
      autoScored: boolean("auto_scored").default(false),
      recordedBy: uuid("recorded_by").references(() => users.id).notNull(),
      // UUID field to match database schema, must be a valid user ID
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      // PERFORMANCE INDEX: Critical for fast result lookups by exam/student
      examResultsExamIdIdx: index("exam_results_exam_id_idx").on(table.examId),
      examResultsStudentIdIdx: index("exam_results_student_id_idx").on(table.studentId),
      examResultsExamStudentIdx: index("exam_results_exam_student_idx").on(table.examId, table.studentId),
      examResultsAutoScoredIdx: index("exam_results_auto_scored_idx").on(table.autoScored, table.examId)
    }));
    announcements = pgTable("announcements", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      title: varchar("title", { length: 200 }).notNull(),
      content: text("content").notNull(),
      authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
      targetRoles: varchar("target_roles", { length: 20 }).array().default(sql`'{"All"}'::varchar[]`),
      targetClasses: integer("target_classes").array().default(sql`'{}'::integer[]`),
      isPublished: boolean("is_published").default(false),
      publishedAt: timestamp("published_at"),
      createdAt: timestamp("created_at").defaultNow()
    });
    messages = pgTable("messages", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      senderId: uuid("sender_id").references(() => users.id, { onDelete: "set null" }),
      recipientId: uuid("recipient_id").references(() => users.id, { onDelete: "set null" }),
      subject: varchar("subject", { length: 200 }).notNull(),
      content: text("content").notNull(),
      isRead: boolean("is_read").default(false),
      createdAt: timestamp("created_at").defaultNow()
    });
    galleryCategories = pgTable("gallery_categories", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      description: text("description"),
      createdAt: timestamp("created_at").defaultNow()
    });
    gallery = pgTable("gallery", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      imageUrl: text("image_url").notNull(),
      caption: text("caption"),
      categoryId: integer("category_id").references(() => galleryCategories.id),
      uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow()
    });
    homePageContent = pgTable("home_page_content", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      contentType: varchar("content_type", { length: 50 }).notNull(),
      // 'hero_image', 'gallery_preview_1', 'gallery_preview_2', etc.
      imageUrl: text("image_url"),
      altText: text("alt_text"),
      caption: text("caption"),
      isActive: boolean("is_active").default(true).notNull(),
      displayOrder: integer("display_order").default(0).notNull(),
      uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow().notNull(),
      updatedAt: timestamp("updated_at").defaultNow().notNull()
    });
    contactMessages = pgTable("contact_messages", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      name: varchar("name", { length: 100 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      subject: varchar("subject", { length: 200 }),
      message: text("message").notNull(),
      isRead: boolean("is_read").default(false),
      respondedAt: timestamp("responded_at"),
      respondedBy: uuid("responded_by").references(() => users.id, { onDelete: "set null" }),
      response: text("response"),
      createdAt: timestamp("created_at").defaultNow().notNull()
    });
    reportCards = pgTable("report_cards", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }).notNull(),
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
    reportCardItems = pgTable("report_card_items", {
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
    studyResources = pgTable("study_resources", {
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
      uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
      isPublished: boolean("is_published").default(true),
      downloads: integer("downloads").default(0),
      createdAt: timestamp("created_at").defaultNow()
    });
    performanceEvents = pgTable("performance_events", {
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
      userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
      // for attribution
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      // Performance indexes for analytics queries
      performanceEventsTypeIdx: index("performance_events_type_idx").on(table.eventType),
      performanceEventsDateIdx: index("performance_events_date_idx").on(table.createdAt),
      performanceEventsGoalIdx: index("performance_events_goal_idx").on(table.goalAchieved, table.eventType)
    }));
    teacherClassAssignments = pgTable("teacher_class_assignments", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      teacherId: uuid("teacher_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
    gradingTasks = pgTable("grading_tasks", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      sessionId: bigint("session_id", { mode: "number" }).references(() => examSessions.id, { onDelete: "cascade" }).notNull(),
      answerId: bigint("answer_id", { mode: "number" }).references(() => studentAnswers.id, { onDelete: "cascade" }).notNull(),
      assignedTeacherId: uuid("assigned_teacher_id").references(() => users.id, { onDelete: "set null" }),
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
    auditLogs = pgTable("audit_logs", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
      // Who made the change - PRESERVE audit trail
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
    settings = pgTable("settings", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      key: varchar("key", { length: 100 }).notNull().unique(),
      value: text("value").notNull(),
      description: text("description"),
      dataType: varchar("data_type", { length: 20 }).notNull().default("string"),
      // 'string', 'number', 'boolean', 'json'
      updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      settingsKeyIdx: index("settings_key_idx").on(table.key)
    }));
    counters = pgTable("counters", {
      id: bigserial("id", { mode: "number" }).primaryKey(),
      classCode: varchar("class_code", { length: 50 }).notNull(),
      year: varchar("year", { length: 9 }).notNull(),
      sequence: integer("sequence").notNull().default(0),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      countersClassYearIdx: uniqueIndex("counters_class_year_idx").on(table.classCode, table.year)
    }));
    insertRoleSchema = createInsertSchema(roles).omit({ id: true, createdAt: true });
    insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
    insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({ id: true, createdAt: true });
    insertPasswordResetAttemptSchema = createInsertSchema(passwordResetAttempts).omit({ id: true, attemptedAt: true });
    insertInviteSchema = createInsertSchema(invites).omit({ id: true, createdAt: true });
    insertStudentSchema = createInsertSchema(students).omit({ createdAt: true });
    insertClassSchema = createInsertSchema(classes).omit({ id: true, createdAt: true });
    insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true });
    insertAcademicTermSchema = createInsertSchema(academicTerms).omit({ id: true, createdAt: true });
    insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true, createdAt: true });
    insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true }).extend({
      // Required fields - coerce to numbers with clear error messages
      classId: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().positive("Please select a valid class")
      ),
      subjectId: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().positive("Please select a valid subject")
      ),
      termId: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().positive("Please select a valid term")
      ),
      totalMarks: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().positive("Total marks must be a positive number")
      ),
      // Exam name is required
      name: z.string().min(1, "Exam name is required"),
      // Handle date string from frontend - keep as string for database
      date: z.string().min(1, "Exam date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine((dateStr) => {
        const date2 = new Date(dateStr);
        return !isNaN(date2.getTime()) && date2.toISOString().startsWith(dateStr);
      }, "Please enter a valid date"),
      // Exam type with default
      examType: z.enum(["test", "exam"]).default("exam"),
      // Timer mode with default
      timerMode: z.string().default("individual"),
      // Optional numeric fields - handle empty strings properly
      timeLimit: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().int().min(1, "Time limit must be at least 1 minute").optional()
      ),
      passingScore: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().int().min(0).max(100, "Passing score must be between 0 and 100").optional()
      ),
      // Optional timestamp fields - handle empty strings and convert to Date
      startTime: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : new Date(val),
        z.date().optional()
      ),
      endTime: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : new Date(val),
        z.date().optional()
      ),
      // Optional text fields - handle empty strings
      instructions: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : val,
        z.string().optional()
      ),
      gradingScale: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? "standard" : val,
        z.string().default("standard")
      ),
      // Optional teacher in charge
      teacherInChargeId: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : val,
        z.string().uuid().optional()
      ),
      // Boolean fields with defaults
      isPublished: z.boolean().default(false),
      allowRetakes: z.boolean().default(false),
      shuffleQuestions: z.boolean().default(false),
      autoGradingEnabled: z.boolean().default(true),
      instantFeedback: z.boolean().default(false),
      showCorrectAnswers: z.boolean().default(false)
    });
    insertExamResultSchema = createInsertSchema(examResults).omit({ id: true, createdAt: true });
    insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
    insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
    insertGalleryCategorySchema = createInsertSchema(galleryCategories).omit({ id: true, createdAt: true });
    insertGallerySchema = createInsertSchema(gallery).omit({ id: true, createdAt: true });
    insertHomePageContentSchema = createInsertSchema(homePageContent).omit({ id: true, createdAt: true, updatedAt: true });
    insertContactMessageSchema = createInsertSchema(contactMessages).omit({ id: true, createdAt: true });
    insertReportCardSchema = createInsertSchema(reportCards).omit({ id: true, createdAt: true });
    insertReportCardItemSchema = createInsertSchema(reportCardItems).omit({ id: true, createdAt: true });
    insertStudyResourceSchema = createInsertSchema(studyResources).omit({ id: true, createdAt: true, downloads: true });
    insertPerformanceEventSchema = createInsertSchema(performanceEvents).omit({ id: true, createdAt: true });
    insertTeacherClassAssignmentSchema = createInsertSchema(teacherClassAssignments).omit({ id: true, createdAt: true });
    insertGradingTaskSchema = createInsertSchema(gradingTasks).omit({ id: true, createdAt: true });
    insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
    insertSettingSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });
    insertCounterSchema = createInsertSchema(counters).omit({ id: true, createdAt: true, updatedAt: true });
    createStudentWithAutoCredsSchema = z.object({
      // User fields - email/password/username auto-generated
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
      medicalInfo: z.string().optional(),
      parentEmail: z.string().email("Invalid parent email").optional(),
      // For linking/creating parent accounts
      parentPhone: z.string().optional()
      // For linking/creating parent accounts
    });
    createStudentSchema = z.object({
      // User fields - password, username, and email auto-generated
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      phone: z.string().optional(),
      address: z.string().optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
      gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
      profileImageUrl: z.string().optional(),
      // Student-specific fields - admissionNumber auto-generated
      classId: z.coerce.number().positive("Please select a valid class"),
      parentId: z.string().uuid("Invalid parent selection").optional().nullable(),
      parentPhone: z.string().optional(),
      // For parent linking/creation by phone only
      admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format"),
      emergencyContact: z.string().optional(),
      medicalInfo: z.string().optional(),
      guardianName: z.string().optional()
    });
    csvStudentSchema = z.object({
      fullName: z.string().min(1, "Full name is required"),
      class: z.string().min(1, "Class is required"),
      gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
      parentEmail: z.string().email("Invalid parent email").optional(),
      parentPhone: z.string().optional(),
      emergencyContact: z.string().min(1, "Emergency contact is required"),
      admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format").optional(),
      medicalInfo: z.string().optional(),
      guardianName: z.string().optional()
    });
    insertExamQuestionSchema = createInsertSchema(examQuestions).omit({ id: true, createdAt: true }).extend({
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
    insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({ id: true, createdAt: true }).extend({
      // Coerce string IDs and numeric values to numbers
      questionId: z.coerce.number().positive("Please select a valid question"),
      orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),
      // Handle optional numeric fields - convert empty strings to undefined or 0
      partialCreditValue: z.preprocess((val) => val === "" ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)),
      // Handle optional text fields - convert empty strings to undefined
      explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
    });
    createQuestionOptionSchema = insertQuestionOptionSchema.omit({ questionId: true, orderNumber: true }).extend({
      // Optional fields that can be provided during creation
      partialCreditValue: z.preprocess((val) => val === "" ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)).optional(),
      explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
    });
    insertExamSessionSchema = createInsertSchema(examSessions).omit({
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
    updateExamSessionSchema = z.object({
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
    insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true });
    insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
    insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({ id: true, createdAt: true, updatedAt: true });
    insertAdminProfileSchema = createInsertSchema(adminProfiles).omit({ id: true, createdAt: true, updatedAt: true });
    insertParentProfileSchema = createInsertSchema(parentProfiles).omit({ id: true, createdAt: true, updatedAt: true });
    vacancyStatusEnum = pgEnum("vacancy_status", ["open", "closed", "filled"]);
    applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);
    vacancies = pgTable("vacancies", {
      id: uuid("id").defaultRandom().primaryKey(),
      title: varchar("title", { length: 200 }).notNull(),
      description: text("description").notNull(),
      requirements: text("requirements"),
      deadline: timestamp("deadline").notNull(),
      status: vacancyStatusEnum("status").default("open"),
      createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      vacanciesStatusIdx: index("vacancies_status_idx").on(table.status),
      vacanciesDeadlineIdx: index("vacancies_deadline_idx").on(table.deadline)
    }));
    teacherApplications = pgTable("teacher_applications", {
      id: uuid("id").defaultRandom().primaryKey(),
      vacancyId: uuid("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
      fullName: varchar("full_name", { length: 200 }).notNull(),
      googleEmail: varchar("google_email", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 20 }).notNull(),
      subjectSpecialty: varchar("subject_specialty", { length: 100 }).notNull(),
      qualification: varchar("qualification", { length: 200 }).notNull(),
      experienceYears: integer("experience_years").notNull(),
      bio: text("bio").notNull(),
      resumeUrl: text("resume_url"),
      status: applicationStatusEnum("status").default("pending"),
      reviewedBy: uuid("reviewed_by").references(() => users.id, { onDelete: "set null" }),
      reviewedAt: timestamp("reviewed_at"),
      rejectionReason: text("rejection_reason"),
      dateApplied: timestamp("date_applied").defaultNow(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    }, (table) => ({
      teacherApplicationsStatusIdx: index("teacher_applications_status_idx").on(table.status),
      teacherApplicationsEmailIdx: index("teacher_applications_email_idx").on(table.googleEmail),
      teacherApplicationsVacancyIdx: index("teacher_applications_vacancy_idx").on(table.vacancyId)
    }));
    approvedTeachers = pgTable("approved_teachers", {
      id: uuid("id").defaultRandom().primaryKey(),
      applicationId: uuid("application_id").references(() => teacherApplications.id, { onDelete: "set null" }),
      googleEmail: varchar("google_email", { length: 255 }).notNull().unique(),
      fullName: varchar("full_name", { length: 200 }).notNull(),
      subjectSpecialty: varchar("subject_specialty", { length: 100 }),
      approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
      dateApproved: timestamp("date_approved").defaultNow(),
      createdAt: timestamp("created_at").defaultNow()
    }, (table) => ({
      approvedTeachersEmailIdx: index("approved_teachers_email_idx").on(table.googleEmail)
    }));
    insertVacancySchema = createInsertSchema(vacancies).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertTeacherApplicationSchema = createInsertSchema(teacherApplications).omit({
      id: true,
      createdAt: true,
      updatedAt: true,
      dateApplied: true,
      reviewedAt: true,
      reviewedBy: true,
      status: true
    });
    insertApprovedTeacherSchema = createInsertSchema(approvedTeachers).omit({
      id: true,
      createdAt: true,
      dateApproved: true
    });
  }
});

// server/storage.ts
var storage_exports = {};
__export(storage_exports, {
  DatabaseStorage: () => DatabaseStorage,
  db: () => exportDb,
  storage: () => storage
});
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq as eq2, and, desc, asc, sql as sql2, sql as dsql, inArray, isNull } from "drizzle-orm";
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
var pg, db, exportDb, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_schema();
    ({ db: exportDb } = initializeDatabase());
    DatabaseStorage = class {
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
        const result = await this.db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          recoveryEmail: users.recoveryEmail,
          passwordHash: users.passwordHash,
          roleId: users.roleId,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          address: users.address,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          nationalId: users.nationalId,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
          authProvider: users.authProvider,
          googleId: users.googleId,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users).where(eq2(users.id, id)).limit(1);
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
        const result = await this.db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          recoveryEmail: users.recoveryEmail,
          passwordHash: users.passwordHash,
          roleId: users.roleId,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          address: users.address,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          nationalId: users.nationalId,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
          authProvider: users.authProvider,
          googleId: users.googleId,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users).where(eq2(users.email, email)).limit(1);
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
        const result = await this.db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          recoveryEmail: users.recoveryEmail,
          passwordHash: users.passwordHash,
          roleId: users.roleId,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          address: users.address,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          nationalId: users.nationalId,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
          authProvider: users.authProvider,
          googleId: users.googleId,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users).where(eq2(users.googleId, googleId)).limit(1);
        const user = result[0];
        if (user && user.id) {
          const normalizedId = normalizeUuid(user.id);
          if (normalizedId) {
            user.id = normalizedId;
          }
        }
        return user;
      }
      async createPasswordResetToken(userId, token, expiresAt, ipAddress, resetBy) {
        const result = await this.db.insert(passwordResetTokens).values({
          userId,
          token,
          expiresAt,
          ipAddress,
          resetBy
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
        try {
          const result = await this.db.update(users).set(user).where(eq2(users.id, id)).returning();
          const updatedUser = result[0];
          if (updatedUser && updatedUser.id) {
            const normalizedId = normalizeUuid(updatedUser.id);
            if (normalizedId) {
              updatedUser.id = normalizedId;
            }
          }
          return updatedUser;
        } catch (error) {
          if (error?.cause?.code === "42703") {
            const missingColumn = error?.cause?.message?.match(/column "(\w+)" does not exist/)?.[1];
            console.warn(`\u26A0\uFE0F Column "${missingColumn}" does not exist, retrying without it`);
            const { [missingColumn]: removed, ...safeUser } = user;
            if (Object.keys(safeUser).length > 0) {
              const result = await this.db.update(users).set(safeUser).where(eq2(users.id, id)).returning();
              const updatedUser = result[0];
              if (updatedUser && updatedUser.id) {
                const normalizedId = normalizeUuid(updatedUser.id);
                if (normalizedId) {
                  updatedUser.id = normalizedId;
                }
              }
              return updatedUser;
            }
          }
          throw error;
        }
      }
      async updateUserGoogleId(userId, googleId) {
        return await this.updateUser(userId, { googleId });
      }
      async deleteUser(id) {
        try {
          console.log(`\u{1F5D1}\uFE0F Starting cascade delete for user ${id}...`);
          await this.db.delete(teacherProfiles).where(eq2(teacherProfiles.userId, id));
          console.log(`\u2705 Deleted teacher profile for user ${id}`);
          await this.db.delete(adminProfiles).where(eq2(adminProfiles.userId, id));
          console.log(`\u2705 Deleted admin profile for user ${id}`);
          await this.db.delete(parentProfiles).where(eq2(parentProfiles.userId, id));
          console.log(`\u2705 Deleted parent profile for user ${id}`);
          await this.db.delete(passwordResetTokens).where(eq2(passwordResetTokens.userId, id));
          console.log(`\u2705 Deleted password reset tokens for user ${id}`);
          await this.db.delete(invites).where(eq2(invites.acceptedBy, id));
          console.log(`\u2705 Deleted invites for user ${id}`);
          await this.db.delete(notifications).where(eq2(notifications.userId, id));
          console.log(`\u2705 Deleted notifications for user ${id}`);
          try {
            if (teacherClassAssignments) {
              await this.db.delete(teacherClassAssignments).where(eq2(teacherClassAssignments.teacherId, id));
              console.log(`\u2705 Deleted teacher assignments for user ${id}`);
            }
          } catch (assignmentError) {
            if (assignmentError?.cause?.code === "42P01") {
              console.log(`\u26A0\uFE0F Skipped teacher_class_assignments (table doesn't exist)`);
            } else {
              throw assignmentError;
            }
          }
          const examSessions2 = await this.db.select({ id: examSessions.id }).from(examSessions).where(eq2(examSessions.studentId, id));
          const sessionIds = examSessions2.map((s) => s.id);
          if (sessionIds.length > 0) {
            await this.db.delete(studentAnswers).where(inArray(studentAnswers.sessionId, sessionIds));
            console.log(`\u2705 Deleted student answers for user ${id}`);
            await this.db.delete(examSessions).where(inArray(examSessions.id, sessionIds));
            console.log(`\u2705 Deleted exam sessions for user ${id}`);
          }
          await this.db.delete(examResults).where(eq2(examResults.studentId, id));
          console.log(`\u2705 Deleted exam results for user ${id}`);
          await this.db.delete(attendance).where(eq2(attendance.studentId, id));
          console.log(`\u2705 Deleted attendance records for user ${id}`);
          await this.db.update(students).set({ parentId: null }).where(eq2(students.parentId, id));
          console.log(`\u2705 Unlinked parent relationship for user ${id}`);
          await this.db.delete(students).where(eq2(students.id, id));
          console.log(`\u2705 Deleted student record for user ${id}`);
          const result = await this.db.delete(users).where(eq2(users.id, id)).returning();
          console.log(`\u2705 Successfully deleted user ${id} and all related records`);
          return result.length > 0;
        } catch (error) {
          console.error(`\u274C Error deleting user ${id}:`, error);
          throw error;
        }
      }
      async getUsersByRole(roleId) {
        const result = await this.db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          passwordHash: users.passwordHash,
          roleId: users.roleId,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          address: users.address,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
          authProvider: users.authProvider,
          googleId: users.googleId,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users).where(eq2(users.roleId, roleId));
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
      async getUsersByStatus(status) {
        const result = await this.db.select().from(users).where(sql2`${users.status} = ${status}`);
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
      async getAllUsers() {
        const result = await this.db.select({
          id: users.id,
          username: users.username,
          email: users.email,
          passwordHash: users.passwordHash,
          roleId: users.roleId,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          address: users.address,
          dateOfBirth: users.dateOfBirth,
          gender: users.gender,
          profileImageUrl: users.profileImageUrl,
          isActive: users.isActive,
          authProvider: users.authProvider,
          googleId: users.googleId,
          status: users.status,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        }).from(users);
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
      async approveUser(userId, approvedBy) {
        const result = await this.db.update(users).set({
          status: "active",
          approvedBy,
          approvedAt: /* @__PURE__ */ new Date()
        }).where(eq2(users.id, userId)).returning();
        const user = result[0];
        if (user && user.id) {
          const normalizedId = normalizeUuid(user.id);
          if (normalizedId) {
            user.id = normalizedId;
          }
        }
        return user;
      }
      async updateUserStatus(userId, status, updatedBy, reason) {
        console.log(`\u{1F504} UPDATE USER STATUS CALLED: User ID: ${userId}, New Status: ${status}, Updated By: ${updatedBy}`);
        const updates = { status };
        if (status === "active") {
          updates.approvedBy = updatedBy;
          updates.approvedAt = /* @__PURE__ */ new Date();
        }
        console.log(`\u{1F504} UPDATE USER STATUS: About to update with:`, updates);
        const result = await this.db.update(users).set(updates).where(eq2(users.id, userId)).returning();
        console.log(`\u{1F504} UPDATE USER STATUS RESULT: Updated ${result.length} user record(s)`, result[0]);
        const user = result[0];
        if (user && user.id) {
          const normalizedId = normalizeUuid(user.id);
          if (normalizedId) {
            user.id = normalizedId;
          }
        }
        return user;
      }
      // Role management
      async getRoles() {
        return await this.db.select().from(roles);
      }
      async getRoleByName(name) {
        const result = await this.db.select().from(roles).where(eq2(roles.name, name)).limit(1);
        return result[0];
      }
      async getRole(roleId) {
        const result = await this.db.select().from(roles).where(eq2(roles.id, roleId)).limit(1);
        return result[0];
      }
      // Invite management
      async createInvite(invite) {
        const result = await this.db.insert(invites).values(invite).returning();
        return result[0];
      }
      async getInviteByToken(token) {
        const result = await this.db.select().from(invites).where(and(
          eq2(invites.token, token),
          isNull(invites.acceptedAt),
          dsql`${invites.expiresAt} > NOW()`
        )).limit(1);
        return result[0];
      }
      async getPendingInviteByEmail(email) {
        const result = await this.db.select().from(invites).where(and(
          eq2(invites.email, email),
          isNull(invites.acceptedAt)
        )).limit(1);
        return result[0];
      }
      async getAllInvites() {
        return await this.db.select().from(invites).orderBy(desc(invites.createdAt));
      }
      async getPendingInvites() {
        return await this.db.select().from(invites).where(isNull(invites.acceptedAt)).orderBy(desc(invites.createdAt));
      }
      async markInviteAsAccepted(inviteId, acceptedBy) {
        await this.db.update(invites).set({ acceptedAt: /* @__PURE__ */ new Date(), acceptedBy }).where(eq2(invites.id, inviteId));
      }
      async deleteInvite(inviteId) {
        const result = await this.db.delete(invites).where(eq2(invites.id, inviteId)).returning();
        return result.length > 0;
      }
      async deleteExpiredInvites() {
        const result = await this.db.delete(invites).where(and(
          dsql`${invites.expiresAt} < NOW()`,
          isNull(invites.acceptedAt)
        )).returning();
        return result.length > 0;
      }
      // Profile management
      async updateUserProfile(userId, profileData) {
        const result = await this.db.update(users).set({ ...profileData, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, userId)).returning();
        return result[0];
      }
      async getTeacherProfile(userId) {
        const [profile] = await db.select().from(teacherProfiles).where(eq2(teacherProfiles.userId, userId));
        return profile || null;
      }
      async updateTeacherProfile(userId, profile) {
        const result = await this.db.update(teacherProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(teacherProfiles.userId, userId)).returning();
        return result[0];
      }
      async getTeacherProfileByStaffId(staffId) {
        const [profile] = await db.select().from(teacherProfiles).where(eq2(teacherProfiles.staffId, staffId));
        return profile || null;
      }
      async getAllTeacherProfiles() {
        const profiles = await db.select().from(teacherProfiles);
        return profiles;
      }
      async createTeacherProfile(profile) {
        const result = await this.db.insert(teacherProfiles).values(profile).returning();
        return result[0];
      }
      async getAdminProfile(userId) {
        const result = await this.db.select().from(adminProfiles).where(eq2(adminProfiles.userId, userId)).limit(1);
        return result[0];
      }
      async createAdminProfile(profile) {
        const result = await this.db.insert(adminProfiles).values(profile).returning();
        return result[0];
      }
      async updateAdminProfile(userId, profile) {
        const result = await this.db.update(adminProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(adminProfiles.userId, userId)).returning();
        return result[0];
      }
      async getParentProfile(userId) {
        const result = await this.db.select().from(parentProfiles).where(eq2(parentProfiles.userId, userId)).limit(1);
        return result[0];
      }
      async createParentProfile(profile) {
        const result = await this.db.insert(parentProfiles).values(profile).returning();
        return result[0];
      }
      async updateParentProfile(userId, profile) {
        const result = await this.db.update(parentProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(parentProfiles.userId, userId)).returning();
        return result[0];
      }
      async calculateProfileCompletion(userId, roleId) {
        const user = await this.getUser(userId);
        if (!user) return 0;
        const requiredFields = [
          "firstName",
          "lastName",
          "email",
          "phone",
          "address",
          "dateOfBirth",
          "gender",
          "profileImageUrl",
          "state",
          "country",
          "securityQuestion",
          "securityAnswerHash",
          "dataPolicyAgreed"
        ];
        let completedFields = 0;
        requiredFields.forEach((field) => {
          if (user[field]) {
            completedFields++;
          }
        });
        if (roleId === 1) {
          const adminProfile = await this.getAdminProfile(userId);
          if (adminProfile?.department) completedFields++;
          if (adminProfile?.roleDescription) completedFields++;
          if (adminProfile?.accessLevel) completedFields++;
        } else if (roleId === 2) {
          const teacherProfile = await this.getTeacherProfile(userId);
          if (teacherProfile?.subjects && teacherProfile.subjects.length > 0) completedFields++;
          if (teacherProfile?.assignedClasses && teacherProfile.assignedClasses.length > 0) completedFields++;
          if (teacherProfile?.qualification) completedFields++;
          if (teacherProfile?.yearsOfExperience) completedFields++;
        } else if (roleId === 3) {
          const student = await this.getStudent(userId);
          if (student?.classId) completedFields++;
          if (student?.guardianName) completedFields++;
          if (student?.emergencyContact) completedFields++;
        } else if (roleId === 4) {
          const parentProfile = await this.getParentProfile(userId);
          if (parentProfile?.occupation) completedFields++;
          if (parentProfile?.contactPreference) completedFields++;
          if (parentProfile?.linkedStudents && parentProfile.linkedStudents.length > 0) completedFields++;
        }
        const totalFields = requiredFields.length + 3;
        return Math.round(completedFields / totalFields * 100);
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
      async getAcademicTerms() {
        try {
          const terms = await db.select().from(academicTerms).orderBy(desc(academicTerms.startDate));
          console.log(`\u{1F4C5} Retrieved ${terms.length} academic terms from database`);
          return terms;
        } catch (error) {
          console.error("\u274C Error fetching academic terms:", error);
          throw error;
        }
      }
      async getAcademicTerm(id) {
        try {
          const result = await db.select().from(academicTerms).where(eq2(academicTerms.id, id)).limit(1);
          return result[0];
        } catch (error) {
          console.error(`\u274C Error fetching academic term ${id}:`, error);
          throw error;
        }
      }
      async createAcademicTerm(term) {
        try {
          const result = await db.insert(academicTerms).values(term).returning();
          console.log(`\u2705 Created academic term: ${result[0].name} (${result[0].year})`);
          return result[0];
        } catch (error) {
          console.error("\u274C Error creating academic term:", error);
          throw error;
        }
      }
      async updateAcademicTerm(id, term) {
        try {
          const result = await db.update(academicTerms).set(term).where(eq2(academicTerms.id, id)).returning();
          if (result[0]) {
            console.log(`\u2705 Updated academic term: ${result[0].name} (${result[0].year})`);
          }
          return result[0];
        } catch (error) {
          console.error(`\u274C Error updating academic term ${id}:`, error);
          throw error;
        }
      }
      async deleteAcademicTerm(id) {
        try {
          console.log(`\u{1F5D1}\uFE0F Attempting to delete academic term ${id}...`);
          const existingTerm = await db.select().from(academicTerms).where(eq2(academicTerms.id, id)).limit(1);
          if (!existingTerm || existingTerm.length === 0) {
            console.error(`\u274C Term ${id} not found in database`);
            return false;
          }
          console.log(`\u{1F4CB} Found term to delete: ${existingTerm[0].name} (${existingTerm[0].year})`);
          const examsUsingTerm = await db.select({ id: exams.id }).from(exams).where(eq2(exams.termId, id));
          if (examsUsingTerm && examsUsingTerm.length > 0) {
            console.error(`\u274C Cannot delete term ${id}: ${examsUsingTerm.length} exams are linked to it`);
            throw new Error(`Cannot delete this term. ${examsUsingTerm.length} exam(s) are linked to it. Please reassign or delete those exams first.`);
          }
          const result = await db.delete(academicTerms).where(eq2(academicTerms.id, id)).returning();
          const success = result && result.length > 0;
          if (success) {
            console.log(`\u2705 Successfully deleted academic term ${id}: ${result[0].name} (${result[0].year})`);
          } else {
            console.error(`\u274C Delete operation failed for term ${id} - no rows affected`);
          }
          return success;
        } catch (error) {
          console.error(`\u274C Error deleting academic term ${id}:`, error);
          if (error?.code === "23503") {
            throw new Error("Cannot delete this term because it is being used by other records (exams, classes, etc.). Please remove those associations first.");
          }
          throw error;
        }
      }
      async markTermAsCurrent(id) {
        try {
          await db.update(academicTerms).set({ isCurrent: false });
          const result = await db.update(academicTerms).set({ isCurrent: true }).where(eq2(academicTerms.id, id)).returning();
          if (result[0]) {
            console.log(`\u2705 Marked term as current: ${result[0].name} (${result[0].year})`);
          }
          return result[0];
        } catch (error) {
          console.error(`\u274C Error marking term ${id} as current:`, error);
          throw error;
        }
      }
      // Helper method to check if a term is being used
      async getExamsByTerm(termId) {
        try {
          const result = await db.select().from(exams).where(eq2(exams.termId, termId));
          return result;
        } catch (error) {
          console.error(`\u274C Error fetching exams for term ${termId}:`, error);
          return [];
        }
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
      async getExamQuestionById(id) {
        const result = await db.select({
          id: examQuestions.id,
          examId: examQuestions.examId,
          questionText: examQuestions.questionText,
          questionType: examQuestions.questionType,
          points: examQuestions.points,
          orderNumber: examQuestions.orderNumber,
          imageUrl: examQuestions.imageUrl,
          createdAt: examQuestions.createdAt
        }).from(examQuestions).where(eq2(examQuestions.id, id)).limit(1);
        return result[0];
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
      // Get AI-suggested grading tasks for teacher review
      async getAISuggestedGradingTasks(teacherId, status) {
        try {
          const assignments = await this.db.select().from(teacherClassAssignments).where(and(
            eq2(teacherClassAssignments.teacherId, teacherId),
            eq2(teacherClassAssignments.isActive, true)
          ));
          if (assignments.length === 0) {
            return [];
          }
          const classIds = assignments.map((a) => a.classId);
          const subjectIds = assignments.map((a) => a.subjectId);
          const exams2 = await this.db.select().from(exams).where(and(
            inArray(exams.classId, classIds),
            inArray(exams.subjectId, subjectIds)
          ));
          const examIds = exams2.map((e) => e.id);
          if (examIds.length === 0) {
            return [];
          }
          const sessions = await this.db.select().from(examSessions).where(and(
            inArray(examSessions.examId, examIds),
            eq2(examSessions.isCompleted, true)
          ));
          const sessionIds = sessions.map((s) => s.id);
          if (sessionIds.length === 0) {
            return [];
          }
          let query = this.db.select({
            id: studentAnswers.id,
            sessionId: studentAnswers.sessionId,
            questionId: studentAnswers.questionId,
            textAnswer: studentAnswers.textAnswer,
            pointsEarned: studentAnswers.pointsEarned,
            feedbackText: studentAnswers.feedbackText,
            autoScored: studentAnswers.autoScored,
            manualOverride: studentAnswers.manualOverride,
            answeredAt: studentAnswers.answeredAt,
            questionText: examQuestions.questionText,
            questionType: examQuestions.questionType,
            points: examQuestions.points,
            expectedAnswers: examQuestions.expectedAnswers,
            studentId: examSessions.studentId,
            examId: examSessions.examId,
            examName: exams.name
          }).from(studentAnswers).innerJoin(examQuestions, eq2(studentAnswers.questionId, examQuestions.id)).innerJoin(examSessions, eq2(studentAnswers.sessionId, examSessions.id)).innerJoin(exams, eq2(examSessions.examId, exams.id)).where(and(
            inArray(studentAnswers.sessionId, sessionIds),
            sql2`(${examQuestions.questionType} = 'text' OR ${examQuestions.questionType} = 'essay')`,
            sql2`${studentAnswers.textAnswer} IS NOT NULL`
          ));
          if (status === "pending") {
            query = query.where(sql2`${studentAnswers.autoScored} = false AND ${studentAnswers.manualOverride} = false`);
          } else if (status === "reviewed") {
            query = query.where(sql2`(${studentAnswers.autoScored} = true OR ${studentAnswers.manualOverride} = true)`);
          }
          const results = await query;
          const studentIds = [...new Set(results.map((r) => r.studentId))];
          const students3 = await this.db.select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName
          }).from(users).where(inArray(users.id, studentIds));
          return results.map((r) => ({
            ...r,
            studentName: `${students3.find((s) => s.id === r.studentId)?.firstName} ${students3.find((s) => s.id === r.studentId)?.lastName}`,
            status: r.autoScored || r.manualOverride ? "reviewed" : "pending",
            aiSuggested: r.pointsEarned > 0 && !r.autoScored && !r.manualOverride
          }));
        } catch (error) {
          console.error("Error fetching AI-suggested tasks:", error);
          return [];
        }
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
      // PERFORMANCE: Get only expired sessions directly from database
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
      async getStudentAnswerBySessionAndQuestion(sessionId, questionId) {
        const result = await db.select().from(studentAnswers).where(and(
          eq2(studentAnswers.sessionId, sessionId),
          eq2(studentAnswers.questionId, questionId)
        )).limit(1);
        return result[0];
      }
      async upsertStudentAnswer(sessionId, questionId, answer) {
        const existing = await this.getStudentAnswerBySessionAndQuestion(sessionId, questionId);
        if (existing) {
          const updated = await this.updateStudentAnswer(existing.id, answer);
          return updated;
        } else {
          return await this.createStudentAnswer({
            sessionId,
            questionId,
            ...answer
          });
        }
      }
      async getQuestionOptionById(optionId) {
        const result = await db.select().from(questionOptions).where(eq2(questionOptions.id, optionId)).limit(1);
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
          const pgClient = await initializeDatabase().pg;
          const params = [teacherId];
          if (status && status !== "all") {
            if (status === "pending") {
              query += " AND sa.id NOT IN (SELECT answer_id FROM manual_scores)";
            } else if (status === "graded") {
              query += " AND sa.id IN (SELECT answer_id FROM manual_scores)";
            }
          }
          query += " ORDER BY es.submitted_at DESC";
          const result = await pgClient.unsafe(query, params);
          return result;
        } catch (error) {
          console.error("Error fetching grading tasks:", error);
          throw error;
        }
      }
      async submitManualGrade(gradeData) {
        try {
          const { taskId, score, comment, graderId } = gradeData;
          const pgClient = await initializeDatabase().pg;
          const result = await pgClient`
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
          await pgClient`
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
          const pgClient = await initializeDatabase().pg;
          const result = await pgClient`
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
          const pgClient = await initializeDatabase().pg;
          const result = await pgClient.unsafe(query, params);
          return result;
        } catch (error) {
          console.error("Error fetching exam reports:", error);
          throw error;
        }
      }
      async getExamStudentReports(examId) {
        try {
          const pgClient = await initializeDatabase().pg;
          const result = await pgClient`
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
      async getStudentsByParentId(parentId2) {
        try {
          return await db.select().from(students).where(eq2(students.parentId, parentId2));
        } catch (error) {
          console.error("Error fetching students by parent:", error);
          return [];
        }
      }
      // Analytics and Reports
      async getAnalyticsOverview() {
        try {
          const [students3, teachers, admins, parents] = await Promise.all([
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
            totalUsers: students3.length + teachers.length + admins.length + parents.length,
            totalStudents: students3.length,
            totalTeachers: teachers.length,
            totalAdmins: admins.length,
            totalParents: parents.length,
            totalClasses: classes2.length,
            totalSubjects: subjects2.length,
            totalExams: exams2.length,
            totalExamResults: examResults2.length,
            averageClassSize: classes2.length > 0 ? Math.round(students3.length / classes2.length) : 0,
            gradeDistribution,
            subjectPerformance,
            recentActivity: {
              newStudentsThisMonth: students3.filter(
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
          const [students3, exams2, examResults2] = await Promise.all([
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
              students: students3.length + Math.floor(Math.random() * 10) - 5,
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
        try {
          const since = new Date(Date.now() - hours * 60 * 60 * 1e3);
          const sinceISO = since.toISOString();
          const events = await this.db.select().from(performanceEvents).where(sql2`${performanceEvents.createdAt} >= ${sinceISO}`);
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
        } catch (error) {
          console.error("Error in getPerformanceMetrics:", error);
          return {
            totalEvents: 0,
            goalAchievementRate: 0,
            averageDuration: 0,
            slowSubmissions: 0,
            eventsByType: {}
          };
        }
      }
      async getRecentPerformanceAlerts(hours = 24) {
        try {
          const since = new Date(Date.now() - hours * 60 * 60 * 1e3);
          const sinceISO = since.toISOString();
          const alerts = await this.db.select().from(performanceEvents).where(and(
            sql2`${performanceEvents.createdAt} >= ${sinceISO}`,
            eq2(performanceEvents.goalAchieved, false)
          )).orderBy(desc(performanceEvents.createdAt)).limit(50);
          return alerts;
        } catch (error) {
          console.error("Error in getRecentPerformanceAlerts:", error);
          return [];
        }
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
      // Manual grading task queue
      async createGradingTask(task) {
        try {
          const result = await this.db.insert(gradingTasks).values(task).returning();
          return result[0];
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            console.warn("\u26A0\uFE0F grading_tasks table does not exist yet - skipping task creation");
            return { id: 0, ...task };
          }
          throw error;
        }
      }
      async assignGradingTask(taskId, teacherId) {
        try {
          const result = await this.db.update(gradingTasks).set({
            assignedTeacherId: teacherId,
            assignedAt: /* @__PURE__ */ new Date(),
            status: "in_progress"
          }).where(eq2(gradingTasks.id, taskId)).returning();
          return result[0];
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            console.warn("\u26A0\uFE0F grading_tasks table does not exist yet");
            return void 0;
          }
          throw error;
        }
      }
      async getGradingTasksByTeacher(teacherId, status) {
        try {
          let query = this.db.select().from(gradingTasks).where(eq2(gradingTasks.assignedTeacherId, teacherId)).orderBy(desc(gradingTasks.priority), asc(gradingTasks.createdAt));
          if (status) {
            query = query.where(and(
              eq2(gradingTasks.assignedTeacherId, teacherId),
              eq2(gradingTasks.status, status)
            ));
          }
          return await query;
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            console.warn("\u26A0\uFE0F grading_tasks table does not exist yet - returning empty array");
            return [];
          }
          throw error;
        }
      }
      async getGradingTasksBySession(sessionId) {
        try {
          return await this.db.select().from(gradingTasks).where(eq2(gradingTasks.sessionId, sessionId)).orderBy(desc(gradingTasks.priority), asc(gradingTasks.createdAt));
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            console.warn("\u26A0\uFE0F grading_tasks table does not exist yet - returning empty array");
            return [];
          }
          throw error;
        }
      }
      async updateGradingTaskStatus(taskId, status, completedAt) {
        try {
          const updateData = { status };
          if (completedAt) {
            updateData.completedAt = completedAt;
          }
          const result = await this.db.update(gradingTasks).set(updateData).where(eq2(gradingTasks.id, taskId)).returning();
          return result[0];
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            console.warn("\u26A0\uFE0F grading_tasks table does not exist yet");
            return void 0;
          }
          throw error;
        }
      }
      async completeGradingTask(taskId, pointsEarned, feedbackText) {
        try {
          return await this.db.transaction(async (tx) => {
            const tasks = await tx.select().from(gradingTasks).where(eq2(gradingTasks.id, taskId)).limit(1);
            if (tasks.length === 0) {
              return void 0;
            }
            const task = tasks[0];
            const answers = await tx.update(studentAnswers).set({
              pointsEarned,
              feedbackText,
              autoScored: false,
              manualOverride: true
            }).where(eq2(studentAnswers.id, task.answerId)).returning();
            const updatedTasks = await tx.update(gradingTasks).set({
              status: "completed",
              completedAt: /* @__PURE__ */ new Date()
            }).where(eq2(gradingTasks.id, taskId)).returning();
            return {
              task: updatedTasks[0],
              answer: answers[0]
            };
          });
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            console.warn("\u26A0\uFE0F grading_tasks table does not exist yet");
            return void 0;
          }
          throw error;
        }
      }
      // Audit logging implementation
      async createAuditLog(log3) {
        const result = await this.db.insert(auditLogs).values(log3).returning();
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
      // Notification management implementation
      async createNotification(notification) {
        const result = await this.db.insert(notifications).values(notification).returning();
        return result[0];
      }
      async getNotificationsByUserId(userId) {
        return await this.db.select().from(notifications).where(eq2(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
      }
      async getUnreadNotificationCount(userId) {
        const result = await this.db.select({ count: dsql`count(*)::int` }).from(notifications).where(and(
          eq2(notifications.userId, userId),
          eq2(notifications.isRead, false)
        ));
        return result[0]?.count || 0;
      }
      async markNotificationAsRead(notificationId) {
        const result = await this.db.update(notifications).set({ isRead: true }).where(eq2(notifications.id, notificationId)).returning();
        return result[0];
      }
      async markAllNotificationsAsRead(userId) {
        await this.db.update(notifications).set({ isRead: true }).where(and(
          eq2(notifications.userId, userId),
          eq2(notifications.isRead, false)
        ));
      }
      // Password reset attempt tracking for rate limiting
      async createPasswordResetAttempt(identifier, ipAddress, success) {
        const result = await this.db.insert(passwordResetAttempts).values({
          identifier,
          ipAddress,
          success
        }).returning();
        return result[0];
      }
      async getRecentPasswordResetAttempts(identifier, minutesAgo) {
        const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1e3);
        return await this.db.select().from(passwordResetAttempts).where(and(
          eq2(passwordResetAttempts.identifier, identifier),
          dsql`${passwordResetAttempts.attemptedAt} > ${cutoffTime}`
        )).orderBy(desc(passwordResetAttempts.attemptedAt));
      }
      async deleteOldPasswordResetAttempts(hoursAgo) {
        const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1e3);
        await this.db.delete(passwordResetAttempts).where(dsql`${passwordResetAttempts.attemptedAt} < ${cutoffTime}`);
        return true;
      }
      // Account security methods
      async lockAccount(userId, lockUntil) {
        const result = await this.db.update(users).set({ accountLockedUntil: lockUntil }).where(eq2(users.id, userId)).returning();
        return result.length > 0;
      }
      async unlockAccount(userId) {
        const result = await this.db.update(users).set({ accountLockedUntil: null }).where(eq2(users.id, userId)).returning();
        return result.length > 0;
      }
      async isAccountLocked(userId) {
        const user = await this.db.select({ accountLockedUntil: users.accountLockedUntil }).from(users).where(eq2(users.id, userId)).limit(1);
        if (!user[0] || !user[0].accountLockedUntil) {
          return false;
        }
        return new Date(user[0].accountLockedUntil) > /* @__PURE__ */ new Date();
      }
      // Admin recovery powers
      async adminResetUserPassword(userId, newPasswordHash, resetBy, forceChange) {
        const result = await this.db.update(users).set({
          passwordHash: newPasswordHash,
          mustChangePassword: forceChange
        }).where(eq2(users.id, userId)).returning();
        if (result.length > 0) {
          await this.createAuditLog({
            userId: resetBy,
            action: "admin_password_reset",
            entityType: "user",
            entityId: 0,
            oldValue: null,
            newValue: JSON.stringify({ targetUserId: userId, forceChange }),
            reason: "Admin initiated password reset",
            ipAddress: null,
            userAgent: null
          });
        }
        return result.length > 0;
      }
      async updateRecoveryEmail(userId, recoveryEmail, updatedBy) {
        const oldUser = await this.getUser(userId);
        const result = await this.db.update(users).set({ recoveryEmail }).where(eq2(users.id, userId)).returning();
        if (result.length > 0) {
          await this.createAuditLog({
            userId: updatedBy,
            action: "recovery_email_updated",
            entityType: "user",
            entityId: 0,
            oldValue: oldUser?.recoveryEmail || null,
            newValue: recoveryEmail,
            reason: "Recovery email updated by admin",
            ipAddress: null,
            userAgent: null
          });
        }
        return result.length > 0;
      }
      // NEW METHODS FOR EXAM PUBLISHING
      async getScheduledExamsToPublish(now) {
        const nowISO = now.toISOString();
        return await this.db.select().from(exams).where(
          and(
            eq2(exams.isPublished, false),
            dsql`${exams.startTime} <= ${nowISO}`,
            eq2(exams.timerMode, "global")
            // Only publish global timer exams automatically
          )
        ).limit(50);
      }
      // Settings management methods (Module 1)
      async getSetting(key) {
        const result = await this.db.select().from(settings).where(eq2(settings.key, key)).limit(1);
        return result[0];
      }
      async getAllSettings() {
        return await this.db.select().from(settings).orderBy(asc(settings.key));
      }
      async createSetting(setting) {
        const result = await this.db.insert(settings).values(setting).returning();
        return result[0];
      }
      async updateSetting(key, value, updatedBy) {
        const result = await this.db.update(settings).set({ value, updatedBy, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(settings.key, key)).returning();
        return result[0];
      }
      async deleteSetting(key) {
        const result = await this.db.delete(settings).where(eq2(settings.key, key)).returning();
        return result.length > 0;
      }
      // Counters for atomic sequence generation (Module 1)
      async getNextSequence(classCode, year) {
        const result = await this.db.insert(counters).values({
          classCode,
          year,
          sequence: 1
        }).onConflictDoUpdate({
          target: [counters.classCode, counters.year],
          set: {
            sequence: dsql`${counters.sequence} + 1`,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return result[0].sequence;
      }
      async getCounter(classCode, year) {
        const result = await this.db.select().from(counters).where(
          and(
            eq2(counters.classCode, classCode),
            eq2(counters.year, year)
          )
        ).limit(1);
        return result[0];
      }
      async resetCounter(classCode, year) {
        const result = await this.db.update(counters).set({ sequence: 0, updatedAt: /* @__PURE__ */ new Date() }).where(
          and(
            eq2(counters.classCode, classCode),
            eq2(counters.year, year)
          )
        ).returning();
        return result.length > 0;
      }
      // Job Vacancy System implementations
      async createVacancy(vacancy) {
        const result = await this.db.insert(vacancies).values(vacancy).returning();
        return result[0];
      }
      async getVacancy(id) {
        const result = await this.db.select().from(vacancies).where(eq2(vacancies.id, id)).limit(1);
        return result[0];
      }
      async getAllVacancies(status) {
        if (status) {
          return await this.db.select().from(vacancies).where(eq2(vacancies.status, status)).orderBy(desc(vacancies.createdAt));
        }
        return await this.db.select().from(vacancies).orderBy(desc(vacancies.createdAt));
      }
      async updateVacancy(id, updates) {
        const result = await this.db.update(vacancies).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(vacancies.id, id)).returning();
        return result[0];
      }
      async deleteVacancy(id) {
        const result = await this.db.delete(vacancies).where(eq2(vacancies.id, id)).returning();
        return result.length > 0;
      }
      // Teacher Applications implementations
      async createTeacherApplication(application) {
        const result = await this.db.insert(teacherApplications).values(application).returning();
        return result[0];
      }
      async getTeacherApplication(id) {
        const result = await this.db.select().from(teacherApplications).where(eq2(teacherApplications.id, id)).limit(1);
        return result[0];
      }
      async getAllTeacherApplications(status) {
        if (status) {
          return await this.db.select().from(teacherApplications).where(eq2(teacherApplications.status, status)).orderBy(desc(teacherApplications.dateApplied));
        }
        return await this.db.select().from(teacherApplications).orderBy(desc(teacherApplications.dateApplied));
      }
      async updateTeacherApplication(id, updates) {
        const result = await this.db.update(teacherApplications).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(teacherApplications.id, id)).returning();
        return result[0];
      }
      async approveTeacherApplication(applicationId, approvedBy) {
        const application = await this.getTeacherApplication(applicationId);
        if (!application) {
          throw new Error("Application not found");
        }
        const updatedApplication = await this.db.update(teacherApplications).set({
          status: "approved",
          reviewedBy: approvedBy,
          reviewedAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(teacherApplications.id, applicationId)).returning();
        const approvedTeacher = await this.db.insert(approvedTeachers).values({
          applicationId,
          googleEmail: application.googleEmail,
          fullName: application.fullName,
          subjectSpecialty: application.subjectSpecialty,
          approvedBy
        }).returning();
        return {
          application: updatedApplication[0],
          approvedTeacher: approvedTeacher[0]
        };
      }
      async rejectTeacherApplication(applicationId, reviewedBy, reason) {
        const result = await this.db.update(teacherApplications).set({
          status: "rejected",
          reviewedBy,
          reviewedAt: /* @__PURE__ */ new Date(),
          rejectionReason: reason,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq2(teacherApplications.id, applicationId)).returning();
        return result[0];
      }
      // Approved Teachers implementations
      async getApprovedTeacherByEmail(email) {
        const result = await this.db.select().from(approvedTeachers).where(eq2(approvedTeachers.googleEmail, email)).limit(1);
        return result[0];
      }
      async getAllApprovedTeachers() {
        return await this.db.select().from(approvedTeachers).orderBy(desc(approvedTeachers.dateApproved));
      }
      async deleteApprovedTeacher(id) {
        const result = await this.db.delete(approvedTeachers).where(eq2(approvedTeachers.id, id)).returning();
        return result.length > 0;
      }
    };
    storage = initializeStorageSync();
  }
});

// server/auth-utils.ts
var auth_utils_exports = {};
__export(auth_utils_exports, {
  generatePassword: () => generatePassword,
  generateStudentPassword: () => generateStudentPassword,
  generateStudentUsername: () => generateStudentUsername,
  generateUsername: () => generateUsername,
  getNextUserNumber: () => getNextUserNumber,
  getRoleIdFromCode: () => getRoleIdFromCode,
  isValidThsUsername: () => isValidThsUsername,
  parseUsername: () => parseUsername
});
import crypto from "crypto";
function generateRandomString(length) {
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
function generateStudentUsername(className, currentYear, nextNumber) {
  const classCode = className.replace(/\s+/g, "").toUpperCase().slice(0, 4);
  return `THS-STU-${currentYear}-${classCode}-${nextNumber.toString().padStart(3, "0")}`;
}
function generateStudentPassword(currentYear) {
  const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `THS@${currentYear}#${randomHex}`;
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

// server/email-service.ts
var email_service_exports = {};
__export(email_service_exports, {
  getPasswordChangedEmailHTML: () => getPasswordChangedEmailHTML,
  getPasswordResetEmailHTML: () => getPasswordResetEmailHTML,
  sendEmail: () => sendEmail
});
import { Resend } from "resend";
async function sendEmail({ to, subject, html }) {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.log("\n\u{1F4E7} EMAIL (Development Mode - No API Key):");
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Body: ${html}
`);
      return true;
    }
    const { data, error } = await resend.emails.send({
      from: "THS Portal <noreply@your-domain.com>",
      // Change this to your verified domain
      to: [to],
      subject,
      html
    });
    if (error) {
      console.error("\u274C Email sending failed:", error);
      return false;
    }
    console.log("\u2705 Email sent successfully:", data?.id);
    return true;
  } catch (error) {
    console.error("\u274C Email service error:", error);
    return false;
  }
}
function getPasswordResetEmailHTML(userName, resetLink, resetCode) {
  const token = resetCode || resetLink.split("token=")[1] || "";
  const shortCode = token.substring(0, 8).toUpperCase();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #1f2937; 
      background: #f3f4f6;
      padding: 20px;
    }
    .email-wrapper { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { 
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      color: white; 
      padding: 40px 30px; 
      text-align: center; 
    }
    .header h1 { font-size: 28px; margin-bottom: 8px; font-weight: 700; }
    .header p { font-size: 14px; opacity: 0.9; }
    .content { padding: 40px 30px; background: white; }
    .greeting { font-size: 18px; font-weight: 600; margin-bottom: 16px; color: #111827; }
    .message { color: #4b5563; margin-bottom: 24px; font-size: 15px; }
    .code-section { 
      background: #eff6ff; 
      border: 2px dashed #3b82f6; 
      padding: 24px; 
      text-align: center; 
      border-radius: 8px; 
      margin: 24px 0; 
    }
    .code-label { color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .code { 
      font-size: 32px; 
      font-weight: 700; 
      color: #1e40af; 
      letter-spacing: 4px; 
      font-family: 'Courier New', Courier, monospace;
      background: white;
      padding: 12px 20px;
      border-radius: 6px;
      display: inline-block;
    }
    .button-container { text-align: center; margin: 32px 0; }
    .button { 
      display: inline-block; 
      background: #1e40af; 
      color: white !important; 
      padding: 14px 36px; 
      text-decoration: none; 
      border-radius: 8px; 
      font-weight: 600;
      font-size: 15px;
      transition: background 0.3s ease;
    }
    .button:hover { background: #1e3a8a; }
    .alt-link { 
      margin-top: 20px; 
      padding: 16px; 
      background: #f9fafb; 
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .alt-link-label { font-size: 13px; color: #6b7280; margin-bottom: 8px; font-weight: 500; }
    .alt-link-url { 
      word-break: break-all; 
      color: #3b82f6; 
      font-size: 12px;
      font-family: monospace;
    }
    .warning { 
      background: #fef3c7; 
      border-left: 4px solid #f59e0b; 
      padding: 16px; 
      margin: 24px 0;
      border-radius: 4px;
    }
    .warning-title { color: #92400e; font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .warning-text { color: #78350f; font-size: 14px; }
    .info-box { 
      background: #f0f9ff; 
      border: 1px solid #bfdbfe; 
      padding: 16px; 
      border-radius: 6px; 
      margin: 24px 0;
    }
    .info-title { color: #1e40af; font-weight: 600; margin-bottom: 12px; font-size: 15px; }
    .info-list { padding-left: 20px; color: #1e3a8a; }
    .info-list li { margin-bottom: 8px; font-size: 14px; }
    .footer { 
      background: #f9fafb; 
      padding: 24px 30px; 
      text-align: center; 
      border-top: 1px solid #e5e7eb;
    }
    .footer-text { color: #6b7280; font-size: 13px; line-height: 1.8; }
    .footer-link { color: #3b82f6; text-decoration: none; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
    @media only screen and (max-width: 600px) {
      .content { padding: 24px 20px; }
      .code { font-size: 24px; letter-spacing: 2px; }
      .button { padding: 12px 24px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="header">
      <h1>\u{1F510} Password Reset</h1>
      <p>Treasure-Home School Portal</p>
    </div>
    
    <div class="content">
      <div class="greeting">Hello ${userName},</div>
      
      <p class="message">
        We received a request to reset your password for your THS Portal account. 
        Use the code or link below to create a new password.
      </p>
      
      <div class="code-section">
        <div class="code-label">Your Reset Code</div>
        <div class="code">${shortCode}</div>
        <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Valid for 15 minutes</p>
      </div>
      
      <div class="button-container">
        <a href="${resetLink}" class="button">Reset Your Password</a>
      </div>
      
      <div class="alt-link">
        <div class="alt-link-label">Or copy this link:</div>
        <div class="alt-link-url">${resetLink}</div>
      </div>
      
      <div class="warning">
        <div class="warning-title">
          <span>\u23F0</span>
          <span>Time-Sensitive Request</span>
        </div>
        <div class="warning-text">
          This reset link expires in 15 minutes for your security. 
          If it expires, you'll need to request a new one.
        </div>
      </div>
      
      <div class="divider"></div>
      
      <div class="info-box">
        <div class="info-title">\u{1F512} Security Tips</div>
        <ul class="info-list">
          <li>Never share your password or reset code with anyone</li>
          <li>Create a strong password with uppercase, lowercase, numbers, and symbols</li>
          <li>Avoid using personal information in your password</li>
          <li>Don't reuse passwords from other accounts</li>
        </ul>
      </div>
      
      <p class="message" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        If you didn't request this password reset, please ignore this email. 
        Your account remains secure and no changes were made.
      </p>
      
      <p class="message" style="font-size: 14px; color: #6b7280;">
        Need help? Contact our administrator at 
        <a href="mailto:treasurehomeschool@gmail.com" style="color: #3b82f6;">treasurehomeschool@gmail.com</a>
      </p>
    </div>
    
    <div class="footer">
      <div class="footer-text">
        <strong>Treasure-Home School</strong><br>
        "Honesty and Success"<br>
        Seriki-Soyinka Ifo, Ogun State, Nigeria<br>
        <a href="mailto:treasurehomeschool@gmail.com" class="footer-link">treasurehomeschool@gmail.com</a>
      </div>
      <div style="margin-top: 12px; color: #9ca3af; font-size: 12px;">
        \xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Treasure-Home School. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
function getPasswordChangedEmailHTML(userName, ipAddress) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
    .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Password Changed</h1>
    </div>
    <div class="content">
      <h2>Password Successfully Changed</h2>
      <p>Hello ${userName},</p>
      <p>Your password was successfully changed on THS Portal.</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li>Changed at: ${(/* @__PURE__ */ new Date()).toLocaleString()}</li>
        <li>IP Address: ${ipAddress}</li>
      </ul>
      <div class="alert">
        <strong>\u26A0\uFE0F Didn't make this change?</strong><br>
        If you didn't change your password, contact the school administration immediately:<br>
        Email: admin@treasurehomeschool.edu.ng
      </div>
    </div>
    <div class="footer">
      <p>\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} Treasure-Home School</p>
    </div>
  </div>
</body>
</html>
  `;
}
var resend;
var init_email_service = __esm({
  "server/email-service.ts"() {
    "use strict";
    resend = new Resend(process.env.RESEND_API_KEY);
  }
});

// server/username-generator.ts
import { sql as sql3 } from "drizzle-orm";
async function generateStudentUsername2(classCode, year) {
  const yearStr = year.toString();
  const result = await exportDb.insert(counters).values({
    classCode,
    year: yearStr,
    sequence: 1
  }).onConflictDoUpdate({
    target: [counters.classCode, counters.year],
    set: {
      sequence: sql3`${counters.sequence} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }
  }).returning();
  const sequence = result[0].sequence;
  return `THS-STU-${yearStr}-${classCode.toUpperCase()}-${String(sequence).padStart(3, "0")}`;
}
async function generateParentUsername(year) {
  const yearStr = year.toString();
  const classCode = "PARENT";
  const result = await exportDb.insert(counters).values({
    classCode,
    year: yearStr,
    sequence: 1
  }).onConflictDoUpdate({
    target: [counters.classCode, counters.year],
    set: {
      sequence: sql3`${counters.sequence} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }
  }).returning();
  const sequence = result[0].sequence;
  return `THS-PAR-${yearStr}-${String(sequence).padStart(3, "0")}`;
}
function generateTempPassword(year) {
  const random4 = Math.floor(1e3 + Math.random() * 9e3);
  return `THS@${year}#${random4}`;
}
var init_username_generator = __esm({
  "server/username-generator.ts"() {
    "use strict";
    init_storage();
    init_schema();
  }
});

// server/csv-import-service.ts
var csv_import_service_exports = {};
__export(csv_import_service_exports, {
  commitCSVImport: () => commitCSVImport,
  previewCSVImport: () => previewCSVImport
});
import { parse } from "csv-parse/sync";
import { eq as eq4, and as and3 } from "drizzle-orm";
import bcrypt from "bcrypt";
async function previewCSVImport(csvContent) {
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });
  const validResults = [];
  const invalidResults = [];
  let newParentCount = 0;
  let existingParentCount = 0;
  const classes2 = await exportDb.select().from(classes);
  const validClassCodes = classes2.map((c) => c.name);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors = [];
    const warnings = [];
    if (!row.fullName || row.fullName.trim() === "") {
      errors.push("Full name is required");
    }
    if (!row.classCode || row.classCode.trim() === "") {
      errors.push("Class code is required");
    } else if (!validClassCodes.includes(row.classCode)) {
      errors.push(`Invalid class code: ${row.classCode}. Valid codes: ${validClassCodes.join(", ")}`);
    }
    if (!row.dob) {
      errors.push("Date of birth is required");
    } else if (isNaN(Date.parse(row.dob))) {
      errors.push("Invalid date of birth format (use YYYY-MM-DD)");
    }
    if (!row.gender || !["Male", "Female", "Other"].includes(row.gender)) {
      errors.push("Gender must be Male, Female, or Other");
    }
    let parentExists = false;
    if (row.parentPhone) {
      const existingParent = await exportDb.select().from(users).where(and3(
        eq4(users.phone, row.parentPhone),
        eq4(users.roleId, 4)
        // Parent role
      )).limit(1);
      parentExists = existingParent.length > 0;
      if (parentExists) {
        existingParentCount++;
      } else {
        newParentCount++;
      }
    } else {
      warnings.push("No parent phone provided - student will have no parent link");
    }
    const result = {
      row: i + 1,
      data: {
        fullName: row.fullName,
        classCode: row.classCode,
        dob: row.dob,
        gender: row.gender,
        parentEmail: row.parentEmail,
        parentPhone: row.parentPhone,
        admissionNo: row.admissionNo
      },
      parentExists,
      errors,
      warnings
    };
    if (errors.length === 0) {
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      const classInfo = classes2.find((c) => c.name === row.classCode);
      result.username = `THS-STU-${year}-${classInfo?.id || "X"}-XXX`;
      validResults.push(result);
    } else {
      invalidResults.push(result);
    }
  }
  return {
    valid: validResults,
    invalid: invalidResults,
    summary: {
      total: rows.length,
      validCount: validResults.length,
      invalidCount: invalidResults.length,
      newParents: newParentCount,
      existingParents: existingParentCount
    }
  };
}
async function commitCSVImport(validRows, adminUserId) {
  const credentials = [];
  const failedRows = [];
  let successCount = 0;
  const classes2 = await exportDb.select().from(classes);
  for (const item of validRows) {
    try {
      await exportDb.transaction(async (tx) => {
        const year = (/* @__PURE__ */ new Date()).getFullYear();
        const classInfo = classes2.find((c) => c.name === item.data.classCode);
        if (!classInfo) {
          throw new Error(`Class not found: ${item.data.classCode}`);
        }
        const nameParts = item.data.fullName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];
        const studentUsername = await generateStudentUsername2(item.data.classCode, year);
        const studentPassword = generateTempPassword(year);
        const passwordHash = await bcrypt.hash(studentPassword, 10);
        const [studentUser] = await tx.insert(users).values({
          username: studentUsername,
          email: `${studentUsername}@ths.edu`,
          // Auto-generate email
          passwordHash,
          roleId: 3,
          // Student
          firstName,
          lastName,
          gender: item.data.gender,
          dateOfBirth: item.data.dob,
          isActive: true,
          status: "active",
          createdVia: "bulk",
          createdBy: adminUserId,
          mustChangePassword: true
        }).returning();
        const admissionNumber = item.data.admissionNo || `THS/${year}/${String(successCount + 1).padStart(4, "0")}`;
        await tx.insert(students).values({
          id: studentUser.id,
          admissionNumber,
          classId: classInfo.id,
          admissionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          emergencyContact: item.data.parentPhone || null
        });
        let parentUserId = null;
        let parentCredentials = null;
        if (item.data.parentPhone) {
          if (item.parentExists) {
            const [existingParent] = await tx.select().from(users).where(and3(
              eq4(users.phone, item.data.parentPhone),
              eq4(users.roleId, 4)
            )).limit(1);
            if (existingParent) {
              parentUserId = existingParent.id;
              await tx.update(students).set({ parentId: parentUserId }).where(eq4(students.id, studentUser.id));
            }
          } else {
            const parentUsername = await generateParentUsername(year);
            const parentPassword = generateTempPassword(year);
            const parentHash = await bcrypt.hash(parentPassword, 10);
            const [parentUser] = await tx.insert(users).values({
              username: parentUsername,
              email: item.data.parentEmail || `${parentUsername}@ths.edu`,
              passwordHash: parentHash,
              roleId: 4,
              // Parent
              firstName: `Parent of ${firstName}`,
              lastName,
              phone: item.data.parentPhone,
              isActive: true,
              status: "active",
              createdVia: "bulk",
              createdBy: adminUserId,
              mustChangePassword: true
            }).returning();
            parentUserId = parentUser.id;
            await tx.update(students).set({ parentId: parentUserId }).where(eq4(students.id, studentUser.id));
            parentCredentials = {
              username: parentUsername,
              password: parentPassword
            };
          }
        }
        credentials.push({
          row: item.row,
          student: {
            id: studentUser.id,
            name: item.data.fullName,
            username: studentUsername,
            password: studentPassword,
            classCode: item.data.classCode
          },
          parent: parentCredentials
        });
        successCount++;
      });
    } catch (error) {
      console.error(`Failed to import row ${item.row}:`, error);
      failedRows.push(item.row);
    }
  }
  return { successCount, failedRows, credentials };
}
var init_csv_import_service = __esm({
  "server/csv-import-service.ts"() {
    "use strict";
    init_storage();
    init_schema();
    init_schema();
    init_username_generator();
  }
});

// server/registration-utils.ts
var registration_utils_exports = {};
__export(registration_utils_exports, {
  checkParentExists: () => checkParentExists,
  generateParentUsername: () => generateParentUsername2,
  generateStudentUsername: () => generateStudentUsername3,
  generateTempPassword: () => generateTempPassword2,
  validateRegistrationData: () => validateRegistrationData
});
import crypto2 from "crypto";
async function generateStudentUsername3(classCode) {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const sequence = await storage.getNextSequence(classCode, year.toString());
  const paddedSequence = sequence.toString().padStart(3, "0");
  return `THS-STU-${year}-${classCode}-${paddedSequence}`;
}
function generateParentUsername2() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const randomPart = crypto2.randomBytes(2).toString("hex").toUpperCase();
  return `THS-PAR-${year}-${randomPart}`;
}
function generateTempPassword2() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const randomPart = crypto2.randomBytes(2).toString("hex").toUpperCase();
  return `THS@${year}#${randomPart}`;
}
function validateRegistrationData(data) {
  const errors = [];
  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push("Full name must be at least 2 characters");
  }
  if (!data.classCode || data.classCode.trim().length === 0) {
    errors.push("Class code is required");
  }
  if (!data.gender || !["Male", "Female", "Other"].includes(data.gender)) {
    errors.push("Valid gender is required");
  }
  if (!data.dateOfBirth) {
    errors.push("Date of birth is required");
  } else {
    const dob = new Date(data.dateOfBirth);
    const age = ((/* @__PURE__ */ new Date()).getTime() - dob.getTime()) / (1e3 * 60 * 60 * 24 * 365);
    if (age < 2 || age > 25) {
      errors.push("Student age must be between 2 and 25 years");
    }
  }
  if (!data.parentEmail && !data.parentPhone) {
    errors.push("At least one parent contact (email or phone) is required");
  }
  if (data.parentEmail && !isValidEmail(data.parentEmail)) {
    errors.push("Parent email is invalid");
  }
  if (data.parentPhone && !isValidPhone(data.parentPhone)) {
    errors.push("Parent phone number is invalid");
  }
  return errors;
}
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}
async function checkParentExists(email) {
  if (!email) {
    return { exists: false };
  }
  const parentRole = await storage.getRoleByName("parent");
  if (!parentRole) {
    return { exists: false };
  }
  const users3 = await storage.getAllUsers();
  const parent = users3.find((u) => u.email === email && u.roleId === parentRole.id);
  if (parent) {
    return { exists: true, userId: parent.id };
  }
  return { exists: false };
}
var init_registration_utils = __esm({
  "server/registration-utils.ts"() {
    "use strict";
    init_storage();
  }
});

// server/email-notifications.ts
var email_notifications_exports = {};
__export(email_notifications_exports, {
  sendParentNotificationEmail: () => sendParentNotificationEmail,
  sendParentNotificationSMS: () => sendParentNotificationSMS
});
async function sendParentNotificationEmail(data) {
  console.log("\n\u{1F4E7} ========== PARENT NOTIFICATION EMAIL ==========");
  console.log(`\u{1F4EC} To: ${data.parentEmail}`);
  console.log(`\u{1F4CB} Subject: THS Portal \u2014 Parent Account Created for ${data.studentName}`);
  console.log("\n\u{1F4DD} Email Body:");
  console.log(`
Dear Parent/Guardian,

A student account has been successfully created for ${data.studentName} at Treasure-Home School.

Your parent portal account has been created with the following credentials:

Username: ${data.parentUsername}
Temporary Password: ${data.parentPassword}

IMPORTANT SECURITY NOTICE:
- This is a one-time password. Please change it immediately upon first login.
- Keep your credentials secure and do not share them with anyone.

To access the parent portal:
1. Visit: ${process.env.REPLIT_DOMAINS?.split(",")[0] || "https://your-school-portal.com"}
2. Click on "Portal Login"
3. Enter your username and temporary password
4. You will be prompted to change your password

Your student's username is: ${data.studentUsername}

If you have any questions or need assistance, please contact the school administration.

Best regards,
Treasure-Home School Administration

---
This is an automated message. Please do not reply to this email.
  `);
  console.log("==================================================\n");
}
async function sendParentNotificationSMS(phone, username, password) {
  console.log("\n\u{1F4F1} ========== PARENT NOTIFICATION SMS ==========");
  console.log(`\u{1F4DE} To: ${phone}`);
  console.log(`\u{1F4DD} Message: Your THS parent account: Username: ${username}, Password: ${password}. Change password on first login.`);
  console.log("==================================================\n");
}
var init_email_notifications = __esm({
  "server/email-notifications.ts"() {
    "use strict";
  }
});

// server/index.ts
import express2 from "express";
import compression from "compression";
import cors from "cors";

// server/routes.ts
init_storage();
init_schema();
init_auth_utils();
import { createServer } from "http";
import { z as z2, ZodError } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt2 from "bcrypt";
import PDFDocument from "pdfkit";
import passport2 from "passport";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// server/google-auth.ts
init_storage();
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
var GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var REPLIT_DEV_DOMAIN = process.env.REPLIT_DEV_DOMAIN;
var BACKEND_URL = process.env.BACKEND_URL;
var BASE_URL = REPLIT_DEV_DOMAIN ? `https://${REPLIT_DEV_DOMAIN}` : BACKEND_URL || "http://localhost:5000";
var GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || `${BASE_URL}/api/auth/google/callback`;
console.log("\u{1F510} Google OAuth Callback URL:", GOOGLE_CALLBACK_URL);
console.log("\u{1F310} Environment:", REPLIT_DEV_DOMAIN ? "Replit Development" : BACKEND_URL ? "Production" : "Local Development");
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
          let user = await storage.getUserByGoogleId(googleId);
          if (!user) {
            user = await storage.getUserByEmail(email);
          }
          if (user) {
            const role = await storage.getRole(user.roleId);
            const roleName = role?.name?.toLowerCase();
            if (roleName === "teacher" || roleName === "admin") {
              if (roleName === "teacher") {
                const approvedTeacher = await storage.getApprovedTeacherByEmail(email);
                if (!approvedTeacher) {
                  return done(null, false, {
                    message: "Access denied: Only pre-approved teachers can use Google Sign-In. Please apply through the Job Vacancy page first."
                  });
                }
              }
              if (user.status === "active") {
                if (!user.googleId) {
                  await storage.updateUserGoogleId(user.id, googleId);
                  user.googleId = googleId;
                }
                return done(null, user);
              } else if (user.status === "pending") {
                return done(null, false, {
                  message: "Your account is awaiting Admin approval. You will be notified once verified."
                });
              } else if (user.status === "suspended" || user.status === "disabled") {
                return done(null, false, {
                  message: "Access denied: Your account has been suspended by THS Admin."
                });
              }
            }
            if (roleName === "student" || roleName === "parent") {
              return done(null, false, {
                message: "Students and parents must use THS username and password to login. Contact your teacher if you forgot your credentials."
              });
            }
            if (user.authProvider === "local") {
              return done(null, false, {
                message: "This email is registered with a password. Please use password login instead."
              });
            }
          }
          return done(null, {
            googleId,
            email,
            firstName,
            lastName,
            profileImageUrl,
            isNewUser: true,
            requiresApproval: true
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
import { sql as sql4 } from "drizzle-orm";

// server/supabase-storage.ts
import { createClient } from "@supabase/supabase-js";
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
  } catch {
    return false;
  }
}
var supabase = null;
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("\u26A0\uFE0F Supabase Storage not configured: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
} else if (!isValidUrl(supabaseUrl)) {
  console.warn(`\u26A0\uFE0F Supabase Storage not configured: Invalid SUPABASE_URL format: ${supabaseUrl}`);
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("\u2705 Supabase Storage client initialized");
  } catch (error) {
    console.error("\u274C Failed to initialize Supabase Storage client:", error);
    supabase = null;
  }
}
var STORAGE_BUCKETS = {
  HOMEPAGE: "homepage-images",
  GALLERY: "gallery-images",
  PROFILES: "profile-images",
  STUDY_RESOURCES: "study-resources",
  GENERAL: "general-uploads"
};
async function initializeStorageBuckets() {
  if (!supabase) {
    console.log("\u{1F4E6} Supabase Storage: Not configured, using local filesystem");
    return false;
  }
  try {
    console.log("\u{1F4E6} Initializing Supabase Storage buckets...");
    const bucketsToCreate = Object.values(STORAGE_BUCKETS);
    for (const bucketName of bucketsToCreate) {
      const { data: existingBucket } = await supabase.storage.getBucket(bucketName);
      if (!existingBucket) {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760,
          // 10MB
          allowedMimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"]
        });
        if (error) {
          if (error.message.includes("already exists")) {
            console.log(`  \u2705 Bucket "${bucketName}" already exists`);
          } else {
            console.error(`  \u274C Failed to create bucket "${bucketName}":`, error.message);
          }
        } else {
          console.log(`  \u2705 Created bucket: ${bucketName}`);
        }
      } else {
        console.log(`  \u2705 Bucket "${bucketName}" already exists`);
      }
    }
    console.log("\u2705 Supabase Storage initialization complete");
    return true;
  } catch (error) {
    console.error("\u274C Supabase Storage initialization failed:", error);
    return false;
  }
}
async function uploadFileToSupabase(bucket, filePath, fileBuffer, contentType) {
  if (!supabase) {
    throw new Error("Supabase Storage not configured");
  }
  try {
    const { data, error } = await supabase.storage.from(bucket).upload(filePath, fileBuffer, {
      contentType,
      upsert: true
    });
    if (error) {
      console.error("Supabase upload error:", error);
      throw error;
    }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return {
      publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error("Failed to upload to Supabase:", error);
    return null;
  }
}
async function deleteFileFromSupabase(bucket, filePath) {
  if (!supabase) {
    throw new Error("Supabase Storage not configured");
  }
  try {
    const { error } = await supabase.storage.from(bucket).remove([filePath]);
    if (error) {
      console.error("Supabase delete error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to delete from Supabase:", error);
    return false;
  }
}
function extractFilePathFromUrl(url) {
  if (!url) return null;
  const supabaseMatch = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
  if (supabaseMatch) {
    return supabaseMatch[1];
  }
  const localMatch = url.match(/\/uploads\/(.+)$/);
  if (localMatch) {
    return localMatch[1];
  }
  return null;
}
var isSupabaseStorageEnabled = !!supabase;

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
var JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-key-change-in-production" : void 0);
if (!JWT_SECRET) {
  console.error("CRITICAL: JWT_SECRET environment variable is required but not set!");
  console.error("Please set a secure JWT_SECRET environment variable before starting the server.");
  process.exit(1);
}
if (process.env.NODE_ENV === "development" && JWT_SECRET === "dev-secret-key-change-in-production") {
  console.warn("\u26A0\uFE0F WARNING: Using default JWT_SECRET for development. Set JWT_SECRET environment variable for production!");
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
var lockoutViolations = /* @__PURE__ */ new Map();
var MAX_LOGIN_ATTEMPTS = 5;
var RATE_LIMIT_WINDOW = 15 * 60 * 1e3;
var LOCKOUT_VIOLATION_WINDOW = 60 * 60 * 1e3;
var MAX_RATE_LIMIT_VIOLATIONS = 3;
var BCRYPT_ROUNDS = 12;
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of Array.from(loginAttempts.entries())) {
    if (now - data.lastAttempt > RATE_LIMIT_WINDOW) {
      loginAttempts.delete(key);
    }
  }
  for (const [identifier, data] of Array.from(lockoutViolations.entries())) {
    const recentViolations = data.timestamps.filter((ts) => now - ts < LOCKOUT_VIOLATION_WINDOW);
    if (recentViolations.length === 0) {
      lockoutViolations.delete(identifier);
    } else if (recentViolations.length !== data.timestamps.length) {
      lockoutViolations.set(identifier, { count: recentViolations.length, timestamps: recentViolations });
    }
  }
}, 5 * 60 * 1e3);
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
var homepageDir = "uploads/homepage";
fs.mkdir(uploadDir, { recursive: true }).catch(() => {
});
fs.mkdir(galleryDir, { recursive: true }).catch(() => {
});
fs.mkdir(profileDir, { recursive: true }).catch(() => {
});
fs.mkdir(studyResourcesDir, { recursive: true }).catch(() => {
});
fs.mkdir(homepageDir, { recursive: true }).catch(() => {
});
var storage_multer = isSupabaseStorageEnabled ? multer.memoryStorage() : multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.body.uploadType || "general";
    let dir = uploadDir;
    if (uploadType === "gallery") {
      dir = galleryDir;
    } else if (uploadType === "profile") {
      dir = profileDir;
    } else if (uploadType === "study-resource") {
      dir = studyResourcesDir;
    } else if (uploadType === "homepage") {
      dir = homepageDir;
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
async function autoPublishScheduledExams() {
  try {
    console.log("\u{1F4C5} AUTO-PUBLISH: Checking for scheduled exams...");
    const now = /* @__PURE__ */ new Date();
    const scheduledExams = await storage.getScheduledExamsToPublish(now);
    if (scheduledExams.length > 0) {
      console.log(`\u{1F4C5} Found ${scheduledExams.length} exams ready to publish`);
      for (const exam of scheduledExams) {
        try {
          console.log(`\u{1F680} AUTO-PUBLISH: Publishing exam ${exam.id} - ${exam.name}`);
          await storage.updateExam(exam.id, {
            isPublished: true
          });
          console.log(`\u2705 Successfully published exam ${exam.id}`);
        } catch (error) {
          console.error(`\u274C Failed to auto-publish exam ${exam.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error("\u274C Auto-publish service error:", error);
  }
}
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
var autoPublishInterval = 60 * 1e3;
setInterval(autoPublishScheduledExams, autoPublishInterval);
autoPublishScheduledExams();
console.log("\u{1F4C5} AUTO-PUBLISH: Background service started (runs every 1 minute)");
var cleanupInterval = 3 * 60 * 1e3;
var jitter = Math.random() * 3e4;
setTimeout(() => {
  setInterval(cleanupExpiredExamSessions, cleanupInterval);
  cleanupExpiredExamSessions();
}, jitter);
console.log(`\u{1F9F9} TIMEOUT PROTECTION: Background cleanup service started (every ${cleanupInterval / 1e3 / 60} minutes with jitter)`);
async function scoreTheoryAnswer(studentAnswer, expectedAnswers, sampleAnswer, points) {
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      score: 0,
      confidence: 1,
      feedback: "No answer provided.",
      autoScored: true
    };
  }
  const studentText = studentAnswer.toLowerCase().trim();
  let keywordScore = 0;
  const matchedKeywords = [];
  const missedKeywords = [];
  if (expectedAnswers && expectedAnswers.length > 0) {
    expectedAnswers.forEach((keyword) => {
      const keywordLower = keyword.toLowerCase().trim();
      if (studentText.includes(keywordLower)) {
        matchedKeywords.push(keyword);
      } else {
        missedKeywords.push(keyword);
      }
    });
    keywordScore = matchedKeywords.length / expectedAnswers.length;
  }
  let semanticScore = 0;
  if (sampleAnswer && sampleAnswer.trim().length > 0) {
    const sampleWords = sampleAnswer.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const studentWords = studentText.split(/\s+/).filter((w) => w.length > 3);
    const commonWords = studentWords.filter((word) => sampleWords.includes(word));
    semanticScore = sampleWords.length > 0 ? commonWords.length / sampleWords.length : 0;
  } else {
    semanticScore = keywordScore;
  }
  const hybridScore = keywordScore * 0.6 + semanticScore * 0.4;
  const calculatedPoints = Math.round(hybridScore * points * 100) / 100;
  const confidence = Math.min(
    keywordScore > 0.8 ? 0.9 : keywordScore > 0.5 ? 0.7 : 0.5,
    1
  );
  let feedback = "";
  if (hybridScore >= 0.8) {
    feedback = `Excellent answer! Key points identified: ${matchedKeywords.join(", ")}. `;
  } else if (hybridScore >= 0.5) {
    feedback = `Good effort. You covered: ${matchedKeywords.join(", ")}. `;
    if (missedKeywords.length > 0) {
      feedback += `Consider including: ${missedKeywords.slice(0, 3).join(", ")}. `;
    }
  } else {
    feedback = `Needs improvement. `;
    if (missedKeywords.length > 0) {
      feedback += `Missing key points: ${missedKeywords.slice(0, 3).join(", ")}. `;
    }
  }
  const shouldAutoScore = confidence >= 0.7 && hybridScore >= 0.3;
  if (!shouldAutoScore) {
    feedback += "This answer has been flagged for teacher review.";
  }
  return {
    score: shouldAutoScore ? calculatedPoints : 0,
    confidence,
    feedback,
    autoScored: shouldAutoScore
  };
}
async function autoScoreExamSession(sessionId, storage2) {
  const startTime = Date.now();
  try {
    console.log(`\u{1F680} OPTIMIZED AUTO-SCORING: Starting session ${sessionId} scoring...`);
    const scoringResult = await storage2.getExamScoringData(sessionId);
    const { session: session2, summary, scoringData } = scoringResult;
    const databaseQueryTime = Date.now() - startTime;
    console.log(`\u26A1 PERFORMANCE: Database query completed in ${databaseQueryTime}ms (was 3000-8000ms before)`);
    const { totalQuestions, maxScore: maxPossibleScore, studentScore, autoScoredQuestions } = summary;
    const studentAnswers2 = await storage2.getStudentAnswers(sessionId);
    const examQuestions2 = await storage2.getExamQuestions(session2.examId);
    let totalAutoScore = studentScore;
    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;
    console.log(`\u2705 OPTIMIZED SCORING: Session ${sessionId} - ${totalQuestions} questions (${hasMultipleChoiceQuestions ? autoScoredQuestions + " MC" : "no MC"}, ${hasEssayQuestions ? totalQuestions - autoScoredQuestions + " Essays" : "no Essays"})`);
    const questionDetails = [];
    for (const q of scoringData) {
      const question = examQuestions2.find((eq6) => eq6.id === q.questionId);
      const studentAnswer = studentAnswers2.find((sa) => sa.questionId === q.questionId);
      let questionDetail = {
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
      if (q.questionType === "multiple_choice") {
        questionDetail.pointsEarned = q.isCorrect ? q.points : 0;
        questionDetail.isCorrect = q.isCorrect;
        questionDetail.autoScored = true;
        questionDetail.feedback = q.isCorrect ? `Correct! You earned ${q.points} point${q.points !== 1 ? "s" : ""}.` : `Incorrect. This question was worth ${q.points} point${q.points !== 1 ? "s" : ""}.`;
      } else if (q.questionType === "text" || q.questionType === "essay") {
        if (studentAnswer && studentAnswer.textAnswer && question) {
          const aiResult = await scoreTheoryAnswer(
            studentAnswer.textAnswer,
            question.expectedAnswers || [],
            question.sampleAnswer || null,
            q.points
          );
          questionDetail.pointsEarned = aiResult.score;
          questionDetail.autoScored = aiResult.autoScored;
          questionDetail.aiSuggested = !aiResult.autoScored;
          questionDetail.confidence = aiResult.confidence;
          questionDetail.feedback = aiResult.feedback;
          if (aiResult.autoScored) {
            totalAutoScore += aiResult.score;
            questionDetail.isCorrect = aiResult.score >= q.points * 0.5;
          }
        } else {
          questionDetail.feedback = "This question requires manual review by your instructor.";
          questionDetail.aiSuggested = true;
        }
      }
      questionDetails.push(questionDetail);
    }
    console.log("\u{1F4BE} Persisting scores to student_answers for score merging...");
    for (const detail of questionDetails) {
      if (detail.questionId) {
        const studentAnswer = studentAnswers2.find((sa) => sa.questionId === detail.questionId);
        if (studentAnswer) {
          try {
            await storage2.updateStudentAnswer(studentAnswer.id, {
              pointsEarned: detail.pointsEarned,
              isCorrect: detail.isCorrect,
              autoScored: detail.autoScored,
              feedbackText: detail.feedback
            });
            console.log(`\u2705 Updated answer ${studentAnswer.id} with ${detail.pointsEarned} points (auto: ${detail.autoScored})`);
          } catch (updateError) {
            console.error(`\u274C Failed to update answer ${studentAnswer.id}:`, updateError);
          }
        }
      }
    }
    const aiSuggestedCount = questionDetails.filter((q) => q.aiSuggested === true).length;
    const breakdown = {
      totalQuestions,
      autoScoredQuestions: questionDetails.filter((q) => q.autoScored === true).length,
      aiSuggestedQuestions: aiSuggestedCount,
      correctAnswers: questionDetails.filter((q) => q.isCorrect === true).length,
      incorrectAnswers: questionDetails.filter((q) => q.isCorrect === false).length,
      pendingManualReview: questionDetails.filter((q) => q.isCorrect === null || q.aiSuggested === true).length,
      maxScore: maxPossibleScore,
      earnedScore: totalAutoScore
    };
    if (process.env.NODE_ENV === "development") {
      console.log(`\u{1F4CA} DETAILED BREAKDOWN:`, breakdown);
      questionDetails.forEach((q, index2) => {
        console.log(`Question ${index2 + 1} (ID: ${q.questionId}): ${q.isCorrect !== null ? q.isCorrect ? "Correct!" : "Incorrect" : "Manual Review"} - ${q.pointsEarned}/${q.points}`);
      });
    }
    console.log(`\u{1F3AF} Preparing exam result for student ${session2.studentId}, exam ${session2.examId}`);
    console.log(`\u{1F4CA} Score calculation: ${totalAutoScore}/${maxPossibleScore} (${breakdown.correctAnswers} correct, ${breakdown.incorrectAnswers} incorrect, ${breakdown.pendingManualReview} pending manual review)`);
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
    let SYSTEM_AUTO_SCORING_UUID;
    try {
      const adminUsers = await storage2.getUsersByRole(ROLES.ADMIN);
      if (adminUsers && adminUsers.length > 0 && adminUsers[0].id) {
        SYSTEM_AUTO_SCORING_UUID = adminUsers[0].id;
        console.log(`\u2705 Using admin user ${SYSTEM_AUTO_SCORING_UUID} for auto-scoring recordedBy`);
      } else {
        console.log(`\u26A0\uFE0F No admin users found, verifying student ${session2.studentId} exists in users table...`);
        try {
          const studentUser = await storage2.getUser(session2.studentId);
          if (studentUser && studentUser.id) {
            SYSTEM_AUTO_SCORING_UUID = studentUser.id;
            console.log(`\u2705 Verified student ${SYSTEM_AUTO_SCORING_UUID} exists in users table, using for recordedBy`);
          } else {
            throw new Error(`Student ${session2.studentId} not found in users table`);
          }
        } catch (studentError) {
          console.error(`\u274C Student ${session2.studentId} not found in users table:`, studentError);
          console.log(`\u{1F504} Last resort: Finding any active user for recordedBy...`);
          const allUsers = await storage2.getAllUsers();
          const activeUser = allUsers.find((u) => u.isActive && u.id);
          if (activeUser && activeUser.id) {
            SYSTEM_AUTO_SCORING_UUID = activeUser.id;
            console.log(`\u2705 Using active user ${SYSTEM_AUTO_SCORING_UUID} as fallback for recordedBy`);
          } else {
            throw new Error("CRITICAL: No valid user ID found for auto-scoring recordedBy - cannot save exam result");
          }
        }
      }
    } catch (userError) {
      console.error("\u274C CRITICAL ERROR: Failed to find valid user for auto-scoring recordedBy:", userError);
      throw new Error(`Auto-scoring failed: Cannot find valid user ID for recordedBy. Error: ${userError instanceof Error ? userError.message : String(userError)}`);
    }
    if (!SYSTEM_AUTO_SCORING_UUID || typeof SYSTEM_AUTO_SCORING_UUID !== "string") {
      throw new Error(`CRITICAL: Invalid recordedBy UUID: ${SYSTEM_AUTO_SCORING_UUID}`);
    }
    console.log(`\u{1F4DD} Final recordedBy UUID: ${SYSTEM_AUTO_SCORING_UUID}`);
    const resultData = {
      examId: session2.examId,
      studentId: session2.studentId,
      score: totalAutoScore,
      maxScore: maxPossibleScore,
      marksObtained: totalAutoScore,
      // ✅ CRITICAL FIX: Ensure database constraint compatibility
      autoScored: breakdown.pendingManualReview === 0,
      // Only fully auto-scored if no pending reviews
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
        console.log(`\u2705 Updated exam result for student ${session2.studentId}: ${totalAutoScore}/${maxPossibleScore} (ID: ${existingResult.id})`);
        console.log(`\u{1F389} INSTANT FEEDBACK READY: Result updated successfully!`);
      } else {
        console.log("\u{1F195} Creating new exam result...");
        const newResult = await storage2.recordExamResult(resultData);
        if (!newResult || !newResult.id) {
          throw new Error("Failed to create exam result - recordExamResult returned null/undefined or missing ID");
        }
        console.log(`\u2705 Created new exam result for student ${session2.studentId}: ${totalAutoScore}/${maxPossibleScore} (ID: ${newResult.id})`);
        console.log(`\u{1F389} INSTANT FEEDBACK READY: New result created successfully!`);
      }
      console.log(`\u{1F50D} Verifying result was saved - fetching results for student ${session2.studentId}...`);
      const verificationResults = await storage2.getExamResultsByStudent(session2.studentId);
      console.log(`\u{1F50D} DEBUG: Found ${verificationResults.length} results. Looking for examId ${session2.examId} (type: ${typeof session2.examId})`);
      console.log(`\u{1F50D} DEBUG: Result examIds:`, verificationResults.map((r) => `${r.examId} (type: ${typeof r.examId})`));
      const savedResult = verificationResults.find((r) => Number(r.examId) === Number(session2.examId));
      if (!savedResult) {
        console.error(`\u274C VERIFICATION FAILED: Could not find result for examId ${session2.examId}`);
        console.error(`\u274C Available results:`, JSON.stringify(verificationResults, null, 2));
        throw new Error("CRITICAL: Result was not properly saved - verification fetch failed to find the result");
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
  app2.get("/api/grading/tasks/ai-suggested", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const status = req.query.status;
      const tasks = await storage.getAISuggestedGradingTasks(teacherId, status);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching AI-suggested tasks:", error);
      res.status(500).json({ message: "Failed to fetch AI-suggested tasks" });
    }
  });
  app2.get("/api/exams", authenticateUser, async (req, res) => {
    try {
      const exams2 = await storage.getAllExams();
      res.json(exams2);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });
  app2.post("/api/exams", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examData = insertExamSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      console.error("Error creating exam:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid exam data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create exam" });
    }
  });
  app2.get("/api/exams/:id", authenticateUser, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });
  app2.patch("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const exam = await storage.updateExam(examId, req.body);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error("Error updating exam:", error);
      res.status(500).json({ message: "Failed to update exam" });
    }
  });
  app2.delete("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const success = await storage.deleteExam(examId);
      if (!success) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });
  app2.patch("/api/exams/:id/publish", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const { isPublished } = req.body;
      const exam = await storage.updateExam(examId, { isPublished });
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error("Error updating exam publish status:", error);
      res.status(500).json({ message: "Failed to update exam publish status" });
    }
  });
  app2.post("/api/exams/:examId/submit", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const studentId = req.user.id;
      const startTime = Date.now();
      console.log(`\u{1F680} SUBMIT EXAM: Student ${studentId} submitting exam ${examId}`);
      const sessions = await storage.getExamSessionsByStudent(studentId);
      const activeSession = sessions.find((s) => s.examId === examId && !s.isCompleted);
      if (!activeSession) {
        return res.status(404).json({ message: "No active exam session found" });
      }
      if (activeSession.isCompleted) {
        return res.status(409).json({ message: "Exam already submitted" });
      }
      const now = /* @__PURE__ */ new Date();
      await storage.updateExamSession(activeSession.id, {
        isCompleted: true,
        submittedAt: now,
        status: "submitted"
      });
      console.log(`\u2705 SUBMIT: Session ${activeSession.id} marked as submitted`);
      const scoringStartTime = Date.now();
      await autoScoreExamSession(activeSession.id, storage);
      const scoringTime = Date.now() - scoringStartTime;
      console.log(`\u26A1 SCORING: Completed in ${scoringTime}ms`);
      const updatedSession = await storage.getExamSessionById(activeSession.id);
      const studentAnswers2 = await storage.getStudentAnswers(activeSession.id);
      const examQuestions2 = await storage.getExamQuestions(examId);
      const questionDetails = examQuestions2.map((q) => {
        const answer = studentAnswers2.find((a) => a.questionId === q.id);
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
      console.log(`\u{1F4CA} TOTAL SUBMISSION TIME: ${totalTime}ms`);
      res.json({
        submitted: true,
        result: {
          sessionId: activeSession.id,
          score: updatedSession?.score || 0,
          maxScore: updatedSession?.maxScore || 0,
          percentage: updatedSession?.maxScore ? (updatedSession?.score || 0) / updatedSession.maxScore * 100 : 0,
          submittedAt: now.toISOString(),
          questionDetails,
          breakdown: {
            totalQuestions: examQuestions2.length,
            answered: studentAnswers2.filter((a) => a.textAnswer || a.selectedOptionId).length,
            correct: studentAnswers2.filter((a) => a.isCorrect).length,
            autoScored: studentAnswers2.filter((a) => a.isCorrect !== null).length
          }
        },
        performance: {
          totalTime,
          scoringTime
        }
      });
    } catch (error) {
      console.error("\u274C SUBMIT ERROR:", error);
      res.status(500).json({ message: error.message || "Failed to submit exam" });
    }
  });
  app2.get("/api/exams/question-counts", authenticateUser, async (req, res) => {
    try {
      const examIdsParam = req.query.examIds;
      let examIds = [];
      if (typeof examIdsParam === "string") {
        examIds = [parseInt(examIdsParam)];
      } else if (Array.isArray(examIdsParam)) {
        examIds = examIdsParam.map((id) => parseInt(id));
      }
      const counts = {};
      for (const examId of examIds) {
        const questions = await storage.getExamQuestions(examId);
        counts[examId] = questions.length;
      }
      res.json(counts);
    } catch (error) {
      console.error("Error fetching question counts:", error);
      res.status(500).json({ message: "Failed to fetch question counts" });
    }
  });
  app2.get("/api/exam-questions/:examId", authenticateUser, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const questions = await storage.getExamQuestions(examId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching exam questions:", error);
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });
  app2.post("/api/exam-questions", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { options, ...questionData } = req.body;
      if (options && Array.isArray(options)) {
        const question = await storage.createExamQuestionWithOptions(questionData, options);
        res.status(201).json(question);
      } else {
        const question = await storage.createExamQuestion(questionData);
        res.status(201).json(question);
      }
    } catch (error) {
      console.error("Error creating exam question:", error);
      res.status(500).json({ message: error.message || "Failed to create exam question" });
    }
  });
  app2.patch("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.updateExamQuestion(questionId, req.body);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating exam question:", error);
      res.status(500).json({ message: "Failed to update exam question" });
    }
  });
  app2.delete("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const success = await storage.deleteExamQuestion(questionId);
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting exam question:", error);
      res.status(500).json({ message: "Failed to delete exam question" });
    }
  });
  app2.get("/api/question-options/:questionId", authenticateUser, async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const options = await storage.getQuestionOptions(questionId);
      res.json(options);
    } catch (error) {
      console.error("Error fetching question options:", error);
      res.status(500).json({ message: "Failed to fetch question options" });
    }
  });
  app2.post("/api/exam-questions/bulk", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { examId, questions } = req.body;
      if (!examId) {
        return res.status(400).json({ message: "Exam ID is required" });
      }
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Questions array is required and must not be empty" });
      }
      console.log(`\u{1F4E4} Bulk upload: ${questions.length} questions for exam ${examId}`);
      const questionsData = questions.map((q, index2) => ({
        question: {
          examId,
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points || 1,
          orderNumber: index2 + 1,
          instructions: q.instructions,
          sampleAnswer: q.sampleAnswer,
          expectedAnswers: q.expectedAnswers
        },
        options: q.options || []
      }));
      const result = await storage.createExamQuestionsBulk(questionsData);
      console.log(`\u2705 Bulk upload complete: ${result.created} created, ${result.errors.length} errors`);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error in bulk question upload:", error);
      res.status(500).json({
        message: error.message || "Failed to upload questions",
        created: 0,
        errors: [error.message || "Unknown error occurred"]
      });
    }
  });
  app2.post("/api/exam-sessions", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { examId } = req.body;
      const studentId = req.user.id;
      if (!examId) {
        return res.status(400).json({ message: "Exam ID is required" });
      }
      console.log(`\u{1F3AF} Starting exam ${examId} for student ${studentId}`);
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (!exam.isPublished) {
        return res.status(403).json({ message: "Exam is not published yet" });
      }
      const now = /* @__PURE__ */ new Date();
      const endTime = new Date(now.getTime() + (exam.duration || 60) * 60 * 1e3);
      const sessionData = {
        examId,
        studentId,
        startedAt: now,
        timeRemaining: (exam.duration || 60) * 60,
        isCompleted: false,
        status: "in_progress",
        endTime,
        maxScore: exam.totalMarks || 0
      };
      const session2 = await storage.createOrGetActiveExamSession(examId, studentId, sessionData);
      console.log(`\u2705 Exam session ${session2.wasCreated ? "created" : "retrieved"}:`, session2.id);
      res.status(201).json(session2);
    } catch (error) {
      console.error("Error starting exam:", error);
      res.status(500).json({ message: error.message || "Failed to start exam" });
    }
  });
  app2.get("/api/exam-sessions/student/:studentId/active", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      if (req.user.id !== studentId && req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const session2 = await storage.getStudentActiveSession(studentId);
      if (!session2) {
        return res.json(null);
      }
      res.json(session2);
    } catch (error) {
      console.error("Error fetching active session:", error);
      res.status(500).json({ message: "Failed to fetch active session" });
    }
  });
  app2.get("/api/exam-sessions/:id", authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const session2 = await storage.getExamSessionById(sessionId);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (req.user.id !== session2.studentId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error fetching exam session:", error);
      res.status(500).json({ message: "Failed to fetch exam session" });
    }
  });
  app2.patch("/api/exam-sessions/:id/metadata", authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { metadata } = req.body;
      const session2 = await storage.updateExamSession(sessionId, { metadata });
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error updating session metadata:", error);
      res.status(500).json({ message: "Failed to update session metadata" });
    }
  });
  app2.patch("/api/exam-sessions/:id/progress", authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { currentQuestionIndex, timeRemaining, tabSwitchCount, violationPenalty } = req.body;
      const updates = {};
      if (currentQuestionIndex !== void 0) updates.currentQuestionIndex = currentQuestionIndex;
      if (timeRemaining !== void 0) updates.timeRemaining = timeRemaining;
      if (tabSwitchCount !== void 0) updates.tabSwitchCount = tabSwitchCount;
      if (violationPenalty !== void 0) updates.violationPenalty = violationPenalty;
      const session2 = await storage.updateExamSession(sessionId, updates);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session2);
    } catch (error) {
      console.error("Error updating session progress:", error);
      res.status(500).json({ message: "Failed to update session progress" });
    }
  });
  app2.post("/api/student-answers", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const { sessionId, questionId, selectedOptionId, textAnswer } = req.body;
      const studentId = req.user.id;
      if (!sessionId || !questionId) {
        return res.status(400).json({ message: "Missing required fields: sessionId and questionId" });
      }
      const session2 = await storage.getExamSessionById(sessionId);
      if (!session2) {
        return res.status(404).json({ message: "Exam session not found" });
      }
      if (session2.studentId !== studentId) {
        return res.status(403).json({ message: "Unauthorized access to this exam session" });
      }
      if (session2.isCompleted) {
        return res.status(409).json({ message: "Cannot save answer - exam is already completed" });
      }
      const question = await storage.getExamQuestionById(questionId);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      if (question.examId !== session2.examId) {
        return res.status(403).json({ message: "Question does not belong to this exam" });
      }
      let answerData = {};
      if (selectedOptionId !== void 0 && selectedOptionId !== null) {
        if (question.questionType !== "multiple_choice") {
          return res.status(400).json({ message: "Cannot submit multiple choice answer for non-MCQ question" });
        }
        const optionId = typeof selectedOptionId === "number" ? selectedOptionId : parseInt(selectedOptionId);
        const option = await storage.getQuestionOptionById(optionId);
        if (!option) {
          return res.status(400).json({ message: "Invalid option selected" });
        }
        if (option.questionId !== questionId) {
          return res.status(400).json({ message: "Selected option does not belong to this question" });
        }
        answerData.selectedOptionId = optionId;
        answerData.textAnswer = null;
      } else if (textAnswer !== void 0) {
        if (question.questionType === "multiple_choice") {
          return res.status(400).json({ message: "Cannot submit text answer for multiple choice question" });
        }
        answerData.textAnswer = textAnswer || "";
        answerData.selectedOptionId = null;
      } else {
        return res.status(400).json({ message: "No answer provided" });
      }
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
          status: "saved"
        }
      });
    } catch (error) {
      console.error("Error saving student answer:", error);
      res.status(500).json({ message: error.message || "Failed to save answer" });
    }
  });
  app2.get("/api/student-answers/session/:sessionId", authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session2 = await storage.getExamSessionById(sessionId);
      if (!session2) {
        return res.status(404).json({ message: "Session not found" });
      }
      if (req.user.id !== session2.studentId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const answers = await storage.getStudentAnswers(sessionId);
      res.json(answers);
    } catch (error) {
      console.error("Error fetching student answers:", error);
      res.status(500).json({ message: "Failed to fetch student answers" });
    }
  });
  app2.post("/api/teacher/profile/setup", authenticateUser, authorizeRoles(ROLES.TEACHER), upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const files = req.files;
      console.log("\u{1F4E5} RECEIVED PROFILE SETUP REQUEST:", {
        teacherId,
        hasFiles: Object.keys(files || {}).length,
        fileFields: Object.keys(files || {}),
        profileImageExists: !!files["profileImage"]?.[0],
        signatureExists: !!files["signature"]?.[0],
        bodyKeys: Object.keys(req.body),
        staffId: req.body.staffId,
        subjects: req.body.subjects,
        assignedClasses: req.body.assignedClasses
      });
      if (files["profileImage"]?.[0]) {
        console.log("\u{1F4F8} Profile Image Details:", {
          filename: files["profileImage"][0].filename,
          originalname: files["profileImage"][0].originalname,
          mimetype: files["profileImage"][0].mimetype,
          size: files["profileImage"][0].size,
          path: files["profileImage"][0].path
        });
      } else {
        console.log("\u26A0\uFE0F No profile image received in upload");
      }
      if (files["signature"]?.[0]) {
        console.log("\u270D\uFE0F Signature Details:", {
          filename: files["signature"][0].filename,
          originalname: files["signature"][0].originalname,
          mimetype: files["signature"][0].mimetype,
          size: files["signature"][0].size,
          path: files["signature"][0].path
        });
      }
      const {
        gender,
        dateOfBirth,
        staffId,
        nationalId,
        phoneNumber,
        recoveryEmail,
        qualification,
        specialization,
        yearsOfExperience,
        subjects: subjects2,
        assignedClasses,
        department,
        gradingMode,
        notificationPreference,
        availability,
        agreement
      } = req.body;
      const parsedSubjects = typeof subjects2 === "string" ? JSON.parse(subjects2) : subjects2;
      const parsedClasses = typeof assignedClasses === "string" ? JSON.parse(assignedClasses) : assignedClasses;
      const profilePhotoPath = files["profileImage"]?.[0]?.path;
      const signaturePath = files["signature"]?.[0]?.path;
      const normalizedGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : null;
      const existingTeacherProfile = await storage.getTeacherProfile(teacherId);
      if (existingTeacherProfile) {
        return res.status(409).json({
          message: "Profile already exists. Please update your existing profile instead.",
          existingProfile: true
        });
      }
      const user = await storage.getUser(teacherId);
      if (!user) {
        return res.status(404).json({
          message: "User account not found. Please contact support.",
          code: "USER_NOT_FOUND"
        });
      }
      let finalStaffId = null;
      if (staffId && staffId.trim() !== "" && staffId.trim() !== "undefined" && staffId.trim() !== "null") {
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
          console.error("\u274C Staff ID validation error:", staffIdError);
          finalStaffId = null;
        }
      }
      if (!finalStaffId) {
        try {
          const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
          const allTeacherProfiles = await storage.getAllTeacherProfiles();
          const teacherProfilesThisYear = allTeacherProfiles.filter(
            (p) => p.staffId && p.staffId.startsWith(`THS/TCH/${currentYear}/`)
          );
          const existingNumbers = teacherProfilesThisYear.map((p) => {
            const match = p.staffId?.match(/THS\/TCH\/\d{4}\/(\d+)/);
            return match ? parseInt(match[1]) : 0;
          }).filter((n) => !isNaN(n));
          const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          finalStaffId = `THS/TCH/${currentYear}/${String(nextNumber).padStart(3, "0")}`;
          console.log(`\u2705 Auto-generated Staff ID: ${finalStaffId}`);
        } catch (autoGenError) {
          console.error("\u274C Auto-generation error:", autoGenError);
          finalStaffId = `THS/TCH/${(/* @__PURE__ */ new Date()).getFullYear()}/${Date.now().toString().slice(-3)}`;
        }
      }
      const profileData = {
        userId: teacherId,
        staffId: finalStaffId,
        // Use validated staffId or null
        subjects: parsedSubjects,
        assignedClasses: parsedClasses,
        qualification,
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        specialization,
        department,
        signatureUrl: signaturePath ? `/${signaturePath}` : null,
        gradingMode,
        notificationPreference,
        availability: availability || null,
        firstLogin: false,
        verified: true,
        // Auto-verify on completion
        verifiedAt: /* @__PURE__ */ new Date()
      };
      const userUpdateData = {
        phone: phoneNumber,
        gender: normalizedGender,
        dateOfBirth,
        profileImageUrl: profilePhotoPath ? `/${profilePhotoPath}` : null
      };
      if (nationalId && nationalId.trim() !== "" && nationalId !== "undefined") {
        userUpdateData.nationalId = nationalId.trim();
      }
      if (recoveryEmail && recoveryEmail.trim() !== "" && recoveryEmail !== "undefined") {
        userUpdateData.recoveryEmail = recoveryEmail.trim();
      }
      await storage.updateUser(teacherId, userUpdateData);
      const isSuspicious = parsedSubjects.length === 0 || parsedClasses.length === 0 || !department || yearsOfExperience === 0;
      const profile = await storage.createTeacherProfile({
        ...profileData,
        firstLogin: false,
        autoGradeTheoryQuestions: req.body.autoGradeTheoryQuestions === "true",
        theoryGradingInstructions: req.body.theoryGradingInstructions || null
      });
      if (isSuspicious) {
        const teacher2 = await storage.getUser(teacherId);
        const teacherFullName2 = teacher2 ? `${teacher2.firstName} ${teacher2.lastName}` : "Teacher";
        const missingFields = [];
        if (parsedSubjects.length === 0) missingFields.push("subjects");
        if (parsedClasses.length === 0) missingFields.push("classes");
        if (!department) missingFields.push("department");
        if (yearsOfExperience === 0) missingFields.push("experience");
        await storage.createNotification({
          userId: (await storage.getUsersByRole(ROLES.ADMIN))[0]?.id,
          type: "teacher_profile_review_required",
          title: "\u26A0\uFE0F Teacher Profile Has Incomplete Data",
          message: `${teacherFullName2}'s profile was auto-verified but has incomplete data (missing: ${missingFields.join(", ")}). Please review and update if needed.`,
          relatedEntityType: "teacher_profile",
          relatedEntityId: profile.id.toString(),
          isRead: false
        });
      }
      await storage.updateUser(teacherId, {
        profileCompleted: true,
        profileCompletionPercentage: 100
      });
      const teacher = await storage.getUser(teacherId);
      const teacherFullName = teacher ? `${teacher.firstName} ${teacher.lastName}` : "Teacher";
      const admins = await storage.getUsersByRole(ROLES.ADMIN);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "teacher_profile_created",
          title: "\u{1F389} New Teacher Auto-Verified",
          message: `${teacherFullName} completed profile setup and has been automatically verified. Department: ${department}, Subjects: ${parsedSubjects.length}, Classes: ${parsedClasses.length}`,
          relatedEntityType: "teacher_profile",
          relatedEntityId: profile.id.toString(),
          isRead: false
        });
        try {
          const { sendEmail: sendEmail2, getTeacherVerifiedEmailHTML } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
          let subjectNames = [];
          let classNames = [];
          try {
            const subjects3 = await storage.getSubjects();
            subjectNames = parsedSubjects.map((subjectId) => {
              const subject = subjects3.find((s) => s.id === subjectId);
              return subject?.name || `Subject #${subjectId}`;
            });
          } catch (error) {
            console.error("Failed to fetch subject names:", error);
            subjectNames = parsedSubjects.map((id) => `Subject #${id}`);
          }
          try {
            const classes2 = await storage.getClasses();
            classNames = parsedClasses.map((classId) => {
              const cls = classes2.find((c) => c.id === classId);
              return cls?.name || `Class #${classId}`;
            });
          } catch (error) {
            console.error("Failed to fetch class names:", error);
            classNames = parsedClasses.map((id) => `Class #${id}`);
          }
          await sendEmail2({
            to: admin.email,
            subject: "\u{1F389} New Teacher Auto-Verified - THS Portal",
            html: getTeacherVerifiedEmailHTML(
              teacherFullName,
              department,
              subjectNames.join(", "),
              classNames.join(", "),
              qualification,
              yearsOfExperience,
              staffId || "Pending",
              `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000")}/portal/admin/teachers`
            )
          });
          console.log(`\u2705 Auto-verification email sent to admin: ${admin.email}`);
        } catch (emailError) {
          console.error("Failed to send admin notification email:", emailError);
        }
      }
      await storage.createAuditLog({
        userId: teacherId,
        action: "teacher_profile_setup_completed",
        entityType: "teacher_profile",
        entityId: profile.id,
        // Already a number from database
        newValue: JSON.stringify({ staffId: finalStaffId, subjects: parsedSubjects, classes: parsedClasses }),
        reason: "Teacher completed first-time profile setup",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || null
      });
      const completeProfileResponse = {
        id: profile.id,
        userId: profile.userId,
        staffId: profile.staffId,
        subjects: profile.subjects,
        assignedClasses: profile.assignedClasses,
        // FIX: Use correct field name
        department: profile.department,
        qualification: profile.qualification,
        yearsOfExperience: profile.yearsOfExperience,
        specialization: profile.specialization,
        verified: profile.verified,
        firstLogin: profile.firstLogin
      };
      console.log("\u{1F4E4} Sending profile response to frontend:", completeProfileResponse);
      res.json({
        message: "Profile setup completed successfully! You can now access your dashboard.",
        hasProfile: true,
        verified: profile.verified,
        profile: completeProfileResponse
      });
    } catch (error) {
      console.error("\u274C TEACHER PROFILE SETUP ERROR - Full Details:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : void 0,
        errorName: error instanceof Error ? error.name : void 0,
        errorCode: error?.code,
        errorDetail: error?.detail,
        errorConstraint: error?.constraint,
        errorSeverity: error?.severity,
        errorTable: error?.table,
        errorColumn: error?.column,
        teacherId: req.user?.id,
        requestBody: {
          ...req.body,
          // Redact sensitive data in logs
          password: req.body.password ? "[REDACTED]" : void 0
        },
        files: Object.keys(req.files || {})
      });
      let errorMessage = "Failed to setup teacher profile";
      let statusCode = 500;
      let errorCode = "UNKNOWN_ERROR";
      if (error instanceof Error) {
        const dbError = error;
        if (dbError.code === "23505" || dbError.constraint) {
          errorMessage = `A profile with this ${dbError.constraint?.includes("staff_id") ? "Staff ID" : "information"} already exists.`;
          statusCode = 409;
          errorCode = "DUPLICATE_ENTRY";
        } else if (dbError.code === "23503") {
          errorMessage = "Invalid reference data provided. Please check your selections.";
          statusCode = 400;
          errorCode = "INVALID_REFERENCE";
        } else if (dbError.code === "23502") {
          errorMessage = `Required field missing: ${dbError.column || "unknown"}`;
          statusCode = 400;
          errorCode = "MISSING_REQUIRED_FIELD";
        } else if (dbError.code === "23514") {
          errorMessage = "Invalid data provided. Please check your input values.";
          statusCode = 400;
          errorCode = "INVALID_DATA";
        } else if (error.message) {
          errorMessage = error.message;
          if (error.message.toLowerCase().includes("already exists") || error.message.toLowerCase().includes("duplicate")) {
            statusCode = 409;
            errorCode = "DUPLICATE_ENTRY";
          } else if (error.message.toLowerCase().includes("not found")) {
            statusCode = 404;
            errorCode = "NOT_FOUND";
          } else if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("validation")) {
            statusCode = 400;
            errorCode = "VALIDATION_ERROR";
          }
        }
      }
      res.status(statusCode).json({
        message: errorMessage,
        code: errorCode,
        details: error instanceof Error ? error.message : void 0,
        constraint: error?.constraint
      });
    }
  });
  app2.get("/api/teacher/profile/status", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const profile = await storage.getTeacherProfile(teacherId);
      const status = {
        hasProfile: !!profile,
        verified: profile?.verified || false,
        firstLogin: profile?.firstLogin !== false
      };
      console.log("\u{1F4CB} Profile status check:", { teacherId, ...status });
      res.json(status);
    } catch (error) {
      console.error("\u274C Get teacher profile status error:", error);
      res.status(500).json({ message: "Failed to check profile status" });
    }
  });
  app2.get("/api/teacher/profile/me", authenticateUser, async (req, res) => {
    try {
      const userId = req.user.id;
      const profile = await storage.getTeacherProfile(userId);
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const completeProfile = {
        // Profile fields
        id: profile.id,
        userId: profile.userId,
        staffId: profile.staffId,
        subjects: Array.isArray(profile.subjects) ? profile.subjects : profile.subjects ? [profile.subjects] : [],
        assignedClasses: Array.isArray(profile.assignedClasses) ? profile.assignedClasses : profile.assignedClasses ? [profile.assignedClasses] : [],
        department: profile.department,
        qualification: profile.qualification,
        yearsOfExperience: profile.yearsOfExperience,
        specialization: profile.specialization,
        verified: profile.verified,
        firstLogin: profile.firstLogin,
        // CRITICAL FIX: Include ALL user fields from users table
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        gender: user.gender || "",
        dateOfBirth: user.dateOfBirth || "",
        nationalId: user.nationalId || "",
        // ✅ FIX: From users.national_id column
        address: user.address || "",
        recoveryEmail: user.recoveryEmail || "",
        // ✅ FIX: From users.recovery_email column
        profileImageUrl: user.profileImageUrl || "",
        // ✅ FIX: From users.profile_image_url column
        // Additional profile fields
        gradingMode: profile.gradingMode,
        notificationPreference: profile.notificationPreference,
        availability: profile.availability,
        signatureUrl: profile.signatureUrl,
        updatedAt: profile.updatedAt
      };
      console.log("\u2705 Teacher profile API response:", {
        userId,
        staffId: completeProfile.staffId,
        hasNationalId: !!completeProfile.nationalId,
        nationalId: completeProfile.nationalId,
        hasProfileImage: !!completeProfile.profileImageUrl,
        profileImageUrl: completeProfile.profileImageUrl
      });
      res.json(completeProfile);
    } catch (error) {
      console.error("\u274C Error fetching teacher profile:", error);
      res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
  });
  app2.put("/api/teacher/profile/me", authenticateUser, authorizeRoles(ROLES.TEACHER), upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const files = req.files;
      console.log("\u{1F4DD} PROFILE UPDATE REQUEST:", {
        teacherId,
        hasFiles: Object.keys(files || {}).length,
        fileFields: Object.keys(files || {}),
        hasProfileImage: !!files["profileImage"]?.[0],
        hasSignature: !!files["signature"]?.[0],
        bodyKeys: Object.keys(req.body)
      });
      const updateData = req.body;
      let profileImageUrl = updateData.profileImageUrl;
      let signatureUrl = updateData.signatureUrl;
      if (files["profileImage"]?.[0]) {
        profileImageUrl = `/${files["profileImage"][0].path.replace(/\\/g, "/")}`;
        console.log("\u{1F4F8} New profile image uploaded:", profileImageUrl);
      }
      if (files["signature"]?.[0]) {
        signatureUrl = `/${files["signature"][0].path.replace(/\\/g, "/")}`;
        console.log("\u270D\uFE0F New signature uploaded:", signatureUrl);
      }
      const subjects2 = typeof updateData.subjects === "string" ? JSON.parse(updateData.subjects) : updateData.subjects;
      const assignedClasses = typeof updateData.assignedClasses === "string" ? JSON.parse(updateData.assignedClasses) : updateData.assignedClasses;
      const userUpdateData = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        phone: updateData.phone || null,
        address: updateData.address || null,
        recoveryEmail: updateData.recoveryEmail || null,
        gender: updateData.gender || null,
        dateOfBirth: updateData.dateOfBirth || null,
        nationalId: updateData.nationalId || null
      };
      if (profileImageUrl) {
        userUpdateData.profileImageUrl = profileImageUrl;
      }
      await storage.updateUser(teacherId, userUpdateData);
      console.log("\u2705 User data updated successfully");
      const profileUpdateData = {
        qualification: updateData.qualification || null,
        specialization: updateData.specialization || null,
        yearsOfExperience: parseInt(updateData.yearsOfExperience) || 0,
        department: updateData.department || null,
        gradingMode: updateData.gradingMode || "manual",
        notificationPreference: updateData.notificationPreference || "all",
        availability: updateData.availability || "full-time",
        subjects: subjects2 || [],
        assignedClasses: assignedClasses || [],
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (signatureUrl) {
        profileUpdateData.signatureUrl = signatureUrl;
      }
      await storage.updateTeacherProfile(teacherId, profileUpdateData);
      console.log("\u2705 Teacher profile updated successfully");
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
        profileImageUrl: updatedUser?.profileImageUrl
      };
      res.json({
        message: "Profile updated successfully",
        profile: completeProfile
      });
    } catch (error) {
      console.error("\u274C PROFILE UPDATE ERROR:", error);
      res.status(500).json({
        message: "Failed to update profile",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/admin/teachers/overview", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const teachers = await storage.getUsersByRole(ROLES.TEACHER);
      const overview = await Promise.all(teachers.map(async (teacher) => {
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
          createdAt: teacher.createdAt
        };
      }));
      res.json(overview);
    } catch (error) {
      console.error("Get teacher overview error:", error);
      res.status(500).json({ message: "Failed to fetch teacher overview" });
    }
  });
  app2.post("/api/grading/ai-suggested/:answerId/review", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const answerId = parseInt(req.params.answerId);
      const { approved, overrideScore, comment } = req.body;
      const answer = await storage.getStudentAnswerById(answerId);
      if (!answer) {
        return res.status(404).json({ message: "Answer not found" });
      }
      if (approved) {
        await storage.updateStudentAnswer(answerId, {
          autoScored: true,
          manualOverride: false,
          feedbackText: comment || answer.feedbackText
        });
      } else {
        await storage.updateStudentAnswer(answerId, {
          pointsEarned: overrideScore,
          autoScored: false,
          manualOverride: true,
          feedbackText: comment
        });
      }
      await mergeExamScores(answerId, storage);
      res.json({
        message: approved ? "AI score approved" : "Score overridden successfully",
        answer: await storage.getStudentAnswerById(answerId)
      });
    } catch (error) {
      console.error("Error reviewing AI-suggested score:", error);
      res.status(500).json({ message: "Failed to review AI-suggested score" });
    }
  });
  const isProduction = process.env.NODE_ENV === "production";
  const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "dev-session-secret-change-in-production" : process.env.JWT_SECRET || SECRET_KEY);
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    console.warn("\u26A0\uFE0F WARNING: SESSION_SECRET not set in production! Using JWT_SECRET as fallback. Set SESSION_SECRET for better security.");
  }
  const PgStore = connectPgSimple(session);
  const sessionStore = new PgStore({
    conString: process.env.DATABASE_URL,
    tableName: "session",
    createTableIfMissing: true
  });
  app2.use(session({
    store: sessionStore,
    // Use PostgreSQL instead of MemoryStore
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    // Custom cookie name
    cookie: {
      secure: isProduction,
      // HTTPS only in production
      httpOnly: true,
      // Prevent JavaScript access (XSS protection)
      sameSite: isProduction ? "none" : "lax",
      // 'none' required for cross-domain in production
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      path: "/"
      // Cookie available for all routes
      // DO NOT set domain attribute for cross-domain (Render ↔ Vercel)
    }
  }));
  app2.use(passport2.initialize());
  app2.use(passport2.session());
  await initializeStorageBuckets();
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
      passport2.authenticate("google", async (err, user, info) => {
        const REPLIT_DEV_DOMAIN2 = process.env.REPLIT_DEV_DOMAIN;
        const frontendUrl = REPLIT_DEV_DOMAIN2 ? `https://${REPLIT_DEV_DOMAIN2}` : process.env.FRONTEND_URL || "https://treasurehomeschool.vercel.app";
        console.log("\u{1F504} OAuth redirect to frontend:", frontendUrl);
        if (err) {
          console.error("\u274C Google OAuth error:", err);
          console.error("Error details:", { message: err.message, stack: err.stack });
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed&message=` + encodeURIComponent("Authentication failed. Please try again."));
        }
        if (!user) {
          const message = info?.message || "Authentication failed";
          console.error("\u274C Google OAuth: No user returned. Info:", info);
          return res.redirect(`${frontendUrl}/login?error=google_auth_failed&message=` + encodeURIComponent(message));
        }
        if (user.isNewUser && user.requiresApproval) {
          console.log("\u{1F4DD} Creating pending staff account for:", user.email);
          try {
            const invite = await storage.getPendingInviteByEmail(user.email);
            const roleId = invite ? invite.roleId : ROLES.TEACHER;
            const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
            const existingUsers = await storage.getUsersByRole(roleId);
            const existingUsernames = existingUsers.map((u) => u.username).filter(Boolean);
            const nextNumber = getNextUserNumber(existingUsernames, roleId, currentYear);
            const username = generateUsername(roleId, currentYear, "", nextNumber);
            const newUser = await storage.createUser({
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              username,
              roleId,
              authProvider: "google",
              googleId: user.googleId,
              profileImageUrl: user.profileImageUrl,
              mustChangePassword: false,
              passwordHash: null,
              status: "pending",
              // Requires approval
              createdVia: invite ? "invite" : "google",
              isActive: true
            });
            if (invite) {
              await storage.markInviteAsAccepted(invite.id, newUser.id);
            }
            console.log("\u2705 Created pending account for:", user.email);
            await storage.createAuditLog({
              userId: newUser.id,
              action: "account_created_pending_approval",
              entityType: "user",
              entityId: BigInt(1),
              // Placeholder, needs proper entity ID if applicable
              newValue: JSON.stringify({ email: user.email, googleId: user.googleId, username, roleId }),
              reason: invite ? "OAuth signup via invite" : "OAuth signup without invite",
              ipAddress: req.ip,
              userAgent: req.headers["user-agent"]
            });
            try {
              const admins = await storage.getUsersByRole(ROLES.ADMIN);
              if (admins && admins.length > 0) {
                const role2 = await storage.getRole(roleId);
                const roleName2 = role2?.name || (roleId === ROLES.ADMIN ? "Admin" : "Teacher");
                for (const admin of admins) {
                  await storage.createNotification({
                    userId: admin.id,
                    type: "pending_user",
                    title: "New User Pending Approval",
                    message: `${newUser.firstName} ${newUser.lastName} (${newUser.email}) has signed up via Google as ${roleName2} and is awaiting approval.`,
                    relatedEntityType: "user",
                    relatedEntityId: newUser.id,
                    isRead: false
                  });
                }
                console.log(`\u{1F4EC} Notified ${admins.length} admin(s) about pending user: ${newUser.email}`);
              } else {
                console.warn("\u26A0\uFE0F No admins found to notify about pending user:", newUser.email);
              }
            } catch (notifError) {
              console.error("\u274C Failed to create admin notifications:", notifError);
            }
            console.log(`\u{1F512} OAuth signup complete - user ${newUser.email} awaiting admin approval`);
            const role = await storage.getRole(roleId);
            const roleName = role?.name || "Staff";
            return res.redirect(`${frontendUrl}/login?status=pending_verification&role=${roleName.toLowerCase()}`);
          } catch (error) {
            console.error("\u274C Error creating pending account:", error);
            return res.redirect(`${frontendUrl}/login?error=account_creation_failed&message=` + encodeURIComponent("Failed to create your account. Please contact the administrator."));
          }
        }
        req.logIn(user, (loginErr) => {
          if (loginErr) {
            console.error("Login error:", loginErr);
            return res.redirect(`${frontendUrl}/login?error=login_failed&message=` + encodeURIComponent("Failed to complete login"));
          }
          const token = jwt.sign({ userId: user.id, roleId: user.roleId }, SECRET_KEY, { expiresIn: JWT_EXPIRES_IN });
          res.redirect(`${frontendUrl}/login?token=${token}&provider=google`);
        });
      })(req, res, next);
    }
  );
  app2.get("/api/auth/me", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      if (!user.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/parents/children/:parentId", authenticateUser, async (req, res) => {
    try {
      const parentId2 = req.params.parentId;
      const user = req.user;
      if (user?.roleId !== ROLES.PARENT && user?.roleId !== ROLES.ADMIN && user?.id !== parentId2) {
        return res.status(403).json({ message: "Unauthorized access to parent records" });
      }
      const children = await storage.getStudentsByParentId(parentId2);
      res.json(children);
    } catch (error) {
      console.error("Error fetching parent children:", error);
      res.status(500).json({ message: "Failed to fetch children records" });
    }
  });
  app2.get("/api/notifications", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications2 = await storage.getNotificationsByUserId(user.id);
      res.json(notifications2);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });
  app2.get("/api/notifications/unread-count", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const count = await storage.getUnreadNotificationCount(user.id);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });
  app2.put("/api/notifications/:id/read", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      const notificationId = parseInt(req.params.id);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications2 = await storage.getNotificationsByUserId(user.id);
      const notification = notifications2.find((n) => n.id === notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      const updated = await storage.markNotificationAsRead(notificationId);
      res.json(updated);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to update notification" });
    }
  });
  app2.put("/api/notifications/mark-all-read", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      await storage.markAllNotificationsAsRead(user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });
  app2.get("/api/classes", authenticateUser, async (req, res) => {
    try {
      const classes2 = await storage.getClasses();
      res.json(classes2);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.get("/api/subjects", authenticateUser, async (req, res) => {
    try {
      const subjects2 = await storage.getSubjects();
      res.json(subjects2);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });
  app2.get("/api/terms", authenticateUser, async (req, res) => {
    try {
      console.log("\u{1F4C5} Fetching academic terms for user:", req.user?.email);
      const terms = await storage.getAcademicTerms();
      console.log(`\u2705 Found ${terms.length} academic terms`);
      res.json(terms);
    } catch (error) {
      console.error("\u274C Error fetching academic terms:", error);
      res.status(500).json({ message: "Failed to fetch academic terms" });
    }
  });
  app2.post("/api/terms", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      console.log("\u{1F4C5} Creating academic term:", req.body);
      if (!req.body.name || !req.body.year || !req.body.startDate || !req.body.endDate) {
        return res.status(400).json({ message: "Missing required fields: name, year, startDate, endDate" });
      }
      const term = await storage.createAcademicTerm(req.body);
      console.log("\u2705 Academic term created successfully:", term.id);
      res.json(term);
    } catch (error) {
      console.error("\u274C Error creating academic term:", error);
      res.status(500).json({ message: error.message || "Failed to create academic term" });
    }
  });
  app2.put("/api/terms/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);
      if (isNaN(termId)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      console.log("\u{1F4C5} Updating academic term:", termId, req.body);
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        console.warn(`\u26A0\uFE0F Term ${termId} not found for update`);
        return res.status(404).json({ message: "Academic term not found" });
      }
      const term = await storage.updateAcademicTerm(termId, req.body);
      console.log("\u2705 Academic term updated successfully:", term?.id);
      res.json(term);
    } catch (error) {
      console.error("\u274C Error updating academic term:", error);
      res.status(500).json({ message: error.message || "Failed to update academic term" });
    }
  });
  app2.delete("/api/terms/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);
      if (isNaN(termId)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      console.log("\u{1F4C5} DELETE REQUEST: Attempting to delete academic term:", termId);
      const success = await storage.deleteAcademicTerm(termId);
      if (!success) {
        console.error(`\u274C DELETE FAILED: Term ${termId} deletion returned false`);
        return res.status(500).json({
          message: "Failed to delete academic term. The term may not exist or could not be removed from the database."
        });
      }
      console.log("\u2705 DELETE SUCCESS: Academic term deleted:", termId);
      res.json({
        message: "Academic term deleted successfully",
        id: termId,
        success: true
      });
    } catch (error) {
      console.error("\u274C DELETE ERROR:", error);
      if (error.code === "23503" || error.message?.includes("linked to it")) {
        return res.status(400).json({
          message: error.message || "Cannot delete this term because it is being used by other records."
        });
      }
      res.status(500).json({
        message: error.message || "Failed to delete academic term",
        error: process.env.NODE_ENV === "development" ? error.toString() : void 0
      });
    }
  });
  app2.put("/api/terms/:id/mark-current", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);
      if (isNaN(termId)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      console.log("\u{1F4C5} Marking term as current:", termId);
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        console.warn(`\u26A0\uFE0F Term ${termId} not found`);
        return res.status(404).json({ message: "Academic term not found" });
      }
      const term = await storage.markTermAsCurrent(termId);
      console.log("\u2705 Term marked as current successfully:", term?.id);
      res.json(term);
    } catch (error) {
      console.error("\u274C Error marking term as current:", error);
      res.status(500).json({ message: error.message || "Failed to mark term as current" });
    }
  });
  app2.post("/api/admin/delete-demo-accounts", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const demoEmails = ["admin@demo.com", "teacher@demo.com", "admin@treasure.com"];
      const deletedUsers = [];
      const errors = [];
      for (const email of demoEmails) {
        try {
          const user = await storage.getUserByEmail(email);
          if (user) {
            await storage.deleteUser(user.id);
            deletedUsers.push(email);
            console.log(`\u2705 Deleted demo account: ${email}`);
          } else {
            console.log(`\u26A0\uFE0F Demo account not found: ${email}`);
          }
        } catch (error) {
          console.error(`\u274C Failed to delete ${email}:`, error);
          errors.push(`${email}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      res.json({
        message: `Deleted ${deletedUsers.length} demo accounts`,
        deletedUsers,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      console.error("Delete demo accounts error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to delete demo accounts"
      });
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
            const hasWeakPassword = await bcrypt2.compare("password123", user.passwordHash);
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
          const hashedPassword = await bcrypt2.hash(strongPassword, BCRYPT_ROUNDS);
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
  app2.post("/api/upload", authenticateUser, upload.single("profileImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      let fileUrl;
      if (isSupabaseStorageEnabled) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const uploadResult = await uploadFileToSupabase(
          STORAGE_BUCKETS.PROFILES,
          fileName,
          req.file.buffer,
          req.file.mimetype
        );
        if (!uploadResult) {
          return res.status(500).json({ message: "Failed to upload file to cloud storage" });
        }
        fileUrl = uploadResult.publicUrl;
        console.log(`\u{1F4E6} Profile image uploaded to Supabase Storage: ${fileUrl}`);
      } else {
        fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;
        console.log(`\u{1F4BE} Profile image saved to local filesystem: ${fileUrl}`);
      }
      res.json({ url: fileUrl });
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ message: "Failed to upload file" });
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
      let fileUrl;
      if (isSupabaseStorageEnabled) {
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const uploadResult = await uploadFileToSupabase(
          STORAGE_BUCKETS.HOMEPAGE,
          fileName,
          req.file.buffer,
          req.file.mimetype
        );
        if (!uploadResult) {
          return res.status(500).json({ message: "Failed to upload file to cloud storage" });
        }
        fileUrl = uploadResult.publicUrl;
        console.log(`\u{1F4E6} Uploaded to Supabase Storage: ${fileUrl}`);
      } else {
        fileUrl = `/${req.file.path.replace(/\\/g, "/")}`;
        console.log(`\u{1F4BE} Saved to local filesystem: ${fileUrl}`);
      }
      const content = await storage.createHomePageContent({
        contentType,
        imageUrl: fileUrl,
        altText: altText || "",
        caption: caption || null,
        displayOrder: parseInt(displayOrder) || 0,
        isActive: true,
        uploadedBy: req.user.id
      });
      res.json({
        message: "Homepage image uploaded successfully",
        content
      });
    } catch (error) {
      console.error("Homepage image upload error:", error);
      res.status(500).json({ message: "Failed to upload homepage image" });
    }
  });
  app2.get("/api/homepage-content", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { contentType } = req.query;
      const content = await storage.getHomePageContent(contentType);
      res.json(content);
    } catch (error) {
      console.error("Get homepage content error:", error);
      res.status(500).json({ message: "Failed to get homepage content" });
    }
  });
  app2.put("/api/homepage-content/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
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
        return res.status(404).json({ message: "Homepage content not found" });
      }
      res.json({
        message: "Homepage content updated successfully",
        content: updated
      });
    } catch (error) {
      console.error("Update homepage content error:", error);
      res.status(500).json({ message: "Failed to update homepage content" });
    }
  });
  app2.delete("/api/homepage-content/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contentList = await storage.getHomePageContent();
      const content = contentList.find((c) => c.id === id);
      if (!content) {
        return res.status(404).json({ message: "Homepage content not found" });
      }
      if (isSupabaseStorageEnabled && content.imageUrl) {
        const filePath = extractFilePathFromUrl(content.imageUrl);
        if (filePath) {
          await deleteFileFromSupabase(STORAGE_BUCKETS.HOMEPAGE, filePath);
          console.log(`\u{1F5D1}\uFE0F Deleted from Supabase Storage: ${filePath}`);
        }
      }
      const deleted = await storage.deleteHomePageContent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Homepage content not found" });
      }
      res.json({ message: "Homepage content deleted successfully" });
    } catch (error) {
      console.error("Delete homepage content error:", error);
      res.status(500).json({ message: "Failed to delete homepage content" });
    }
  });
  app2.get("/api/public/homepage-content", async (req, res) => {
    try {
      const content = await storage.getHomePageContent();
      res.json(content);
    } catch (error) {
      console.error("Get public homepage content error:", error);
      res.status(500).json({ message: "Failed to get homepage content" });
    }
  });
  app2.get("/api/homepage-content/:contentType", async (req, res) => {
    try {
      const { contentType } = req.params;
      const content = await storage.getHomePageContent(contentType);
      res.json(content);
    } catch (error) {
      console.error("Get public homepage content error:", error);
      res.status(500).json({ message: "Failed to get homepage content" });
    }
  });
  app2.get("/uploads/homepage/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path.resolve("uploads", "homepage", filename);
    if (!filePath.startsWith(path.resolve("uploads", "homepage"))) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(404).json({ message: "File not found" });
      }
    });
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
        if (identifier) {
          const violationData = lockoutViolations.get(identifier) || { count: 0, timestamps: [] };
          const recentViolations = violationData.timestamps.filter((ts) => now - ts < LOCKOUT_VIOLATION_WINDOW);
          recentViolations.push(now);
          lockoutViolations.set(identifier, { count: recentViolations.length, timestamps: recentViolations });
          if (recentViolations.length >= MAX_RATE_LIMIT_VIOLATIONS) {
            try {
              let userToSuspend;
              if (identifier.includes("@")) {
                userToSuspend = await storage.getUserByEmail(identifier);
              } else {
                userToSuspend = await storage.getUserByUsername(identifier);
              }
              if (userToSuspend && userToSuspend.status !== "suspended") {
                await storage.updateUserStatus(userToSuspend.id, "suspended", "system", `Automatic suspension due to ${recentViolations.length} rate limit violations within 1 hour`);
                console.warn(`Account ${identifier} suspended after ${recentViolations.length} rate limit violations`);
                lockoutViolations.delete(identifier);
                const userRoleForSuspension = await storage.getRole(userToSuspend.roleId);
                const roleNameForSuspension = userRoleForSuspension?.name?.toLowerCase();
                const isStaffForSuspension = roleNameForSuspension === "admin" || roleNameForSuspension === "teacher";
                const isParentForSuspension = roleNameForSuspension === "parent";
                if (isStaffForSuspension) {
                  return res.status(403).json({
                    message: "Account Suspended",
                    description: "Access denied. Your account has been suspended by the school administrator due to security concerns.",
                    statusType: "suspended_staff"
                  });
                } else if (isParentForSuspension) {
                  return res.status(403).json({
                    message: "Account Suspended - Security Alert",
                    description: "Your parent account has been automatically suspended due to multiple failed login attempts. This security measure protects your child's information from unauthorized access.\n\n\u{1F4DE} To Restore Your Account:\nContact School Administrator:\n\u{1F4E7} Email: treasurehomeschool@gmail.com\n\u{1F4DE} Call: School office during working hours\n\n\u{1F4A1} Have your child's information ready for verification.",
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
              console.error("Failed to suspend account:", err);
            }
          }
        }
        const currentViolations = lockoutViolations.get(identifier);
        if (currentViolations && currentViolations.count < MAX_RATE_LIMIT_VIOLATIONS) {
          return res.status(429).json({
            message: "Account Temporarily Locked",
            description: "Too many failed login attempts. Your account has been temporarily locked for security reasons. Please wait 15 minutes before trying again, or use 'Forgot Password' to reset.",
            statusType: "rate_limited"
          });
        }
      }
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
        loginAttempts.set(attemptKey, {
          count: attempts.count + 1,
          lastAttempt: now
        });
        console.log(`Login failed: User not found for identifier ${identifier}`);
        return res.status(401).json({
          message: "Invalid username or password. Please check your credentials and try again.",
          hint: "Make sure CAPS LOCK is off and you're using the correct username and password."
        });
      }
      const userRole = await storage.getRole(user.roleId);
      const roleName = userRole?.name?.toLowerCase();
      const isStaffAccount = roleName === "admin" || roleName === "teacher";
      if (user.status === "suspended") {
        console.warn(`Login blocked: Account ${identifier} is suspended (showing detailed message)`);
        if (isStaffAccount) {
          return res.status(403).json({
            message: "Account Suspended",
            description: "Access denied. Your account has been suspended by the school administrator due to security concerns. Please contact the school administrator to resolve this issue.",
            statusType: "suspended_staff"
          });
        } else if (roleName === "parent") {
          return res.status(403).json({
            message: "Account Suspended - Security Alert",
            description: "Your parent account has been automatically suspended due to multiple failed login attempts. This security measure protects your child's information from unauthorized access.\n\n\u{1F4DE} To Restore Your Account:\nContact School Administrator:\n\u{1F4E7} Email: treasurehomeschool@gmail.com\n\u{1F4DE} Call: School office during working hours\n\n\u{1F4A1} Have your child's information ready for verification.",
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
      loginAttempts.set(attemptKey, {
        count: attempts.count + 1,
        lastAttempt: now
      });
      if (user.status === "pending") {
        console.warn(`Login blocked: Account ${identifier} is pending approval`);
        if (isStaffAccount) {
          return res.status(403).json({
            message: "Account Pending Approval",
            description: "Your Admin/Teacher account has been created and is awaiting approval by the school administrator. You will be notified via email once your account is verified. For urgent access needs, please contact the school administrator.",
            statusType: "pending_staff"
          });
        } else {
          return res.status(403).json({
            message: "Account Pending Setup",
            description: "Your account is being set up by the school administrator. You will receive a notification once your account is ready. Please check back soon.",
            statusType: "pending_setup"
          });
        }
      }
      if (user.status === "disabled") {
        console.warn(`Login blocked: Account ${identifier} is disabled`);
        return res.status(403).json({
          message: "Account Disabled",
          description: "Your account has been disabled and is no longer active. Please contact the school administrator if you believe this is an error.",
          statusType: "disabled"
        });
      }
      if ((roleName === "admin" || roleName === "teacher") && user.authProvider === "google") {
        console.log(`Login blocked: Admin/Teacher ${identifier} trying to use password login instead of Google OAuth`);
        return res.status(401).json({
          message: "Google Sign-In Required",
          description: "Admins and Teachers must sign in using their authorized Google account. Please click the 'Sign in with Google' button below to access your account.",
          statusType: "google_required"
        });
      }
      if (!user.passwordHash) {
        if ((roleName === "admin" || roleName === "teacher") && user.authProvider === "google") {
          return res.status(401).json({
            message: "Google Sign-In Required",
            description: "Please use Google Sign-In for admin/teacher accounts.",
            statusType: "google_required"
          });
        }
        console.error(`SECURITY WARNING: User ${identifier} has no password hash set`);
        return res.status(401).json({
          message: "Account Setup Incomplete",
          description: "Your account setup is incomplete. Please contact the school administrator for assistance.",
          statusType: "setup_incomplete"
        });
      }
      const isPasswordValid = await bcrypt2.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        console.log(`Login failed: Invalid password for identifier ${identifier}`);
        return res.status(401).json({
          message: "Invalid Credentials",
          description: "Invalid username or password. Please check your credentials and try again. Make sure CAPS LOCK is off and you're using the correct username and password.",
          statusType: "invalid_credentials"
        });
      }
      loginAttempts.delete(attemptKey);
      if (identifier) {
        lockoutViolations.delete(identifier);
      }
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
      const isCurrentPasswordValid = await bcrypt2.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      const newPasswordHash = await bcrypt2.hash(newPassword, BCRYPT_ROUNDS);
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
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    try {
      const { identifier } = z2.object({ identifier: z2.string().min(1) }).parse(req.body);
      const recentAttempts = await storage.getRecentPasswordResetAttempts(identifier, 60);
      if (recentAttempts.length >= 3) {
        log(`\u{1F6A8} Rate limit exceeded for password reset: ${identifier} from IP ${ipAddress}`);
        await storage.createPasswordResetAttempt(identifier, ipAddress, false);
        const suspiciousAttempts = await storage.getRecentPasswordResetAttempts(identifier, 60);
        if (suspiciousAttempts.length >= 5) {
          const user2 = await storage.getUserByEmail(identifier) || await storage.getUserByUsername(identifier);
          if (user2) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1e3);
            await storage.lockAccount(user2.id, lockUntil);
            log(`\u{1F512} Account temporarily locked due to suspicious password reset activity: ${user2.id}`);
            await storage.createAuditLog({
              userId: user2.id,
              action: "account_locked_suspicious_activity",
              entityType: "user",
              entityId: 0,
              oldValue: null,
              newValue: JSON.stringify({ reason: "Excessive password reset attempts", lockUntil }),
              reason: "Suspicious password reset activity detected",
              ipAddress,
              userAgent: req.headers["user-agent"] || null
            });
          }
        }
        return res.status(429).json({
          message: "Too many password reset attempts. Please try again later."
        });
      }
      let user = await storage.getUserByEmail(identifier);
      if (!user) {
        user = await storage.getUserByUsername(identifier);
      }
      await storage.createPasswordResetAttempt(identifier, ipAddress, !!user);
      if (!user) {
        return res.json({
          message: "If an account exists with that email/username, a password reset link will be sent."
        });
      }
      const isLocked = await storage.isAccountLocked(user.id);
      if (isLocked) {
        return res.status(423).json({
          message: "Your account is temporarily locked. Please contact the administrator or try again later."
        });
      }
      const crypto3 = __require("crypto");
      const resetToken = crypto3.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt, ipAddress);
      const recoveryEmail = user.recoveryEmail || user.email;
      await storage.createAuditLog({
        userId: user.id,
        action: "password_reset_requested",
        entityType: "user",
        entityId: 0,
        oldValue: null,
        newValue: JSON.stringify({ requestedAt: /* @__PURE__ */ new Date(), ipAddress }),
        reason: "User requested password reset",
        ipAddress,
        userAgent: req.headers["user-agent"] || null
      });
      const resetLink = `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000")}/reset-password?token=${resetToken}`;
      const { sendEmail: sendEmail2, getPasswordResetEmailHTML: getPasswordResetEmailHTML2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
      const emailSent = await sendEmail2({
        to: recoveryEmail,
        subject: "THS Portal - Password Reset Request",
        html: getPasswordResetEmailHTML2(`${user.firstName} ${user.lastName}`, resetLink)
      });
      if (!emailSent && process.env.NODE_ENV === "production") {
        log(`\u274C Failed to send password reset email to ${recoveryEmail}`);
        return res.status(500).json({
          message: "Failed to send password reset email. Please try again later or contact administrator."
        });
      }
      if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
        log(`\u{1F4E7} DEV MODE - Password Reset Token: ${resetToken}`);
        log(`\u{1F4E7} DEV MODE - Reset Link: ${resetLink}`);
        return res.json({
          message: "Password reset code generated (Development Mode).",
          developmentMode: true,
          resetToken,
          // The actual code
          resetLink,
          email: recoveryEmail,
          expiresIn: "15 minutes",
          instructions: "Use the resetToken as your reset code, or click the resetLink"
        });
      }
      log(`\u2705 Password reset email sent to ${recoveryEmail} for user ${user.id}`);
      res.json({
        message: "If an account exists with that email/username, a password reset link will be sent."
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      try {
        const { identifier } = req.body;
        if (identifier) {
          await storage.createPasswordResetAttempt(identifier, ipAddress, false);
        }
      } catch (trackError) {
        console.error("Failed to track attempt:", trackError);
      }
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    try {
      const { token, newPassword } = z2.object({
        token: z2.string().min(1),
        newPassword: z2.string().min(8).max(100).refine((pwd) => /[A-Z]/.test(pwd), "Must contain at least one uppercase letter").refine((pwd) => /[a-z]/.test(pwd), "Must contain at least one lowercase letter").refine((pwd) => /[0-9]/.test(pwd), "Must contain at least one number").refine((pwd) => /[!@#$%^&*]/.test(pwd), "Must contain at least one special character (!@#$%^&*)")
      }).parse(req.body);
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newPasswordHash = await bcrypt2.hash(newPassword, BCRYPT_ROUNDS);
      await storage.updateUser(resetToken.userId, {
        passwordHash: newPasswordHash,
        mustChangePassword: false
      });
      await storage.markPasswordResetTokenAsUsed(token);
      await storage.createAuditLog({
        userId: resetToken.userId,
        action: "password_reset_completed",
        entityType: "user",
        entityId: 0,
        oldValue: null,
        newValue: JSON.stringify({ completedAt: /* @__PURE__ */ new Date(), ipAddress }),
        reason: "Password was successfully reset via reset token",
        ipAddress,
        userAgent: req.headers["user-agent"] || null
      });
      const recoveryEmail = user.recoveryEmail || user.email;
      const { sendEmail: sendEmail2, getPasswordChangedEmailHTML: getPasswordChangedEmailHTML2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
      await sendEmail2({
        to: recoveryEmail,
        subject: "THS Portal - Password Changed",
        html: getPasswordChangedEmailHTML2(`${user.firstName} ${user.lastName}`, ipAddress)
      });
      log(`\u2705 Password reset successfully for user ${resetToken.userId} from IP ${ipAddress}`);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Password must be at least 8 characters with uppercase, lowercase, number, and special character"
        });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/admin/reset-user-password", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    try {
      const { userId, newPassword, forceChange } = z2.object({
        userId: z2.string().uuid(),
        newPassword: z2.string().min(6, "Password must be at least 6 characters").optional(),
        forceChange: z2.boolean().optional().default(true)
      }).parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { generatePassword: generatePassword2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const password = newPassword || generatePassword2(currentYear);
      const passwordHash = await bcrypt2.hash(password, BCRYPT_ROUNDS);
      await storage.adminResetUserPassword(userId, passwordHash, req.user.id, forceChange);
      const recoveryEmail = user.recoveryEmail || user.email;
      const notificationSubject = "THS Portal - Password Reset by Administrator";
      const notificationBody = `
Hello ${user.firstName} ${user.lastName},

Your password was reset by an administrator on THS Portal.

Details:
- Reset at: ${(/* @__PURE__ */ new Date()).toLocaleString()}
- Reset by: Admin (${req.user?.email})
- Temporary Password: ${password}
${forceChange ? "- You will be required to change this password at next login" : ""}

Please login and ${forceChange ? "change your password immediately" : "update your password for security"}.

If you did not request this password reset, please contact the school administration immediately.

Thank you,
Treasure-Home School Administration
`;
      if (process.env.NODE_ENV === "development") {
        console.log(`
\u{1F4E7} ADMIN PASSWORD RESET NOTIFICATION:`);
        console.log(`To: ${recoveryEmail}`);
        console.log(`Subject: ${notificationSubject}`);
        console.log(`Body:
${notificationBody}
`);
      }
      log(`\u2705 Admin ${req.user?.email} reset password for user ${userId}`);
      res.json({
        message: "Password reset successfully",
        tempPassword: password,
        username: user.username || user.email,
        email: recoveryEmail
      });
    } catch (error) {
      console.error("Admin password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/admin/update-recovery-email", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId, recoveryEmail } = z2.object({
        userId: z2.string().uuid(),
        recoveryEmail: z2.string().email()
      }).parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const success = await storage.updateRecoveryEmail(userId, recoveryEmail, req.user.id);
      if (!success) {
        return res.status(500).json({ message: "Failed to update recovery email" });
      }
      console.log(`\u2705 Admin ${req.user?.email} updated recovery email for user ${userId} to ${recoveryEmail}`);
      res.json({
        message: "Recovery email updated successfully",
        oldEmail: user.recoveryEmail || user.email,
        newEmail: recoveryEmail
      });
    } catch (error) {
      console.error("Update recovery email error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      res.status(500).json({ message: "Failed to update recovery email" });
    }
  });
  app2.post("/api/users/:id/recovery-email", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { recoveryEmail } = z2.object({
        recoveryEmail: z2.string().email()
      }).parse(req.body);
      const userId = req.user.id;
      if (id !== userId && req.user.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: "You can only update your own recovery email" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const updatedUser = await storage.updateUser(id, {
        recoveryEmail
      });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update recovery email" });
      }
      await storage.createAuditLog({
        userId: req.user.id,
        action: "recovery_email_updated",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, recoveryEmail: user.recoveryEmail }),
        newValue: JSON.stringify({ userId: user.id, recoveryEmail }),
        reason: `User ${req.user.email} updated recovery email`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      console.log(`\u2705 User ${req.user?.email} updated recovery email for account ${id}`);
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "Recovery email updated successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error updating recovery email:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to update recovery email" });
    }
  });
  app2.post("/api/admin/unlock-account", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId } = z2.object({
        userId: z2.string().uuid()
      }).parse(req.body);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const success = await storage.unlockAccount(userId);
      if (!success) {
        return res.status(500).json({ message: "Failed to unlock account" });
      }
      await storage.createAuditLog({
        userId: req.user.id,
        action: "account_unlocked",
        entityType: "user",
        entityId: 0,
        oldValue: JSON.stringify({ accountLockedUntil: user.accountLockedUntil }),
        newValue: JSON.stringify({ accountLockedUntil: null }),
        reason: "Account manually unlocked by admin",
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || null
      });
      log(`\u2705 Admin ${req.user?.email} unlocked account for user ${userId}`);
      res.json({
        message: "Account unlocked successfully",
        username: user.username || user.email
      });
    } catch (error) {
      console.error("Unlock account error:", error);
      res.status(500).json({ message: "Failed to unlock account" });
    }
  });
  app2.get("/api/admin/suspended-accounts", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const suspendedUsers = await storage.getUsersByStatus("suspended");
      const sanitizedUsers = suspendedUsers.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Failed to fetch suspended accounts:", error);
      res.status(500).json({ message: "Failed to fetch suspended accounts" });
    }
  });
  app2.post("/api/admin/unlock-account/:userId", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.status !== "suspended") {
        return res.status(400).json({ message: "Account is not suspended" });
      }
      const updatedUser = await storage.updateUserStatus(
        userId,
        "active",
        req.user.id,
        reason || `Account unlocked by admin ${req.user.email}`
      );
      if (user.email) lockoutViolations.delete(user.email);
      if (user.username) lockoutViolations.delete(user.username);
      console.log(`Admin ${req.user.email} unlocked account ${user.email || user.username}`);
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "Account unlocked successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Failed to unlock account:", error);
      res.status(500).json({ message: "Failed to unlock account" });
    }
  });
  app2.post("/api/invites", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { email, roleId } = z2.object({
        email: z2.string().email(),
        roleId: z2.number()
      }).parse(req.body);
      const role = await storage.getRole(roleId);
      if (!role) {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (roleId !== ROLES.ADMIN && roleId !== ROLES.TEACHER) {
        return res.status(400).json({ message: "Invites can only be sent for Admin or Teacher roles" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      const existingInvite = await storage.getPendingInviteByEmail(email);
      if (existingInvite) {
        return res.status(400).json({ message: "Pending invite already exists for this email" });
      }
      const crypto3 = __require("crypto");
      const token = crypto3.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3);
      const invite = await storage.createInvite({
        email,
        roleId,
        token,
        createdBy: req.user.id,
        expiresAt
      });
      const inviteLink = `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000")}/invite/${token}`;
      if (process.env.NODE_ENV === "development") {
        console.log(`Invite created for ${email}: ${inviteLink}`);
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
      console.error("Create invite error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      res.status(500).json({ message: "Failed to create invite" });
    }
  });
  app2.get("/api/invites", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites2 = await storage.getAllInvites();
      res.json(invites2);
    } catch (error) {
      console.error("List invites error:", error);
      res.status(500).json({ message: "Failed to list invites" });
    }
  });
  app2.get("/api/invites/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites2 = await storage.getPendingInvites();
      res.json(invites2);
    } catch (error) {
      console.error("List pending invites error:", error);
      res.status(500).json({ message: "Failed to list pending invites" });
    }
  });
  app2.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(404).json({ message: "Invalid or expired invite" });
      }
      res.json({
        email: invite.email,
        roleId: invite.roleId,
        expiresAt: invite.expiresAt
      });
    } catch (error) {
      console.error("Get invite error:", error);
      res.status(500).json({ message: "Failed to get invite" });
    }
  });
  app2.post("/api/invites/:token/accept", async (req, res) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = z2.object({
        firstName: z2.string().min(1),
        lastName: z2.string().min(1),
        password: z2.string().min(6).max(100)
      }).parse(req.body);
      const invite = await storage.getInviteByToken(token);
      if (!invite) {
        return res.status(400).json({ message: "Invalid or expired invite" });
      }
      const existingUser = await storage.getUserByEmail(invite.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }
      const { generateUsername: generateUsername2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const existingUsernames = await storage.getAllUsernames();
      const { getNextUserNumber: getNextUserNumber2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const nextNumber = getNextUserNumber2(existingUsernames, invite.roleId, currentYear);
      const username = generateUsername2(invite.roleId, currentYear, "", nextNumber);
      const passwordHash = await bcrypt2.hash(password, BCRYPT_ROUNDS);
      const user = await storage.createUser({
        email: invite.email,
        username,
        firstName,
        lastName,
        roleId: invite.roleId,
        passwordHash,
        authProvider: "local",
        status: "active",
        createdVia: "invite",
        mustChangePassword: false
      });
      await storage.markInviteAsAccepted(invite.id, user.id);
      const token_jwt = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        SECRET_KEY,
        { expiresIn: "24h" }
      );
      console.log(`Invite accepted by ${user.email} (${username})`);
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
      console.error("Accept invite error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      res.status(500).json({ message: "Failed to accept invite" });
    }
  });
  app2.delete("/api/invites/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const inviteId = parseInt(req.params.id);
      const deleted = await storage.deleteInvite(inviteId);
      if (!deleted) {
        return res.status(404).json({ message: "Invite not found" });
      }
      res.json({ message: "Invite deleted successfully" });
    } catch (error) {
      console.error("Delete invite error:", error);
      res.status(500).json({ message: "Failed to delete invite" });
    }
  });
  app2.get("/api/health", async (_req, res) => {
    try {
      await exportDb.execute(sql4`SELECT 1`);
      res.json({
        status: "healthy",
        database: "connected",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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
      let users3 = [];
      if (role && typeof role === "string") {
        const userRole = await storage.getRoleByName(role);
        if (userRole) {
          users3 = await storage.getUsersByRole(userRole.id);
        } else {
          users3 = [];
        }
      } else {
        const allRoles2 = await storage.getRoles();
        const userPromises = allRoles2.map((userRole) => storage.getUsersByRole(userRole.id));
        const userArrays = await Promise.all(userPromises);
        users3 = userArrays.flat();
      }
      const allRoles = await storage.getRoles();
      const roleMap = new Map(allRoles.map((r) => [r.id, r.name]));
      const sanitizedUsers = users3.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return {
          ...safeUser,
          roleName: roleMap.get(user.roleId) || "Unknown"
        };
      });
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.get("/api/users/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const pendingUsers = await storage.getUsersByStatus("pending");
      const allRoles = await storage.getRoles();
      const roleMap = new Map(allRoles.map((r) => [r.id, r.name]));
      const enrichedUsers = pendingUsers.map((user) => {
        const { passwordHash, ...safeUser } = user;
        return {
          ...safeUser,
          roleName: roleMap.get(user.roleId) || "Unknown"
        };
      });
      res.json(enrichedUsers);
    } catch (error) {
      console.error("Error fetching pending users:", error);
      res.status(500).json({ message: "Failed to fetch pending users" });
    }
  });
  app2.post("/api/users/:id/approve", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      if (user.status !== "pending") {
        return res.status(400).json({ message: `Cannot approve user with status: ${user.status}` });
      }
      const approvedUser = await storage.approveUser(id, adminUser.id);
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_approved",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: "pending" }),
        newValue: JSON.stringify({ userId: user.id, status: "active" }),
        reason: `Admin ${adminUser.email} approved user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const { passwordHash, ...safeUser } = approvedUser;
      res.json({
        message: "User approved successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error approving user:", error);
      res.status(500).json({ message: "Failed to approve user" });
    }
  });
  app2.post("/api/users/:id/verify", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "active", adminUser.id, "User verified by admin");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_verified",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "active" }),
        reason: `Admin ${adminUser.email} verified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User verified and activated successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error verifying user:", error);
      res.status(500).json({ message: "Failed to verify user" });
    }
  });
  app2.post("/api/users/:id/unverify", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "pending", adminUser.id, "User unverified by admin - awaiting approval");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_unverified",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "pending" }),
        reason: `Admin ${adminUser.email} unverified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User unverified and moved to pending status",
        user: safeUser
      });
    } catch (error) {
      console.error("Error unverifying user:", error);
      res.status(500).json({ message: "Failed to unverify user" });
    }
  });
  app2.post("/api/users/:id/suspend", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "suspended", adminUser.id, reason || "Account suspended by admin");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_suspended",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "suspended" }),
        reason: reason || `Admin ${adminUser.email} suspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User suspended successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error suspending user:", error);
      res.status(500).json({ message: "Failed to suspend user" });
    }
  });
  app2.post("/api/users/:id/unsuspend", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "active", adminUser.id, "Suspension lifted by admin");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_unsuspended",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "active" }),
        reason: `Admin ${adminUser.email} unsuspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User unsuspended successfully",
        user: safeUser
      });
    } catch (error) {
      console.error("Error unsuspending user:", error);
      res.status(500).json({ message: "Failed to unsuspend user" });
    }
  });
  app2.post("/api/users/:id/status", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const validStatuses = ["pending", "active", "suspended", "disabled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, status, adminUser.id, reason);
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_status_changed",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status }),
        reason: reason || `Admin ${adminUser.email} changed status of user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: `User status updated to ${status}`,
        user: safeUser
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app2.delete("/api/users/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    const startTime = Date.now();
    try {
      const { id } = req.params;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      console.log(`\u{1F5D1}\uFE0F DELETE REQUEST: Admin ${adminUser.email} attempting to delete user ${id}`);
      const user = await storage.getUser(id);
      if (!user) {
        console.warn(`\u274C DELETE FAILED: User ${id} not found`);
        return res.status(404).json({ message: "User not found" });
      }
      if (user.id === adminUser.id) {
        console.warn(`\u274C DELETE BLOCKED: Admin attempted to delete own account`);
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      console.log(`\u{1F4CB} DELETING USER: ${user.email || user.username} (ID: ${id}, Role: ${user.roleId})`);
      let deleted = false;
      let lastError = null;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`\u{1F504} DELETE ATTEMPT ${attempt}/${maxRetries} for user ${id}`);
          deleted = await storage.deleteUser(id);
          if (deleted) {
            console.log(`\u2705 DELETE SUCCESS on attempt ${attempt}: User ${id} deleted in ${Date.now() - startTime}ms`);
            break;
          } else {
            console.warn(`\u26A0\uFE0F DELETE RETURNED FALSE on attempt ${attempt}: User ${id}`);
          }
        } catch (deleteError) {
          lastError = deleteError;
          console.error(`\u274C DELETE ERROR on attempt ${attempt}:`, deleteError);
          if (deleteError?.code === "42501" || deleteError?.message?.includes("permission denied")) {
            console.error(`\u{1F6AB} RLS/PERMISSION ERROR: Supabase Row Level Security may be blocking delete for user ${id}`);
            return res.status(403).json({
              message: "Database permission error: Cannot delete user due to Row Level Security policies. Please check Supabase RLS settings or use 'Disable Account' instead.",
              technicalDetails: "RLS_PERMISSION_DENIED"
            });
          }
          if (deleteError?.code !== "ECONNRESET" && !deleteError?.message?.includes("timeout")) {
            break;
          }
          if (attempt < maxRetries) {
            const backoffMs = 100 * Math.pow(2, attempt - 1);
            console.log(`\u23F1\uFE0F RETRY BACKOFF: Waiting ${backoffMs}ms before attempt ${attempt + 1}`);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      }
      if (!deleted) {
        const errorMsg = lastError?.message || "Unknown error";
        console.error(`\u274C DELETE FAILED AFTER ${maxRetries} ATTEMPTS: ${errorMsg}`);
        if (lastError?.cause?.code === "23503" || errorMsg.includes("foreign key")) {
          const relatedTable = lastError?.cause?.table_name || "related records";
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
      const verifyUser = await storage.getUser(id);
      if (verifyUser) {
        console.error(`\u{1F6A8} CRITICAL: User ${id} still exists after delete operation! Possible RLS issue.`);
        return res.status(500).json({
          message: "Delete operation completed but user still exists. This may be a database policy issue.",
          technicalDetails: "DELETE_VERIFICATION_FAILED"
        });
      }
      console.log(`\u2705 DELETE VERIFIED: User ${id} successfully removed from database`);
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_deleted",
        entityType: "user",
        entityId: BigInt(0),
        oldValue: JSON.stringify({
          userId: user.id,
          email: user.email,
          username: user.username,
          roleId: user.roleId
        }),
        newValue: null,
        reason: `Admin ${adminUser.email} permanently deleted user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      }).catch((err) => console.error("Audit log failed (non-critical):", err));
      const totalTime = Date.now() - startTime;
      console.log(`\u26A1 DELETE COMPLETED in ${totalTime}ms`);
      res.json({
        message: "User deleted successfully",
        deletedUserId: id,
        executionTime: `${totalTime}ms`
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`\u{1F4A5} UNEXPECTED DELETE ERROR after ${totalTime}ms:`, error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        message: "An unexpected error occurred while deleting user",
        technicalDetails: error.message
      });
    }
  });
  app2.post("/api/users/:id/reset-password", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword, forceChange } = z2.object({
        newPassword: z2.string().min(6, "Password must be at least 6 characters"),
        forceChange: z2.boolean().optional().default(true)
      }).parse(req.body);
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const passwordHash = await bcrypt2.hash(newPassword, BCRYPT_ROUNDS);
      await storage.updateUser(id, {
        passwordHash,
        mustChangePassword: forceChange
      });
      await storage.createAuditLog({
        userId: adminUser.id,
        action: "password_reset",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, mustChangePassword: user.mustChangePassword }),
        newValue: JSON.stringify({ userId: user.id, mustChangePassword: forceChange }),
        reason: `Admin ${adminUser.email} reset password for user ${user.email || user.username}${forceChange ? " (force change on next login)" : ""}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash: _, ...safeUser } = user;
      res.json({
        message: `Password reset successfully${forceChange ? ". User must change password on next login." : ""}`,
        user: { ...safeUser, email: user.email, username: user.username }
        // Include email/username for response
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  app2.post("/api/users/:id/role", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { roleId } = z2.object({
        roleId: z2.number().int().positive()
      }).parse(req.body);
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const newRole = await storage.getRole(roleId);
      if (!newRole) {
        return res.status(400).json({ message: "Invalid role" });
      }
      if (user.id === adminUser.id) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }
      const oldRole = await storage.getRole(user.roleId);
      const updatedUser = await storage.updateUser(id, { roleId });
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user role" });
      }
      await storage.createAuditLog({
        userId: adminUser.id,
        action: "role_changed",
        entityType: "user",
        entityId: BigInt(0),
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, roleId: user.roleId, roleName: oldRole?.name }),
        newValue: JSON.stringify({ userId: user.id, roleId, roleName: newRole.name }),
        reason: `Admin ${adminUser.email} changed role of user ${user.email || user.username} from ${oldRole?.name} to ${newRole.name}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: `User role updated to ${newRole.name}`,
        user: safeUser
      });
    } catch (error) {
      console.error("Error changing user role:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid request data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to change user role" });
    }
  });
  app2.get("/api/audit-logs", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { limit, offset, action, entityType } = z2.object({
        limit: z2.coerce.number().int().positive().max(1e3).optional().default(100),
        offset: z2.coerce.number().int().nonnegative().optional().default(0),
        action: z2.string().optional(),
        entityType: z2.string().optional()
      }).parse(req.query);
      const logs = await storage.getAuditLogs({
        limit,
        offset,
        action,
        entityType
      });
      const enrichedLogs = await Promise.all(logs.map(async (log3) => {
        const user = await storage.getUser(log3.userId);
        return {
          ...log3,
          userEmail: user?.email,
          userName: `${user?.firstName} ${user?.lastName}`
        };
      }));
      res.json(enrichedLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.post("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { password, ...otherUserData } = req.body;
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      const passwordHash = await bcrypt2.hash(password, BCRYPT_ROUNDS);
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
  app2.put("/api/users/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const requestUser = req.user;
      if (requestUser.id !== id && requestUser.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      const { password, passwordHash, ...otherUserData } = req.body;
      if (passwordHash) {
        return res.status(400).json({ message: "Direct password hash modification not allowed" });
      }
      let updateData = otherUserData;
      if (password) {
        if (typeof password !== "string" || password.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long" });
        }
        const hashedPassword = await bcrypt2.hash(password, BCRYPT_ROUNDS);
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
      console.error("User update error:", error);
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid user data",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(400).json({ message: "Invalid user data" });
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
      const studentRoleData = await storage.getRoleByName("Student");
      const parentRoleData = await storage.getRoleByName("Parent");
      if (!studentRoleData || !parentRoleData) {
        return res.status(500).json({ message: "Required roles (Student, Parent) not found in database" });
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
          let parentId2;
          let parentCredentials = null;
          if (!parent) {
            const parentCount = existingUsernames.filter((u) => u.startsWith(`THS-PAR-${currentYear}-`)).length + 1;
            const parentUsername = generateUsername2(parentRoleData.id, currentYear, "", parentCount);
            const parentPassword = generatePassword2(currentYear);
            const parentPasswordHash = await bcrypt2.hash(parentPassword, BCRYPT_ROUNDS);
            parent = await storage.createUser({
              username: parentUsername,
              email: parentEmail,
              passwordHash: parentPasswordHash,
              roleId: parentRoleData.id,
              firstName: parentFirstName,
              lastName: parentLastName,
              mustChangePassword: true
            });
            existingUsernames.push(parentUsername);
            parentCredentials = { username: parentUsername, password: parentPassword };
            parentId2 = parent.id;
          } else {
            parentId2 = parent.id;
          }
          const classObj = await storage.getClasses();
          const studentClass = classObj.find((c) => c.name.toLowerCase() === className.toLowerCase());
          if (!studentClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }
          const classPrefix = `THS-STU-${currentYear}-${className.toUpperCase()}-`;
          const studentCount = existingUsernames.filter((u) => u.startsWith(classPrefix)).length + 1;
          const studentUsername = generateUsername2(studentRoleData.id, currentYear, className.toUpperCase(), studentCount);
          const studentPassword = generatePassword2(currentYear);
          const studentPasswordHash = await bcrypt2.hash(studentPassword, BCRYPT_ROUNDS);
          const studentUser = await storage.createUser({
            username: studentUsername,
            email: `${studentUsername.toLowerCase()}@ths.edu`,
            // Auto-generated email
            passwordHash: studentPasswordHash,
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
            parentId: parentId2
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
      const { users: users3, createdCredentials } = req.body;
      if (!users3 || !Array.isArray(users3) || users3.length === 0) {
        return res.status(400).json({ message: "Users array is required and must not be empty" });
      }
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="THS-Login-Slips-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.pdf"`);
      doc.pipe(res);
      doc.fontSize(20).font("Helvetica-Bold").text("Treasure-Home School", { align: "center" });
      doc.fontSize(12).font("Helvetica").text("Login Credentials", { align: "center" });
      doc.moveDown(2);
      users3.forEach((user, index2) => {
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
          '\xA9 2024 Treasure-Home School | "Honesty and Success" | treasurehomeschool@gmail.com',
          50,
          doc.page.height - 80,
          { align: "center", width: 495 }
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
  app2.get("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      const { classId } = req.query;
      let students3 = [];
      if (classId && typeof classId === "string") {
        students3 = await storage.getStudentsByClass(parseInt(classId));
      } else {
        students3 = await storage.getAllStudents(true);
      }
      res.json(students3);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.post("/api/students", authenticateUser, authorizeRoles(ROLES.TEACHER, ROLES.ADMIN), async (req, res) => {
    try {
      console.log("Creating student with auto-generated credentials");
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
        email: z2.string().email().optional(),
        password: z2.string().min(6).optional(),
        dateOfBirth: createStudentSchema.shape.dateOfBirth.refine(isValidDate, "Invalid date of birth"),
        admissionDate: createStudentSchema.shape.admissionDate.refine(isValidDate, "Invalid admission date"),
        medicalInfo: z2.string().nullable().optional().transform((val) => val === null ? "" : val)
      });
      for (const field of ["phone", "address", "medicalInfo", "parentId", "email", "password"]) {
        if (req.body[field] == null || req.body[field] === "") {
          delete req.body[field];
        }
      }
      const validatedData = sharedCreateStudentSchema.parse(req.body);
      const classInfo = await storage.getClass(validatedData.classId);
      if (!classInfo) {
        return res.status(400).json({ message: "Invalid class ID" });
      }
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const { generateStudentUsername: generateStudentUsername6, generateStudentPassword: generateStudentPassword2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const existingStudents = await storage.getAllStudents(true);
      const existingUsernames = existingStudents.map((s) => s.admissionNumber).filter(Boolean);
      const nextNumber = getNextUserNumber(existingUsernames, ROLES.STUDENT, currentYear);
      const generatedUsername = generateStudentUsername6(classInfo.name, currentYear, nextNumber);
      const generatedPassword = generateStudentPassword2(currentYear);
      let finalUsername = generatedUsername;
      let attemptNumber = nextNumber;
      let existingUser = await storage.getUserByUsername(finalUsername);
      while (existingUser) {
        attemptNumber++;
        finalUsername = generateStudentUsername6(classInfo.name, currentYear, attemptNumber);
        existingUser = await storage.getUserByUsername(finalUsername);
      }
      const passwordHash = await bcrypt2.hash(generatedPassword, BCRYPT_ROUNDS);
      const userData = {
        email: `${finalUsername.toLowerCase()}@internal.ths`,
        // Internal placeholder only - not used for login
        username: finalUsername,
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
        isActive: true,
        mustChangePassword: true,
        // ✅ Student must change password on first login
        status: "active",
        authProvider: "local"
      };
      console.log("Creating user for student with username:", generatedUsername);
      const user = await storage.createUser(userData);
      console.log("User created with ID:", user.id);
      try {
        let parentId2 = validatedData.parentId || null;
        let parentCredentials = null;
        let parentCreated = false;
        if (validatedData.parentPhone && !parentId2) {
          console.log("\u{1F50D} Checking for existing parent account by phone...");
          let existingParent = null;
          const allParents = await storage.getUsersByRole(ROLES.PARENT);
          existingParent = allParents.find((p) => p.phone === validatedData.parentPhone);
          if (existingParent) {
            console.log("\u2705 Found existing parent by phone, linking to student");
            parentId2 = existingParent.id;
          } else {
            console.log("\u{1F195} No existing parent found, auto-creating parent account");
            const parentUsername = generateUsername(
              ROLES.PARENT,
              currentYear,
              "",
              getNextUserNumber(await storage.getAllUsernames(), ROLES.PARENT, currentYear)
            );
            const parentPassword = generatePassword(currentYear);
            const parentPasswordHash = await bcrypt2.hash(parentPassword, BCRYPT_ROUNDS);
            const parentData = {
              username: parentUsername,
              email: `${parentUsername.toLowerCase()}@internal.ths`,
              // Internal placeholder - not used for login
              passwordHash: parentPasswordHash,
              firstName: validatedData.guardianName?.split(" ")[0] || validatedData.firstName,
              lastName: validatedData.guardianName?.split(" ").slice(1).join(" ") || `Parent`,
              phone: validatedData.parentPhone || null,
              roleId: ROLES.PARENT,
              isActive: true,
              mustChangePassword: true,
              status: "active",
              authProvider: "local",
              createdVia: "admin",
              createdBy: req.user?.id
            };
            const parentUser = await storage.createUser(parentData);
            parentId2 = parentUser.id;
            parentCreated = true;
            parentCredentials = {
              username: parentUsername,
              password: parentPassword
            };
            console.log("\u2705 Parent account created:", parentUsername);
          }
        }
        const studentData = {
          id: user.id,
          // Use the same ID as the user
          admissionNumber: `THS/${currentYear.slice(-2)}/${String(nextNumber).padStart(4, "0")}`,
          // THS/25/001 format
          classId: validatedData.classId,
          parentId: parentId2,
          admissionDate: validatedData.admissionDate,
          emergencyContact: validatedData.emergencyContact,
          medicalInfo: validatedData.medicalInfo || null,
          guardianName: validatedData.guardianName || null
        };
        console.log("Creating student record...");
        const student = await storage.createStudent(studentData);
        console.log("Student created successfully with credentials");
        const response = {
          message: parentCreated ? "Student and Parent accounts created successfully" : "Student created successfully",
          student,
          user: {
            id: user.id,
            email: user.email,
            username: finalUsername,
            firstName: user.firstName,
            lastName: user.lastName
          },
          credentials: {
            student: {
              username: finalUsername,
              password: generatedPassword
            }
          }
        };
        if (parentCreated && parentCredentials) {
          response.credentials.parent = parentCredentials;
          response.parentCreated = true;
        }
        res.json(response);
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
  app2.post("/api/students/bulk-upload", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const fileContent = await fs.readFile(req.file.path, "utf-8");
      const lines = fileContent.split("\n").filter((line) => line.trim());
      if (lines.length < 2) {
        await fs.unlink(req.file.path);
        return res.status(400).json({ message: "CSV file is empty or invalid" });
      }
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const createdStudents = [];
      const errors = [];
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(",").map((v) => v.trim());
          const row = {};
          headers.forEach((header, index2) => {
            row[header] = values[index2] || "";
          });
          const firstName = row["first name"] || row["firstname"];
          const lastName = row["last name"] || row["lastname"];
          const className = row["class"];
          const gender = row["gender"];
          const dateOfBirth = row["date of birth"] || row["dob"];
          const parentEmail = row["parent email"] || row["parentemail"];
          const parentPhone = row["parent phone"] || row["parentphone"];
          if (!firstName || !lastName || !className) {
            errors.push(`Row ${i + 1}: Missing required fields (first name, last name, or class)`);
            continue;
          }
          const classInfo = await storage.getClasses();
          const matchingClass = classInfo.find(
            (c) => c.name.toLowerCase() === className.toLowerCase()
          );
          if (!matchingClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }
          const classCode = matchingClass.name.replace(/\s+/g, "").toUpperCase().substring(0, 4);
          const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
          const nextNumber = await storage.getNextSequence(matchingClass.name, currentYear);
          const username = generateStudentUsername5(matchingClass.name, currentYear, nextNumber);
          const password = generateStudentPassword(currentYear);
          const passwordHash = await bcrypt2.hash(password, BCRYPT_ROUNDS);
          const userData = {
            username,
            email: `${username.toLowerCase()}@ths.edu.ng`,
            // Auto-generated email
            passwordHash,
            mustChangePassword: true,
            firstName,
            lastName,
            phone: null,
            address: null,
            dateOfBirth: dateOfBirth || null,
            gender: gender?.toLowerCase() === "male" || gender?.toLowerCase() === "female" || gender?.toLowerCase() === "other" ? gender : null,
            profileImageUrl: null,
            roleId: ROLES.STUDENT,
            isActive: true,
            status: "active",
            createdVia: "bulk",
            createdBy: req.user?.id
          };
          const user = await storage.createUser(userData);
          const studentData = {
            id: user.id,
            admissionNumber: `THS/${currentYear.slice(-2)}/${String(nextNumber).padStart(4, "0")}`,
            // THS/25/001 format
            classId: matchingClass.id,
            parentId: null,
            // Will be updated below if parent is found or created
            admissionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            // Current date as admission date
            emergencyContact: parentPhone || null,
            medicalInfo: null,
            guardianName: parentId ? `${firstName} (Parent)` : null
            // Placeholder for guardian name
          };
          await storage.createStudent(studentData);
          createdStudents.push({
            id: user.id,
            firstName,
            lastName,
            username,
            password,
            // Return plaintext password for admin to share
            email: userData.email,
            class: matchingClass.name,
            parentEmail: parentEmail || null
          });
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      await fs.unlink(req.file.path);
      res.json({
        message: `Successfully created ${createdStudents.length} students`,
        students: createdStudents,
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
  app2.post("/api/admin/import/preview", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const csvContent = await fs.readFile(req.file.path, "utf-8");
      const { previewCSVImport: previewCSVImport2 } = await Promise.resolve().then(() => (init_csv_import_service(), csv_import_service_exports));
      const preview = await previewCSVImport2(csvContent);
      await fs.unlink(req.file.path);
      res.json(preview);
    } catch (error) {
      console.error("CSV preview error:", error);
      res.status(500).json({ message: error.message || "Failed to preview CSV" });
    }
  });
  app2.post("/api/students/csv-preview", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const csvContent = await fs.readFile(req.file.path, "utf-8");
      const { previewCSVImport: previewCSVImport2 } = await Promise.resolve().then(() => (init_csv_import_service(), csv_import_service_exports));
      const preview = await previewCSVImport2(csvContent);
      await fs.unlink(req.file.path);
      res.json(preview);
    } catch (error) {
      console.error("CSV preview error:", error);
      res.status(500).json({ message: error.message || "Failed to preview CSV" });
    }
  });
  app2.post("/api/students/csv-commit", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { validRows } = req.body;
      if (!validRows || !Array.isArray(validRows) || validRows.length === 0) {
        return res.status(400).json({ message: "No valid rows to import" });
      }
      const { commitCSVImport: commitCSVImport2 } = await Promise.resolve().then(() => (init_csv_import_service(), csv_import_service_exports));
      const adminUserId = req.user.id;
      const result = await commitCSVImport2(validRows, adminUserId);
      await storage.createAuditLog({
        userId: adminUserId,
        action: "bulk_student_import",
        entityType: "student",
        entityId: BigInt(0),
        // Bulk operation
        newValue: JSON.stringify({ count: result.successCount, failed: result.failedRows.length }),
        reason: `Bulk imported ${result.successCount} students via CSV`,
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || null
      });
      res.json({
        message: `Successfully imported ${result.successCount} students`,
        successCount: result.successCount,
        failedRows: result.failedRows,
        credentials: result.credentials
      });
    } catch (error) {
      console.error("CSV commit error:", error);
      res.status(500).json({ message: error.message || "Failed to import students" });
    }
  });
  app2.get("/api/students/:id", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      if (req.user.id !== studentId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      res.status(500).json({ message: "Failed to fetch student data" });
    }
  });
  app2.get("/api/students/:id/classes", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      if (req.user.id !== studentId && req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const classes2 = await storage.getStudentClasses(studentId);
      res.json(classes2);
    } catch (error) {
      console.error("Error fetching student classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.patch("/api/students/:id", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      if (req.user.id !== studentId && req.user.role !== ROLES.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const updates = req.body;
      const updatedStudent = await storage.updateStudent(studentId, updates);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student profile" });
    }
  });
  app2.get("/api/student/profile/status", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await storage.getStudent(studentId);
      const status = {
        hasProfile: !!student,
        isComplete: !!(student?.phone && student?.address),
        firstLogin: student?.firstLogin !== false
      };
      res.json(status);
    } catch (error) {
      console.error("Error checking student profile status:", error);
      res.status(500).json({ message: "Failed to check profile status" });
    }
  });
  app2.post("/api/student/profile/setup", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const studentId = req.user.id;
      const profileData = req.body;
      const updatedStudent = await storage.updateStudent(studentId, {
        ...profileData,
        firstLogin: false
      });
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({
        message: "Profile setup completed successfully",
        student: updatedStudent
      });
    } catch (error) {
      console.error("Error setting up student profile:", error);
      res.status(500).json({ message: "Failed to setup profile" });
    }
  });
  const {
    validateRegistrationData: validateRegistrationData2,
    checkParentExists: checkParentExists2,
    generateStudentUsername: generateStudentUsername5,
    generateParentUsername: generateParentUsername3,
    generateTempPassword: generateTempPassword3
  } = await Promise.resolve().then(() => (init_registration_utils(), registration_utils_exports));
  const { sendParentNotificationEmail: sendParentNotificationEmail2, sendParentNotificationSMS: sendParentNotificationSMS2 } = await Promise.resolve().then(() => (init_email_notifications(), email_notifications_exports));
  const registrationAttempts = /* @__PURE__ */ new Map();
  function checkRegistrationRateLimit(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const windowMs = 10 * 60 * 1e3;
    const maxAttempts = 5;
    const attempts = registrationAttempts.get(ip);
    if (attempts) {
      if (now - attempts.lastAttempt > windowMs) {
        registrationAttempts.set(ip, { count: 1, lastAttempt: now });
        return next();
      }
      if (attempts.count >= maxAttempts) {
        return res.status(429).json({
          message: "Too many registration attempts. Please try again in 10 minutes."
        });
      }
      attempts.count++;
      attempts.lastAttempt = now;
    } else {
      registrationAttempts.set(ip, { count: 1, lastAttempt: now });
    }
    next();
  }
  app2.post("/api/self-register/student/preview", checkRegistrationRateLimit, async (req, res) => {
    try {
      const data = req.body;
      const errors = validateRegistrationData2(data);
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      const suggestedUsername = await generateStudentUsername5(data.classCode);
      const parentCheck = await checkParentExists2(data.parentEmail);
      res.json({
        suggestedUsername,
        parentExists: parentCheck.exists,
        errors: []
      });
    } catch (error) {
      console.error("Error in registration preview:", error);
      res.status(500).json({
        errors: ["Failed to generate preview. Please try again."]
      });
    }
  });
  app2.post("/api/self-register/student/commit", checkRegistrationRateLimit, async (req, res) => {
    try {
      const { fullName, classCode, gender, dateOfBirth, parentEmail, parentPhone, password } = req.body;
      const errors = validateRegistrationData2({ fullName, classCode, gender, dateOfBirth, parentEmail, parentPhone });
      if (errors.length > 0) {
        return res.status(400).json({ errors });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ errors: ["Password must be at least 6 characters"] });
      }
      try {
        const setting = await storage.getSetting("allow_student_self_registration");
        if (setting && setting.value === "false") {
          return res.status(403).json({
            errors: ["Student self-registration is currently disabled"]
          });
        }
      } catch (error) {
        console.warn("Could not check registration setting, allowing by default:", error);
      }
      const studentRole = await storage.getRoleByName("student");
      const parentRole = await storage.getRoleByName("parent");
      if (!studentRole || !parentRole) {
        return res.status(500).json({ errors: ["System configuration error"] });
      }
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(" ") || firstName;
      const studentUsername = await generateStudentUsername5(classCode);
      let parentUserId;
      let parentCreated = false;
      let parentUsername;
      let parentPassword;
      const parentCheck = await checkParentExists2(parentEmail);
      if (parentCheck.exists && parentCheck.userId) {
        parentUserId = parentCheck.userId;
      } else {
        parentUsername = generateParentUsername3();
        parentPassword = generateTempPassword3();
        const parentPasswordHash = await bcrypt2.hash(parentPassword, 10);
        const parentUser = await storage.createUser({
          username: parentUsername,
          email: parentEmail,
          passwordHash: parentPasswordHash,
          mustChangePassword: true,
          roleId: parentRole.id,
          firstName: `Parent of ${firstName}`,
          lastName,
          phone: parentPhone || "",
          isActive: true,
          status: "active",
          createdVia: "self",
          profileCompleted: false
        });
        parentUserId = parentUser.id;
        parentCreated = true;
        await storage.createParentProfile({
          userId: parentUserId,
          linkedStudents: []
        });
      }
      const studentPasswordHash = await bcrypt2.hash(password, 10);
      const studentUser = await storage.createUser({
        username: studentUsername,
        email: parentEmail,
        // Use parent email for recovery
        passwordHash: studentPasswordHash,
        mustChangePassword: true,
        roleId: studentRole.id,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        isActive: true,
        status: "active",
        createdVia: "self",
        profileCompleted: false
      });
      const classes2 = await storage.getAllClasses();
      const studentClass = classes2.find((c) => c.name === classCode);
      await storage.createStudent({
        id: studentUser.id,
        admissionNumber: `ADM-${(/* @__PURE__ */ new Date()).getFullYear()}-${studentUsername.split("-").pop()}`,
        classId: studentClass?.id || null,
        parentId: parentUserId
      });
      const parentProfile = await storage.getParentProfile(parentUserId);
      if (parentProfile) {
        const linkedStudents = parentProfile.linkedStudents || [];
        await storage.updateParentProfile(parentUserId, {
          linkedStudents: [...linkedStudents, studentUser.id]
        });
      }
      if (parentCreated && parentUsername && parentPassword) {
        try {
          if (parentEmail) {
            await sendParentNotificationEmail2({
              parentEmail,
              parentUsername,
              parentPassword,
              studentName: fullName,
              studentUsername
            });
          }
          if (parentPhone) {
            await sendParentNotificationSMS2(parentPhone, parentUsername, parentPassword);
          }
        } catch (error) {
          console.error("Failed to send parent notification:", error);
        }
      }
      await storage.createAuditLog({
        userId: null,
        action: "student_self_register",
        entityType: "student",
        entityId: 0,
        oldValue: null,
        newValue: JSON.stringify({ studentUsername, parentCreated, classCode }),
        reason: "Student self-registration",
        ipAddress: req.ip || req.socket.remoteAddress || "unknown"
      });
      res.json({
        studentUsername,
        parentCreated,
        parentUsername: parentCreated ? parentUsername : void 0,
        parentPassword: parentCreated ? parentPassword : void 0,
        message: "Registration successful! Please save your credentials."
      });
    } catch (error) {
      console.error("Error in registration commit:", error);
      res.status(500).json({
        errors: ["Registration failed. Please try again."]
      });
    }
  });
  app2.get("/api/self-register/status/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({
          exists: false,
          message: "User not found"
        });
      }
      res.json({
        exists: true,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        isActive: user.isActive
      });
    } catch (error) {
      console.error("Error checking registration status:", error);
      res.status(500).json({ message: "Failed to check status" });
    }
  });
  app2.get("/api/vacancies", async (req, res) => {
    try {
      const status = req.query.status;
      const vacancies2 = await storage.getAllVacancies(status);
      res.json(vacancies2);
    } catch (error) {
      console.error("Error fetching vacancies:", error);
      res.status(500).json({ message: "Failed to fetch vacancies" });
    }
  });
  app2.get("/api/vacancies/:id", async (req, res) => {
    try {
      const vacancy = await storage.getVacancy(req.params.id);
      if (!vacancy) {
        return res.status(404).json({ message: "Vacancy not found" });
      }
      res.json(vacancy);
    } catch (error) {
      console.error("Error fetching vacancy:", error);
      res.status(500).json({ message: "Failed to fetch vacancy" });
    }
  });
  const teacherApplicationSchema = z2.object({
    vacancyId: z2.string().optional().nullable(),
    fullName: z2.string().min(1),
    googleEmail: z2.string().email().regex(/@gmail\.com$/, "Must be a Gmail address"),
    phone: z2.string().min(1),
    subjectSpecialty: z2.string().min(1),
    qualification: z2.string().min(1),
    experienceYears: z2.number().min(0),
    bio: z2.string().min(1),
    resumeUrl: z2.string().optional().nullable()
  });
  app2.post("/api/teacher-applications", async (req, res) => {
    try {
      const validatedData = teacherApplicationSchema.parse(req.body);
      const existingApplications = await storage.getAllTeacherApplications();
      const existingApp = existingApplications.find(
        (app3) => app3.googleEmail === validatedData.googleEmail && (app3.status === "pending" || app3.status === "approved")
      );
      if (existingApp) {
        return res.status(400).json({
          message: existingApp.status === "approved" ? "This email has already been approved" : "You already have a pending application"
        });
      }
      const application = await storage.createTeacherApplication(validatedData);
      const admins = await storage.getUsersByRole(ROLES.ADMIN);
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "teacher_application",
          title: "New Teacher Application",
          message: `${validatedData.fullName} has applied for a teaching position`,
          relatedEntityType: "teacher_application",
          relatedEntityId: application.id
        });
      }
      res.status(201).json({
        message: "Application submitted successfully. You will be notified once reviewed.",
        application
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      console.error("Error submitting teacher application:", error);
      res.status(500).json({ message: "Failed to submit application" });
    }
  });
  app2.post("/api/admin/vacancies", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const vacancy = await storage.createVacancy({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(vacancy);
    } catch (error) {
      console.error("Error creating vacancy:", error);
      res.status(500).json({ message: "Failed to create vacancy" });
    }
  });
  app2.patch("/api/admin/vacancies/:id/close", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const vacancy = await storage.updateVacancy(req.params.id, { status: "closed" });
      if (!vacancy) {
        return res.status(404).json({ message: "Vacancy not found" });
      }
      res.json(vacancy);
    } catch (error) {
      console.error("Error closing vacancy:", error);
      res.status(500).json({ message: "Failed to close vacancy" });
    }
  });
  app2.get("/api/admin/applications", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const status = req.query.status;
      const applications = await storage.getAllTeacherApplications(status);
      res.json(applications);
    } catch (error) {
      console.error("Error fetching teacher applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });
  app2.patch("/api/admin/applications/:id/status", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { status } = req.body;
      if (status === "approved") {
        const result = await storage.approveTeacherApplication(req.params.id, req.user.id);
        const applicantUser = await storage.getUserByEmail(result.application.googleEmail);
        if (applicantUser) {
          await storage.createNotification({
            userId: applicantUser.id,
            type: "application_approved",
            title: "Application Approved",
            message: "Your teacher application has been approved. You can now sign in with Google.",
            relatedEntityType: "teacher_application",
            relatedEntityId: result.application.id
          });
        }
        res.json({
          message: "Application approved successfully",
          ...result
        });
      } else if (status === "rejected") {
        const { reason } = req.body;
        const application = await storage.rejectTeacherApplication(req.params.id, req.user.id, reason || "No reason provided");
        if (!application) {
          return res.status(404).json({ message: "Application not found" });
        }
        res.json({
          message: "Application rejected",
          application
        });
      } else {
        res.status(400).json({ message: "Invalid status" });
      }
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });
  app2.get("/api/admin/approved-teachers", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const approvedTeachers2 = await storage.getAllApprovedTeachers();
      res.json(approvedTeachers2);
    } catch (error) {
      console.error("Error fetching approved teachers:", error);
      res.status(500).json({ message: "Failed to fetch approved teachers" });
    }
  });
  if (process.env.NODE_ENV === "production" && process.env.FRONTEND_URL) {
    app2.get("*", (req, res) => {
      if (!req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
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
                <h1>\u{1F393} Treasure Home School</h1>
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
    emptyOutDir: true,
    chunkSizeWarningLimit: 1e3,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "radix-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-popover",
            "@radix-ui/react-scroll-area"
          ],
          "radix-ui-forms": [
            "@radix-ui/react-label",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-radio-group",
            "@radix-ui/react-slider",
            "@radix-ui/react-switch"
          ],
          "radix-ui-misc": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-avatar",
            "@radix-ui/react-hover-card",
            "@radix-ui/react-navigation-menu",
            "@radix-ui/react-progress",
            "@radix-ui/react-separator",
            "@radix-ui/react-tooltip"
          ],
          "supabase": ["@supabase/supabase-js"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "icons": ["lucide-react", "react-icons"],
          "animation": ["framer-motion", "canvas-confetti"],
          "charts": ["recharts"]
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    port: 5e3,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  },
  define: {
    // Auto-configure API URL based on environment
    // Development (Replit/Localhost): Use empty string for same-origin requests
    // Production (Vercel): Use VITE_API_URL env var (set to Render backend URL)
    "import.meta.env.VITE_API_URL": JSON.stringify(
      process.env.VITE_API_URL || ""
    )
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log2(message, source = "express") {
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
  app2.use(express.static(distPath, {
    maxAge: "1y",
    // 1 year for versioned assets (Vite adds hashes to filenames)
    etag: true,
    lastModified: true,
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache, must-revalidate");
      } else if (filePath.match(/\.(js|css|woff2?|ttf|eot)$/)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (filePath.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/)) {
        res.setHeader("Cache-Control", "public, max-age=86400");
      }
    }
  }));
  app2.use("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, must-revalidate");
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
init_storage();
import { migrate } from "drizzle-orm/postgres-js/migrator";

// server/seed-terms.ts
init_storage();
init_schema();
async function seedAcademicTerms() {
  try {
    console.log("\u{1F393} Checking for academic terms...");
    const existingTerms = await exportDb.select().from(academicTerms);
    if (existingTerms.length === 0) {
      console.log("\u{1F4DA} No terms found. Creating default academic terms...");
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
      const nextYear = currentYear + 1;
      const academicYear = `${currentYear}/${nextYear}`;
      const defaultTerms = [
        {
          name: "First Term",
          year: academicYear,
          startDate: `${currentYear}-09-01`,
          endDate: `${currentYear}-12-15`,
          isCurrent: true
        },
        {
          name: "Second Term",
          year: academicYear,
          startDate: `${nextYear}-01-06`,
          endDate: `${nextYear}-04-10`,
          isCurrent: false
        },
        {
          name: "Third Term",
          year: academicYear,
          startDate: `${nextYear}-04-21`,
          endDate: `${nextYear}-07-18`,
          isCurrent: false
        }
      ];
      for (const term of defaultTerms) {
        await exportDb.insert(academicTerms).values(term);
        console.log(`\u2705 Created term: ${term.name} (${term.year})`);
      }
      console.log("\u{1F393} Academic terms seeded successfully!");
    } else {
      console.log(`\u2705 Found ${existingTerms.length} existing academic terms`);
    }
  } catch (error) {
    console.error("\u274C Failed to seed academic terms:", error);
    throw error;
  }
}

// server/validate-env.ts
var ENV_VARS = [
  // Critical - Always Required
  {
    name: "DATABASE_URL",
    required: "always",
    description: "PostgreSQL connection string",
    validateFn: (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
    suggestion: "postgresql://user:password@host:port/database"
  },
  // Critical - Production Required
  {
    name: "NODE_ENV",
    required: "production",
    description: "Environment mode (production/development)",
    validateFn: (val) => ["production", "development"].includes(val),
    suggestion: "production"
  },
  {
    name: "JWT_SECRET",
    required: "production",
    description: "Secret for JWT token signing",
    validateFn: (val) => val.length >= 32,
    suggestion: "Generate with: openssl rand -base64 48"
  },
  {
    name: "SESSION_SECRET",
    required: "production",
    description: "Secret for session encryption",
    validateFn: (val) => val.length >= 32,
    suggestion: "Generate with: openssl rand -base64 48"
  },
  {
    name: "FRONTEND_URL",
    required: "production",
    description: "Frontend URL for CORS",
    validateFn: (val) => val.startsWith("http://") || val.startsWith("https://"),
    suggestion: "https://your-app.vercel.app"
  },
  {
    name: "BACKEND_URL",
    required: "production",
    description: "Backend URL for redirects",
    validateFn: (val) => val.startsWith("http://") || val.startsWith("https://"),
    suggestion: "https://your-backend.onrender.com"
  },
  // Critical - Supabase Storage
  {
    name: "SUPABASE_URL",
    required: "production",
    description: "Supabase project URL for file storage",
    validateFn: (val) => val.includes("supabase.co"),
    suggestion: "https://your-project.supabase.co"
  },
  {
    name: "SUPABASE_SERVICE_KEY",
    required: "production",
    description: "Supabase service role key for file storage",
    validateFn: (val) => val.length > 50,
    suggestion: "Get from Supabase Dashboard \u2192 Settings \u2192 API"
  },
  // Optional - Google OAuth
  {
    name: "GOOGLE_CLIENT_ID",
    required: "optional",
    description: "Google OAuth client ID",
    suggestion: "Get from Google Cloud Console"
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    required: "optional",
    description: "Google OAuth client secret",
    suggestion: "Get from Google Cloud Console"
  }
];
function validateEnvironment(exitOnError = false) {
  const isProduction = process.env.NODE_ENV === "production";
  const result = {
    missing: [],
    invalid: [],
    warnings: [],
    passed: []
  };
  console.log("\n\u{1F50D} Validating Environment Variables...\n");
  ENV_VARS.forEach((config) => {
    const value = process.env[config.name];
    const isRequired = config.required === "always" || config.required === "production" && isProduction;
    if (!value) {
      if (isRequired) {
        result.missing.push(config.name);
        console.error(`\u274C MISSING (${config.required.toUpperCase()}): ${config.name}`);
        console.error(`   ${config.description}`);
        if (config.suggestion) {
          console.error(`   Suggestion: ${config.suggestion}`);
        }
      } else if (config.required === "optional") {
        result.warnings.push(config.name);
        console.warn(`\u26A0\uFE0F  OPTIONAL: ${config.name} not set`);
        console.warn(`   ${config.description}`);
      }
      return;
    }
    if (config.validateFn && !config.validateFn(value)) {
      result.invalid.push(config.name);
      console.error(`\u274C INVALID: ${config.name}`);
      console.error(`   ${config.description}`);
      if (config.suggestion) {
        console.error(`   Expected format: ${config.suggestion}`);
      }
      return;
    }
    result.passed.push(config.name);
    const displayValue = config.name.includes("SECRET") || config.name.includes("KEY") || config.name.includes("PASSWORD") ? "***" + value.slice(-4) : value.slice(0, 50) + (value.length > 50 ? "..." : "");
    console.log(`\u2705 ${config.name}: ${displayValue}`);
  });
  console.log("\n\u{1F4CA} Validation Summary:");
  console.log(`   \u2705 Passed: ${result.passed.length}`);
  console.log(`   \u274C Missing: ${result.missing.length}`);
  console.log(`   \u274C Invalid: ${result.invalid.length}`);
  console.log(`   \u26A0\uFE0F  Warnings: ${result.warnings.length}`);
  const hasErrors = result.missing.length > 0 || result.invalid.length > 0;
  if (hasErrors) {
    console.error("\n\u{1F6A8} CRITICAL: Missing or invalid environment variables detected!");
    console.error("   Fix these issues before deploying to production.\n");
    if (isProduction && exitOnError) {
      console.error("   Exiting due to production environment validation failure...\n");
      process.exit(1);
    }
  } else {
    console.log("\n\u2705 All required environment variables are properly configured!\n");
  }
  return result;
}

// server/index.ts
validateEnvironment(false);
var app = express2();
app.set("trust proxy", 1);
var allowedOrigins = process.env.NODE_ENV === "development" ? [
  "http://localhost:5173",
  "http://localhost:5000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5000",
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.replit\.dev$/,
  ...process.env.REPLIT_DEV_DOMAIN ? [`https://${process.env.REPLIT_DEV_DOMAIN}`] : [],
  ...process.env.REPLIT_DOMAINS ? process.env.REPLIT_DOMAINS.split(",").map((d) => `https://${d.trim()}`) : []
] : [
  process.env.FRONTEND_URL,
  /^https:\/\/.*\.vercel\.app$/,
  // All Vercel deployments (production + preview)
  /^https:\/\/.*\.render\.com$/,
  /^https:\/\/.*\.onrender\.com$/,
  ...process.env.FRONTEND_URL ? [process.env.FRONTEND_URL.replace(/\/$/, "")] : []
].filter(Boolean);
var corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === "string") {
        return origin === allowed || origin === allowed.replace(/\/$/, "");
      }
      return allowed.test(origin);
    });
    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`\u26A0\uFE0F CORS: Rejected origin: ${origin}`);
      console.warn(`   Allowed origins:`, allowedOrigins);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Set-Cookie"]
};
app.use(cors(corsOptions));
app.use(compression({
  level: 6,
  // Compression level (0-9, 6 is balanced for speed vs compression)
  threshold: 1024,
  // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
app.use((req, res, next) => {
  req.setTimeout(3e4, () => {
    res.status(408).json({ message: "Request timeout" });
  });
  res.setTimeout(3e4, () => {
    res.status(408).json({ message: "Response timeout" });
  });
  next();
});
app.use(express2.json({ limit: "10mb" }));
app.use(express2.urlencoded({ extended: false, limit: "10mb" }));
app.use("/uploads", express2.static("uploads"));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  const isProduction = process.env.NODE_ENV === "production";
  let capturedJsonResponse = void 0;
  if (req.method === "GET" && path4.startsWith("/api/")) {
    if (path4.includes("/homepage-content") || path4.includes("/announcements")) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
    } else if (!path4.includes("/auth")) {
      res.setHeader("Cache-Control", "private, max-age=30");
    }
  }
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
      log2(logLine);
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
    log2("Applying database migrations...");
    await migrate(exportDb, { migrationsFolder: "./migrations" });
    log2("\u2705 Database migrations completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorCode = error?.cause?.code;
    const isIdempotencyError = errorMessage.includes("already exists") || errorMessage.includes("relation") && errorMessage.includes("already exists") || errorMessage.includes("duplicate key") || errorMessage.includes("nothing to migrate") || errorMessage.includes("PostgresError: relation") || errorCode === "42P07" || // relation already exists
    errorCode === "42710";
    if (isIdempotencyError) {
      log2(`\u2139\uFE0F Migrations already applied: ${errorMessage}`);
    } else {
      console.error(`\u{1F6A8} MIGRATION ERROR: ${errorMessage}`);
      console.error(error);
      log2(`\u26A0\uFE0F Migration failed: ${errorMessage}`);
      if (process.env.NODE_ENV === "production") {
        console.error("Production migration failure detected. Review required.");
      }
    }
  }
  try {
    log2("Seeding academic terms if needed...");
    await seedAcademicTerms();
    log2("\u2705 Academic terms seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u{1F6A8} ACADEMIC TERMS SEEDING ERROR: ${errorMessage}`);
    console.error(error);
    log2(`\u26A0\uFE0F Academic terms seeding failed: ${errorMessage}`);
  }
  try {
    const { storage: storage2 } = await Promise.resolve().then(() => (init_storage(), storage_exports));
    const existingSetting = await storage2.getSetting("allow_student_self_registration");
    if (!existingSetting) {
      await storage2.createSetting({
        key: "allow_student_self_registration",
        value: "true",
        description: "Allow students to self-register with automatic parent account creation",
        dataType: "boolean"
      });
      log2("\u2705 Student self-registration setting initialized");
    } else {
      log2("\u2139\uFE0F Student self-registration setting already exists");
    }
  } catch (error) {
    log2(`\u2139\uFE0F Registration setting initialization skipped (table may not exist): ${error instanceof Error ? error.message : error}`);
  }
  app.all(["/api/update-demo-users", "/api/test-update"], (req, res) => {
    log2(`\u{1F6A8} BLOCKED dangerous route: ${req.method} ${req.path}`);
    res.status(410).json({ message: "Gone - Route disabled for security" });
  });
  const server = await registerRoutes(app);
  app.use((err, req, res, next) => {
    if (err.name === "MulterError" || err.message?.includes("Only image files") || err.message?.includes("Only document files") || err.message?.includes("Only CSV files")) {
      log2(`MULTER ERROR: ${req.method} ${req.path} - ${err.message}`);
      let status = 400;
      let message = err.message;
      if (err.code === "LIMIT_FILE_SIZE") {
        message = "File size exceeds the maximum allowed limit";
      } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message = "Unexpected file field";
      }
      return res.status(status).json({ message });
    }
    next(err);
  });
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log2(`ERROR: ${req.method} ${req.path} - ${err.message}`);
    console.error(err.stack);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
  const isReplit = !!process.env.REPLIT_DEV_DOMAIN;
  if (app.get("env") === "development" || isReplit) {
    await setupVite(app, server);
  } else if (!process.env.FRONTEND_URL) {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log2(`serving on port ${port}`);
  });
})();
