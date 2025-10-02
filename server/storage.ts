import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { eq, and, desc, asc, sql, sql as dsql, inArray } from "drizzle-orm";
import type {
  User, InsertUser, Student, InsertStudent, Class, InsertClass,
  Subject, InsertSubject, Attendance, InsertAttendance, Exam, InsertExam,
  ExamResult, InsertExamResult, Announcement, InsertAnnouncement,
  Message, InsertMessage, Gallery, InsertGallery, GalleryCategory, InsertGalleryCategory,
  HomePageContent, InsertHomePageContent, ContactMessage, InsertContactMessage,
  Role, AcademicTerm, ExamQuestion, InsertExamQuestion, QuestionOption, InsertQuestionOption,
  ExamSession, InsertExamSession, StudentAnswer, InsertStudentAnswer,
  StudyResource, InsertStudyResource, PerformanceEvent, InsertPerformanceEvent,
  TeacherClassAssignment, InsertTeacherClassAssignment, GradingTask, InsertGradingTask, AuditLog, InsertAuditLog, ReportCard, ReportCardItem
} from "@shared/schema";

// Configure PostgreSQL connection for Supabase (lazy initialization)
let pg: any;
let db: any;

function initializeDatabase() {
  if (!pg && process.env.DATABASE_URL) {
    console.log("🔗 CONNECTING TO POSTGRESQL DATABASE:", process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));

    // Enhanced connection pool configuration for optimal performance
    const connectionConfig = {
      ssl: { rejectUnauthorized: false }, // Supabase handles SSL certificates properly
      prepare: false, // Required for Supabase transaction pooler

      // Optimized connection pool settings
      max: 20, // Maximum connections in pool (increased from default 10)
      idle_timeout: 300, // Close idle connections after 5 minutes
      connect_timeout: 30, // Connection timeout: 30 seconds
      max_lifetime: 3600, // Maximum connection lifetime: 1 hour

      // Enhanced logging for debugging (development only)
      debug: process.env.NODE_ENV === 'development' ? (connection: any, query: any, params: any) => {
        // Only log queries if they contain error indicators or are long-running
        const queryString = typeof query === 'string' ? query : query?.text || String(query);
        if (queryString?.includes('ERROR') || queryString?.includes('TIMEOUT')) {
          console.warn(`🔍 Database Debug - Query: ${queryString.slice(0, 100)}...`);
        }
      } : false,

      // Connection health checks
      onnotice: (notice: any) => {
        if (notice.severity === 'WARNING' || notice.severity === 'ERROR') {
          console.warn(`📊 Database Notice [${notice.severity}]: ${notice.message}`);
        }
      },

      // Connection parameter logging
      onparameter: (key: string, value: any) => {
        if (key === 'server_version') {
          console.log(`🗄️ Connected to PostgreSQL version: ${value}`);
        } else if (key === 'application_name') {
          console.log(`📱 Application name set: ${value}`);
        }
      },

      // Connection lifecycle events
      onconnect: async (connection: any) => {
        // Set application name and timeout settings at connection time
        try {
          await connection.query('SET application_name = $1', ['treasure_home_school']);
          await connection.query('SET statement_timeout = $1', ['60s']);
          await connection.query('SET lock_timeout = $1', ['30s']);
        } catch (error) {
          console.warn('⚠️ Failed to set connection parameters:', error);
        }
      }
    };

    pg = postgres(process.env.DATABASE_URL, connectionConfig);
    db = drizzle(pg, { schema });
    console.log("✅ POSTGRESQL DATABASE CONNECTION ESTABLISHED");
    console.log(`📊 Connection Pool: max=${connectionConfig.max}, idle_timeout=${connectionConfig.idle_timeout}s`);
  } else if (!process.env.DATABASE_URL) {
    console.log("⚠️  WARNING: DATABASE_URL not set - falling back to memory storage");
  }
  return { pg, db };
}

// Export db for migrations (initialize if needed)
const { db: exportDb } = initializeDatabase();
export { exportDb as db };

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUsersByRole(roleId: number): Promise<User[]>;

  // Role management
  getRoles(): Promise<Role[]>;
  getRoleByName(name: string): Promise<Role | undefined>;

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
  updateExamQuestion(id: number, question: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined>;
  deleteExamQuestion(id: number): Promise<boolean>;
  getExamQuestionCount(examId: number): Promise<number>;
  getExamQuestionCounts(examIds: number[]): Promise<Record<number, number>>;

  // Question options management
  createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption>;
  getQuestionOptions(questionId: number): Promise<QuestionOption[]>;
  getQuestionOptionsBulk(questionIds: number[]): Promise<QuestionOption[]>;

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
  updateStudentAnswer(id: number, answer: Partial<InsertStudentAnswer>): Promise<StudentAnswer | undefined>;

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

  // Manual grading task queue
  createGradingTask(task: InsertGradingTask): Promise<GradingTask>;
  assignGradingTask(taskId: number, teacherId: string): Promise<GradingTask | undefined>;
  getGradingTasksByTeacher(teacherId: string, status?: string): Promise<GradingTask[]>;
  getGradingTasksBySession(sessionId: number): Promise<GradingTask[]>;
  updateGradingTaskStatus(taskId: number, status: string, completedAt?: Date): Promise<GradingTask | undefined>;
  completeGradingTask(taskId: number, pointsEarned: number, feedbackText?: string): Promise<{ task: GradingTask; answer: StudentAnswer } | undefined>;

  // Audit logging
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    userId?: string;
    entityType?: string;
    entityId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]>;
  getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]>;

  // Grading system methods
  getGradingTasks(teacherId: string, status?: string): Promise<any[]>;
  submitManualGrade(gradeData: { taskId: number; score: number; comment: string; graderId: string }): Promise<any>;
  getAllExamSessions(): Promise<any[]>;
  getExamReports(filters: { subjectId?: number; classId?: number }): Promise<any[]>;
  getExamStudentReports(examId: number): Promise<any[]>;
  logPerformanceEvent(event: any): Promise<any>;
  getExpiredExamSessions(cutoffTime: Date, limit: number): Promise<any[]>;
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

  console.warn('Failed to normalize UUID:', raw);
  return undefined;
}

export class DatabaseStorage implements IStorage {
  public db: any;

  constructor() {
    const { db } = initializeDatabase();
    this.db = db;
    if (!this.db) {
      throw new Error('Database not available - DATABASE_URL not set or invalid');
    }
  }

  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    const user = result[0];
    if (user && user.id) {
      const normalizedId = normalizeUuid(user.id);
      if (normalizedId) {
        user.id = normalizedId;
      }
    }
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
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

  async getAllUsernames(): Promise<string[]> {
    const result = await this.db.select({ username: schema.users.username }).from(schema.users).where(sql`${schema.users.username} IS NOT NULL`);
    return result.map(r => r.username).filter((u): u is string => u !== null);
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.roleId, roleId));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return result.length > 0;
  }

  // Role management
  async getRoles(): Promise<Role[]> {
    return await db.select().from(schema.roles).orderBy(asc(schema.roles.name));
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await db.select().from(schema.roles).where(eq(schema.roles.name, name)).limit(1);
    return result[0];
  }

  // Student management
  async getStudent(id: string): Promise<Student | undefined> {
    const result = await db.select().from(schema.students).where(eq(schema.students.id, id)).limit(1);
    return result[0];
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const result = await db.insert(schema.students).values(student).returning();
    return result[0];
  }

  async updateStudent(id: string, updates: { userPatch?: Partial<InsertUser>; studentPatch?: Partial<InsertStudent> }): Promise<{ user: User; student: Student } | undefined> {
    // Use transaction to ensure both user and student are updated atomically
    return await this.db.transaction(async (tx: any) => {
      let updatedUser: User | undefined;
      let updatedStudent: Student | undefined;

      // Update user if userPatch is provided
      if (updates.userPatch && Object.keys(updates.userPatch).length > 0) {
        const userResult = await tx.update(schema.users)
          .set(updates.userPatch)
          .where(eq(schema.users.id, id))
          .returning();
        updatedUser = userResult[0];
      } else {
        // Get current user data if no updates
        const userResult = await tx.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
        updatedUser = userResult[0];
      }

      // Update student if studentPatch is provided
      if (updates.studentPatch && Object.keys(updates.studentPatch).length > 0) {
        const studentResult = await tx.update(schema.students)
          .set(updates.studentPatch)
          .where(eq(schema.students.id, id))
          .returning();
        updatedStudent = studentResult[0];
      } else {
        // Get current student data if no updates
        const studentResult = await tx.select().from(schema.students).where(eq(schema.students.id, id)).limit(1);
        updatedStudent = studentResult[0];
      }

      if (updatedUser && updatedStudent) {
        return { user: updatedUser, student: updatedStudent };
      }
      return undefined;
    });
  }

  async setUserActive(id: string, isActive: boolean): Promise<User | undefined> {
    const result = await this.db.update(schema.users)
      .set({ isActive })
      .where(eq(schema.users.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: string): Promise<boolean> {
    // Logical deletion by setting user as inactive
    // This preserves referential integrity for attendance, exams, etc.
    const result = await this.db.update(schema.users)
      .set({ isActive: false })
      .where(eq(schema.users.id, id))
      .returning();
    return result.length > 0;
  }

  async hardDeleteStudent(id: string): Promise<boolean> {
    // Hard deletion with proper cascade handling
    // Delete in correct order to respect foreign key constraints
    return await this.db.transaction(async (tx: any) => {
      try {
        // 1. Get all exam sessions for this student
        const examSessions = await tx.select({ id: schema.examSessions.id })
          .from(schema.examSessions)
          .where(eq(schema.examSessions.studentId, id));

        const sessionIds = examSessions.map((session: any) => session.id);

        // 2. Delete student answers for all their exam sessions
        if (sessionIds.length > 0) {
          await tx.delete(schema.studentAnswers)
            .where(inArray(schema.studentAnswers.sessionId, sessionIds));
        }

        // 3. Delete exam sessions for this student
        await tx.delete(schema.examSessions)
          .where(eq(schema.examSessions.studentId, id));

        // 4. Delete exam results for this student
        await tx.delete(schema.examResults)
          .where(eq(schema.examResults.studentId, id));

        // 5. Delete attendance records for this student
        await tx.delete(schema.attendance)
          .where(eq(schema.attendance.studentId, id));

        // 6. Delete the student record
        await tx.delete(schema.students)
          .where(eq(schema.students.id, id));

        // 7. Delete the user record
        const userResult = await tx.delete(schema.users)
          .where(eq(schema.users.id, id))
          .returning();

        return userResult.length > 0;
      } catch (error) {
        console.error('Error in hard delete transaction:', error);
        throw error;
      }
    });
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    // Return all students in class regardless of active status for admin management
    return await db.select().from(schema.students).where(eq(schema.students.classId, classId));
  }

  async getAllStudents(includeInactive = false): Promise<Student[]> {
    if (includeInactive) {
      // Return all students regardless of active status
      return await this.db.select().from(schema.students).orderBy(asc(schema.students.createdAt));
    } else {
      // Only return students with active user accounts
      return await this.db.select({
        id: schema.students.id,
        admissionNumber: schema.students.admissionNumber,
        classId: schema.students.classId,
        parentId: schema.students.parentId,
        admissionDate: schema.students.admissionDate,
        emergencyContact: schema.students.emergencyContact,
        medicalInfo: schema.students.medicalInfo,
        createdAt: schema.students.createdAt,
      })
        .from(schema.students)
        .innerJoin(schema.users, eq(schema.students.id, schema.users.id))
        .where(eq(schema.users.isActive, true))
        .orderBy(asc(schema.students.createdAt));
    }
  }

  async getStudentByAdmissionNumber(admissionNumber: string): Promise<Student | undefined> {
    const result = await db.select().from(schema.students).where(eq(schema.students.admissionNumber, admissionNumber)).limit(1);
    return result[0];
  }

  // Class management
  async getClasses(): Promise<Class[]> {
    return await db.select().from(schema.classes).where(eq(schema.classes.isActive, true)).orderBy(asc(schema.classes.name));
  }

  async getClass(id: number): Promise<Class | undefined> {
    const result = await db.select().from(schema.classes).where(eq(schema.classes.id, id)).limit(1);
    return result[0];
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const result = await db.insert(schema.classes).values(classData).returning();
    return result[0];
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const result = await db.update(schema.classes).set(classData).where(eq(schema.classes.id, id)).returning();
    return result[0];
  }

  async deleteClass(id: number): Promise<boolean> {
    const result = await db.delete(schema.classes).where(eq(schema.classes.id, id));
    return result.length > 0;
  }

  // Subject management
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(schema.subjects).orderBy(asc(schema.subjects.name));
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const result = await db.select().from(schema.subjects).where(eq(schema.subjects.id, id)).limit(1);
    return result[0];
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const result = await db.insert(schema.subjects).values(subject).returning();
    return result[0];
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const result = await db.update(schema.subjects).set(subject).where(eq(schema.subjects.id, id)).returning();
    return result[0];
  }

  async deleteSubject(id: number): Promise<boolean> {
    const result = await db.delete(schema.subjects).where(eq(schema.subjects.id, id));
    return result.length > 0;
  }

  // Academic terms
  async getCurrentTerm(): Promise<AcademicTerm | undefined> {
    const result = await db.select().from(schema.academicTerms).where(eq(schema.academicTerms.isCurrent, true)).limit(1);
    return result[0];
  }

  async getTerms(): Promise<AcademicTerm[]> {
    return await db.select().from(schema.academicTerms).orderBy(desc(schema.academicTerms.startDate));
  }

  // Attendance management
  async recordAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const result = await db.insert(schema.attendance).values(attendance).returning();
    return result[0];
  }

  async getAttendanceByStudent(studentId: string, date?: string): Promise<Attendance[]> {
    if (date) {
      return await db.select().from(schema.attendance)
        .where(and(eq(schema.attendance.studentId, studentId), eq(schema.attendance.date, date)));
    }
    return await db.select().from(schema.attendance)
      .where(eq(schema.attendance.studentId, studentId))
      .orderBy(desc(schema.attendance.date));
  }

  async getAttendanceByClass(classId: number, date: string): Promise<Attendance[]> {
    return await db.select().from(schema.attendance)
      .where(and(eq(schema.attendance.classId, classId), eq(schema.attendance.date, date)));
  }

  // Exam management
  async createExam(exam: InsertExam): Promise<Exam> {
    const result = await db.insert(schema.exams).values(exam).returning();
    return result[0];
  }

  async getAllExams(): Promise<Exam[]> {
    try {
      const result = await db.select().from(schema.exams)
        .orderBy(desc(schema.exams.date));
      return result || [];
    } catch (error) {
      console.error('Error in getAllExams:', error);
      return [];
    }
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const result = await db.select().from(schema.exams)
      .where(eq(schema.exams.id, id))
      .limit(1);
    return result[0];
  }

  async getExamsByClass(classId: number): Promise<Exam[]> {
    try {
      const result = await db.select().from(schema.exams)
        .where(eq(schema.exams.classId, classId))
        .orderBy(desc(schema.exams.date));
      return result || [];
    } catch (error) {
      console.error('Error in getExamsByClass:', error);
      return [];
    }
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const result = await db.update(schema.exams)
      .set(exam)
      .where(eq(schema.exams.id, id))
      .returning();
    return result[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    try {
      // First delete student answers (references exam questions)
      await db.delete(schema.studentAnswers)
        .where(sql`${schema.studentAnswers.questionId} IN (SELECT id FROM ${schema.examQuestions} WHERE exam_id = ${id})`);

      // Delete question options (references exam questions)
      await db.delete(schema.questionOptions)
        .where(sql`${schema.questionOptions.questionId} IN (SELECT id FROM ${schema.examQuestions} WHERE exam_id = ${id})`);

      // Delete exam questions (now safe to delete)
      await db.delete(schema.examQuestions)
        .where(eq(schema.examQuestions.examId, id));

      // Delete exam results
      await db.delete(schema.examResults)
        .where(eq(schema.examResults.examId, id));

      // Delete exam sessions
      await db.delete(schema.examSessions)
        .where(eq(schema.examSessions.examId, id));

      // Finally delete the exam itself
      const result = await db.delete(schema.exams)
        .where(eq(schema.exams.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteExam:', error);
      throw error;
    }
  }

  async recordExamResult(result: InsertExamResult): Promise<ExamResult> {
    try {
      const examResult = await db.insert(schema.examResults).values(result).returning();
      return examResult[0];
    } catch (error: any) {
      // Handle missing columns by removing autoScored from the insert
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('auto_scored')) {
        console.log('⚠️ Database schema mismatch detected - auto_scored column missing, using fallback insert');
        const { autoScored, ...resultWithoutAutoScored } = result;
        // Map score to marksObtained for compatibility with existing schema
        const compatibleResult = {
          ...resultWithoutAutoScored,
          marksObtained: result.score || 0
        };
        const examResult = await db.insert(schema.examResults).values(compatibleResult).returning();
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
      const updated = await db.update(schema.examResults)
        .set(result)
        .where(eq(schema.examResults.id, id))
        .returning();
      return updated[0];
    } catch (error: any) {
      // Handle missing columns by removing autoScored from the update
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('auto_scored')) {
        console.log('⚠️ Database schema mismatch detected - auto_scored column missing, using fallback update');
        const { autoScored, ...resultWithoutAutoScored } = result;
        // Map score to marksObtained for compatibility with existing schema
        const compatibleResult = {
          ...resultWithoutAutoScored,
          marksObtained: result.score || 0
        };
        const updated = await db.update(schema.examResults)
          .set(compatibleResult)
          .where(eq(schema.examResults.id, id))
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
      console.log(`🔍 Fetching exam results for student: ${studentId}`);

      const SYSTEM_AUTO_SCORING_UUID = '00000000-0000-0000-0000-000000000001';

      // Try main query first
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
          autoScored: sql<boolean>`COALESCE(${schema.examResults.autoScored}, ${schema.examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as('autoScored')
        }).from(schema.examResults)
          .leftJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id))
          .where(eq(schema.examResults.studentId, studentId))
          .orderBy(desc(schema.examResults.createdAt));

        console.log(`📊 Found ${results.length} exam results for student ${studentId}`);
        return results;
      } catch (mainError: any) {
        console.warn('Main query failed, trying fallback:', mainError);

        // Fallback query without autoScored column reference
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
          maxScore: sql<number>`100`.as('maxScore'), // Default to 100 if join fails
          autoScored: sql<boolean>`(${schema.examResults.recordedBy} = ${SYSTEM_AUTO_SCORING_UUID}::uuid)`.as('autoScored')
        }).from(schema.examResults)
          .where(eq(schema.examResults.studentId, studentId))
          .orderBy(desc(schema.examResults.createdAt));

        // Try to get exam details separately for maxScore
        for (const result of fallbackResults) {
          try {
            const exam = await this.db.select({ totalMarks: schema.exams.totalMarks })
              .from(schema.exams)
              .where(eq(schema.exams.id, result.examId))
              .limit(1);
            if (exam[0]?.totalMarks) {
              result.maxScore = exam[0].totalMarks;
            }
          } catch (examError) {
            console.warn(`Failed to get exam details for examId ${result.examId}:`, examError);
          }
        }

        console.log(`✅ Fallback query successful, found ${fallbackResults.length} results`);
        return fallbackResults;
      }
    } catch (error: any) {
      console.error(`❌ Error fetching exam results for student ${studentId}:`, error);
      return [];
    }
  }

  async getExamResultsByExam(examId: number): Promise<ExamResult[]> {
    try {
      return await db.select().from(schema.examResults)
        .where(eq(schema.examResults.examId, examId))
        .orderBy(desc(schema.examResults.createdAt));
    } catch (error: any) {
      // Handle missing columns by selecting only the columns that exist
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('column') && error?.cause?.message?.includes('does not exist')) {
        console.log('⚠️ Database schema mismatch detected, using fallback query with existing columns only');
        try {
          return await db.select({
            id: schema.examResults.id,
            examId: schema.examResults.examId,
            studentId: schema.examResults.studentId,
            marksObtained: schema.examResults.marksObtained, // Use legacy field
            grade: schema.examResults.grade,
            remarks: schema.examResults.remarks,
            recordedBy: schema.examResults.recordedBy,
            createdAt: schema.examResults.createdAt,
            // Map marksObtained to score for compatibility
            score: schema.examResults.marksObtained,
            maxScore: dsql`null`.as('maxScore'),
            // Since auto_scored column doesn't exist, determine from recordedBy
            autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as('autoScored')
          }).from(schema.examResults)
            .where(eq(schema.examResults.examId, examId))
            .orderBy(desc(schema.examResults.createdAt));
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed:', fallbackError);
          return [];
        }
      }
      throw error;
    }
  }

  async getExamResultByExamAndStudent(examId: number, studentId: string): Promise<ExamResult | undefined> {
    const result = await db.select().from(schema.examResults)
      .where(
        sql`${schema.examResults.examId} = ${examId} AND ${schema.examResults.studentId} = ${studentId}`
      )
      .limit(1);
    return result[0];
  }

  async getExamResultsByClass(classId: number): Promise<any[]> {
    try {
      // Join all needed tables to get complete data
      const results = await db.select({
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
        studentName: sql<string>`${schema.users.firstName} || ' ' || ${schema.users.lastName}`.as('studentName'),
        className: schema.classes.name,
        subjectName: schema.subjects.name,
      })
        .from(schema.examResults)
        .innerJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id))
        .innerJoin(schema.students, eq(schema.examResults.studentId, schema.students.id))
        .innerJoin(schema.users, eq(schema.students.id, schema.users.id))
        .leftJoin(schema.classes, eq(schema.exams.classId, schema.classes.id))
        .leftJoin(schema.subjects, eq(schema.exams.subjectId, schema.subjects.id))
        .where(eq(schema.exams.classId, classId))
        .orderBy(desc(schema.examResults.createdAt));

      // Results already contain all needed data from joins
      return results;
    } catch (error: any) {
      console.error('Error in getExamResultsByClass:', error);

      // Handle missing columns by using a fallback query
      if (error?.cause?.code === '42703' && error?.cause?.message?.includes('column') && error?.cause?.message?.includes('does not exist')) {
        console.log('⚠️ Database schema mismatch detected, using fallback query for getExamResultsByClass');
        try {
          // Fallback query using only existing columns
          const results = await db.select({
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
            maxScore: dsql`null`.as('maxScore'),
            // Infer autoScored based on recordedBy
            autoScored: dsql`CASE WHEN "recorded_by" = '00000000-0000-0000-0000-000000000001' THEN true ELSE false END`.as('autoScored')
          })
            .from(schema.examResults)
            .innerJoin(schema.exams, eq(schema.examResults.examId, schema.exams.id))
            .where(eq(schema.exams.classId, classId))
            .orderBy(desc(schema.examResults.createdAt));

          // Return fallback results as-is
          return results;
        } catch (fallbackError) {
          console.error('❌ Fallback query also failed for getExamResultsByClass:', fallbackError);
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
    const result = await db.insert(schema.examQuestions).values(questionData).returning();
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
        const questionResult = await tx.insert(schema.examQuestions).values(questionData).returning();
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
              await tx.insert(schema.questionOptions).values(optionData);
            }
          }
        }

        return createdQuestion;
      } catch (error) {
        // Transaction will automatically rollback, no manual cleanup needed
        console.error('❌ Failed to create exam question with options:', error);
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

    console.log(`🔄 Starting SEQUENTIAL bulk creation of ${questionsData.length} questions`);

    // SEQUENTIAL processing to prevent circuit breaker - NO parallel requests
    for (let i = 0; i < questionsData.length; i++) {
      const { question, options } = questionsData[i];

      try {
        console.log(`📝 Creating question ${i + 1}/${questionsData.length}: "${question.questionText.substring(0, 50)}..."`);

        const createdQuestion = await this.createExamQuestionWithOptions(question, options);
        createdQuestions.push(createdQuestion);

        console.log(`✅ Successfully created question ${i + 1}`);

        // Throttling delay between EACH question to prevent circuit breaker
        if (i < questionsData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150)); // 150ms delay between questions
        }

      } catch (error) {
        const errorMsg = `Question ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ Failed to create question ${i + 1}:`, errorMsg);
        errors.push(errorMsg);

        // Check if this is a circuit breaker error and implement backoff
        if (error instanceof Error && (
          error.message.includes('circuit') ||
          error.message.includes('breaker') ||
          error.message.includes('pool') ||
          error.message.includes('connection')
        )) {
          console.warn(`⚠️ Detected potential circuit breaker issue. Implementing backoff...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second backoff on connection issues
        } else {
          // Normal error delay
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }

    console.log(`✅ SEQUENTIAL bulk creation completed: ${createdQuestions.length} created, ${errors.length} errors`);

    return {
      created: createdQuestions.length,
      questions: createdQuestions,
      errors
    };
  }

  async getExamQuestions(examId: number): Promise<ExamQuestion[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
      id: schema.examQuestions.id,
      examId: schema.examQuestions.examId,
      questionText: schema.examQuestions.questionText,
      questionType: schema.examQuestions.questionType,
      points: schema.examQuestions.points,
      orderNumber: schema.examQuestions.orderNumber,
      imageUrl: schema.examQuestions.imageUrl,
      createdAt: schema.examQuestions.createdAt,
    }).from(schema.examQuestions)
      .where(eq(schema.examQuestions.examId, examId))
      .orderBy(asc(schema.examQuestions.orderNumber));
  }

  async getExamQuestionCount(examId: number): Promise<number> {
    const result = await db.select({ count: dsql`count(*)` }).from(schema.examQuestions)
      .where(eq(schema.examQuestions.examId, examId));
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
        console.warn(`Failed to get question count for exam ${examId}:`, error);
        counts[examId] = 0;
      }
    }

    return counts;
  }

  async updateExamQuestion(id: number, question: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined> {
    const result = await db.update(schema.examQuestions)
      .set(question)
      .where(eq(schema.examQuestions.id, id))
      .returning();
    return result[0];
  }

  async deleteExamQuestion(id: number): Promise<boolean> {
    try {
      // First delete question options
      await db.delete(schema.questionOptions)
        .where(eq(schema.questionOptions.questionId, id));

      // Delete student answers for this question
      await db.delete(schema.studentAnswers)
        .where(eq(schema.studentAnswers.questionId, id));

      // Finally delete the question itself
      const result = await db.delete(schema.examQuestions)
        .where(eq(schema.examQuestions.id, id))
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('Error in deleteExamQuestion:', error);
      throw error;
    }
  }

  // Question options management
  async createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption> {
    const result = await db.insert(schema.questionOptions).values(option).returning();
    return result[0];
  }

  async getQuestionOptions(questionId: number): Promise<QuestionOption[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
      id: schema.questionOptions.id,
      questionId: schema.questionOptions.questionId,
      optionText: schema.questionOptions.optionText,
      isCorrect: schema.questionOptions.isCorrect,
      orderNumber: schema.questionOptions.orderNumber,
      createdAt: schema.questionOptions.createdAt,
    }).from(schema.questionOptions)
      .where(eq(schema.questionOptions.questionId, questionId))
      .orderBy(asc(schema.questionOptions.orderNumber));
  }

  // PERFORMANCE: Bulk fetch question options to eliminate N+1 queries
  async getQuestionOptionsBulk(questionIds: number[]): Promise<QuestionOption[]> {
    if (questionIds.length === 0) {
      return [];
    }

    // Use inArray for efficient bulk query
    return await db.select({
      id: schema.questionOptions.id,
      questionId: schema.questionOptions.questionId,
      optionText: schema.questionOptions.optionText,
      isCorrect: schema.questionOptions.isCorrect,
      orderNumber: schema.questionOptions.orderNumber,
      createdAt: schema.questionOptions.createdAt,
    }).from(schema.questionOptions)
      .where(inArray(schema.questionOptions.questionId, questionIds))
      .orderBy(asc(schema.questionOptions.questionId), asc(schema.questionOptions.orderNumber));
  }

  // Exam sessions management
  async createExamSession(session: InsertExamSession): Promise<ExamSession> {
    const result = await db.insert(schema.examSessions).values(session).returning();
    return result[0];
  }

  async getExamSessionById(id: number): Promise<ExamSession | undefined> {
    // Only select columns that actually exist in the current database
    const result = await db.select({
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
      createdAt: schema.examSessions.createdAt,
    }).from(schema.examSessions)
      .where(eq(schema.examSessions.id, id))
      .limit(1);
    return result[0];
  }

  async getExamSessionsByExam(examId: number): Promise<ExamSession[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
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
      createdAt: schema.examSessions.createdAt,
    }).from(schema.examSessions)
      .where(eq(schema.examSessions.examId, examId))
      .orderBy(desc(schema.examSessions.startedAt));
  }

  async getExamSessionsByStudent(studentId: string): Promise<ExamSession[]> {
    // Only select columns that actually exist in the current database
    return await db.select({
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
      createdAt: schema.examSessions.createdAt,
    }).from(schema.examSessions)
      .where(eq(schema.examSessions.studentId, studentId))
      .orderBy(desc(schema.examSessions.startedAt));
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

    const result = await db.update(schema.examSessions)
      .set(allowedFields)
      .where(eq(schema.examSessions.id, id))
      .returning({
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

  async deleteExamSession(id: number): Promise<boolean> {
    const result = await db.delete(schema.examSessions)
      .where(eq(schema.examSessions.id, id));
    return result.length > 0;
  }

  async getActiveExamSession(examId: number, studentId: string): Promise<ExamSession | undefined> {
    const result = await db.select().from(schema.examSessions)
      .where(and(
        eq(schema.examSessions.examId, examId),
        eq(schema.examSessions.studentId, studentId),
        eq(schema.examSessions.isCompleted, false)
      ))
      .limit(1);
    return result[0];
  }

  // Get all active exam sessions for background cleanup service
  async getActiveExamSessions(): Promise<ExamSession[]> {
    // Temporarily select only core columns to avoid missing column errors
    return await db.select({
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
    }).from(schema.examSessions)
      .where(eq(schema.examSessions.isCompleted, false))
      .orderBy(desc(schema.examSessions.startedAt));
  }

  // PERFORMANCE OPTIMIZED: Get only expired sessions directly from database
  async getExpiredExamSessions(now: Date, limit = 100): Promise<ExamSession[]> {
    // Temporarily simplified to work with existing schema - will be enhanced after schema sync
    return await db.select({
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
    }).from(schema.examSessions)
      .where(and(
        eq(schema.examSessions.isCompleted, false),
        // Fallback: Use startedAt + reasonable timeout estimate for expired sessions
        dsql`${schema.examSessions.startedAt} + interval '2 hours' < ${now.toISOString()}`
      ))
      .orderBy(asc(schema.examSessions.startedAt))
      .limit(limit);
  }

  // CIRCUIT BREAKER FIX: Idempotent session creation using UPSERT to prevent connection pool exhaustion
  async createOrGetActiveExamSession(examId: number, studentId: string, sessionData: InsertExamSession): Promise<ExamSession & { wasCreated?: boolean }> {
    try {
      // STEP 1: Try to insert new session - this will fail if an active session already exists due to unique index
      const insertResult = await db.insert(schema.examSessions)
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

      // If insert succeeded, return the new session
      if (insertResult.length > 0) {
        console.log(`Created new exam session ${insertResult[0].id} for student ${studentId} exam ${examId}`);
        return { ...insertResult[0], wasCreated: true };
      }

      // STEP 2: Insert failed due to conflict, fetch the existing active session
      const existingSession = await db.select({
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
      }).from(schema.examSessions)
        .where(and(
          eq(schema.examSessions.examId, examId),
          eq(schema.examSessions.studentId, studentId),
          eq(schema.examSessions.isCompleted, false)
        ))
        .limit(1);

      if (existingSession.length > 0) {
        console.log(`Retrieved existing exam session ${existingSession[0].id} for student ${studentId} exam ${examId}`);
        return { ...existingSession[0], wasCreated: false };
      }

      // This should not happen with proper unique index, but handle gracefully
      throw new Error(`Unable to create or retrieve exam session for student ${studentId} exam ${examId}`);

    } catch (error: any) {
      console.error('Error in createOrGetActiveExamSession:', error);
      throw error;
    }
  }

  // Enhanced session management for students
  async getStudentActiveSession(studentId: string): Promise<ExamSession | undefined> {
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
    }).from(schema.examSessions)
      .where(and(
        eq(schema.examSessions.studentId, studentId),
        eq(schema.examSessions.isCompleted, false)
      ))
      .orderBy(desc(schema.examSessions.createdAt))
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
      await this.db.update(schema.examSessions)
        .set(updates)
        .where(eq(schema.examSessions.id, sessionId));
    }
  }

  // Student answers management
  async createStudentAnswer(answer: InsertStudentAnswer): Promise<StudentAnswer> {
    const result = await db.insert(schema.studentAnswers).values(answer).returning();
    return result[0];
  }

  async getStudentAnswers(sessionId: number): Promise<StudentAnswer[]> {
    return await db.select().from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.sessionId, sessionId))
      .orderBy(asc(schema.studentAnswers.answeredAt));
  }

  async getStudentAnswerById(id: number): Promise<StudentAnswer | undefined> {
    const result = await db.select().from(schema.studentAnswers)
      .where(eq(schema.studentAnswers.id, id))
      .limit(1);
    return result[0];
  }

  async updateStudentAnswer(id: number, answer: Partial<InsertStudentAnswer>): Promise<StudentAnswer | undefined> {
    const result = await db.update(schema.studentAnswers)
      .set(answer)
      .where(eq(schema.studentAnswers.id, id))
      .returning();
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
      console.log(`🔍 DIAGNOSTIC: Starting scoring data fetch for session ${sessionId}`);

      // First, get the session - select only existing columns
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
      })
        .from(schema.examSessions)
        .where(eq(schema.examSessions.id, sessionId))
        .limit(1);

      if (!sessionResult[0]) {
        throw new Error(`Exam session ${sessionId} not found`);
      }

      const session = sessionResult[0];
      console.log(`🔍 DIAGNOSTIC: Found session for exam ${session.examId}, student ${session.studentId}`);

      // CORRECTED QUERY: Get question data and correct options separately to avoid row multiplication issues
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
        textAnswer: schema.studentAnswers.textAnswer,
      })
        .from(schema.examQuestions)
        .leftJoin(schema.studentAnswers, and(
          eq(schema.studentAnswers.questionId, schema.examQuestions.id),
          eq(schema.studentAnswers.sessionId, sessionId)
        ))
        .where(eq(schema.examQuestions.examId, session.examId))
        .orderBy(asc(schema.examQuestions.orderNumber));

      // Get correct options separately to avoid confusion
      const correctOptionsQuery = await this.db.select({
        questionId: schema.questionOptions.questionId,
        correctOptionId: schema.questionOptions.id,
      })
        .from(schema.questionOptions)
        .innerJoin(schema.examQuestions, eq(schema.questionOptions.questionId, schema.examQuestions.id))
        .where(
          and(
            eq(schema.examQuestions.examId, session.examId),
            eq(schema.questionOptions.isCorrect, true)
          )
        );

      // Get selected option details for partial credit (only for questions with student answers)
      const selectedOptionsQuery = await this.db.select({
        questionId: schema.questionOptions.questionId,
        optionId: schema.questionOptions.id,
        partialCreditValue: schema.questionOptions.partialCreditValue,
        isCorrect: schema.questionOptions.isCorrect,
      })
        .from(schema.questionOptions)
        .innerJoin(schema.studentAnswers, eq(schema.questionOptions.id, schema.studentAnswers.selectedOptionId))
        .where(eq(schema.studentAnswers.sessionId, sessionId));

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
            console.log(`🔤 OPTION PARTIAL CREDIT: Question ${question.questionId} awarded ${questionData.partialCreditEarned}/${questionData.points} pts for selected option`);
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

          console.log(`🔤 AUTO-SCORING TEXT: Question ${questionId} - Student: "${studentAnswer}", Expected: [${question.expectedAnswers.join(', ')}]`);

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
              console.log(`✅ TEXT MATCH: Exact match found for question ${questionId}`);
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
                  console.log(`🔤 PARTIAL CREDIT: Question ${questionId} similarity ${similarity.toFixed(2)} awarded ${question.partialCreditEarned}/${question.points} points`);
                  break;
                }
              } catch (err) {
                console.warn(`⚠️ Invalid partial credit rules for question ${questionId}:`, err);
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

      console.log(`🔍 DIAGNOSTIC: Found ${totalQuestions} total questions for scoring`);

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
            console.log(`🔍 DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): CORRECT (+${question.points} pts) - Full credit awarded`);
          }
          // Award partial credit if earned
          else if (question.partialCreditEarned > 0) {
            studentScore += question.partialCreditEarned;
            console.log(`🔍 DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): PARTIAL CREDIT (+${question.partialCreditEarned}/${question.points} pts)`);
          }
          // No credit
          else {
            console.log(`🔍 DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): INCORRECT (0 pts)`);
          }
        } else {
          console.log(`🔍 DIAGNOSTIC: Question ${question.questionId} (${question.questionType}, auto_gradable=${question.autoGradable}): MANUAL GRADING REQUIRED`);
        }
      }

      console.log(`🔍 DIAGNOSTIC: Question type breakdown:`, questionTypeCount);
      console.log(`🔍 DIAGNOSTIC: Auto-scored questions: ${autoScoredQuestions}/${totalQuestions}`);
      console.log(`🔍 DIAGNOSTIC: Student score: ${studentScore}/${maxScore}`);

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
      console.error('🚨 OPTIMIZED SCORING ERROR:', error);
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
    const result = await db.insert(schema.announcements).values(announcement).returning();
    return result[0];
  }

  async getAnnouncements(targetRole?: string): Promise<Announcement[]> {
    const query = db.select().from(schema.announcements)
      .where(eq(schema.announcements.isPublished, true))
      .orderBy(desc(schema.announcements.publishedAt));

    if (targetRole) {
      // Note: This would need proper array contains logic for PostgreSQL
      // For now, return all published announcements ordered by date
    }

    return await query;
  }

  async getAnnouncementById(id: number): Promise<Announcement | undefined> {
    const result = await db.select().from(schema.announcements).where(eq(schema.announcements.id, id)).limit(1);
    return result[0];
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const result = await db.update(schema.announcements).set(announcement).where(eq(schema.announcements.id, id)).returning();
    return result[0];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(schema.announcements).where(eq(schema.announcements.id, id));
    return result.length > 0;
  }

  // Messages
  async sendMessage(message: InsertMessage): Promise<Message> {
    const result = await db.insert(schema.messages).values(message).returning();
    return result[0];
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return await db.select().from(schema.messages)
      .where(eq(schema.messages.recipientId, userId))
      .orderBy(desc(schema.messages.createdAt));
  }

  async markMessageAsRead(id: number): Promise<void> {
    await db.update(schema.messages).set({ isRead: true }).where(eq(schema.messages.id, id));
  }

  // Gallery
  async createGalleryCategory(category: InsertGalleryCategory): Promise<GalleryCategory> {
    const result = await db.insert(schema.galleryCategories).values(category).returning();
    return result[0];
  }

  async getGalleryCategories(): Promise<GalleryCategory[]> {
    return await db.select().from(schema.galleryCategories).orderBy(asc(schema.galleryCategories.name));
  }

  async uploadGalleryImage(image: InsertGallery): Promise<Gallery> {
    const result = await db.insert(schema.gallery).values(image).returning();
    return result[0];
  }

  async getGalleryImages(categoryId?: number): Promise<Gallery[]> {
    if (categoryId) {
      return await db.select().from(schema.gallery)
        .where(eq(schema.gallery.categoryId, categoryId))
        .orderBy(desc(schema.gallery.createdAt));
    }
    return await db.select().from(schema.gallery).orderBy(desc(schema.gallery.createdAt));
  }

  async getGalleryImageById(id: string): Promise<Gallery | undefined> {
    const result = await db.select().from(schema.gallery)
      .where(eq(schema.gallery.id, parseInt(id)))
      .limit(1);
    return result[0];
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    const result = await db.delete(schema.gallery)
      .where(eq(schema.gallery.id, parseInt(id)))
      .returning();
    return result.length > 0;
  }

  // Study resources management
  async createStudyResource(resource: InsertStudyResource): Promise<StudyResource> {
    const result = await db.insert(schema.studyResources).values(resource).returning();
    return result[0];
  }

  async getStudyResources(filters?: {
    classId?: number;
    subjectId?: number;
    termId?: number;
    resourceType?: string;
  }): Promise<StudyResource[]> {
    let query = db.select().from(schema.studyResources)
      .where(eq(schema.studyResources.isPublished, true));

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

  async getStudyResourceById(id: number): Promise<StudyResource | undefined> {
    const result = await db.select().from(schema.studyResources)
      .where(eq(schema.studyResources.id, id))
      .limit(1);
    return result[0];
  }

  async incrementStudyResourceDownloads(id: number): Promise<void> {
    await db.update(schema.studyResources)
      .set({ downloads: dsql`${schema.studyResources.downloads} + 1` })
      .where(eq(schema.studyResources.id, id));
  }

  async deleteStudyResource(id: number): Promise<boolean> {
    const result = await db.delete(schema.studyResources)
      .where(eq(schema.studyResources.id, id))
      .returning();
    return result.length > 0;
  }

  // Home page content management
  async createHomePageContent(content: InsertHomePageContent): Promise<HomePageContent> {
    const result = await db.insert(schema.homePageContent).values(content).returning();
    return result[0];
  }



  // Manual Grading System Methods
  async getGradingTasks(teacherId: string, status?: string): Promise<any[]> {
    try {
      // Get exam sessions that need manual grading for this teacher's exams
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

      if (status && status !== 'all') {
        if (status === 'pending') {
          query += ' AND sa.id NOT IN (SELECT answer_id FROM manual_scores)';
        } else if (status === 'graded') {
          query += ' AND sa.id IN (SELECT answer_id FROM manual_scores)';
        }
      }

      query += ' ORDER BY es.submitted_at DESC';

      const result = await sql.unsafe(query, params);
      return result;
    } catch (error) {
      console.error('Error fetching grading tasks:', error);
      throw error;
    }
  }

  async submitManualGrade(gradeData: { taskId: number; score: number; comment: string; graderId: string }): Promise<any> {
    try {
      const { taskId, score, comment, graderId } = gradeData;

      // Insert or update manual score
      const result = await sql`
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
      await sql`
        UPDATE student_answers 
        SET points_earned = ${score}
        WHERE id = ${taskId}
      `;

      return result[0];
    } catch (error) {
      console.error('Error submitting manual grade:', error);
      throw error;
    }
  }

  async getAllExamSessions(): Promise<any[]> {
    try {
      const result = await sql`
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
      console.error('Error fetching exam sessions:', error);
      throw error;
    }
  }

  async getExamReports(filters: { subjectId?: number; classId?: number }): Promise<any[]> {
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

      const result = await sql.unsafe(query, params);
      return result;
    } catch (error) {
      console.error('Error fetching exam reports:', error);
      throw error;
    }
  }

  async getExamStudentReports(examId: number): Promise<any[]> {
    try {
      const result = await sql`
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
      console.error('Error fetching student reports:', error);
      throw error;
    }
  }

  async logPerformanceEvent(event: any): Promise<any> {
    try {
      const result = await sql`
        INSERT INTO performance_events (
          session_id, event_type, duration, metadata, user_id, client_side, created_at
        ) VALUES (
          ${event.sessionId}, ${event.eventType}, ${event.duration}, 
          ${JSON.stringify(event.metadata)}, ${event.userId}, ${event.clientSide}, NOW()
        ) RETURNING *
      `;
      return result[0];
    } catch (error) {
      console.error('Error logging performance event:', error);
      throw error;
    }
  }

  async getExpiredExamSessions(cutoffTime: Date, limit: number): Promise<any[]> {
    try {
      const result = await sql`
        SELECT es.*, e.time_limit
        FROM exam_sessions es
        JOIN exams e ON es.exam_id = e.id
        WHERE es.is_completed = false 
        AND es.started_at < ${cutoffTime.toISOString()}
        AND e.time_limit IS NOT NULL
        AND EXTRACT(EPOCH FROM (NOW() - es.started_at)) / 60 > e.time_limit
        LIMIT ${limit}
      `;
      return result || [];
    } catch (error) {
      console.error('Error fetching expired exam sessions:', error);
      return []; // Return empty array instead of throwing to prevent cleanup service crashes
    }
  }

  // Home page content management
  async getHomePageContent(contentType?: string): Promise<HomePageContent[]> {
    if (contentType) {
      return await db.select().from(schema.homePageContent)
        .where(and(eq(schema.homePageContent.contentType, contentType), eq(schema.homePageContent.isActive, true)))
        .orderBy(asc(schema.homePageContent.displayOrder));
    }
    return await db.select().from(schema.homePageContent)
      .where(eq(schema.homePageContent.isActive, true))
      .orderBy(asc(schema.homePageContent.displayOrder), asc(schema.homePageContent.contentType));
  }

  async getHomePageContentById(id: number): Promise<HomePageContent | undefined> {
    const result = await db.select().from(schema.homePageContent)
      .where(eq(schema.homePageContent.id, id))
      .limit(1);
    return result[0];
  }

  async updateHomePageContent(id: number, content: Partial<InsertHomePageContent>): Promise<HomePageContent | undefined> {
    const result = await db.update(schema.homePageContent)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(schema.homePageContent.id, id))
      .returning();
    return result[0];
  }

  async deleteHomePageContent(id: number): Promise<boolean> {
    const result = await db.delete(schema.homePageContent)
      .where(eq(schema.homePageContent.id, id))
      .returning();
    return result.length > 0;
  }

  // Comprehensive grade management
  async recordComprehensiveGrade(gradeData: any): Promise<any> {
    try {
      // First ensure we have a report card for this student/term
      let reportCard = await db.select()
        .from(schema.reportCards)
        .where(and(
          eq(schema.reportCards.studentId, gradeData.studentId),
          eq(schema.reportCards.termId, gradeData.termId)
        ))
        .limit(1);

      let reportCardId: number;
      if (reportCard.length === 0) {
        // Create new report card
        const newReportCard = await db.insert(schema.reportCards)
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
        .from(schema.reportCardItems)
        .where(and(
          eq(schema.reportCardItems.reportCardId, reportCardId),
          eq(schema.reportCardItems.subjectId, gradeData.subjectId)
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
        const result = await db.update(schema.reportCardItems)
          .set(comprehensiveGradeData)
          .where(eq(schema.reportCardItems.id, existingItem[0].id))
          .returning();
        return result[0];
      } else {
        // Create new item
        const result = await db.insert(schema.reportCardItems)
          .values(comprehensiveGradeData)
          .returning();
        return result[0];
      }
    } catch (error) {
      console.error('Error recording comprehensive grade:', error);
      throw error;
    }
  }

  async getComprehensiveGradesByStudent(studentId: string, termId?: number): Promise<any[]> {
    try {
      let query = db.select({
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
      })
        .from(schema.reportCardItems)
        .innerJoin(schema.reportCards, eq(schema.reportCardItems.reportCardId, schema.reportCards.id))
        .innerJoin(schema.subjects, eq(schema.reportCardItems.subjectId, schema.subjects.id))
        .where(eq(schema.reportCards.studentId, studentId));

      if (termId) {
        query = query.where(and(
          eq(schema.reportCards.studentId, studentId),
          eq(schema.reportCards.termId, termId)
        ));
      }

      return await query.orderBy(schema.subjects.name);
    } catch (error) {
      console.error('Error fetching comprehensive grades by student:', error);
      return [];
    }
  }

  async getComprehensiveGradesByClass(classId: number, termId?: number): Promise<any[]> {
    try {
      let query = db.select({
        studentId: schema.reportCards.studentId,
        studentName: sql<string>`CONCAT(${schema.users.firstName}, ' ', ${schema.users.lastName})`.as('studentName'),
        admissionNumber: schema.students.admissionNumber,
        subjectName: schema.subjects.name,
        testScore: schema.reportCardItems.testScore,
        examScore: schema.reportCardItems.examScore,
        obtainedMarks: schema.reportCardItems.obtainedMarks,
        grade: schema.reportCardItems.grade,
        teacherRemarks: schema.reportCardItems.teacherRemarks
      })
        .from(schema.reportCardItems)
        .innerJoin(schema.reportCards, eq(schema.reportCardItems.reportCardId, schema.reportCards.id))
        .innerJoin(schema.students, eq(schema.reportCards.studentId, schema.students.id))
        .innerJoin(schema.users, eq(schema.students.id, schema.users.id))
        .innerJoin(schema.subjects, eq(schema.reportCardItems.subjectId, schema.subjects.id))
        .where(eq(schema.students.classId, classId));

      if (termId) {
        query = query.where(and(
          eq(schema.students.classId, classId),
          eq(schema.reportCards.termId, termId)
        ));
      }

      return await query.orderBy(schema.users.firstName, schema.users.lastName, schema.subjects.name);
    } catch (error) {
      console.error('Error fetching comprehensive grades by class:', error);
      return [];
    }
  }

  async createReportCard(reportCardData: any, grades: any[]): Promise<any> {
    return await this.db.transaction(async (tx: any) => {
      try {
        // Create main report card record
        const reportCard = await tx.insert(schema.reportCards)
          .values(reportCardData)
          .returning();

        // Link all grade items to this report card
        if (grades.length > 0) {
          const gradeUpdates = grades.map((grade: any) => 
            tx.update(schema.reportCardItems)
              .set({ reportCardId: reportCard[0].id })
              .where(eq(schema.reportCardItems.id, grade.id))
          );

          await Promise.all(gradeUpdates);
        }

        return {
          reportCard: reportCard[0],
          grades: grades
        };
      } catch (error) {
        console.error('Error creating report card:', error);
        throw error;
      }
    });
  }

  async getReportCard(id: number): Promise<ReportCard | undefined> {
    try {
      const result = await db.select()
        .from(schema.reportCards)
        .where(eq(schema.reportCards.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching report card:', error);
      return undefined;
    }
  }

  async getReportCardsByStudentId(studentId: string): Promise<ReportCard[]> {
    try {
      return await db.select()
        .from(schema.reportCards)
        .where(eq(schema.reportCards.studentId, studentId))
        .orderBy(desc(schema.reportCards.generatedAt));
    } catch (error) {
      console.error('Error fetching student report cards:', error);
      return [];
    }
  }

  async getReportCardItems(reportCardId: number): Promise<ReportCardItem[]> {
    try {
      return await db.select()
        .from(schema.reportCardItems)
        .where(eq(schema.reportCardItems.reportCardId, reportCardId));
    } catch (error) {
      console.error('Error fetching report card items:', error);
      return [];
    }
  }

  async getStudentsByParentId(parentId: string): Promise<Student[]> {
    try {
      return await db.select()
        .from(schema.students)
        .where(eq(schema.students.parentId, parentId));
    } catch (error) {
      console.error('Error fetching students by parent:', error);
      return [];
    }
  }

  async getAcademicTerm(id: number): Promise<AcademicTerm | undefined> {
    try {
      const result = await db.select()
        .from(schema.academicTerms)
        .where(eq(schema.academicTerms.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching academic term:', error);
      return undefined;
    }
  }

  // Analytics and Reports
  async getAnalyticsOverview(): Promise<any> {
    try {
      // Get basic counts
      const [students, teachers, admins, parents] = await Promise.all([
        db.select().from(schema.users).where(eq(schema.users.roleId, 1)),
        db.select().from(schema.users).where(eq(schema.users.roleId, 2)),
        db.select().from(schema.users).where(eq(schema.users.roleId, 4)),
        db.select().from(schema.users).where(eq(schema.users.roleId, 3))
      ]);

      const [classes, subjects, exams, examResults] = await Promise.all([
        db.select().from(schema.classes),
        db.select().from(schema.subjects),
        db.select().from(schema.exams),
        db.select().from(schema.examResults)
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
      console.error('Error in getAnalyticsOverview:', error);
      return this.getFallbackAnalytics();
    }
  }

  async getPerformanceAnalytics(filters: any): Promise<any> {
    try {
      let examResults = await db.select().from(schema.examResults);

      // Apply filters if provided
      if (filters.classId) {
        const studentsInClass = await db.select().from(schema.students)
          .where(eq(schema.students.classId, filters.classId));
        const studentIds = studentsInClass.map((s: any) => s.id);
        examResults = examResults.filter((r: any) => studentIds.includes(r.studentId));
      }

      if (filters.subjectId) {
        const examsForSubject = await db.select().from(schema.exams)
          .where(eq(schema.exams.subjectId, filters.subjectId));
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
      console.error('Error in getPerformanceAnalytics:', error);
      return { error: 'Failed to calculate performance analytics' };
    }
  }

  async getTrendAnalytics(months: number = 6): Promise<any> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);

      // Get data for the specified time period
      const [students, exams, examResults] = await Promise.all([
        db.select().from(schema.users)
          .where(and(
            eq(schema.users.roleId, 1),
            // Note: In a real implementation, you'd filter by createdAt >= cutoffDate
          )),
        db.select().from(schema.exams),
        db.select().from(schema.examResults)
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
      console.error('Error in getTrendAnalytics:', error);
      return { error: 'Failed to calculate trend analytics' };
    }
  }

  async getAttendanceAnalytics(filters: any): Promise<any> {
    try {
      let attendance: Attendance[] = await db.select().from(schema.attendance);

      // Apply filters
      if (filters.classId) {
        const studentsInClass = await db.select().from(schema.students)
          .where(eq(schema.students.classId, filters.classId));
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
      console.error('Error in getAttendanceAnalytics:', error);
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
      const classes: Class[] = await db.select().from(schema.classes);
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

  // Contact messages management - ensuring 100% Supabase persistence
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const result = await this.db.insert(schema.contactMessages).values(message).returning();
    return result[0];
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await this.db.select().from(schema.contactMessages).orderBy(desc(schema.contactMessages.createdAt));
  }

  // Report finalization methods
  async getExamResultById(id: number): Promise<ExamResult | undefined> {
    try {
      const result = await this.db.select().from(schema.examResults)
        .where(eq(schema.examResults.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching exam result by ID:', error);
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
      const results = await this.db.select().from(schema.examResults)
        .where(and(
          inArray(schema.examResults.examId, examIds),
          // Add teacherFinalized field check when column exists
          // eq(schema.examResults.teacherFinalized, true)
        ))
        .orderBy(desc(schema.examResults.createdAt));

      return results;
    } catch (error) {
      console.error('Error fetching finalized reports by exams:', error);
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
      const results = await this.db.select().from(schema.examResults)
        .orderBy(desc(schema.examResults.createdAt));

      return results;
    } catch (error) {
      console.error('Error fetching all finalized reports:', error);
      return [];
    }
  }

  async getContactMessageById(id: number): Promise<ContactMessage | undefined> {
    const result = await this.db.select().from(schema.contactMessages).where(eq(schema.contactMessages.id, id)).limit(1);
    return result[0];
  }

  async markContactMessageAsRead(id: number): Promise<boolean> {
    const result = await this.db.update(schema.contactMessages)
      .set({ isRead: true })
      .where(eq(schema.contactMessages.id, id))
      .returning();
    return result.length > 0;
  }

  async respondToContactMessage(id: number, response: string, respondedBy: string): Promise<ContactMessage | undefined> {
    const result = await this.db.update(schema.contactMessages)
      .set({
        response,
        respondedBy,
        respondedAt: new Date(),
        isRead: true
      })
      .where(eq(schema.contactMessages.id, id))
      .returning();
    return result[0];
  }

  // Performance monitoring implementation
  async logPerformanceEvent(event: InsertPerformanceEvent): Promise<PerformanceEvent> {
    const result = await this.db.insert(schema.performanceEvents).values(event).returning();
    return result[0];
  }

  async getPerformanceMetrics(hours: number = 24): Promise<{
    totalEvents: number;
    goalAchievementRate: number;
    averageDuration: number;
    slowSubmissions: number;
    eventsByType: Record<string, number>;
  }> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    const events = await this.db.select()
      .from(schema.performanceEvents)
      .where(dsql`${schema.performanceEvents.createdAt} >= ${cutoffTime}`);

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
  }

  async getRecentPerformanceAlerts(hours: number = 24): Promise<PerformanceEvent[]> {
    const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));

    return await this.db.select()
      .from(schema.performanceEvents)
      .where(
        and(
          dsql`${schema.performanceEvents.createdAt} >= ${cutoffTime}`,
          eq(schema.performanceEvents.goalAchieved, false)
        )
      )
      .orderBy(desc(schema.performanceEvents.createdAt))
      .limit(50);
  }

  // Teacher class assignments implementation
  async createTeacherClassAssignment(assignment: InsertTeacherClassAssignment): Promise<TeacherClassAssignment> {
    const result = await this.db.insert(schema.teacherClassAssignments).values(assignment).returning();
    return result[0];
  }

  async getTeacherClassAssignments(teacherId: string): Promise<TeacherClassAssignment[]> {
    return await this.db.select()
      .from(schema.teacherClassAssignments)
      .where(and(
        eq(schema.teacherClassAssignments.teacherId, teacherId),
        eq(schema.teacherClassAssignments.isActive, true)
      ))
      .orderBy(schema.teacherClassAssignments.createdAt);
  }

  async getTeachersForClassSubject(classId: number, subjectId: number): Promise<User[]> {
    const assignments = await this.db.select({
      user: schema.users
    })
      .from(schema.teacherClassAssignments)
      .innerJoin(schema.users, eq(schema.teacherClassAssignments.teacherId, schema.users.id))
      .where(and(
        eq(schema.teacherClassAssignments.classId, classId),
        eq(schema.teacherClassAssignments.subjectId, subjectId),
        eq(schema.teacherClassAssignments.isActive, true)
      ));

    return assignments.map(a => a.user);
  }

  async updateTeacherClassAssignment(id: number, assignment: Partial<InsertTeacherClassAssignment>): Promise<TeacherClassAssignment | undefined> {
    const result = await this.db.update(schema.teacherClassAssignments)
      .set(assignment)
      .where(eq(schema.teacherClassAssignments.id, id))
      .returning();
    return result[0];
  }

  async deleteTeacherClassAssignment(id: number): Promise<boolean> {
    const result = await this.db.delete(schema.teacherClassAssignments)
      .where(eq(schema.teacherClassAssignments.id, id))
      .returning();
    return result.length > 0;
  }

  // Manual grading task queue implementation
  async createGradingTask(task: InsertGradingTask): Promise<GradingTask> {
    const result = await this.db.insert(schema.gradingTasks).values(task).returning();
    return result[0];
  }

  async assignGradingTask(taskId: number, teacherId: string): Promise<GradingTask | undefined> {
    const result = await this.db.update(schema.gradingTasks)
      .set({
        assignedTeacherId: teacherId,
        assignedAt: new Date(),
        status: 'in_progress'
      })
      .where(eq(schema.gradingTasks.id, taskId))
      .returning();
    return result[0];
  }

  async getGradingTasksByTeacher(teacherId: string, status?: string): Promise<GradingTask[]> {
    const conditions = [eq(schema.gradingTasks.assignedTeacherId, teacherId)];
    if (status) {
      conditions.push(eq(schema.gradingTasks.status, status));
    }

    return await this.db.select()
      .from(schema.gradingTasks)
      .where(and(...conditions))
      .orderBy(desc(schema.gradingTasks.priority), schema.gradingTasks.createdAt);
  }

  async getGradingTasksBySession(sessionId: number): Promise<GradingTask[]> {
    return await this.db.select()
      .from(schema.gradingTasks)
      .where(eq(schema.gradingTasks.sessionId, sessionId))
      .orderBy(schema.gradingTasks.createdAt);
  }

  async updateGradingTaskStatus(taskId: number, status: string, completedAt?: Date): Promise<GradingTask | undefined> {
    const updates: any = { status };
    if (status === 'in_progress' && !completedAt) {
      updates.startedAt = new Date();
    }
    if (status === 'completed' || completedAt) {
      updates.completedAt = completedAt || new Date();
    }

    const result = await this.db.update(schema.gradingTasks)
      .set(updates)
      .where(eq(schema.gradingTasks.id, taskId))
      .returning();
    return result[0];
  }

  async completeGradingTask(taskId: number, pointsEarned: number, feedbackText?: string): Promise<{ task: GradingTask; answer: StudentAnswer } | undefined> {
    try {
      // Get the grading task
      const task = await this.db.select()
        .from(schema.gradingTasks)
        .where(eq(schema.gradingTasks.id, taskId))
        .limit(1);

      if (!task || task.length === 0) return undefined;

      // Update the student answer with the grade
      const answerResult = await this.db.update(schema.studentAnswers)
        .set({
          pointsEarned,
          feedbackText,
          manualOverride: true
        })
        .where(eq(schema.studentAnswers.id, task[0].answerId))
        .returning();

      if (!answerResult || answerResult.length === 0) return undefined;

      // Update the grading task status
      const taskResult = await this.db.update(schema.gradingTasks)
        .set({
          status: 'completed',
          completedAt: new Date()
        })
        .where(eq(schema.gradingTasks.id, taskId))
        .returning();

      return {
        task: taskResult[0],
        answer: answerResult[0]
      };
    } catch (error) {
      console.error('Error completing grading task:', error);
      throw error;
    }
  }

  // Audit logging implementation
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const result = await this.db.insert(schema.auditLogs).values(log).returning();
    return result[0];
  }

  async getAuditLogs(filters?: {
    userId?: string;
    entityType?: string;
    entityId?: number;
    action?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
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

    let query = this.db.select()
      .from(schema.auditLogs)
      .orderBy(desc(schema.auditLogs.createdAt));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    return await query;
  }

  async getAuditLogsByEntity(entityType: string, entityId: number): Promise<AuditLog[]> {
    return await this.db.select()
      .from(schema.auditLogs)
      .where(and(
        eq(schema.auditLogs.entityType, entityType),
        eq(schema.auditLogs.entityId, entityId)
      ))
      .orderBy(desc(schema.auditLogs.createdAt));
  }
}

// Initialize storage - SUPABASE DATABASE ONLY (no fallback)
function initializeStorageSync(): IStorage {
  // CRITICAL: Only use Supabase database - no memory storage fallback
  if (!process.env.DATABASE_URL) {
    console.error('🚨 CRITICAL: DATABASE_URL environment variable is required');
    console.error('🚨 This application ONLY stores data in Supabase database');
    console.error('🚨 Please ensure your Supabase DATABASE_URL is properly configured');
    process.exit(1);
  }

  try {
    const dbStorage = new DatabaseStorage();
    console.log('✅ STORAGE: Using SUPABASE PostgreSQL Database - ALL DATA STORED IN SUPABASE');
    return dbStorage;
  } catch (error) {
    console.error('🚨 CRITICAL: Failed to connect to Supabase database');
    console.error('🚨 All data MUST be stored in Supabase database as requested');
    console.error('🚨 Database connection error:', error instanceof Error ? error.message : 'Unknown error');
    console.error('🚨 Application cannot continue without Supabase database connection');
    process.exit(1);
  }
}

// Initialize storage - Supabase database only
export const storage: IStorage = initializeStorageSync();