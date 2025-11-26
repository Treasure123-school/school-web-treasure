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
  approvedTeachers: () => approvedTeachers,
  attendance: () => attendance,
  auditLogs: () => auditLogs,
  classes: () => classes,
  contactMessages: () => contactMessages,
  counters: () => counters,
  createQuestionOptionSchema: () => createQuestionOptionSchema,
  createStudentSchema: () => createStudentSchema,
  createStudentWithAutoCredsSchema: () => createStudentWithAutoCredsSchema,
  csvStudentSchema: () => csvStudentSchema,
  examQuestions: () => examQuestions,
  examResults: () => examResults,
  examSessions: () => examSessions,
  exams: () => exams,
  gallery: () => gallery,
  galleryCategories: () => galleryCategories,
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
  insertQuestionBankItemSchema: () => insertQuestionBankItemSchema,
  insertQuestionBankOptionSchema: () => insertQuestionBankOptionSchema,
  insertQuestionBankSchema: () => insertQuestionBankSchema,
  insertQuestionOptionSchema: () => insertQuestionOptionSchema,
  insertReportCardItemSchema: () => insertReportCardItemSchema,
  insertReportCardSchema: () => insertReportCardSchema,
  insertRoleSchema: () => insertRoleSchema,
  insertSettingSchema: () => insertSettingSchema,
  insertStudentAnswerSchema: () => insertStudentAnswerSchema,
  insertStudentSchema: () => insertStudentSchema,
  insertStudyResourceSchema: () => insertStudyResourceSchema,
  insertSubjectSchema: () => insertSubjectSchema,
  insertSuperAdminProfileSchema: () => insertSuperAdminProfileSchema,
  insertSystemSettingsSchema: () => insertSystemSettingsSchema,
  insertTeacherApplicationSchema: () => insertTeacherApplicationSchema,
  insertTeacherClassAssignmentSchema: () => insertTeacherClassAssignmentSchema,
  insertTeacherProfileSchema: () => insertTeacherProfileSchema,
  insertTimetableSchema: () => insertTimetableSchema,
  insertUserSchema: () => insertUserSchema,
  insertVacancySchema: () => insertVacancySchema,
  invites: () => invites,
  messages: () => messages,
  notifications: () => notifications,
  parentProfiles: () => parentProfiles,
  passwordResetAttempts: () => passwordResetAttempts,
  passwordResetTokens: () => passwordResetTokens,
  performanceEvents: () => performanceEvents,
  questionBankItems: () => questionBankItems,
  questionBankOptions: () => questionBankOptions,
  questionBanks: () => questionBanks,
  questionOptions: () => questionOptions,
  reportCardItems: () => reportCardItems,
  reportCards: () => reportCards,
  roles: () => roles,
  settings: () => settings,
  studentAnswers: () => studentAnswers,
  students: () => students,
  studyResources: () => studyResources,
  subjects: () => subjects,
  superAdminProfiles: () => superAdminProfiles,
  systemSettings: () => systemSettings,
  teacherApplications: () => teacherApplications,
  teacherClassAssignments: () => teacherClassAssignments,
  teacherProfiles: () => teacherProfiles,
  timetable: () => timetable,
  updateExamSessionSchema: () => updateExamSessionSchema,
  users: () => users,
  vacancies: () => vacancies
});
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var roles, users, passwordResetTokens, passwordResetAttempts, invites, notifications, academicTerms, classes, subjects, students, teacherProfiles, adminProfiles, parentProfiles, superAdminProfiles, systemSettings, attendance, exams, examQuestions, questionOptions, examSessions, studentAnswers, examResults, questionBanks, questionBankItems, questionBankOptions, announcements, messages, galleryCategories, gallery, homePageContent, contactMessages, reportCards, reportCardItems, studyResources, performanceEvents, teacherClassAssignments, timetable, gradingTasks, auditLogs, settings, counters, vacancies, teacherApplications, approvedTeachers, insertRoleSchema, insertUserSchema, insertPasswordResetTokenSchema, insertPasswordResetAttemptSchema, insertInviteSchema, insertStudentSchema, insertClassSchema, insertSubjectSchema, insertAcademicTermSchema, insertAttendanceSchema, insertExamSchema, insertExamResultSchema, insertAnnouncementSchema, insertMessageSchema, insertGalleryCategorySchema, insertGallerySchema, insertHomePageContentSchema, insertContactMessageSchema, insertReportCardSchema, insertReportCardItemSchema, insertStudyResourceSchema, insertPerformanceEventSchema, insertTeacherClassAssignmentSchema, insertTimetableSchema, insertGradingTaskSchema, insertAuditLogSchema, insertSettingSchema, insertCounterSchema, createStudentWithAutoCredsSchema, createStudentSchema, csvStudentSchema, insertExamQuestionSchema, insertQuestionOptionSchema, createQuestionOptionSchema, insertExamSessionSchema, updateExamSessionSchema, insertStudentAnswerSchema, insertNotificationSchema, insertTeacherProfileSchema, insertAdminProfileSchema, insertParentProfileSchema, insertVacancySchema, insertTeacherApplicationSchema, insertApprovedTeacherSchema, insertSuperAdminProfileSchema, insertSystemSettingsSchema, insertQuestionBankSchema, insertQuestionBankItemSchema, insertQuestionBankOptionSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    roles = sqliteTable("roles", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull().unique(),
      permissions: text("permissions").notNull().default("[]"),
      // JSON array as text
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    users = sqliteTable("users", {
      id: text("id").primaryKey(),
      username: text("username").unique(),
      email: text("email").notNull(),
      recoveryEmail: text("recovery_email"),
      passwordHash: text("password_hash"),
      mustChangePassword: integer("must_change_password", { mode: "boolean" }).notNull().default(true),
      roleId: integer("role_id").notNull().references(() => roles.id),
      firstName: text("first_name").notNull(),
      lastName: text("last_name").notNull(),
      phone: text("phone"),
      address: text("address"),
      dateOfBirth: text("date_of_birth"),
      // YYYY-MM-DD format
      gender: text("gender"),
      // 'Male', 'Female', 'Other'
      nationalId: text("national_id"),
      profileImageUrl: text("profile_image_url"),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      authProvider: text("auth_provider").notNull().default("local"),
      googleId: text("google_id").unique(),
      // Security & audit fields
      status: text("status").notNull().default("active"),
      // 'pending', 'active', 'suspended', 'disabled'
      createdVia: text("created_via").notNull().default("admin"),
      // 'bulk', 'invite', 'self', 'google', 'admin'
      createdBy: text("created_by"),
      approvedBy: text("approved_by"),
      approvedAt: integer("approved_at", { mode: "timestamp" }),
      lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
      lastLoginIp: text("last_login_ip"),
      mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
      mfaSecret: text("mfa_secret"),
      accountLockedUntil: integer("account_locked_until", { mode: "timestamp" }),
      // Profile completion fields
      profileCompleted: integer("profile_completed", { mode: "boolean" }).notNull().default(false),
      profileSkipped: integer("profile_skipped", { mode: "boolean" }).notNull().default(false),
      profileCompletionPercentage: integer("profile_completion_percentage").notNull().default(0),
      state: text("state"),
      country: text("country"),
      securityQuestion: text("security_question"),
      securityAnswerHash: text("security_answer_hash"),
      dataPolicyAgreed: integer("data_policy_agreed", { mode: "boolean" }).notNull().default(false),
      dataPolicyAgreedAt: integer("data_policy_agreed_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      usersEmailIdx: index("users_email_idx").on(table.email),
      usersStatusIdx: index("users_status_idx").on(table.status),
      usersGoogleIdIdx: index("users_google_id_idx").on(table.googleId),
      usersRoleIdIdx: index("users_role_id_idx").on(table.roleId),
      usersUsernameIdx: index("users_username_idx").on(table.username)
    }));
    passwordResetTokens = sqliteTable("password_reset_tokens", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      token: text("token").notNull().unique(),
      expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
      usedAt: integer("used_at", { mode: "timestamp" }),
      ipAddress: text("ip_address"),
      resetBy: text("reset_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      passwordResetTokensUserIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
      passwordResetTokensTokenIdx: index("password_reset_tokens_token_idx").on(table.token)
    }));
    passwordResetAttempts = sqliteTable("password_reset_attempts", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      identifier: text("identifier").notNull(),
      ipAddress: text("ip_address").notNull(),
      attemptedAt: integer("attempted_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      success: integer("success", { mode: "boolean" }).notNull().default(false)
    }, (table) => ({
      passwordResetAttemptsIdentifierIdx: index("password_reset_attempts_identifier_idx").on(table.identifier),
      passwordResetAttemptsIpIdx: index("password_reset_attempts_ip_idx").on(table.ipAddress),
      passwordResetAttemptsTimeIdx: index("password_reset_attempts_time_idx").on(table.attemptedAt)
    }));
    invites = sqliteTable("invites", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      token: text("token").notNull().unique(),
      email: text("email").notNull(),
      roleId: integer("role_id").notNull().references(() => roles.id),
      createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
      expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
      acceptedAt: integer("accepted_at", { mode: "timestamp" }),
      acceptedBy: text("accepted_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      invitesTokenIdx: index("invites_token_idx").on(table.token),
      invitesEmailIdx: index("invites_email_idx").on(table.email)
    }));
    notifications = sqliteTable("notifications", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      type: text("type").notNull(),
      title: text("title").notNull(),
      message: text("message").notNull(),
      relatedEntityType: text("related_entity_type"),
      relatedEntityId: text("related_entity_id"),
      isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      notificationsUserIdIdx: index("notifications_user_id_idx").on(table.userId),
      notificationsIsReadIdx: index("notifications_is_read_idx").on(table.isRead)
    }));
    academicTerms = sqliteTable("academic_terms", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      year: text("year").notNull(),
      startDate: text("start_date").notNull(),
      // YYYY-MM-DD format
      endDate: text("end_date").notNull(),
      isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    classes = sqliteTable("classes", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull().unique(),
      level: text("level").notNull(),
      capacity: integer("capacity").notNull().default(30),
      classTeacherId: text("class_teacher_id").references(() => users.id, { onDelete: "set null" }),
      currentTermId: integer("current_term_id").references(() => academicTerms.id),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    subjects = sqliteTable("subjects", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      code: text("code").notNull().unique(),
      description: text("description"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    students = sqliteTable("students", {
      id: text("id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
      admissionNumber: text("admission_number").notNull().unique(),
      classId: integer("class_id").references(() => classes.id),
      parentId: text("parent_id").references(() => users.id, { onDelete: "set null" }),
      admissionDate: text("admission_date").notNull(),
      // YYYY-MM-DD format
      emergencyContact: text("emergency_contact"),
      emergencyPhone: text("emergency_phone"),
      medicalInfo: text("medical_info"),
      guardianName: text("guardian_name"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    teacherProfiles = sqliteTable("teacher_profiles", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      staffId: text("staff_id").unique(),
      subjects: text("subjects").notNull().default("[]"),
      // JSON array of integers
      assignedClasses: text("assigned_classes").notNull().default("[]"),
      // JSON array of integers
      qualification: text("qualification"),
      yearsOfExperience: integer("years_of_experience").notNull().default(0),
      specialization: text("specialization"),
      department: text("department"),
      signatureUrl: text("signature_url"),
      gradingMode: text("grading_mode").notNull().default("manual"),
      autoGradeTheoryQuestions: integer("auto_grade_theory_questions", { mode: "boolean" }).notNull().default(false),
      theoryGradingInstructions: text("theory_grading_instructions"),
      notificationPreference: text("notification_preference").notNull().default("all"),
      availability: text("availability"),
      firstLogin: integer("first_login", { mode: "boolean" }).notNull().default(true),
      verified: integer("verified", { mode: "boolean" }).notNull().default(false),
      verifiedBy: text("verified_by").references(() => users.id, { onDelete: "set null" }),
      verifiedAt: integer("verified_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    adminProfiles = sqliteTable("admin_profiles", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      department: text("department"),
      roleDescription: text("role_description"),
      accessLevel: text("access_level"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    parentProfiles = sqliteTable("parent_profiles", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      occupation: text("occupation"),
      contactPreference: text("contact_preference"),
      linkedStudents: text("linked_students").notNull().default("[]"),
      // JSON array of UUIDs
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    superAdminProfiles = sqliteTable("super_admin_profiles", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
      department: text("department"),
      accessLevel: text("access_level").notNull().default("full"),
      twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
      twoFactorSecret: text("two_factor_secret"),
      lastPasswordChange: integer("last_password_change", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    systemSettings = sqliteTable("system_settings", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      schoolName: text("school_name"),
      schoolMotto: text("school_motto"),
      schoolLogo: text("school_logo"),
      schoolEmail: text("school_email"),
      schoolPhone: text("school_phone"),
      schoolAddress: text("school_address"),
      maintenanceMode: integer("maintenance_mode", { mode: "boolean" }).notNull().default(false),
      maintenanceModeMessage: text("maintenance_mode_message"),
      enableSmsNotifications: integer("enable_sms_notifications", { mode: "boolean" }).notNull().default(false),
      enableEmailNotifications: integer("enable_email_notifications", { mode: "boolean" }).notNull().default(true),
      enableExamsModule: integer("enable_exams_module", { mode: "boolean" }).notNull().default(true),
      enableAttendanceModule: integer("enable_attendance_module", { mode: "boolean" }).notNull().default(true),
      enableResultsModule: integer("enable_results_module", { mode: "boolean" }).notNull().default(true),
      themeColor: text("theme_color").notNull().default("blue"),
      favicon: text("favicon"),
      usernameStudentPrefix: text("username_student_prefix").notNull().default("THS-STU"),
      usernameParentPrefix: text("username_parent_prefix").notNull().default("THS-PAR"),
      usernameTeacherPrefix: text("username_teacher_prefix").notNull().default("THS-TCH"),
      usernameAdminPrefix: text("username_admin_prefix").notNull().default("THS-ADM"),
      tempPasswordFormat: text("temp_password_format").notNull().default("THS@{year}#{random4}"),
      hideAdminAccountsFromAdmins: integer("hide_admin_accounts_from_admins", { mode: "boolean" }).notNull().default(true),
      updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    attendance = sqliteTable("attendance", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
      classId: integer("class_id").notNull().references(() => classes.id),
      date: text("date").notNull(),
      // YYYY-MM-DD format
      status: text("status").notNull(),
      // 'Present', 'Absent', 'Late', 'Excused'
      recordedBy: text("recorded_by").references(() => users.id, { onDelete: "set null" }),
      notes: text("notes"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    exams = sqliteTable("exams", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      classId: integer("class_id").notNull().references(() => classes.id),
      subjectId: integer("subject_id").notNull().references(() => subjects.id),
      totalMarks: integer("total_marks").notNull(),
      date: text("date").notNull(),
      // YYYY-MM-DD format
      termId: integer("term_id").notNull().references(() => academicTerms.id),
      createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
      teacherInChargeId: text("teacher_in_charge_id").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      examType: text("exam_type").notNull().default("exam"),
      // 'test', 'exam'
      timerMode: text("timer_mode").notNull().default("individual"),
      // 'global', 'individual'
      timeLimit: integer("time_limit"),
      // in minutes
      startTime: integer("start_time", { mode: "timestamp" }),
      endTime: integer("end_time", { mode: "timestamp" }),
      instructions: text("instructions"),
      isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
      allowRetakes: integer("allow_retakes", { mode: "boolean" }).notNull().default(false),
      shuffleQuestions: integer("shuffle_questions", { mode: "boolean" }).notNull().default(false),
      autoGradingEnabled: integer("auto_grading_enabled", { mode: "boolean" }).notNull().default(true),
      instantFeedback: integer("instant_feedback", { mode: "boolean" }).notNull().default(false),
      showCorrectAnswers: integer("show_correct_answers", { mode: "boolean" }).notNull().default(false),
      passingScore: integer("passing_score"),
      gradingScale: text("grading_scale").notNull().default("standard"),
      enableProctoring: integer("enable_proctoring", { mode: "boolean" }).notNull().default(false),
      lockdownMode: integer("lockdown_mode", { mode: "boolean" }).notNull().default(false),
      requireWebcam: integer("require_webcam", { mode: "boolean" }).notNull().default(false),
      requireFullscreen: integer("require_fullscreen", { mode: "boolean" }).notNull().default(false),
      maxTabSwitches: integer("max_tab_switches").notNull().default(3),
      shuffleOptions: integer("shuffle_options", { mode: "boolean" }).notNull().default(false)
    });
    examQuestions = sqliteTable("exam_questions", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      examId: integer("exam_id").notNull().references(() => exams.id),
      questionText: text("question_text").notNull(),
      questionType: text("question_type").notNull(),
      // 'multiple_choice', 'text', 'essay', 'true_false', 'fill_blank'
      points: integer("points").notNull().default(1),
      orderNumber: integer("order_number").notNull(),
      imageUrl: text("image_url"),
      autoGradable: integer("auto_gradable", { mode: "boolean" }).notNull().default(true),
      expectedAnswers: text("expected_answers").notNull().default("[]"),
      // JSON array
      caseSensitive: integer("case_sensitive", { mode: "boolean" }).notNull().default(false),
      allowPartialCredit: integer("allow_partial_credit", { mode: "boolean" }).notNull().default(false),
      partialCreditRules: text("partial_credit_rules"),
      explanationText: text("explanation_text"),
      hintText: text("hint_text"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      examQuestionsExamIdIdx: index("exam_questions_exam_id_idx").on(table.examId),
      examQuestionsOrderIdx: index("exam_questions_order_idx").on(table.examId, table.orderNumber)
    }));
    questionOptions = sqliteTable("question_options", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      questionId: integer("question_id").notNull().references(() => examQuestions.id),
      optionText: text("option_text").notNull(),
      isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
      orderNumber: integer("order_number").notNull(),
      partialCreditValue: integer("partial_credit_value").notNull().default(0),
      explanationText: text("explanation_text"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      questionOptionsQuestionIdIdx: index("question_options_question_id_idx").on(table.questionId),
      questionOptionsCorrectIdx: index("question_options_correct_idx").on(table.questionId, table.isCorrect)
    }));
    examSessions = sqliteTable("exam_sessions", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      examId: integer("exam_id").notNull().references(() => exams.id),
      studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
      startedAt: integer("started_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      submittedAt: integer("submitted_at", { mode: "timestamp" }),
      timeRemaining: integer("time_remaining"),
      isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
      score: integer("score"),
      maxScore: integer("max_score"),
      status: text("status").notNull().default("in_progress"),
      // 'in_progress', 'submitted', 'graded'
      metadata: text("metadata"),
      // JSON string
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      examSessionsExamStudentIdx: index("exam_sessions_exam_student_idx").on(table.examId, table.studentId),
      examSessionsStudentCompletedIdx: index("exam_sessions_student_completed_idx").on(table.studentId, table.isCompleted),
      examSessionsActiveSessionsIdx: index("exam_sessions_active_idx").on(table.examId, table.studentId, table.isCompleted)
    }));
    studentAnswers = sqliteTable("student_answers", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      sessionId: integer("session_id").notNull().references(() => examSessions.id),
      questionId: integer("question_id").notNull().references(() => examQuestions.id),
      selectedOptionId: integer("selected_option_id").references(() => questionOptions.id),
      textAnswer: text("text_answer"),
      isCorrect: integer("is_correct", { mode: "boolean" }),
      pointsEarned: integer("points_earned").notNull().default(0),
      answeredAt: integer("answered_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      autoScored: integer("auto_scored", { mode: "boolean" }).notNull().default(false),
      manualOverride: integer("manual_override", { mode: "boolean" }).notNull().default(false),
      feedbackText: text("feedback_text"),
      partialCreditReason: text("partial_credit_reason")
    }, (table) => ({
      studentAnswersSessionIdIdx: index("student_answers_session_id_idx").on(table.sessionId),
      studentAnswersSessionQuestionIdx: index("student_answers_session_question_idx").on(table.sessionId, table.questionId),
      studentAnswersQuestionIdx: index("student_answers_question_id_idx").on(table.questionId)
    }));
    examResults = sqliteTable("exam_results", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      examId: integer("exam_id").notNull().references(() => exams.id),
      studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
      score: integer("score"),
      maxScore: integer("max_score"),
      marksObtained: integer("marks_obtained"),
      grade: text("grade"),
      remarks: text("remarks"),
      autoScored: integer("auto_scored", { mode: "boolean" }).notNull().default(false),
      recordedBy: text("recorded_by").notNull().references(() => users.id),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      examResultsExamIdIdx: index("exam_results_exam_id_idx").on(table.examId),
      examResultsStudentIdIdx: index("exam_results_student_id_idx").on(table.studentId),
      examResultsExamStudentIdx: index("exam_results_exam_student_idx").on(table.examId, table.studentId),
      examResultsAutoScoredIdx: index("exam_results_auto_scored_idx").on(table.autoScored, table.examId)
    }));
    questionBanks = sqliteTable("question_banks", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      description: text("description"),
      subjectId: integer("subject_id").notNull().references(() => subjects.id),
      classLevel: text("class_level"),
      createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
      isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      questionBanksSubjectIdx: index("question_banks_subject_idx").on(table.subjectId),
      questionBanksCreatedByIdx: index("question_banks_created_by_idx").on(table.createdBy)
    }));
    questionBankItems = sqliteTable("question_bank_items", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      bankId: integer("bank_id").notNull().references(() => questionBanks.id, { onDelete: "cascade" }),
      questionText: text("question_text").notNull(),
      questionType: text("question_type").notNull(),
      points: integer("points").notNull().default(1),
      difficulty: text("difficulty").notNull().default("medium"),
      tags: text("tags").notNull().default("[]"),
      // JSON array
      imageUrl: text("image_url"),
      autoGradable: integer("auto_gradable", { mode: "boolean" }).notNull().default(true),
      expectedAnswers: text("expected_answers").notNull().default("[]"),
      // JSON array
      caseSensitive: integer("case_sensitive", { mode: "boolean" }).notNull().default(false),
      explanationText: text("explanation_text"),
      hintText: text("hint_text"),
      practicalInstructions: text("practical_instructions"),
      practicalFileUrl: text("practical_file_url"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      questionBankItemsBankIdIdx: index("question_bank_items_bank_id_idx").on(table.bankId),
      questionBankItemsTypeIdx: index("question_bank_items_type_idx").on(table.questionType),
      questionBankItemsDifficultyIdx: index("question_bank_items_difficulty_idx").on(table.difficulty)
    }));
    questionBankOptions = sqliteTable("question_bank_options", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      questionItemId: integer("question_item_id").notNull().references(() => questionBankItems.id, { onDelete: "cascade" }),
      optionText: text("option_text").notNull(),
      isCorrect: integer("is_correct", { mode: "boolean" }).notNull().default(false),
      orderNumber: integer("order_number").notNull(),
      explanationText: text("explanation_text"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      questionBankOptionsItemIdIdx: index("question_bank_options_item_id_idx").on(table.questionItemId)
    }));
    announcements = sqliteTable("announcements", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      title: text("title").notNull(),
      content: text("content").notNull(),
      authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
      targetRoles: text("target_roles").notNull().default('["All"]'),
      // JSON array
      targetClasses: text("target_classes").notNull().default("[]"),
      // JSON array
      isPublished: integer("is_published", { mode: "boolean" }).notNull().default(false),
      publishedAt: integer("published_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    messages = sqliteTable("messages", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      senderId: text("sender_id").references(() => users.id, { onDelete: "set null" }),
      recipientId: text("recipient_id").references(() => users.id, { onDelete: "set null" }),
      subject: text("subject").notNull(),
      content: text("content").notNull(),
      isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    galleryCategories = sqliteTable("gallery_categories", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      description: text("description"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    gallery = sqliteTable("gallery", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      imageUrl: text("image_url").notNull(),
      caption: text("caption"),
      categoryId: integer("category_id").references(() => galleryCategories.id),
      uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    homePageContent = sqliteTable("home_page_content", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      contentType: text("content_type").notNull(),
      imageUrl: text("image_url"),
      altText: text("alt_text"),
      caption: text("caption"),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      displayOrder: integer("display_order").notNull().default(0),
      uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    contactMessages = sqliteTable("contact_messages", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      name: text("name").notNull(),
      email: text("email").notNull(),
      subject: text("subject"),
      message: text("message").notNull(),
      isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
      respondedAt: integer("responded_at", { mode: "timestamp" }),
      respondedBy: text("responded_by").references(() => users.id, { onDelete: "set null" }),
      response: text("response"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    reportCards = sqliteTable("report_cards", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
      classId: integer("class_id").notNull().references(() => classes.id),
      termId: integer("term_id").notNull().references(() => academicTerms.id),
      averagePercentage: integer("average_percentage"),
      overallGrade: text("overall_grade"),
      teacherRemarks: text("teacher_remarks"),
      status: text("status").notNull().default("draft"),
      // 'draft', 'finalized', 'published'
      locked: integer("locked", { mode: "boolean" }).notNull().default(false),
      generatedAt: integer("generated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      finalizedAt: integer("finalized_at", { mode: "timestamp" }),
      publishedAt: integer("published_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    reportCardItems = sqliteTable("report_card_items", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      reportCardId: integer("report_card_id").notNull().references(() => reportCards.id),
      subjectId: integer("subject_id").notNull().references(() => subjects.id),
      testExamId: integer("test_exam_id").references(() => exams.id),
      testScore: integer("test_score"),
      testMaxScore: integer("test_max_score"),
      testWeightedScore: integer("test_weighted_score"),
      examExamId: integer("exam_exam_id").references(() => exams.id),
      examScore: integer("exam_score"),
      examMaxScore: integer("exam_max_score"),
      examWeightedScore: integer("exam_weighted_score"),
      totalMarks: integer("total_marks").notNull().default(100),
      obtainedMarks: integer("obtained_marks").notNull(),
      percentage: integer("percentage").notNull(),
      grade: text("grade"),
      teacherRemarks: text("teacher_remarks"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    studyResources = sqliteTable("study_resources", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      title: text("title").notNull(),
      description: text("description"),
      fileUrl: text("file_url").notNull(),
      fileName: text("file_name").notNull(),
      fileSize: integer("file_size"),
      resourceType: text("resource_type").notNull(),
      subjectId: integer("subject_id").references(() => subjects.id),
      classId: integer("class_id").references(() => classes.id),
      termId: integer("term_id").references(() => academicTerms.id),
      uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
      isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
      downloads: integer("downloads").notNull().default(0),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    });
    performanceEvents = sqliteTable("performance_events", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      sessionId: integer("session_id").references(() => examSessions.id),
      eventType: text("event_type").notNull(),
      duration: integer("duration").notNull(),
      goalAchieved: integer("goal_achieved", { mode: "boolean" }).notNull(),
      metadata: text("metadata"),
      clientSide: integer("client_side", { mode: "boolean" }).notNull().default(false),
      userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      performanceEventsTypeIdx: index("performance_events_type_idx").on(table.eventType),
      performanceEventsDateIdx: index("performance_events_date_idx").on(table.createdAt),
      performanceEventsGoalIdx: index("performance_events_goal_idx").on(table.goalAchieved, table.eventType)
    }));
    teacherClassAssignments = sqliteTable("teacher_class_assignments", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      classId: integer("class_id").notNull().references(() => classes.id),
      subjectId: integer("subject_id").notNull().references(() => subjects.id),
      termId: integer("term_id").references(() => academicTerms.id),
      assignedBy: text("assigned_by").references(() => users.id, { onDelete: "set null" }),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      teacherAssignmentsTeacherIdx: index("teacher_assignments_teacher_idx").on(table.teacherId, table.isActive),
      teacherAssignmentsClassSubjectIdx: index("teacher_assignments_class_subject_idx").on(table.classId, table.subjectId)
    }));
    timetable = sqliteTable("timetable", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      teacherId: text("teacher_id").notNull().references(() => users.id, { onDelete: "cascade" }),
      classId: integer("class_id").notNull().references(() => classes.id),
      subjectId: integer("subject_id").notNull().references(() => subjects.id),
      dayOfWeek: text("day_of_week").notNull(),
      startTime: text("start_time").notNull(),
      endTime: text("end_time").notNull(),
      location: text("location"),
      termId: integer("term_id").references(() => academicTerms.id),
      isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      timetableTeacherIdx: index("timetable_teacher_idx").on(table.teacherId, table.isActive),
      timetableDayIdx: index("timetable_day_idx").on(table.dayOfWeek, table.teacherId)
    }));
    gradingTasks = sqliteTable("grading_tasks", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      sessionId: integer("session_id").notNull().references(() => examSessions.id, { onDelete: "cascade" }),
      answerId: integer("answer_id").notNull().references(() => studentAnswers.id, { onDelete: "cascade" }),
      assignedTeacherId: text("assigned_teacher_id").references(() => users.id, { onDelete: "set null" }),
      status: text("status").notNull().default("pending"),
      priority: integer("priority").notNull().default(0),
      assignedAt: integer("assigned_at", { mode: "timestamp" }),
      startedAt: integer("started_at", { mode: "timestamp" }),
      completedAt: integer("completed_at", { mode: "timestamp" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      gradingTasksAssignedIdx: index("grading_tasks_assigned_idx").on(table.assignedTeacherId, table.status),
      gradingTasksStatusIdx: index("grading_tasks_status_idx").on(table.status, table.priority),
      gradingTasksSessionIdx: index("grading_tasks_session_idx").on(table.sessionId),
      gradingTasksAnswerUniqueIdx: uniqueIndex("grading_tasks_answer_unique_idx").on(table.answerId)
    }));
    auditLogs = sqliteTable("audit_logs", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
      action: text("action").notNull(),
      entityType: text("entity_type").notNull(),
      entityId: text("entity_id").notNull(),
      oldValue: text("old_value"),
      newValue: text("new_value"),
      reason: text("reason"),
      ipAddress: text("ip_address"),
      userAgent: text("user_agent"),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      auditLogsUserIdx: index("audit_logs_user_idx").on(table.userId),
      auditLogsEntityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
      auditLogsDateIdx: index("audit_logs_date_idx").on(table.createdAt),
      auditLogsActionIdx: index("audit_logs_action_idx").on(table.action)
    }));
    settings = sqliteTable("settings", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      key: text("key").notNull().unique(),
      value: text("value").notNull(),
      description: text("description"),
      dataType: text("data_type").notNull().default("string"),
      updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      settingsKeyIdx: index("settings_key_idx").on(table.key)
    }));
    counters = sqliteTable("counters", {
      id: integer("id").primaryKey({ autoIncrement: true }),
      roleCode: text("role_code"),
      classCode: text("class_code"),
      year: text("year"),
      sequence: integer("sequence").notNull().default(0),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      countersRoleCodeIdx: uniqueIndex("counters_role_code_idx").on(table.roleCode)
    }));
    vacancies = sqliteTable("vacancies", {
      id: text("id").primaryKey(),
      title: text("title").notNull(),
      description: text("description").notNull(),
      requirements: text("requirements"),
      deadline: integer("deadline", { mode: "timestamp" }).notNull(),
      status: text("status").notNull().default("open"),
      // 'open', 'closed', 'filled'
      createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      vacanciesStatusIdx: index("vacancies_status_idx").on(table.status),
      vacanciesDeadlineIdx: index("vacancies_deadline_idx").on(table.deadline)
    }));
    teacherApplications = sqliteTable("teacher_applications", {
      id: text("id").primaryKey(),
      vacancyId: text("vacancy_id").references(() => vacancies.id, { onDelete: "set null" }),
      fullName: text("full_name").notNull(),
      googleEmail: text("google_email").notNull(),
      phone: text("phone").notNull(),
      subjectSpecialty: text("subject_specialty").notNull(),
      qualification: text("qualification").notNull(),
      experienceYears: integer("experience_years").notNull(),
      bio: text("bio").notNull(),
      resumeUrl: text("resume_url"),
      status: text("status").notNull().default("pending"),
      // 'pending', 'approved', 'rejected'
      reviewedBy: text("reviewed_by").references(() => users.id, { onDelete: "set null" }),
      reviewedAt: integer("reviewed_at", { mode: "timestamp" }),
      rejectionReason: text("rejection_reason"),
      dateApplied: integer("date_applied", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      teacherApplicationsStatusIdx: index("teacher_applications_status_idx").on(table.status),
      teacherApplicationsEmailIdx: index("teacher_applications_email_idx").on(table.googleEmail),
      teacherApplicationsVacancyIdx: index("teacher_applications_vacancy_idx").on(table.vacancyId)
    }));
    approvedTeachers = sqliteTable("approved_teachers", {
      id: text("id").primaryKey(),
      applicationId: text("application_id").references(() => teacherApplications.id, { onDelete: "set null" }),
      googleEmail: text("google_email").notNull().unique(),
      fullName: text("full_name").notNull(),
      subjectSpecialty: text("subject_specialty"),
      approvedBy: text("approved_by").references(() => users.id, { onDelete: "set null" }),
      dateApproved: integer("date_approved", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
      createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    }, (table) => ({
      approvedTeachersEmailIdx: index("approved_teachers_email_idx").on(table.googleEmail)
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
      name: z.string().min(1, "Exam name is required"),
      date: z.string().min(1, "Exam date is required").regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine((dateStr) => {
        const date = new Date(dateStr);
        return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
      }, "Please enter a valid date"),
      examType: z.enum(["test", "exam"]).default("exam"),
      timerMode: z.string().default("individual"),
      timeLimit: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().int().min(1, "Time limit must be at least 1 minute").optional()
      ),
      passingScore: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : Number(val),
        z.number().int().min(0).max(100, "Passing score must be between 0 and 100").optional()
      ),
      startTime: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : new Date(val),
        z.date().optional()
      ),
      endTime: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : new Date(val),
        z.date().optional()
      ),
      instructions: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : val,
        z.string().optional()
      ),
      gradingScale: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? "standard" : val,
        z.string().default("standard")
      ),
      teacherInChargeId: z.preprocess(
        (val) => val === "" || val === null || val === void 0 ? void 0 : val,
        z.string().optional()
      ),
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
    insertTimetableSchema = createInsertSchema(timetable).omit({ id: true, createdAt: true });
    insertGradingTaskSchema = createInsertSchema(gradingTasks).omit({ id: true, createdAt: true });
    insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
    insertSettingSchema = createInsertSchema(settings).omit({ id: true, createdAt: true, updatedAt: true });
    insertCounterSchema = createInsertSchema(counters).omit({ id: true, createdAt: true, updatedAt: true });
    createStudentWithAutoCredsSchema = z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      phone: z.string().optional(),
      address: z.string().optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
      gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
      profileImageUrl: z.string().optional(),
      admissionNumber: z.string().min(1, "Admission number is required"),
      classId: z.coerce.number().positive("Please select a valid class"),
      parentId: z.string().optional().nullable(),
      admissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be in YYYY-MM-DD format"),
      emergencyContact: z.string().min(1, "Emergency contact is required"),
      medicalInfo: z.string().optional(),
      parentEmail: z.string().email("Invalid parent email").optional(),
      parentPhone: z.string().optional()
    });
    createStudentSchema = z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      phone: z.string().optional(),
      address: z.string().optional(),
      dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
      gender: z.enum(["Male", "Female", "Other"], { required_error: "Gender is required" }),
      profileImageUrl: z.string().optional(),
      classId: z.coerce.number().positive("Please select a valid class"),
      parentId: z.string().optional().nullable(),
      parentPhone: z.string().optional(),
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
      examId: z.coerce.number().positive("Please select a valid exam"),
      questionText: z.string().min(1, "Question text is required"),
      questionType: z.enum(["multiple_choice", "text", "essay", "true_false", "fill_blank"], { required_error: "Question type is required" }),
      points: z.preprocess((val) => val === "" ? 1 : val, z.coerce.number().int().min(0, "Points must be a non-negative number").default(1)),
      orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),
      imageUrl: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
      expectedAnswers: z.preprocess((val) => {
        if (val === "" || val === null || val === void 0) return void 0;
        if (Array.isArray(val)) return val;
        if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter((s) => s !== "");
        return void 0;
      }, z.array(z.string()).optional()),
      explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
      hintText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional()),
      partialCreditRules: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
    });
    insertQuestionOptionSchema = createInsertSchema(questionOptions).omit({ id: true, createdAt: true }).extend({
      questionId: z.coerce.number().positive("Please select a valid question"),
      orderNumber: z.coerce.number().int().min(1, "Order number must be a positive number"),
      partialCreditValue: z.preprocess((val) => val === "" ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)),
      explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
    });
    createQuestionOptionSchema = insertQuestionOptionSchema.omit({ questionId: true, orderNumber: true }).extend({
      partialCreditValue: z.preprocess((val) => val === "" ? 0 : val, z.coerce.number().int().min(0, "Partial credit must be non-negative").default(0)).optional(),
      explanationText: z.preprocess((val) => val === "" ? void 0 : val, z.string().optional())
    });
    insertExamSessionSchema = createInsertSchema(examSessions).omit({
      id: true,
      createdAt: true,
      startedAt: true,
      studentId: true
    }).partial().required({
      examId: true
    }).extend({
      submittedAt: z.union([z.date(), z.string()]).optional().transform((val) => {
        if (typeof val === "string") {
          return new Date(val);
        }
        return val;
      })
    });
    updateExamSessionSchema = z.object({
      isCompleted: z.boolean().optional(),
      submittedAt: z.coerce.date().refine((d) => !isNaN(d.getTime()), "Invalid date").optional(),
      timeRemaining: z.number().int().min(0).optional(),
      status: z.enum(["in_progress", "submitted"]).optional(),
      submissionMethod: z.string().optional(),
      autoSubmitted: z.boolean().optional()
    }).strict();
    insertStudentAnswerSchema = createInsertSchema(studentAnswers).omit({ id: true });
    insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
    insertTeacherProfileSchema = createInsertSchema(teacherProfiles).omit({ id: true, createdAt: true, updatedAt: true });
    insertAdminProfileSchema = createInsertSchema(adminProfiles).omit({ id: true, createdAt: true, updatedAt: true });
    insertParentProfileSchema = createInsertSchema(parentProfiles).omit({ id: true, createdAt: true, updatedAt: true });
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
    insertSuperAdminProfileSchema = createInsertSchema(superAdminProfiles).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
      id: true,
      createdAt: true,
      updatedAt: true
    });
    insertQuestionBankSchema = createInsertSchema(questionBanks).omit({ id: true, createdAt: true, updatedAt: true });
    insertQuestionBankItemSchema = createInsertSchema(questionBankItems).omit({ id: true, createdAt: true, updatedAt: true });
    insertQuestionBankOptionSchema = createInsertSchema(questionBankOptions).omit({ id: true, createdAt: true });
  }
});

// shared/schema.pg.ts
var schema_pg_exports = {};
__export(schema_pg_exports, {
  academicTerms: () => academicTerms2,
  adminProfiles: () => adminProfiles2,
  announcements: () => announcements2,
  approvedTeachers: () => approvedTeachers2,
  attendance: () => attendance2,
  auditLogs: () => auditLogs2,
  classes: () => classes2,
  contactMessages: () => contactMessages2,
  counters: () => counters2,
  examQuestions: () => examQuestions2,
  examResults: () => examResults2,
  examSessions: () => examSessions2,
  exams: () => exams2,
  gallery: () => gallery2,
  galleryCategories: () => galleryCategories2,
  gradingTasks: () => gradingTasks2,
  homePageContent: () => homePageContent2,
  invites: () => invites2,
  messages: () => messages2,
  notifications: () => notifications2,
  parentProfiles: () => parentProfiles2,
  passwordResetAttempts: () => passwordResetAttempts2,
  passwordResetTokens: () => passwordResetTokens2,
  performanceEvents: () => performanceEvents2,
  questionBankItems: () => questionBankItems2,
  questionBankOptions: () => questionBankOptions2,
  questionBanks: () => questionBanks2,
  questionOptions: () => questionOptions2,
  reportCardItems: () => reportCardItems2,
  reportCards: () => reportCards2,
  roles: () => roles2,
  settings: () => settings2,
  studentAnswers: () => studentAnswers2,
  students: () => students2,
  studyResources: () => studyResources2,
  subjects: () => subjects2,
  superAdminProfiles: () => superAdminProfiles2,
  systemSettings: () => systemSettings2,
  teacherApplications: () => teacherApplications2,
  teacherClassAssignments: () => teacherClassAssignments2,
  teacherProfiles: () => teacherProfiles2,
  timetable: () => timetable2,
  users: () => users2,
  vacancies: () => vacancies2
});
import { pgTable, text as text2, integer as integer2, boolean, timestamp, index as index2, uniqueIndex as uniqueIndex2, serial, varchar } from "drizzle-orm/pg-core";
var roles2, users2, passwordResetTokens2, passwordResetAttempts2, invites2, notifications2, academicTerms2, classes2, subjects2, students2, teacherProfiles2, adminProfiles2, parentProfiles2, superAdminProfiles2, systemSettings2, attendance2, exams2, examQuestions2, questionOptions2, examSessions2, studentAnswers2, examResults2, questionBanks2, questionBankItems2, questionBankOptions2, announcements2, messages2, galleryCategories2, gallery2, homePageContent2, contactMessages2, reportCards2, reportCardItems2, studyResources2, teacherClassAssignments2, timetable2, gradingTasks2, auditLogs2, performanceEvents2, settings2, counters2, vacancies2, teacherApplications2, approvedTeachers2;
var init_schema_pg = __esm({
  "shared/schema.pg.ts"() {
    "use strict";
    roles2 = pgTable("roles", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull().unique(),
      permissions: text2("permissions").notNull().default("[]"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    users2 = pgTable("users", {
      id: varchar("id", { length: 36 }).primaryKey(),
      username: varchar("username", { length: 255 }).unique(),
      email: varchar("email", { length: 255 }).notNull(),
      recoveryEmail: varchar("recovery_email", { length: 255 }),
      passwordHash: text2("password_hash"),
      mustChangePassword: boolean("must_change_password").notNull().default(true),
      roleId: integer2("role_id").notNull().references(() => roles2.id),
      firstName: varchar("first_name", { length: 255 }).notNull(),
      lastName: varchar("last_name", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      address: text2("address"),
      dateOfBirth: varchar("date_of_birth", { length: 10 }),
      gender: varchar("gender", { length: 10 }),
      nationalId: varchar("national_id", { length: 50 }),
      profileImageUrl: text2("profile_image_url"),
      isActive: boolean("is_active").notNull().default(true),
      authProvider: varchar("auth_provider", { length: 20 }).notNull().default("local"),
      googleId: varchar("google_id", { length: 255 }).unique(),
      status: varchar("status", { length: 20 }).notNull().default("active"),
      createdVia: varchar("created_via", { length: 20 }).notNull().default("admin"),
      createdBy: varchar("created_by", { length: 36 }),
      approvedBy: varchar("approved_by", { length: 36 }),
      approvedAt: timestamp("approved_at"),
      lastLoginAt: timestamp("last_login_at"),
      lastLoginIp: varchar("last_login_ip", { length: 45 }),
      mfaEnabled: boolean("mfa_enabled").notNull().default(false),
      mfaSecret: text2("mfa_secret"),
      accountLockedUntil: timestamp("account_locked_until"),
      profileCompleted: boolean("profile_completed").notNull().default(false),
      profileSkipped: boolean("profile_skipped").notNull().default(false),
      profileCompletionPercentage: integer2("profile_completion_percentage").notNull().default(0),
      state: varchar("state", { length: 100 }),
      country: varchar("country", { length: 100 }),
      securityQuestion: text2("security_question"),
      securityAnswerHash: text2("security_answer_hash"),
      dataPolicyAgreed: boolean("data_policy_agreed").notNull().default(false),
      dataPolicyAgreedAt: timestamp("data_policy_agreed_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      usersEmailIdx: index2("users_email_idx").on(table.email),
      usersStatusIdx: index2("users_status_idx").on(table.status),
      usersGoogleIdIdx: index2("users_google_id_idx").on(table.googleId),
      usersRoleIdIdx: index2("users_role_id_idx").on(table.roleId),
      usersUsernameIdx: index2("users_username_idx").on(table.username)
    }));
    passwordResetTokens2 = pgTable("password_reset_tokens", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull().references(() => users2.id, { onDelete: "cascade" }),
      token: varchar("token", { length: 255 }).notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      usedAt: timestamp("used_at"),
      ipAddress: varchar("ip_address", { length: 45 }),
      resetBy: varchar("reset_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      passwordResetTokensUserIdIdx: index2("password_reset_tokens_user_id_idx").on(table.userId),
      passwordResetTokensTokenIdx: index2("password_reset_tokens_token_idx").on(table.token)
    }));
    passwordResetAttempts2 = pgTable("password_reset_attempts", {
      id: serial("id").primaryKey(),
      identifier: varchar("identifier", { length: 255 }).notNull(),
      ipAddress: varchar("ip_address", { length: 45 }).notNull(),
      attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
      success: boolean("success").notNull().default(false)
    }, (table) => ({
      passwordResetAttemptsIdentifierIdx: index2("password_reset_attempts_identifier_idx").on(table.identifier),
      passwordResetAttemptsIpIdx: index2("password_reset_attempts_ip_idx").on(table.ipAddress),
      passwordResetAttemptsTimeIdx: index2("password_reset_attempts_time_idx").on(table.attemptedAt)
    }));
    invites2 = pgTable("invites", {
      id: serial("id").primaryKey(),
      token: varchar("token", { length: 255 }).notNull().unique(),
      email: varchar("email", { length: 255 }).notNull(),
      roleId: integer2("role_id").notNull().references(() => roles2.id),
      createdBy: varchar("created_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      expiresAt: timestamp("expires_at").notNull(),
      acceptedAt: timestamp("accepted_at"),
      acceptedBy: varchar("accepted_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      invitesTokenIdx: index2("invites_token_idx").on(table.token),
      invitesEmailIdx: index2("invites_email_idx").on(table.email)
    }));
    notifications2 = pgTable("notifications", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull().references(() => users2.id, { onDelete: "cascade" }),
      type: varchar("type", { length: 50 }).notNull(),
      title: varchar("title", { length: 255 }).notNull(),
      message: text2("message").notNull(),
      relatedEntityType: varchar("related_entity_type", { length: 50 }),
      relatedEntityId: varchar("related_entity_id", { length: 36 }),
      isRead: boolean("is_read").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      notificationsUserIdIdx: index2("notifications_user_id_idx").on(table.userId),
      notificationsIsReadIdx: index2("notifications_is_read_idx").on(table.isRead)
    }));
    academicTerms2 = pgTable("academic_terms", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      year: varchar("year", { length: 20 }).notNull(),
      startDate: varchar("start_date", { length: 10 }).notNull(),
      endDate: varchar("end_date", { length: 10 }).notNull(),
      isCurrent: boolean("is_current").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    classes2 = pgTable("classes", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull().unique(),
      level: varchar("level", { length: 50 }).notNull(),
      capacity: integer2("capacity").notNull().default(30),
      classTeacherId: varchar("class_teacher_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      currentTermId: integer2("current_term_id").references(() => academicTerms2.id),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    subjects2 = pgTable("subjects", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      description: text2("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    students2 = pgTable("students", {
      id: varchar("id", { length: 36 }).primaryKey().references(() => users2.id, { onDelete: "cascade" }),
      admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
      classId: integer2("class_id").references(() => classes2.id),
      parentId: varchar("parent_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      admissionDate: varchar("admission_date", { length: 10 }).notNull(),
      emergencyContact: varchar("emergency_contact", { length: 255 }),
      emergencyPhone: varchar("emergency_phone", { length: 50 }),
      medicalInfo: text2("medical_info"),
      guardianName: varchar("guardian_name", { length: 255 }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    teacherProfiles2 = pgTable("teacher_profiles", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users2.id, { onDelete: "cascade" }),
      staffId: varchar("staff_id", { length: 50 }).unique(),
      subjects: text2("subjects").notNull().default("[]"),
      assignedClasses: text2("assigned_classes").notNull().default("[]"),
      qualification: text2("qualification"),
      yearsOfExperience: integer2("years_of_experience").notNull().default(0),
      specialization: varchar("specialization", { length: 255 }),
      department: varchar("department", { length: 255 }),
      signatureUrl: text2("signature_url"),
      gradingMode: varchar("grading_mode", { length: 20 }).notNull().default("manual"),
      autoGradeTheoryQuestions: boolean("auto_grade_theory_questions").notNull().default(false),
      theoryGradingInstructions: text2("theory_grading_instructions"),
      notificationPreference: varchar("notification_preference", { length: 20 }).notNull().default("all"),
      availability: text2("availability"),
      firstLogin: boolean("first_login").notNull().default(true),
      verified: boolean("verified").notNull().default(false),
      verifiedBy: varchar("verified_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      verifiedAt: timestamp("verified_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    adminProfiles2 = pgTable("admin_profiles", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users2.id, { onDelete: "cascade" }),
      department: varchar("department", { length: 255 }),
      roleDescription: text2("role_description"),
      accessLevel: varchar("access_level", { length: 50 }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    parentProfiles2 = pgTable("parent_profiles", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users2.id, { onDelete: "cascade" }),
      occupation: varchar("occupation", { length: 255 }),
      contactPreference: varchar("contact_preference", { length: 50 }),
      linkedStudents: text2("linked_students").notNull().default("[]"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    superAdminProfiles2 = pgTable("super_admin_profiles", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users2.id, { onDelete: "cascade" }),
      department: varchar("department", { length: 255 }),
      accessLevel: varchar("access_level", { length: 50 }).notNull().default("full"),
      twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
      twoFactorSecret: text2("two_factor_secret"),
      lastPasswordChange: timestamp("last_password_change"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    systemSettings2 = pgTable("system_settings", {
      id: serial("id").primaryKey(),
      schoolName: varchar("school_name", { length: 255 }),
      schoolMotto: text2("school_motto"),
      schoolLogo: text2("school_logo"),
      schoolEmail: varchar("school_email", { length: 255 }),
      schoolPhone: varchar("school_phone", { length: 50 }),
      schoolAddress: text2("school_address"),
      maintenanceMode: boolean("maintenance_mode").notNull().default(false),
      maintenanceModeMessage: text2("maintenance_mode_message"),
      enableSmsNotifications: boolean("enable_sms_notifications").notNull().default(false),
      enableEmailNotifications: boolean("enable_email_notifications").notNull().default(true),
      enableExamsModule: boolean("enable_exams_module").notNull().default(true),
      enableAttendanceModule: boolean("enable_attendance_module").notNull().default(true),
      enableResultsModule: boolean("enable_results_module").notNull().default(true),
      themeColor: varchar("theme_color", { length: 50 }).notNull().default("blue"),
      favicon: text2("favicon"),
      usernameStudentPrefix: varchar("username_student_prefix", { length: 50 }).notNull().default("THS-STU"),
      usernameParentPrefix: varchar("username_parent_prefix", { length: 50 }).notNull().default("THS-PAR"),
      usernameTeacherPrefix: varchar("username_teacher_prefix", { length: 50 }).notNull().default("THS-TCH"),
      usernameAdminPrefix: varchar("username_admin_prefix", { length: 50 }).notNull().default("THS-ADM"),
      tempPasswordFormat: varchar("temp_password_format", { length: 100 }).notNull().default("THS@{year}#{random4}"),
      hideAdminAccountsFromAdmins: boolean("hide_admin_accounts_from_admins").notNull().default(true),
      updatedBy: varchar("updated_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    attendance2 = pgTable("attendance", {
      id: serial("id").primaryKey(),
      studentId: varchar("student_id", { length: 36 }).notNull().references(() => students2.id, { onDelete: "cascade" }),
      classId: integer2("class_id").notNull().references(() => classes2.id),
      date: varchar("date", { length: 10 }).notNull(),
      status: varchar("status", { length: 20 }).notNull(),
      recordedBy: varchar("recorded_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      notes: text2("notes"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    exams2 = pgTable("exams", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      classId: integer2("class_id").notNull().references(() => classes2.id),
      subjectId: integer2("subject_id").notNull().references(() => subjects2.id),
      totalMarks: integer2("total_marks").notNull(),
      date: varchar("date", { length: 10 }).notNull(),
      termId: integer2("term_id").notNull().references(() => academicTerms2.id),
      createdBy: varchar("created_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      teacherInChargeId: varchar("teacher_in_charge_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      examType: varchar("exam_type", { length: 20 }).notNull().default("exam"),
      timerMode: varchar("timer_mode", { length: 20 }).notNull().default("individual"),
      timeLimit: integer2("time_limit"),
      startTime: timestamp("start_time"),
      endTime: timestamp("end_time"),
      instructions: text2("instructions"),
      isPublished: boolean("is_published").notNull().default(false),
      allowRetakes: boolean("allow_retakes").notNull().default(false),
      shuffleQuestions: boolean("shuffle_questions").notNull().default(false),
      autoGradingEnabled: boolean("auto_grading_enabled").notNull().default(true),
      instantFeedback: boolean("instant_feedback").notNull().default(false),
      showCorrectAnswers: boolean("show_correct_answers").notNull().default(false),
      passingScore: integer2("passing_score"),
      gradingScale: varchar("grading_scale", { length: 50 }).notNull().default("standard"),
      enableProctoring: boolean("enable_proctoring").notNull().default(false),
      lockdownMode: boolean("lockdown_mode").notNull().default(false),
      requireWebcam: boolean("require_webcam").notNull().default(false),
      requireFullscreen: boolean("require_fullscreen").notNull().default(false),
      maxTabSwitches: integer2("max_tab_switches").notNull().default(3),
      shuffleOptions: boolean("shuffle_options").notNull().default(false)
    });
    examQuestions2 = pgTable("exam_questions", {
      id: serial("id").primaryKey(),
      examId: integer2("exam_id").notNull().references(() => exams2.id),
      questionText: text2("question_text").notNull(),
      questionType: varchar("question_type", { length: 50 }).notNull(),
      points: integer2("points").notNull().default(1),
      orderNumber: integer2("order_number").notNull(),
      imageUrl: text2("image_url"),
      autoGradable: boolean("auto_gradable").notNull().default(true),
      expectedAnswers: text2("expected_answers").notNull().default("[]"),
      caseSensitive: boolean("case_sensitive").notNull().default(false),
      allowPartialCredit: boolean("allow_partial_credit").notNull().default(false),
      partialCreditRules: text2("partial_credit_rules"),
      explanationText: text2("explanation_text"),
      hintText: text2("hint_text"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      examQuestionsExamIdIdx: index2("exam_questions_exam_id_idx").on(table.examId),
      examQuestionsOrderIdx: index2("exam_questions_order_idx").on(table.examId, table.orderNumber)
    }));
    questionOptions2 = pgTable("question_options", {
      id: serial("id").primaryKey(),
      questionId: integer2("question_id").notNull().references(() => examQuestions2.id),
      optionText: text2("option_text").notNull(),
      isCorrect: boolean("is_correct").notNull().default(false),
      orderNumber: integer2("order_number").notNull(),
      partialCreditValue: integer2("partial_credit_value").notNull().default(0),
      explanationText: text2("explanation_text"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      questionOptionsQuestionIdIdx: index2("question_options_question_id_idx").on(table.questionId),
      questionOptionsCorrectIdx: index2("question_options_correct_idx").on(table.questionId, table.isCorrect)
    }));
    examSessions2 = pgTable("exam_sessions", {
      id: serial("id").primaryKey(),
      examId: integer2("exam_id").notNull().references(() => exams2.id),
      studentId: varchar("student_id", { length: 36 }).notNull().references(() => students2.id, { onDelete: "cascade" }),
      startedAt: timestamp("started_at").notNull().defaultNow(),
      submittedAt: timestamp("submitted_at"),
      timeRemaining: integer2("time_remaining"),
      isCompleted: boolean("is_completed").notNull().default(false),
      score: integer2("score"),
      maxScore: integer2("max_score"),
      status: varchar("status", { length: 20 }).notNull().default("in_progress"),
      metadata: text2("metadata"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      examSessionsExamStudentIdx: index2("exam_sessions_exam_student_idx").on(table.examId, table.studentId),
      examSessionsStudentCompletedIdx: index2("exam_sessions_student_completed_idx").on(table.studentId, table.isCompleted),
      examSessionsActiveSessionsIdx: index2("exam_sessions_active_idx").on(table.examId, table.studentId, table.isCompleted)
    }));
    studentAnswers2 = pgTable("student_answers", {
      id: serial("id").primaryKey(),
      sessionId: integer2("session_id").notNull().references(() => examSessions2.id),
      questionId: integer2("question_id").notNull().references(() => examQuestions2.id),
      selectedOptionId: integer2("selected_option_id").references(() => questionOptions2.id),
      textAnswer: text2("text_answer"),
      isCorrect: boolean("is_correct"),
      pointsEarned: integer2("points_earned").notNull().default(0),
      answeredAt: timestamp("answered_at").notNull().defaultNow(),
      autoScored: boolean("auto_scored").notNull().default(false),
      manualOverride: boolean("manual_override").notNull().default(false),
      feedbackText: text2("feedback_text"),
      partialCreditReason: text2("partial_credit_reason")
    }, (table) => ({
      studentAnswersSessionIdIdx: index2("student_answers_session_id_idx").on(table.sessionId),
      studentAnswersSessionQuestionIdx: index2("student_answers_session_question_idx").on(table.sessionId, table.questionId),
      studentAnswersQuestionIdx: index2("student_answers_question_id_idx").on(table.questionId)
    }));
    examResults2 = pgTable("exam_results", {
      id: serial("id").primaryKey(),
      examId: integer2("exam_id").notNull().references(() => exams2.id),
      studentId: varchar("student_id", { length: 36 }).notNull().references(() => students2.id, { onDelete: "cascade" }),
      score: integer2("score"),
      maxScore: integer2("max_score"),
      marksObtained: integer2("marks_obtained"),
      grade: varchar("grade", { length: 10 }),
      remarks: text2("remarks"),
      autoScored: boolean("auto_scored").notNull().default(false),
      recordedBy: varchar("recorded_by", { length: 36 }).notNull().references(() => users2.id),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      examResultsExamIdIdx: index2("exam_results_exam_id_idx").on(table.examId),
      examResultsStudentIdIdx: index2("exam_results_student_id_idx").on(table.studentId),
      examResultsExamStudentIdx: index2("exam_results_exam_student_idx").on(table.examId, table.studentId),
      examResultsAutoScoredIdx: index2("exam_results_auto_scored_idx").on(table.autoScored, table.examId)
    }));
    questionBanks2 = pgTable("question_banks", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text2("description"),
      subjectId: integer2("subject_id").notNull().references(() => subjects2.id),
      classLevel: varchar("class_level", { length: 50 }),
      createdBy: varchar("created_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      isPublic: boolean("is_public").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      questionBanksSubjectIdx: index2("question_banks_subject_idx").on(table.subjectId),
      questionBanksCreatedByIdx: index2("question_banks_created_by_idx").on(table.createdBy)
    }));
    questionBankItems2 = pgTable("question_bank_items", {
      id: serial("id").primaryKey(),
      bankId: integer2("bank_id").notNull().references(() => questionBanks2.id, { onDelete: "cascade" }),
      questionText: text2("question_text").notNull(),
      questionType: varchar("question_type", { length: 50 }).notNull(),
      points: integer2("points").notNull().default(1),
      difficulty: varchar("difficulty", { length: 20 }).notNull().default("medium"),
      tags: text2("tags").notNull().default("[]"),
      imageUrl: text2("image_url"),
      autoGradable: boolean("auto_gradable").notNull().default(true),
      expectedAnswers: text2("expected_answers").notNull().default("[]"),
      caseSensitive: boolean("case_sensitive").notNull().default(false),
      explanationText: text2("explanation_text"),
      hintText: text2("hint_text"),
      practicalInstructions: text2("practical_instructions"),
      practicalFileUrl: text2("practical_file_url"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      questionBankItemsBankIdIdx: index2("question_bank_items_bank_id_idx").on(table.bankId),
      questionBankItemsTypeIdx: index2("question_bank_items_type_idx").on(table.questionType),
      questionBankItemsDifficultyIdx: index2("question_bank_items_difficulty_idx").on(table.difficulty)
    }));
    questionBankOptions2 = pgTable("question_bank_options", {
      id: serial("id").primaryKey(),
      questionItemId: integer2("question_item_id").notNull().references(() => questionBankItems2.id, { onDelete: "cascade" }),
      optionText: text2("option_text").notNull(),
      isCorrect: boolean("is_correct").notNull().default(false),
      orderNumber: integer2("order_number").notNull(),
      explanationText: text2("explanation_text"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      questionBankOptionsItemIdIdx: index2("question_bank_options_item_id_idx").on(table.questionItemId)
    }));
    announcements2 = pgTable("announcements", {
      id: serial("id").primaryKey(),
      title: varchar("title", { length: 255 }).notNull(),
      content: text2("content").notNull(),
      authorId: varchar("author_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      targetRoles: text2("target_roles").notNull().default('["All"]'),
      targetClasses: text2("target_classes").notNull().default("[]"),
      isPublished: boolean("is_published").notNull().default(false),
      publishedAt: timestamp("published_at"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    messages2 = pgTable("messages", {
      id: serial("id").primaryKey(),
      senderId: varchar("sender_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      recipientId: varchar("recipient_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      subject: varchar("subject", { length: 255 }).notNull(),
      content: text2("content").notNull(),
      isRead: boolean("is_read").notNull().default(false),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    galleryCategories2 = pgTable("gallery_categories", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      description: text2("description"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    gallery2 = pgTable("gallery", {
      id: serial("id").primaryKey(),
      imageUrl: text2("image_url").notNull(),
      caption: text2("caption"),
      categoryId: integer2("category_id").references(() => galleryCategories2.id),
      uploadedBy: varchar("uploaded_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    homePageContent2 = pgTable("home_page_content", {
      id: serial("id").primaryKey(),
      contentType: varchar("content_type", { length: 50 }).notNull(),
      imageUrl: text2("image_url"),
      altText: varchar("alt_text", { length: 255 }),
      caption: text2("caption"),
      isActive: boolean("is_active").notNull().default(true),
      displayOrder: integer2("display_order").notNull().default(0),
      uploadedBy: varchar("uploaded_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    contactMessages2 = pgTable("contact_messages", {
      id: serial("id").primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      subject: varchar("subject", { length: 255 }),
      message: text2("message").notNull(),
      isRead: boolean("is_read").notNull().default(false),
      respondedAt: timestamp("responded_at"),
      respondedBy: varchar("responded_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      response: text2("response"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    });
    reportCards2 = pgTable("report_cards", {
      id: serial("id").primaryKey(),
      studentId: varchar("student_id", { length: 36 }).notNull().references(() => students2.id, { onDelete: "cascade" }),
      classId: integer2("class_id").notNull().references(() => classes2.id),
      termId: integer2("term_id").notNull().references(() => academicTerms2.id),
      totalScore: integer2("total_score"),
      averageScore: integer2("average_score"),
      position: integer2("position"),
      totalStudentsInClass: integer2("total_students_in_class"),
      teacherRemarks: text2("teacher_remarks"),
      principalRemarks: text2("principal_remarks"),
      status: varchar("status", { length: 20 }).notNull().default("draft"),
      generatedBy: varchar("generated_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      generatedAt: timestamp("generated_at"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      reportCardsStudentTermIdx: index2("report_cards_student_term_idx").on(table.studentId, table.termId),
      reportCardsClassTermIdx: index2("report_cards_class_term_idx").on(table.classId, table.termId)
    }));
    reportCardItems2 = pgTable("report_card_items", {
      id: serial("id").primaryKey(),
      reportCardId: integer2("report_card_id").notNull().references(() => reportCards2.id, { onDelete: "cascade" }),
      subjectId: integer2("subject_id").notNull().references(() => subjects2.id),
      examId: integer2("exam_id").references(() => exams2.id),
      score: integer2("score"),
      maxScore: integer2("max_score"),
      grade: varchar("grade", { length: 10 }),
      remarks: text2("remarks"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      reportCardItemsReportCardIdx: index2("report_card_items_report_card_idx").on(table.reportCardId),
      reportCardItemsSubjectIdx: index2("report_card_items_subject_idx").on(table.subjectId)
    }));
    studyResources2 = pgTable("study_resources", {
      id: serial("id").primaryKey(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text2("description"),
      fileUrl: text2("file_url").notNull(),
      fileType: varchar("file_type", { length: 50 }),
      fileSize: integer2("file_size"),
      resourceType: varchar("resource_type", { length: 50 }).notNull(),
      classId: integer2("class_id").references(() => classes2.id),
      subjectId: integer2("subject_id").references(() => subjects2.id),
      termId: integer2("term_id").references(() => academicTerms2.id),
      uploadedBy: varchar("uploaded_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      downloadCount: integer2("download_count").notNull().default(0),
      isPublic: boolean("is_public").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      studyResourcesClassIdx: index2("study_resources_class_idx").on(table.classId),
      studyResourcesSubjectIdx: index2("study_resources_subject_idx").on(table.subjectId),
      studyResourcesTypeIdx: index2("study_resources_type_idx").on(table.resourceType)
    }));
    teacherClassAssignments2 = pgTable("teacher_class_assignments", {
      id: serial("id").primaryKey(),
      teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => users2.id, { onDelete: "cascade" }),
      classId: integer2("class_id").notNull().references(() => classes2.id),
      subjectId: integer2("subject_id").notNull().references(() => subjects2.id),
      termId: integer2("term_id").references(() => academicTerms2.id),
      isActive: boolean("is_active").notNull().default(true),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      teacherClassAssignmentsTeacherIdx: index2("teacher_class_assignments_teacher_idx").on(table.teacherId),
      teacherClassAssignmentsClassSubjectIdx: index2("teacher_class_assignments_class_subject_idx").on(table.classId, table.subjectId)
    }));
    timetable2 = pgTable("timetable", {
      id: serial("id").primaryKey(),
      teacherId: varchar("teacher_id", { length: 36 }).notNull().references(() => users2.id, { onDelete: "cascade" }),
      classId: integer2("class_id").notNull().references(() => classes2.id),
      subjectId: integer2("subject_id").notNull().references(() => subjects2.id),
      termId: integer2("term_id").references(() => academicTerms2.id),
      dayOfWeek: varchar("day_of_week", { length: 20 }).notNull(),
      startTime: varchar("start_time", { length: 10 }).notNull(),
      endTime: varchar("end_time", { length: 10 }).notNull(),
      location: varchar("location", { length: 100 }),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      timetableTeacherIdx: index2("timetable_teacher_idx").on(table.teacherId),
      timetableClassIdx: index2("timetable_class_idx").on(table.classId),
      timetableDayIdx: index2("timetable_day_idx").on(table.dayOfWeek)
    }));
    gradingTasks2 = pgTable("grading_tasks", {
      id: serial("id").primaryKey(),
      sessionId: integer2("session_id").notNull().references(() => examSessions2.id),
      questionId: integer2("question_id").notNull().references(() => examQuestions2.id),
      answerId: integer2("answer_id").notNull().references(() => studentAnswers2.id),
      teacherId: varchar("teacher_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      status: varchar("status", { length: 20 }).notNull().default("pending"),
      priority: integer2("priority").notNull().default(0),
      aiSuggestedScore: integer2("ai_suggested_score"),
      aiConfidence: integer2("ai_confidence"),
      aiReasoning: text2("ai_reasoning"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      assignedAt: timestamp("assigned_at"),
      completedAt: timestamp("completed_at")
    }, (table) => ({
      gradingTasksTeacherIdx: index2("grading_tasks_teacher_idx").on(table.teacherId),
      gradingTasksStatusIdx: index2("grading_tasks_status_idx").on(table.status),
      gradingTasksSessionIdx: index2("grading_tasks_session_idx").on(table.sessionId)
    }));
    auditLogs2 = pgTable("audit_logs", {
      id: serial("id").primaryKey(),
      userId: varchar("user_id", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      action: varchar("action", { length: 100 }).notNull(),
      entityType: varchar("entity_type", { length: 50 }).notNull(),
      entityId: varchar("entity_id", { length: 36 }).notNull(),
      oldValue: text2("old_value"),
      newValue: text2("new_value"),
      reason: text2("reason"),
      ipAddress: varchar("ip_address", { length: 45 }),
      userAgent: text2("user_agent"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      auditLogsUserIdx: index2("audit_logs_user_idx").on(table.userId),
      auditLogsEntityIdx: index2("audit_logs_entity_idx").on(table.entityType, table.entityId),
      auditLogsDateIdx: index2("audit_logs_date_idx").on(table.createdAt),
      auditLogsActionIdx: index2("audit_logs_action_idx").on(table.action)
    }));
    performanceEvents2 = pgTable("performance_events", {
      id: serial("id").primaryKey(),
      eventType: varchar("event_type", { length: 50 }).notNull(),
      entityType: varchar("entity_type", { length: 50 }),
      entityId: varchar("entity_id", { length: 36 }),
      duration: integer2("duration"),
      metGoal: boolean("met_goal"),
      metadata: text2("metadata"),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      performanceEventsTypeIdx: index2("performance_events_type_idx").on(table.eventType),
      performanceEventsDateIdx: index2("performance_events_date_idx").on(table.createdAt)
    }));
    settings2 = pgTable("settings", {
      id: serial("id").primaryKey(),
      key: varchar("key", { length: 100 }).notNull().unique(),
      value: text2("value").notNull(),
      description: text2("description"),
      updatedBy: varchar("updated_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    });
    counters2 = pgTable("counters", {
      id: serial("id").primaryKey(),
      classCode: varchar("class_code", { length: 50 }).notNull(),
      year: varchar("year", { length: 10 }).notNull(),
      sequence: integer2("sequence").notNull().default(0),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      countersClassYearIdx: uniqueIndex2("counters_class_year_idx").on(table.classCode, table.year)
    }));
    vacancies2 = pgTable("vacancies", {
      id: varchar("id", { length: 36 }).primaryKey(),
      title: varchar("title", { length: 255 }).notNull(),
      description: text2("description").notNull(),
      requirements: text2("requirements"),
      deadline: timestamp("deadline").notNull(),
      status: varchar("status", { length: 20 }).notNull().default("open"),
      createdBy: varchar("created_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      vacanciesStatusIdx: index2("vacancies_status_idx").on(table.status),
      vacanciesDeadlineIdx: index2("vacancies_deadline_idx").on(table.deadline)
    }));
    teacherApplications2 = pgTable("teacher_applications", {
      id: varchar("id", { length: 36 }).primaryKey(),
      vacancyId: varchar("vacancy_id", { length: 36 }).references(() => vacancies2.id, { onDelete: "set null" }),
      fullName: varchar("full_name", { length: 255 }).notNull(),
      email: varchar("email", { length: 255 }).notNull(),
      phone: varchar("phone", { length: 50 }),
      qualifications: text2("qualifications"),
      experience: text2("experience"),
      subjectSpecialty: varchar("subject_specialty", { length: 255 }),
      coverLetter: text2("cover_letter"),
      resumeUrl: text2("resume_url"),
      status: varchar("status", { length: 20 }).notNull().default("pending"),
      reviewedBy: varchar("reviewed_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      reviewedAt: timestamp("reviewed_at"),
      reviewNotes: text2("review_notes"),
      createdAt: timestamp("created_at").notNull().defaultNow(),
      updatedAt: timestamp("updated_at").notNull().defaultNow()
    }, (table) => ({
      teacherApplicationsStatusIdx: index2("teacher_applications_status_idx").on(table.status),
      teacherApplicationsEmailIdx: index2("teacher_applications_email_idx").on(table.email)
    }));
    approvedTeachers2 = pgTable("approved_teachers", {
      id: varchar("id", { length: 36 }).primaryKey(),
      applicationId: varchar("application_id", { length: 36 }).references(() => teacherApplications2.id, { onDelete: "set null" }),
      googleEmail: varchar("google_email", { length: 255 }).notNull().unique(),
      fullName: varchar("full_name", { length: 255 }).notNull(),
      subjectSpecialty: varchar("subject_specialty", { length: 255 }),
      approvedBy: varchar("approved_by", { length: 36 }).references(() => users2.id, { onDelete: "set null" }),
      dateApproved: timestamp("date_approved").notNull().defaultNow(),
      createdAt: timestamp("created_at").notNull().defaultNow()
    }, (table) => ({
      approvedTeachersEmailIdx: index2("approved_teachers_email_idx").on(table.googleEmail)
    }));
  }
});

// server/db.ts
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { drizzle as drizzlePg } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import Database from "better-sqlite3";
function getSchema() {
  return isPostgres ? schema_pg_exports : schema_exports;
}
function initializeDatabase() {
  if (db) {
    return db;
  }
  if (isPostgres && databaseUrl) {
    console.log("\u{1F418} Initializing PostgreSQL database (Neon)...");
    pgClient = neon(databaseUrl);
    db = drizzlePg(pgClient, { schema: schema_pg_exports });
    console.log("\u2705 PostgreSQL database initialized (Neon)");
  } else {
    console.log("\u{1F4E6} Initializing SQLite database...");
    sqlite = new Database("./server/data/app.db");
    sqlite.pragma("foreign_keys = ON");
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("synchronous = NORMAL");
    db = drizzleSqlite(sqlite, { schema: schema_exports });
    console.log("\u2705 SQLite database initialized at ./server/data/app.db");
  }
  return db;
}
function getDatabase() {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}
function getSqliteConnection() {
  return sqlite;
}
function getPgClient() {
  return pgClient;
}
var isProduction, databaseUrl, isPostgres, db, sqlite, pgClient, database;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_schema_pg();
    isProduction = process.env.NODE_ENV === "production";
    databaseUrl = process.env.DATABASE_URL;
    isPostgres = !!(databaseUrl && isProduction);
    db = null;
    sqlite = null;
    pgClient = null;
    database = initializeDatabase();
  }
});

// server/storage.ts
import { eq, and, desc, asc, sql as sql2, sql as dsql, inArray, isNull } from "drizzle-orm";
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
  return void 0;
}
function initializeStorageSync() {
  if (!process.env.DATABASE_URL) {
    process.exit(1);
  }
  try {
    const dbStorage = new DatabaseStorage();
    return dbStorage;
  } catch (error) {
    process.exit(1);
  }
}
var db2, schema, DatabaseStorage, storage;
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_db();
    db2 = getDatabase();
    schema = getSchema();
    DatabaseStorage = class {
      db;
      constructor() {
        this.db = db2;
        if (!this.db) {
          throw new Error("Database not available - DATABASE_URL not set or invalid");
        }
      }
      // User management
      async getUser(id) {
        const result = await this.db.select({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          recoveryEmail: schema.users.recoveryEmail,
          passwordHash: schema.users.passwordHash,
          roleId: schema.users.roleId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          phone: schema.users.phone,
          address: schema.users.address,
          dateOfBirth: schema.users.dateOfBirth,
          gender: schema.users.gender,
          nationalId: schema.users.nationalId,
          profileImageUrl: schema.users.profileImageUrl,
          isActive: schema.users.isActive,
          authProvider: schema.users.authProvider,
          googleId: schema.users.googleId,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }).from(schema.users).where(eq(schema.users.id, id)).limit(1);
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
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          recoveryEmail: schema.users.recoveryEmail,
          passwordHash: schema.users.passwordHash,
          roleId: schema.users.roleId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          phone: schema.users.phone,
          address: schema.users.address,
          dateOfBirth: schema.users.dateOfBirth,
          gender: schema.users.gender,
          nationalId: schema.users.nationalId,
          profileImageUrl: schema.users.profileImageUrl,
          isActive: schema.users.isActive,
          authProvider: schema.users.authProvider,
          googleId: schema.users.googleId,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }).from(schema.users).where(eq(schema.users.email, email)).limit(1);
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
        const result = await this.db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
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
        const result = await this.db.insert(schema.passwordResetTokens).values({
          userId,
          token,
          expiresAt,
          ipAddress,
          resetBy
        }).returning();
        return result[0];
      }
      async getPasswordResetToken(token) {
        const result = await this.db.select().from(schema.passwordResetTokens).where(and(
          eq(schema.passwordResetTokens.token, token),
          dsql`${schema.passwordResetTokens.expiresAt} > NOW()`,
          dsql`${schema.passwordResetTokens.usedAt} IS NULL`
        )).limit(1);
        return result[0];
      }
      async markPasswordResetTokenAsUsed(token) {
        const result = await this.db.update(schema.passwordResetTokens).set({ usedAt: dsql`NOW()` }).where(eq(schema.passwordResetTokens.token, token)).returning();
        return result.length > 0;
      }
      async deleteExpiredPasswordResetTokens() {
        await this.db.delete(schema.passwordResetTokens).where(dsql`${schema.passwordResetTokens.expiresAt} < NOW()`);
        return true;
      }
      async createUser(user) {
        const result = await this.db.insert(schema.users).values(user).returning();
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
          const result = await this.db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
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
            const { [missingColumn]: removed, ...safeUser } = user;
            if (Object.keys(safeUser).length > 0) {
              const result = await this.db.update(schema.users).set(safeUser).where(eq(schema.users.id, id)).returning();
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
      async deleteUser(id) {
        try {
          await this.db.delete(schema.teacherProfiles).where(eq(schema.teacherProfiles.userId, id));
          await this.db.delete(schema.adminProfiles).where(eq(schema.adminProfiles.userId, id));
          await this.db.delete(schema.parentProfiles).where(eq(schema.parentProfiles.userId, id));
          await this.db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, id));
          await this.db.delete(schema.invites).where(eq(schema.invites.acceptedBy, id));
          await this.db.delete(schema.notifications).where(eq(schema.notifications.userId, id));
          try {
            if (schema.teacherClassAssignments) {
              await this.db.delete(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.teacherId, id));
            }
          } catch (assignmentError) {
            if (assignmentError?.cause?.code === "42P01") {
            } else {
              throw assignmentError;
            }
          }
          const examSessions3 = await this.db.select({ id: schema.examSessions.id }).from(schema.examSessions).where(eq(schema.examSessions.studentId, id));
          const sessionIds = examSessions3.map((s) => s.id);
          if (sessionIds.length > 0) {
            await this.db.delete(schema.studentAnswers).where(inArray(schema.studentAnswers.sessionId, sessionIds));
            await this.db.delete(schema.examSessions).where(inArray(schema.examSessions.id, sessionIds));
          }
          await this.db.delete(schema.examResults).where(eq(schema.examResults.studentId, id));
          await this.db.delete(schema.attendance).where(eq(schema.attendance.studentId, id));
          await this.db.update(schema.students).set({ parentId: null }).where(eq(schema.students.parentId, id));
          await this.db.delete(schema.students).where(eq(schema.students.id, id));
          const result = await this.db.delete(schema.users).where(eq(schema.users.id, id)).returning();
          return result.length > 0;
        } catch (error) {
          throw error;
        }
      }
      async getUsersByRole(roleId) {
        const result = await this.db.select({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          passwordHash: schema.users.passwordHash,
          roleId: schema.users.roleId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          phone: schema.users.phone,
          address: schema.users.address,
          dateOfBirth: schema.users.dateOfBirth,
          gender: schema.users.gender,
          profileImageUrl: schema.users.profileImageUrl,
          isActive: schema.users.isActive,
          authProvider: schema.users.authProvider,
          googleId: schema.users.googleId,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }).from(schema.users).where(eq(schema.users.roleId, roleId));
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
        const result = await this.db.select().from(schema.users).where(sql2`${schema.users.status} = ${status}`);
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
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          passwordHash: schema.users.passwordHash,
          roleId: schema.users.roleId,
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          phone: schema.users.phone,
          address: schema.users.address,
          dateOfBirth: schema.users.dateOfBirth,
          gender: schema.users.gender,
          profileImageUrl: schema.users.profileImageUrl,
          isActive: schema.users.isActive,
          authProvider: schema.users.authProvider,
          googleId: schema.users.googleId,
          status: schema.users.status,
          createdAt: schema.users.createdAt,
          updatedAt: schema.users.updatedAt
        }).from(schema.users);
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
        const result = await this.db.update(schema.users).set({
          status: "active",
          approvedBy,
          approvedAt: /* @__PURE__ */ new Date()
        }).where(eq(schema.users.id, userId)).returning();
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
        const updates = { status };
        if (status === "active") {
          updates.approvedBy = updatedBy;
          updates.approvedAt = /* @__PURE__ */ new Date();
        }
        const result = await this.db.update(schema.users).set(updates).where(eq(schema.users.id, userId)).returning();
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
        return await this.db.select().from(schema.roles);
      }
      async getRoleByName(name) {
        const result = await this.db.select().from(schema.roles).where(eq(schema.roles.name, name)).limit(1);
        return result[0];
      }
      async getRole(roleId) {
        const result = await this.db.select().from(schema.roles).where(eq(schema.roles.id, roleId)).limit(1);
        return result[0];
      }
      // Invite management
      async createInvite(invite) {
        const result = await this.db.insert(schema.invites).values(invite).returning();
        return result[0];
      }
      async getInviteByToken(token) {
        const result = await this.db.select().from(schema.invites).where(and(
          eq(schema.invites.token, token),
          isNull(schema.invites.acceptedAt),
          dsql`${schema.invites.expiresAt} > NOW()`
        )).limit(1);
        return result[0];
      }
      async getPendingInviteByEmail(email) {
        const result = await this.db.select().from(schema.invites).where(and(
          eq(schema.invites.email, email),
          isNull(schema.invites.acceptedAt)
        )).limit(1);
        return result[0];
      }
      async getAllInvites() {
        return await this.db.select().from(schema.invites).orderBy(desc(schema.invites.createdAt));
      }
      async getPendingInvites() {
        return await this.db.select().from(schema.invites).where(isNull(schema.invites.acceptedAt)).orderBy(desc(schema.invites.createdAt));
      }
      async markInviteAsAccepted(inviteId, acceptedBy) {
        await this.db.update(schema.invites).set({ acceptedAt: /* @__PURE__ */ new Date(), acceptedBy }).where(eq(schema.invites.id, inviteId));
      }
      async deleteInvite(inviteId) {
        const result = await this.db.delete(schema.invites).where(eq(schema.invites.id, inviteId)).returning();
        return result.length > 0;
      }
      async deleteExpiredInvites() {
        const result = await this.db.delete(schema.invites).where(and(
          dsql`${schema.invites.expiresAt} < NOW()`,
          isNull(schema.invites.acceptedAt)
        )).returning();
        return result.length > 0;
      }
      // Profile management
      async updateUserProfile(userId, profileData) {
        const result = await this.db.update(schema.users).set({ ...profileData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.users.id, userId)).returning();
        return result[0];
      }
      async getTeacherProfile(userId) {
        const [profile] = await db2.select().from(schema.teacherProfiles).where(eq(schema.teacherProfiles.userId, userId));
        return profile || void 0;
      }
      async updateTeacherProfile(userId, profile) {
        const result = await this.db.update(schema.teacherProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.teacherProfiles.userId, userId)).returning();
        return result[0];
      }
      async getTeacherProfileByStaffId(staffId) {
        const [profile] = await db2.select().from(schema.teacherProfiles).where(eq(schema.teacherProfiles.staffId, staffId));
        return profile || void 0;
      }
      async getAllTeacherProfiles() {
        const profiles = await db2.select().from(schema.teacherProfiles);
        return profiles;
      }
      async createTeacherProfile(profile) {
        const result = await this.db.insert(schema.teacherProfiles).values(profile).returning();
        return result[0];
      }
      async getAdminProfile(userId) {
        const result = await this.db.select().from(schema.adminProfiles).where(eq(schema.adminProfiles.userId, userId)).limit(1);
        return result[0];
      }
      async createAdminProfile(profile) {
        const result = await this.db.insert(schema.adminProfiles).values(profile).returning();
        return result[0];
      }
      async updateAdminProfile(userId, profile) {
        const result = await this.db.update(schema.adminProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.adminProfiles.userId, userId)).returning();
        return result[0];
      }
      async getParentProfile(userId) {
        const result = await this.db.select().from(schema.parentProfiles).where(eq(schema.parentProfiles.userId, userId)).limit(1);
        return result[0];
      }
      async createParentProfile(profile) {
        const result = await this.db.insert(schema.parentProfiles).values(profile).returning();
        return result[0];
      }
      async updateParentProfile(userId, profile) {
        const result = await this.db.update(schema.parentProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.parentProfiles.userId, userId)).returning();
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
        const result = await this.db.select({
          // Student fields
          id: schema.students.id,
          admissionNumber: schema.students.admissionNumber,
          classId: schema.students.classId,
          parentId: schema.students.parentId,
          admissionDate: schema.students.admissionDate,
          emergencyContact: schema.students.emergencyContact,
          emergencyPhone: schema.students.emergencyPhone,
          medicalInfo: schema.students.medicalInfo,
          guardianName: schema.students.guardianName,
          createdAt: schema.students.createdAt,
          // User fields (merged into student object)
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
          email: schema.users.email,
          phone: schema.users.phone,
          address: schema.users.address,
          dateOfBirth: schema.users.dateOfBirth,
          gender: schema.users.gender,
          profileImageUrl: schema.users.profileImageUrl,
          recoveryEmail: schema.users.recoveryEmail,
          // Class name (from classes table)
          className: schema.classes.name
        }).from(schema.students).leftJoin(schema.users, eq(schema.students.id, schema.users.id)).leftJoin(schema.classes, eq(schema.students.classId, schema.classes.id)).where(eq(schema.students.id, id)).limit(1);
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
        const result = await this.db.select({ username: schema.users.username }).from(schema.users).where(sql2`${schema.users.username} IS NOT NULL`);
        return result.map((r) => r.username).filter((u) => u !== null);
      }
      async createStudent(student) {
        const result = await db2.insert(schema.students).values(student).returning();
        return result[0];
      }
      async updateStudent(id, updates) {
        return await this.db.transaction(async (tx) => {
          let updatedUser;
          let updatedStudent;
          if (updates.userPatch && Object.keys(updates.userPatch).length > 0) {
            const userResult = await tx.update(schema.users).set(updates.userPatch).where(eq(schema.users.id, id)).returning();
            updatedUser = userResult[0];
          } else {
            const userResult = await tx.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
            updatedUser = userResult[0];
          }
          if (updates.studentPatch && Object.keys(updates.studentPatch).length > 0) {
            const studentResult = await tx.update(schema.students).set(updates.studentPatch).where(eq(schema.students.id, id)).returning();
            updatedStudent = studentResult[0];
          } else {
            const studentResult = await tx.select().from(schema.students).where(eq(schema.students.id, id)).limit(1);
            updatedStudent = studentResult[0];
          }
          if (updatedUser && updatedStudent) {
            return { user: updatedUser, student: updatedStudent };
          }
          return void 0;
        });
      }
      async setUserActive(id, isActive) {
        const result = await this.db.update(schema.users).set({ isActive }).where(eq(schema.users.id, id)).returning();
        return result[0];
      }
      async deleteStudent(id) {
        const result = await this.db.update(schema.users).set({ isActive: false }).where(eq(schema.users.id, id)).returning();
        return result.length > 0;
      }
      async hardDeleteStudent(id) {
        return await this.db.transaction(async (tx) => {
          try {
            const examSessions3 = await tx.select({ id: schema.examSessions.id }).from(schema.examSessions).where(eq(schema.examSessions.studentId, id));
            const sessionIds = examSessions3.map((session2) => session2.id);
            if (sessionIds.length > 0) {
              await tx.delete(schema.studentAnswers).where(inArray(schema.studentAnswers.sessionId, sessionIds));
            }
            await tx.delete(schema.examSessions).where(eq(schema.examSessions.studentId, id));
            await tx.delete(schema.examResults).where(eq(schema.examResults.studentId, id));
            await tx.delete(schema.attendance).where(eq(schema.attendance.studentId, id));
            await tx.delete(schema.students).where(eq(schema.students.id, id));
            const userResult = await tx.delete(schema.users).where(eq(schema.users.id, id)).returning();
            return userResult.length > 0;
          } catch (error) {
            throw error;
          }
        });
      }
      async getStudentsByClass(classId) {
        return await db2.select().from(schema.students).where(eq(schema.students.classId, classId));
      }
      async getAllStudents(includeInactive = false) {
        if (includeInactive) {
          return await this.db.select().from(schema.students).orderBy(asc(schema.students.createdAt));
        } else {
          return await this.db.select({
            id: schema.students.id,
            admissionNumber: schema.students.admissionNumber,
            classId: schema.students.classId,
            parentId: schema.students.parentId,
            admissionDate: schema.students.admissionDate,
            emergencyContact: schema.students.emergencyContact,
            medicalInfo: schema.students.medicalInfo,
            createdAt: schema.students.createdAt
          }).from(schema.students).innerJoin(schema.users, eq(schema.students.id, schema.users.id)).where(eq(schema.users.isActive, true)).orderBy(asc(schema.students.createdAt));
        }
      }
      async getStudentByAdmissionNumber(admissionNumber) {
        const result = await db2.select().from(schema.students).where(eq(schema.students.admissionNumber, admissionNumber)).limit(1);
        return result[0];
      }
      // Class management
      async getClasses() {
        return await db2.select().from(schema.classes).where(eq(schema.classes.isActive, true)).orderBy(asc(schema.classes.name));
      }
      async getAllClasses(includeInactive = false) {
        if (includeInactive) {
          return await db2.select().from(schema.classes).orderBy(asc(schema.classes.name));
        } else {
          return await db2.select().from(schema.classes).where(eq(schema.classes.isActive, true)).orderBy(asc(schema.classes.name));
        }
      }
      async getClass(id) {
        const result = await db2.select().from(schema.classes).where(eq(schema.classes.id, id)).limit(1);
        return result[0];
      }
      async createClass(classData) {
        const result = await db2.insert(schema.classes).values(classData).returning();
        return result[0];
      }
      async updateClass(id, classData) {
        const result = await db2.update(schema.classes).set(classData).where(eq(schema.classes.id, id)).returning();
        return result[0];
      }
      async deleteClass(id) {
        const result = await db2.delete(schema.classes).where(eq(schema.classes.id, id));
        return result.length > 0;
      }
      // Subject management
      async getSubjects() {
        return await db2.select().from(schema.subjects).orderBy(asc(schema.subjects.name));
      }
      async getSubject(id) {
        const result = await db2.select().from(schema.subjects).where(eq(schema.subjects.id, id)).limit(1);
        return result[0];
      }
      async createSubject(subject) {
        const result = await db2.insert(schema.subjects).values(subject).returning();
        return result[0];
      }
      async updateSubject(id, subject) {
        const result = await db2.update(schema.subjects).set(subject).where(eq(schema.subjects.id, id)).returning();
        return result[0];
      }
      async deleteSubject(id) {
        const result = await db2.delete(schema.subjects).where(eq(schema.subjects.id, id));
        return result.length > 0;
      }
      // Academic terms
      async getCurrentTerm() {
        const result = await db2.select().from(schema.academicTerms).where(eq(schema.academicTerms.isCurrent, true)).limit(1);
        return result[0];
      }
      async getTerms() {
        return await db2.select().from(schema.academicTerms).orderBy(desc(schema.academicTerms.startDate));
      }
      async getAcademicTerms() {
        try {
          const terms = await db2.select().from(schema.academicTerms).orderBy(desc(schema.academicTerms.startDate));
          return terms;
        } catch (error) {
          throw error;
        }
      }
      async getAcademicTerm(id) {
        try {
          const result = await db2.select().from(schema.academicTerms).where(eq(schema.academicTerms.id, id)).limit(1);
          return result[0];
        } catch (error) {
          throw error;
        }
      }
      async createAcademicTerm(term) {
        try {
          const result = await db2.insert(schema.academicTerms).values(term).returning();
          return result[0];
        } catch (error) {
          throw error;
        }
      }
      async updateAcademicTerm(id, term) {
        try {
          const result = await db2.update(schema.academicTerms).set(term).where(eq(schema.academicTerms.id, id)).returning();
          if (result[0]) {
          }
          return result[0];
        } catch (error) {
          throw error;
        }
      }
      async deleteAcademicTerm(id) {
        try {
          const existingTerm = await db2.select().from(schema.academicTerms).where(eq(schema.academicTerms.id, id)).limit(1);
          if (!existingTerm || existingTerm.length === 0) {
            return false;
          }
          const examsUsingTerm = await db2.select({ id: schema.exams.id }).from(schema.exams).where(eq(schema.exams.termId, id));
          if (examsUsingTerm && examsUsingTerm.length > 0) {
            throw new Error(`Cannot delete this term. ${examsUsingTerm.length} exam(s) are linked to it. Please reassign or delete those exams first.`);
          }
          const result = await db2.delete(schema.academicTerms).where(eq(schema.academicTerms.id, id)).returning();
          const success = result && result.length > 0;
          if (success) {
          } else {
          }
          return success;
        } catch (error) {
          if (error?.code === "23503") {
            throw new Error("Cannot delete this term because it is being used by other records (exams, classes, etc.). Please remove those associations first.");
          }
          throw error;
        }
      }
      async markTermAsCurrent(id) {
        try {
          await db2.update(schema.academicTerms).set({ isCurrent: false });
          const result = await db2.update(schema.academicTerms).set({ isCurrent: true }).where(eq(schema.academicTerms.id, id)).returning();
          if (result[0]) {
          }
          return result[0];
        } catch (error) {
          throw error;
        }
      }
      // Helper method to check if a term is being used
      async getExamsByTerm(termId) {
        try {
          const result = await db2.select().from(schema.exams).where(eq(schema.exams.termId, termId));
          return result;
        } catch (error) {
          return [];
        }
      }
      // Attendance management
      async recordAttendance(attendance3) {
        const result = await db2.insert(schema.attendance).values(attendance3).returning();
        return result[0];
      }
      async getAttendanceByStudent(studentId, date) {
        if (date) {
          return await db2.select().from(schema.attendance).where(and(eq(schema.attendance.studentId, studentId), eq(schema.attendance.date, date)));
        }
        return await db2.select().from(schema.attendance).where(eq(schema.attendance.studentId, studentId)).orderBy(desc(schema.attendance.date));
      }
      async getAttendanceByClass(classId, date) {
        return await db2.select().from(schema.attendance).where(and(eq(schema.attendance.classId, classId), eq(schema.attendance.date, date)));
      }
      // Exam management
      async createExam(exam) {
        const result = await db2.insert(schema.exams).values(exam).returning();
        return result[0];
      }
      async getAllExams() {
        try {
          const result = await db2.select().from(schema.exams).orderBy(desc(schema.exams.date));
          return result || [];
        } catch (error) {
          return [];
        }
      }
      async getExamById(id) {
        const result = await db2.select().from(schema.exams).where(eq(schema.exams.id, id)).limit(1);
        return result[0];
      }
      async getExamsByClass(classId) {
        try {
          const result = await db2.select().from(schema.exams).where(eq(schema.exams.classId, classId)).orderBy(desc(schema.exams.date));
          return result || [];
        } catch (error) {
          return [];
        }
      }
      async updateExam(id, exam) {
        const result = await db2.update(schema.exams).set(exam).where(eq(schema.exams.id, id)).returning();
        return result[0];
      }
      async deleteExam(id) {
        try {
          await db2.delete(schema.studentAnswers).where(sql2`${schema.studentAnswers.questionId} IN (SELECT id FROM ${schema.examQuestions} WHERE exam_id = ${id})`);
          await db2.delete(schema.questionOptions).where(sql2`${schema.questionOptions.questionId} IN (SELECT id FROM ${schema.examQuestions} WHERE exam_id = ${id})`);
          await db2.delete(schema.examQuestions).where(eq(schema.examQuestions.examId, id));
          await db2.delete(schema.examResults).where(eq(schema.examResults.examId, id));
          await db2.delete(schema.examSessions).where(eq(schema.examSessions.examId, id));
          const result = await db2.delete(schema.exams).where(eq(schema.exams.id, id)).returning();
          return result.length > 0;
        } catch (error) {
          throw error;
        }
      }
      async recordExamResult(result) {
        try {
          const examResult = await db2.insert(schema.examResults).values(result).returning();
          return examResult[0];
        } catch (error) {
          if (error?.cause?.code === "42703" && error?.cause?.message?.includes("auto_scored")) {
            const { autoScored, ...resultWithoutAutoScored } = result;
            const compatibleResult = {
              ...resultWithoutAutoScored,
              marksObtained: result.score || 0
            };
            const examResult = await db2.insert(schema.examResults).values(compatibleResult).returning();
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
          const updated = await db2.update(schema.examResults).set(result).where(eq(schema.examResults.id, id)).returning();
          return updated[0];
        } catch (error) {
          if (error?.cause?.code === "42703" && error?.cause?.message?.includes("auto_scored")) {
            const { autoScored, ...resultWithoutAutoScored } = result;
            const compatibleResult = {
              ...resultWithoutAutoScored,
              marksObtained: result.score || 0
            };
            const updated = await db2.update(schema.examResults).set(compatibleResult).where(eq(schema.examResults.id, id)).returning();
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
          const SYSTEM_AUTO_SCORING_UUID = "00000000-0000-0000-0000-000000000001";
          try {
            const results = await this.db.select({
              id: schema.examResults.id,
              examId: schema.examResults.examId,
              studentId: schema.examResults.studentId,
              score: schema.examResults.marksObtained,
              maxScore: schema.exams.totalMarks,
              marksObtained: schema.examResults.marksObtained,
              grade: schema.examResults.grade,
              remarks: schema.examResults.remarks,
              recordedBy: schema.examResults.recordedBy,
              createdAt: schema.examResults.createdAt,
              autoScored: sql2`COALESCE(${schema.examResults.autoScored}, ${schema.examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as("autoScored")
            }).from(schema.examResults).leftJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id)).where(eq(schema.examResults.studentId, studentId)).orderBy(desc(schema.examResults.createdAt));
            return results;
          } catch (mainError) {
            const fallbackResults = await this.db.select({
              id: schema.examResults.id,
              examId: schema.examResults.examId,
              studentId: schema.examResults.studentId,
              marksObtained: schema.examResults.marksObtained,
              grade: schema.examResults.grade,
              remarks: schema.examResults.remarks,
              recordedBy: schema.examResults.recordedBy,
              createdAt: schema.examResults.createdAt,
              score: schema.examResults.marksObtained,
              maxScore: sql2`100`.as("maxScore"),
              // Default to 100 if join fails
              autoScored: sql2`(${schema.examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as("autoScored")
            }).from(schema.examResults).where(eq(schema.examResults.studentId, studentId)).orderBy(desc(schema.examResults.createdAt));
            for (const result of fallbackResults) {
              try {
                const exam = await this.db.select({ totalMarks: schema.exams.totalMarks }).from(schema.exams).where(eq(schema.exams.id, result.examId)).limit(1);
                if (exam[0]?.totalMarks) {
                  result.maxScore = exam[0].totalMarks;
                }
              } catch (examError) {
              }
            }
            return fallbackResults;
          }
        } catch (error) {
          return [];
        }
      }
      async getExamResultsByExam(examId) {
        try {
          return await db2.select().from(schema.examResults).where(eq(schema.examResults.examId, examId)).orderBy(desc(schema.examResults.createdAt));
        } catch (error) {
          if (error?.cause?.code === "42703" && error?.cause?.message?.includes("column") && error?.cause?.message?.includes("does not exist")) {
            try {
              return await db2.select({
                id: schema.examResults.id,
                examId: schema.examResults.examId,
                studentId: schema.examResults.studentId,
                marksObtained: schema.examResults.marksObtained,
                // Use legacy field
                grade: schema.examResults.grade,
                remarks: schema.examResults.remarks,
                recordedBy: schema.examResults.recordedBy,
                createdAt: schema.examResults.createdAt,
                // Map marksObtained to score for compatibility
                score: schema.examResults.marksObtained,
                maxScore: dsql`null`.as("maxScore"),
                // Since auto_scored column doesn't exist, determine from recordedBy
                autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as("autoScored")
              }).from(schema.examResults).where(eq(schema.examResults.examId, examId)).orderBy(desc(schema.examResults.createdAt));
            } catch (fallbackError) {
              return [];
            }
          }
          throw error;
        }
      }
      async getExamResultByExamAndStudent(examId, studentId) {
        const result = await db2.select().from(schema.examResults).where(
          sql2`${schema.examResults.examId} = ${examId} AND ${schema.examResults.studentId} = ${studentId}`
        ).limit(1);
        return result[0];
      }
      async getExamResultsByClass(classId) {
        try {
          const results = await db2.select({
            id: schema.examResults.id,
            examId: schema.examResults.examId,
            studentId: schema.examResults.studentId,
            score: schema.examResults.score,
            maxScore: schema.examResults.maxScore,
            marksObtained: schema.examResults.marksObtained,
            grade: schema.examResults.grade,
            remarks: schema.examResults.remarks,
            recordedBy: schema.examResults.recordedBy,
            autoScored: schema.examResults.autoScored,
            createdAt: schema.examResults.createdAt,
            examName: schema.exams.name,
            examType: schema.exams.examType,
            examDate: schema.exams.date,
            totalMarks: schema.exams.totalMarks,
            admissionNumber: schema.students.admissionNumber,
            studentName: sql2`${schema.users.firstName} || ' ' || ${schema.users.lastName}`.as("studentName"),
            className: schema.classes.name,
            subjectName: schema.subjects.name
          }).from(schema.examResults).innerJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id)).innerJoin(schema.students, eq(schema.examResults.studentId, schema.students.id)).innerJoin(schema.users, eq(schema.students.id, schema.users.id)).leftJoin(schema.classes, eq(schema.exams.classId, schema.classes.id)).leftJoin(schema.subjects, eq(schema.exams.subjectId, schema.subjects.id)).where(eq(schema.exams.classId, classId)).orderBy(desc(schema.examResults.createdAt));
          return results;
        } catch (error) {
          if (error?.cause?.code === "42703" && error?.cause?.message?.includes("column") && error?.cause?.message?.includes("does not exist")) {
            try {
              const results = await db2.select({
                id: schema.examResults.id,
                examId: schema.examResults.examId,
                studentId: schema.examResults.studentId,
                marksObtained: schema.examResults.marksObtained,
                grade: schema.examResults.grade,
                remarks: schema.examResults.remarks,
                recordedBy: schema.examResults.recordedBy,
                createdAt: schema.examResults.createdAt,
                // Map marksObtained to score for compatibility
                score: schema.examResults.marksObtained,
                maxScore: dsql`null`.as("maxScore"),
                // Infer autoScored based on recordedBy
                autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as("autoScored")
              }).from(schema.examResults).innerJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id)).where(eq(schema.exams.classId, classId)).orderBy(desc(schema.examResults.createdAt));
              return results;
            } catch (fallbackError) {
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
        const result = await db2.insert(schema.examQuestions).values(questionData).returning();
        return result[0];
      }
      async createExamQuestionWithOptions(question, options) {
        return await db2.transaction(async (tx) => {
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
            const questionResult = await tx.insert(schema.examQuestions).values(questionData).returning();
            const createdQuestion = questionResult[0];
            if (Array.isArray(options) && options.length > 0) {
              const optionsToInsert = options.map((option, index3) => ({
                questionId: createdQuestion.id,
                optionText: option.optionText,
                orderNumber: index3 + 1,
                isCorrect: option.isCorrect
              }));
              const BATCH_SIZE = 5;
              for (let i = 0; i < optionsToInsert.length; i += BATCH_SIZE) {
                const batch = optionsToInsert.slice(i, i + BATCH_SIZE);
                for (const optionData of batch) {
                  await tx.insert(schema.questionOptions).values(optionData);
                }
              }
            }
            return createdQuestion;
          } catch (error) {
            throw new Error(`Failed to create question with options: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        });
      }
      async createExamQuestionsBulk(questionsData) {
        const createdQuestions = [];
        const errors = [];
        for (let i = 0; i < questionsData.length; i++) {
          const { question, options } = questionsData[i];
          try {
            const createdQuestion = await this.createExamQuestionWithOptions(question, options);
            createdQuestions.push(createdQuestion);
            if (i < questionsData.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 150));
            }
          } catch (error) {
            const errorMsg = `Question ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`;
            errors.push(errorMsg);
            if (error instanceof Error && (error.message.includes("circuit") || error.message.includes("breaker") || error.message.includes("pool") || error.message.includes("connection"))) {
              await new Promise((resolve) => setTimeout(resolve, 1e3));
            } else {
              await new Promise((resolve) => setTimeout(resolve, 200));
            }
          }
        }
        return {
          created: createdQuestions.length,
          questions: createdQuestions,
          errors
        };
      }
      async getExamQuestions(examId) {
        return await db2.select({
          id: schema.examQuestions.id,
          examId: schema.examQuestions.examId,
          questionText: schema.examQuestions.questionText,
          questionType: schema.examQuestions.questionType,
          points: schema.examQuestions.points,
          orderNumber: schema.examQuestions.orderNumber,
          imageUrl: schema.examQuestions.imageUrl,
          createdAt: schema.examQuestions.createdAt
        }).from(schema.examQuestions).where(eq(schema.examQuestions.examId, examId)).orderBy(asc(schema.examQuestions.orderNumber));
      }
      async getExamQuestionById(id) {
        const result = await db2.select({
          id: schema.examQuestions.id,
          examId: schema.examQuestions.examId,
          questionText: schema.examQuestions.questionText,
          questionType: schema.examQuestions.questionType,
          points: schema.examQuestions.points,
          orderNumber: schema.examQuestions.orderNumber,
          imageUrl: schema.examQuestions.imageUrl,
          createdAt: schema.examQuestions.createdAt
        }).from(schema.examQuestions).where(eq(schema.examQuestions.id, id)).limit(1);
        return result[0];
      }
      async getExamQuestionCount(examId) {
        const result = await db2.select({ count: dsql`count(*)` }).from(schema.examQuestions).where(eq(schema.examQuestions.examId, examId));
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
            counts[examId] = 0;
          }
        }
        return counts;
      }
      async updateExamQuestion(id, question) {
        const result = await db2.update(schema.examQuestions).set(question).where(eq(schema.examQuestions.id, id)).returning();
        return result[0];
      }
      async deleteExamQuestion(id) {
        try {
          await db2.delete(schema.questionOptions).where(eq(schema.questionOptions.questionId, id));
          await db2.delete(schema.studentAnswers).where(eq(schema.studentAnswers.questionId, id));
          const result = await db2.delete(schema.examQuestions).where(eq(schema.examQuestions.id, id)).returning();
          return result.length > 0;
        } catch (error) {
          throw error;
        }
      }
      // Question options management
      async createQuestionOption(option) {
        const result = await db2.insert(schema.questionOptions).values(option).returning();
        return result[0];
      }
      async getQuestionOptions(questionId) {
        return await db2.select({
          id: schema.questionOptions.id,
          questionId: schema.questionOptions.questionId,
          optionText: schema.questionOptions.optionText,
          isCorrect: schema.questionOptions.isCorrect,
          orderNumber: schema.questionOptions.orderNumber,
          createdAt: schema.questionOptions.createdAt
        }).from(schema.questionOptions).where(eq(schema.questionOptions.questionId, questionId)).orderBy(asc(schema.questionOptions.orderNumber));
      }
      // PERFORMANCE: Bulk fetch question options to eliminate N+1 queries
      async getQuestionOptionsBulk(questionIds) {
        if (questionIds.length === 0) {
          return [];
        }
        return await db2.select({
          id: schema.questionOptions.id,
          questionId: schema.questionOptions.questionId,
          optionText: schema.questionOptions.optionText,
          isCorrect: schema.questionOptions.isCorrect,
          orderNumber: schema.questionOptions.orderNumber,
          createdAt: schema.questionOptions.createdAt
        }).from(schema.questionOptions).where(inArray(schema.questionOptions.questionId, questionIds)).orderBy(asc(schema.questionOptions.questionId), asc(schema.questionOptions.orderNumber));
      }
      // Question Bank management
      async createQuestionBank(bank) {
        const result = await db2.insert(schema.questionBanks).values(bank).returning();
        return result[0];
      }
      async getAllQuestionBanks() {
        return await db2.select().from(schema.questionBanks).orderBy(desc(schema.questionBanks.createdAt));
      }
      async getQuestionBankById(id) {
        const result = await db2.select().from(schema.questionBanks).where(eq(schema.questionBanks.id, id));
        return result[0];
      }
      async getQuestionBanksBySubject(subjectId) {
        return await db2.select().from(schema.questionBanks).where(eq(schema.questionBanks.subjectId, subjectId)).orderBy(desc(schema.questionBanks.createdAt));
      }
      async updateQuestionBank(id, bank) {
        const result = await db2.update(schema.questionBanks).set({ ...bank, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.questionBanks.id, id)).returning();
        return result[0];
      }
      async deleteQuestionBank(id) {
        await db2.delete(schema.questionBanks).where(eq(schema.questionBanks.id, id));
        return true;
      }
      // Question Bank Items management
      async createQuestionBankItem(item, options) {
        const result = await db2.insert(schema.questionBankItems).values(item).returning();
        const questionItem = result[0];
        if (options && options.length > 0) {
          const optionValues = options.map((option) => ({
            questionItemId: questionItem.id,
            ...option
          }));
          await db2.insert(schema.questionBankOptions).values(optionValues);
        }
        return questionItem;
      }
      async getQuestionBankItems(bankId, filters) {
        let query = db2.select().from(schema.questionBankItems).where(eq(schema.questionBankItems.bankId, bankId));
        if (filters?.questionType) {
          query = query.where(eq(schema.questionBankItems.questionType, filters.questionType));
        }
        if (filters?.difficulty) {
          query = query.where(eq(schema.questionBankItems.difficulty, filters.difficulty));
        }
        return await query.orderBy(desc(schema.questionBankItems.createdAt));
      }
      async getQuestionBankItemById(id) {
        const result = await db2.select().from(schema.questionBankItems).where(eq(schema.questionBankItems.id, id));
        return result[0];
      }
      async updateQuestionBankItem(id, item) {
        const result = await db2.update(schema.questionBankItems).set({ ...item, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.questionBankItems.id, id)).returning();
        return result[0];
      }
      async deleteQuestionBankItem(id) {
        await db2.delete(schema.questionBankItems).where(eq(schema.questionBankItems.id, id));
        return true;
      }
      async getQuestionBankItemOptions(questionItemId) {
        return await db2.select().from(schema.questionBankOptions).where(eq(schema.questionBankOptions.questionItemId, questionItemId)).orderBy(asc(schema.questionBankOptions.orderNumber));
      }
      async importQuestionsFromBank(examId, questionItemIds, randomize = false, maxQuestions) {
        let selectedItemIds = [...questionItemIds];
        if (randomize && maxQuestions && maxQuestions < questionItemIds.length) {
          selectedItemIds = questionItemIds.sort(() => Math.random() - 0.5).slice(0, maxQuestions);
        }
        const questions = [];
        const existingQuestionsCount = await this.getExamQuestionCount(examId);
        let orderNumber = existingQuestionsCount + 1;
        for (const itemId of selectedItemIds) {
          const bankItem = await this.getQuestionBankItemById(itemId);
          if (!bankItem) continue;
          const validTypes = ["multiple_choice", "text", "essay", "true_false", "fill_blank"];
          const questionType = validTypes.includes(bankItem.questionType) ? bankItem.questionType : "text";
          let expectedAnswersArray = void 0;
          if (bankItem.expectedAnswers) {
            if (Array.isArray(bankItem.expectedAnswers)) {
              expectedAnswersArray = bankItem.expectedAnswers;
            } else if (typeof bankItem.expectedAnswers === "string") {
              try {
                const parsed = JSON.parse(bankItem.expectedAnswers);
                expectedAnswersArray = Array.isArray(parsed) ? parsed : [bankItem.expectedAnswers];
              } catch {
                expectedAnswersArray = bankItem.expectedAnswers.split(",").map((s) => s.trim()).filter(Boolean);
              }
            }
          }
          const questionData = {
            examId,
            questionText: bankItem.questionText,
            questionType,
            points: bankItem.points || 1,
            orderNumber: orderNumber++,
            imageUrl: bankItem.imageUrl ?? void 0,
            autoGradable: bankItem.autoGradable,
            expectedAnswers: expectedAnswersArray,
            caseSensitive: bankItem.caseSensitive ?? void 0,
            explanationText: bankItem.explanationText ?? void 0,
            hintText: bankItem.hintText ?? void 0
          };
          const question = await this.createExamQuestion(questionData);
          questions.push(question);
          if (bankItem.questionType === "multiple_choice") {
            const bankOptions = await this.getQuestionBankItemOptions(itemId);
            for (const bankOption of bankOptions) {
              await this.createQuestionOption({
                questionId: question.id,
                optionText: bankOption.optionText,
                isCorrect: bankOption.isCorrect,
                orderNumber: bankOption.orderNumber,
                partialCreditValue: 0,
                explanationText: bankOption.explanationText ?? void 0
              });
            }
          }
        }
        return { imported: questions.length, questions };
      }
      // Get AI-suggested grading tasks for teacher review
      async getAISuggestedGradingTasks(teacherId, status) {
        try {
          const assignments = await this.db.select().from(schema.teacherClassAssignments).where(and(
            eq(schema.teacherClassAssignments.teacherId, teacherId),
            eq(schema.teacherClassAssignments.isActive, true)
          ));
          if (assignments.length === 0) {
            return [];
          }
          const classIds = assignments.map((a) => a.classId);
          const subjectIds = assignments.map((a) => a.subjectId);
          const exams3 = await this.db.select().from(schema.exams).where(and(
            inArray(schema.exams.classId, classIds),
            inArray(schema.exams.subjectId, subjectIds)
          ));
          const examIds = exams3.map((e) => e.id);
          if (examIds.length === 0) {
            return [];
          }
          const sessions = await this.db.select().from(schema.examSessions).where(and(
            inArray(schema.examSessions.examId, examIds),
            eq(schema.examSessions.isCompleted, true)
          ));
          const sessionIds = sessions.map((s) => s.id);
          if (sessionIds.length === 0) {
            return [];
          }
          let query = this.db.select({
            id: schema.studentAnswers.id,
            sessionId: schema.studentAnswers.sessionId,
            questionId: schema.studentAnswers.questionId,
            textAnswer: schema.studentAnswers.textAnswer,
            pointsEarned: schema.studentAnswers.pointsEarned,
            feedbackText: schema.studentAnswers.feedbackText,
            autoScored: schema.studentAnswers.autoScored,
            manualOverride: schema.studentAnswers.manualOverride,
            answeredAt: schema.studentAnswers.answeredAt,
            questionText: schema.examQuestions.questionText,
            questionType: schema.examQuestions.questionType,
            points: schema.examQuestions.points,
            expectedAnswers: schema.examQuestions.expectedAnswers,
            studentId: schema.examSessions.studentId,
            examId: schema.examSessions.examId,
            examName: schema.exams.name
          }).from(schema.studentAnswers).innerJoin(schema.examQuestions, eq(schema.studentAnswers.questionId, schema.examQuestions.id)).innerJoin(schema.examSessions, eq(schema.studentAnswers.sessionId, schema.examSessions.id)).innerJoin(schema.exams, eq(schema.examSessions.examId, schema.exams.id)).where(and(
            inArray(schema.studentAnswers.sessionId, sessionIds),
            sql2`(${schema.examQuestions.questionType} = 'text' OR ${schema.examQuestions.questionType} = 'essay')`,
            sql2`${schema.studentAnswers.textAnswer} IS NOT NULL`
          ));
          if (status === "pending") {
            query = query.where(sql2`${schema.studentAnswers.autoScored} = false AND ${schema.studentAnswers.manualOverride} = false`);
          } else if (status === "reviewed") {
            query = query.where(sql2`(${schema.studentAnswers.autoScored} = true OR ${schema.studentAnswers.manualOverride} = true)`);
          }
          const results = await query;
          const studentIds = Array.from(new Set(results.map((r) => r.studentId)));
          const students3 = await this.db.select({
            id: schema.users.id,
            firstName: schema.users.firstName,
            lastName: schema.users.lastName
          }).from(schema.users).where(inArray(schema.users.id, studentIds));
          return results.map((r) => ({
            ...r,
            studentName: `${students3.find((s) => s.id === r.studentId)?.firstName} ${students3.find((s) => s.id === r.studentId)?.lastName}`,
            status: r.autoScored || r.manualOverride ? "reviewed" : "pending",
            aiSuggested: r.pointsEarned > 0 && !r.autoScored && !r.manualOverride
          }));
        } catch (error) {
          return [];
        }
      }
      // Exam sessions management
      async createExamSession(session2) {
        const result = await db2.insert(schema.examSessions).values(session2).returning();
        return result[0];
      }
      async getExamSessionById(id) {
        const result = await db2.select({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        }).from(schema.examSessions).where(eq(schema.examSessions.id, id)).limit(1);
        return result[0];
      }
      async getExamSessionsByExam(examId) {
        return await db2.select({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        }).from(schema.examSessions).where(eq(schema.examSessions.examId, examId)).orderBy(desc(schema.examSessions.startedAt));
      }
      async getExamSessionsByStudent(studentId) {
        return await db2.select({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        }).from(schema.examSessions).where(eq(schema.examSessions.studentId, studentId)).orderBy(desc(schema.examSessions.startedAt));
      }
      async updateExamSession(id, session2) {
        const allowedFields = {};
        const existingColumns = ["examId", "studentId", "startedAt", "submittedAt", "timeRemaining", "isCompleted", "score", "maxScore", "status"];
        for (const [key, value] of Object.entries(session2)) {
          if (existingColumns.includes(key) && value !== void 0) {
            allowedFields[key] = value;
          }
        }
        const result = await db2.update(schema.examSessions).set(allowedFields).where(eq(schema.examSessions.id, id)).returning({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        });
        return result[0];
      }
      async deleteExamSession(id) {
        const result = await db2.delete(schema.examSessions).where(eq(schema.examSessions.id, id));
        return result.length > 0;
      }
      async getActiveExamSession(examId, studentId) {
        const result = await db2.select().from(schema.examSessions).where(and(
          eq(schema.examSessions.examId, examId),
          eq(schema.examSessions.studentId, studentId),
          eq(schema.examSessions.isCompleted, false)
        )).limit(1);
        return result[0];
      }
      // Get all active exam sessions for background cleanup service
      async getActiveExamSessions() {
        return await db2.select({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        }).from(schema.examSessions).where(eq(schema.examSessions.isCompleted, false)).orderBy(desc(schema.examSessions.startedAt));
      }
      // PERFORMANCE: Get only expired sessions directly from database
      async getExpiredExamSessions(now, limit = 100) {
        return await db2.select({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        }).from(schema.examSessions).where(and(
          eq(schema.examSessions.isCompleted, false),
          // Fallback: Use startedAt + reasonable timeout estimate for expired sessions
          dsql`${schema.examSessions.startedAt} + interval '2 hours' < ${now.toISOString()}`
        )).orderBy(asc(schema.examSessions.startedAt)).limit(limit);
      }
      // CIRCUIT BREAKER FIX: Idempotent session creation using UPSERT to prevent connection pool exhaustion
      async createOrGetActiveExamSession(examId, studentId, sessionData) {
        try {
          const insertResult = await db2.insert(schema.examSessions).values({
            examId: sessionData.examId,
            studentId,
            startedAt: /* @__PURE__ */ new Date(),
            timeRemaining: sessionData.timeRemaining,
            isCompleted: false,
            status: "in_progress"
          }).onConflictDoNothing().returning({
            id: schema.examSessions.id,
            examId: schema.examSessions.examId,
            studentId: schema.examSessions.studentId,
            startedAt: schema.examSessions.startedAt,
            submittedAt: schema.examSessions.submittedAt,
            timeRemaining: schema.examSessions.timeRemaining,
            isCompleted: schema.examSessions.isCompleted,
            score: schema.examSessions.score,
            maxScore: schema.examSessions.maxScore,
            status: schema.examSessions.status,
            createdAt: schema.examSessions.createdAt
          });
          if (insertResult.length > 0) {
            return { ...insertResult[0], wasCreated: true };
          }
          const existingSession = await db2.select({
            id: schema.examSessions.id,
            examId: schema.examSessions.examId,
            studentId: schema.examSessions.studentId,
            startedAt: schema.examSessions.startedAt,
            submittedAt: schema.examSessions.submittedAt,
            timeRemaining: schema.examSessions.timeRemaining,
            isCompleted: schema.examSessions.isCompleted,
            score: schema.examSessions.score,
            maxScore: schema.examSessions.maxScore,
            status: schema.examSessions.status,
            createdAt: schema.examSessions.createdAt
          }).from(schema.examSessions).where(and(
            eq(schema.examSessions.examId, examId),
            eq(schema.examSessions.studentId, studentId),
            eq(schema.examSessions.isCompleted, false)
          )).limit(1);
          if (existingSession.length > 0) {
            return { ...existingSession[0], wasCreated: false };
          }
          throw new Error(`Unable to create or retrieve exam session for student ${studentId} exam ${examId}`);
        } catch (error) {
          throw error;
        }
      }
      // Enhanced session management for students
      async getStudentActiveSession(studentId) {
        const result = await this.db.select({
          id: schema.examSessions.id,
          examId: schema.examSessions.examId,
          studentId: schema.examSessions.studentId,
          startedAt: schema.examSessions.startedAt,
          submittedAt: schema.examSessions.submittedAt,
          timeRemaining: schema.examSessions.timeRemaining,
          isCompleted: schema.examSessions.isCompleted,
          score: schema.examSessions.score,
          maxScore: schema.examSessions.maxScore,
          status: schema.examSessions.status,
          createdAt: schema.examSessions.createdAt
        }).from(schema.examSessions).where(and(
          eq(schema.examSessions.studentId, studentId),
          eq(schema.examSessions.isCompleted, false)
        )).orderBy(desc(schema.examSessions.createdAt)).limit(1);
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
          await this.db.update(schema.examSessions).set(updates).where(eq(schema.examSessions.id, sessionId));
        }
      }
      // Student answers management
      async createStudentAnswer(answer) {
        const result = await db2.insert(schema.studentAnswers).values(answer).returning();
        return result[0];
      }
      async getStudentAnswers(sessionId) {
        return await db2.select().from(schema.studentAnswers).where(eq(schema.studentAnswers.sessionId, sessionId)).orderBy(asc(schema.studentAnswers.answeredAt));
      }
      async getStudentAnswerById(id) {
        const result = await db2.select().from(schema.studentAnswers).where(eq(schema.studentAnswers.id, id)).limit(1);
        return result[0];
      }
      async updateStudentAnswer(id, answer) {
        const result = await db2.update(schema.studentAnswers).set(answer).where(eq(schema.studentAnswers.id, id)).returning();
        return result[0];
      }
      async getStudentAnswerBySessionAndQuestion(sessionId, questionId) {
        const result = await db2.select().from(schema.studentAnswers).where(and(
          eq(schema.studentAnswers.sessionId, sessionId),
          eq(schema.studentAnswers.questionId, questionId)
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
        const result = await db2.select().from(schema.questionOptions).where(eq(schema.questionOptions.id, optionId)).limit(1);
        return result[0];
      }
      // OPTIMIZED SCORING: Get all scoring data in a single query for <2s performance
      async getExamScoringData(sessionId) {
        try {
          const sessionResult = await this.db.select({
            id: schema.examSessions.id,
            examId: schema.examSessions.examId,
            studentId: schema.examSessions.studentId,
            startedAt: schema.examSessions.startedAt,
            submittedAt: schema.examSessions.submittedAt,
            timeRemaining: schema.examSessions.timeRemaining,
            isCompleted: schema.examSessions.isCompleted,
            score: schema.examSessions.score,
            maxScore: schema.examSessions.maxScore,
            status: schema.examSessions.status,
            createdAt: schema.examSessions.createdAt
          }).from(schema.examSessions).where(eq(schema.examSessions.id, sessionId)).limit(1);
          if (!sessionResult[0]) {
            throw new Error(`Exam session ${sessionId} not found`);
          }
          const session2 = sessionResult[0];
          const questionsQuery = await this.db.select({
            questionId: schema.examQuestions.id,
            questionType: schema.examQuestions.questionType,
            points: schema.examQuestions.points,
            autoGradable: schema.examQuestions.autoGradable,
            expectedAnswers: schema.examQuestions.expectedAnswers,
            caseSensitive: schema.examQuestions.caseSensitive,
            allowPartialCredit: schema.examQuestions.allowPartialCredit,
            partialCreditRules: schema.examQuestions.partialCreditRules,
            studentSelectedOptionId: schema.studentAnswers.selectedOptionId,
            textAnswer: schema.studentAnswers.textAnswer
          }).from(schema.examQuestions).leftJoin(schema.studentAnswers, and(
            eq(schema.studentAnswers.questionId, schema.examQuestions.id),
            eq(schema.studentAnswers.sessionId, sessionId)
          )).where(eq(schema.examQuestions.examId, session2.examId)).orderBy(asc(schema.examQuestions.orderNumber));
          const correctOptionsQuery = await this.db.select({
            questionId: schema.questionOptions.questionId,
            correctOptionId: schema.questionOptions.id
          }).from(schema.questionOptions).innerJoin(schema.examQuestions, eq(schema.questionOptions.questionId, schema.examQuestions.id)).where(
            and(
              eq(schema.examQuestions.examId, session2.examId),
              eq(schema.questionOptions.isCorrect, true)
            )
          );
          const selectedOptionsQuery = await this.db.select({
            questionId: schema.questionOptions.questionId,
            optionId: schema.questionOptions.id,
            partialCreditValue: schema.questionOptions.partialCreditValue,
            isCorrect: schema.questionOptions.isCorrect
          }).from(schema.questionOptions).innerJoin(schema.studentAnswers, eq(schema.questionOptions.id, schema.studentAnswers.selectedOptionId)).where(eq(schema.studentAnswers.sessionId, sessionId));
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
              }
            }
          }
          for (const [questionId, question] of Array.from(questionMap.entries())) {
            if (!question.autoGradable) continue;
            if ((question.questionType === "text" || question.questionType === "fill_blank") && question.expectedAnswers && question.textAnswer) {
              const studentAnswer = question.textAnswer.trim();
              if (!studentAnswer) continue;
              for (const expectedAnswer of question.expectedAnswers) {
                const normalizedExpected = question.caseSensitive ? expectedAnswer.trim() : expectedAnswer.trim().toLowerCase();
                const normalizedStudent = question.caseSensitive ? studentAnswer : studentAnswer.toLowerCase();
                if (normalizedStudent === normalizedExpected) {
                  question.isCorrect = true;
                  break;
                }
                if (question.allowPartialCredit && !question.isCorrect) {
                  const similarity = this.calculateTextSimilarity(normalizedStudent, normalizedExpected);
                  try {
                    const partialRules = question.partialCreditRules ? JSON.parse(question.partialCreditRules) : { minSimilarity: 0.8, partialPercentage: 0.5 };
                    if (similarity >= (partialRules.minSimilarity || 0.8)) {
                      question.partialCreditEarned = Math.ceil(question.points * (partialRules.partialPercentage || 0.5));
                      break;
                    }
                  } catch (err) {
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
          const questionTypeCount = {};
          for (const question of scoringData) {
            maxScore += question.points;
            questionTypeCount[question.questionType] = (questionTypeCount[question.questionType] || 0) + 1;
            if (question.autoGradable === true) {
              autoScoredQuestions++;
              if (question.isCorrect) {
                studentScore += question.points;
              } else if (question.partialCreditEarned > 0) {
                studentScore += question.partialCreditEarned;
              } else {
              }
            } else {
            }
          }
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
        const result = await db2.insert(schema.announcements).values(announcement).returning();
        return result[0];
      }
      async getAnnouncements(targetRole) {
        const query = db2.select().from(schema.announcements).where(eq(schema.announcements.isPublished, true)).orderBy(desc(schema.announcements.publishedAt));
        if (targetRole) {
        }
        return await query;
      }
      async getAnnouncementById(id) {
        const result = await db2.select().from(schema.announcements).where(eq(schema.announcements.id, id)).limit(1);
        return result[0];
      }
      async updateAnnouncement(id, announcement) {
        const result = await db2.update(schema.announcements).set(announcement).where(eq(schema.announcements.id, id)).returning();
        return result[0];
      }
      async deleteAnnouncement(id) {
        const result = await db2.delete(schema.announcements).where(eq(schema.announcements.id, id));
        return result.length > 0;
      }
      // Messages
      async sendMessage(message) {
        const result = await db2.insert(schema.messages).values(message).returning();
        return result[0];
      }
      async getMessagesByUser(userId) {
        return await db2.select().from(schema.messages).where(eq(schema.messages.recipientId, userId)).orderBy(desc(schema.messages.createdAt));
      }
      async markMessageAsRead(id) {
        await db2.update(schema.messages).set({ isRead: true }).where(eq(schema.messages.id, id));
      }
      // Gallery
      async createGalleryCategory(category) {
        const result = await db2.insert(schema.galleryCategories).values(category).returning();
        return result[0];
      }
      async getGalleryCategories() {
        return await db2.select().from(schema.galleryCategories).orderBy(asc(schema.galleryCategories.name));
      }
      async uploadGalleryImage(image) {
        const result = await db2.insert(schema.gallery).values(image).returning();
        return result[0];
      }
      async getGalleryImages(categoryId) {
        if (categoryId) {
          return await db2.select().from(schema.gallery).where(eq(schema.gallery.categoryId, categoryId)).orderBy(desc(schema.gallery.createdAt));
        }
        return await db2.select().from(schema.gallery).orderBy(desc(schema.gallery.createdAt));
      }
      async getGalleryImageById(id) {
        const result = await db2.select().from(schema.gallery).where(eq(schema.gallery.id, parseInt(id))).limit(1);
        return result[0];
      }
      async deleteGalleryImage(id) {
        const result = await db2.delete(schema.gallery).where(eq(schema.gallery.id, parseInt(id))).returning();
        return result.length > 0;
      }
      // Study resources management
      async createStudyResource(resource) {
        const result = await db2.insert(schema.studyResources).values(resource).returning();
        return result[0];
      }
      async getStudyResources(filters) {
        let query = db2.select().from(schema.studyResources).where(eq(schema.studyResources.isPublished, true));
        if (filters?.classId) {
          query = query.where(eq(schema.studyResources.classId, filters.classId));
        }
        if (filters?.subjectId) {
          query = query.where(eq(schema.studyResources.subjectId, filters.subjectId));
        }
        if (filters?.termId) {
          query = query.where(eq(schema.studyResources.termId, filters.termId));
        }
        if (filters?.resourceType) {
          query = query.where(eq(schema.studyResources.resourceType, filters.resourceType));
        }
        return await query.orderBy(desc(schema.studyResources.createdAt));
      }
      async getStudyResourceById(id) {
        const result = await db2.select().from(schema.studyResources).where(eq(schema.studyResources.id, id)).limit(1);
        return result[0];
      }
      async incrementStudyResourceDownloads(id) {
        await db2.update(schema.studyResources).set({ downloads: dsql`${schema.studyResources.downloads} + 1` }).where(eq(schema.studyResources.id, id));
      }
      async deleteStudyResource(id) {
        const result = await db2.delete(schema.studyResources).where(eq(schema.studyResources.id, id)).returning();
        return result.length > 0;
      }
      // Home page content management
      async createHomePageContent(content) {
        const result = await db2.insert(schema.homePageContent).values(content).returning();
        return result[0];
      }
      // Manual Grading System Methods
      async getGradingTasks(teacherId, status) {
        try {
          if (isPostgres) {
            const pgClient2 = getPgClient();
            if (!pgClient2) return [];
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
            if (status && status !== "all") {
              if (status === "pending") {
                query += " AND sa.id NOT IN (SELECT answer_id FROM manual_scores)";
              } else if (status === "graded") {
                query += " AND sa.id IN (SELECT answer_id FROM manual_scores)";
              }
            }
            query += " ORDER BY es.submitted_at DESC";
            const result = await pgClient2.unsafe(query, [teacherId]);
            return result;
          } else {
            const sqliteConn = getSqliteConnection();
            if (!sqliteConn) return [];
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
          WHERE e.created_by = ?
          AND eq.question_type IN ('text', 'essay')
          AND es.is_completed = 1
        `;
            if (status && status !== "all") {
              if (status === "pending") {
                query += " AND sa.id NOT IN (SELECT answer_id FROM manual_scores)";
              } else if (status === "graded") {
                query += " AND sa.id IN (SELECT answer_id FROM manual_scores)";
              }
            }
            query += " ORDER BY es.submitted_at DESC";
            const stmt = sqliteConn.prepare(query);
            return stmt.all(teacherId);
          }
        } catch (error) {
          console.error("Error fetching grading tasks:", error);
          return [];
        }
      }
      async submitManualGrade(gradeData) {
        try {
          const { taskId, score, comment, graderId } = gradeData;
          if (isPostgres) {
            const pgClient2 = getPgClient();
            if (!pgClient2) throw new Error("PostgreSQL client not available");
            const result = await pgClient2`
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
            await pgClient2`
          UPDATE student_answers
          SET points_earned = ${score}
          WHERE id = ${taskId}
        `;
            const rows = result;
            return rows.length > 0 ? rows[0] : null;
          } else {
            const sqliteConn = getSqliteConnection();
            if (!sqliteConn) throw new Error("SQLite database not available");
            const now = (/* @__PURE__ */ new Date()).toISOString();
            const existing = sqliteConn.prepare("SELECT id FROM manual_scores WHERE answer_id = ?").get(taskId);
            let result;
            if (existing) {
              sqliteConn.prepare(`
            UPDATE manual_scores 
            SET awarded_marks = ?, comment = ?, graded_at = ?, grader_id = ?
            WHERE answer_id = ?
          `).run(score, comment, now, graderId, taskId);
              result = sqliteConn.prepare("SELECT * FROM manual_scores WHERE answer_id = ?").get(taskId);
            } else {
              sqliteConn.prepare(`
            INSERT INTO manual_scores (answer_id, grader_id, awarded_marks, comment, graded_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(taskId, graderId, score, comment, now);
              result = sqliteConn.prepare("SELECT * FROM manual_scores WHERE answer_id = ?").get(taskId);
            }
            sqliteConn.prepare("UPDATE student_answers SET points_earned = ? WHERE id = ?").run(score, taskId);
            return result;
          }
        } catch (error) {
          throw error;
        }
      }
      async getAllExamSessions() {
        try {
          if (isPostgres) {
            const pgClient2 = getPgClient();
            if (!pgClient2) return [];
            const result = await pgClient2`
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
          } else {
            const sqliteConn = getSqliteConnection();
            if (!sqliteConn) return [];
            const result = sqliteConn.prepare(`
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
        `).all();
            return result;
          }
        } catch (error) {
          console.error("Error fetching exam sessions:", error);
          return [];
        }
      }
      async getExamReports(filters) {
        try {
          if (isPostgres) {
            const pgClient2 = getPgClient();
            if (!pgClient2) return [];
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
            const result = await pgClient2.unsafe(query, params);
            return result;
          } else {
            const sqliteConn = getSqliteConnection();
            if (!sqliteConn) return [];
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
          WHERE e.is_published = 1
        `;
            const params = [];
            if (filters.classId) {
              query += ` AND e.class_id = ?`;
              params.push(filters.classId);
            }
            if (filters.subjectId) {
              query += ` AND e.subject_id = ?`;
              params.push(filters.subjectId);
            }
            query += `
          GROUP BY e.id, e.name, c.name, s.name, e.date, e.total_marks
          ORDER BY e.date DESC
        `;
            const stmt = sqliteConn.prepare(query);
            return stmt.all(...params);
          }
        } catch (error) {
          console.error("Error fetching exam reports:", error);
          return [];
        }
      }
      async getExamStudentReports(examId) {
        try {
          if (isPostgres) {
            const pgClient2 = getPgClient();
            if (!pgClient2) return [];
            const result = await pgClient2`
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
          } else {
            const sqliteConn = getSqliteConnection();
            if (!sqliteConn) return [];
            const result = sqliteConn.prepare(`
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
            (SELECT COUNT(*) + 1 FROM exam_results er2 WHERE er2.exam_id = e.id AND er2.marks_obtained > COALESCE(er.marks_obtained, 0)) as rank,
            CAST((julianday(es.submitted_at) - julianday(es.started_at)) * 86400 AS INTEGER) as time_spent,
            es.submitted_at,
            er.auto_scored,
            CASE WHEN EXISTS (
              SELECT 1 FROM manual_scores ms
              JOIN student_answers sa ON ms.answer_id = sa.id
              WHERE sa.session_id = es.id
            ) THEN 1 ELSE 0 END as manual_scored
          FROM users u
          JOIN students st ON u.id = st.id
          JOIN exam_sessions es ON u.id = es.student_id
          JOIN exams e ON es.exam_id = e.id
          LEFT JOIN exam_results er ON e.id = er.exam_id AND u.id = er.student_id
          WHERE e.id = ? AND es.is_completed = 1
          ORDER BY er.marks_obtained DESC
        `).all(examId);
            return result;
          }
        } catch (error) {
          console.error("Error fetching exam student reports:", error);
          return [];
        }
      }
      // Home page content management
      async getHomePageContent(contentType) {
        if (contentType) {
          return await db2.select().from(schema.homePageContent).where(and(eq(schema.homePageContent.contentType, contentType), eq(schema.homePageContent.isActive, true))).orderBy(asc(schema.homePageContent.displayOrder));
        }
        return await db2.select().from(schema.homePageContent).where(eq(schema.homePageContent.isActive, true)).orderBy(asc(schema.homePageContent.displayOrder), asc(schema.homePageContent.contentType));
      }
      async getHomePageContentById(id) {
        const result = await db2.select().from(schema.homePageContent).where(eq(schema.homePageContent.id, id)).limit(1);
        return result[0];
      }
      async updateHomePageContent(id, content) {
        const result = await db2.update(schema.homePageContent).set({ ...content, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.homePageContent.id, id)).returning();
        return result[0];
      }
      async deleteHomePageContent(id) {
        const result = await db2.delete(schema.homePageContent).where(eq(schema.homePageContent.id, id)).returning();
        return result.length > 0;
      }
      // Comprehensive grade management
      async recordComprehensiveGrade(gradeData) {
        try {
          let reportCard = await db2.select().from(schema.reportCards).where(and(
            eq(schema.reportCards.studentId, gradeData.studentId),
            eq(schema.reportCards.termId, gradeData.termId)
          )).limit(1);
          let reportCardId;
          if (reportCard.length === 0) {
            const newReportCard = await db2.insert(schema.reportCards).values({
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
          const existingItem = await db2.select().from(schema.reportCardItems).where(and(
            eq(schema.reportCardItems.reportCardId, reportCardId),
            eq(schema.reportCardItems.subjectId, gradeData.subjectId)
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
            const result = await db2.update(schema.reportCardItems).set(comprehensiveGradeData).where(eq(schema.reportCardItems.id, existingItem[0].id)).returning();
            return result[0];
          } else {
            const result = await db2.insert(schema.reportCardItems).values(comprehensiveGradeData).returning();
            return result[0];
          }
        } catch (error) {
          throw error;
        }
      }
      async getComprehensiveGradesByStudent(studentId, termId) {
        try {
          let query = db2.select({
            id: schema.reportCardItems.id,
            subjectId: schema.reportCardItems.subjectId,
            subjectName: schema.subjects.name,
            testScore: schema.reportCardItems.testScore,
            testMaxScore: schema.reportCardItems.testMaxScore,
            testWeightedScore: schema.reportCardItems.testWeightedScore,
            examScore: schema.reportCardItems.examScore,
            examMaxScore: schema.reportCardItems.examMaxScore,
            examWeightedScore: schema.reportCardItems.examWeightedScore,
            obtainedMarks: schema.reportCardItems.obtainedMarks,
            percentage: schema.reportCardItems.percentage,
            grade: schema.reportCardItems.grade,
            teacherRemarks: schema.reportCardItems.teacherRemarks,
            termId: schema.reportCards.termId,
            createdAt: schema.reportCardItems.createdAt
          }).from(schema.reportCardItems).innerJoin(schema.reportCards, eq(schema.reportCardItems.reportCardId, schema.reportCards.id)).innerJoin(schema.subjects, eq(schema.reportCardItems.subjectId, schema.subjects.id)).where(eq(schema.reportCards.studentId, studentId));
          if (termId) {
            query = query.where(and(
              eq(schema.reportCards.studentId, studentId),
              eq(schema.reportCards.termId, termId)
            ));
          }
          return await query.orderBy(schema.subjects.name);
        } catch (error) {
          return [];
        }
      }
      async getComprehensiveGradesByClass(classId, termId) {
        try {
          let query = db2.select({
            studentId: schema.reportCards.studentId,
            studentName: sql2`CONCAT(${schema.users.firstName}, ' ', ${schema.users.lastName})`.as("studentName"),
            admissionNumber: schema.students.admissionNumber,
            subjectName: schema.subjects.name,
            testScore: schema.reportCardItems.testScore,
            examScore: schema.reportCardItems.examScore,
            obtainedMarks: schema.reportCardItems.obtainedMarks,
            grade: schema.reportCardItems.grade,
            teacherRemarks: schema.reportCardItems.teacherRemarks
          }).from(schema.reportCardItems).innerJoin(schema.reportCards, eq(schema.reportCardItems.reportCardId, schema.reportCards.id)).innerJoin(schema.students, eq(schema.reportCards.studentId, schema.students.id)).innerJoin(schema.users, eq(schema.students.id, schema.users.id)).innerJoin(schema.subjects, eq(schema.reportCardItems.subjectId, schema.subjects.id)).where(eq(schema.students.classId, classId));
          if (termId) {
            query = query.where(and(
              eq(schema.students.classId, classId),
              eq(schema.reportCards.termId, termId)
            ));
          }
          return await query.orderBy(schema.users.firstName, schema.users.lastName, schema.subjects.name);
        } catch (error) {
          return [];
        }
      }
      async createReportCard(reportCardData, grades) {
        return await this.db.transaction(async (tx) => {
          try {
            const reportCard = await tx.insert(schema.reportCards).values(reportCardData).returning();
            if (grades.length > 0) {
              const gradeUpdates = grades.map(
                (grade) => tx.update(schema.reportCardItems).set({ reportCardId: reportCard[0].id }).where(eq(schema.reportCardItems.id, grade.id))
              );
              await Promise.all(gradeUpdates);
            }
            return {
              reportCard: reportCard[0],
              grades
            };
          } catch (error) {
            throw error;
          }
        });
      }
      async getReportCard(id) {
        try {
          const result = await db2.select().from(schema.reportCards).where(eq(schema.reportCards.id, id)).limit(1);
          return result[0];
        } catch (error) {
          return void 0;
        }
      }
      async getReportCardsByStudentId(studentId) {
        try {
          return await db2.select().from(schema.reportCards).where(eq(schema.reportCards.studentId, studentId)).orderBy(desc(schema.reportCards.generatedAt));
        } catch (error) {
          return [];
        }
      }
      async getReportCardItems(reportCardId) {
        try {
          return await db2.select().from(schema.reportCardItems).where(eq(schema.reportCardItems.reportCardId, reportCardId));
        } catch (error) {
          return [];
        }
      }
      async getStudentsByParentId(parentId) {
        try {
          return await db2.select().from(schema.students).where(eq(schema.students.parentId, parentId));
        } catch (error) {
          return [];
        }
      }
      // Analytics and Reports
      async getAnalyticsOverview() {
        try {
          const [students3, teachers, admins, parents] = await Promise.all([
            db2.select().from(schema.users).where(eq(schema.users.roleId, 1)),
            db2.select().from(schema.users).where(eq(schema.users.roleId, 2)),
            db2.select().from(schema.users).where(eq(schema.users.roleId, 4)),
            db2.select().from(schema.users).where(eq(schema.users.roleId, 3))
          ]);
          const [classes3, subjects3, exams3, examResults3] = await Promise.all([
            db2.select().from(schema.classes),
            db2.select().from(schema.subjects),
            db2.select().from(schema.exams),
            db2.select().from(schema.examResults)
          ]);
          const gradeDistribution = this.calculateGradeDistribution(examResults3);
          const subjectPerformance = await this.calculateSubjectPerformance(examResults3, subjects3);
          return {
            totalUsers: students3.length + teachers.length + admins.length + parents.length,
            totalStudents: students3.length,
            totalTeachers: teachers.length,
            totalAdmins: admins.length,
            totalParents: parents.length,
            totalClasses: classes3.length,
            totalSubjects: subjects3.length,
            totalExams: exams3.length,
            totalExamResults: examResults3.length,
            averageClassSize: classes3.length > 0 ? Math.round(students3.length / classes3.length) : 0,
            gradeDistribution,
            subjectPerformance,
            recentActivity: {
              newStudentsThisMonth: students3.filter(
                (s) => s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
              ).length,
              examsThisMonth: exams3.filter(
                (e) => e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3)
              ).length
            }
          };
        } catch (error) {
          return this.getFallbackAnalytics();
        }
      }
      async getPerformanceAnalytics(filters) {
        try {
          let examResults3 = await db2.select().from(schema.examResults);
          if (filters.classId) {
            const studentsInClass = await db2.select().from(schema.students).where(eq(schema.students.classId, filters.classId));
            const studentIds = studentsInClass.map((s) => s.id);
            examResults3 = examResults3.filter((r) => studentIds.includes(r.studentId));
          }
          if (filters.subjectId) {
            const examsForSubject = await db2.select().from(schema.exams).where(eq(schema.exams.subjectId, filters.subjectId));
            const examIds = examsForSubject.map((e) => e.id);
            examResults3 = examResults3.filter((r) => examIds.includes(r.examId));
          }
          const totalExams = examResults3.length;
          const averageScore = totalExams > 0 ? examResults3.reduce((sum, r) => sum + (r.marksObtained || 0), 0) / totalExams : 0;
          const gradeDistribution = this.calculateGradeDistribution(examResults3);
          const performanceTrends = this.calculatePerformanceTrends(examResults3);
          const studentPerformance = this.calculateStudentPerformance(examResults3);
          return {
            totalExams,
            averageScore: Math.round(averageScore * 100) / 100,
            averagePercentage: Math.round(averageScore / 100 * 100),
            // Assuming 100 is typical total marks
            gradeDistribution,
            performanceTrends,
            topPerformers: studentPerformance.slice(0, 5),
            strugglingStudents: studentPerformance.slice(-5),
            passRate: Math.round(examResults3.filter((r) => (r.marksObtained || 0) >= 50).length / totalExams * 100)
          };
        } catch (error) {
          return { error: "Failed to calculate performance analytics" };
        }
      }
      async getTrendAnalytics(months = 6) {
        try {
          const cutoffDate = /* @__PURE__ */ new Date();
          cutoffDate.setMonth(cutoffDate.getMonth() - months);
          const [students3, exams3, examResults3] = await Promise.all([
            db2.select().from(schema.users).where(and(
              eq(schema.users.roleId, 1)
              // Note: In a real implementation, you'd filter by createdAt >= cutoffDate
            )),
            db2.select().from(schema.exams),
            db2.select().from(schema.examResults)
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
              exams: Math.floor(exams3.length / months) + Math.floor(Math.random() * 3),
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
          return { error: "Failed to calculate trend analytics" };
        }
      }
      async getAttendanceAnalytics(filters) {
        try {
          let attendance3 = await db2.select().from(schema.attendance);
          if (filters.classId) {
            const studentsInClass = await db2.select().from(schema.students).where(eq(schema.students.classId, filters.classId));
            const studentIds = studentsInClass.map((s) => s.id);
            attendance3 = attendance3.filter((a) => studentIds.includes(a.studentId));
          }
          if (filters.startDate && filters.endDate) {
            attendance3 = attendance3.filter((a) => {
              const attendanceDate = new Date(a.date);
              return attendanceDate >= new Date(filters.startDate) && attendanceDate <= new Date(filters.endDate);
            });
          }
          const totalRecords = attendance3.length;
          const presentCount = attendance3.filter((a) => a.status === "Present").length;
          const absentCount = attendance3.filter((a) => a.status === "Absent").length;
          const lateCount = attendance3.filter((a) => a.status === "Late").length;
          const excusedCount = attendance3.filter((a) => a.status === "Excused").length;
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
            dailyTrends: this.calculateDailyAttendanceTrends(attendance3),
            classComparison: await this.calculateClassAttendanceComparison()
          };
        } catch (error) {
          return { error: "Failed to calculate attendance analytics" };
        }
      }
      calculateGradeDistribution(examResults3) {
        const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };
        examResults3.forEach((result) => {
          const percentage = result.obtainedMarks / result.totalMarks * 100;
          if (percentage >= 90) grades.A++;
          else if (percentage >= 80) grades.B++;
          else if (percentage >= 70) grades.C++;
          else if (percentage >= 60) grades.D++;
          else grades.F++;
        });
        return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
      }
      async calculateSubjectPerformance(examResults3, subjects3) {
        const subjectMap = /* @__PURE__ */ new Map();
        subjects3.forEach((s) => subjectMap.set(s.id, s.name));
        const performance = /* @__PURE__ */ new Map();
        examResults3.forEach((result) => {
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
      calculatePerformanceTrends(examResults3) {
        const trends = /* @__PURE__ */ new Map();
        examResults3.forEach((result) => {
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
      calculateStudentPerformance(examResults3) {
        const performance = /* @__PURE__ */ new Map();
        examResults3.forEach((result) => {
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
      calculateDailyAttendanceTrends(attendance3) {
        const trends = /* @__PURE__ */ new Map();
        attendance3.forEach((record) => {
          const date = record.date;
          if (!trends.has(date)) {
            trends.set(date, { present: 0, total: 0 });
          }
          const current = trends.get(date);
          current.total += 1;
          if (record.status === "Present") current.present += 1;
        });
        return Array.from(trends.entries()).map(([date, data]) => ({
          date,
          rate: Math.round(data.present / data.total * 100)
        }));
      }
      async calculateClassAttendanceComparison() {
        try {
          const classes3 = await db2.select().from(schema.classes);
          return classes3.map((cls) => ({
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
      // Contact messages management - ensuring 100% database persistence
      async createContactMessage(message) {
        const result = await this.db.insert(schema.contactMessages).values(message).returning();
        return result[0];
      }
      async getContactMessages() {
        return await this.db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt));
      }
      // Report finalization methods
      async getExamResultById(id) {
        try {
          const result = await this.db.select().from(schema.examResults).where(eq(schema.examResults.id, id)).limit(1);
          return result[0];
        } catch (error) {
          return void 0;
        }
      }
      async getFinalizedReportsByExams(examIds, filters) {
        try {
          const results = await this.db.select().from(schema.examResults).where(and(
            inArray(schema.examResults.examId, examIds)
            // Add teacherFinalized field check when column exists
            // eq(schema.examResults.teacherFinalized, true)
          )).orderBy(desc(schema.examResults.createdAt));
          return results;
        } catch (error) {
          return [];
        }
      }
      async getAllFinalizedReports(filters) {
        try {
          const results = await this.db.select().from(schema.examResults).orderBy(desc(schema.examResults.createdAt));
          return results;
        } catch (error) {
          return [];
        }
      }
      async getContactMessageById(id) {
        const result = await this.db.select().from(schema.contactMessages).where(eq(schema.contactMessages.id, id)).limit(1);
        return result[0];
      }
      async markContactMessageAsRead(id) {
        const result = await this.db.update(schema.contactMessages).set({ isRead: true }).where(eq(schema.contactMessages.id, id)).returning();
        return result.length > 0;
      }
      async respondToContactMessage(id, response, respondedBy) {
        const result = await this.db.update(schema.contactMessages).set({
          response,
          respondedBy,
          respondedAt: /* @__PURE__ */ new Date(),
          isRead: true
        }).where(eq(schema.contactMessages.id, id)).returning();
        return result[0];
      }
      // Performance monitoring implementation
      async logPerformanceEvent(event) {
        const result = await this.db.insert(schema.performanceEvents).values(event).returning();
        return result[0];
      }
      async getPerformanceMetrics(hours = 24) {
        try {
          const since = new Date(Date.now() - hours * 60 * 60 * 1e3);
          const sinceISO = since.toISOString();
          const events = await this.db.select().from(schema.performanceEvents).where(sql2`${schema.performanceEvents.createdAt} >= ${sinceISO}`);
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
          const alerts = await this.db.select().from(schema.performanceEvents).where(and(
            sql2`${schema.performanceEvents.createdAt} >= ${sinceISO}`,
            eq(schema.performanceEvents.goalAchieved, false)
          )).orderBy(desc(schema.performanceEvents.createdAt)).limit(50);
          return alerts;
        } catch (error) {
          return [];
        }
      }
      // Teacher class assignments implementation
      async createTeacherClassAssignment(assignment) {
        const result = await this.db.insert(schema.teacherClassAssignments).values(assignment).returning();
        return result[0];
      }
      async getTeacherClassAssignments(teacherId) {
        return await this.db.select().from(schema.teacherClassAssignments).where(and(
          eq(schema.teacherClassAssignments.teacherId, teacherId),
          eq(schema.teacherClassAssignments.isActive, true)
        )).orderBy(schema.teacherClassAssignments.createdAt);
      }
      async getTeachersForClassSubject(classId, subjectId) {
        const assignments = await this.db.select({
          user: schema.users
        }).from(schema.teacherClassAssignments).innerJoin(schema.users, eq(schema.teacherClassAssignments.teacherId, schema.users.id)).where(and(
          eq(schema.teacherClassAssignments.classId, classId),
          eq(schema.teacherClassAssignments.subjectId, subjectId),
          eq(schema.teacherClassAssignments.isActive, true)
        ));
        return assignments.map((a) => a.user);
      }
      async updateTeacherClassAssignment(id, assignment) {
        const result = await this.db.update(schema.teacherClassAssignments).set(assignment).where(eq(schema.teacherClassAssignments.id, id)).returning();
        return result[0];
      }
      async deleteTeacherClassAssignment(id) {
        const result = await this.db.delete(schema.teacherClassAssignments).where(eq(schema.teacherClassAssignments.id, id)).returning();
        return result.length > 0;
      }
      // Teacher timetable implementation
      async createTimetableEntry(entry) {
        const result = await this.db.insert(schema.timetable).values(entry).returning();
        return result[0];
      }
      async getTimetableByTeacher(teacherId, termId) {
        const conditions = [
          eq(schema.timetable.teacherId, teacherId),
          eq(schema.timetable.isActive, true)
        ];
        if (termId) {
          conditions.push(eq(schema.timetable.termId, termId));
        }
        return await this.db.select().from(schema.timetable).where(and(...conditions)).orderBy(schema.timetable.dayOfWeek, schema.timetable.startTime);
      }
      async updateTimetableEntry(id, entry) {
        const result = await this.db.update(schema.timetable).set(entry).where(eq(schema.timetable.id, id)).returning();
        return result[0];
      }
      async deleteTimetableEntry(id) {
        const result = await this.db.delete(schema.timetable).where(eq(schema.timetable.id, id)).returning();
        return result.length > 0;
      }
      // Teacher dashboard data - comprehensive method
      async getTeacherDashboardData(teacherId) {
        const profile = await this.getTeacherProfile(teacherId);
        const user = await this.getUser(teacherId);
        const assignmentsData = await this.db.select({
          id: schema.teacherClassAssignments.id,
          className: schema.classes.name,
          classLevel: schema.classes.level,
          subjectName: schema.subjects.name,
          subjectCode: schema.subjects.code,
          termName: schema.academicTerms.name
        }).from(schema.teacherClassAssignments).innerJoin(schema.classes, eq(schema.teacherClassAssignments.classId, schema.classes.id)).innerJoin(schema.subjects, eq(schema.teacherClassAssignments.subjectId, schema.subjects.id)).leftJoin(schema.academicTerms, eq(schema.teacherClassAssignments.termId, schema.academicTerms.id)).where(and(
          eq(schema.teacherClassAssignments.teacherId, teacherId),
          eq(schema.teacherClassAssignments.isActive, true)
        )).orderBy(schema.classes.name, schema.subjects.name);
        const timetableData = await this.db.select({
          id: schema.timetable.id,
          dayOfWeek: schema.timetable.dayOfWeek,
          startTime: schema.timetable.startTime,
          endTime: schema.timetable.endTime,
          location: schema.timetable.location,
          className: schema.classes.name,
          subjectName: schema.subjects.name
        }).from(schema.timetable).innerJoin(schema.classes, eq(schema.timetable.classId, schema.classes.id)).innerJoin(schema.subjects, eq(schema.timetable.subjectId, schema.subjects.id)).where(and(
          eq(schema.timetable.teacherId, teacherId),
          eq(schema.timetable.isActive, true)
        )).orderBy(schema.timetable.dayOfWeek, schema.timetable.startTime);
        return {
          profile,
          user,
          assignments: assignmentsData,
          timetable: timetableData
        };
      }
      // Manual grading task queue
      async createGradingTask(task) {
        try {
          const result = await this.db.insert(schema.gradingTasks).values(task).returning();
          return result[0];
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            return { id: 0, ...task };
          }
          throw error;
        }
      }
      async assignGradingTask(taskId, teacherId) {
        try {
          const result = await this.db.update(schema.gradingTasks).set({
            assignedTeacherId: teacherId,
            assignedAt: /* @__PURE__ */ new Date(),
            status: "in_progress"
          }).where(eq(schema.gradingTasks.id, taskId)).returning();
          return result[0];
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            return void 0;
          }
          throw error;
        }
      }
      async getGradingTasksByTeacher(teacherId, status) {
        try {
          let query = this.db.select().from(schema.gradingTasks).where(eq(schema.gradingTasks.assignedTeacherId, teacherId)).orderBy(desc(schema.gradingTasks.priority), asc(schema.gradingTasks.createdAt));
          if (status) {
            query = query.where(and(
              eq(schema.gradingTasks.assignedTeacherId, teacherId),
              eq(schema.gradingTasks.status, status)
            ));
          }
          return await query;
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            return [];
          }
          throw error;
        }
      }
      async getGradingTasksBySession(sessionId) {
        try {
          return await this.db.select().from(schema.gradingTasks).where(eq(schema.gradingTasks.sessionId, sessionId)).orderBy(desc(schema.gradingTasks.priority), asc(schema.gradingTasks.createdAt));
        } catch (error) {
          if (error?.cause?.code === "42P01") {
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
          const result = await this.db.update(schema.gradingTasks).set(updateData).where(eq(schema.gradingTasks.id, taskId)).returning();
          return result[0];
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            return void 0;
          }
          throw error;
        }
      }
      async completeGradingTask(taskId, pointsEarned, feedbackText) {
        try {
          return await this.db.transaction(async (tx) => {
            const tasks = await tx.select().from(schema.gradingTasks).where(eq(schema.gradingTasks.id, taskId)).limit(1);
            if (tasks.length === 0) {
              return void 0;
            }
            const task = tasks[0];
            const answers = await tx.update(schema.studentAnswers).set({
              pointsEarned,
              feedbackText,
              autoScored: false,
              manualOverride: true
            }).where(eq(schema.studentAnswers.id, task.answerId)).returning();
            const updatedTasks = await tx.update(schema.gradingTasks).set({
              status: "completed",
              completedAt: /* @__PURE__ */ new Date()
            }).where(eq(schema.gradingTasks.id, taskId)).returning();
            return {
              task: updatedTasks[0],
              answer: answers[0]
            };
          });
        } catch (error) {
          if (error?.cause?.code === "42P01") {
            return void 0;
          }
          throw error;
        }
      }
      // Audit logging implementation
      async createAuditLog(log) {
        const result = await this.db.insert(schema.auditLogs).values(log).returning();
        return result[0];
      }
      async getAuditLogs(filters) {
        const conditions = [];
        if (filters?.userId) {
          conditions.push(eq(schema.auditLogs.userId, filters.userId));
        }
        if (filters?.entityType) {
          conditions.push(eq(schema.auditLogs.entityType, filters.entityType));
        }
        if (filters?.entityId) {
          conditions.push(eq(schema.auditLogs.entityId, filters.entityId));
        }
        if (filters?.action) {
          conditions.push(eq(schema.auditLogs.action, filters.action));
        }
        if (filters?.startDate) {
          conditions.push(dsql`${schema.auditLogs.createdAt} >= ${filters.startDate}`);
        }
        if (filters?.endDate) {
          conditions.push(dsql`${schema.auditLogs.createdAt} <= ${filters.endDate}`);
        }
        let query = this.db.select().from(schema.auditLogs).orderBy(desc(schema.auditLogs.createdAt));
        if (conditions.length > 0) {
          query = query.where(and(...conditions));
        }
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }
        return await query;
      }
      async getAuditLogsByEntity(entityType, entityId) {
        return await this.db.select().from(schema.auditLogs).where(and(
          eq(schema.auditLogs.entityType, entityType),
          eq(schema.auditLogs.entityId, entityId)
        )).orderBy(desc(schema.auditLogs.createdAt));
      }
      // Notification management implementation
      async createNotification(notification) {
        const result = await this.db.insert(schema.notifications).values(notification).returning();
        return result[0];
      }
      async getNotificationsByUserId(userId) {
        return await this.db.select().from(schema.notifications).where(eq(schema.notifications.userId, userId)).orderBy(desc(schema.notifications.createdAt));
      }
      async getUnreadNotificationCount(userId) {
        const result = await this.db.select({ count: dsql`count(*)::int` }).from(schema.notifications).where(and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        ));
        return result[0]?.count || 0;
      }
      async markNotificationAsRead(notificationId) {
        const result = await this.db.update(schema.notifications).set({ isRead: true }).where(eq(schema.notifications.id, notificationId)).returning();
        return result[0];
      }
      async markAllNotificationsAsRead(userId) {
        await this.db.update(schema.notifications).set({ isRead: true }).where(and(
          eq(schema.notifications.userId, userId),
          eq(schema.notifications.isRead, false)
        ));
      }
      // Password reset attempt tracking for rate limiting
      async createPasswordResetAttempt(identifier, ipAddress, success) {
        const result = await this.db.insert(schema.passwordResetAttempts).values({
          identifier,
          ipAddress,
          success
        }).returning();
        return result[0];
      }
      async getRecentPasswordResetAttempts(identifier, minutesAgo) {
        const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1e3);
        return await this.db.select().from(schema.passwordResetAttempts).where(and(
          eq(schema.passwordResetAttempts.identifier, identifier),
          dsql`${schema.passwordResetAttempts.attemptedAt} > ${cutoffTime}`
        )).orderBy(desc(schema.passwordResetAttempts.attemptedAt));
      }
      async deleteOldPasswordResetAttempts(hoursAgo) {
        const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1e3);
        await this.db.delete(schema.passwordResetAttempts).where(dsql`${schema.passwordResetAttempts.attemptedAt} < ${cutoffTime}`);
        return true;
      }
      // Account security methods
      async lockAccount(userId, lockUntil) {
        const result = await this.db.update(schema.users).set({ accountLockedUntil: lockUntil }).where(eq(schema.users.id, userId)).returning();
        return result.length > 0;
      }
      async unlockAccount(userId) {
        const result = await this.db.update(schema.users).set({ accountLockedUntil: null }).where(eq(schema.users.id, userId)).returning();
        return result.length > 0;
      }
      async isAccountLocked(userId) {
        const user = await this.db.select({ accountLockedUntil: schema.users.accountLockedUntil }).from(schema.users).where(eq(schema.users.id, userId)).limit(1);
        if (!user[0] || !user[0].accountLockedUntil) {
          return false;
        }
        return new Date(user[0].accountLockedUntil) > /* @__PURE__ */ new Date();
      }
      // Admin recovery powers
      async adminResetUserPassword(userId, newPasswordHash, resetBy, forceChange) {
        const result = await this.db.update(schema.users).set({
          passwordHash: newPasswordHash,
          mustChangePassword: forceChange
        }).where(eq(schema.users.id, userId)).returning();
        if (result.length > 0) {
          await this.createAuditLog({
            userId: resetBy,
            action: "admin_password_reset",
            entityType: "user",
            entityId: "0",
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
        const result = await this.db.update(schema.users).set({ recoveryEmail }).where(eq(schema.users.id, userId)).returning();
        if (result.length > 0) {
          await this.createAuditLog({
            userId: updatedBy,
            action: "recovery_email_updated",
            entityType: "user",
            entityId: "0",
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
        return await this.db.select().from(schema.exams).where(
          and(
            eq(schema.exams.isPublished, false),
            dsql`${schema.exams.startTime} <= ${nowISO}`,
            eq(schema.exams.timerMode, "global")
            // Only publish global timer exams automatically
          )
        ).limit(50);
      }
      // Settings management methods (Module 1)
      async getSetting(key) {
        const result = await this.db.select().from(schema.settings).where(eq(schema.settings.key, key)).limit(1);
        return result[0];
      }
      async getAllSettings() {
        return await this.db.select().from(schema.settings).orderBy(asc(schema.settings.key));
      }
      async createSetting(setting) {
        const result = await this.db.insert(schema.settings).values(setting).returning();
        return result[0];
      }
      async updateSetting(key, value, updatedBy) {
        const result = await this.db.update(schema.settings).set({ value, updatedBy, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.settings.key, key)).returning();
        return result[0];
      }
      async deleteSetting(key) {
        const result = await this.db.delete(schema.settings).where(eq(schema.settings.key, key)).returning();
        return result.length > 0;
      }
      // Counters for atomic sequence generation (Module 1)
      async getNextSequence(classCode, year) {
        const result = await this.db.insert(schema.counters).values({
          classCode,
          year,
          sequence: 1
        }).onConflictDoUpdate({
          target: [schema.counters.classCode, schema.counters.year],
          set: {
            sequence: dsql`${schema.counters.sequence} + 1`,
            updatedAt: /* @__PURE__ */ new Date()
          }
        }).returning();
        return result[0].sequence;
      }
      async getCounter(classCode, year) {
        const result = await this.db.select().from(schema.counters).where(
          and(
            eq(schema.counters.classCode, classCode),
            eq(schema.counters.year, year)
          )
        ).limit(1);
        return result[0];
      }
      async resetCounter(classCode, year) {
        const result = await this.db.update(schema.counters).set({ sequence: 0, updatedAt: /* @__PURE__ */ new Date() }).where(
          and(
            eq(schema.counters.classCode, classCode),
            eq(schema.counters.year, year)
          )
        ).returning();
        return result.length > 0;
      }
      // Job Vacancy System implementations
      async createVacancy(vacancy) {
        const result = await this.db.insert(schema.vacancies).values(vacancy).returning();
        return result[0];
      }
      async getVacancy(id) {
        const result = await this.db.select().from(schema.vacancies).where(eq(schema.vacancies.id, id)).limit(1);
        return result[0];
      }
      async getAllVacancies(status) {
        if (status) {
          return await this.db.select().from(schema.vacancies).where(eq(schema.vacancies.status, status)).orderBy(desc(schema.vacancies.createdAt));
        }
        return await this.db.select().from(schema.vacancies).orderBy(desc(schema.vacancies.createdAt));
      }
      async updateVacancy(id, updates) {
        const result = await this.db.update(schema.vacancies).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.vacancies.id, id)).returning();
        return result[0];
      }
      async deleteVacancy(id) {
        const result = await this.db.delete(schema.vacancies).where(eq(schema.vacancies.id, id)).returning();
        return result.length > 0;
      }
      // Teacher Applications implementations
      async createTeacherApplication(application) {
        const result = await this.db.insert(schema.teacherApplications).values(application).returning();
        return result[0];
      }
      async getTeacherApplication(id) {
        const result = await this.db.select().from(schema.teacherApplications).where(eq(schema.teacherApplications.id, id)).limit(1);
        return result[0];
      }
      async getAllTeacherApplications(status) {
        if (status) {
          return await this.db.select().from(schema.teacherApplications).where(eq(schema.teacherApplications.status, status)).orderBy(desc(schema.teacherApplications.dateApplied));
        }
        return await this.db.select().from(schema.teacherApplications).orderBy(desc(schema.teacherApplications.dateApplied));
      }
      async updateTeacherApplication(id, updates) {
        const result = await this.db.update(schema.teacherApplications).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.teacherApplications.id, id)).returning();
        return result[0];
      }
      async approveTeacherApplication(applicationId, approvedBy) {
        const application = await this.getTeacherApplication(applicationId);
        if (!application) {
          throw new Error("Application not found");
        }
        const updatedApplication = await this.db.update(schema.teacherApplications).set({
          status: "approved",
          reviewedBy: approvedBy,
          reviewedAt: /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(schema.teacherApplications.id, applicationId)).returning();
        const approvedTeacher = await this.db.insert(schema.approvedTeachers).values({
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
        const result = await this.db.update(schema.teacherApplications).set({
          status: "rejected",
          reviewedBy,
          reviewedAt: /* @__PURE__ */ new Date(),
          rejectionReason: reason,
          updatedAt: /* @__PURE__ */ new Date()
        }).where(eq(schema.teacherApplications.id, applicationId)).returning();
        return result[0];
      }
      // Approved Teachers implementations
      async getApprovedTeacherByEmail(email) {
        const result = await this.db.select().from(schema.approvedTeachers).where(eq(schema.approvedTeachers.googleEmail, email)).limit(1);
        return result[0];
      }
      async getAllApprovedTeachers() {
        return await this.db.select().from(schema.approvedTeachers).orderBy(desc(schema.approvedTeachers.dateApproved));
      }
      async deleteApprovedTeacher(id) {
        const result = await this.db.delete(schema.approvedTeachers).where(eq(schema.approvedTeachers.id, id)).returning();
        return result.length > 0;
      }
      // Super Admin implementations
      async getSuperAdminStats() {
        const [admins, users3, exams3] = await Promise.all([
          this.getUsersByRole(1),
          // Admins have roleId 1
          this.getAllUsers(),
          this.db.select().from(schema.exams)
        ]);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1e3);
        const activeSessions = users3.filter((u) => u.updatedAt && u.updatedAt > oneHourAgo).length;
        return {
          totalAdmins: admins.length,
          totalUsers: users3.length,
          activeSessions,
          totalExams: exams3.length
        };
      }
      async getSystemSettings() {
        const result = await this.db.select().from(schema.systemSettings).limit(1);
        return result[0];
      }
      async updateSystemSettings(settings3) {
        const existing = await this.getSystemSettings();
        if (existing) {
          const result = await this.db.update(schema.systemSettings).set({ ...settings3, updatedAt: /* @__PURE__ */ new Date() }).where(eq(schema.systemSettings.id, existing.id)).returning();
          return result[0];
        } else {
          const result = await this.db.insert(schema.systemSettings).values(settings3).returning();
          return result[0];
        }
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
function generateUsername(roleId, number) {
  const roleCode = ROLE_CODES[roleId] || "USR";
  const paddedNumber = String(number).padStart(3, "0");
  return `THS-${roleCode}-${paddedNumber}`;
}
function generatePassword(year = (/* @__PURE__ */ new Date()).getFullYear().toString()) {
  const randomPart = generateRandomString(12);
  return `THS@${year}#${randomPart}`;
}
function generateStudentUsername(nextNumber) {
  return `THS-STU-${String(nextNumber).padStart(3, "0")}`;
}
function generateStudentPassword(currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString()) {
  const randomHex = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `THS@${currentYear}#${randomHex}`;
}
function parseUsername(username) {
  const parts = username.split("-");
  if (parts.length < 3 || parts[0] !== "THS") {
    return null;
  }
  if (parts.length === 3) {
    return {
      prefix: parts[0],
      roleCode: parts[1],
      format: "new",
      number: parts[2]
    };
  }
  if (parts.length === 4) {
    return {
      prefix: parts[0],
      roleCode: parts[1],
      format: "old",
      year: parts[2],
      number: parts[3]
    };
  }
  if (parts.length === 5) {
    return {
      prefix: parts[0],
      roleCode: parts[1],
      format: "old",
      year: parts[2],
      optional: parts[3],
      number: parts[4]
    };
  }
  return null;
}
function getNextUserNumber(existingUsernames, roleId) {
  const roleCode = ROLE_CODES[roleId] || "USR";
  const prefix = `THS-${roleCode}-`;
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
  if (!/^\d{3}$/.test(parsed.number)) return false;
  if (parsed.format === "new") {
    return true;
  }
  if (parsed.format === "old") {
    if (parsed.year && !/^\d{4}$/.test(parsed.year)) return false;
    if (parsed.optional && !/^[A-Z0-9]{2,4}$/i.test(parsed.optional)) return false;
    return true;
  }
  return false;
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

// server/username-generator.ts
var username_generator_exports = {};
__export(username_generator_exports, {
  generateAdminUsername: () => generateAdminUsername,
  generateParentUsername: () => generateParentUsername,
  generateStudentUsername: () => generateStudentUsername2,
  generateTeacherUsername: () => generateTeacherUsername,
  generateTempPassword: () => generateTempPassword,
  generateUsernameByRole: () => generateUsernameByRole,
  validateUsername: () => validateUsername
});
import { sql as sql3 } from "drizzle-orm";
async function getNextSequenceForRole(roleCode) {
  const result = await db2.insert(counters).values({
    roleCode,
    classCode: "N/A",
    year: "2025",
    sequence: 1
  }).onConflictDoUpdate({
    target: [counters.roleCode],
    set: {
      sequence: sql3`${counters.sequence} + 1`,
      updatedAt: /* @__PURE__ */ new Date()
    }
  }).returning();
  return result[0].sequence;
}
async function generateStudentUsername2() {
  const sequence = await getNextSequenceForRole(ROLE_CODES2.STUDENT);
  return `THS-${ROLE_CODES2.STUDENT}-${String(sequence).padStart(3, "0")}`;
}
async function generateParentUsername() {
  const sequence = await getNextSequenceForRole(ROLE_CODES2.PARENT);
  return `THS-${ROLE_CODES2.PARENT}-${String(sequence).padStart(3, "0")}`;
}
async function generateTeacherUsername() {
  const sequence = await getNextSequenceForRole(ROLE_CODES2.TEACHER);
  return `THS-${ROLE_CODES2.TEACHER}-${String(sequence).padStart(3, "0")}`;
}
async function generateAdminUsername() {
  const sequence = await getNextSequenceForRole(ROLE_CODES2.ADMIN);
  return `THS-${ROLE_CODES2.ADMIN}-${String(sequence).padStart(3, "0")}`;
}
async function generateUsernameByRole(roleId) {
  switch (roleId) {
    case 1:
      return generateAdminUsername();
    case 2:
      return generateTeacherUsername();
    case 3:
      return generateStudentUsername2();
    case 4:
      return generateParentUsername();
    default:
      throw new Error(`Invalid role ID: ${roleId}`);
  }
}
function generateTempPassword(year = (/* @__PURE__ */ new Date()).getFullYear()) {
  const random4 = Math.floor(1e3 + Math.random() * 9e3);
  return `THS@${year}#${random4}`;
}
function validateUsername(username) {
  if (!username) {
    return { valid: false, error: "Username is required" };
  }
  const newStudentPattern = /^THS-STU-\d{3}$/;
  const newParentPattern = /^THS-PAR-\d{3}$/;
  const newTeacherPattern = /^THS-TCH-\d{3}$/;
  const newAdminPattern = /^THS-ADM-\d{3}$/;
  const oldStudentPattern = /^THS-STU-\d{4}-[A-Z0-9]+-\d{3}$/;
  const oldParentPattern = /^THS-PAR-\d{4}-\d{3}$/;
  const oldTeacherPattern = /^THS-TCH-\d{4}-[A-Z0-9]+-\d{3}$/;
  const oldAdminPattern = /^THS-ADM-\d{4}-\d{3}$/;
  if (newStudentPattern.test(username)) {
    return { valid: true, type: "student", format: "new" };
  }
  if (newParentPattern.test(username)) {
    return { valid: true, type: "parent", format: "new" };
  }
  if (newTeacherPattern.test(username)) {
    return { valid: true, type: "teacher", format: "new" };
  }
  if (newAdminPattern.test(username)) {
    return { valid: true, type: "admin", format: "new" };
  }
  if (oldStudentPattern.test(username)) {
    return { valid: true, type: "student", format: "old" };
  }
  if (oldParentPattern.test(username)) {
    return { valid: true, type: "parent", format: "old" };
  }
  if (oldTeacherPattern.test(username)) {
    return { valid: true, type: "teacher", format: "old" };
  }
  if (oldAdminPattern.test(username)) {
    return { valid: true, type: "admin", format: "old" };
  }
  return { valid: false, error: "Invalid username format" };
}
var ROLE_CODES2;
var init_username_generator = __esm({
  "server/username-generator.ts"() {
    "use strict";
    init_storage();
    init_schema();
    ROLE_CODES2 = {
      STUDENT: "STU",
      PARENT: "PAR",
      TEACHER: "TCH",
      ADMIN: "ADM"
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
      return false;
    }
    return true;
  } catch (error) {
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

// server/csv-import-service.ts
var csv_import_service_exports = {};
__export(csv_import_service_exports, {
  commitCSVImport: () => commitCSVImport,
  previewCSVImport: () => previewCSVImport
});
import { parse } from "csv-parse/sync";
import { eq as eq3, and as and2 } from "drizzle-orm";
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
  const classes3 = await db2.select().from(classes);
  const validClassCodes = classes3.map((c) => c.name);
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
      const existingParent = await db2.select().from(users).where(and2(
        eq3(users.phone, row.parentPhone),
        eq3(users.roleId, 4)
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
      const classInfo = classes3.find((c) => c.name === row.classCode);
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
  const classes3 = await db2.select().from(classes);
  for (const item of validRows) {
    try {
      await db2.transaction(async (tx) => {
        const year = (/* @__PURE__ */ new Date()).getFullYear();
        const classInfo = classes3.find((c) => c.name === item.data.classCode);
        if (!classInfo) {
          throw new Error(`Class not found: ${item.data.classCode}`);
        }
        const nameParts = item.data.fullName.trim().split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || nameParts[0];
        const studentUsername = await generateStudentUsername2();
        const studentPassword = generateTempPassword();
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
            const [existingParent] = await tx.select().from(users).where(and2(
              eq3(users.phone, item.data.parentPhone),
              eq3(users.roleId, 4)
            )).limit(1);
            if (existingParent) {
              parentUserId = existingParent.id;
              await tx.update(students).set({ parentId: parentUserId }).where(eq3(students.id, studentUser.id));
            }
          } else {
            const parentUsername = await generateParentUsername();
            const parentPassword = generateTempPassword();
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
            await tx.update(students).set({ parentId: parentUserId }).where(eq3(students.id, studentUser.id));
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

// server/seed-system-settings.ts
var seed_system_settings_exports = {};
__export(seed_system_settings_exports, {
  seedSystemSettings: () => seedSystemSettings
});
async function seedSystemSettings() {
  try {
    const existingSettings = await db2.select().from(systemSettings).limit(1);
    if (existingSettings.length === 0) {
      await db2.insert(systemSettings).values({
        schoolName: "Treasure-Home School",
        schoolMotto: "Honesty and Success",
        schoolEmail: "info@treasurehomeschool.edu.ng",
        schoolPhone: "+234-XXX-XXX-XXXX",
        schoolAddress: "Lagos, Nigeria",
        maintenanceMode: false,
        enableSmsNotifications: false,
        enableEmailNotifications: true,
        enableExamsModule: true,
        enableAttendanceModule: true,
        enableResultsModule: true,
        themeColor: "blue",
        usernameStudentPrefix: "THS-STU",
        usernameParentPrefix: "THS-PAR",
        usernameTeacherPrefix: "THS-TCH",
        usernameAdminPrefix: "THS-ADM",
        tempPasswordFormat: "THS@{year}#{random4}",
        hideAdminAccountsFromAdmins: true
      });
      console.log("\u2705 Default system settings created");
    } else {
      console.log("\u2139\uFE0F  System settings already exist");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u274C System settings seeding error: ${errorMessage}`);
    throw error;
  }
}
var init_seed_system_settings = __esm({
  "server/seed-system-settings.ts"() {
    "use strict";
    init_storage();
    init_schema();
  }
});

// server/seed-roles.ts
var seed_roles_exports = {};
__export(seed_roles_exports, {
  seedRoles: () => seedRoles
});
async function seedRoles() {
  try {
    const existingRoles = await db2.select().from(roles);
    if (existingRoles.length > 0) {
      console.log(`\u2139\uFE0F  Roles already exist (${existingRoles.length} found)`);
      return;
    }
    const requiredRoles = [
      {
        id: 1,
        name: "Super Admin",
        permissions: JSON.stringify(["*"])
      },
      {
        id: 2,
        name: "Admin",
        permissions: JSON.stringify(["manage_users", "manage_classes", "manage_students", "manage_teachers", "manage_exams", "view_reports", "manage_announcements", "manage_gallery", "manage_content"])
      },
      {
        id: 3,
        name: "Teacher",
        permissions: JSON.stringify(["view_students", "manage_attendance", "manage_exams", "grade_exams", "view_classes", "manage_resources"])
      },
      {
        id: 4,
        name: "Student",
        permissions: JSON.stringify(["view_exams", "take_exams", "view_results", "view_resources", "view_announcements"])
      },
      {
        id: 5,
        name: "Parent",
        permissions: JSON.stringify(["view_students", "view_results", "view_attendance", "view_announcements"])
      }
    ];
    console.log("\u{1F4DA} Creating 5 core roles...");
    for (const roleData of requiredRoles) {
      await db2.insert(roles).values(roleData);
      console.log(`  \u2705 Created role: ${roleData.name}`);
    }
    console.log("\u2705 All 5 roles created successfully!");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u274C Error seeding roles: ${errorMessage}`);
    throw error;
  }
}
var init_seed_roles = __esm({
  "server/seed-roles.ts"() {
    "use strict";
    init_storage();
    init_schema();
  }
});

// server/seed-test-users.ts
var seed_test_users_exports = {};
__export(seed_test_users_exports, {
  seedTestUsers: () => seedTestUsers
});
import bcrypt3 from "bcrypt";
import { eq as eq5 } from "drizzle-orm";
import { randomUUID } from "crypto";
async function seedTestUsers() {
  try {
    const testUsers = [
      {
        id: randomUUID(),
        username: "superadmin",
        email: "superadmin@treasurehome.com",
        password: "SuperAdmin@123",
        roleId: 1,
        firstName: "Super",
        lastName: "Admin",
        roleName: "Super Admin"
      },
      {
        id: randomUUID(),
        username: "admin",
        email: "admin@treasurehome.com",
        password: "Admin@123",
        roleId: 2,
        firstName: "Admin",
        lastName: "User",
        roleName: "Admin"
      },
      {
        id: randomUUID(),
        username: "teacher",
        email: "teacher@treasurehome.com",
        password: "Teacher@123",
        roleId: 3,
        firstName: "John",
        lastName: "Teacher",
        roleName: "Teacher"
      },
      {
        id: randomUUID(),
        username: "student",
        email: "student@treasurehome.com",
        password: "Student@123",
        roleId: 4,
        firstName: "Jane",
        lastName: "Student",
        roleName: "Student"
      },
      {
        id: randomUUID(),
        username: "parent",
        email: "parent@treasurehome.com",
        password: "Parent@123",
        roleId: 5,
        firstName: "Peter",
        lastName: "Parent",
        roleName: "Parent"
      }
    ];
    const roles3 = await db2.select().from(roles);
    const roleMap = {};
    for (const role of roles3) {
      roleMap[role.name] = role.id;
    }
    console.log("\u{1F4CB} Creating test user accounts for all 5 roles...");
    for (const userData of testUsers) {
      const existingUser = await db2.select().from(users).where(eq5(users.username, userData.username)).limit(1);
      if (existingUser.length === 0) {
        const roleId = roleMap[userData.roleName];
        if (!roleId) {
          console.warn(`\u26A0\uFE0F Role "${userData.roleName}" not found`);
          continue;
        }
        const passwordHash = await bcrypt3.hash(userData.password, 12);
        const [newUser] = await db2.insert(users).values({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          passwordHash,
          roleId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          status: "active",
          isActive: true,
          mustChangePassword: false,
          profileCompleted: true,
          createdVia: "seed"
        }).returning();
        console.log(`\u2705 Created ${userData.roleName} account: ${userData.username}`);
      } else {
        console.log(`\u2139\uFE0F  ${userData.roleName} account already exists: ${userData.username}`);
      }
    }
    console.log("\n\u{1F4DD} TEST ACCOUNT CREDENTIALS:\n");
    console.log("\u250C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510");
    console.log("\u2502         LOGIN CREDENTIALS FOR ALL 5 ROLES           \u2502");
    console.log("\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524");
    for (const user of testUsers) {
      console.log(`\u2502 Role: ${user.roleName.padEnd(45)}\u2502`);
      console.log(`\u2502   Username: ${user.username.padEnd(38)}\u2502`);
      console.log(`\u2502   Password: ${user.password.padEnd(38)}\u2502`);
      console.log(`\u2502   Email:    ${user.email.padEnd(38)}\u2502`);
      console.log("\u251C\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2524");
    }
    console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u274C Error seeding test users: ${errorMessage}`);
    throw error;
  }
}
var init_seed_test_users = __esm({
  "server/seed-test-users.ts"() {
    "use strict";
    init_storage();
    init_schema();
  }
});

// server/realtime-service.ts
var realtime_service_exports = {};
__export(realtime_service_exports, {
  realtimeService: () => realtimeService
});
import { Server as SocketIOServer } from "socket.io";
var RealtimeService, realtimeService;
var init_realtime_service = __esm({
  "server/realtime-service.ts"() {
    "use strict";
    RealtimeService = class {
      io = null;
      connectedClients = /* @__PURE__ */ new Map();
      initialize(httpServer) {
        const allowedOrigins2 = process.env.NODE_ENV === "development" ? ["http://localhost:5173", "http://localhost:5000", "http://127.0.0.1:5173"] : process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [];
        this.io = new SocketIOServer(httpServer, {
          cors: {
            origin: allowedOrigins2,
            credentials: true,
            methods: ["GET", "POST"]
          },
          path: "/socket.io/",
          transports: ["websocket", "polling"]
        });
        this.setupEventHandlers();
        console.log("\u2705 Socket.IO Realtime Service initialized");
        console.log(`   \u2192 CORS origins: ${allowedOrigins2.join(", ")}`);
      }
      setupEventHandlers() {
        if (!this.io) return;
        this.io.on("connection", (socket) => {
          console.log(`\u{1F4E1} Client connected: ${socket.id}`);
          socket.on("subscribe", (data) => {
            const { table } = data;
            const channel = `table:${table}`;
            socket.join(channel);
            if (!this.connectedClients.has(table)) {
              this.connectedClients.set(table, /* @__PURE__ */ new Set());
            }
            this.connectedClients.get(table).add(socket.id);
            console.log(`   \u2192 Client ${socket.id} subscribed to table: ${table}`);
            socket.emit("subscribed", { table, channel });
          });
          socket.on("unsubscribe", (data) => {
            const { table } = data;
            const channel = `table:${table}`;
            socket.leave(channel);
            if (this.connectedClients.has(table)) {
              this.connectedClients.get(table).delete(socket.id);
              if (this.connectedClients.get(table).size === 0) {
                this.connectedClients.delete(table);
              }
            }
            console.log(`   \u2192 Client ${socket.id} unsubscribed from table: ${table}`);
            socket.emit("unsubscribed", { table });
          });
          socket.on("disconnect", () => {
            console.log(`\u{1F4E1} Client disconnected: ${socket.id}`);
            this.connectedClients.forEach((clients, table) => {
              clients.delete(socket.id);
              if (clients.size === 0) {
                this.connectedClients.delete(table);
              }
            });
          });
          socket.on("ping", () => {
            socket.emit("pong", { timestamp: Date.now() });
          });
        });
      }
      /**
       * Emit a database change event to all subscribed clients
       */
      emitTableChange(table, event, data, oldData) {
        if (!this.io) {
          console.warn("\u26A0\uFE0F  Socket.IO not initialized, cannot emit event");
          return;
        }
        const channel = `table:${table}`;
        const payload = {
          table,
          event,
          data,
          oldData
        };
        this.io.to(channel).emit("table_change", payload);
        const subscriberCount = this.connectedClients.get(table)?.size || 0;
        if (subscriberCount > 0) {
          console.log(`\u{1F4E4} Emitted ${event} event for table ${table} to ${subscriberCount} clients`);
        }
      }
      /**
       * Emit a custom event to all connected clients
       */
      emitToAll(event, data) {
        if (!this.io) {
          console.warn("\u26A0\uFE0F  Socket.IO not initialized, cannot emit event");
          return;
        }
        this.io.emit(event, data);
        console.log(`\u{1F4E4} Broadcast event: ${event}`);
      }
      /**
       * Emit to specific room/channel
       */
      emitToRoom(room, event, data) {
        if (!this.io) {
          console.warn("\u26A0\uFE0F  Socket.IO not initialized, cannot emit event");
          return;
        }
        this.io.to(room).emit(event, data);
      }
      /**
       * Get the Socket.IO instance
       */
      getIO() {
        return this.io;
      }
      /**
       * Get number of clients subscribed to a table
       */
      getSubscriberCount(table) {
        return this.connectedClients.get(table)?.size || 0;
      }
      /**
       * Get all active table subscriptions
       */
      getActiveSubscriptions() {
        return Array.from(this.connectedClients.keys());
      }
    };
    realtimeService = new RealtimeService();
  }
});

// server/index.ts
import express2 from "express";
import compression from "compression";
import cors from "cors";

// server/routes.ts
init_storage();
init_schema();
init_schema();
init_auth_utils();
init_username_generator();
import { createServer } from "http";
import { z as z2, ZodError } from "zod";
import multer from "multer";
import path2 from "path";
import fs2 from "fs/promises";
import jwt from "jsonwebtoken";
import bcrypt2 from "bcrypt";
import passport from "passport";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import { and as and3, eq as eq4 } from "drizzle-orm";

// server/cloudinary-service.ts
import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
var isProduction2 = process.env.NODE_ENV === "production";
var hasCloudinaryConfig = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
var useCloudinary = isProduction2 && hasCloudinaryConfig;
if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log("\u2601\uFE0F Cloudinary configured successfully");
}
var folderMap = {
  "student": "students",
  "teacher": "teachers",
  "admin": "admins",
  "assignment": "assignments",
  "result": "results",
  "gallery": "gallery",
  "homepage": "homepage",
  "study-resource": "study-resources",
  "profile": "profiles",
  "general": "general"
};
var imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
var documentTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
var allowedTypes = [...imageTypes, ...documentTypes];
var MAX_IMAGE_SIZE = 5 * 1024 * 1024;
var MAX_DOCUMENT_SIZE = 10 * 1024 * 1024;
function validateFile(file, options) {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }
  if (!allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: `File type ${file.mimetype} is not allowed. Allowed types: images (jpeg, png, gif, webp) and documents (pdf, doc, docx)` };
  }
  const isImage = imageTypes.includes(file.mimetype);
  const maxSize = options.maxSizeMB ? options.maxSizeMB * 1024 * 1024 : isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { valid: false, error: `File size exceeds maximum allowed size of ${maxSizeMB}MB` };
  }
  return { valid: true };
}
function generatePublicId(uploadType, userId, originalName) {
  const folder = folderMap[uploadType];
  const timestamp2 = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const baseName = originalName ? path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9-_]/g, "_") : "file";
  if (userId) {
    return `${folder}/${userId}/${baseName}_${timestamp2}_${randomSuffix}`;
  }
  return `${folder}/${baseName}_${timestamp2}_${randomSuffix}`;
}
async function uploadToCloudinary(file, options) {
  const publicId = generatePublicId(options.uploadType, options.userId, file.originalname);
  const isImage = imageTypes.includes(file.mimetype);
  const resourceType = options.resourceType || (isImage ? "image" : "raw");
  try {
    const uploadOptions = {
      public_id: publicId,
      resource_type: resourceType,
      folder: "",
      // Folder is included in public_id
      overwrite: true,
      invalidate: true
    };
    if (isImage) {
      uploadOptions.transformation = [
        { quality: "auto:best" },
        { fetch_format: "auto" }
      ];
    }
    let result;
    if (file.buffer) {
      result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result2) => {
            if (error) reject(error);
            else if (result2) resolve(result2);
            else reject(new Error("No result from Cloudinary"));
          }
        );
        uploadStream.end(file.buffer);
      });
    } else if (file.path) {
      result = await cloudinary.uploader.upload(file.path, uploadOptions);
    } else {
      return { success: false, error: "No file data available for upload" };
    }
    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      isCloudinary: true
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload to Cloudinary"
    };
  }
}
async function uploadToLocal(file, options) {
  try {
    const folder = folderMap[options.uploadType] || "general";
    const uploadDir2 = path.join("server/uploads", folder);
    await fs.mkdir(uploadDir2, { recursive: true });
    const timestamp2 = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_");
    const filename = `${baseName}_${timestamp2}_${randomSuffix}${ext}`;
    let filePath;
    if (options.userId) {
      const userDir = path.join(uploadDir2, options.userId);
      await fs.mkdir(userDir, { recursive: true });
      filePath = path.join(userDir, filename);
    } else {
      filePath = path.join(uploadDir2, filename);
    }
    if (file.buffer) {
      await fs.writeFile(filePath, file.buffer);
    } else if (file.path) {
      await fs.copyFile(file.path, filePath);
    } else {
      return { success: false, error: "No file data available for upload" };
    }
    const localUrl = `/${filePath.replace(/\\/g, "/")}`;
    return {
      success: true,
      url: localUrl,
      isCloudinary: false
    };
  } catch (error) {
    console.error("Local upload error:", error);
    return {
      success: false,
      error: error.message || "Failed to upload file locally"
    };
  }
}
async function uploadFile(file, options) {
  const validation = validateFile(file, options);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  if (useCloudinary) {
    return uploadToCloudinary(file, options);
  } else {
    return uploadToLocal(file, options);
  }
}
async function deleteFile(publicIdOrUrl) {
  if (!useCloudinary) {
    try {
      const localPath = publicIdOrUrl.startsWith("/") ? publicIdOrUrl.substring(1) : publicIdOrUrl;
      await fs.unlink(localPath);
      return true;
    } catch (error) {
      console.error("Local file deletion error:", error);
      return false;
    }
  }
  try {
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes("cloudinary.com")) {
      const match = publicIdOrUrl.match(/\/v\d+\/(.+?)(?:\.[^.]+)?$/);
      if (match) {
        publicId = match[1];
      }
    }
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary deletion error:", error);
    return false;
  }
}
async function replaceFile(file, oldPublicIdOrUrl, options) {
  const uploadResult = await uploadFile(file, options);
  if (!uploadResult.success) {
    return uploadResult;
  }
  if (oldPublicIdOrUrl) {
    await deleteFile(oldPublicIdOrUrl);
  }
  return uploadResult;
}

// server/upload-service.ts
var uploadTypeMap = {
  "profile": "profile",
  "homepage": "homepage",
  "gallery": "gallery",
  "study-resource": "study-resource",
  "general": "general",
  "student": "student",
  "teacher": "teacher",
  "admin": "admin",
  "assignment": "assignment",
  "result": "result"
};
async function uploadFileToStorage(file, options) {
  try {
    const cloudinaryType = uploadTypeMap[options.uploadType] || "general";
    const result = await uploadFile(file, {
      uploadType: cloudinaryType,
      userId: options.userId,
      category: options.category,
      maxSizeMB: options.maxSizeMB || 5
    });
    if (!result.success) {
      return {
        success: false,
        error: result.error || "Upload failed"
      };
    }
    return {
      success: true,
      url: result.url,
      isCloudinary: result.isCloudinary
    };
  } catch (error) {
    console.error("Upload service error:", error);
    return {
      success: false,
      error: error.message || "Upload failed"
    };
  }
}
async function replaceFile2(file, oldUrl, options) {
  try {
    const cloudinaryType = uploadTypeMap[options.uploadType] || "general";
    const result = await replaceFile(file, oldUrl, {
      uploadType: cloudinaryType,
      userId: options.userId,
      category: options.category,
      maxSizeMB: options.maxSizeMB || 5
    });
    if (!result.success) {
      return {
        success: false,
        error: result.error || "File replacement failed"
      };
    }
    return {
      success: true,
      url: result.url,
      isCloudinary: result.isCloudinary
    };
  } catch (error) {
    console.error("File replacement error:", error);
    return {
      success: false,
      error: error.message || "File replacement failed"
    };
  }
}
async function deleteFileFromStorage(url) {
  if (!url) {
    return true;
  }
  try {
    return await deleteFile(url);
  } catch (error) {
    console.error("File deletion error:", error);
    return false;
  }
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
var JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret-key-change-in-production" : void 0);
if (!JWT_SECRET) {
  process.exit(1);
}
if (process.env.NODE_ENV === "development" && JWT_SECRET === "dev-secret-key-change-in-production") {
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
  return void 0;
}
var ROLES = {
  SUPER_ADMIN: 0,
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
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    const normalizedUserId = normalizeUuid2(decoded.userId);
    if (!normalizedUserId) {
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
      res.status(403).json({ message: "Authorization failed" });
    }
  };
};
var uploadDir = "server/uploads";
var galleryDir = "server/uploads/gallery";
var profileDir = "server/uploads/profiles";
var studyResourcesDir = "server/uploads/study-resources";
var homepageDir = "server/uploads/homepage";
fs2.mkdir(uploadDir, { recursive: true }).catch(() => {
});
fs2.mkdir(galleryDir, { recursive: true }).catch(() => {
});
fs2.mkdir(profileDir, { recursive: true }).catch(() => {
});
fs2.mkdir(studyResourcesDir, { recursive: true }).catch(() => {
});
fs2.mkdir(homepageDir, { recursive: true }).catch(() => {
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
    } else if (uploadType === "homepage") {
      dir = homepageDir;
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path2.extname(file.originalname);
    const name = path2.basename(file.originalname, ext);
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
    const allowedTypes2 = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes2.test(path2.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes2.test(file.mimetype);
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
    const allowedTypes2 = /pdf|doc|docx|txt|rtf|odt|ppt|pptx|xls|xlsx/;
    const extname = allowedTypes2.test(path2.extname(file.originalname).toLowerCase());
    const mimetype = /application\/(pdf|msword|vnd\.openxmlformats-officedocument|vnd\.oasis\.opendocument|text\/plain|vnd\.ms-powerpoint|vnd\.ms-excel)/.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only document files (PDF, DOC, DOCX, TXT, RTF, ODT, PPT, PPTX, XLS, XLSX) are allowed!"));
    }
  }
});
var csvDir = "server/uploads/csv";
fs2.mkdir(csvDir, { recursive: true }).catch(() => {
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
    const isCSV = /csv|txt/.test(path2.extname(file.originalname).toLowerCase());
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
    const now = /* @__PURE__ */ new Date();
    const scheduledExams = await storage.getScheduledExamsToPublish(now);
    if (scheduledExams.length > 0) {
      for (const exam of scheduledExams) {
        try {
          await storage.updateExam(exam.id, {
            isPublished: true
          });
        } catch (error) {
        }
      }
    }
  } catch (error) {
  }
}
async function cleanupExpiredExamSessions() {
  try {
    const now = /* @__PURE__ */ new Date();
    const rawResult = await storage.getExpiredExamSessions(now, 50);
    const expiredSessions = Array.isArray(rawResult) ? rawResult : [];
    for (const session2 of expiredSessions) {
      try {
        await storage.updateExamSession(session2.id, {
          isCompleted: true,
          submittedAt: now,
          status: "submitted"
        });
        await autoScoreExamSession(session2.id, storage);
      } catch (error) {
      }
    }
  } catch (error) {
  }
}
var autoPublishInterval = 60 * 1e3;
setInterval(autoPublishScheduledExams, autoPublishInterval);
autoPublishScheduledExams();
var cleanupInterval = 3 * 60 * 1e3;
var jitter = Math.random() * 3e4;
setTimeout(() => {
  setInterval(cleanupExpiredExamSessions, cleanupInterval);
  cleanupExpiredExamSessions();
}, jitter);
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
    const scoringResult = await storage2.getExamScoringData(sessionId);
    const { session: session2, summary, scoringData } = scoringResult;
    const databaseQueryTime = Date.now() - startTime;
    const { totalQuestions, maxScore: maxPossibleScore, studentScore, autoScoredQuestions } = summary;
    const studentAnswers3 = await storage2.getStudentAnswers(sessionId);
    const examQuestions3 = await storage2.getExamQuestions(session2.examId);
    let totalAutoScore = studentScore;
    const hasMultipleChoiceQuestions = autoScoredQuestions > 0;
    const hasEssayQuestions = totalQuestions > autoScoredQuestions;
    const questionDetails = [];
    for (const q of scoringData) {
      const question = examQuestions3.find((examQ) => examQ.id === q.questionId);
      const studentAnswer = studentAnswers3.find((ans) => ans.questionId === q.questionId);
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
    for (const detail of questionDetails) {
      if (detail.questionId) {
        const studentAnswer = studentAnswers3.find((ans) => ans.questionId === detail.questionId);
        if (studentAnswer) {
          try {
            await storage2.updateStudentAnswer(studentAnswer.id, {
              pointsEarned: detail.pointsEarned,
              isCorrect: detail.isCorrect,
              autoScored: detail.autoScored,
              feedbackText: detail.feedback
            });
          } catch (updateError) {
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
      questionDetails.forEach((q, index3) => {
      });
    }
    if (!session2.studentId) {
      throw new Error("CRITICAL: Session missing studentId - cannot create exam result");
    }
    if (!session2.examId) {
      throw new Error("CRITICAL: Session missing examId - cannot create exam result");
    }
    if (maxPossibleScore === 0 && totalQuestions > 0) {
    }
    const existingResults = await storage2.getExamResultsByStudent(session2.studentId);
    const existingResult = existingResults.find((r) => r.examId === session2.examId);
    if (existingResult) {
    } else {
    }
    let SYSTEM_AUTO_SCORING_UUID;
    try {
      const adminUsers = await storage2.getUsersByRole(ROLES.ADMIN);
      if (adminUsers && adminUsers.length > 0 && adminUsers[0].id) {
        SYSTEM_AUTO_SCORING_UUID = adminUsers[0].id;
      } else {
        try {
          const studentUser = await storage2.getUser(session2.studentId);
          if (studentUser && studentUser.id) {
            SYSTEM_AUTO_SCORING_UUID = studentUser.id;
          } else {
            throw new Error(`Student ${session2.studentId} not found in users table`);
          }
        } catch (studentError) {
          const allUsers = await storage2.getAllUsers();
          const activeUser = allUsers.find((u) => u.isActive && u.id);
          if (activeUser && activeUser.id) {
            SYSTEM_AUTO_SCORING_UUID = activeUser.id;
          } else {
            throw new Error("CRITICAL: No valid user ID found for auto-scoring recordedBy - cannot save exam result");
          }
        }
      }
    } catch (userError) {
      throw new Error(`Auto-scoring failed: Cannot find valid user ID for recordedBy. Error: ${userError instanceof Error ? userError.message : String(userError)}`);
    }
    if (!SYSTEM_AUTO_SCORING_UUID || typeof SYSTEM_AUTO_SCORING_UUID !== "string") {
      throw new Error(`CRITICAL: Invalid recordedBy UUID: ${SYSTEM_AUTO_SCORING_UUID}`);
    }
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
    try {
      if (existingResult) {
        const updatedResult = await storage2.updateExamResult(existingResult.id, resultData);
        if (!updatedResult) {
          throw new Error(`Failed to update exam result ID: ${existingResult.id} - updateExamResult returned null/undefined`);
        }
      } else {
        const newResult = await storage2.recordExamResult(resultData);
        if (!newResult || !newResult.id) {
          throw new Error("Failed to create exam result - recordExamResult returned null/undefined or missing ID");
        }
      }
      const verificationResults = await storage2.getExamResultsByStudent(session2.studentId);
      const savedResult = verificationResults.find((r) => Number(r.examId) === Number(session2.examId));
      if (!savedResult) {
        throw new Error("CRITICAL: Result was not properly saved - verification fetch failed to find the result");
      }
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
      } else {
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
      } catch (perfLogError) {
      }
      if (process.env.NODE_ENV === "development") {
      }
    } catch (error) {
      const totalErrorTime = Date.now() - startTime;
      throw error;
    }
  } catch (error) {
    const totalErrorTime = Date.now() - startTime;
    throw error;
  }
}
async function mergeExamScores(answerId, storage2) {
  try {
    const answer = await storage2.getStudentAnswerById(answerId);
    if (!answer) {
      return;
    }
    const sessionId = answer.sessionId;
    const allAnswers = await storage2.getStudentAnswers(sessionId);
    const session2 = await storage2.getExamSessionById(sessionId);
    const examQuestions3 = await storage2.getExamQuestions(session2.examId);
    const essayQuestions = examQuestions3.filter(
      (q) => q.questionType === "text" || q.questionType === "essay"
    );
    const gradedEssayAnswers = allAnswers.filter((a) => {
      const question = examQuestions3.find((q) => q.id === a.questionId);
      const isEssay = question?.questionType === "text" || question?.questionType === "essay";
      return isEssay && a.pointsEarned !== null && a.pointsEarned !== void 0;
    });
    const allEssaysGraded = essayQuestions.length === gradedEssayAnswers.length;
    if (!allEssaysGraded) {
      return;
    }
    let totalScore = 0;
    let maxScore = 0;
    for (const question of examQuestions3) {
      maxScore += question.points || 0;
      const studentAnswer = allAnswers.find((a) => a.questionId === question.id);
      if (studentAnswer) {
        totalScore += studentAnswer.pointsEarned || 0;
      }
    }
    const existingResult = await storage2.getExamResultByExamAndStudent(session2.examId, session2.studentId);
    if (existingResult) {
      await storage2.updateExamResult(existingResult.id, {
        score: totalScore,
        maxScore,
        marksObtained: totalScore,
        autoScored: false
        // Now includes manual scores
      });
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
    }
  } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch AI-suggested tasks" });
    }
  });
  app2.get("/api/exams", authenticateUser, async (req, res) => {
    try {
      const exams3 = await storage.getAllExams();
      res.json(exams3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });
  app2.post("/api/exams", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examData = insertExamSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });
  app2.patch("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const existingExam = await storage.getExamById(examId);
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (existingExam.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You can only edit exams you created" });
      }
      const exam = await storage.updateExam(examId, req.body);
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to update exam" });
    }
  });
  app2.delete("/api/exams/:id", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const existingExam = await storage.getExamById(examId);
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (existingExam.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You can only delete exams you created" });
      }
      const success = await storage.deleteExam(examId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });
  app2.patch("/api/exams/:id/publish", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      const { isPublished } = req.body;
      const existingExam = await storage.getExamById(examId);
      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (existingExam.createdBy !== req.user.id) {
        return res.status(403).json({ message: "You can only publish/unpublish exams you created" });
      }
      const exam = await storage.updateExam(examId, { isPublished });
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to update exam publish status" });
    }
  });
  app2.post("/api/exams/:examId/submit", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const studentId = req.user.id;
      const startTime = Date.now();
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
      const scoringStartTime = Date.now();
      await autoScoreExamSession(activeSession.id, storage);
      const scoringTime = Date.now() - scoringStartTime;
      const updatedSession = await storage.getExamSessionById(activeSession.id);
      const studentAnswers3 = await storage.getStudentAnswers(activeSession.id);
      const examQuestions3 = await storage.getExamQuestions(examId);
      const questionDetails = examQuestions3.map((q) => {
        const answer = studentAnswers3.find((a) => a.questionId === q.id);
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
            totalQuestions: examQuestions3.length,
            answered: studentAnswers3.filter((a) => a.textAnswer || a.selectedOptionId).length,
            correct: studentAnswers3.filter((a) => a.isCorrect).length,
            autoScored: studentAnswers3.filter((a) => a.isCorrect !== null).length
          }
        },
        performance: {
          totalTime,
          scoringTime
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to submit exam" });
    }
  });
  app2.get("/api/exams/question-counts", authenticateUser, async (req, res) => {
    try {
      const examIdsParam = req.query.examIds;
      let examIds = [];
      if (typeof examIdsParam === "string") {
        const parsed = parseInt(examIdsParam);
        if (!isNaN(parsed)) {
          examIds = [parsed];
        }
      } else if (Array.isArray(examIdsParam)) {
        examIds = examIdsParam.map((id) => parseInt(id)).filter((id) => !isNaN(id));
      }
      const counts = {};
      for (const examId of examIds) {
        const questions = await storage.getExamQuestions(examId);
        counts[examId] = questions.length;
      }
      res.json(counts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question counts" });
    }
  });
  app2.get("/api/exam-questions/:examId", authenticateUser, async (req, res) => {
    try {
      const examId = parseInt(req.params.examId);
      const questions = await storage.getExamQuestions(examId);
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam questions" });
    }
  });
  app2.post("/api/exam-questions", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
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
      res.status(500).json({ message: error.message || "Failed to create exam question" });
    }
  });
  app2.patch("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const question = await storage.updateExamQuestion(questionId, req.body);
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      res.status(500).json({ message: "Failed to update exam question" });
    }
  });
  app2.delete("/api/exam-questions/:id", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const questionId = parseInt(req.params.id);
      const success = await storage.deleteExamQuestion(questionId);
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam question" });
    }
  });
  app2.get("/api/question-options/:questionId", authenticateUser, async (req, res) => {
    try {
      const questionId = parseInt(req.params.questionId);
      const options = await storage.getQuestionOptions(questionId);
      res.json(options);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question options" });
    }
  });
  app2.post("/api/exam-questions/bulk", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const { examId, questions } = req.body;
      if (!examId) {
        return res.status(400).json({ message: "Exam ID is required" });
      }
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ message: "Questions array is required and must not be empty" });
      }
      const questionsData = questions.map((q, index3) => ({
        question: {
          examId,
          questionText: q.questionText,
          questionType: q.questionType,
          points: q.points || 1,
          orderNumber: index3 + 1,
          instructions: q.instructions,
          sampleAnswer: q.sampleAnswer,
          expectedAnswers: q.expectedAnswers
        },
        options: q.options || []
      }));
      const result = await storage.createExamQuestionsBulk(questionsData);
      res.status(201).json(result);
    } catch (error) {
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
      const exam = await storage.getExamById(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      if (!exam.isPublished) {
        return res.status(403).json({ message: "Exam is not published yet" });
      }
      const now = /* @__PURE__ */ new Date();
      const endTime = new Date(now.getTime() + (exam.timeLimit || 60) * 60 * 1e3);
      const sessionData = {
        examId,
        studentId,
        startedAt: now,
        timeRemaining: (exam.timeLimit || 60) * 60,
        isCompleted: false,
        status: "in_progress",
        endTime,
        maxScore: exam.totalMarks || 0
      };
      const session2 = await storage.createOrGetActiveExamSession(examId, studentId, sessionData);
      res.status(201).json(session2);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to start exam" });
    }
  });
  app2.get("/api/exam-sessions/student/:studentId/active", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.studentId;
      if (req.user.id !== studentId && req.user.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: "Unauthorized access to parent records" });
      }
      const allSessions = await storage.getExamSessionsByStudent(studentId);
      const session2 = allSessions.find((s) => !s.isCompleted) || null;
      if (!session2) {
        return res.json(null);
      }
      res.json(session2);
    } catch (error) {
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
      if (req.user.id !== session2.studentId && req.user.roleId !== ROLES.ADMIN && req.user.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      res.json(session2);
    } catch (error) {
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
      if (req.user.id !== session2.studentId && req.user.roleId !== ROLES.ADMIN && req.user.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const answers = await storage.getStudentAnswers(sessionId);
      res.json(answers);
    } catch (error) {
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
        subjects: subjects3,
        assignedClasses,
        department,
        gradingMode,
        notificationPreference,
        availability,
        agreement
      } = req.body;
      const parsedSubjects = typeof subjects3 === "string" ? JSON.parse(subjects3) : subjects3;
      const parsedClasses = typeof assignedClasses === "string" ? JSON.parse(assignedClasses) : assignedClasses;
      let profileImageUrl = null;
      let signatureUrl = null;
      if (files["profileImage"]?.[0]) {
        const profileResult = await uploadFileToStorage(files["profileImage"][0], {
          uploadType: "profile",
          userId: teacherId,
          maxSizeMB: 5
        });
        if (profileResult.success) {
          profileImageUrl = profileResult.url;
        }
      }
      if (files["signature"]?.[0]) {
        const signatureResult = await uploadFileToStorage(files["signature"][0], {
          uploadType: "profile",
          userId: teacherId,
          category: "signature",
          maxSizeMB: 2
        });
        if (signatureResult.success) {
          signatureUrl = signatureResult.url;
        }
      }
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
        } catch (autoGenError) {
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
        signatureUrl,
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
        profileImageUrl
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
          const { sendEmail: sendEmail2 } = await Promise.resolve().then(() => (init_email_service(), email_service_exports));
          let subjectNames = [];
          let classNames = [];
          try {
            const subjects4 = await storage.getSubjects();
            subjectNames = parsedSubjects.map((subjectId) => {
              const subject = subjects4.find((s) => s.id === subjectId);
              return subject?.name || `Subject #${subjectId}`;
            });
          } catch (error) {
            subjectNames = parsedSubjects.map((id) => `Subject #${id}`);
          }
          try {
            const classes3 = await storage.getAllClasses(true);
            classNames = parsedClasses.map((classId) => {
              const cls = classes3.find((c) => c.id === classId);
              return cls?.name || `Class #${classId}`;
            });
          } catch (error) {
            classNames = parsedClasses.map((id) => `Class #${id}`);
          }
          const dashboardUrl = `${process.env.FRONTEND_URL || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:5000")}/portal/admin/teachers`;
          const emailBody = `
            <h2>\u{1F389} New Teacher Auto-Verified</h2>
            <p><strong>Teacher:</strong> ${teacherFullName}</p>
            <p><strong>Department:</strong> ${department}</p>
            <p><strong>Subjects:</strong> ${subjectNames.join(", ")}</p>
            <p><strong>Classes:</strong> ${classNames.join(", ")}</p>
            <p><strong>Qualification:</strong> ${qualification}</p>
            <p><strong>Years of Experience:</strong> ${yearsOfExperience}</p>
            <p><strong>Staff ID:</strong> ${staffId || "Pending"}</p>
            <p><a href="${dashboardUrl}">View in Admin Dashboard</a></p>
          `;
          await sendEmail2({
            to: admin.email,
            subject: "\u{1F389} New Teacher Auto-Verified - THS Portal",
            html: emailBody
          });
        } catch (emailError) {
        }
      }
      await storage.createAuditLog({
        userId: teacherId,
        action: "teacher_profile_setup_completed",
        entityType: "teacher_profile",
        entityId: String(profile.id),
        newValue: JSON.stringify({ staffId: finalStaffId, subjects: parsedSubjects, classes: parsedClasses }),
        reason: "Teacher completed first-time profile setup",
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || null
      });
      const completeProfileResponse = {
        id: profile.id,
        userId: profile.userId,
        staffId: profile.staffId,
        subjects: Array.isArray(profile.subjects) ? profile.subjects : profile.subjects ? [profile.subjects] : [],
        assignedClasses: Array.isArray(profile.assignedClasses) ? profile.assignedClasses : profile.assignedClasses ? [profile.assignedClasses] : [],
        // FIX: Use correct field name
        department: profile.department,
        qualification: profile.qualification,
        yearsOfExperience: profile.yearsOfExperience,
        specialization: profile.specialization,
        verified: profile.verified,
        firstLogin: profile.firstLogin
      };
      res.json({
        message: "Profile setup completed successfully! You can now access your dashboard.",
        hasProfile: true,
        verified: profile.verified,
        profile: completeProfileResponse
      });
    } catch (error) {
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
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to check profile status" });
    }
  });
  app2.post("/api/teacher/profile/skip", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUser(userId, {
        profileSkipped: true,
        profileCompleted: false
      });
      res.json({
        message: "Profile setup skipped. You can complete it later from your dashboard.",
        skipped: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to skip profile setup" });
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
      res.json(completeProfile);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile", error: error.message });
    }
  });
  app2.get("/api/teacher/dashboard", authenticateUser, authorizeRoles(ROLES.TEACHER), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const dashboardData = await storage.getTeacherDashboardData(teacherId);
      res.json(dashboardData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard data", error: error.message });
    }
  });
  app2.put("/api/teacher/profile/me", authenticateUser, authorizeRoles(ROLES.TEACHER), upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "signature", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const teacherId = req.user.id;
      const files = req.files;
      const updateData = req.body;
      let profileImageUrl = updateData.profileImageUrl;
      let signatureUrl = updateData.signatureUrl;
      if (files["profileImage"]?.[0]) {
        const profileResult = await replaceFile2(
          files["profileImage"][0],
          profileImageUrl || void 0,
          {
            uploadType: "profile",
            userId: teacherId,
            maxSizeMB: 5
          }
        );
        if (profileResult.success) {
          profileImageUrl = profileResult.url;
        }
      }
      if (files["signature"]?.[0]) {
        const signatureResult = await replaceFile2(
          files["signature"][0],
          signatureUrl || void 0,
          {
            uploadType: "profile",
            userId: teacherId,
            category: "signature",
            maxSizeMB: 2
          }
        );
        if (signatureResult.success) {
          signatureUrl = signatureResult.url;
        }
      }
      const subjects3 = typeof updateData.subjects === "string" ? JSON.parse(updateData.subjects) : updateData.subjects;
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
      const profileUpdateData = {
        qualification: updateData.qualification || null,
        specialization: updateData.specialization || null,
        yearsOfExperience: parseInt(updateData.yearsOfExperience) || 0,
        department: updateData.department || null,
        gradingMode: updateData.gradingMode || "manual",
        notificationPreference: updateData.notificationPreference || "all",
        availability: updateData.availability || "full-time",
        subjects: subjects3 || [],
        assignedClasses: assignedClasses || [],
        updatedAt: /* @__PURE__ */ new Date()
      };
      if (signatureUrl) {
        profileUpdateData.signatureUrl = signatureUrl;
      }
      await storage.updateTeacherProfile(teacherId, profileUpdateData);
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
      res.status(500).json({ message: "Failed to review AI-suggested score" });
    }
  });
  const isProduction4 = process.env.NODE_ENV === "production";
  const SESSION_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === "development" ? "dev-session-secret-change-in-production" : process.env.JWT_SECRET || SECRET_KEY);
  if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
    console.warn("\u26A0\uFE0F  SESSION_SECRET not set in production - using JWT_SECRET as fallback");
  }
  const SQLiteStore = connectSqlite3(session);
  const sessionStore = new SQLiteStore({
    db: "sessions.db",
    // Store sessions in a separate SQLite database
    dir: "./server/data",
    // Store in server/data directory
    table: "sessions"
    // Table name for sessions
  });
  app2.use(session({
    store: sessionStore,
    // Use SQLite session store
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    // Custom cookie name
    cookie: {
      secure: isProduction4,
      // HTTPS only in production
      httpOnly: true,
      // Prevent JavaScript access (XSS protection)
      sameSite: isProduction4 ? "none" : "lax",
      // 'none' required for cross-domain in production
      maxAge: 24 * 60 * 60 * 1e3,
      // 24 hours
      path: "/"
      // Cookie available for all routes
      // DO NOT set domain attribute for cross-domain (Render ↔ Vercel)
    }
  }));
  app2.use(passport.initialize());
  app2.use(passport.session());
  app2.get("/api/auth/me", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      const fullUser = await storage.getUser(user.id);
      if (!fullUser || !fullUser.isActive) {
        return res.status(403).json({ message: "Account is inactive" });
      }
      const { passwordHash, ...userWithoutPassword } = fullUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/parents/children/:parentId", authenticateUser, async (req, res) => {
    try {
      const parentId = req.params.parentId;
      const user = req.user;
      if (user?.roleId !== ROLES.PARENT && user?.roleId !== ROLES.ADMIN && user?.id !== parentId) {
        return res.status(403).json({ message: "Unauthorized access to parent records" });
      }
      const children = await storage.getStudentsByParentId(parentId);
      res.json(children);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch children records" });
    }
  });
  app2.get("/api/notifications", authenticateUser, async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const notifications3 = await storage.getNotificationsByUserId(user.id);
      res.json(notifications3);
    } catch (error) {
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
      const notifications3 = await storage.getNotificationsByUserId(user.id);
      const notification = notifications3.find((n) => n.id === notificationId);
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      const updated = await storage.markNotificationAsRead(notificationId);
      res.json(updated);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to update notifications" });
    }
  });
  app2.get("/api/classes", authenticateUser, async (req, res) => {
    try {
      const classes3 = await storage.getAllClasses(true);
      res.json(classes3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.get("/api/subjects", async (req, res) => {
    try {
      const subjects3 = await storage.getSubjects();
      res.json(subjects3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });
  app2.get("/api/terms", authenticateUser, async (req, res) => {
    try {
      const terms = await storage.getAcademicTerms();
      res.json(terms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch academic terms" });
    }
  });
  app2.post("/api/terms", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      if (!req.body.name || !req.body.year || !req.body.startDate || !req.body.endDate) {
        return res.status(400).json({ message: "Missing required fields: name, year, startDate, endDate" });
      }
      const term = await storage.createAcademicTerm(req.body);
      res.json(term);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to create academic term" });
    }
  });
  app2.put("/api/terms/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);
      if (isNaN(termId)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        return res.status(404).json({ message: "Academic term not found" });
      }
      const term = await storage.updateAcademicTerm(termId, req.body);
      res.json(term);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to update academic term" });
    }
  });
  app2.delete("/api/terms/:id", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const termId = parseInt(req.params.id);
      if (isNaN(termId)) {
        return res.status(400).json({ message: "Invalid term ID" });
      }
      const success = await storage.deleteAcademicTerm(termId);
      if (!success) {
        return res.status(500).json({
          message: "Failed to delete academic term. The term may not exist or could not be removed from the database."
        });
      }
      res.json({
        message: "Academic term deleted successfully",
        id: termId,
        success: true
      });
    } catch (error) {
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
      const existingTerm = await storage.getAcademicTerm(termId);
      if (!existingTerm) {
        return res.status(404).json({ message: "Academic term not found" });
      }
      const term = await storage.markTermAsCurrent(termId);
      res.json(term);
    } catch (error) {
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
          } else {
          }
        } catch (error) {
          errors.push(`${email}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      res.json({
        message: `Deleted ${deletedUsers.length} demo accounts`,
        deletedUsers,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to delete demo accounts"
      });
    }
  });
  app2.post("/api/admin/reset-weak-passwords", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
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
          }
        }
      }
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
          }
        } catch (error) {
        }
      }
      res.json({
        message: `Successfully updated ${updateCount} user passwords`,
        updatedCount: updateCount,
        warning: "Please securely communicate new passwords to users",
        passwordUpdates
      });
    } catch (error) {
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
      const result = await uploadFileToStorage(req.file, {
        uploadType: "profile",
        userId: req.user.id,
        maxSizeMB: 5
      });
      if (!result.success) {
        return res.status(500).json({ message: result.error || "Failed to upload file to cloud storage" });
      }
      res.json({ url: result.url });
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to upload file" });
    }
  });
  app2.post("/api/upload/homepage", authenticateUser, authorizeRoles(ROLES.ADMIN), upload.single("homePageImage"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      if (!req.body.contentType) {
        return res.status(400).json({ message: "Content type is required" });
      }
      const category = req.body.contentType || "general";
      const result = await uploadFileToStorage(req.file, {
        uploadType: "homepage",
        category,
        maxSizeMB: 5
      });
      if (!result.success) {
        return res.status(500).json({
          message: result.error || "Failed to upload homepage image"
        });
      }
      const content = await storage.createHomePageContent({
        contentType: req.body.contentType,
        imageUrl: result.url,
        altText: req.body.altText || "",
        caption: req.body.caption || null,
        displayOrder: parseInt(req.body.displayOrder) || 0,
        isActive: true
      });
      res.json(content);
    } catch (error) {
      res.status(500).json({
        message: error.message || "Failed to upload homepage image",
        error: process.env.NODE_ENV === "development" ? error.toString() : void 0
      });
    }
  });
  app2.get("/api/homepage-content", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { contentType } = req.query;
      const content = await storage.getHomePageContent(contentType);
      res.json(content);
    } catch (error) {
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
      if (content.imageUrl) {
        await deleteFileFromStorage(content.imageUrl);
      }
      const deleted = await storage.deleteHomePageContent(id);
      if (!deleted) {
        return res.status(404).json({ message: "Homepage content not found" });
      }
      res.json({ message: "Homepage content deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete homepage content" });
    }
  });
  app2.get("/api/public/homepage-content", async (req, res) => {
    try {
      const content = await storage.getHomePageContent();
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to get homepage content" });
    }
  });
  app2.get("/api/homepage-content/:contentType", async (req, res) => {
    try {
      const { contentType } = req.params;
      const content = await storage.getHomePageContent(contentType);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to get homepage content" });
    }
  });
  app2.get("/api/announcements", async (req, res) => {
    try {
      const { targetRole } = req.query;
      const announcements3 = await storage.getAnnouncements(targetRole);
      res.json(announcements3);
    } catch (error) {
      res.status(500).json({ message: "Failed to get announcements" });
    }
  });
  app2.get("/uploads/homepage/:filename", (req, res) => {
    const { filename } = req.params;
    const filePath = path2.resolve("uploads", "homepage", filename);
    if (!filePath.startsWith(path2.resolve("uploads", "homepage"))) {
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
    const filePath = path2.resolve("uploads", filename);
    if (!filePath.startsWith(path2.resolve("uploads"))) {
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
      try {
        const existingRoles = await storage.getRoles();
        if (existingRoles.length === 0) {
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
            roleId: existingRoles.find((r) => r.name === "Student")?.id || existingRoles[0].id,
            profileCompleted: false,
            // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false
            // 🔧 FIX: Demo users start with incomplete profile
          },
          {
            email: "teacher@demo.com",
            firstName: "Jane",
            lastName: "Smith",
            roleId: existingRoles.find((r) => r.name === "Teacher")?.id || existingRoles[0].id,
            profileCompleted: false,
            // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false
            // 🔧 FIX: Demo users start with incomplete profile
          },
          {
            email: "parent@demo.com",
            firstName: "Bob",
            lastName: "Johnson",
            roleId: existingRoles.find((r) => r.name === "Parent")?.id || existingRoles[0].id,
            profileCompleted: false,
            // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false
            // 🔧 FIX: Demo users start with incomplete profile
          },
          {
            email: "admin@demo.com",
            firstName: "Admin",
            lastName: "User",
            roleId: existingRoles.find((r) => r.name === "Admin")?.id || existingRoles[0].id,
            profileCompleted: false,
            // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false
            // 🔧 FIX: Demo users start with incomplete profile
          }
        ];
        let createdCount = 0;
        for (const userData of demoUsers) {
          try {
            const existingUser = await storage.getUserByEmail(userData.email);
            if (!existingUser) {
              await storage.createUser(userData);
              createdCount++;
            } else {
            }
          } catch (userError) {
          }
        }
        res.json({
          message: "Demo setup completed",
          rolesCount: existingRoles.length,
          usersCreated: createdCount,
          roles: existingRoles.map((r) => r.name)
        });
      } catch (dbError) {
        res.status(500).json({
          message: "Database connection failed",
          error: dbError instanceof Error ? dbError.message : "Unknown database error"
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Setup failed", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { identifier, password } = loginSchema.parse(req.body);
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
        return res.status(401).json({
          message: "Invalid username or password. Please check your credentials and try again.",
          hint: "Make sure CAPS LOCK is off and you're using the correct username and password."
        });
      }
      const userRole = await storage.getRole(user.roleId);
      const roleName = userRole?.name?.toLowerCase();
      const isStaffAccount = roleName === "admin" || roleName === "teacher";
      if (user.status === "suspended") {
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
        return res.status(403).json({
          message: "Account Disabled",
          description: "Your account has been disabled and is no longer active. Please contact the school administrator if you believe this is an error.",
          statusType: "disabled"
        });
      }
      if ((roleName === "admin" || roleName === "teacher") && user.authProvider === "google") {
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
        return res.status(401).json({
          message: "Account Setup Incomplete",
          description: "Your account setup is incomplete. Please contact the school administrator for assistance.",
          statusType: "setup_incomplete"
        });
      }
      const isPasswordValid = await bcrypt2.compare(password, user.passwordHash);
      if (!isPasswordValid) {
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
      res.json({
        token,
        mustChangePassword: user.mustChangePassword || false,
        // Include password change flag
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleId: user.roleId,
          profileImageUrl: user.profileImageUrl,
          mustChangePassword: user.mustChangePassword || false
          // Also include in user object
        }
      });
    } catch (error) {
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
      res.json({ message: "Password changed successfully" });
    } catch (error) {
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
        console.log(`\u{1F6A8} Rate limit exceeded for password reset: ${identifier} from IP ${ipAddress}`);
        await storage.createPasswordResetAttempt(identifier, ipAddress, false);
        const suspiciousAttempts = await storage.getRecentPasswordResetAttempts(identifier, 60);
        if (suspiciousAttempts.length >= 5) {
          const user2 = await storage.getUserByEmail(identifier) || await storage.getUserByUsername(identifier);
          if (user2) {
            const lockUntil = new Date(Date.now() + 30 * 60 * 1e3);
            await storage.lockAccount(user2.id, lockUntil);
            console.log(`\u{1F512} Account temporarily locked due to suspicious password reset activity: ${user2.id}`);
            await storage.createAuditLog({
              userId: user2.id,
              action: "account_locked_suspicious_activity",
              entityType: "user",
              entityId: "0",
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
      const crypto2 = __require("crypto");
      const resetToken = crypto2.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt, ipAddress);
      const recoveryEmail = user.recoveryEmail || user.email;
      await storage.createAuditLog({
        userId: user.id,
        action: "password_reset_requested",
        entityType: "user",
        entityId: "0",
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
        console.log(`\u274C Failed to send password reset email to ${recoveryEmail}`);
        return res.status(500).json({
          message: "Failed to send password reset email. Please try again later or contact administrator."
        });
      }
      if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
        console.log(`\u{1F4E7} DEV MODE - Password Reset Token: ${resetToken}`);
        console.log(`\u{1F4E7} DEV MODE - Reset Link: ${resetLink}`);
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
      console.log(`\u2705 Password reset email sent to ${recoveryEmail} for user ${user.id}`);
      res.json({
        message: "If an account exists with that email/username, a password reset link will be sent."
      });
    } catch (error) {
      try {
        const { identifier } = req.body;
        if (identifier) {
          await storage.createPasswordResetAttempt(identifier, ipAddress, false);
        }
      } catch (trackError) {
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
        entityId: "0",
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
      console.log(`\u2705 Password reset successfully for user ${resetToken.userId} from IP ${ipAddress}`);
      res.json({ message: "Password reset successfully" });
    } catch (error) {
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
      }
      console.log(`\u2705 Admin ${req.user?.email} reset password for user ${userId}`);
      res.json({
        message: "Password reset successfully",
        tempPassword: password,
        username: user.username || user.email,
        email: recoveryEmail
      });
    } catch (error) {
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
      res.json({
        message: "Recovery email updated successfully",
        oldEmail: user.recoveryEmail || user.email,
        newEmail: recoveryEmail
      });
    } catch (error) {
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
        entityId: "0",
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, recoveryEmail: user.recoveryEmail }),
        newValue: JSON.stringify({ userId: user.id, recoveryEmail }),
        reason: `User ${req.user.email} updated recovery email`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      res.json({
        message: "Recovery email updated successfully",
        user: { ...updatedUser, recoveryEmail: updatedUser.recoveryEmail }
        // Explicitly return updated recoveryEmail
      });
    } catch (error) {
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
        entityId: "0",
        oldValue: JSON.stringify({ accountLockedUntil: user.accountLockedUntil }),
        newValue: JSON.stringify({ accountLockedUntil: null }),
        reason: "Account manually unlocked by admin",
        ipAddress: req.ip || req.connection.remoteAddress || "unknown",
        userAgent: req.headers["user-agent"] || null
      });
      console.log(`\u2705 Admin ${req.user?.email} unlocked account for user ${userId}`);
      res.json({
        message: "Account unlocked successfully",
        username: user.username || user.email
      });
    } catch (error) {
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
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "Account unlocked successfully",
        user: safeUser
      });
    } catch (error) {
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
      const crypto2 = __require("crypto");
      const token = crypto2.randomBytes(32).toString("hex");
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
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request format" });
      }
      res.status(500).json({ message: "Failed to create invite" });
    }
  });
  app2.get("/api/invites", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites3 = await storage.getAllInvites();
      res.json(invites3);
    } catch (error) {
      res.status(500).json({ message: "Failed to list invites" });
    }
  });
  app2.get("/api/invites/pending", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const invites3 = await storage.getPendingInvites();
      res.json(invites3);
    } catch (error) {
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
      const { generateUsername: generateUsername3, getNextUserNumber: getNextUserNumber3 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const currentYear = (/* @__PURE__ */ new Date()).getFullYear().toString();
      const allUsers = await storage.getAllUsers();
      const existingUsernames = allUsers.map((u) => u.username).filter((u) => !!u);
      const nextNumber = getNextUserNumber3(existingUsernames, invite.roleId);
      const username = generateUsername3(invite.roleId, nextNumber);
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
        mustChangePassword: true,
        // ✅ SECURITY: Force password change on first login even for invited users
        profileCompleted: false,
        // 🔧 FIX: Explicitly set profile fields
        profileSkipped: false
        // 🔧 FIX: New staff start with incomplete profile
      });
      await storage.markInviteAsAccepted(invite.id, user.id);
      const token_jwt = jwt.sign(
        { userId: user.id, roleId: user.roleId },
        SECRET_KEY,
        { expiresIn: "24h" }
      );
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
      res.status(500).json({ message: "Failed to delete invite" });
    }
  });
  app2.get("/api/health", async (_req, res) => {
    try {
      await db2.select().from(roles).limit(1);
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
      res.json({
        message: "Message sent successfully! We'll get back to you soon.",
        id: savedMessage.id
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to send message. Please try again." });
    }
  });
  app2.get("/api/analytics/overview", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const allRoles = await storage.getRoles();
      const roleMap = new Map(allRoles.map((r) => [r.name.toLowerCase(), r.id]));
      const studentRoleId = roleMap.get("student");
      const teacherRoleId = roleMap.get("teacher");
      const [
        allStudents,
        allTeachers,
        allClasses
      ] = await Promise.all([
        studentRoleId ? storage.getUsersByRole(studentRoleId) : [],
        teacherRoleId ? storage.getUsersByRole(teacherRoleId) : [],
        storage.getAllClasses()
      ]);
      const now = /* @__PURE__ */ new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const newStudentsThisMonth = allStudents.filter((student) => {
        if (!student.createdAt) return false;
        const createdAt = new Date(student.createdAt);
        return createdAt >= startOfMonth;
      }).length;
      const startOfTerm = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const newTeachersThisTerm = allTeachers.filter((teacher) => {
        if (!teacher.createdAt) return false;
        const createdAt = new Date(teacher.createdAt);
        return createdAt >= startOfTerm;
      }).length;
      res.json({
        totalStudents: allStudents.length,
        totalTeachers: allTeachers.length,
        totalClasses: allClasses.length,
        recentActivity: {
          newStudentsThisMonth,
          newTeachersThisTerm
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });
  app2.get("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const { role } = req.query;
      const currentUser = req.user;
      if (!currentUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
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
      const isCurrentUserSuperAdmin = currentUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts) {
          users3 = users3.filter(
            (user) => user.roleId !== ROLES.SUPER_ADMIN && user.roleId !== ROLES.ADMIN
          );
        }
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
      res.status(500).json({ message: "Failed to fetch users" });
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
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "active", adminUser.id, "User verified by admin");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_verified",
        entityType: "user",
        entityId: "0",
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "active" }),
        reason: `Admin ${adminUser.email} verified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User verified and activated successfully",
        user: safeUser
      });
    } catch (error) {
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
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "pending", adminUser.id, "User unverified by admin - awaiting approval");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_unverified",
        entityType: "user",
        entityId: "0",
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "pending" }),
        reason: `Admin ${adminUser.email} unverified user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User unverified and moved to pending status",
        user: safeUser
      });
    } catch (error) {
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
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "suspended", adminUser.id, reason || "Account suspended by admin");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_suspended",
        entityType: "user",
        entityId: "0",
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "suspended" }),
        reason: reason || `Admin ${adminUser.email} suspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User suspended successfully",
        user: safeUser
      });
    } catch (error) {
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
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      const oldStatus = user.status;
      const updatedUser = await storage.updateUserStatus(id, "active", adminUser.id, "Suspension lifted by admin");
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_unsuspended",
        entityType: "user",
        entityId: "0",
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status: "active" }),
        reason: `Admin ${adminUser.email} unsuspended user ${user.email}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User unsuspended successfully",
        user: safeUser
      });
    } catch (error) {
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
        entityId: "0",
        // Placeholder, needs proper entity ID if applicable
        oldValue: JSON.stringify({ userId: user.id, status: oldStatus }),
        newValue: JSON.stringify({ userId: user.id, status }),
        reason: reason || `Admin ${adminUser.email} changed status of user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: `User status updated to ${status}`,
        user: safeUser
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user status" });
    }
  });
  app2.put("/api/users/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const adminUser = req.user;
      if (!adminUser) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const updateSchema = z2.object({
        firstName: z2.string().min(1).optional(),
        lastName: z2.string().min(1).optional(),
        email: z2.string().email().optional(),
        password: z2.string().min(6).optional()
      });
      const validatedData = updateSchema.parse(req.body);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      const updateData = {};
      if (validatedData.firstName) updateData.firstName = validatedData.firstName;
      if (validatedData.lastName) updateData.lastName = validatedData.lastName;
      if (validatedData.email) updateData.email = validatedData.email;
      if (validatedData.password) {
        const hashedPassword = await bcrypt2.hash(validatedData.password, BCRYPT_ROUNDS);
        updateData.passwordHash = hashedPassword;
      }
      const updatedUser = await storage.updateUser(id, updateData);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_updated",
        entityType: "user",
        entityId: "0",
        oldValue: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }),
        newValue: JSON.stringify(updateData),
        reason: `Admin ${adminUser.email} updated user ${user.email || user.username}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash, ...safeUser } = updatedUser;
      res.json({
        message: "User updated successfully",
        user: safeUser
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });
  app2.delete("/api/users/:id", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN), async (req, res) => {
    const startTime = Date.now();
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
      if (user.id === adminUser.id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      const isCurrentUserSuperAdmin = adminUser.roleId === ROLES.SUPER_ADMIN;
      if (!isCurrentUserSuperAdmin) {
        const settings3 = await storage.getSystemSettings();
        const hideAdminAccounts = settings3?.hideAdminAccountsFromAdmins ?? true;
        if (hideAdminAccounts && (user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN)) {
          return res.status(403).json({
            message: "You do not have permission to manage admin accounts.",
            code: "ADMIN_ACCOUNT_PROTECTED"
          });
        }
      }
      if (user.roleId === ROLES.SUPER_ADMIN && adminUser.roleId !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          message: "Only Super Admins can delete Super Admin accounts.",
          code: "SUPER_ADMIN_PROTECTED"
        });
      }
      if (user.roleId === ROLES.ADMIN && adminUser.roleId === ROLES.ADMIN) {
        return res.status(403).json({
          message: "Admins cannot delete other Admin accounts.",
          code: "ADMIN_PROTECTED"
        });
      }
      let deleted = false;
      let lastError = null;
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          deleted = await storage.deleteUser(id);
          if (deleted) {
            break;
          } else {
          }
        } catch (deleteError) {
          lastError = deleteError;
          if (deleteError?.code === "42501" || deleteError?.message?.includes("permission denied")) {
            return res.status(403).json({
              message: "Database permission error: Cannot delete user due to Row Level Security policies. Please check database RLS settings or use 'Disable Account' instead.",
              technicalDetails: "RLS_PERMISSION_DENIED"
            });
          }
          if (deleteError?.code !== "ECONNRESET" && !deleteError?.message?.includes("timeout")) {
            break;
          }
          if (attempt < maxRetries) {
            const backoffMs = 100 * Math.pow(2, attempt - 1);
            await new Promise((resolve) => setTimeout(resolve, backoffMs));
          }
        }
      }
      if (!deleted) {
        const errorMsg = lastError?.message || "Unknown error";
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
        return res.status(500).json({
          message: "Delete operation completed but user still exists. This may be a database policy issue.",
          technicalDetails: "DELETE_VERIFICATION_FAILED"
        });
      }
      storage.createAuditLog({
        userId: adminUser.id,
        action: "user_deleted",
        entityType: "user",
        entityId: "0",
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
      });
      const totalTime = Date.now() - startTime;
      res.json({
        message: "User deleted successfully",
        deletedUserId: id,
        executionTime: `${totalTime}ms`
      });
    } catch (error) {
      const totalTime = Date.now() - startTime;
      res.status(500).json({
        message: "An unexpected error occurred while deleting user",
        technicalDetails: error.message
      });
    }
  });
  app2.post("/api/users/:id/reset-password", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword, forceChange } = z2.object({
        newPassword: z2.string().min(6, "Password must be at least 6 characters").optional(),
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
      let passwordToUse = newPassword;
      let generatedPassword;
      if (!newPassword) {
        const { generateTempPassword: generateTempPassword2 } = await Promise.resolve().then(() => (init_username_generator(), username_generator_exports));
        generatedPassword = generateTempPassword2();
        passwordToUse = generatedPassword;
      }
      const passwordHash = await bcrypt2.hash(passwordToUse, BCRYPT_ROUNDS);
      await storage.updateUser(id, {
        passwordHash,
        mustChangePassword: forceChange
      });
      await storage.createAuditLog({
        userId: adminUser.id,
        action: "password_reset",
        entityType: "user",
        entityId: "0",
        oldValue: JSON.stringify({ userId: user.id, mustChangePassword: user.mustChangePassword }),
        newValue: JSON.stringify({ userId: user.id, mustChangePassword: forceChange }),
        reason: `Admin ${adminUser.email} reset password for user ${user.email || user.username}${forceChange ? " (force change on next login)" : ""}${generatedPassword ? " (auto-generated)" : ""}`,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"]
      });
      const { passwordHash: _, ...safeUser } = user;
      res.json({
        message: `Password reset successfully${forceChange ? ". User must change password on next login." : ""}`,
        user: { ...safeUser, email: user.email, username: user.username },
        ...generatedPassword && { temporaryPassword: generatedPassword }
        // Include generated password if auto-generated
      });
    } catch (error) {
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
        entityId: "0",
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
      const { limit, action, entityType } = z2.object({
        limit: z2.coerce.number().int().positive().max(1e3).optional().default(100),
        action: z2.string().optional(),
        entityType: z2.string().optional()
      }).parse(req.query);
      const logs = await storage.getAuditLogs({
        limit,
        action,
        entityType
      });
      const enrichedLogs = await Promise.all(logs.map(async (log) => {
        const user = log.userId ? await storage.getUser(log.userId) : null;
        return {
          ...log,
          userEmail: user?.email,
          userName: `${user?.firstName} ${user?.lastName}`
        };
      }));
      res.json(enrichedLogs);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Invalid query parameters",
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`)
        });
      }
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.post("/api/users", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.TEACHER), async (req, res) => {
    try {
      const { password, ...otherUserData } = req.body;
      if (!password || typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }
      if (req.user.roleId === ROLES.TEACHER && otherUserData.roleId !== ROLES.STUDENT) {
        return res.status(403).json({ message: "Teachers can only create student accounts" });
      }
      let username = otherUserData.username;
      if (!username && otherUserData.roleId) {
        const { generateUsernameByRole: generateUsernameByRole2 } = await Promise.resolve().then(() => (init_username_generator(), username_generator_exports));
        username = await generateUsernameByRole2(otherUserData.roleId);
      }
      const passwordHash = await bcrypt2.hash(password, BCRYPT_ROUNDS);
      const userData = insertUserSchema.parse({
        ...otherUserData,
        username,
        passwordHash,
        status: "active",
        // ✅ AUTO-APPROVE: Direct creation by admin/teacher means instant approval
        isActive: true,
        // ✅ Enable account immediately
        mustChangePassword: true,
        // ✅ SECURITY: ALWAYS force password change on first login - cannot be overridden
        profileCompleted: otherUserData.profileCompleted ?? false,
        // 🔧 FIX: Default to false if not provided
        profileSkipped: otherUserData.profileSkipped ?? false,
        // 🔧 FIX: Default to false if not provided
        createdVia: req.user.roleId === ROLES.TEACHER ? "teacher" : "admin"
        // Track who created the user
      });
      const user = await storage.createUser(userData);
      if (otherUserData.roleId === ROLES.STUDENT && otherUserData.classId) {
        await storage.createStudent({
          id: user.id,
          admissionNumber: username,
          // Use username as admission number
          admissionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          // Today's date as admission date
          classId: otherUserData.classId,
          parentId: otherUserData.parentId || null
        });
      }
      const { passwordHash: _, ...userResponse } = user;
      res.json({
        ...userResponse,
        temporaryPassword: password
      });
    } catch (error) {
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
      const csvContent = await fs2.readFile(req.file.path, "utf-8");
      const lines = csvContent.trim().split("\n");
      if (lines.length < 2) {
        return res.status(4e3).json({ message: "CSV file must contain header and at least one row" });
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
      const { generateUsername: generateUsername3, generatePassword: generatePassword2 } = await Promise.resolve().then(() => (init_auth_utils(), auth_utils_exports));
      const allUsers = await storage.getAllUsers();
      const existingUsernames = allUsers.map((u) => u.username).filter((u) => !!u);
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
        headers.forEach((header, index3) => {
          row[header] = values[index3] || "";
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
            const parentCount = existingUsernames.filter((u) => u.startsWith(`THS-PAR-`)).length + 1;
            const parentUsername = generateUsername3(parentRoleData.id, parentCount);
            const parentPassword = generatePassword2(currentYear);
            const parentPasswordHash = await bcrypt2.hash(parentPassword, BCRYPT_ROUNDS);
            parent = await storage.createUser({
              username: parentUsername,
              email: parentEmail,
              passwordHash: parentPasswordHash,
              roleId: parentRoleData.id,
              firstName: parentFirstName,
              lastName: parentLastName,
              mustChangePassword: true,
              profileCompleted: false,
              // 🔧 FIX: Explicitly set profile fields
              profileSkipped: false
              // 🔧 FIX: CSV import parents start with incomplete profile
            });
            existingUsernames.push(parentUsername);
            parentCredentials = { username: parentUsername, password: parentPassword };
            parentId = parent.id;
          } else {
            parentId = parent.id;
          }
          const classObj = await storage.getAllClasses(true);
          const studentClass = classObj.find((c) => c.name.toLowerCase() === className.toLowerCase());
          if (!studentClass) {
            errors.push(`Row ${i + 1}: Class "${className}" not found`);
            continue;
          }
          const studentCount = existingUsernames.filter((u) => u.startsWith(`THS-STU-`)).length + 1;
          const studentUsername = generateUsername3(studentRoleData.id, studentCount);
          const studentPassword = generatePassword2(currentYear);
          const studentPasswordHash = await bcrypt2.hash(studentPassword, BCRYPT_ROUNDS);
          const studentUser = await storage.createUser({
            username: studentUsername,
            // Auto-generated email
            email: `${studentUsername.toLowerCase()}@ths.edu`,
            // Auto-generated email
            passwordHash: studentPasswordHash,
            roleId: studentRoleData.id,
            firstName: studentFirstName,
            lastName: studentLastName,
            mustChangePassword: true,
            profileCompleted: false,
            // 🔧 FIX: Explicitly set profile fields
            profileSkipped: false
            // 🔧 FIX: CSV import students start with incomplete profile
          });
          existingUsernames.push(studentUsername);
          const admissionNumber = studentUsername;
          await storage.createStudent({
            id: studentUser.id,
            admissionNumber,
            admissionDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            // Today's date as admission date
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
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      await fs2.unlink(req.file.path);
      res.json({
        message: `Successfully created ${createdUsers.length} users`,
        users: createdUsers,
        errors: errors.length > 0 ? errors : void 0
      });
    } catch (error) {
      if (req.file?.path) {
        try {
          await fs2.unlink(req.file.path);
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
      const csvContent = await fs2.readFile(req.file.path, "utf-8");
      const { previewCSVImport: previewCSVImport2 } = await Promise.resolve().then(() => (init_csv_import_service(), csv_import_service_exports));
      const preview = await previewCSVImport2(csvContent);
      await fs2.unlink(req.file.path);
      res.json(preview);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to preview CSV" });
    }
  });
  app2.post("/api/students/csv-preview", authenticateUser, authorizeRoles(ROLES.ADMIN), uploadCSV.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      const csvContent = await fs2.readFile(req.file.path, "utf-8");
      const { previewCSVImport: previewCSVImport2 } = await Promise.resolve().then(() => (init_csv_import_service(), csv_import_service_exports));
      const preview = await previewCSVImport2(csvContent);
      await fs2.unlink(req.file.path);
      res.json(preview);
    } catch (error) {
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
        entityId: "0",
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
      res.status(500).json({ message: error.message || "Failed to import students" });
    }
  });
  app2.get("/api/students", authenticateUser, async (req, res) => {
    try {
      const allStudents = await storage.getAllStudents(false);
      const enrichedStudents = await Promise.all(
        allStudents.map(async (student) => {
          const user = await storage.getUser(student.id);
          const classInfo = student.classId ? await storage.getClass(student.classId) : null;
          const parentUser = student.parentId ? await storage.getUser(student.parentId) : null;
          return {
            ...student,
            user: user ? {
              id: user.id,
              username: user.username,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
              phone: user.phone,
              gender: user.gender,
              dateOfBirth: user.dateOfBirth,
              profileImageUrl: user.profileImageUrl,
              isActive: user.isActive,
              status: user.status
            } : null,
            class: classInfo,
            parent: parentUser ? {
              id: parentUser.id,
              firstName: parentUser.firstName,
              lastName: parentUser.lastName,
              email: parentUser.email,
              phone: parentUser.phone
            } : null
          };
        })
      );
      res.json(enrichedStudents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });
  app2.post("/api/students", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const validatedData = createStudentSchema.parse(req.body);
      const adminUserId = req.user.id;
      const year = (/* @__PURE__ */ new Date()).getFullYear();
      const result = await db2.transaction(async (tx) => {
        const studentUsername = await generateStudentUsername2();
        const studentPassword = generateStudentPassword();
        const passwordHash = await bcrypt2.hash(studentPassword, BCRYPT_ROUNDS);
        const studentEmail = `${studentUsername}@ths.edu`;
        const [studentUser] = await tx.insert(users).values({
          username: studentUsername,
          email: studentEmail,
          passwordHash,
          roleId: ROLES.STUDENT,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          dateOfBirth: validatedData.dateOfBirth,
          gender: validatedData.gender,
          profileImageUrl: validatedData.profileImageUrl || null,
          isActive: true,
          status: "active",
          createdVia: "admin",
          createdBy: adminUserId,
          mustChangePassword: true
        }).returning();
        const admissionNumber = `THS/${year}/${String(Date.now()).slice(-6)}`;
        const [student] = await tx.insert(students).values({
          id: studentUser.id,
          admissionNumber,
          classId: validatedData.classId,
          admissionDate: validatedData.admissionDate,
          emergencyContact: validatedData.emergencyContact || null,
          medicalInfo: validatedData.medicalInfo || null,
          parentId: validatedData.parentId || null
        }).returning();
        let parentCredentials = null;
        if (validatedData.parentPhone && !validatedData.parentId) {
          const existingParent = await tx.select().from(users).where(and3(
            eq4(users.phone, validatedData.parentPhone),
            eq4(users.roleId, ROLES.PARENT)
          )).limit(1);
          if (existingParent.length > 0) {
            await tx.update(students).set({ parentId: existingParent[0].id }).where(eq4(students.id, studentUser.id));
            student.parentId = existingParent[0].id;
          } else {
            const parentUsername = await generateParentUsername();
            const parentPassword = generatePassword();
            const parentHash = await bcrypt2.hash(parentPassword, BCRYPT_ROUNDS);
            const parentEmail = `${parentUsername}@ths.edu`;
            const [parentUser] = await tx.insert(users).values({
              username: parentUsername,
              email: parentEmail,
              passwordHash: parentHash,
              roleId: ROLES.PARENT,
              firstName: validatedData.guardianName || `Parent of ${validatedData.firstName}`,
              lastName: validatedData.lastName,
              phone: validatedData.parentPhone,
              isActive: true,
              status: "active",
              createdVia: "admin",
              createdBy: adminUserId,
              mustChangePassword: true
            }).returning();
            await tx.update(students).set({ parentId: parentUser.id }).where(eq4(students.id, studentUser.id));
            student.parentId = parentUser.id;
            parentCredentials = {
              username: parentUsername,
              password: parentPassword,
              email: parentEmail
            };
          }
        }
        return {
          student,
          studentUser,
          studentCredentials: {
            username: studentUsername,
            password: studentPassword,
            email: studentEmail
          },
          parentCredentials
        };
      });
      await storage.createAuditLog({
        userId: adminUserId,
        action: "create_student",
        entityType: "student",
        entityId: "0",
        newValue: JSON.stringify({
          studentId: result.studentUser.id,
          username: result.studentCredentials.username
        }),
        reason: `Created student ${result.studentUser.firstName} ${result.studentUser.lastName}`,
        ipAddress: req.ip || "unknown",
        userAgent: req.headers["user-agent"] || null
      });
      res.status(201).json({
        message: "Student created successfully",
        credentials: {
          student: {
            id: result.studentUser.id,
            username: result.studentCredentials.username,
            email: result.studentCredentials.email,
            password: result.studentCredentials.password,
            firstName: result.studentUser.firstName,
            lastName: result.studentUser.lastName,
            admissionNumber: result.student.admissionNumber,
            classId: result.student.classId
          },
          parent: result.parentCredentials
        },
        parentCreated: result.parentCredentials !== null
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({
        message: error.message || "Failed to create student"
      });
    }
  });
  app2.get("/api/students/:id", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      if (req.user.id !== studentId && req.user.roleId !== ROLES.ADMIN && req.user.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student data" });
    }
  });
  app2.get("/api/students/:id/classes", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      if (req.user.id !== studentId && req.user.roleId !== ROLES.ADMIN && req.user.roleId !== ROLES.TEACHER) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const student = await storage.getStudent(studentId);
      const classes3 = student?.classId ? await storage.getClass(student.classId) : null;
      res.json(classes3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });
  app2.patch("/api/students/:id", authenticateUser, async (req, res) => {
    try {
      const studentId = req.params.id;
      if (req.user.id !== studentId && req.user.roleId !== ROLES.ADMIN) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      const updates = req.body;
      const userFields = ["firstName", "lastName", "email", "phone", "address", "recoveryEmail", "dateOfBirth", "gender", "profileImageUrl"];
      const studentFields = ["emergencyContact", "emergencyPhone", "medicalInfo", "guardianName"];
      const userPatch = {};
      const studentPatch = {};
      Object.keys(updates).forEach((key) => {
        if (updates[key] !== void 0 && updates[key] !== null) {
          if (userFields.includes(key)) {
            userPatch[key] = updates[key];
          } else if (studentFields.includes(key)) {
            studentPatch[key] = updates[key];
          }
        }
      });
      const updatedStudent = await storage.updateStudent(studentId, {
        userPatch: Object.keys(userPatch).length > 0 ? userPatch : void 0,
        studentPatch: Object.keys(studentPatch).length > 0 ? studentPatch : void 0
      });
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(updatedStudent);
    } catch (error) {
      res.status(500).json({ message: "Failed to update student profile" });
    }
  });
  app2.delete("/api/students/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const studentId = req.params.id;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(studentId)) {
        return res.status(400).json({ message: "Invalid student ID format" });
      }
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      const deleted = await storage.deleteStudent(studentId);
      if (!deleted) {
        return res.status(500).json({ message: "Failed to delete student" });
      }
      res.json({
        success: true,
        message: "Student deleted successfully",
        studentId
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });
  app2.get("/api/student/profile/status", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const userId = req.user.id;
      let user = await storage.getUser(userId);
      const student = await storage.getStudent(userId);
      let completionPercentage = 0;
      if (student) {
        const fields = [
          user?.phone,
          user?.address,
          user?.dateOfBirth,
          user?.gender,
          student?.emergencyContact,
          student?.medicalInfo,
          user?.recoveryEmail
        ];
        const filledFields = fields.filter((field) => field !== null && field !== void 0 && field !== "").length;
        completionPercentage = Math.round(filledFields / fields.length * 100);
      }
      if (completionPercentage === 100 && !user?.profileCompleted) {
        const updated = await storage.updateStudent(userId, {
          userPatch: {
            profileCompleted: true,
            profileCompletionPercentage: 100,
            profileSkipped: false
          }
        });
        if (updated) {
          user = updated.user;
        }
      }
      const status = {
        hasProfile: !!student,
        completed: user?.profileCompleted || false,
        skipped: user?.profileSkipped || false,
        percentage: user?.profileCompletionPercentage || completionPercentage,
        firstLogin: !user?.profileCompleted
        // First login if profile not completed
      };
      res.json(status);
    } catch (error) {
      res.status(500).json({ message: "Failed to check profile status" });
    }
  });
  app2.post("/api/student/profile/setup", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      const { phone, address, dateOfBirth, gender, recoveryEmail, bloodGroup, emergencyContact, emergencyPhone, agreement, ...studentFields } = profileData;
      const updatedStudent = await storage.updateStudent(userId, {
        userPatch: {
          phone,
          address,
          dateOfBirth,
          gender,
          recoveryEmail,
          profileCompleted: true,
          profileSkipped: false,
          profileCompletionPercentage: 100
        },
        studentPatch: {
          emergencyContact: emergencyContact || null,
          emergencyPhone: emergencyPhone || null,
          guardianName: emergencyContact || null,
          medicalInfo: bloodGroup ? `Blood Group: ${bloodGroup}` : null
        }
      });
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({
        message: "Profile setup completed successfully",
        student: updatedStudent.student,
        user: updatedStudent.user
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to setup profile", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app2.post("/api/student/profile/skip", authenticateUser, authorizeRoles(ROLES.STUDENT), async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await storage.updateUser(userId, {
        profileSkipped: true,
        profileCompleted: false
      });
      res.json({
        message: "Profile setup skipped. You can complete it later in Settings.",
        skipped: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to skip profile setup" });
    }
  });
  app2.get("/api/vacancies", async (req, res) => {
    try {
      const status = req.query.status;
      const vacancies3 = await storage.getAllVacancies(status);
      res.json(vacancies3);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to close vacancy" });
    }
  });
  app2.get("/api/admin/applications", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const status = req.query.status;
      const applications = await storage.getAllTeacherApplications(status);
      res.json(applications);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to update application" });
    }
  });
  app2.get("/api/admin/approved-teachers", authenticateUser, authorizeRoles(ROLES.ADMIN), async (req, res) => {
    try {
      const approvedTeachers3 = await storage.getAllApprovedTeachers();
      res.json(approvedTeachers3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approved teachers" });
    }
  });
  app2.get("/api/superadmin/stats", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const stats = await storage.getSuperAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system statistics" });
    }
  });
  app2.get("/api/superadmin/admins", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const admins = await storage.getUsersByRole(ROLES.ADMIN);
      res.json(admins);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch administrators" });
    }
  });
  app2.post("/api/superadmin/admins", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const createAdminSchema = z2.object({
        firstName: z2.string().min(1, "First name is required").trim(),
        lastName: z2.string().min(1, "Last name is required").trim(),
        email: z2.string().email("Invalid email address").toLowerCase().trim()
      });
      const validatedData = createAdminSchema.parse(req.body);
      const { firstName, lastName, email } = validatedData;
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const { generateAdminUsername: generateAdminUsername3, generateTempPassword: generateTempPassword2 } = await Promise.resolve().then(() => (init_username_generator(), username_generator_exports));
      const username = await generateAdminUsername3();
      const tempPassword = generateTempPassword2();
      const passwordHash = await bcrypt2.hash(tempPassword, 12);
      const newAdmin = await storage.createUser({
        username,
        email,
        passwordHash,
        roleId: ROLES.ADMIN,
        firstName,
        lastName,
        status: "active",
        isActive: true,
        mustChangePassword: true,
        // User must change password after first login
        createdVia: "admin",
        createdBy: req.user.id,
        approvedBy: req.user.id,
        approvedAt: /* @__PURE__ */ new Date()
      });
      await storage.createAdminProfile({
        userId: newAdmin.id,
        department: "Administration",
        accessLevel: "standard"
      });
      await storage.createAuditLog({
        userId: req.user.id,
        action: "admin_created",
        entityType: "user",
        entityId: newAdmin.id,
        reason: `New admin created: ${username} (auto-generated credentials)`
      });
      res.status(201).json({
        message: "Admin created successfully with auto-generated credentials",
        admin: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          firstName: newAdmin.firstName,
          lastName: newAdmin.lastName
        },
        credentials: {
          username,
          password: tempPassword,
          role: "Admin"
        }
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: error.errors[0].message || "Validation error",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create administrator" });
    }
  });
  app2.get("/api/superadmin/logs", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const logs = await storage.getAuditLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });
  app2.get("/api/superadmin/settings", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const settings3 = await storage.getSystemSettings();
      res.json(settings3);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system settings" });
    }
  });
  app2.put("/api/superadmin/settings", authenticateUser, authorizeRoles(ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const settings3 = await storage.updateSystemSettings(req.body);
      await storage.createAuditLog({
        userId: req.user.id,
        action: "settings_updated",
        entityType: "system_settings",
        entityId: String(settings3.id),
        reason: "System settings updated by Super Admin"
      });
      res.json(settings3);
    } catch (error) {
      res.status(500).json({ message: "Failed to update system settings" });
    }
  });
  app2.post("/api/teacher-assignments", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const { teacherId, classId, subjectId, termId } = req.body;
      if (!teacherId || !classId || !subjectId) {
        return res.status(400).json({ message: "teacherId, classId, and subjectId are required" });
      }
      const teacher = await storage.getUser(teacherId);
      if (!teacher || teacher.roleId !== ROLES.TEACHER) {
        return res.status(400).json({ message: "Invalid teacher ID" });
      }
      const classExists = await storage.getClass(classId);
      if (!classExists) {
        return res.status(400).json({ message: "Class not found" });
      }
      const subjectExists = await storage.getSubject(subjectId);
      if (!subjectExists) {
        return res.status(400).json({ message: "Subject not found" });
      }
      const assignment = await storage.createTeacherClassAssignment({
        teacherId,
        classId,
        subjectId,
        termId: termId || null,
        assignedBy: req.user.id,
        isActive: true
      });
      res.status(201).json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create teacher assignment" });
    }
  });
  app2.get("/api/teacher-assignments", authenticateUser, async (req, res) => {
    try {
      const { teacherId } = req.query;
      if (req.user.roleId === ROLES.TEACHER) {
        const assignments = await storage.getTeacherClassAssignments(req.user.id);
        const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
          const classInfo = await storage.getClass(assignment.classId);
          const subjectInfo = await storage.getSubject(assignment.subjectId);
          return {
            ...assignment,
            className: classInfo?.name,
            subjectName: subjectInfo?.name
          };
        }));
        return res.json(enrichedAssignments);
      }
      if (req.user.roleId !== ROLES.ADMIN && req.user.roleId !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      if (teacherId) {
        const assignments = await storage.getTeacherClassAssignments(teacherId);
        const enrichedAssignments = await Promise.all(assignments.map(async (assignment) => {
          const classInfo = await storage.getClass(assignment.classId);
          const subjectInfo = await storage.getSubject(assignment.subjectId);
          const teacher = await storage.getUser(assignment.teacherId);
          return {
            ...assignment,
            className: classInfo?.name,
            subjectName: subjectInfo?.name,
            teacherName: `${teacher?.firstName} ${teacher?.lastName}`
          };
        }));
        return res.json(enrichedAssignments);
      }
      res.json({ message: "Please specify teacherId parameter" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher assignments" });
    }
  });
  app2.get("/api/classes/:classId/subjects/:subjectId/teachers", authenticateUser, async (req, res) => {
    try {
      const { classId, subjectId } = req.params;
      const teachers = await storage.getTeachersForClassSubject(Number(classId), Number(subjectId));
      const sanitizedTeachers = teachers.map((teacher) => {
        const { passwordHash, ...safeTeacher } = teacher;
        return safeTeacher;
      });
      res.json(sanitizedTeachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });
  app2.get("/api/teachers/:teacherId/assignments", authenticateUser, async (req, res) => {
    try {
      const { teacherId } = req.params;
      if (req.user.roleId === ROLES.TEACHER && req.user.id !== teacherId) {
        return res.status(403).json({ message: "You can only view your own assignments" });
      }
      const assignments = await storage.getTeacherClassAssignments(teacherId);
      const groupedByClass = {};
      for (const assignment of assignments) {
        const classInfo = await storage.getClass(assignment.classId);
        const subjectInfo = await storage.getSubject(assignment.subjectId);
        if (!groupedByClass[assignment.classId]) {
          groupedByClass[assignment.classId] = {
            classId: assignment.classId,
            className: classInfo?.name,
            subjects: []
          };
        }
        groupedByClass[assignment.classId].subjects.push({
          assignmentId: assignment.id,
          subjectId: assignment.subjectId,
          subjectName: subjectInfo?.name,
          termId: assignment.termId,
          isActive: assignment.isActive
        });
      }
      res.json(Object.values(groupedByClass));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher assignments" });
    }
  });
  app2.put("/api/teacher-assignments/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const updatedAssignment = await storage.updateTeacherClassAssignment(Number(id), updateData);
      if (!updatedAssignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(updatedAssignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update teacher assignment" });
    }
  });
  app2.delete("/api/teacher-assignments/:id", authenticateUser, authorizeRoles(ROLES.ADMIN, ROLES.SUPER_ADMIN), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTeacherClassAssignment(Number(id));
      if (!success) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json({ message: "Teacher assignment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher assignment" });
    }
  });
  app2.get("/api/teachers-for-subject", authenticateUser, async (req, res) => {
    try {
      const { classId, subjectId } = req.query;
      if (!classId || !subjectId) {
        return res.status(400).json({ message: "Both classId and subjectId are required" });
      }
      const teachers = await storage.getTeachersForClassSubject(Number(classId), Number(subjectId));
      if (teachers.length === 0) {
        return res.json([]);
      }
      const teacherData = teachers.map((teacher) => ({
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        username: teacher.username
      }));
      res.json(teacherData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
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
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
var vite_config_default = defineConfig({
  plugins: [
    react()
    // Replit plugins temporarily commented out due to installation issues
    // ...(process.env.NODE_ENV !== "production"
    //   ? [
    //       (await import("@replit/vite-plugin-runtime-error-modal")).default(),
    //     ]
    //   : []),
    // ...(process.env.NODE_ENV !== "production" &&
    // process.env.REPL_ID !== undefined
    //   ? [
    //       await import("@replit/vite-plugin-cartographer").then((m) =>
    //         m.cartographer(),
    //       ),
    //     ]
    //   : []),
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
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
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
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
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
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
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/seed-terms.ts
init_storage();
init_schema();
async function seedAcademicTerms() {
  try {
    const existingTerms = await db2.select().from(academicTerms);
    if (existingTerms.length === 0) {
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
        await db2.insert(academicTerms).values(term);
      }
    } else {
    }
  } catch (error) {
    throw error;
  }
}

// server/env-validation.ts
var envConfig = {
  required: [
    "JWT_SECRET"
    // Required in both environments
  ],
  optional: [
    "SESSION_SECRET",
    "FRONTEND_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ],
  productionRequired: [
    "DATABASE_URL",
    // Neon PostgreSQL connection string
    "JWT_SECRET",
    "SESSION_SECRET",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET"
  ]
};
function validateEnvironment(isProduction4) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    environment: isProduction4 ? "production" : "development"
  };
  const requiredVars = isProduction4 ? envConfig.productionRequired : envConfig.required;
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      if (varName === "JWT_SECRET" && !isProduction4) {
        result.warnings.push(`${varName} not set, using development fallback`);
      } else if (varName === "SESSION_SECRET" && !isProduction4) {
        result.warnings.push(`${varName} not set, using development fallback`);
      } else if (isProduction4) {
        result.errors.push(`Missing required environment variable: ${varName}`);
        result.isValid = false;
      } else {
        result.warnings.push(`${varName} not set (optional in development)`);
      }
    }
  }
  for (const varName of envConfig.optional) {
    if (!process.env[varName] && !result.warnings.find((w) => w.includes(varName))) {
      if (varName.startsWith("CLOUDINARY_") && isProduction4) {
        result.warnings.push(`${varName} not set - file uploads will fail`);
      }
    }
  }
  if (isProduction4 && !process.env.DATABASE_URL) {
    result.errors.push("DATABASE_URL is required for production (Neon PostgreSQL)");
    result.isValid = false;
  } else if (!isProduction4 && !process.env.DATABASE_URL) {
    result.warnings.push("Using SQLite for development (DATABASE_URL not set)");
  }
  if (result.errors.length > 0) {
    console.error("\n\u274C Environment Validation Errors:");
    result.errors.forEach((err) => console.error(`   - ${err}`));
  }
  if (result.warnings.length > 0) {
    console.warn("\n\u26A0\uFE0F Environment Warnings:");
    result.warnings.forEach((warn) => console.warn(`   - ${warn}`));
  }
  if (result.isValid) {
    console.log(`
\u2705 Environment validation passed for ${result.environment}`);
  }
  return result;
}

// server/index.ts
import fs4 from "fs/promises";
var isProduction3 = process.env.NODE_ENV === "production";
validateEnvironment(isProduction3);
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
    const originWithoutPort = origin.replace(/:\d+$/, "");
    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === "string") {
        const allowedWithoutPort = allowed.replace(/:\d+$/, "");
        return origin === allowed || origin === allowed.replace(/\/$/, "") || originWithoutPort === allowedWithoutPort || originWithoutPort === allowedWithoutPort.replace(/\/$/, "");
      }
      return allowed.test(origin) || allowed.test(originWithoutPort);
    });
    if (isAllowed) {
      callback(null, true);
    } else {
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
app.use("/uploads", express2.static("server/uploads"));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  const isProduction4 = process.env.NODE_ENV === "production";
  let capturedJsonResponse = void 0;
  if (req.method === "GET" && path5.startsWith("/api/")) {
    if (path5.includes("/homepage-content") || path5.includes("/announcements")) {
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=120");
    } else if (!path5.includes("/auth")) {
      res.setHeader("Cache-Control", "private, max-age=30");
    }
  }
  if (!isProduction4) {
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
  }
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400 && res.statusCode < 500) {
      console.log(`\u274C 4xx ERROR: ${req.method} ${req.originalUrl || path5} - Status ${res.statusCode} - Referer: ${req.get("referer") || "none"}`);
    }
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (!isProduction4 && capturedJsonResponse) {
        const sanitizedResponse = sanitizeLogData(capturedJsonResponse);
        logLine += ` :: ${JSON.stringify(sanitizedResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      console.log(logLine);
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
  console.log("\u2705 Using SQLite database at ./server/data/app.db (schema managed via drizzle-kit push)");
  try {
    console.log("Seeding academic terms if needed...");
    await seedAcademicTerms();
    console.log("\u2705 Academic terms seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`\u26A0\uFE0F Academic terms seeding failed: ${errorMessage}`);
  }
  try {
    console.log("Seeding system settings if needed...");
    const { seedSystemSettings: seedSystemSettings2 } = await Promise.resolve().then(() => (init_seed_system_settings(), seed_system_settings_exports));
    await seedSystemSettings2();
    console.log("\u2705 System settings seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`\u26A0\uFE0F System settings seeding failed: ${errorMessage}`);
  }
  try {
    console.log("Creating core roles...");
    const { seedRoles: seedRoles2 } = await Promise.resolve().then(() => (init_seed_roles(), seed_roles_exports));
    await seedRoles2();
    console.log("\u2705 Roles seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`\u26A0\uFE0F Roles seeding failed: ${errorMessage}`);
  }
  try {
    console.log("Creating test user accounts for all roles...");
    const { seedTestUsers: seedTestUsers2 } = await Promise.resolve().then(() => (init_seed_test_users(), seed_test_users_exports));
    await seedTestUsers2();
    console.log("\u2705 Test users seeding completed successfully");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.log(`\u26A0\uFE0F Test users seeding failed: ${errorMessage}`);
  }
  try {
    console.log("Initializing local file storage...");
    await fs4.mkdir("server/uploads/profiles", { recursive: true });
    await fs4.mkdir("server/uploads/homepage", { recursive: true });
    await fs4.mkdir("server/uploads/gallery", { recursive: true });
    await fs4.mkdir("server/uploads/study-resources", { recursive: true });
    await fs4.mkdir("server/uploads/general", { recursive: true });
    await fs4.mkdir("server/uploads/csv", { recursive: true });
    console.log("\u2705 Local file storage initialized in server/uploads/");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u274C File storage initialization error: ${errorMessage}`);
    if (isProduction3) {
      process.exit(1);
    }
  }
  app.all(["/api/update-demo-users", "/api/test-update"], (req, res) => {
    console.log(`\u{1F6A8} BLOCKED dangerous route: ${req.method} ${req.path}`);
    res.status(410).json({ message: "Gone - Route disabled for security" });
  });
  const server = await registerRoutes(app);
  try {
    console.log("Initializing Socket.IO Realtime Service...");
    const { realtimeService: realtimeService2 } = await Promise.resolve().then(() => (init_realtime_service(), realtime_service_exports));
    realtimeService2.initialize(server);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`\u274C Socket.IO initialization error: ${errorMessage}`);
  }
  app.use((err, req, res, next) => {
    if (err.name === "MulterError" || err.message?.includes("Only image files") || err.message?.includes("Only document files") || err.message?.includes("Only CSV files")) {
      console.log(`MULTER ERROR: ${req.method} ${req.path} - ${err.message}`);
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
    console.log(`ERROR: ${req.method} ${req.path} - ${err.message}`);
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
    console.log(`serving on port ${port}`);
  });
})();
