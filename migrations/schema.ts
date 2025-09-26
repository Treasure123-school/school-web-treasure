import { pgTable, unique, bigserial, varchar, text, timestamp, foreignKey, check, uuid, bigint, date, boolean, integer, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const roles = pgTable("roles", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	permissions: text().array().default([""]),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("roles_name_key").on(table.name),
	unique("roles_name_unique").on(table.name),
]);

export const users = pgTable("users", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	roleId: bigint("role_id", { mode: "number" }).notNull(),
	firstName: varchar("first_name", { length: 100 }).notNull(),
	lastName: varchar("last_name", { length: 100 }).notNull(),
	phone: varchar({ length: 20 }),
	address: text(),
	dateOfBirth: date("date_of_birth"),
	gender: varchar({ length: 10 }),
	profileImageUrl: text("profile_image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.roleId],
			foreignColumns: [roles.id],
			name: "users_role_id_fkey"
		}),
	unique("users_email_key").on(table.email),
	check("users_gender_check", sql`(gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying])::text[])`),
]);

export const classes = pgTable("classes", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	level: varchar({ length: 20 }).notNull(),
	capacity: integer().default(30),
	classTeacherId: uuid("class_teacher_id"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	currentTermId: bigint("current_term_id", { mode: "number" }),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.classTeacherId],
			foreignColumns: [users.id],
			name: "classes_class_teacher_id_fkey"
		}),
	foreignKey({
			columns: [table.currentTermId],
			foreignColumns: [academicTerms.id],
			name: "classes_current_term_id_fkey"
		}),
	unique("classes_name_key").on(table.name),
]);

export const academicTerms = pgTable("academic_terms", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	year: varchar({ length: 9 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	isCurrent: boolean("is_current").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const attendance = pgTable("attendance", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	classId: bigint("class_id", { mode: "number" }).notNull(),
	date: date().notNull(),
	status: varchar({ length: 10 }),
	recordedBy: uuid("recorded_by").notNull(),
	notes: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "attendance_class_id_fkey"
		}),
	foreignKey({
			columns: [table.recordedBy],
			foreignColumns: [users.id],
			name: "attendance_recorded_by_fkey"
		}),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "attendance_student_id_fkey"
		}),
	unique("attendance_student_id_date_key").on(table.studentId, table.date),
	check("attendance_status_check", sql`(status)::text = ANY ((ARRAY['Present'::character varying, 'Absent'::character varying, 'Late'::character varying, 'Excused'::character varying])::text[])`),
]);

export const subjects = pgTable("subjects", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 20 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("subjects_code_key").on(table.code),
]);

export const examResults = pgTable("exam_results", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	examId: bigint("exam_id", { mode: "number" }).notNull(),
	studentId: uuid("student_id").notNull(),
	marksObtained: integer("marks_obtained").notNull(),
	grade: varchar({ length: 5 }),
	remarks: text(),
	recordedBy: uuid("recorded_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "exam_results_exam_id_fkey"
		}),
	foreignKey({
			columns: [table.recordedBy],
			foreignColumns: [users.id],
			name: "exam_results_recorded_by_fkey"
		}),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "exam_results_student_id_fkey"
		}),
	unique("exam_results_exam_id_student_id_key").on(table.examId, table.studentId),
]);

export const announcements = pgTable("announcements", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	authorId: uuid("author_id").notNull(),
	targetRoles: varchar("target_roles", { length: 20 }).array().default(["All"]),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	targetClasses: bigint("target_classes", { mode: "number" }).array().default([]),
	isPublished: boolean("is_published").default(false),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "announcements_author_id_fkey"
		}),
]);

export const messages = pgTable("messages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	senderId: uuid("sender_id").notNull(),
	recipientId: uuid("recipient_id").notNull(),
	subject: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "messages_recipient_id_fkey"
		}),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}),
]);

export const galleryCategories = pgTable("gallery_categories", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const gallery = pgTable("gallery", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	imageUrl: text("image_url").notNull(),
	caption: text(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	categoryId: bigint("category_id", { mode: "number" }),
	uploadedBy: uuid("uploaded_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [galleryCategories.id],
			name: "gallery_category_id_fkey"
		}),
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "gallery_uploaded_by_fkey"
		}),
]);

export const students = pgTable("students", {
	id: uuid().primaryKey().notNull(),
	admissionNumber: varchar("admission_number", { length: 50 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	classId: bigint("class_id", { mode: "number" }),
	parentId: uuid("parent_id"),
	admissionDate: date("admission_date").default(sql`CURRENT_DATE`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	emergencyContact: varchar("emergency_contact", { length: 20 }),
	medicalInfo: text("medical_info"),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "students_class_id_fkey"
		}),
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "students_id_fkey"
		}),
	foreignKey({
			columns: [table.parentId],
			foreignColumns: [users.id],
			name: "students_parent_id_fkey"
		}),
	unique("students_admission_number_key").on(table.admissionNumber),
]);

export const contactMessages = pgTable("contact_messages", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	subject: varchar({ length: 200 }),
	message: text().notNull(),
	isRead: boolean("is_read").default(false),
	respondedAt: timestamp("responded_at", { mode: 'string' }),
	respondedBy: uuid("responded_by"),
	response: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.respondedBy],
			foreignColumns: [users.id],
			name: "contact_messages_responded_by_fkey"
		}),
]);

export const studentAnswers = pgTable("student_answers", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	sessionId: integer("session_id").notNull(),
	questionId: integer("question_id").notNull(),
	selectedOptionId: integer("selected_option_id"),
	textAnswer: text("text_answer"),
	isCorrect: boolean("is_correct").default(false),
	pointsEarned: integer("points_earned").default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	answeredAt: timestamp("answered_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_student_answers_session").using("btree", table.sessionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.selectedOptionId],
			foreignColumns: [questionOptions.id],
			name: "student_answers_option_id_fkey"
		}),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [examQuestions.id],
			name: "student_answers_question_id_fkey"
		}),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [examSessions.id],
			name: "student_answers_session_id_fkey"
		}),
]);

export const examQuestions = pgTable("exam_questions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	examId: integer("exam_id").notNull(),
	questionText: text("question_text").notNull(),
	questionType: varchar("question_type", { length: 50 }).notNull(),
	points: integer().default(1),
	orderNumber: integer("order_number").notNull(),
	imageUrl: text("image_url"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_exam_questions_exam_id").using("btree", table.examId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "exam_questions_exam_id_fkey"
		}),
]);

export const questionOptions = pgTable("question_options", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	questionId: integer("question_id").notNull(),
	optionText: text("option_text").notNull(),
	isCorrect: boolean("is_correct").default(false),
	orderNumber: integer("order_number").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_question_options_question_id").using("btree", table.questionId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.questionId],
			foreignColumns: [examQuestions.id],
			name: "question_options_question_id_fkey"
		}),
]);

export const examSessions = pgTable("exam_sessions", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	examId: integer("exam_id").notNull(),
	studentId: uuid("student_id").notNull(),
	startedAt: timestamp("started_at", { mode: 'string' }).defaultNow(),
	endTime: timestamp("end_time", { mode: 'string' }),
	isCompleted: boolean("is_completed").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	timeRemaining: integer("time_remaining"),
	status: varchar({ length: 20 }).default('in_progress'),
	score: integer(),
	maxScore: integer("max_score"),
}, (table) => [
	index("idx_exam_sessions_exam_student").using("btree", table.examId.asc().nullsLast().op("int4_ops"), table.studentId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.examId],
			foreignColumns: [exams.id],
			name: "exam_sessions_exam_id_fkey"
		}),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [users.id],
			name: "exam_sessions_student_id_fkey"
		}),
]);

export const homePageContent = pgTable("home_page_content", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	contentType: varchar("content_type", { length: 50 }).notNull(),
	imageUrl: text("image_url"),
	altText: text("alt_text"),
	caption: text(),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	uploadedBy: uuid("uploaded_by"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.uploadedBy],
			foreignColumns: [users.id],
			name: "home_page_content_uploaded_by_fkey"
		}),
]);

export const exams = pgTable("exams", {
	id: bigserial({ mode: "bigint" }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	classId: bigint("class_id", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	subjectId: bigint("subject_id", { mode: "number" }).notNull(),
	totalMarks: integer("total_marks").notNull(),
	date: date().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	termId: bigint("term_id", { mode: "number" }).notNull(),
	createdBy: uuid("created_by").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	timeLimit: integer("time_limit"),
	startTime: timestamp("start_time", { mode: 'string' }),
	endTime: timestamp("end_time", { mode: 'string' }),
	instructions: text(),
	isPublished: boolean("is_published").default(false),
	allowRetakes: boolean("allow_retakes").default(false),
	shuffleQuestions: boolean("shuffle_questions").default(false),
	autoGradingEnabled: boolean("auto_grading_enabled").default(true),
	instantFeedback: boolean("instant_feedback").default(false),
	showCorrectAnswers: boolean("show_correct_answers").default(false),
	passingScore: integer("passing_score"),
	gradingScale: text("grading_scale").default('standard'),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "exams_class_id_fkey"
		}),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "exams_created_by_fkey"
		}),
	foreignKey({
			columns: [table.subjectId],
			foreignColumns: [subjects.id],
			name: "exams_subject_id_fkey"
		}),
	foreignKey({
			columns: [table.termId],
			foreignColumns: [academicTerms.id],
			name: "exams_term_id_fkey"
		}),
]);
