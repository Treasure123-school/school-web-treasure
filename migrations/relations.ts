import { relations } from "drizzle-orm/relations";
import { roles, users, classes, academicTerms, attendance, students, exams, examResults, announcements, messages, galleryCategories, gallery, contactMessages, questionOptions, studentAnswers, examQuestions, examSessions, homePageContent, subjects } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	role: one(roles, {
		fields: [users.roleId],
		references: [roles.id]
	}),
	classes: many(classes),
	attendances: many(attendance),
	examResults: many(examResults),
	announcements: many(announcements),
	messages_recipientId: many(messages, {
		relationName: "messages_recipientId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	galleries: many(gallery),
	students_id: many(students, {
		relationName: "students_id_users_id"
	}),
	students_parentId: many(students, {
		relationName: "students_parentId_users_id"
	}),
	contactMessages: many(contactMessages),
	examSessions: many(examSessions),
	homePageContents: many(homePageContent),
	exams: many(exams),
}));

export const rolesRelations = relations(roles, ({many}) => ({
	users: many(users),
}));

export const classesRelations = relations(classes, ({one, many}) => ({
	user: one(users, {
		fields: [classes.classTeacherId],
		references: [users.id]
	}),
	academicTerm: one(academicTerms, {
		fields: [classes.currentTermId],
		references: [academicTerms.id]
	}),
	attendances: many(attendance),
	students: many(students),
	exams: many(exams),
}));

export const academicTermsRelations = relations(academicTerms, ({many}) => ({
	classes: many(classes),
	exams: many(exams),
}));

export const attendanceRelations = relations(attendance, ({one}) => ({
	class: one(classes, {
		fields: [attendance.classId],
		references: [classes.id]
	}),
	user: one(users, {
		fields: [attendance.recordedBy],
		references: [users.id]
	}),
	student: one(students, {
		fields: [attendance.studentId],
		references: [students.id]
	}),
}));

export const studentsRelations = relations(students, ({one, many}) => ({
	attendances: many(attendance),
	examResults: many(examResults),
	class: one(classes, {
		fields: [students.classId],
		references: [classes.id]
	}),
	user_id: one(users, {
		fields: [students.id],
		references: [users.id],
		relationName: "students_id_users_id"
	}),
	user_parentId: one(users, {
		fields: [students.parentId],
		references: [users.id],
		relationName: "students_parentId_users_id"
	}),
}));

export const examResultsRelations = relations(examResults, ({one}) => ({
	exam: one(exams, {
		fields: [examResults.examId],
		references: [exams.id]
	}),
	user: one(users, {
		fields: [examResults.recordedBy],
		references: [users.id]
	}),
	student: one(students, {
		fields: [examResults.studentId],
		references: [students.id]
	}),
}));

export const examsRelations = relations(exams, ({one, many}) => ({
	examResults: many(examResults),
	examQuestions: many(examQuestions),
	examSessions: many(examSessions),
	class: one(classes, {
		fields: [exams.classId],
		references: [classes.id]
	}),
	user: one(users, {
		fields: [exams.createdBy],
		references: [users.id]
	}),
	subject: one(subjects, {
		fields: [exams.subjectId],
		references: [subjects.id]
	}),
	academicTerm: one(academicTerms, {
		fields: [exams.termId],
		references: [academicTerms.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	user: one(users, {
		fields: [announcements.authorId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_recipientId: one(users, {
		fields: [messages.recipientId],
		references: [users.id],
		relationName: "messages_recipientId_users_id"
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
}));

export const galleryRelations = relations(gallery, ({one}) => ({
	galleryCategory: one(galleryCategories, {
		fields: [gallery.categoryId],
		references: [galleryCategories.id]
	}),
	user: one(users, {
		fields: [gallery.uploadedBy],
		references: [users.id]
	}),
}));

export const galleryCategoriesRelations = relations(galleryCategories, ({many}) => ({
	galleries: many(gallery),
}));

export const contactMessagesRelations = relations(contactMessages, ({one}) => ({
	user: one(users, {
		fields: [contactMessages.respondedBy],
		references: [users.id]
	}),
}));

export const studentAnswersRelations = relations(studentAnswers, ({one}) => ({
	questionOption: one(questionOptions, {
		fields: [studentAnswers.selectedOptionId],
		references: [questionOptions.id]
	}),
	examQuestion: one(examQuestions, {
		fields: [studentAnswers.questionId],
		references: [examQuestions.id]
	}),
	examSession: one(examSessions, {
		fields: [studentAnswers.sessionId],
		references: [examSessions.id]
	}),
}));

export const questionOptionsRelations = relations(questionOptions, ({one, many}) => ({
	studentAnswers: many(studentAnswers),
	examQuestion: one(examQuestions, {
		fields: [questionOptions.questionId],
		references: [examQuestions.id]
	}),
}));

export const examQuestionsRelations = relations(examQuestions, ({one, many}) => ({
	studentAnswers: many(studentAnswers),
	exam: one(exams, {
		fields: [examQuestions.examId],
		references: [exams.id]
	}),
	questionOptions: many(questionOptions),
}));

export const examSessionsRelations = relations(examSessions, ({one, many}) => ({
	studentAnswers: many(studentAnswers),
	exam: one(exams, {
		fields: [examSessions.examId],
		references: [exams.id]
	}),
	user: one(users, {
		fields: [examSessions.studentId],
		references: [users.id]
	}),
}));

export const homePageContentRelations = relations(homePageContent, ({one}) => ({
	user: one(users, {
		fields: [homePageContent.uploadedBy],
		references: [users.id]
	}),
}));

export const subjectsRelations = relations(subjects, ({many}) => ({
	exams: many(exams),
}));