import { eq, and, desc, asc, sql, sql as dsql, inArray, isNull } from "drizzle-orm";
import { getDatabase, getSchema, getPgClient, getSqliteConnection, isPostgres, isSqlite } from "./db";
import type {
  User, InsertUser, Student, InsertStudent, Class, InsertClass,
  Subject, InsertSubject, Attendance, InsertAttendance, Exam, InsertExam,
  ExamResult, InsertExamResult, Announcement, InsertAnnouncement,
  Message, InsertMessage, Gallery, InsertGallery, GalleryCategory, InsertGalleryCategory,
  HomePageContent, InsertHomePageContent, ContactMessage, InsertContactMessage,
  Role, AcademicTerm, ExamQuestion, InsertExamQuestion, QuestionOption, InsertQuestionOption,
  ExamSession, InsertExamSession, StudentAnswer, InsertStudentAnswer,
  StudyResource, InsertStudyResource, PerformanceEvent, InsertPerformanceEvent,
  TeacherClassAssignment, InsertTeacherClassAssignment, GradingTask, InsertGradingTask, AuditLog, InsertAuditLog, ReportCard, ReportCardItem,
  Notification, InsertNotification, TeacherProfile,
  QuestionBank, InsertQuestionBank, QuestionBankItem, InsertQuestionBankItem, QuestionBankOption, InsertQuestionBankOption,
  Invite, InsertInvite, InsertAuditLog as InsertAuditLogType, InsertNotification as InsertNotificationType,
  AdminProfile, InsertAdminProfile, ParentProfile, InsertParentProfile, InsertTeacherProfile,
  SuperAdminProfile, InsertSuperAdminProfile, SystemSettings, InsertSystemSettings, Vacancy, InsertVacancy,
  TeacherApplication, InsertTeacherApplication, ApprovedTeacher,
  Timetable, InsertTimetable
} from "@shared/schema";

// Get centralized database instance and schema from db.ts
// Cast to 'any' to allow dynamic switching between SQLite and PostgreSQL schemas
// Both schemas have the same table structure, just different column type definitions
const db: any = getDatabase();
const schema: any = getSchema();

// Re-export for external use
export { db, isPostgres, isSqlite, getPgClient };

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByRole(roleId: number): Promise<User[]>;
  getUsersByStatus(status: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  approveUser(userId: string, approvedBy: string): Promise<User>;
  updateUserStatus(userId: string, status: string, updatedBy: string, reason?: string): Promise<User>;

  // Password reset management
  createPasswordResetToken(userId: string, token: string, expiresAt: Date, ipAddress?: string, resetBy?: string): Promise<any>;
  getPasswordResetToken(token: string): Promise<any | undefined>;
  markPasswordResetTokenAsUsed(token: string): Promise<boolean>;
  deleteExpiredPasswordResetTokens(): Promise<boolean>;

  // Password reset attempt tracking (for rate limiting)
  createPasswordResetAttempt(identifier: string, ipAddress: string, success: boolean): Promise<any>;
  getRecentPasswordResetAttempts(identifier: string, minutesAgo: number): Promise<any[]>;
  deleteOldPasswordResetAttempts(hoursAgo: number): Promise<boolean>;

  // Account security
  lockAccount(userId: string, lockUntil: Date): Promise<boolean>;
  unlockAccount(userId: string): Promise<boolean>;
  isAccountLocked(userId: string): Promise<boolean>;

  // Admin recovery powers
  adminResetUserPassword(userId: string, newPasswordHash: string, resetBy: string, forceChange: boolean): Promise<boolean>;
  updateRecoveryEmail(userId: string, recoveryEmail: string, updatedBy: string): Promise<boolean>;

  // Role management
  getRoles(): Promise<Role[]>;
  getRoleByName(name: string): Promise<Role | undefined>;
  getRole(roleId: number): Promise<Role | undefined>;

  // Invite management
  createInvite(invite: InsertInvite): Promise<Invite>;
  getInviteByToken(token: string): Promise<Invite | undefined>;
  getPendingInviteByEmail(email: string): Promise<Invite | undefined>;
  getAllInvites(): Promise<Invite[]>;
  getPendingInvites(): Promise<Invite[]>;
  markInviteAsAccepted(inviteId: number, acceptedBy: string): Promise<void>;
  deleteInvite(inviteId: number): Promise<boolean>;
  deleteExpiredInvites(): Promise<boolean>;
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;

  // Notification management
  createNotification(notification: InsertNotification): Promise<Notification>;
  getNotificationsByUserId(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: string): Promise<void>;

  // Profile management
  updateUserProfile(userId: string, profileData: Partial<InsertUser>): Promise<User | undefined>;
  getTeacherProfile(userId: string): Promise<TeacherProfile | undefined>;
  getTeacherProfileByStaffId(staffId: string): Promise<TeacherProfile | undefined>;
  getAllTeacherProfiles(): Promise<TeacherProfile[]>;
  createTeacherProfile(profile: InsertTeacherProfile): Promise<TeacherProfile>;
  updateTeacherProfile(userId: string, profile: Partial<InsertTeacherProfile>): Promise<TeacherProfile | undefined>;
  getAdminProfile(userId: string): Promise<AdminProfile | undefined>;
  createAdminProfile(profile: InsertAdminProfile): Promise<AdminProfile>;
  updateAdminProfile(userId: string, profile: Partial<InsertAdminProfile>): Promise<AdminProfile | undefined>;
  getParentProfile(userId: string): Promise<ParentProfile | undefined>;
  createParentProfile(profile: InsertParentProfile): Promise<ParentProfile>;
  updateParentProfile(userId: string, profile: Partial<InsertParentProfile>): Promise<ParentProfile | undefined>;
  calculateProfileCompletion(userId: string, roleId: number): Promise<number>;

  // Student management
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: { userPatch?: Partial<InsertUser>; studentPatch?: Partial<InsertStudent> }): Promise<{ user: User; student: Student } | undefined>;
  setUserActive(id: string, isActive: boolean): Promise<User | undefined>;
  deleteStudent(id: string): Promise<boolean>;
  hardDeleteStudent(id: string): Promise<boolean>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  getAllStudents(includeInactive?: boolean): Promise<Student[]>;
  getStudentByAdmissionNumber(admissionNumber: string): Promise<Student | undefined>;

  // Class management
  getClasses(): Promise<Class[]>;
  getAllClasses(includeInactive?: boolean): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined>;
  deleteClass(id: number): Promise<boolean>;

  // Subject management
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined>;
  deleteSubject(id: number): Promise<boolean>;

  // Academic terms
  getCurrentTerm(): Promise<AcademicTerm | undefined>;
  getTerms(): Promise<AcademicTerm[]>;
  getAcademicTerms(): Promise<AcademicTerm[]>;
  createAcademicTerm(term: any): Promise<AcademicTerm>;
  updateAcademicTerm(id: number, term: any): Promise<AcademicTerm | undefined>;
  deleteAcademicTerm(id: number): Promise<boolean>;
  markTermAsCurrent(id: number): Promise<AcademicTerm | undefined>;

  // Attendance management
  recordAttendance(attendance: InsertAttendance): Promise<Attendance>;
  getAttendanceByStudent(studentId: string, date?: string): Promise<Attendance[]>;
  getAttendanceByClass(classId: number, date: string): Promise<Attendance[]>;

  // Exam management
  createExam(exam: InsertExam): Promise<Exam>;
  getAllExams(): Promise<Exam[]>;
  getExamById(id: number): Promise<Exam | undefined>;
  getExamsByClass(classId: number): Promise<Exam[]>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  recordExamResult(result: InsertExamResult): Promise<ExamResult>;
  updateExamResult(id: number, result: Partial<InsertExamResult>): Promise<ExamResult | undefined>;
  getExamResultsByStudent(studentId: string): Promise<ExamResult[]>;
  getExamResultsByExam(examId: number): Promise<ExamResult[]>;
  getExamResultsByClass(classId: number): Promise<any[]>;
  getExamResultByExamAndStudent(examId: number, studentId: string): Promise<ExamResult | undefined>;

  // Exam questions management
  createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion>;
  createExamQuestionWithOptions(question: InsertExamQuestion, options?: Array<{optionText: string; isCorrect: boolean}>): Promise<ExamQuestion>;
  createExamQuestionsBulk(questionsData: Array<{question: InsertExamQuestion; options?: Array<{optionText: string; isCorrect: boolean}>}>): Promise<{ created: number; questions: ExamQuestion[]; errors: string[] }>;
  getExamQuestions(examId: number): Promise<ExamQuestion[]>;
  getExamQuestionById(id: number): Promise<ExamQuestion | undefined>;
  updateExamQuestion(id: number, question: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined>;
  deleteExamQuestion(id: number): Promise<boolean>;
  getExamQuestionCount(examId: number): Promise<number>;
  getExamQuestionCounts(examIds: number[]): Promise<Record<number, number>>;

  // Question options management
  createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption>;
  getQuestionOptions(questionId: number): Promise<QuestionOption[]>;
  getQuestionOptionsBulk(questionIds: number[]): Promise<QuestionOption[]>;

  // Question Bank management
  createQuestionBank(bank: InsertQuestionBank): Promise<QuestionBank>;
  getAllQuestionBanks(): Promise<QuestionBank[]>;
  getQuestionBankById(id: number): Promise<QuestionBank | undefined>;
  getQuestionBanksBySubject(subjectId: number): Promise<QuestionBank[]>;
  updateQuestionBank(id: number, bank: Partial<InsertQuestionBank>): Promise<QuestionBank | undefined>;
  deleteQuestionBank(id: number): Promise<boolean>;
  
  // Question Bank Items management
  createQuestionBankItem(item: InsertQuestionBankItem, options?: Omit<InsertQuestionBankOption, 'questionItemId'>[]): Promise<QuestionBankItem>;
  getQuestionBankItems(bankId: number, filters?: {questionType?: string; difficulty?: string; tags?: string[]}): Promise<QuestionBankItem[]>;
  getQuestionBankItemById(id: number): Promise<QuestionBankItem | undefined>;
  updateQuestionBankItem(id: number, item: Partial<InsertQuestionBankItem>): Promise<QuestionBankItem | undefined>;
  deleteQuestionBankItem(id: number): Promise<boolean>;
  
  // Question Bank Item Options management
  getQuestionBankItemOptions(questionItemId: number): Promise<QuestionBankOption[]>;
  importQuestionsFromBank(examId: number, questionItemIds: number[], randomize?: boolean, maxQuestions?: number): Promise<{imported: number; questions: ExamQuestion[]}>;

  // Exam sessions management
  createExamSession(session: InsertExamSession): Promise<ExamSession>;
  getExamSessionById(id: number): Promise<ExamSession | undefined>;
  getExamSessionsByExam(examId: number): Promise<ExamSession[]>;
  getExamSessionsByStudent(studentId: string): Promise<ExamSession[]>;
  updateExamSession(id: number, session: Partial<InsertExamSession>): Promise<ExamSession | undefined>;
  deleteExamSession(id: number): Promise<boolean>;
  getActiveExamSession(examId: number, studentId: string): Promise<ExamSession | undefined>;
  getActiveExamSessions(): Promise<ExamSession[]>; // For background cleanup service
  getExpiredExamSessions(now: Date, limit?: number): Promise<ExamSession[]>; // Optimized cleanup query
  createOrGetActiveExamSession(examId: number, studentId: string, sessionData: InsertExamSession): Promise<ExamSession & { wasCreated?: boolean }>; // Idempotent session creation

  // Student answers management
  createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer>;
  getStudentAnswers(sessionId: number): Promise<StudentAnswer[]>;
  getStudentAnswerById(id: number): Promise<StudentAnswer | undefined>;
  getStudentAnswerBySessionAndQuestion(sessionId: number, questionId: number): Promise<StudentAnswer | undefined>;
  updateStudentAnswer(id: number, answer: Partial<InsertStudentAnswer>): Promise<StudentAnswer | undefined>;
  upsertStudentAnswer(sessionId: number, questionId: number, answer: Partial<InsertStudentAnswer>): Promise<StudentAnswer>;
  getQuestionOptionById(optionId: number): Promise<QuestionOption | undefined>;

  // Performance optimization - single query exam scoring
  getExamScoringData(sessionId: number): Promise<{
    session: ExamSession;
    scoringData: Array<{
      questionId: number;
      questionType: string;
      points: number;
      studentSelectedOptionId: number | null;
      correctOptionId: number | null;
      isCorrect: boolean;
      textAnswer: string | null;
    }>;
    summary: {
      totalQuestions: number;
      maxScore: number;
      studentScore: number;
      autoScoredQuestions: number;
    };
  }>;

  // Announcements
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;
  getAnnouncements(targetRole?: string): Promise<Announcement[]>;
  getAnnouncementById(id: number): Promise<Announcement | undefined>;
  updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Messages
  sendMessage(message: InsertMessage): Promise<Message>;
  getMessagesByUser(userId: string): Promise<Message[]>;
  markMessageAsRead(id: number): Promise<void>;

  // Gallery
  createGalleryCategory(category: InsertGalleryCategory): Promise<GalleryCategory>;
  getGalleryCategories(): Promise<GalleryCategory[]>;
  uploadGalleryImage(image: InsertGallery): Promise<Gallery>;
  getGalleryImages(categoryId?: number): Promise<Gallery[]>;
  getGalleryImageById(id: string): Promise<Gallery | undefined>;
  deleteGalleryImage(id: string): Promise<boolean>;

  // Study resources management
  createStudyResource(resource: InsertStudyResource): Promise<StudyResource>;
  getStudyResources(filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
    resourceType?: string;
  }): Promise<StudyResource[]>;
  getStudyResourceById(id: number): Promise<StudyResource | undefined>;
  incrementStudyResourceDownloads(id: number): Promise<void>;
  deleteStudyResource(id: number): Promise<boolean>;

  // Home page content management
  createHomePageContent(content: InsertHomePageContent): Promise<HomePageContent>;
  getHomePageContent(contentType?: string): Promise<HomePageContent[]>;
  getHomePageContentById(id: number): Promise<HomePageContent | undefined>;
  updateHomePageContent(id: number, content: Partial<InsertHomePageContent>): Promise<HomePageContent | undefined>;
  deleteHomePageContent(id: number): Promise<boolean>;

  // Contact messages management
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  getContactMessageById(id: number): Promise<ContactMessage | undefined>;
  markContactMessageAsRead(id: number): Promise<boolean>;
  respondToContactMessage(id: number, response: string, respondedBy: string): Promise<ContactMessage | undefined>;

  // Analytics and Reports
  getAnalyticsOverview(): Promise<any>;
  getPerformanceAnalytics(filters: any): Promise<any>;
  getTrendAnalytics(months: number): Promise<any>;
  getAttendanceAnalytics(filters: any): Promise<any>;

  // Performance monitoring
  logPerformanceEvent(event: InsertPerformanceEvent): Promise<PerformanceEvent>;
  getPerformanceMetrics(hours?: number): Promise<{
    totalEvents: number;
    goalAchievementRate: number;
    averageDuration: number;
    slowSubmissions: number;
    eventsByType: Record<string, number>;
  }>;
  getRecentPerformanceAlerts(hours?: number): Promise<PerformanceEvent[]>;

  // Comprehensive grade management
  recordComprehensiveGrade(gradeData: any): Promise<any>;
  getComprehensiveGradesByStudent(studentId: string, termId?: number): Promise<any[]>;
  getComprehensiveGradesByClass(classId: number, termId?: number): Promise<any[]>;
  createReportCard(reportCardData: any, grades: any[]): Promise<any>;

  // Report card retrieval methods
  getReportCard(id: number): Promise<ReportCard | undefined>;
  getReportCardsByStudentId(studentId: string): Promise<ReportCard[]>;
  getReportCardItems(reportCardId: number): Promise<ReportCardItem[]>;
  getStudentsByParentId(parentId: string): Promise<Student[]>;
  getAcademicTerm(id: number): Promise<AcademicTerm | undefined>;

  // Report finalization methods
  getExamResultById(id: number): Promise<ExamResult | undefined>;
  getFinalizedReportsByExams(examIds: number[], filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
  }): Promise<any[]>;
  getAllFinalizedReports(filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
  }): Promise<any[]>;

  // Teacher class assignments
  createTeacherClassAssignment(assignment: InsertTeacherClassAssignment): Promise<TeacherClassAssignment>;
  getTeacherClassAssignments(teacherId: string): Promise<TeacherClassAssignment[]>;
  getTeachersForClassSubject(classId: number, subjectId: number): Promise<User[]>;
  updateTeacherClassAssignment(id: number, assignment: Partial<InsertTeacherClassAssignment>): Promise<TeacherClassAssignment | undefined>;
  deleteTeacherClassAssignment(id: number): Promise<boolean>;

  // Teacher timetable
  createTimetableEntry(entry: REPLACED_InsertTimetable): Promise<REPLACED_Timetable>;
  getTimetableByTeacher(teacherId: string, termId?: number): Promise<REPLACED_Timetable[]>;
  updateTimetableEntry(id: number, entry: Partial<REPLACED_InsertTimetable>): Promise<REPLACED_Timetable | undefined>;
  deleteTimetableEntry(id: number): Promise<boolean>;

  // Teacher dashboard data
  getTeacherDashboardData(teacherId: string): Promise<{
    profile: REPLACED_TeacherProfile | undefined;
    user: User | undefined;
    assignments: Array<{
      id: number;
      className: string;
      subjectName: string;
      subjectCode: string;
      classLevel: string;
      termName?: string;
    }>;
    timetable: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      className: string;
      subjectName: string;
      location: string | null;
    }>;
  }>;

  // Manual grading task queue
  createGradingTask(task: InsertGradingTask): Promise<GradingTask>;
  assignGradingTask(taskId: number, teacherId: string): Promise<GradingTask | undefined>;
  getGradingTasksByTeacher(teacherId: string, status?: string): Promise<GradingTask[]>;
  getGradingTasksBySession(sessionId: number): Promise<GradingTask[]>;
  updateGradingTaskStatus(taskId: number, status: string, completedAt?: Date): Promise<GradingTask | undefined>;
  completeGradingTask(taskId: number, pointsEarned: number, feedbackText?: string): Promise<{ task: GradingTask; answer: StudentAnswer } | undefined>;
  getAISuggestedGradingTasks(teacherId: string, status?: string): Promise<any[]>;

  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]>;

  // Grading system methods
  getGradingTasks(teacherId: string, status?: string): Promise<any[]>;
  submitManualGrade(gradeData: { taskId: number; score: number; comment: string; graderId: string }): Promise<any>;
  getAllExamSessions(): Promise<any[]>;
  getExamReports(filters: { subjectId?: number; classId?: number }): Promise<any[]>;
  getExamStudentReports(examId: number): Promise<any[]>;
  logPerformanceEvent(event: any): Promise<any>;
  getExpiredExamSessions(cutoffTime: Date, limit: number): Promise<any[]>;
  getScheduledExamsToPublish(now: Date): Promise<Exam[]>; // New method
  updateExam(examId: number, updates: any): Promise<Exam | undefined>; // Updated method

  // Settings management (Module 1)
  getSetting(key: string): Promise<any | undefined>;
  getAllSettings(): Promise<any[]>;
  createSetting(setting: any): Promise<any>;
  updateSetting(key: string, value: string, updatedBy: string): Promise<any | undefined>;
  deleteSetting(key: string): Promise<boolean>;

  // Counters for atomic sequence generation (Module 1)
  getNextSequence(classCode: string, year: string): Promise<number>;
  getCounter(classCode: string, year: string): Promise<any | undefined>;
  resetCounter(classCode: string, year: string): Promise<boolean>;

  // Job Vacancy System
  createVacancy(vacancy: REPLACED_InsertVacancy): Promise<REPLACED_Vacancy>;
  getVacancy(id: string): Promise<REPLACED_Vacancy | undefined>;
  getAllVacancies(status?: string): Promise<REPLACED_Vacancy[]>;
  updateVacancy(id: string, updates: Partial<REPLACED_InsertVacancy>): Promise<REPLACED_Vacancy | undefined>;
  deleteVacancy(id: string): Promise<boolean>;
  
  // Teacher Applications
  createTeacherApplication(application: REPLACED_InsertTeacherApplication): Promise<REPLACED_TeacherApplication>;
  getTeacherApplication(id: string): Promise<REPLACED_TeacherApplication | undefined>;
  getAllTeacherApplications(status?: string): Promise<REPLACED_TeacherApplication[]>;
  updateTeacherApplication(id: string, updates: Partial<REPLACED_TeacherApplication>): Promise<REPLACED_TeacherApplication | undefined>;
  approveTeacherApplication(applicationId: string, approvedBy: string): Promise<{ application: REPLACED_TeacherApplication; approvedTeacher: REPLACED_ApprovedTeacher }>;
  rejectTeacherApplication(applicationId: string, reviewedBy: string, reason: string): Promise<REPLACED_TeacherApplication | undefined>;
  
  // Approved Teachers
  getApprovedTeacherByEmail(email: string): Promise<REPLACED_ApprovedTeacher | undefined>;
  getAllApprovedTeachers(): Promise<REPLACED_ApprovedTeacher[]>;
  deleteApprovedTeacher(id: string): Promise<boolean>;

  // Super Admin methods
  getSuperAdminStats(): Promise<{
    totalAdmins: number;
    totalUsers: number;
    activeSessions: number;
    totalExams: number;
  }>;
  getSystemSettings(): Promise<REPLACED_SystemSettings | undefined>;
  updateSystemSettings(settings: Partial<REPLACED_InsertSystemSettings>): Promise<REPLACED_SystemSettings>;
}
// Helper to normalize UUIDs from various formats
function normalizeUuid(raw: any): string | undefined {
  if (!raw) return undefined;

  // If already a valid UUID string, return as-is
  if (typeof raw === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw)) {
    return raw;
  }
  let bytes: number[] | undefined;

  // Handle comma-separated string of numbers
  if (typeof raw === 'string' && raw.includes(',')) {
    const parts = raw.split(',').map(s => parseInt(s.trim()));
    if (parts.length === 16 && parts.every(n => n >= 0 && n <= 255)) {
      bytes = parts;
    }
  }

  // Handle number array or Uint8Array
  if (Array.isArray(raw) && raw.length === 16) {
    bytes = raw;
  } else if (raw instanceof Uint8Array && raw.length === 16) {
    bytes = Array.from(raw);
  }
  // Convert bytes to UUID format
  if (bytes) {
    const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
  }
  return undefined;
}
export class DatabaseStorage implements IStorage {
  public db: any;

  constructor() {
    // Use the centralized database instance from db.ts
    this.db = db;
    if (!this.db) {
      throw new Error('Database not available - DATABASE_URL not set or invalid');
    }
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    // Only select columns that exist in the current database schema
    const result = await this.db.select({
      id: REPLACED_users.id,
      username: REPLACED_users.username,
      email: REPLACED_users.email,
      recoveryEmail: REPLACED_users.recoveryEmail,
      passwordHash: REPLACED_users.passwordHash,
      roleId: REPLACED_users.roleId,
      firstName: REPLACED_users.firstName,
      lastName: REPLACED_users.lastName,
      phone: REPLACED_users.phone,
      address: REPLACED_users.address,
      dateOfBirth: REPLACED_users.dateOfBirth,
      gender: REPLACED_users.gender,
      nationalId: REPLACED_users.nationalId,
      profileImageUrl: REPLACED_users.profileImageUrl,
      isActive: REPLACED_users.isActive,
      authProvider: REPLACED_users.authProvider,
      googleId: REPLACED_users.googleId,
      status: REPLACED_users.status,
      createdAt: REPLACED_users.createdAt,
      updatedAt: REPLACED_users.updatedAt,
    }).from(REPLACED_users).where(eq(REPLACED_users.id, id)).limit(1);

    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user as User | undefined;
  }
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Only select columns that exist in the current database schema
    const result = await this.db.select({
      id: REPLACED_users.id,
      username: REPLACED_users.username,
      email: REPLACED_users.email,
      recoveryEmail: REPLACED_users.recoveryEmail,
      passwordHash: REPLACED_users.passwordHash,
      roleId: REPLACED_users.roleId,
      firstName: REPLACED_users.firstName,
      lastName: REPLACED_users.lastName,
      phone: REPLACED_users.phone,
      address: REPLACED_users.address,
      dateOfBirth: REPLACED_users.dateOfBirth,
      gender: REPLACED_users.gender,
      nationalId: REPLACED_users.nationalId,
      profileImageUrl: REPLACED_users.profileImageUrl,
      isActive: REPLACED_users.isActive,
      authProvider: REPLACED_users.authProvider,
      googleId: REPLACED_users.googleId,
      status: REPLACED_users.status,
      createdAt: REPLACED_users.createdAt,
      updatedAt: REPLACED_users.updatedAt,
    }).from(REPLACED_users).where(eq(REPLACED_users.email, email)).limit(1);

    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user as User | undefined;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(REPLACED_users).where(eq(REPLACED_users.username, username)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date, ipAddress?: string, resetBy?: string): Promise<any> {
    const result = await this.db.insert(REPLACED_passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      ipAddress,
      resetBy,
    }).returning();
    return result[0];
  }
  async getPasswordResetToken(token: string): Promise<any | undefined> {
    const result = await this.db.select()
      .from(REPLACED_passwordResetTokens)
      .where(and(
        eq(REPLACED_passwordResetTokens.token, token),
        dsql`${REPLACED_passwordResetTokens.expiresAt} > NOW()`,
        dsql`${REPLACED_passwordResetTokens.usedAt} IS NULL`
      ))
      .limit(1);
    return result[0];
  }
  async markPasswordResetTokenAsUsed(token: string): Promise<boolean> {
    const result = await this.db.update(REPLACED_passwordResetTokens)
      .set({ usedAt: dsql`NOW()` })
      .where(eq(REPLACED_passwordResetTokens.token, token))
      .returning();
    return result.length > 0;
  }
  async deleteExpiredPasswordResetTokens(): Promise<boolean> {
    await this.db.delete(REPLACED_passwordResetTokens)
      .where(dsql`${REPLACED_passwordResetTokens.expiresAt} < NOW()`);
    return true;
  }
  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(REPLACED_users).values(user).returning();
    const createdUser = result[0];
    if (createdUser && createdUser.id) {
      const normalizedId = normalizeUuid(createdUser.id);
      if (normalizedId) {
        createdUser.id = normalizedId;
      }
    }
    return createdUser;
  }
  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    try {
      const result = await this.db.update(REPLACED_users).set(user).where(eq(REPLACED_users.id, id)).returning();
      const updatedUser = result[0];
      if (updatedUser && updatedUser.id) {
        const normalizedId = normalizeUuid(updatedUser.id);
        if (normalizedId) {
          updatedUser.id = normalizedId;
        }
      }
      return updatedUser;
    } catch (error: any) {
      // Handle missing column errors by filtering out non-existent fields
      if (error?.cause?.code === '42703') {
        const missingColumn = error?.cause?.message?.match(/column "(\w+)" does not exist/)?.[1];

        // Remove the problematic field and retry
        const { [missingColumn]: removed, ...safeUser } = user as any;

        // If we removed the field, retry the update
        if (Object.keys(safeUser).length > 0) {
          const result = await this.db.update(REPLACED_users).set(safeUser).where(eq(REPLACED_users.id, id)).returning();
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

  async deleteUser(id: string): Promise<boolean> {
    try {
      // CRITICAL FIX: Manual cascade delete due to foreign key constraints
      // We must delete in correct order to avoid constraint violations
      
      
      // 1. Delete teacher profile first (has foreign key to users)
      await this.db.delete(REPLACED_teacherProfiles)
        .where(eq(REPLACED_teacherProfiles.userId, id));
      
      // 2. Delete admin profile
      await this.db.delete(REPLACED_adminProfiles)
        .where(eq(REPLACED_adminProfiles.userId, id));
      
      // 3. Delete parent profile
      await this.db.delete(REPLACED_parentProfiles)
        .where(eq(REPLACED_parentProfiles.userId, id));
      
      // 4. Delete password reset tokens
      await this.db.delete(REPLACED_passwordResetTokens)
        .where(eq(REPLACED_passwordResetTokens.userId, id));
      
      // 5. Delete invites (if user was invited)
      await this.db.delete(REPLACED_invites)
        .where(eq(REPLACED_invites.acceptedBy, id));
      
      // 6. Delete notifications
      await this.db.delete(REPLACED_notifications)
        .where(eq(REPLACED_notifications.userId, id));
      
      // 7. Delete teacher class assignments (if table exists)
      try {
        if (REPLACED_teacherClassAssignments) {
          await this.db.delete(REPLACED_teacherClassAssignments)
            .where(eq(REPLACED_teacherClassAssignments.teacherId, id));
        }
      } catch (assignmentError: any) {
        // Table might not exist yet, skip it
        if (assignmentError?.cause?.code === '42P01') {
        } else {
          throw assignmentError;
        }
      }
      
      // 8. Get exam sessions to cascade delete properly
      const examSessions = await this.db.select({ id: REPLACED_examSessions.id })
        .from(REPLACED_examSessions)
        .where(eq(REPLACED_examSessions.studentId, id));
      
      const sessionIds = examSessions.map((s: { id: number }) => s.id);
      
      if (sessionIds.length > 0) {
        // Delete student answers
        await this.db.delete(REPLACED_studentAnswers)
          .where(inArray(REPLACED_studentAnswers.sessionId, sessionIds));
        
        // Delete exam sessions
        await this.db.delete(REPLACED_examSessions)
          .where(inArray(REPLACED_examSessions.id, sessionIds));
      }
      // 9. Delete exam results
      await this.db.delete(REPLACED_examResults)
        .where(eq(REPLACED_examResults.studentId, id));
      
      // 10. Delete attendance records
      await this.db.delete(REPLACED_attendance)
        .where(eq(REPLACED_attendance.studentId, id));
      
      // 11. Update students who have this user as a parent (set parent_id to null)
      await this.db.update(REPLACED_students)
        .set({ parentId: null })
        .where(eq(REPLACED_students.parentId, id));
      
      // 12. Delete student record if exists
      await this.db.delete(REPLACED_students)
        .where(eq(REPLACED_students.id, id));
      
      // 13. Finally, delete the user
      const result = await this.db.delete(REPLACED_users)
        .where(eq(REPLACED_users.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    const result = await this.db.select({
      id: REPLACED_users.id,
      username: REPLACED_users.username,
      email: REPLACED_users.email,
      passwordHash: REPLACED_users.passwordHash,
      roleId: REPLACED_users.roleId,
      firstName: REPLACED_users.firstName,
      lastName: REPLACED_users.lastName,
      phone: REPLACED_users.phone,
      address: REPLACED_users.address,
      dateOfBirth: REPLACED_users.dateOfBirth,
      gender: REPLACED_users.gender,
      profileImageUrl: REPLACED_users.profileImageUrl,
      isActive: REPLACED_users.isActive,
      authProvider: REPLACED_users.authProvider,
      googleId: REPLACED_users.googleId,
      status: REPLACED_users.status,
      createdAt: REPLACED_users.createdAt,
      updatedAt: REPLACED_users.updatedAt,
    }).from(REPLACED_users).where(eq(REPLACED_users.roleId, roleId));
    return result.map((user: User) => {
      if (user && user.id) {
        const normalizedId = normalizeUuid(user.id);
        if (normalizedId) {
          user.id = normalizedId;
        }
      }
      return user;
    });
  }
  async getUsersByStatus(status: string): Promise<User[]> {
    const result = await this.db.select().from(REPLACED_users).where(sql`${REPLACED_users.status} = ${status}`);
    return result.map((user: User) => {
      if (user && user.id) {
        const normalizedId = normalizeUuid(user.id);
        if (normalizedId) {
          user.id = normalizedId;
        }
      }
      return user;
    });
  }
  async getAllUsers(): Promise<User[]> {
    const result = await this.db.select({
      id: REPLACED_users.id,
      username: REPLACED_users.username,
      email: REPLACED_users.email,
      passwordHash: REPLACED_users.passwordHash,
      roleId: REPLACED_users.roleId,
      firstName: REPLACED_users.firstName,
      lastName: REPLACED_users.lastName,
      phone: REPLACED_users.phone,
      address: REPLACED_users.address,
      dateOfBirth: REPLACED_users.dateOfBirth,
      gender: REPLACED_users.gender,
      profileImageUrl: REPLACED_users.profileImageUrl,
      isActive: REPLACED_users.isActive,
      authProvider: REPLACED_users.authProvider,
      googleId: REPLACED_users.googleId,
      status: REPLACED_users.status,
      createdAt: REPLACED_users.createdAt,
      updatedAt: REPLACED_users.updatedAt,
    }).from(REPLACED_users);
    return result.map((user: User) => {
      if (user && user.id) {
        const normalizedId = normalizeUuid(user.id);
        if (normalizedId) {
          user.id = normalizedId;
        }
      }
      return user;
    });
  }
  async approveUser(userId: string, approvedBy: string): Promise<User> {
    const result = await this.db.update(REPLACED_users)
      .set({
        status: 'active',
        approvedBy,
        approvedAt: new Date()
      })
      .where(eq(REPLACED_users.id, userId))
      .returning();

    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }
  async updateUserStatus(userId: string, status: string, updatedBy: string, reason?: string): Promise<User> {
    // Only set approvedBy/approvedAt for actual approvals (status='active')
    // For other status changes (reject/suspend/disable), only update status
    const updates: any = { status };

    if (status === 'active') {
      updates.approvedBy = updatedBy;
      updates.approvedAt = new Date();
    }
    const result = await this.db.update(REPLACED_users)
      .set(updates)
      .where(eq(REPLACED_users.id, userId))
      .returning();

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
  async getRoles(): Promise<Role[]> {
    return await this.db.select().from(REPLACED_roles);
  }
  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await this.db.select().from(REPLACED_roles).where(eq(REPLACED_roles.name, name)).limit(1);
    return result[0];
  }
  async getRole(roleId: number): Promise<Role | undefined> {
    const result = await this.db.select().from(REPLACED_roles).where(eq(REPLACED_roles.id, roleId)).limit(1);
    return result[0];
  }
  // Invite management
  async createInvite(invite: REPLACED_InsertInvite): Promise<REPLACED_Invite> {
    const result = await this.db.insert(REPLACED_invites).values(invite).returning();
    return result[0];
  }
  async getInviteByToken(token: string): Promise<REPLACED_Invite | undefined> {
    const result = await this.db.select().from(REPLACED_invites)
      .where(and(
        eq(REPLACED_invites.token, token),
        isNull(REPLACED_invites.acceptedAt),
        dsql`${REPLACED_invites.expiresAt} > NOW()`
      ))
      .limit(1);
    return result[0];
  }
  async getPendingInviteByEmail(email: string): Promise<REPLACED_Invite | undefined> {
    const result = await this.db.select().from(REPLACED_invites)
      .where(and(
        eq(REPLACED_invites.email, email),
        isNull(REPLACED_invites.acceptedAt)
      ))
      .limit(1);
    return result[0];
  }
  async getAllInvites(): Promise<REPLACED_Invite[]> {
    return await this.db.select().from(REPLACED_invites)
      .orderBy(desc(REPLACED_invites.createdAt));
  }
  async getPendingInvites(): Promise<REPLACED_Invite[]> {
    return await this.db.select().from(REPLACED_invites)
      .where(isNull(REPLACED_invites.acceptedAt))
      .orderBy(desc(REPLACED_invites.createdAt));
  }
  async markInviteAsAccepted(inviteId: number, acceptedBy: string): Promise<void> {
    await this.db.update(REPLACED_invites)
      .set({ acceptedAt: new Date(), acceptedBy })
      .where(eq(REPLACED_invites.id, inviteId));
  }
  async deleteInvite(inviteId: number): Promise<boolean> {
    const result = await this.db.delete(REPLACED_invites)
      .where(eq(REPLACED_invites.id, inviteId))
      .returning();
    return result.length > 0;
  }
  async deleteExpiredInvites(): Promise<boolean> {
    const result = await this.db.delete(REPLACED_invites)
      .where(and(
        dsql`${REPLACED_invites.expiresAt} < NOW()`,
        isNull(REPLACED_invites.acceptedAt)
      ))
      .returning();
    return result.length > 0;
  }
  // Profile management
  async updateUserProfile(userId: string, profileData: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(REPLACED_users)
      .set({ ...profileData, updatedAt: new Date() })
      .where(eq(REPLACED_users.id, userId))
      .returning();
    return result[0];
  }
  async getTeacherProfile(userId: string): Promise<REPLACED_TeacherProfile | undefined> {
    const [profile] = await db.select().from(REPLACED_teacherProfiles).where(eq(REPLACED_teacherProfiles.userId, userId));
    return profile || null;
  }
  async updateTeacherProfile(userId: string, profile: Partial<REPLACED_InsertTeacherProfile>): Promise<REPLACED_TeacherProfile | undefined> {
    const result = await this.db.update(REPLACED_teacherProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(REPLACED_teacherProfiles.userId, userId))
      .returning();
    return result[0];
  }
  async getTeacherProfileByStaffId(staffId: string): Promise<REPLACED_TeacherProfile | undefined> {
    const [profile] = await db.select().from(REPLACED_teacherProfiles).where(eq(REPLACED_teacherProfiles.staffId, staffId));
    return profile || null;
  }
  async getAllTeacherProfiles(): Promise<REPLACED_TeacherProfile[]> {
    const profiles = await db.select().from(REPLACED_teacherProfiles);
    return profiles;
  }
  async createTeacherProfile(profile: REPLACED_InsertTeacherProfile): Promise<REPLACED_TeacherProfile> {
    const result = await this.db.insert(REPLACED_teacherProfiles)
      .values(profile)
      .returning();
    return result[0];
  }
  async getAdminProfile(userId: string): Promise<REPLACED_AdminProfile | undefined> {
    const result = await this.db.select().from(REPLACED_adminProfiles)
      .where(eq(REPLACED_adminProfiles.userId, userId))
      .limit(1);
    return result[0];
  }
  async createAdminProfile(profile: REPLACED_InsertAdminProfile): Promise<REPLACED_AdminProfile> {
    const result = await this.db.insert(REPLACED_adminProfiles)
      .values(profile)
      .returning();
    return result[0];
  }
  async updateAdminProfile(userId: string, profile: Partial<REPLACED_InsertAdminProfile>): Promise<REPLACED_AdminProfile | undefined> {
    const result = await this.db.update(REPLACED_adminProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(REPLACED_adminProfiles.userId, userId))
      .returning();
    return result[0];
  }
  async getParentProfile(userId: string): Promise<REPLACED_ParentProfile | undefined> {
    const result = await this.db.select().from(REPLACED_parentProfiles)
      .where(eq(REPLACED_parentProfiles.userId, userId))
      .limit(1);
    return result[0];
  }
  async createParentProfile(profile: REPLACED_InsertParentProfile): Promise<REPLACED_ParentProfile> {
    const result = await this.db.insert(REPLACED_parentProfiles)
      .values(profile)
      .returning();
    return result[0];
  }
  async updateParentProfile(userId: string, profile: Partial<REPLACED_InsertParentProfile>): Promise<REPLACED_ParentProfile | undefined> {
    const result = await this.db.update(REPLACED_parentProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(REPLACED_parentProfiles.userId, userId))
      .returning();
    return result[0];
  }
  async calculateProfileCompletion(userId: string, roleId: number): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    const requiredFields = [
      'firstName', 'lastName', 'email', 'phone', 'address',
      'dateOfBirth', 'gender', 'profileImageUrl', 'state', 'country',
      'securityQuestion', 'securityAnswerHash', 'dataPolicyAgreed'
    ];

    let completedFields = 0;
    requiredFields.forEach(field => {
      if (user[field as keyof User]) {
        completedFields++;
      }
    });

    // Check role-specific profile completion
    if (roleId === 1) { // Admin
      const adminProfile = await this.getAdminProfile(userId);
      if (adminProfile?.department) completedFields++;
      if (adminProfile?.roleDescription) completedFields++;
      if (adminProfile?.accessLevel) completedFields++;
    } else if (roleId === 2) { // Teacher
      const teacherProfile = await this.getTeacherProfile(userId);
      if (teacherProfile?.subjects && teacherProfile.subjects.length > 0) completedFields++;
      if (teacherProfile?.assignedClasses && teacherProfile.assignedClasses.length > 0) completedFields++;
      if (teacherProfile?.qualification) completedFields++;
      if (teacherProfile?.yearsOfExperience) completedFields++;
    } else if (roleId === 3) { // Student
      const student = await this.getStudent(userId);
      if (student?.classId) completedFields++;
      if (student?.guardianName) completedFields++;
      if (student?.emergencyContact) completedFields++;
    } else if (roleId === 4) { // Parent
      const parentProfile = await this.getParentProfile(userId);
      if (parentProfile?.occupation) completedFields++;
      if (parentProfile?.contactPreference) completedFields++;
      if (parentProfile?.linkedStudents && parentProfile.linkedStudents.length > 0) completedFields++;
    }
    const totalFields = requiredFields.length + 3; // 3 role-specific fields on average
    return Math.round((completedFields / totalFields) * 100);
  }
  // Student management
  async getStudent(id: string): Promise<Student | undefined> {
    const result = await this.db
      .select({
        // Student fields
        id: REPLACED_students.id,
        admissionNumber: REPLACED_students.admissionNumber,
        classId: REPLACED_students.classId,
        parentId: REPLACED_students.parentId,
        admissionDate: REPLACED_students.admissionDate,
        emergencyContact: REPLACED_students.emergencyContact,
        emergencyPhone: REPLACED_students.emergencyPhone,
        medicalInfo: REPLACED_students.medicalInfo,
        guardianName: REPLACED_students.guardianName,
        createdAt: REPLACED_students.createdAt,
        // User fields (merged into student object)
        firstName: REPLACED_users.firstName,
        lastName: REPLACED_users.lastName,
        email: REPLACED_users.email,
        phone: REPLACED_users.phone,
        address: REPLACED_users.address,
        dateOfBirth: REPLACED_users.dateOfBirth,
        gender: REPLACED_users.gender,
        profileImageUrl: REPLACED_users.profileImageUrl,
        recoveryEmail: REPLACED_users.recoveryEmail,
        // Class name (from classes table)
        className: REPLACED_classes.name,
      })
      .from(REPLACED_students)
      .leftJoin(REPLACED_users, eq(REPLACED_students.id, REPLACED_users.id))
      .leftJoin(REPLACED_classes, eq(REPLACED_students.classId, REPLACED_classes.id))
      .where(eq(REPLACED_students.id, id))
      .limit(1);
    
    const student = result[0];
    if (student && student.id) {
      const normalizedId = normalizeUuid(student.id);
      if (normalizedId) {
        student.id = normalizedId;
      }
    }
    return student as any;
  }
  async getAllUsernames(): Promise<string[]> {
    const result = await this.db.select({ username: REPLACED_users.username }).from(REPLACED_users).where(sql`${REPLACED_users.username} IS NOT NULL`);
    return result.map((r: { username: string | null }) => r.username).filter((u: string | null): u is string => u !== null);
  }
  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(REPLACED_students).values(student).returning();
    return result[0];
  }
  async updateStudent(id: string, updates: { userPatch?: Partial<InsertUser>; studentPatch?: Partial<InsertStudent> }): Promise<{ user: User; student: Student } | undefined> {
    // Use transaction to ensure both user and student are updated atomically
    return await this.db.transaction(async (tx: any) => {
      let updatedUser: User | undefined;
      let updatedStudent: Student | undefined;

      // Update user if userPatch is provided
      if (updates.userPatch && Object.keys(updates.userPatch).length > 0) {
        const userResult = await tx.update(REPLACED_users)
          .set(updates.userPatch)
          .where(eq(REPLACED_users.id, id))
          .returning();
        updatedUser = userResult[0];
      } else {
        // Get current user data if no updates
        const userResult = await tx.select().from(REPLACED_users).where(eq(REPLACED_users.id, id)).limit(1);
        updatedUser = userResult[0];
      }
      // Update student if studentPatch is provided
      if (updates.studentPatch && Object.keys(updates.studentPatch).length > 0) {
        const studentResult = await tx.update(REPLACED_students)
          .set(updates.studentPatch)
          .where(eq(REPLACED_students.id, id))
          .returning();
        updatedStudent = studentResult[0];
      } else {
        // Get current student data if no updates
        const studentResult = await tx.select().from(REPLACED_students).where(eq(REPLACED_students.id, id)).limit(1);
        updatedStudent = studentResult[0];
      }
      if (updatedUser && updatedStudent) {
        return { user: updatedUser, student: updatedStudent };
      }
      return undefined;
    });
  }
  async setUserActive(id: string, isActive: boolean): Promise<User | undefined> {
    const result = await this.db.update(REPLACED_users)
      .set({ isActive })
      .where(eq(REPLACED_users.id, id))
      .returning();
    return result[0];
  }
  async deleteStudent(id: string): Promise<boolean> {
    // Logical deletion by setting user as inactive
    // This preserves referential integrity for attendance, exams, etc.
    const result = await this.db.update(REPLACED_users)
      .set({ isActive: false })
      .where(eq(REPLACED_users.id, id))
      .returning();
    return result.length > 0;
  }
  async hardDeleteStudent(id: string): Promise<boolean> {
    // Hard deletion with proper cascade handling
    // Delete in correct order to respect foreign key constraints
    return await this.db.transaction(async (tx: any) => {
      try {
        // 1. Get all exam sessions for this student
        const examSessions = await tx.select({ id: REPLACED_examSessions.id })
          .from(REPLACED_examSessions)
          .where(eq(REPLACED_examSessions.studentId, id));

        const sessionIds = examSessions.map((session: any) => session.id);

        // 2. Delete student answers for all their exam sessions
        if (sessionIds.length > 0) {
          await tx.delete(REPLACED_studentAnswers)
            .where(inArray(REPLACED_studentAnswers.sessionId, sessionIds));
        }
        // 3. Delete exam sessions for this student
        await tx.delete(REPLACED_examSessions)
          .where(eq(REPLACED_examSessions.studentId, id));

        // 4. Delete exam results for this student
        await tx.delete(REPLACED_examResults)
          .where(eq(REPLACED_examResults.studentId, id));

        // 5. Delete attendance records for this student
        await tx.delete(REPLACED_attendance)
          .where(eq(REPLACED_attendance.studentId, id));

        // 6. Delete the student record
        await tx.delete(REPLACED_students)
          .where(eq(REPLACED_students.id, id));

        // 7. Delete the user record
        const userResult = await tx.delete(REPLACED_users)
          .where(eq(REPLACED_users.id, id))
          .returning();

        return userResult.length > 0;
      } catch (error) {
        throw error;
      }
    });
  }
  async getStudentsByClass(classId: number): Promise<Student[]> {
    // Return all students in class regardless of active status for admin management
    return await db.select().from(REPLACED_students).where(eq(REPLACED_students.classId, classId));
  }
  async getAllStudents(includeInactive = false): Promise<Student[]> {
    if (includeInactive) {
      // Return all students regardless of active status
      return await this.db.select().from(REPLACED_students).orderBy(asc(REPLACED_students.createdAt));
    } else {
      // Only return students with active user accounts
      return await this.db.select({
        id: REPLACED_students.id,
        admissionNumber: REPLACED_students.admissionNumber,
        classId: REPLACED_students.classId,
        parentId: REPLACED_students.parentId,
        admissionDate: REPLACED_students.admissionDate,
        emergencyContact: REPLACED_students.emergencyContact,
        medicalInfo: REPLACED_students.medicalInfo,
        createdAt: REPLACED_students.createdAt,
      })
        .from(REPLACED_students)
        .innerJoin(REPLACED_users, eq(REPLACED_students.id, REPLACED_users.id))
        .where(eq(REPLACED_users.isActive, true))
        .orderBy(asc(REPLACED_students.createdAt));
    }
  }

  async getStudentByAdmissionNumber(admissionNumber: string): Promise<Student | undefined> {
    const result = await db.select().from(REPLACED_students).where(eq(REPLACED_students.admissionNumber, admissionNumber)).limit(1);
    return result[0];
  }
  // Class management
  async getClasses(): Promise<Class[]> {
    return await db.select().from(REPLACED_classes).where(eq(REPLACED_classes.isActive, true)).orderBy(asc(REPLACED_classes.name));
  }
  async getAllClasses(includeInactive = false): Promise<Class[]> {
    if (includeInactive) {
      return await db.select().from(REPLACED_classes).orderBy(asc(REPLACED_classes.name));
    } else {
      return await db.select().from(REPLACED_classes).where(eq(REPLACED_classes.isActive, true)).orderBy(asc(REPLACED_classes.name));
    }
  }

  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(REPLACED_classes).where(eq(REPLACED_classes.id, id)).limit(1);
    return result[0];
  }
  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(REPLACED_classes).values(classData).returning();
    return result[0];
  }
  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const result = await db.update(REPLACED_classes).set(classData).where(eq(REPLACED_classes.id, id)).returning();
    return result[0];
  }
  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(REPLACED_classes).where(eq(REPLACED_classes.id, id));
    return result.length > 0;
  }
  // Subject management
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(REPLACED_subjects).orderBy(asc(REPLACED_subjects.name));
  }
  async getSubject(id: number): Promise<Subject | undefined> {
    const result = await db.select().from(REPLACED_subjects).where(eq(REPLACED_subjects.id, id)).limit(1);
    return result[0];
  }
  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(REPLACED_subjects).values(subject).returning();
    return result[0];
  }
  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const result = await db.update(REPLACED_subjects).set(subject).where(eq(REPLACED_subjects.id, id)).returning();
    return result[0];
  }
  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(REPLACED_subjects).where(eq(REPLACED_subjects.id, id));
    return result.length > 0;
  }
  // Academic terms
  async getCurrentTerm(): Promise<AcademicTerm | undefined> {
    const result = await db.select().from(REPLACED_academicTerms).where(eq(REPLACED_academicTerms.isCurrent, true)).limit(1);
    return result[0];
  }
  async getTerms(): Promise<AcademicTerm[]> {
    return await db.select().from(REPLACED_academicTerms).orderBy(desc(REPLACED_academicTerms.startDate));
  }
  async getAcademicTerms(): Promise<AcademicTerm[]> {
    try {
      const terms = await db.select().from(REPLACED_academicTerms).orderBy(desc(REPLACED_academicTerms.startDate));
      return terms;
    } catch (error) {
      throw error;
    }
  }

  async getAcademicTerm(id: number): Promise<AcademicTerm | undefined> {
    try {
      const result = await db.select().from(REPLACED_academicTerms).where(eq(REPLACED_academicTerms.id, id)).limit(1);
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async createAcademicTerm(term: any): Promise<AcademicTerm> {
    try {
      const result = await db.insert(REPLACED_academicTerms).values(term).returning();
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async updateAcademicTerm(id: number, term: any): Promise<AcademicTerm | undefined> {
    try {
      const result = await db.update(REPLACED_academicTerms).set(term).where(eq(REPLACED_academicTerms.id, id)).returning();
      if (result[0]) {
      }
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  async deleteAcademicTerm(id: number): Promise<boolean> {
    try {
      
      // First check if the term exists
      const existingTerm = await db.select().from(REPLACED_academicTerms)
        .where(eq(REPLACED_academicTerms.id, id))
        .limit(1);
      
      if (!existingTerm || existingTerm.length === 0) {
        return false;
      }
      
      // Check for foreign key constraints - exams using this term
      const examsUsingTerm = await db.select({ id: REPLACED_exams.id })
        .from(REPLACED_exams)
        .where(eq(REPLACED_exams.termId, id));
      
      if (examsUsingTerm && examsUsingTerm.length > 0) {
        throw new Error(`Cannot delete this term. ${examsUsingTerm.length} exam(s) are linked to it. Please reassign or delete those exams first.`);
      }
      // Perform the deletion with returning clause for verification
      const result = await db.delete(REPLACED_academicTerms)
        .where(eq(REPLACED_academicTerms.id, id))
        .returning();
      
      const success = result && result.length > 0;
      
      if (success) {
      } else {
      }
      return success;
    } catch (error: any) {
      
      // Handle specific PostgreSQL errors
      if (error?.code === '23503') {
        throw new Error('Cannot delete this term because it is being used by other records (exams, classes, etc.). Please remove those associations first.');
      }
      throw error;
    }
  }

  async markTermAsCurrent(id: number): Promise<AcademicTerm | undefined> {
    try {
      // First, set all terms to not current
      await db.update(REPLACED_academicTerms).set({ isCurrent: false });
      // Then mark the specified term as current
      const result = await db.update(REPLACED_academicTerms).set({ isCurrent: true }).where(eq(REPLACED_academicTerms.id, id)).returning();
      if (result[0]) {
      }
      return result[0];
    } catch (error) {
      throw error;
    }
  }

  // Helper method to check if a term is being used
  async getExamsByTerm(termId: number): Promise<Exam[]> {
    try {
      const result = await db.select().from(REPLACED_exams).where(eq(REPLACED_exams.termId, termId));
      return result;
    } catch (error) {
      return [];
    }
  }

  // Attendance management
  async recordAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(REPLACED_attendance).values(attendance).returning();
    return result[0];
  }
  async getAttendanceByStudent(studentId: string, date?: string): Promise<Attendance[]> {
    if (date) {
      return await db.select().from(REPLACED_attendance)
        .where(and(eq(REPLACED_attendance.studentId, studentId), eq(REPLACED_attendance.date, date)));
    }
    return await db.select().from(REPLACED_attendance)
      .where(eq(REPLACED_attendance.studentId, studentId))
      .orderBy(desc(REPLACED_attendance.date));
  }
  async getAttendanceByClass(classId: number, date: string): Promise<Attendance[]> {
    return await db.select().from(REPLACED_attendance)
      .where(and(eq(REPLACED_attendance.classId, classId), eq(REPLACED_attendance.date, date)));
  }
  // Exam management
  async createExam(exam: InsertExam): Promise<Exam> {
    const result = await db.insert(REPLACED_exams).values(exam).returning();
    return result[0];
  }
  async getAllExams(): Promise<Exam[]> {
    try {
      const result = await db.select().from(REPLACED_exams)
        .orderBy(desc(REPLACED_exams.date));
      return result || [];
    } catch (error) {
      return [];
    }
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const result = await db.select().from(REPLACED_exams)
      .where(eq(REPLACED_exams.id, id))
      .limit(1);
    return result[0];
  }
  async getExamsByClass(classId: number): Promise<Exam[]> {
    try {
      const result = await db.select().from(REPLACED_exams)
        .where(eq(REPLACED_exams.classId, classId))
        .orderBy(desc(REPLACED_exams.date));
      return result || [];
    } catch (error) {
      return [];
    }
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const result = await db.update(REPLACED_exams)
      .set(exam)
      .where(eq(REPLACED_exams.id, id))
      .returning();
    return result[0];
  }
  async deleteExam(id: number): Promise<boolean> {
    try {
      // First delete student answers (references exam questions)
      await db.delete(REPLACED_studentAnswers)
        .where(sql`${REPLACED_studentAnswers.questionId} IN (SELECT id FROM ${REPLACED_examQuestions} WHERE exam_id = ${id})`);

      // Delete question options (references exam questions)
      await db.delete(REPLACED_questionOptions)
        .where(sql`${REPLACED_questionOptions.questionId} IN (SELECT id FROM ${REPLACED_examQuestions} WHERE exam_id = ${id})`);

      // Delete exam questions (now safe to delete)
      await db.delete(REPLACED_examQuestions)
        .where(eq(REPLACED_examQuestions.examId, id));

      // Delete exam results
      await db.delete(REPLACED_examResults)
        .where(eq(REPLACED_examResults.examId, id));

      // Delete exam sessions
      await db.delete(REPLACED_examSessions)
        .where(eq(REPLACED_examSessions.examId, id));

      // Finally delete the exam itself
      const result = await db.delete(REPLACED_exams)
        .where(eq(REPLACED_exams.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  async recordExamResult(result: InsertExamResult): Promise<ExamResult> {
    try {
      const examResult = await db.insert(REPLACED_examResults).values(result).returning();
      return examResult[0];
    } catch (error: any) {
      // Handle missing columns by removing autoScored from the insert
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('auto_scored')) {
        const { autoScored, ...resultWithoutAutoScored } = result;
        // Map score to marksObtained for compatibility with existing schema
        const compatibleResult = {
          ...resultWithoutAutoScored,
          marksObtained: result.score || 0
        };
        const examResult = await db.insert(REPLACED_examResults).values(compatibleResult).returning();
        return {
          ...examResult[0],
          autoScored: result.recordedBy === '00000000-0000-0000-0000-000000000001',
          score: examResult[0].marksObtained || 0
        } as ExamResult;
      }
      throw error;
    }
  }

  async updateExamResult(id: number, result: Partial<InsertExamResult>): Promise<ExamResult | undefined> {
    try {
      const updated = await db.update(REPLACED_examResults)
        .set(result)
        .where(eq(REPLACED_examResults.id, id))
        .returning();
      return updated[0];
    } catch (error: any) {
      // Handle missing columns by removing autoScored from the update
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('auto_scored')) {
        const { autoScored, ...resultWithoutAutoScored } = result;
        // Map score to marksObtained for compatibility with existing schema
        const compatibleResult = {
          ...resultWithoutAutoScored,
          marksObtained: result.score || 0
        };
        const updated = await db.update(REPLACED_examResults)
          .set(compatibleResult)
          .where(eq(REPLACED_examResults.id, id))
          .returning();
        return {
          ...updated[0],
          autoScored: result.recordedBy === '00000000-0000-0000-0000-000000000001',
          score: updated[0].marksObtained || 0
        } as ExamResult;
      }
      throw error;
    }
  }

  async getExamResultsByStudent(studentId: string): Promise<ExamResult[]> {
    try {

      const SYSTEM_AUTO_SCORING_UUID = '00000000-0000-0000-0000-000000000001';

      // Try main query first
      try {
        const results = await this.db.select({
          id: REPLACED_examResults.id,
          examId: REPLACED_examResults.examId,
          studentId: REPLACED_examResults.studentId,
          score: REPLACED_examResults.marksObtained,
          maxScore: REPLACED_exams.totalMarks,
          marksObtained: REPLACED_examResults.marksObtained,
          grade: REPLACED_examResults.grade,
          remarks: REPLACED_examResults.remarks,
          recordedBy: REPLACED_examResults.recordedBy,
          createdAt: REPLACED_examResults.createdAt,
          autoScored: sql<boolean>`COALESCE(${REPLACED_examResults.autoScored}, ${REPLACED_examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as('autoScored')
        }).from(REPLACED_examResults)
          .leftJoin(REPLACED_exams, eq(REPLACED_examResults.examId, REPLACED_exams.id))
          .where(eq(REPLACED_examResults.studentId, studentId))
          .orderBy(desc(REPLACED_examResults.createdAt));

        return results;
      } catch (mainError: any) {

        // Fallback query without autoScored column reference
        const fallbackResults = await this.db.select({
          id: REPLACED_examResults.id,
          examId: REPLACED_examResults.examId,
          studentId: REPLACED_examResults.studentId,
          marksObtained: REPLACED_examResults.marksObtained,
          grade: REPLACED_examResults.grade,
          remarks: REPLACED_examResults.remarks,
          recordedBy: REPLACED_examResults.recordedBy,
          createdAt: REPLACED_examResults.createdAt,
          score: REPLACED_examResults.marksObtained,
          maxScore: sql<number>`100`.as('maxScore'), // Default to 100 if join fails
          autoScored: sql<boolean>`(${REPLACED_examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as('autoScored')
        }).from(REPLACED_examResults)
          .where(eq(REPLACED_examResults.studentId, studentId))
          .orderBy(desc(REPLACED_examResults.createdAt));

        // Try to get exam details separately for maxScore
        for (const result of fallbackResults) {
          try {
            const exam = await this.db.select({ totalMarks: REPLACED_exams.totalMarks })
              .from(REPLACED_exams)
              .where(eq(REPLACED_exams.id, result.examId))
              .limit(1);
            if (exam[0]?.totalMarks) {
              result.maxScore = exam[0].totalMarks;
            }
          } catch (examError) {
          }
        }

        return fallbackResults;
      }
    } catch (error: any) {
      return [];
    }
  }

  async getExamResultsByExam(examId: number): Promise<ExamResult[]> {
    try {
      return await db.select().from(REPLACED_examResults)
        .where(eq(REPLACED_examResults.examId, examId))
        .orderBy(desc(REPLACED_examResults.createdAt));
    } catch (error: any) {
      // Handle missing columns by selecting only the columns that exist
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('column') && error?.cause?.message?.includes('does not exist')) {
        try {
          return await db.select({
            id: REPLACED_examResults.id,
            examId: REPLACED_examResults.examId,
            studentId: REPLACED_examResults.studentId,
            marksObtained: REPLACED_examResults.marksObtained, // Use legacy field
            grade: REPLACED_examResults.grade,
            remarks: REPLACED_examResults.remarks,
            recordedBy: REPLACED_examResults.recordedBy,
            createdAt: REPLACED_examResults.createdAt,
            // Map marksObtained to score for compatibility
            score: REPLACED_examResults.marksObtained,
            maxScore: dsql`null`.as('maxScore'),
            // Since auto_scored column doesn't exist, determine from recordedBy
            autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as('autoScored')
          }).from(REPLACED_examResults)
            .where(eq(REPLACED_examResults.examId, examId))
            .orderBy(desc(REPLACED_examResults.createdAt));
        } catch (fallbackError) {
          return [];
        }
      }
      throw error;
    }
  }

  async getExamResultByExamAndStudent(examId: number, studentId: string): Promise<ExamResult | undefined> {
    const result = await db.select().from(REPLACED_examResults)
      .where(
        sql`${REPLACED_examResults.examId} = ${examId} AND ${REPLACED_examResults.studentId} = ${studentId}`
      )
      .limit(1);
    return result[0];
  }
  async getExamResultsByClass(classId: number): Promise<any[]> {
    try {
      // Join all needed tables to get complete data
      const results = await db.select({
        id: REPLACED_examResults.id,
        examId: REPLACED_examResults.examId,
        studentId: REPLACED_examResults.studentId,
        score: REPLACED_examResults.score,
        maxScore: REPLACED_examResults.maxScore,
        marksObtained: REPLACED_examResults.marksObtained,
        grade: REPLACED_examResults.grade,
        remarks: REPLACED_examResults.remarks,
        recordedBy: REPLACED_examResults.recordedBy,
        autoScored: REPLACED_examResults.autoScored,
        createdAt: REPLACED_examResults.createdAt,
        examName: REPLACED_exams.name,
        examType: REPLACED_exams.examType,
        examDate: REPLACED_exams.date,
        totalMarks: REPLACED_exams.totalMarks,
        admissionNumber: REPLACED_students.admissionNumber,
        studentName: sql<string>`${REPLACED_users.firstName} || ' ' || ${REPLACED_users.lastName}`.as('studentName'),
        className: REPLACED_classes.name,
        subjectName: REPLACED_subjects.name,
      })
        .from(REPLACED_examResults)
        .innerJoin(REPLACED_exams, eq(REPLACED_examResults.examId, REPLACED_exams.id))
        .innerJoin(REPLACED_students, eq(REPLACED_examResults.studentId, REPLACED_students.id))
        .innerJoin(REPLACED_users, eq(REPLACED_students.id, REPLACED_users.id))
        .leftJoin(REPLACED_classes, eq(REPLACED_exams.classId, REPLACED_classes.id))
        .leftJoin(REPLACED_subjects, eq(REPLACED_exams.subjectId, REPLACED_subjects.id))
        .where(eq(REPLACED_exams.classId, classId))
        .orderBy(desc(REPLACED_examResults.createdAt));

      // Results already contain all needed data from joins
      return results;
    } catch (error: any) {

      // Handle missing columns by using a fallback query
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('column') && error?.cause?.message?.includes('does not exist')) {
        try {
          // Fallback query using only existing columns
          const results = await db.select({
            id: REPLACED_examResults.id,
            examId: REPLACED_examResults.examId,
            studentId: REPLACED_examResults.studentId,
            marksObtained: REPLACED_examResults.marksObtained,
            grade: REPLACED_examResults.grade,
            remarks: REPLACED_examResults.remarks,
            recordedBy: REPLACED_examResults.recordedBy,
            createdAt: REPLACED_examResults.createdAt,
            // Map marksObtained to score for compatibility
            score: REPLACED_examResults.marksObtained,
            maxScore: dsql`null`.as('maxScore'),
            // Infer autoScored based on recordedBy
            autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as('autoScored')
          })
            .from(REPLACED_examResults)
            .innerJoin(REPLACED_exams, eq(REPLACED_examResults.examId, REPLACED_exams.id))
            .where(eq(REPLACED_exams.classId, classId))
            .orderBy(desc(REPLACED_examResults.createdAt));

          // Return fallback results as-is
          return results;
        } catch (fallbackError) {
          return [];
        }
      }
      throw error;
    }
  }


  // Exam questions management
  async createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion> {
    // Use all available columns from the schema
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
      hintText: question.hintText,
    };
    const result = await db.insert(REPLACED_examQuestions).values(questionData).returning();
    return result[0];
  }
  async createExamQuestionWithOptions(
    question: InsertExamQuestion,
    options?: Array<{optionText: string; isCorrect: boolean}>
  ): Promise<ExamQuestion> {
    // Use a transaction to ensure atomicity and reduce connection pressure
    return await db.transaction(async (tx: any) => {
      try {
        // Use all available columns from the schema
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
          hintText: question.hintText,
        };
        // Insert question first
        const questionResult = await tx.insert(REPLACED_examQuestions).values(questionData).returning();
        const createdQuestion = questionResult[0];

        // Insert options if provided
        if (Array.isArray(options) && options.length > 0) {
          const optionsToInsert = options.map((option, index) => ({
            questionId: createdQuestion.id,
            optionText: option.optionText,
            orderNumber: index + 1,
            isCorrect: option.isCorrect
          }));

          // Batch insert options in smaller chunks to avoid circuit breaker issues
          const BATCH_SIZE = 5;
          for (let i = 0; i < optionsToInsert.length; i += BATCH_SIZE) {
            const batch = optionsToInsert.slice(i, i + BATCH_SIZE);

            // Insert batch individually to work around Neon limitations while reducing round trips
            for (const optionData of batch) {
              await tx.insert(REPLACED_questionOptions).values(optionData);
            }
          }
        }
        return createdQuestion;
      } catch (error) {
        // Transaction will automatically rollback, no manual cleanup needed
        throw new Error(`Failed to create question with options: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });
  }
  async createExamQuestionsBulk(
    questionsData: Array<{
      question: InsertExamQuestion;
      options?: Array<{optionText: string; isCorrect: boolean}>;
    }>
  ): Promise<{ created: number; questions: ExamQuestion[]; errors: string[] }> {
    const createdQuestions: ExamQuestion[] = [];
    const errors: string[] = [];


    // SEQUENTIAL processing to prevent circuit breaker - NO parallel requests
    for (let i = 0; i < questionsData.length; i++) {
      const { question, options } = questionsData[i];

      try {

        const createdQuestion = await this.createExamQuestionWithOptions(question, options);
        createdQuestions.push(createdQuestion);


        // Throttling delay between EACH question to prevent circuit breaker
        if (i < questionsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay between questions
        }
      } catch (error) {
        const errorMsg = `Question ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);

        // Check if this is a circuit breaker error and implement backoff
        if (error instanceof Error && (
          error.message.includes('circuit') ||
          error.message.includes('breaker') ||
          error.message.includes('pool') ||
          error.message.includes('connection')
        )) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second backoff on connection issues
        } else {
          // Normal error delay
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    return {
      created: createdQuestions.length,
      questions: createdQuestions,
      errors
    };
  }
  async getExamQuestions(examId: number): Promise<ExamQuestion[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
      id: REPLACED_examQuestions.id,
      examId: REPLACED_examQuestions.examId,
      questionText: REPLACED_examQuestions.questionText,
      questionType: REPLACED_examQuestions.questionType,
      points: REPLACED_examQuestions.points,
      orderNumber: REPLACED_examQuestions.orderNumber,
      imageUrl: REPLACED_examQuestions.imageUrl,
      createdAt: REPLACED_examQuestions.createdAt,
    }).from(REPLACED_examQuestions)
      .where(eq(REPLACED_examQuestions.examId, examId))
      .orderBy(asc(REPLACED_examQuestions.orderNumber));
  }
  async getExamQuestionById(id: number): Promise<ExamQuestion | undefined> {
    const result = await db.select({
      id: REPLACED_examQuestions.id,
      examId: REPLACED_examQuestions.examId,
      questionText: REPLACED_examQuestions.questionText,
      questionType: REPLACED_examQuestions.questionType,
      points: REPLACED_examQuestions.points,
      orderNumber: REPLACED_examQuestions.orderNumber,
      imageUrl: REPLACED_examQuestions.imageUrl,
      createdAt: REPLACED_examQuestions.createdAt,
    }).from(REPLACED_examQuestions)
      .where(eq(REPLACED_examQuestions.id, id))
      .limit(1);
    return result[0];
  }
  async getExamQuestionCount(examId: number): Promise<number> {
    const result = await db.select({ count: dsql`count(*)` }).from(REPLACED_examQuestions)
      .where(eq(REPLACED_examQuestions.examId, examId));
    return Number(result[0]?.count || 0);
  }
  // Get question counts for multiple exams
  async getExamQuestionCounts(examIds: number[]): Promise<Record<number, number>> {
    const counts: Record<number, number> = {};

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
  async updateExamQuestion(id: number, question: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined> {
    const result = await db.update(REPLACED_examQuestions)
      .set(question)
      .where(eq(REPLACED_examQuestions.id, id))
      .returning();
    return result[0];
  }
  async deleteExamQuestion(id: number): Promise<boolean> {
    try {
      // First delete question options
      await db.delete(REPLACED_questionOptions)
        .where(eq(REPLACED_questionOptions.questionId, id));

      // Delete student answers for this question
      await db.delete(REPLACED_studentAnswers)
        .where(eq(REPLACED_studentAnswers.questionId, id));

      // Finally delete the question itself
      const result = await db.delete(REPLACED_examQuestions)
        .where(eq(REPLACED_examQuestions.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Question options management
  async createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption> {
    const result = await db.insert(REPLACED_questionOptions).values(option).returning();
    return result[0];
  }
  async getQuestionOptions(questionId: number): Promise<QuestionOption[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
      id: REPLACED_questionOptions.id,
      questionId: REPLACED_questionOptions.questionId,
      optionText: REPLACED_questionOptions.optionText,
      isCorrect: REPLACED_questionOptions.isCorrect,
      orderNumber: REPLACED_questionOptions.orderNumber,
      createdAt: REPLACED_questionOptions.createdAt,
    }).from(REPLACED_questionOptions)
      .where(eq(REPLACED_questionOptions.questionId, questionId))
      .orderBy(asc(REPLACED_questionOptions.orderNumber));
  }
  // PERFORMANCE: Bulk fetch question options to eliminate N+1 queries
  async getQuestionOptionsBulk(questionIds: number[]): Promise<QuestionOption[]> {
    if (questionIds.length === 0) {
      return [];
    }
    // Use inArray for efficient bulk query
    return await db.select({
      id: REPLACED_questionOptions.id,
      questionId: REPLACED_questionOptions.questionId,
      optionText: REPLACED_questionOptions.optionText,
      isCorrect: REPLACED_questionOptions.isCorrect,
      orderNumber: REPLACED_questionOptions.orderNumber,
      createdAt: REPLACED_questionOptions.createdAt,
    }).from(REPLACED_questionOptions)
      .where(inArray(REPLACED_questionOptions.questionId, questionIds))
      .orderBy(asc(REPLACED_questionOptions.questionId), asc(REPLACED_questionOptions.orderNumber));
  }
  // Question Bank management
  async createQuestionBank(bank: InsertQuestionBank): Promise<QuestionBank> {
    const result = await db.insert(REPLACED_questionBanks).values(bank).returning();
    return result[0];
  }
  async getAllQuestionBanks(): Promise<QuestionBank[]> {
    return await db.select().from(REPLACED_questionBanks).orderBy(desc(REPLACED_questionBanks.createdAt));
  }
  async getQuestionBankById(id: number): Promise<QuestionBank | undefined> {
    const result = await db.select().from(REPLACED_questionBanks).where(eq(REPLACED_questionBanks.id, id));
    return result[0];
  }
  async getQuestionBanksBySubject(subjectId: number): Promise<QuestionBank[]> {
    return await db.select().from(REPLACED_questionBanks)
      .where(eq(REPLACED_questionBanks.subjectId, subjectId))
      .orderBy(desc(REPLACED_questionBanks.createdAt));
  }
  async updateQuestionBank(id: number, bank: Partial<InsertQuestionBank>): Promise<QuestionBank | undefined> {
    const result = await db.update(REPLACED_questionBanks)
      .set({ ...bank, updatedAt: new Date() })
      .where(eq(REPLACED_questionBanks.id, id))
      .returning();
    return result[0];
  }
  async deleteQuestionBank(id: number): Promise<boolean> {
    await db.delete(REPLACED_questionBanks).where(eq(REPLACED_questionBanks.id, id));
    return true;
  }
  // Question Bank Items management
  async createQuestionBankItem(item: InsertQuestionBankItem, options?: Omit<InsertQuestionBankOption, 'questionItemId'>[]): Promise<QuestionBankItem> {
    const result = await db.insert(REPLACED_questionBankItems).values(item).returning();
    const questionItem = result[0];

    if (options && options.length > 0) {
      const optionValues = options.map((option) => ({
        questionItemId: questionItem.id,
        ...option
      }));
      await db.insert(REPLACED_questionBankOptions).values(optionValues);
    }
    return questionItem;
  }
  async getQuestionBankItems(bankId: number, filters?: {questionType?: string; difficulty?: string; tags?: string[]}): Promise<QuestionBankItem[]> {
    let query = db.select().from(REPLACED_questionBankItems).where(eq(REPLACED_questionBankItems.bankId, bankId));
    
    if (filters?.questionType) {
      query = query.where(eq(REPLACED_questionBankItems.questionType, filters.questionType));
    }
    if (filters?.difficulty) {
      query = query.where(eq(REPLACED_questionBankItems.difficulty, filters.difficulty));
    }
    return await query.orderBy(desc(REPLACED_questionBankItems.createdAt));
  }
  async getQuestionBankItemById(id: number): Promise<QuestionBankItem | undefined> {
    const result = await db.select().from(REPLACED_questionBankItems).where(eq(REPLACED_questionBankItems.id, id));
    return result[0];
  }
  async updateQuestionBankItem(id: number, item: Partial<InsertQuestionBankItem>): Promise<QuestionBankItem | undefined> {
    const result = await db.update(REPLACED_questionBankItems)
      .set({ ...item, updatedAt: new Date() })
      .where(eq(REPLACED_questionBankItems.id, id))
      .returning();
    return result[0];
  }
  async deleteQuestionBankItem(id: number): Promise<boolean> {
    await db.delete(REPLACED_questionBankItems).where(eq(REPLACED_questionBankItems.id, id));
    return true;
  }
  async getQuestionBankItemOptions(questionItemId: number): Promise<QuestionBankOption[]> {
    return await db.select().from(REPLACED_questionBankOptions)
      .where(eq(REPLACED_questionBankOptions.questionItemId, questionItemId))
      .orderBy(asc(REPLACED_questionBankOptions.orderNumber));
  }
  async importQuestionsFromBank(examId: number, questionItemIds: number[], randomize: boolean = false, maxQuestions?: number): Promise<{imported: number; questions: ExamQuestion[]}> {
    let selectedItemIds = [...questionItemIds];
    
    if (randomize && maxQuestions && maxQuestions < questionItemIds.length) {
      selectedItemIds = questionItemIds.sort(() => Math.random() - 0.5).slice(0, maxQuestions);
    }
    const questions: ExamQuestion[] = [];
    const existingQuestionsCount = await this.getExamQuestionCount(examId);
    let orderNumber = existingQuestionsCount + 1;

    for (const itemId of selectedItemIds) {
      const bankItem = await this.getQuestionBankItemById(itemId);
      if (!bankItem) continue;

      // Validate questionType to ensure data integrity
      const validTypes: Array<"multiple_choice" | "text" | "essay" | "true_false" | "fill_blank"> = 
        ["multiple_choice", "text", "essay", "true_false", "fill_blank"];
      const questionType = validTypes.includes(bankItem.questionType as any) 
        ? bankItem.questionType as "multiple_choice" | "text" | "essay" | "true_false" | "fill_blank"
        : "text"; // Default to text if invalid

      const questionData: InsertExamQuestion = {
        examId,
        questionText: bankItem.questionText,
        questionType,
        points: bankItem.points || 1,
        orderNumber: orderNumber++,
        imageUrl: bankItem.imageUrl ?? undefined,
        autoGradable: bankItem.autoGradable,
        expectedAnswers: bankItem.expectedAnswers ?? undefined,
        caseSensitive: bankItem.caseSensitive ?? undefined,
        explanationText: bankItem.explanationText ?? undefined,
        hintText: bankItem.hintText ?? undefined
      };

      const question = await this.createExamQuestion(questionData);
      questions.push(question);

      if (bankItem.questionType === 'multiple_choice') {
        const bankOptions = await this.getQuestionBankItemOptions(itemId);
        for (const bankOption of bankOptions) {
          await this.createQuestionOption({
            questionId: question.id,
            optionText: bankOption.optionText,
            isCorrect: bankOption.isCorrect,
            orderNumber: bankOption.orderNumber,
            partialCreditValue: 0,
            explanationText: bankOption.explanationText ?? undefined
          });
        }
      }
    }
    return { imported: questions.length, questions };
  }
  // Get AI-suggested grading tasks for teacher review
  async getAISuggestedGradingTasks(teacherId: string, status?: string): Promise<any[]> {
    try {
      // Get teacher's assigned classes and subjects
      const assignments = await this.db.select()
        .from(REPLACED_teacherClassAssignments)
        .where(and(
          eq(REPLACED_teacherClassAssignments.teacherId, teacherId),
          eq(REPLACED_teacherClassAssignments.isActive, true)
        ));

      if (assignments.length === 0) {
        return [];
      }
      const classIds = assignments.map((a: any) => a.classId);
      const subjectIds = assignments.map((a: any) => a.subjectId);

      // Get exams for these classes/subjects
      const exams = await this.db.select()
        .from(REPLACED_exams)
        .where(and(
          inArray(REPLACED_exams.classId, classIds),
          inArray(REPLACED_exams.subjectId, subjectIds)
        ));

      const examIds = exams.map((e: any) => e.id);
      if (examIds.length === 0) {
        return [];
      }
      // Get sessions for these exams
      const sessions = await this.db.select()
        .from(REPLACED_examSessions)
        .where(and(
          inArray(REPLACED_examSessions.examId, examIds),
          eq(REPLACED_examSessions.isCompleted, true)
        ));

      const sessionIds = sessions.map((s: any) => s.id);
      if (sessionIds.length === 0) {
        return [];
      }
      // Get student answers that are AI-suggested (not auto-scored, has points)
      let query = this.db.select({
        id: REPLACED_studentAnswers.id,
        sessionId: REPLACED_studentAnswers.sessionId,
        questionId: REPLACED_studentAnswers.questionId,
        textAnswer: REPLACED_studentAnswers.textAnswer,
        pointsEarned: REPLACED_studentAnswers.pointsEarned,
        feedbackText: REPLACED_studentAnswers.feedbackText,
        autoScored: REPLACED_studentAnswers.autoScored,
        manualOverride: REPLACED_studentAnswers.manualOverride,
        answeredAt: REPLACED_studentAnswers.answeredAt,
        questionText: REPLACED_examQuestions.questionText,
        questionType: REPLACED_examQuestions.questionType,
        points: REPLACED_examQuestions.points,
        expectedAnswers: REPLACED_examQuestions.expectedAnswers,
        studentId: REPLACED_examSessions.studentId,
        examId: REPLACED_examSessions.examId,
        examName: REPLACED_exams.name
      })
        .from(REPLACED_studentAnswers)
        .innerJoin(REPLACED_examQuestions, eq(REPLACED_studentAnswers.questionId, REPLACED_examQuestions.id))
        .innerJoin(REPLACED_examSessions, eq(REPLACED_studentAnswers.sessionId, REPLACED_examSessions.id))
        .innerJoin(REPLACED_exams, eq(REPLACED_examSessions.examId, REPLACED_exams.id))
        .where(and(
          inArray(REPLACED_studentAnswers.sessionId, sessionIds),
          sql`(${REPLACED_examQuestions.questionType} = 'text' OR ${REPLACED_examQuestions.questionType} = 'essay')`,
          sql`${REPLACED_studentAnswers.textAnswer} IS NOT NULL`
        ));

      // Filter by status if provided
      if (status === 'pending') {
        query = query.where(sql`${REPLACED_studentAnswers.autoScored} = false AND ${REPLACED_studentAnswers.manualOverride} = false`);
      } else if (status === 'reviewed') {
        query = query.where(sql`(${REPLACED_studentAnswers.autoScored} = true OR ${REPLACED_studentAnswers.manualOverride} = true)`);
      }
      const results = await query;

      // Get student names
      const studentIds = Array.from(new Set(results.map((r: any) => r.studentId))) as string[];
      const students = await this.db.select({
        id: REPLACED_users.id,
        firstName: REPLACED_users.firstName,
        lastName: REPLACED_users.lastName
      })
        .from(REPLACED_users)
        .where(inArray(REPLACED_users.id, studentIds));

      // Enrich results with student names
      return results.map((r: any) => ({
        ...r,
        studentName: `${students.find((s: any) => s.id === r.studentId)?.firstName} ${students.find((s: any) => s.id === r.studentId)?.lastName}`,
        status: r.autoScored || r.manualOverride ? 'reviewed' : 'pending',
        aiSuggested: r.pointsEarned > 0 && !r.autoScored && !r.manualOverride
      }));

    } catch (error) {
      return [];
    }
  }


  // Exam sessions management
  async createExamSession(session: InsertExamSession): Promise<ExamSession> {
    const result = await db.insert(REPLACED_examSessions).values(session).returning();
    return result[0];
  }
  async getExamSessionById(id: number): Promise<ExamSession | undefined> {
    // Only select columns that actually exist in the current database
    const result = await db.select({
      id: REPLACED_examSessions.id,
      examId: REPLACED_examSessions.examId,
      studentId: REPLACED_examSessions.studentId,
      startedAt: REPLACED_examSessions.startedAt,
      submittedAt: REPLACED_examSessions.submittedAt,
      timeRemaining: REPLACED_examSessions.timeRemaining,
      isCompleted: REPLACED_examSessions.isCompleted,
      score: REPLACED_examSessions.score,
      maxScore: REPLACED_examSessions.maxScore,
      status: REPLACED_examSessions.status,
      createdAt: REPLACED_examSessions.createdAt,
    }).from(REPLACED_examSessions)
      .where(eq(REPLACED_examSessions.id, id))
      .limit(1);
    return result[0];
  }
  async getExamSessionsByExam(examId: number): Promise<ExamSession[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
      id: REPLACED_examSessions.id,
      examId: REPLACED_examSessions.examId,
      studentId: REPLACED_examSessions.studentId,
      startedAt: REPLACED_examSessions.startedAt,
      submittedAt: REPLACED_examSessions.submittedAt,
      timeRemaining: REPLACED_examSessions.timeRemaining,
      isCompleted: REPLACED_examSessions.isCompleted,
      score: REPLACED_examSessions.score,
      maxScore: REPLACED_examSessions.maxScore,
      status: REPLACED_examSessions.status,
      createdAt: REPLACED_examSessions.createdAt,
    }).from(REPLACED_examSessions)
      .where(eq(REPLACED_examSessions.examId, examId))
      .orderBy(desc(REPLACED_examSessions.startedAt));
  }
  async getExamSessionsByStudent(studentId: string): Promise<ExamSession[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
      id: REPLACED_examSessions.id,
      examId: REPLACED_examSessions.examId,
      studentId: REPLACED_examSessions.studentId,
      startedAt: REPLACED_examSessions.startedAt,
      submittedAt: REPLACED_examSessions.submittedAt,
      timeRemaining: REPLACED_examSessions.timeRemaining,
      isCompleted: REPLACED_examSessions.isCompleted,
      score: REPLACED_examSessions.score,
      maxScore: REPLACED_examSessions.maxScore,
      status: REPLACED_examSessions.status,
      createdAt: REPLACED_examSessions.createdAt,
    }).from(REPLACED_examSessions)
      .where(eq(REPLACED_examSessions.studentId, studentId))
      .orderBy(desc(REPLACED_examSessions.startedAt));
  }
  async updateExamSession(id: number, session: Partial<InsertExamSession>): Promise<ExamSession | undefined> {
    // Filter to only existing columns to avoid database errors
    const allowedFields: Partial<InsertExamSession> = {};
    const existingColumns = ['examId', 'studentId', 'startedAt', 'submittedAt', 'timeRemaining', 'isCompleted', 'score', 'maxScore', 'status'];

    // Only include fields that exist in the database
    for (const [key, value] of Object.entries(session)) {
      if (existingColumns.includes(key) && value !== undefined) {
        (allowedFields as any)[key] = value;
      }
    }

    const result = await db.update(REPLACED_examSessions)
      .set(allowedFields)
      .where(eq(REPLACED_examSessions.id, id))
      .returning({
        id: REPLACED_examSessions.id,
        examId: REPLACED_examSessions.examId,
        studentId: REPLACED_examSessions.studentId,
        startedAt: REPLACED_examSessions.startedAt,
        submittedAt: REPLACED_examSessions.submittedAt,
        timeRemaining: REPLACED_examSessions.timeRemaining,
        isCompleted: REPLACED_examSessions.isCompleted,
        score: REPLACED_examSessions.score,
        maxScore: REPLACED_examSessions.maxScore,
        status: REPLACED_examSessions.status,
        createdAt: REPLACED_examSessions.createdAt
      });
    return result[0];
  }
  async deleteExamSession(id: number): Promise<boolean> {
    const result = await db.delete(REPLACED_examSessions)
      .where(eq(REPLACED_examSessions.id, id));
    return result.length > 0;
  }
  async getActiveExamSession(examId: number, studentId: string): Promise<ExamSession | undefined> {
    const result = await db.select().from(REPLACED_examSessions)
      .where(and(
        eq(REPLACED_examSessions.examId, examId),
        eq(REPLACED_examSessions.studentId, studentId),
        eq(REPLACED_examSessions.isCompleted, false)
      ))
      .limit(1);
    return result[0];
  }
  // Get all active exam sessions for background cleanup service
  async getActiveExamSessions(): Promise<ExamSession[]> {
    // Temporarily select only core columns to avoid missing column errors
    return await db.select({
      id: REPLACED_examSessions.id,
      examId: REPLACED_examSessions.examId,
      studentId: REPLACED_examSessions.studentId,
      startedAt: REPLACED_examSessions.startedAt,
      submittedAt: REPLACED_examSessions.submittedAt,
      timeRemaining: REPLACED_examSessions.timeRemaining,
      isCompleted: REPLACED_examSessions.isCompleted,
      score: REPLACED_examSessions.score,
      maxScore: REPLACED_examSessions.maxScore,
      status: REPLACED_examSessions.status,
      createdAt: REPLACED_examSessions.createdAt
    }).from(REPLACED_examSessions)
      .where(eq(REPLACED_examSessions.isCompleted, false))
      .orderBy(desc(REPLACED_examSessions.startedAt));
  }
  // PERFORMANCE: Get only expired sessions directly from database
  async getExpiredExamSessions(now: Date, limit = 100): Promise<ExamSession[]> {
    // Temporarily simplified to work with existing schema - will be enhanced after schema sync
    return await db.select({
      id: REPLACED_examSessions.id,
      examId: REPLACED_examSessions.examId,
      studentId: REPLACED_examSessions.studentId,
      startedAt: REPLACED_examSessions.startedAt,
      submittedAt: REPLACED_examSessions.submittedAt,
      timeRemaining: REPLACED_examSessions.timeRemaining,
      isCompleted: REPLACED_examSessions.isCompleted,
      score: REPLACED_examSessions.score,
      maxScore: REPLACED_examSessions.maxScore,
      status: REPLACED_examSessions.status,
      createdAt: REPLACED_examSessions.createdAt
    }).from(REPLACED_examSessions)
      .where(and(
        eq(REPLACED_examSessions.isCompleted, false),
        // Fallback: Use startedAt + reasonable timeout estimate for expired sessions
        dsql`${REPLACED_examSessions.startedAt} + interval '2 hours' < ${now.toISOString()}`
      ))
      .orderBy(asc(REPLACED_examSessions.startedAt))
      .limit(limit);
  }
  // CIRCUIT BREAKER FIX: Idempotent session creation using UPSERT to prevent connection pool exhaustion
  async createOrGetActiveExamSession(examId: number, studentId: string, sessionData: InsertExamSession): Promise<ExamSession & { wasCreated?: boolean }> {
    try {
      // STEP 1: Try to insert new session - this will fail if an active session already exists due to unique index
      const insertResult = await db.insert(REPLACED_examSessions)
        .values({
          examId: sessionData.examId,
          studentId: studentId,
          startedAt: new Date(),
          timeRemaining: sessionData.timeRemaining,
          isCompleted: false,
          status: 'in_progress'
        })
        .onConflictDoNothing() // This requires the unique index we added
        .returning({
          id: REPLACED_examSessions.id,
          examId: REPLACED_examSessions.examId,
          studentId: REPLACED_examSessions.studentId,
          startedAt: REPLACED_examSessions.startedAt,
          submittedAt: REPLACED_examSessions.submittedAt,
          timeRemaining: REPLACED_examSessions.timeRemaining,
          isCompleted: REPLACED_examSessions.isCompleted,
          score: REPLACED_examSessions.score,
          maxScore: REPLACED_examSessions.maxScore,
          status: REPLACED_examSessions.status,
          createdAt: REPLACED_examSessions.createdAt
        });

      // If insert succeeded, return the new session
      if (insertResult.length > 0) {
        return { ...insertResult[0], wasCreated: true };
      }
      // STEP 2: Insert failed due to conflict, fetch the existing active session
      const existingSession = await db.select({
        id: REPLACED_examSessions.id,
        examId: REPLACED_examSessions.examId,
        studentId: REPLACED_examSessions.studentId,
        startedAt: REPLACED_examSessions.startedAt,
        submittedAt: REPLACED_examSessions.submittedAt,
        timeRemaining: REPLACED_examSessions.timeRemaining,
        isCompleted: REPLACED_examSessions.isCompleted,
        score: REPLACED_examSessions.score,
        maxScore: REPLACED_examSessions.maxScore,
        status: REPLACED_examSessions.status,
        createdAt: REPLACED_examSessions.createdAt
      }).from(REPLACED_examSessions)
        .where(and(
          eq(REPLACED_examSessions.examId, examId),
          eq(REPLACED_examSessions.studentId, studentId),
          eq(REPLACED_examSessions.isCompleted, false)
        ))
        .limit(1);

      if (existingSession.length > 0) {
        return { ...existingSession[0], wasCreated: false };
      }
      // This should not happen with proper unique index, but handle gracefully
      throw new Error(`Unable to create or retrieve exam session for student ${studentId} exam ${examId}`);

    } catch (error: any) {
      throw error;
    }
  }

  // Enhanced session management for students
  async getStudentActiveSession(studentId: string): Promise<ExamSession | undefined> {
    const result = await this.db.select({
      id: REPLACED_examSessions.id,
      examId: REPLACED_examSessions.examId,
      studentId: REPLACED_examSessions.studentId,
      startedAt: REPLACED_examSessions.startedAt,
      submittedAt: REPLACED_examSessions.submittedAt,
      timeRemaining: REPLACED_examSessions.timeRemaining,
      isCompleted: REPLACED_examSessions.isCompleted,
      score: REPLACED_examSessions.score,
      maxScore: REPLACED_examSessions.maxScore,
      status: REPLACED_examSessions.status,
      createdAt: REPLACED_examSessions.createdAt
    }).from(REPLACED_examSessions)
      .where(and(
        eq(REPLACED_examSessions.studentId, studentId),
        eq(REPLACED_examSessions.isCompleted, false)
      ))
      .orderBy(desc(REPLACED_examSessions.createdAt))
      .limit(1);
    return result[0];
  }
  async updateSessionProgress(sessionId: number, progress: { currentQuestionIndex?: number; timeRemaining?: number }): Promise<void> {
    const updates: any = {};
    if (typeof progress.timeRemaining === 'number') {
      updates.timeRemaining = progress.timeRemaining;
    }
    if (typeof progress.currentQuestionIndex === 'number') {
      updates.metadata = JSON.stringify({ currentQuestionIndex: progress.currentQuestionIndex });
    }
    if (Object.keys(updates).length > 0) {
      await this.db.update(REPLACED_examSessions)
        .set(updates)
        .where(eq(REPLACED_examSessions.id, sessionId));
    }
  }

  // Student answers management
  async createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer> {
    const result = await db.insert(REPLACED_studentAnswers).values(answer).returning();
    return result[0];
  }
  async getStudentAnswers(sessionId: number): Promise<StudentAnswer[]> {
    return await db.select().from(REPLACED_studentAnswers)
      .where(eq(REPLACED_studentAnswers.sessionId, sessionId))
      .orderBy(asc(REPLACED_studentAnswers.answeredAt));
  }
  async getStudentAnswerById(id: number): Promise<StudentAnswer | undefined> {
    const result = await db.select().from(REPLACED_studentAnswers)
      .where(eq(REPLACED_studentAnswers.id, id))
      .limit(1);
    return result[0];
  }
  async updateStudentAnswer(id: number, answer: Partial<InsertStudentAnswer>): Promise<StudentAnswer | undefined> {
    const result = await db.update(REPLACED_studentAnswers)
      .set(answer)
      .where(eq(REPLACED_studentAnswers.id, id))
      .returning();
    return result[0];
  }
  async getStudentAnswerBySessionAndQuestion(sessionId: number, questionId: number): Promise<StudentAnswer | undefined> {
    const result = await db.select().from(REPLACED_studentAnswers)
      .where(and(
        eq(REPLACED_studentAnswers.sessionId, sessionId),
        eq(REPLACED_studentAnswers.questionId, questionId)
      ))
      .limit(1);
    return result[0];
  }
  async upsertStudentAnswer(sessionId: number, questionId: number, answer: Partial<InsertStudentAnswer>): Promise<StudentAnswer> {
    const existing = await this.getStudentAnswerBySessionAndQuestion(sessionId, questionId);
    
    if (existing) {
      const updated = await this.updateStudentAnswer(existing.id, answer);
      return updated!;
    } else {
      return await this.createStudentAnswer({
        sessionId,
        questionId,
        ...answer
      } as InsertStudentAnswer);
    }
  }

  async getQuestionOptionById(optionId: number): Promise<QuestionOption | undefined> {
    const result = await db.select().from(REPLACED_questionOptions)
      .where(eq(REPLACED_questionOptions.id, optionId))
      .limit(1);
    return result[0];
  }
  // OPTIMIZED SCORING: Get all scoring data in a single query for <2s performance
  async getExamScoringData(sessionId: number): Promise<{
    session: ExamSession;
    scoringData: Array<{
      questionId: number;
      questionType: string;
      points: number;
      studentSelectedOptionId: number | null;
      correctOptionId: number | null;
      isCorrect: boolean;
      textAnswer: string | null;
    }>;
    summary: {
      totalQuestions: number;
      maxScore: number;
      studentScore: number;
      autoScoredQuestions: number;
    };
  }> {
    try {

      // First, get the session - select only existing columns
      const sessionResult = await this.db.select({
        id: REPLACED_examSessions.id,
        examId: REPLACED_examSessions.examId,
        studentId: REPLACED_examSessions.studentId,
        startedAt: REPLACED_examSessions.startedAt,
        submittedAt: REPLACED_examSessions.submittedAt,
        timeRemaining: REPLACED_examSessions.timeRemaining,
        isCompleted: REPLACED_examSessions.isCompleted,
        score: REPLACED_examSessions.score,
        maxScore: REPLACED_examSessions.maxScore,
        status: REPLACED_examSessions.status,
        createdAt: REPLACED_examSessions.createdAt
      })
        .from(REPLACED_examSessions)
        .where(eq(REPLACED_examSessions.id, sessionId))
        .limit(1);

      if (!sessionResult[0]) {
        throw new Error(`Exam session ${sessionId} not found`);
      }
      const session = sessionResult[0];

      // CORRECTED QUERY: Get question data and correct options separately to avoid row multiplication issues
      const questionsQuery = await this.db.select({
        questionId: REPLACED_examQuestions.id,
        questionType: REPLACED_examQuestions.questionType,
        points: REPLACED_examQuestions.points,
        autoGradable: REPLACED_examQuestions.autoGradable,
        expectedAnswers: REPLACED_examQuestions.expectedAnswers,
        caseSensitive: REPLACED_examQuestions.caseSensitive,
        allowPartialCredit: REPLACED_examQuestions.allowPartialCredit,
        partialCreditRules: REPLACED_examQuestions.partialCreditRules,
        studentSelectedOptionId: REPLACED_studentAnswers.selectedOptionId,
        textAnswer: REPLACED_studentAnswers.textAnswer,
      })
        .from(REPLACED_examQuestions)
        .leftJoin(REPLACED_studentAnswers, and(
          eq(REPLACED_studentAnswers.questionId, REPLACED_examQuestions.id),
          eq(REPLACED_studentAnswers.sessionId, sessionId)
        ))
        .where(eq(REPLACED_examQuestions.examId, session.examId))
        .orderBy(asc(REPLACED_examQuestions.orderNumber));

      // Get correct options separately to avoid confusion
      const correctOptionsQuery = await this.db.select({
        questionId: REPLACED_questionOptions.questionId,
        correctOptionId: REPLACED_questionOptions.id,
      })
        .from(REPLACED_questionOptions)
        .innerJoin(REPLACED_examQuestions, eq(REPLACED_questionOptions.questionId, REPLACED_examQuestions.id))
        .where(
          and(
            eq(REPLACED_examQuestions.examId, session.examId),
            eq(REPLACED_questionOptions.isCorrect, true)
          )
        );

      // Get selected option details for partial credit (only for questions with student answers)
      const selectedOptionsQuery = await this.db.select({
        questionId: REPLACED_questionOptions.questionId,
        optionId: REPLACED_questionOptions.id,
        partialCreditValue: REPLACED_questionOptions.partialCreditValue,
        isCorrect: REPLACED_questionOptions.isCorrect,
      })
        .from(REPLACED_questionOptions)
        .innerJoin(REPLACED_studentAnswers, eq(REPLACED_questionOptions.id, REPLACED_studentAnswers.selectedOptionId))
        .where(eq(REPLACED_studentAnswers.sessionId, sessionId));

      // Create lookup maps for efficient processing
      const correctOptionsMap = new Map<number, number>();
      for (const option of correctOptionsQuery) {
        correctOptionsMap.set(option.questionId, option.correctOptionId);
      }
      const selectedOptionsMap = new Map<number, { optionId: number; partialCreditValue: number | null; isCorrect: boolean | null }>();
      for (const option of selectedOptionsQuery) {
        selectedOptionsMap.set(option.questionId, {
          optionId: option.optionId,
          partialCreditValue: option.partialCreditValue,
          isCorrect: option.isCorrect,
        });
      }
      // CORRECTED PROCESSING: Build question data from separate queries
      const questionMap = new Map<number, {
        questionType: string;
        points: number;
        autoGradable: boolean | null;
        expectedAnswers: string[] | null;
        caseSensitive: boolean | null;
        allowPartialCredit: boolean | null;
        partialCreditRules: string | null;
        studentSelectedOptionId: number | null;
        textAnswer: string | null;
        correctOptionId: number | null;
        isCorrect: boolean;
        partialCreditEarned: number;
      }>();

      // Build questions with correct option IDs
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
          partialCreditEarned: 0,
        });

        // FIXED CORRECTNESS LOGIC: Determine if option-based questions are correct
        if ((question.questionType === 'multiple_choice' ||
          question.questionType === 'true_false' ||
          question.questionType === 'true/false') &&
          correctOptionId && question.studentSelectedOptionId === correctOptionId) {
          questionMap.get(question.questionId)!.isCorrect = true;
        }
        // FIXED PARTIAL CREDIT LOGIC: Award partial credit for incorrect option-based answers
        if (question.allowPartialCredit && selectedOptionData && selectedOptionData.partialCreditValue) {
          const questionData = questionMap.get(question.questionId)!;

          // Only award partial credit if the answer is incorrect but has some value
          if (!questionData.isCorrect && selectedOptionData.partialCreditValue > 0) {
            questionData.partialCreditEarned = Math.min(
              questionData.points,
              selectedOptionData.partialCreditValue
            );
          }
        }
      }
      // ENHANCED AUTO-SCORING: Process text-based questions after collecting all data
      for (const [questionId, question] of Array.from(questionMap.entries())) {
        if (!question.autoGradable) continue;

        // Handle text-based questions (text, fill_blank)
        if ((question.questionType === 'text' || question.questionType === 'fill_blank') &&
          question.expectedAnswers && question.textAnswer) {

          const studentAnswer = question.textAnswer.trim();
          if (!studentAnswer) continue; // Skip empty answers


          // Check against all expected answers
          for (const expectedAnswer of question.expectedAnswers) {
            const normalizedExpected = question.caseSensitive ?
              expectedAnswer.trim() :
              expectedAnswer.trim().toLowerCase();

            const normalizedStudent = question.caseSensitive ?
              studentAnswer :
              studentAnswer.toLowerCase();

            // Exact match
            if (normalizedStudent === normalizedExpected) {
              question.isCorrect = true;
              break;
            }
            // Partial credit for close matches (if enabled)
            if (question.allowPartialCredit && !question.isCorrect) {
              const similarity = this.calculateTextSimilarity(normalizedStudent, normalizedExpected);

              try {
                const partialRules = question.partialCreditRules ?
                  JSON.parse(question.partialCreditRules) :
                  { minSimilarity: 0.8, partialPercentage: 0.5 };

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
      // Convert map to array and calculate summary
      const scoringData = Array.from(questionMap.entries()).map(([questionId, data]) => ({
        questionId,
        ...data,
      }));

      // Calculate summary statistics
      let totalQuestions = scoringData.length;
      let maxScore = 0;
      let studentScore = 0;
      let autoScoredQuestions = 0;


      // Track question types for debugging
      const questionTypeCount: Record<string, number> = {};

      for (const question of scoringData) {
        maxScore += question.points;

        // Count question types for diagnostic
        questionTypeCount[question.questionType] = (questionTypeCount[question.questionType] || 0) + 1;

        // ENHANCED SCORING: Use auto_gradable field from database to determine if question can be auto-scored
        // This is the definitive source of truth for auto-scoring eligibility
        if (question.autoGradable === true) {
          autoScoredQuestions++;

          // Award full points for correct answers
          if (question.isCorrect) {
            studentScore += question.points;
          }
          // Award partial credit if earned
          else if (question.partialCreditEarned > 0) {
            studentScore += question.partialCreditEarned;
          }
          // No credit
          else {
          }
        } else {
        }
      }


      return {
        session,
        scoringData,
        summary: {
          totalQuestions,
          maxScore,
          studentScore,
          autoScoredQuestions,
        }
      };
    } catch (error) {
      throw error;
    }
  }


  // Text similarity calculation for partial credit scoring
  private calculateTextSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.getEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }
  private getEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
  // Announcements
  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const result = await db.insert(REPLACED_announcements).values(announcement).returning();
    return result[0];
  }
  async getAnnouncements(targetRole?: string): Promise<Announcement[]> {
    const query = db.select().from(REPLACED_announcements)
      .where(eq(REPLACED_announcements.isPublished, true))
      .orderBy(desc(REPLACED_announcements.publishedAt));

    if (targetRole) {
      // Note: This would need proper array contains logic for PostgreSQL
      // For now, return all published announcements ordered by date
    }
    return await query;
  }
  async getAnnouncementById(id: number): Promise<Announcement | undefined> {
    const result = await db.select().from(REPLACED_announcements).where(eq(REPLACED_announcements.id, id)).limit(1);
    return result[0];
  }
  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const result = await db.update(REPLACED_announcements).set(announcement).where(eq(REPLACED_announcements.id, id)).returning();
    return result[0];
  }
  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(REPLACED_announcements).where(eq(REPLACED_announcements.id, id));
    return result.length > 0;
  }
  // Messages
  async sendMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(REPLACED_messages).values(message).returning();
    return result[0];
  }
  async getMessagesByUser(userId: string): Promise<Message[]> {
    return await db.select().from(REPLACED_messages)
      .where(eq(REPLACED_messages.recipientId, userId))
      .orderBy(desc(REPLACED_messages.createdAt));
  }
  async markMessageAsRead(id: number): Promise<void> {
    await db.update(REPLACED_messages).set({ isRead: true }).where(eq(REPLACED_messages.id, id));
  }
  // Gallery
  async createGalleryCategory(category: InsertGalleryCategory): Promise<GalleryCategory> {
    const result = await db.insert(REPLACED_galleryCategories).values(category).returning();
    return result[0];
  }
  async getGalleryCategories(): Promise<GalleryCategory[]> {
    return await db.select().from(REPLACED_galleryCategories).orderBy(asc(REPLACED_galleryCategories.name));
  }
  async uploadGalleryImage(image: InsertGallery): Promise<Gallery> {
    const result = await db.insert(REPLACED_gallery).values(image).returning();
    return result[0];
  }
  async getGalleryImages(categoryId?: number): Promise<Gallery[]> {
    if (categoryId) {
      return await db.select().from(REPLACED_gallery)
        .where(eq(REPLACED_gallery.categoryId, categoryId))
        .orderBy(desc(REPLACED_gallery.createdAt));
    }
    return await db.select().from(REPLACED_gallery).orderBy(desc(REPLACED_gallery.createdAt));
  }
  async getGalleryImageById(id: string): Promise<Gallery | undefined> {
    const result = await db.select().from(REPLACED_gallery)
      .where(eq(REPLACED_gallery.id, parseInt(id)))
      .limit(1);
    return result[0];
  }
  async deleteGalleryImage(id: string): Promise<boolean> {
    const result = await db.delete(REPLACED_gallery)
      .where(eq(REPLACED_gallery.id, parseInt(id)))
      .returning();
    return result.length > 0;
  }
  // Study resources management
  async createStudyResource(resource: InsertStudyResource): Promise<StudyResource> {
    const result = await db.insert(REPLACED_studyResources).values(resource).returning();
    return result[0];
  }
  async getStudyResources(filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
    resourceType?: string;
  }): Promise<StudyResource[]> {
    let query = db.select().from(REPLACED_studyResources)
      .where(eq(REPLACED_studyResources.isPublished, true));

    if (filters?.classId) {
      query = query.where(eq(REPLACED_studyResources.classId, filters.classId));
    }
    if (filters?.subjectId) {
      query = query.where(eq(REPLACED_studyResources.subjectId, filters.subjectId));
    }
    if (filters?.termId) {
      query = query.where(eq(REPLACED_studyResources.termId, filters.termId));
    }
    if (filters?.resourceType) {
      query = query.where(eq(REPLACED_studyResources.resourceType, filters.resourceType));
    }
    return await query.orderBy(desc(REPLACED_studyResources.createdAt));
  }
  async getStudyResourceById(id: number): Promise<StudyResource | undefined> {
    const result = await db.select().from(REPLACED_studyResources)
      .where(eq(REPLACED_studyResources.id, id))
      .limit(1);
    return result[0];
  }
  async incrementStudyResourceDownloads(id: number): Promise<void> {
    await db.update(REPLACED_studyResources)
      .set({ downloads: dsql`${REPLACED_studyResources.downloads} + 1` })
      .where(eq(REPLACED_studyResources.id, id));
  }
  async deleteStudyResource(id: number): Promise<boolean> {
    const result = await db.delete(REPLACED_studyResources)
      .where(eq(REPLACED_studyResources.id, id))
      .returning();
    return result.length > 0;
  }
  // Home page content management
  async createHomePageContent(content: InsertHomePageContent): Promise<HomePageContent> {
    const result = await db.insert(REPLACED_homePageContent).values(content).returning();
    return result[0];
  }


  // Manual Grading System Methods
  async getGradingTasks(teacherId: string, status?: string): Promise<any[]> {
    try {
      // Use PostgreSQL for production, SQLite for development
      if (isPostgres) {
        const pgClient = getPgClient();
        if (!pgClient) return [];
        
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

        if (status && status !== 'all') {
          if (status === 'pending') {
            query += ' AND sa.id NOT IN (SELECT answer_id FROM manual_scores)';
          } else if (status === 'graded') {
            query += ' AND sa.id IN (SELECT answer_id FROM manual_scores)';
          }
        }

        query += ' ORDER BY es.submitted_at DESC';

        // Use Neon's unsafe method for dynamic queries with parameters
        const result = await (pgClient as any).unsafe(query, [teacherId]);
        return result as any[];
      } else {
        // SQLite for development
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

        if (status && status !== 'all') {
          if (status === 'pending') {
            query += ' AND sa.id NOT IN (SELECT answer_id FROM manual_scores)';
          } else if (status === 'graded') {
            query += ' AND sa.id IN (SELECT answer_id FROM manual_scores)';
          }
        }

        query += ' ORDER BY es.submitted_at DESC';

        const stmt = sqliteConn.prepare(query);
        return stmt.all(teacherId) as any[];
      }
    } catch (error) {
      console.error('Error fetching grading tasks:', error);
      return [];
    }
  }

  async submitManualGrade(gradeData: { taskId: number; score: number; comment: string; graderId: string }): Promise<any> {
    try {
      const { taskId, score, comment, graderId } = gradeData;

      if (isPostgres) {
        const pgClient = getPgClient();
        if (!pgClient) throw new Error('PostgreSQL client not available');
        
        // Use PostgreSQL upsert syntax
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

        // Update the student answer with the manual score
        await pgClient`
          UPDATE student_answers
          SET points_earned = ${score}
          WHERE id = ${taskId}
        `;

        return result[0] as any;
      } else {
        const sqliteConn = getSqliteConnection();
        if (!sqliteConn) throw new Error('SQLite database not available');

        const now = new Date().toISOString();
        
        // Check if manual score exists
        const existing = sqliteConn.prepare('SELECT id FROM manual_scores WHERE answer_id = ?').get(taskId);
        
        let result;
        if (existing) {
          // Update existing
          sqliteConn.prepare(`
            UPDATE manual_scores 
            SET awarded_marks = ?, comment = ?, graded_at = ?, grader_id = ?
            WHERE answer_id = ?
          `).run(score, comment, now, graderId, taskId);
          result = sqliteConn.prepare('SELECT * FROM manual_scores WHERE answer_id = ?').get(taskId);
        } else {
          // Insert new
          sqliteConn.prepare(`
            INSERT INTO manual_scores (answer_id, grader_id, awarded_marks, comment, graded_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(taskId, graderId, score, comment, now);
          result = sqliteConn.prepare('SELECT * FROM manual_scores WHERE answer_id = ?').get(taskId);
        }

        // Update the student answer with the manual score
        sqliteConn.prepare('UPDATE student_answers SET points_earned = ? WHERE id = ?').run(score, taskId);

        return result as any;
      }
    } catch (error) {
      throw error;
    }
  }

  async getAllExamSessions(): Promise<any[]> {
    try {
      if (isPostgres) {
        const pgClient = getPgClient();
        if (!pgClient) return [];
        
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

        return result as any[];
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

        return result as any[];
      }
    } catch (error) {
      console.error('Error fetching exam sessions:', error);
      return [];
    }
  }

  async getExamReports(filters: { subjectId?: number; classId?: number }): Promise<any[]> {
    try {
      if (isPostgres) {
        const pgClient = getPgClient();
        if (!pgClient) return [];
        
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

        const params: any[] = [];
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

        // Use Neon's unsafe method for dynamic queries with parameters
        const result = await (pgClient as any).unsafe(query, params);
        return result as any[];
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

        const params: any[] = [];

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
        return stmt.all(...params) as any[];
      }
    } catch (error) {
      console.error('Error fetching exam reports:', error);
      return [];
    }
  }

  async getExamStudentReports(examId: number): Promise<any[]> {
    try {
      if (isPostgres) {
        const pgClient = getPgClient();
        if (!pgClient) return [];
        
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

        return result as any[];
      } else {
        const sqliteConn = getSqliteConnection();
        if (!sqliteConn) return [];
        
        // SQLite version - uses different syntax for time calculation
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

        return result as any[];
      }
    } catch (error) {
      console.error('Error fetching exam student reports:', error);
      return [];
    }
  }


  // Home page content management
  async getHomePageContent(contentType?: string): Promise<HomePageContent[]> {
    if (contentType) {
      return await db.select().from(REPLACED_homePageContent)
        .where(and(eq(REPLACED_homePageContent.contentType, contentType), eq(REPLACED_homePageContent.isActive, true)))
        .orderBy(asc(REPLACED_homePageContent.displayOrder));
    }
    return await db.select().from(REPLACED_homePageContent)
      .where(eq(REPLACED_homePageContent.isActive, true))
      .orderBy(asc(REPLACED_homePageContent.displayOrder), asc(REPLACED_homePageContent.contentType));
  }
  async getHomePageContentById(id: number): Promise<HomePageContent | undefined> {
    const result = await db.select().from(REPLACED_homePageContent)
      .where(eq(REPLACED_homePageContent.id, id))
      .limit(1);
    return result[0];
  }
  async updateHomePageContent(id: number, content: Partial<InsertHomePageContent>): Promise<HomePageContent | undefined> {
    const result = await db.update(REPLACED_homePageContent)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(REPLACED_homePageContent.id, id))
      .returning();
    return result[0];
  }
  async deleteHomePageContent(id: number): Promise<boolean> {
    const result = await db.delete(REPLACED_homePageContent)
      .where(eq(REPLACED_homePageContent.id, id))
      .returning();
    return result.length > 0;
  }
  // Comprehensive grade management
  async recordComprehensiveGrade(gradeData: any): Promise<any> {
    try {
      // First ensure we have a report card for this student/term
      let reportCard = await db.select()
        .from(REPLACED_reportCards)
        .where(and(
          eq(REPLACED_reportCards.studentId, gradeData.studentId),
          eq(REPLACED_reportCards.termId, gradeData.termId)
        ))
        .limit(1);

      let reportCardId: number;
      if (reportCard.length === 0) {
        // Create new report card
        const newReportCard = await db.insert(REPLACED_reportCards)
          .values({
            studentId: gradeData.studentId,
            classId: gradeData.classId || 1, // Should be provided
            termId: gradeData.termId,
            status: 'draft',
          })
          .returning();
        reportCardId = newReportCard[0].id;
      } else {
        reportCardId = reportCard[0].id;
      }
      // Check if item already exists for this report card/subject
      const existingItem = await db.select()
        .from(REPLACED_reportCardItems)
        .where(and(
          eq(REPLACED_reportCardItems.reportCardId, reportCardId),
          eq(REPLACED_reportCardItems.subjectId, gradeData.subjectId)
        ))
        .limit(1);

      const comprehensiveGradeData = {
        reportCardId: reportCardId,
        subjectId: gradeData.subjectId,
        testScore: gradeData.testScore,
        testMaxScore: gradeData.testMaxScore,
        testWeightedScore: gradeData.testWeightedScore || Math.round((gradeData.testScore / gradeData.testMaxScore) * 40),
        examScore: gradeData.examScore,
        examMaxScore: gradeData.examMaxScore,
        examWeightedScore: gradeData.examWeightedScore || Math.round((gradeData.examScore / gradeData.examMaxScore) * 60),
        obtainedMarks: gradeData.testWeightedScore + gradeData.examWeightedScore || Math.round(((gradeData.testScore / gradeData.testMaxScore) * 40) + ((gradeData.examScore / gradeData.examMaxScore) * 60)),
        percentage: gradeData.percentage || Math.round(((gradeData.testScore / gradeData.testMaxScore) * 40) + ((gradeData.examScore / gradeData.examMaxScore) * 60)),
        grade: gradeData.grade,
        teacherRemarks: gradeData.teacherRemarks,
      };

      if (existingItem.length > 0) {
        // Update existing item
        const result = await db.update(REPLACED_reportCardItems)
          .set(comprehensiveGradeData)
          .where(eq(REPLACED_reportCardItems.id, existingItem[0].id))
          .returning();
        return result[0];
      } else {
        // Create new item
        const result = await db.insert(REPLACED_reportCardItems)
          .values(comprehensiveGradeData)
          .returning();
        return result[0];
      }
    } catch (error) {
      throw error;
    }
  }

  async getComprehensiveGradesByStudent(studentId: string, termId?: number): Promise<any[]> {
    try {
      let query = db.select({
        id: REPLACED_reportCardItems.id,
        subjectId: REPLACED_reportCardItems.subjectId,
        subjectName: REPLACED_subjects.name,
        testScore: REPLACED_reportCardItems.testScore,
        testMaxScore: REPLACED_reportCardItems.testMaxScore,
        testWeightedScore: REPLACED_reportCardItems.testWeightedScore,
        examScore: REPLACED_reportCardItems.examScore,
        examMaxScore: REPLACED_reportCardItems.examMaxScore,
        examWeightedScore: REPLACED_reportCardItems.examWeightedScore,
        obtainedMarks: REPLACED_reportCardItems.obtainedMarks,
        percentage: REPLACED_reportCardItems.percentage,
        grade: REPLACED_reportCardItems.grade,
        teacherRemarks: REPLACED_reportCardItems.teacherRemarks,
        termId: REPLACED_reportCards.termId,
        createdAt: REPLACED_reportCardItems.createdAt
      })
        .from(REPLACED_reportCardItems)
        .innerJoin(REPLACED_reportCards, eq(REPLACED_reportCardItems.reportCardId, REPLACED_reportCards.id))
        .innerJoin(REPLACED_subjects, eq(REPLACED_reportCardItems.subjectId, REPLACED_subjects.id))
        .where(eq(REPLACED_reportCards.studentId, studentId));

      if (termId) {
        query = query.where(and(
          eq(REPLACED_reportCards.studentId, studentId),
          eq(REPLACED_reportCards.termId, termId)
        ));
      }
      return await query.orderBy(REPLACED_subjects.name);
    } catch (error) {
      return [];
    }
  }

  async getComprehensiveGradesByClass(classId: number, termId?: number): Promise<any[]> {
    try {
      let query = db.select({
        studentId: REPLACED_reportCards.studentId,
        studentName: sql<string>`CONCAT(${REPLACED_users.firstName}, ' ', ${REPLACED_users.lastName})`.as('studentName'),
        admissionNumber: REPLACED_students.admissionNumber,
        subjectName: REPLACED_subjects.name,
        testScore: REPLACED_reportCardItems.testScore,
        examScore: REPLACED_reportCardItems.examScore,
        obtainedMarks: REPLACED_reportCardItems.obtainedMarks,
        grade: REPLACED_reportCardItems.grade,
        teacherRemarks: REPLACED_reportCardItems.teacherRemarks
      })
        .from(REPLACED_reportCardItems)
        .innerJoin(REPLACED_reportCards, eq(REPLACED_reportCardItems.reportCardId, REPLACED_reportCards.id))
        .innerJoin(REPLACED_students, eq(REPLACED_reportCards.studentId, REPLACED_students.id))
        .innerJoin(REPLACED_users, eq(REPLACED_students.id, REPLACED_users.id))
        .innerJoin(REPLACED_subjects, eq(REPLACED_reportCardItems.subjectId, REPLACED_subjects.id))
        .where(eq(REPLACED_students.classId, classId));

      if (termId) {
        query = query.where(and(
          eq(REPLACED_students.classId, classId),
          eq(REPLACED_reportCards.termId, termId)
        ));
      }
      return await query.orderBy(REPLACED_users.firstName, REPLACED_users.lastName, REPLACED_subjects.name);
    } catch (error) {
      return [];
    }
  }

  async createReportCard(reportCardData: any, grades: any[]): Promise<any> {
    return await this.db.transaction(async (tx: any) => {
      try {
        // Create main report card record
        const reportCard = await tx.insert(REPLACED_reportCards)
          .values(reportCardData)
          .returning();

        // Link all grade items to this report card
        if (grades.length > 0) {
          const gradeUpdates = grades.map((grade: any) =>
            tx.update(REPLACED_reportCardItems)
              .set({ reportCardId: reportCard[0].id })
              .where(eq(REPLACED_reportCardItems.id, grade.id))
          );

          await Promise.all(gradeUpdates);
        }
        return {
          reportCard: reportCard[0],
          grades: grades
        };
      } catch (error) {
        throw error;
      }
    });
  }
  async getReportCard(id: number): Promise<ReportCard | undefined> {
    try {
      const result = await db.select()
        .from(REPLACED_reportCards)
        .where(eq(REPLACED_reportCards.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      return undefined;
    }
  }

  async getReportCardsByStudentId(studentId: string): Promise<ReportCard[]> {
    try {
      return await db.select()
        .from(REPLACED_reportCards)
        .where(eq(REPLACED_reportCards.studentId, studentId))
        .orderBy(desc(REPLACED_reportCards.generatedAt));
    } catch (error) {
      return [];
    }
  }

  async getReportCardItems(reportCardId: number): Promise<ReportCardItem[]> {
    try {
      return await db.select()
        .from(REPLACED_reportCardItems)
        .where(eq(REPLACED_reportCardItems.reportCardId, reportCardId));
    } catch (error) {
      return [];
    }
  }

  async getStudentsByParentId(parentId: string): Promise<Student[]> {
    try {
      return await db.select()
        .from(REPLACED_students)
        .where(eq(REPLACED_students.parentId, parentId));
    } catch (error) {
      return [];
    }
  }

  // Analytics and Reports
  async getAnalyticsOverview(): Promise<any> {
    try {
      // Get basic counts
      const [students, teachers, admins, parents] = await Promise.all([
        db.select().from(REPLACED_users).where(eq(REPLACED_users.roleId, 1)),
        db.select().from(REPLACED_users).where(eq(REPLACED_users.roleId, 2)),
        db.select().from(REPLACED_users).where(eq(REPLACED_users.roleId, 4)),
        db.select().from(REPLACED_users).where(eq(REPLACED_users.roleId, 3))
      ]);

      const [classes, subjects, exams, examResults] = await Promise.all([
        db.select().from(REPLACED_classes),
        db.select().from(REPLACED_subjects),
        db.select().from(REPLACED_exams),
        db.select().from(REPLACED_examResults)
      ]);

      // Calculate grade distribution
      const gradeDistribution = this.calculateGradeDistribution(examResults);

      // Calculate average scores by subject
      const subjectPerformance = await this.calculateSubjectPerformance(examResults, subjects);

      return {
        totalUsers: students.length + teachers.length + admins.length + parents.length,
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalAdmins: admins.length,
        totalParents: parents.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
        totalExams: exams.length,
        totalExamResults: examResults.length,
        averageClassSize: classes.length > 0 ? Math.round(students.length / classes.length) : 0,
        gradeDistribution,
        subjectPerformance,
        recentActivity: {
          newStudentsThisMonth: students.filter((s: any) =>
            s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          examsThisMonth: exams.filter((e: any) =>
            e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length
        }
      };
    } catch (error) {
      return this.getFallbackAnalytics();
    }
  }

  async getPerformanceAnalytics(filters: any): Promise<any> {
    try {
      let examResults = await db.select().from(REPLACED_examResults);

      // Apply filters
      if (filters.classId) {
        const studentsInClass = await db.select().from(REPLACED_students)
          .where(eq(REPLACED_students.classId, filters.classId));
        const studentIds = studentsInClass.map((s: any) => s.id);
        examResults = examResults.filter((r: any) => studentIds.includes(r.studentId));
      }
      if (filters.subjectId) {
        const examsForSubject = await db.select().from(REPLACED_exams)
          .where(eq(REPLACED_exams.subjectId, filters.subjectId));
        const examIds = examsForSubject.map((e: any) => e.id);
        examResults = examResults.filter((r: any) => examIds.includes(r.examId));
      }
      // Calculate performance metrics
      const totalExams = examResults.length;
      const averageScore = totalExams > 0 ?
        examResults.reduce((sum: any, r: any) => sum + (r.marksObtained || 0), 0) / totalExams : 0;

      const gradeDistribution = this.calculateGradeDistribution(examResults);

      // Performance trends by month
      const performanceTrends = this.calculatePerformanceTrends(examResults);

      // Top and bottom performers
      const studentPerformance = this.calculateStudentPerformance(examResults);

      return {
        totalExams,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePercentage: Math.round((averageScore / 100) * 100), // Assuming 100 is typical total marks
        gradeDistribution,
        performanceTrends,
        topPerformers: studentPerformance.slice(0, 5),
        strugglingStudents: studentPerformance.slice(-5),
        passRate: Math.round((examResults.filter((r: any) => (r.marksObtained || 0) >= 50).length / totalExams) * 100)
      };
    } catch (error) {
      return { error: 'Failed to calculate performance analytics' };
    }
  }

  async getTrendAnalytics(months: number = 6): Promise<any> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);

      // Get data for the specified time period
      const [students, exams, examResults] = await Promise.all([
        db.select().from(REPLACED_users)
          .where(and(
            eq(REPLACED_users.roleId, 1),
            // Note: In a real implementation, you'd filter by createdAt >= cutoffDate
          )),
        db.select().from(REPLACED_exams),
        db.select().from(REPLACED_examResults)
      ]);

      // Generate monthly trends (simplified for demo)
      const monthlyData = [];
      for (let i = months - 1; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);

        const monthName = month.toLocaleString('default', { month: 'short' });
        const year = month.getFullYear();

        monthlyData.push({
          month: monthName,
          year,
          students: students.length + Math.floor(Math.random() * 10) - 5, // Simulated variance
          exams: Math.floor(exams.length / months) + Math.floor(Math.random() * 3),
          averageScore: 75 + Math.floor(Math.random() * 20) - 10,
          attendance: 85 + Math.floor(Math.random() * 15),
        });
      }
      return {
        monthlyTrends: monthlyData,
        summary: {
          studentsGrowth: monthlyData.length > 1 ?
            ((monthlyData[monthlyData.length - 1].students - monthlyData[0].students) / monthlyData[0].students * 100).toFixed(1) : 0,
          examsTrend: 'stable',
          scoresTrend: 'improving',
          attendanceTrend: 'stable'
        }
      };
    } catch (error) {
      return { error: 'Failed to calculate trend analytics' };
    }
  }

  async getAttendanceAnalytics(filters: any): Promise<any> {
    try {
      let attendance: Attendance[] = await db.select().from(REPLACED_attendance);

      // Apply filters
      if (filters.classId) {
        const studentsInClass = await db.select().from(REPLACED_students)
          .where(eq(REPLACED_students.classId, filters.classId));
        const studentIds = studentsInClass.map((s: any) => s.id);
        attendance = attendance.filter((a: any) => studentIds.includes(a.studentId));
      }
      if (filters.startDate && filters.endDate) {
        attendance = attendance.filter(a => {
          const attendanceDate = new Date(a.date);
          return attendanceDate >= new Date(filters.startDate) &&
                 attendanceDate <= new Date(filters.endDate);
        });
      }
      // Calculate attendance metrics
      const totalRecords = attendance.length;
      const presentCount = attendance.filter(a => a.status === 'Present').length;
      const absentCount = attendance.filter(a => a.status === 'Absent').length;
      const lateCount = attendance.filter(a => a.status === 'Late').length;
      const excusedCount = attendance.filter(a => a.status === 'Excused').length;

      const attendanceRate = totalRecords > 0 ?
        Math.round((presentCount / totalRecords) * 100) : 0;

      return {
        totalRecords,
        attendanceRate,
        statusBreakdown: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount
        },
        dailyTrends: this.calculateDailyAttendanceTrends(attendance),
        classComparison: await this.calculateClassAttendanceComparison()
      };
    } catch (error) {
      return { error: 'Failed to calculate attendance analytics' };
    }
  }

  private calculateGradeDistribution(examResults: any[]): any {
    const grades = { A: 0, B: 0, C: 0, D: 0, F: 0 };

    examResults.forEach(result => {
      const percentage = (result.obtainedMarks / result.totalMarks) * 100;
      if (percentage >= 90) grades.A++;
      else if (percentage >= 80) grades.B++;
      else if (percentage >= 70) grades.C++;
      else if (percentage >= 60) grades.D++;
      else grades.F++;
    });

    return Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  }
  private async calculateSubjectPerformance(examResults: any[], subjects: any[]): Promise<any[]> {
    const subjectMap = new Map();
    subjects.forEach(s => subjectMap.set(s.id, s.name));

    const performance = new Map();
    examResults.forEach(result => {
      const examSubject = result.examId; // Would need to join with exams table in real implementation
      if (!performance.has(examSubject)) {
        performance.set(examSubject, { total: 0, count: 0 });
      }
      const current = performance.get(examSubject);
      current.total += result.obtainedMarks;
      current.count += 1;
    });

    return Array.from(performance.entries()).map(([subjectId, data]) => ({
      subject: subjectMap.get(subjectId) || 'Unknown',
      average: Math.round((data.total / data.count) * 100) / 100,
      examCount: data.count
    }));
  }
  private calculatePerformanceTrends(examResults: any[]): any[] {
    // Simplified trend calculation - group by month
    const trends = new Map();
    examResults.forEach(result => {
      const month = new Date(result.createdAt).toLocaleString('default', { month: 'short' });
      if (!trends.has(month)) {
        trends.set(month, { total: 0, count: 0 });
      }
      const current = trends.get(month);
      current.total += result.obtainedMarks;
      current.count += 1;
    });

    return Array.from(trends.entries()).map(([month, data]) => ({
      month,
      average: Math.round((data.total / data.count) * 100) / 100
    }));
  }
  private calculateStudentPerformance(examResults: any[]): any[] {
    const performance = new Map();
    examResults.forEach(result => {
      if (!performance.has(result.studentId)) {
        performance.set(result.studentId, { total: 0, count: 0 });
      }
      const current = performance.get(result.studentId);
      current.total += result.obtainedMarks;
      current.count += 1;
    });

    return Array.from(performance.entries())
      .map(([studentId, data]) => ({
        studentId,
        average: Math.round((data.total / data.count) * 100) / 100,
        examCount: data.count
      }))
      .sort((a, b) => b.average - a.average);
  }
  private calculateDailyAttendanceTrends(attendance: any[]): any[] {
    const trends = new Map();
    attendance.forEach(record => {
      const date = record.date;
      if (!trends.has(date)) {
        trends.set(date, { present: 0, total: 0 });
      }
      const current = trends.get(date);
      current.total += 1;
      if (record.status === 'Present') current.present += 1;
    });

    return Array.from(trends.entries()).map(([date, data]) => ({
      date,
      rate: Math.round((data.present / data.total) * 100)
    }));
  }
  private async calculateClassAttendanceComparison(): Promise<any[]> {
    try {
      const classes: Class[] = await db.select().from(REPLACED_classes);
      return classes.map(cls => ({
        className: cls.name,
        attendanceRate: 85 + Math.floor(Math.random() * 15), // Simplified for demo
        level: cls.level
      }));
    } catch (error) {
      return [];
    }
  }

  private getFallbackAnalytics(): any {
    return {
      totalUsers: 0,
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      totalSubjects: 0,
      error: 'Unable to calculate analytics - database unavailable'
    };
  }
  // Contact messages management - ensuring 100% database persistence
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const result = await this.db.insert(REPLACED_contactMessages).values(message).returning();
    return result[0];
  }
  async getContactMessages(): Promise<ContactMessage[]> {
    return await this.db.select().from(REPLACED_contactMessages).orderBy(desc(REPLACED_contactMessages.createdAt));
  }
  // Report finalization methods
  async getExamResultById(id: number): Promise<ExamResult | undefined> {
    try {
      const result = await this.db.select().from(REPLACED_examResults)
        .where(eq(REPLACED_examResults.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      return undefined;
    }
  }

  async getFinalizedReportsByExams(examIds: number[], filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
  }): Promise<any[]> {
    try {
      // This would be a complex query joining exam results with exams, students, and subjects
      // For now, return a simplified version
      const results = await this.db.select().from(REPLACED_examResults)
        .where(and(
          inArray(REPLACED_examResults.examId, examIds),
          // Add teacherFinalized field check when column exists
          // eq(REPLACED_examResults.teacherFinalized, true)
        ))
        .orderBy(desc(REPLACED_examResults.createdAt));

      return results;
    } catch (error) {
      return [];
    }
  }

  async getAllFinalizedReports(filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
  }): Promise<any[]> {
    try {
      // This would be a complex query for admins to see all finalized reports
      const results = await this.db.select().from(REPLACED_examResults)
        .orderBy(desc(REPLACED_examResults.createdAt));

      return results;
    } catch (error) {
      return [];
    }
  }

  async getContactMessageById(id: number): Promise<ContactMessage | undefined> {
    const result = await this.db.select().from(REPLACED_contactMessages).where(eq(REPLACED_contactMessages.id, id)).limit(1);
    return result[0];
  }
  async markContactMessageAsRead(id: number): Promise<boolean> {
    const result = await this.db.update(REPLACED_contactMessages)
      .set({ isRead: true })
      .where(eq(REPLACED_contactMessages.id, id))
      .returning();
    return result.length > 0;
  }
  async respondToContactMessage(id: number, response: string, respondedBy: string): Promise<ContactMessage | undefined> {
    const result = await this.db.update(REPLACED_contactMessages)
      .set({
        response,
        respondedBy,
        respondedAt: new Date(),
        isRead: true
      })
      .where(eq(REPLACED_contactMessages.id, id))
      .returning();
    return result[0];
  }
  // Performance monitoring implementation
  async logPerformanceEvent(event: InsertPerformanceEvent): Promise<PerformanceEvent> {
    const result = await this.db.insert(REPLACED_performanceEvents).values(event).returning();
    return result[0];
  }
  async getPerformanceMetrics(hours: number = 24): Promise<{
    totalEvents: number;
    goalAchievementRate: number;
    averageDuration: number;
    slowSubmissions: number;
    eventsByType: Record<string, number>;
  }> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const sinceISO = since.toISOString();

      const events = await this.db.select()
        .from(REPLACED_performanceEvents)
        .where(sql`${REPLACED_performanceEvents.createdAt} >= ${sinceISO}`);

      const totalEvents = events.length;
      const goalAchievedCount = events.filter((e: PerformanceEvent) => e.goalAchieved).length;
      const goalAchievementRate = totalEvents > 0 ? (goalAchievedCount / totalEvents) * 100 : 0;

      const averageDuration = totalEvents > 0
        ? events.reduce((sum: number, e: PerformanceEvent) => sum + e.duration, 0) / totalEvents
        : 0;

      const slowSubmissions = events.filter((e: PerformanceEvent) => e.duration > 2000).length;

      const eventsByType: Record<string, number> = {};
      events.forEach((e: PerformanceEvent) => {
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
      // Return a default structure to prevent errors downstream
      return {
        totalEvents: 0,
        goalAchievementRate: 0,
        averageDuration: 0,
        slowSubmissions: 0,
        eventsByType: {},
      };
    }
  }

  async getRecentPerformanceAlerts(hours: number = 24): Promise<PerformanceEvent[]> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      const sinceISO = since.toISOString();

      const alerts = await this.db.select()
        .from(REPLACED_performanceEvents)
        .where(and(
          sql`${REPLACED_performanceEvents.createdAt} >= ${sinceISO}`,
          eq(REPLACED_performanceEvents.goalAchieved, false)
        ))
        .orderBy(desc(REPLACED_performanceEvents.createdAt))
        .limit(50);
      return alerts;
    } catch (error) {
      return [];
    }
  }

  // Teacher class assignments implementation
  async createTeacherClassAssignment(assignment: InsertTeacherClassAssignment): Promise<TeacherClassAssignment> {
    const result = await this.db.insert(REPLACED_teacherClassAssignments).values(assignment).returning();
    return result[0];
  }
  async getTeacherClassAssignments(teacherId: string): Promise<TeacherClassAssignment[]> {
    return await this.db.select()
      .from(REPLACED_teacherClassAssignments)
      .where(and(
        eq(REPLACED_teacherClassAssignments.teacherId, teacherId),
        eq(REPLACED_teacherClassAssignments.isActive, true)
      ))
      .orderBy(REPLACED_teacherClassAssignments.createdAt);
  }
  async getTeachersForClassSubject(classId: number, subjectId: number): Promise<User[]> {
    const assignments = await this.db.select({
      user: REPLACED_users
    })
      .from(REPLACED_teacherClassAssignments)
      .innerJoin(REPLACED_users, eq(REPLACED_teacherClassAssignments.teacherId, REPLACED_users.id))
      .where(and(
        eq(REPLACED_teacherClassAssignments.classId, classId),
        eq(REPLACED_teacherClassAssignments.subjectId, subjectId),
        eq(REPLACED_teacherClassAssignments.isActive, true)
      ));

    return assignments.map((a: any) => a.user);
  }
  async updateTeacherClassAssignment(id: number, assignment: Partial<InsertTeacherClassAssignment>): Promise<TeacherClassAssignment | undefined> {
    const result = await this.db.update(REPLACED_teacherClassAssignments)
      .set(assignment)
      .where(eq(REPLACED_teacherClassAssignments.id, id))
      .returning();
    return result[0];
  }
  async deleteTeacherClassAssignment(id: number): Promise<boolean> {
    const result = await this.db.delete(REPLACED_teacherClassAssignments)
      .where(eq(REPLACED_teacherClassAssignments.id, id))
      .returning();
    return result.length > 0;
  }
  // Teacher timetable implementation
  async createTimetableEntry(entry: REPLACED_InsertTimetable): Promise<REPLACED_Timetable> {
    const result = await this.db.insert(REPLACED_timetable).values(entry).returning();
    return result[0];
  }
  async getTimetableByTeacher(teacherId: string, termId?: number): Promise<REPLACED_Timetable[]> {
    const conditions = [
      eq(REPLACED_timetable.teacherId, teacherId),
      eq(REPLACED_timetable.isActive, true)
    ];

    if (termId) {
      conditions.push(eq(REPLACED_timetable.termId, termId));
    }
    return await this.db.select()
      .from(REPLACED_timetable)
      .where(and(...conditions))
      .orderBy(REPLACED_timetable.dayOfWeek, REPLACED_timetable.startTime);
  }
  async updateTimetableEntry(id: number, entry: Partial<REPLACED_InsertTimetable>): Promise<REPLACED_Timetable | undefined> {
    const result = await this.db.update(REPLACED_timetable)
      .set(entry)
      .where(eq(REPLACED_timetable.id, id))
      .returning();
    return result[0];
  }
  async deleteTimetableEntry(id: number): Promise<boolean> {
    const result = await this.db.delete(REPLACED_timetable)
      .where(eq(REPLACED_timetable.id, id))
      .returning();
    return result.length > 0;
  }
  // Teacher dashboard data - comprehensive method
  async getTeacherDashboardData(teacherId: string): Promise<{
    profile: REPLACED_TeacherProfile | undefined;
    user: User | undefined;
    assignments: Array<{
      id: number;
      className: string;
      subjectName: string;
      subjectCode: string;
      classLevel: string;
      termName?: string;
    }>;
    timetable: Array<{
      id: number;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      className: string;
      subjectName: string;
      location: string | null;
    }>;
  }> {
    const profile = await this.getTeacherProfile(teacherId);
    const user = await this.getUser(teacherId);

    const assignmentsData = await this.db.select({
      id: REPLACED_teacherClassAssignments.id,
      className: REPLACED_classes.name,
      classLevel: REPLACED_classes.level,
      subjectName: REPLACED_subjects.name,
      subjectCode: REPLACED_subjects.code,
      termName: REPLACED_academicTerms.name,
    })
      .from(REPLACED_teacherClassAssignments)
      .innerJoin(REPLACED_classes, eq(REPLACED_teacherClassAssignments.classId, REPLACED_classes.id))
      .innerJoin(REPLACED_subjects, eq(REPLACED_teacherClassAssignments.subjectId, REPLACED_subjects.id))
      .leftJoin(REPLACED_academicTerms, eq(REPLACED_teacherClassAssignments.termId, REPLACED_academicTerms.id))
      .where(and(
        eq(REPLACED_teacherClassAssignments.teacherId, teacherId),
        eq(REPLACED_teacherClassAssignments.isActive, true)
      ))
      .orderBy(REPLACED_classes.name, REPLACED_subjects.name);

    const timetableData = await this.db.select({
      id: REPLACED_timetable.id,
      dayOfWeek: REPLACED_timetable.dayOfWeek,
      startTime: REPLACED_timetable.startTime,
      endTime: REPLACED_timetable.endTime,
      location: REPLACED_timetable.location,
      className: REPLACED_classes.name,
      subjectName: REPLACED_subjects.name,
    })
      .from(REPLACED_timetable)
      .innerJoin(REPLACED_classes, eq(REPLACED_timetable.classId, REPLACED_classes.id))
      .innerJoin(REPLACED_subjects, eq(REPLACED_timetable.subjectId, REPLACED_subjects.id))
      .where(and(
        eq(REPLACED_timetable.teacherId, teacherId),
        eq(REPLACED_timetable.isActive, true)
      ))
      .orderBy(REPLACED_timetable.dayOfWeek, REPLACED_timetable.startTime);

    return {
      profile,
      user,
      assignments: assignmentsData,
      timetable: timetableData,
    };
  }
  // Manual grading task queue
  async createGradingTask(task: InsertGradingTask): Promise<GradingTask> {
    try {
      const result = await this.db.insert(REPLACED_gradingTasks).values(task).returning();
      return result[0];
    } catch (error: any) {
      if (error?.cause?.code === '42P01') {
        return { id: 0, ...task } as GradingTask;
      }
      throw error;
    }
  }

  async assignGradingTask(taskId: number, teacherId: string): Promise<GradingTask | undefined> {
    try {
      const result = await this.db.update(REPLACED_gradingTasks)
        .set({
          assignedTeacherId: teacherId,
          assignedAt: new Date(),
          status: 'in_progress'
        })
        .where(eq(REPLACED_gradingTasks.id, taskId))
        .returning();
      return result[0];
    } catch (error: any) {
      if (error?.cause?.code === '42P01') {
        return undefined;
      }
      throw error;
    }
  }

  async getGradingTasksByTeacher(teacherId: string, status?: string): Promise<GradingTask[]> {
    try {
      let query = this.db.select().from(REPLACED_gradingTasks)
        .where(eq(REPLACED_gradingTasks.assignedTeacherId, teacherId))
        .orderBy(desc(REPLACED_gradingTasks.priority), asc(REPLACED_gradingTasks.createdAt));

      if (status) {
        query = query.where(and(
          eq(REPLACED_gradingTasks.assignedTeacherId, teacherId),
          eq(REPLACED_gradingTasks.status, status)
        ));
      }
      return await query;
    } catch (error: any) {
      if (error?.cause?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async getGradingTasksBySession(sessionId: number): Promise<GradingTask[]> {
    try {
      return await this.db.select().from(REPLACED_gradingTasks)
        .where(eq(REPLACED_gradingTasks.sessionId, sessionId))
        .orderBy(desc(REPLACED_gradingTasks.priority), asc(REPLACED_gradingTasks.createdAt));
    } catch (error: any) {
      if (error?.cause?.code === '42P01') {
        return [];
      }
      throw error;
    }
  }

  async updateGradingTaskStatus(taskId: number, status: string, completedAt?: Date): Promise<GradingTask | undefined> {
    try {
      const updateData: any = { status };
      if (completedAt) {
        updateData.completedAt = completedAt;
      }
      const result = await this.db.update(REPLACED_gradingTasks)
        .set(updateData)
        .where(eq(REPLACED_gradingTasks.id, taskId))
        .returning();
      return result[0];
    } catch (error: any) {
      if (error?.cause?.code === '42P01') {
        return undefined;
      }
      throw error;
    }
  }

  async completeGradingTask(taskId: number, pointsEarned: number, feedbackText?: string): Promise<{ task: GradingTask; answer: StudentAnswer } | undefined> {
    try {
      return await this.db.transaction(async (tx: any) => {
        // Get the task
        const tasks = await tx.select().from(REPLACED_gradingTasks)
          .where(eq(REPLACED_gradingTasks.id, taskId))
          .limit(1);

        if (tasks.length === 0) {
          return undefined;
        }
        const task = tasks[0];

        // Update the student answer
        const answers = await tx.update(REPLACED_studentAnswers)
          .set({
            pointsEarned,
            feedbackText,
            autoScored: false,
            manualOverride: true
          })
          .where(eq(REPLACED_studentAnswers.id, task.answerId))
          .returning();

        // Mark task as completed
        const updatedTasks = await tx.update(REPLACED_gradingTasks)
          .set({
            status: 'completed',
            completedAt: new Date()
          })
          .where(eq(REPLACED_gradingTasks.id, taskId))
          .returning();

        return {
          task: updatedTasks[0],
          answer: answers[0]
        };
      });
    } catch (error: any) {
      if (error?.cause?.code === '42P01') {
        return undefined;
      }
      throw error;
    }
  }

  // Audit logging implementation
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await this.db.insert(REPLACED_auditLogs).values(log).returning();
    return result[0];
  }
  async getAuditLogs(filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(REPLACED_auditLogs.userId, filters.userId));
    }
    if (filters?.entityType) {
      conditions.push(eq(REPLACED_auditLogs.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(REPLACED_auditLogs.entityId, filters.entityId));
    }
    if (filters?.action) {
      conditions.push(eq(REPLACED_auditLogs.action, filters.action));
    }
    if (filters?.startDate) {
      conditions.push(dsql`${REPLACED_auditLogs.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(dsql`${REPLACED_auditLogs.createdAt} <= ${filters.endDate}`);
    }
    let query = this.db.select()
      .from(REPLACED_auditLogs)
      .orderBy(desc(REPLACED_auditLogs.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }
    return await query;
  }
  async getAuditLogsByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    return await this.db.select()
      .from(REPLACED_auditLogs)
      .where(and(
        eq(REPLACED_auditLogs.entityType, entityType),
        eq(REPLACED_auditLogs.entityId, entityId)
      ))
      .orderBy(desc(REPLACED_auditLogs.createdAt));
  }
  // Notification management implementation
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const result = await this.db.insert(REPLACED_notifications).values(notification).returning();
    return result[0];
  }
  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await this.db.select()
      .from(REPLACED_notifications)
      .where(eq(REPLACED_notifications.userId, userId))
      .orderBy(desc(REPLACED_notifications.createdAt));
  }
  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await this.db.select({ count: dsql<number>`count(*)::int` })
      .from(REPLACED_notifications)
      .where(and(
        eq(REPLACED_notifications.userId, userId),
        eq(REPLACED_notifications.isRead, false)
      ));
    return result[0]?.count || 0;
  }
  async markNotificationAsRead(notificationId: number): Promise<Notification | undefined> {
    const result = await this.db.update(REPLACED_notifications)
      .set({ isRead: true })
      .where(eq(REPLACED_notifications.id, notificationId))
      .returning();
    return result[0];
  }
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await this.db.update(REPLACED_notifications)
      .set({ isRead: true })
      .where(and(
        eq(REPLACED_notifications.userId, userId),
        eq(REPLACED_notifications.isRead, false)
      ));
  }
  // Password reset attempt tracking for rate limiting
  async createPasswordResetAttempt(identifier: string, ipAddress: string, success: boolean): Promise<any> {
    const result = await this.db.insert(REPLACED_passwordResetAttempts).values({
      identifier,
      ipAddress,
      success,
    }).returning();
    return result[0];
  }
  async getRecentPasswordResetAttempts(identifier: string, minutesAgo: number): Promise<any[]> {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    return await this.db.select()
      .from(REPLACED_passwordResetAttempts)
      .where(and(
        eq(REPLACED_passwordResetAttempts.identifier, identifier),
        dsql`${REPLACED_passwordResetAttempts.attemptedAt} > ${cutoffTime}`
      ))
      .orderBy(desc(REPLACED_passwordResetAttempts.attemptedAt));
  }
  async deleteOldPasswordResetAttempts(hoursAgo: number): Promise<boolean> {
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    await this.db.delete(REPLACED_passwordResetAttempts)
      .where(dsql`${REPLACED_passwordResetAttempts.attemptedAt} < ${cutoffTime}`);
    return true;
  }
  // Account security methods
  async lockAccount(userId: string, lockUntil: Date): Promise<boolean> {
    const result = await this.db.update(REPLACED_users)
      .set({ accountLockedUntil: lockUntil })
      .where(eq(REPLACED_users.id, userId))
      .returning();
    return result.length > 0;
  }
  async unlockAccount(userId: string): Promise<boolean> {
    const result = await this.db.update(REPLACED_users)
      .set({ accountLockedUntil: null })
      .where(eq(REPLACED_users.id, userId))
      .returning();
    return result.length > 0;
  }
  async isAccountLocked(userId: string): Promise<boolean> {
    const user = await this.db.select({ accountLockedUntil: REPLACED_users.accountLockedUntil })
      .from(REPLACED_users)
      .where(eq(REPLACED_users.id, userId))
      .limit(1);

    if (!user[0] || !user[0].accountLockedUntil) {
      return false;
    }
    return new Date(user[0].accountLockedUntil) > new Date();
  }
  // Admin recovery powers
  async adminResetUserPassword(userId: string, newPasswordHash: string, resetBy: string, forceChange: boolean): Promise<boolean> {
    const result = await this.db.update(REPLACED_users)
      .set({
        passwordHash: newPasswordHash,
        mustChangePassword: forceChange
      })
      .where(eq(REPLACED_users.id, userId))
      .returning();

    if (result.length > 0) {
      await this.createAuditLog({
        userId: resetBy,
        action: 'admin_password_reset',
        entityType: 'user',
        entityId: '0',
        oldValue: null,
        newValue: JSON.stringify({ targetUserId: userId, forceChange }),
        reason: 'Admin initiated password reset',
        ipAddress: null,
        userAgent: null,
      });
    }
    return result.length > 0;
  }
  async updateRecoveryEmail(userId: string, recoveryEmail: string, updatedBy: string): Promise<boolean> {
    const oldUser = await this.getUser(userId);
    const result = await this.db.update(REPLACED_users)
      .set({ recoveryEmail })
      .where(eq(REPLACED_users.id, userId))
      .returning();

    if (result.length > 0) {
      await this.createAuditLog({
        userId: updatedBy,
        action: 'recovery_email_updated',
        entityType: 'user',
        entityId: '0',
        oldValue: oldUser?.recoveryEmail || null,
        newValue: recoveryEmail,
        reason: 'Recovery email updated by admin',
        ipAddress: null,
        userAgent: null,
      });
    }
    return result.length > 0;
  }
  // NEW METHODS FOR EXAM PUBLISHING
  async getScheduledExamsToPublish(now: Date): Promise<Exam[]> {
    // Convert Date to ISO string for PostgreSQL compatibility
    const nowISO = now.toISOString();
    return await this.db
      .select()
      .from(REPLACED_exams)
      .where(
        and(
          eq(REPLACED_exams.isPublished, false),
          dsql`${REPLACED_exams.startTime} <= ${nowISO}`,
          eq(REPLACED_exams.timerMode, 'global') // Only publish global timer exams automatically
        )
      )
      .limit(50);
  }
  // Settings management methods (Module 1)
  async getSetting(key: string): Promise<any | undefined> {
    const result = await this.db
      .select()
      .from(REPLACED_settings)
      .where(eq(REPLACED_settings.key, key))
      .limit(1);
    return result[0];
  }
  async getAllSettings(): Promise<any[]> {
    return await this.db
      .select()
      .from(REPLACED_settings)
      .orderBy(asc(REPLACED_settings.key));
  }
  async createSetting(setting: any): Promise<any> {
    const result = await this.db
      .insert(REPLACED_settings)
      .values(setting)
      .returning();
    return result[0];
  }
  async updateSetting(key: string, value: string, updatedBy: string): Promise<any | undefined> {
    const result = await this.db
      .update(REPLACED_settings)
      .set({ value, updatedBy, updatedAt: new Date() })
      .where(eq(REPLACED_settings.key, key))
      .returning();
    return result[0];
  }
  async deleteSetting(key: string): Promise<boolean> {
    const result = await this.db
      .delete(REPLACED_settings)
      .where(eq(REPLACED_settings.key, key))
      .returning();
    return result.length > 0;
  }
  // Counters for atomic sequence generation (Module 1)
  async getNextSequence(classCode: string, year: string): Promise<number> {
    // Use PostgreSQL's UPSERT with atomic increment to prevent race conditions
    const result = await this.db
      .insert(REPLACED_counters)
      .values({
        classCode,
        year,
        sequence: 1
      })
      .onConflictDoUpdate({
        target: [REPLACED_counters.classCode, REPLACED_counters.year],
        set: {
          sequence: dsql`${REPLACED_counters.sequence} + 1`,
          updatedAt: new Date()
        }
      })
      .returning();
    
    return result[0].sequence;
  }
  async getCounter(classCode: string, year: string): Promise<any | undefined> {
    const result = await this.db
      .select()
      .from(REPLACED_counters)
      .where(
        and(
          eq(REPLACED_counters.classCode, classCode),
          eq(REPLACED_counters.year, year)
        )
      )
      .limit(1);
    return result[0];
  }
  async resetCounter(classCode: string, year: string): Promise<boolean> {
    const result = await this.db
      .update(REPLACED_counters)
      .set({ sequence: 0, updatedAt: new Date() })
      .where(
        and(
          eq(REPLACED_counters.classCode, classCode),
          eq(REPLACED_counters.year, year)
        )
      )
      .returning();
    return result.length > 0;
  }
  // Job Vacancy System implementations
  async createVacancy(vacancy: REPLACED_InsertVacancy): Promise<REPLACED_Vacancy> {
    const result = await this.db.insert(REPLACED_vacancies).values(vacancy).returning();
    return result[0];
  }
  async getVacancy(id: string): Promise<REPLACED_Vacancy | undefined> {
    const result = await this.db.select().from(REPLACED_vacancies).where(eq(REPLACED_vacancies.id, id)).limit(1);
    return result[0];
  }
  async getAllVacancies(status?: string): Promise<REPLACED_Vacancy[]> {
    if (status) {
      return await this.db.select().from(REPLACED_vacancies).where(eq(REPLACED_vacancies.status, status as "open" | "closed" | "filled")).orderBy(desc(REPLACED_vacancies.createdAt));
    }
    return await this.db.select().from(REPLACED_vacancies).orderBy(desc(REPLACED_vacancies.createdAt));
  }
  async updateVacancy(id: string, updates: Partial<REPLACED_InsertVacancy>): Promise<REPLACED_Vacancy | undefined> {
    const result = await this.db
      .update(REPLACED_vacancies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(REPLACED_vacancies.id, id))
      .returning();
    return result[0];
  }
  async deleteVacancy(id: string): Promise<boolean> {
    const result = await this.db.delete(REPLACED_vacancies).where(eq(REPLACED_vacancies.id, id)).returning();
    return result.length > 0;
  }
  // Teacher Applications implementations
  async createTeacherApplication(application: REPLACED_InsertTeacherApplication): Promise<REPLACED_TeacherApplication> {
    const result = await this.db.insert(REPLACED_teacherApplications).values(application).returning();
    return result[0];
  }
  async getTeacherApplication(id: string): Promise<REPLACED_TeacherApplication | undefined> {
    const result = await this.db.select().from(REPLACED_teacherApplications).where(eq(REPLACED_teacherApplications.id, id)).limit(1);
    return result[0];
  }
  async getAllTeacherApplications(status?: string): Promise<REPLACED_TeacherApplication[]> {
    if (status) {
      return await this.db.select().from(REPLACED_teacherApplications).where(eq(REPLACED_teacherApplications.status, status as "pending" | "approved" | "rejected")).orderBy(desc(REPLACED_teacherApplications.dateApplied));
    }
    return await this.db.select().from(REPLACED_teacherApplications).orderBy(desc(REPLACED_teacherApplications.dateApplied));
  }
  async updateTeacherApplication(id: string, updates: Partial<REPLACED_TeacherApplication>): Promise<REPLACED_TeacherApplication | undefined> {
    const result = await this.db
      .update(REPLACED_teacherApplications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(REPLACED_teacherApplications.id, id))
      .returning();
    return result[0];
  }
  async approveTeacherApplication(applicationId: string, approvedBy: string): Promise<{ application: REPLACED_TeacherApplication; approvedTeacher: REPLACED_ApprovedTeacher }> {
    const application = await this.getTeacherApplication(applicationId);
    if (!application) {
      throw new Error('Application not found');
    }
    // Update application status
    const updatedApplication = await this.db
      .update(REPLACED_teacherApplications)
      .set({
        status: 'approved',
        reviewedBy: approvedBy,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(REPLACED_teacherApplications.id, applicationId))
      .returning();

    // Add to approved teachers
    const approvedTeacher = await this.db
      .insert(REPLACED_approvedTeachers)
      .values({
        applicationId: applicationId,
        googleEmail: application.googleEmail,
        fullName: application.fullName,
        subjectSpecialty: application.subjectSpecialty,
        approvedBy: approvedBy,
      })
      .returning();

    return {
      application: updatedApplication[0],
      approvedTeacher: approvedTeacher[0],
    };
  }
  async rejectTeacherApplication(applicationId: string, reviewedBy: string, reason: string): Promise<REPLACED_TeacherApplication | undefined> {
    const result = await this.db
      .update(REPLACED_teacherApplications)
      .set({
        status: 'rejected',
        reviewedBy: reviewedBy,
        reviewedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date(),
      })
      .where(eq(REPLACED_teacherApplications.id, applicationId))
      .returning();
    return result[0];
  }
  // Approved Teachers implementations
  async getApprovedTeacherByEmail(email: string): Promise<REPLACED_ApprovedTeacher | undefined> {
    const result = await this.db.select().from(REPLACED_approvedTeachers).where(eq(REPLACED_approvedTeachers.googleEmail, email)).limit(1);
    return result[0];
  }
  async getAllApprovedTeachers(): Promise<REPLACED_ApprovedTeacher[]> {
    return await this.db.select().from(REPLACED_approvedTeachers).orderBy(desc(REPLACED_approvedTeachers.dateApproved));
  }
  async deleteApprovedTeacher(id: string): Promise<boolean> {
    const result = await this.db.delete(REPLACED_approvedTeachers).where(eq(REPLACED_approvedTeachers.id, id)).returning();
    return result.length > 0;
  }
  // Super Admin implementations
  async getSuperAdminStats(): Promise<{
    totalAdmins: number;
    totalUsers: number;
    activeSessions: number;
    totalExams: number;
  }> {
    const [admins, users, exams] = await Promise.all([
      this.getUsersByRole(1), // Admins have roleId 1
      this.getAllUsers(),
      this.db.select().from(REPLACED_exams),
    ]);

    // Count active sessions (users logged in recently, within last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const activeSessions = users.filter(u => u.updatedAt && u.updatedAt > oneHourAgo).length;

    return {
      totalAdmins: admins.length,
      totalUsers: users.length,
      activeSessions,
      totalExams: exams.length,
    };
  }
  async getSystemSettings(): Promise<REPLACED_SystemSettings | undefined> {
    const result = await this.db.select().from(REPLACED_systemSettings).limit(1);
    return result[0];
  }
  async updateSystemSettings(settings: Partial<REPLACED_InsertSystemSettings>): Promise<REPLACED_SystemSettings> {
    // Get existing settings
    const existing = await this.getSystemSettings();
    
    if (existing) {
      // Update existing settings
      const result = await this.db
        .update(REPLACED_systemSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(REPLACED_systemSettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      // Create new settings if none exist
      const result = await this.db
        .insert(REPLACED_systemSettings)
        .values(settings)
        .returning();
      return result[0];
    }
  }
}
// Initialize storage - PostgreSQL database only
function initializeStorageSync(): IStorage {
  // CRITICAL: Only use PostgreSQL database - no memory storage fallback
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

// Initialize storage - PostgreSQL database only
export const storage: IStorage = initializeStorageSync();