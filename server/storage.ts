import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import type { 
  User, InsertUser, Student, InsertStudent, Class, InsertClass, 
  Subject, InsertSubject, Attendance, InsertAttendance, Exam, InsertExam,
  ExamResult, InsertExamResult, Announcement, InsertAnnouncement,
  Message, InsertMessage, Gallery, InsertGallery, GalleryCategory, InsertGalleryCategory,
  Role, AcademicTerm
} from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

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
  getStudentsByClass(classId: number): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
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
  getExamResultsByStudent(studentId: string): Promise<ExamResult[]>;
  getExamResultsByExam(examId: number): Promise<ExamResult[]>;

  // Exam questions management
  createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion>;
  getExamQuestions(examId: number): Promise<ExamQuestion[]>;
  updateExamQuestion(id: number, question: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined>;
  deleteExamQuestion(id: number): Promise<boolean>;

  // Question options management  
  createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption>;
  getQuestionOptions(questionId: number): Promise<QuestionOption[]>;

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

  // Analytics and Reports
  getAnalyticsOverview(): Promise<any>;
  getPerformanceAnalytics(filters: any): Promise<any>;
  getTrendAnalytics(months: number): Promise<any>;
  getAttendanceAnalytics(filters: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User management
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(schema.users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(schema.users).set(user).where(eq(schema.users.id, id)).returning();
    return result[0];
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return await db.select().from(schema.users).where(eq(schema.users.roleId, roleId));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(schema.users).where(eq(schema.users.id, id));
    return result.rowCount > 0;
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

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return await db.select().from(schema.students).where(eq(schema.students.classId, classId));
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(schema.students).orderBy(asc(schema.students.createdAt));
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
    return result.rowCount > 0;
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
    return result.rowCount > 0;
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
    return await db.select().from(schema.exams)
      .orderBy(desc(schema.exams.date));
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    const result = await db.select().from(schema.exams)
      .where(eq(schema.exams.id, id))
      .limit(1);
    return result[0];
  }

  async getExamsByClass(classId: number): Promise<Exam[]> {
    return await db.select().from(schema.exams)
      .where(eq(schema.exams.classId, classId))
      .orderBy(desc(schema.exams.date));
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const result = await db.update(schema.exams)
      .set(exam)
      .where(eq(schema.exams.id, id))
      .returning();
    return result[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    const result = await db.delete(schema.exams)
      .where(eq(schema.exams.id, id));
    return result.rowCount > 0;
  }

  async recordExamResult(result: InsertExamResult): Promise<ExamResult> {
    const examResult = await db.insert(schema.examResults).values(result).returning();
    return examResult[0];
  }

  async getExamResultsByStudent(studentId: string): Promise<ExamResult[]> {
    return await db.select().from(schema.examResults)
      .where(eq(schema.examResults.studentId, studentId))
      .orderBy(desc(schema.examResults.createdAt));
  }

  async getExamResultsByExam(examId: number): Promise<ExamResult[]> {
    return await db.select().from(schema.examResults)
      .where(eq(schema.examResults.examId, examId))
      .orderBy(desc(schema.examResults.createdAt));
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
    return result.rowCount > 0;
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
          newStudentsThisMonth: students.filter(s => 
            s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          ).length,
          examsThisMonth: exams.filter(e => 
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
        const studentIds = studentsInClass.map(s => s.id);
        examResults = examResults.filter(r => studentIds.includes(r.studentId));
      }

      if (filters.subjectId) {
        const examsForSubject = await db.select().from(schema.exams)
          .where(eq(schema.exams.subjectId, filters.subjectId));
        const examIds = examsForSubject.map(e => e.id);
        examResults = examResults.filter(r => examIds.includes(r.examId));
      }

      // Calculate performance metrics
      const totalExams = examResults.length;
      const averageScore = totalExams > 0 ? 
        examResults.reduce((sum, r) => sum + r.marksObtained, 0) / totalExams : 0;
      
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
        passRate: Math.round((examResults.filter(r => r.marksObtained >= 50).length / totalExams) * 100)
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
      let attendance = await db.select().from(schema.attendance);
      
      // Apply filters
      if (filters.classId) {
        const studentsInClass = await db.select().from(schema.students)
          .where(eq(schema.students.classId, filters.classId));
        const studentIds = studentsInClass.map(s => s.id);
        attendance = attendance.filter(a => studentIds.includes(a.studentId));
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
      const classes = await db.select().from(schema.classes);
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
}

// Use memory storage as fallback if database isn't working
class MemoryStorage implements IStorage {
  private roles: Role[] = [
    { id: 1, name: 'Student', permissions: [], createdAt: new Date() },
    { id: 2, name: 'Teacher', permissions: [], createdAt: new Date() },
    { id: 3, name: 'Parent', permissions: [], createdAt: new Date() },
    { id: 4, name: 'Admin', permissions: [], createdAt: new Date() }
  ];

  private users: User[] = [
    {
      id: '1',
      email: 'student@demo.com',
      passwordHash: 'demo123',
      roleId: 1,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      address: '123 Student St',
      dateOfBirth: '2005-01-15',
      gender: 'Male',
      profileImageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      email: 'teacher@demo.com',
      passwordHash: 'demo123',
      roleId: 2,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1234567891',
      address: '456 Teacher Ave',
      dateOfBirth: '1985-05-20',
      gender: 'Female',
      profileImageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      email: 'parent@demo.com',
      passwordHash: 'demo123',
      roleId: 3,
      firstName: 'Bob',
      lastName: 'Johnson',
      phone: '+1234567892',
      address: '789 Parent Rd',
      dateOfBirth: '1980-09-10',
      gender: 'Male',
      profileImageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      email: 'admin@demo.com',
      passwordHash: 'demo123',
      roleId: 4,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567893',
      address: '101 Admin Blvd',
      dateOfBirth: '1975-12-25',
      gender: 'Other',
      profileImageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '5',
      email: 'mary.johnson@demo.com',
      passwordHash: 'demo123',
      roleId: 1,
      firstName: 'Mary',
      lastName: 'Johnson',
      phone: '+1234567894',
      address: '456 Student Ave',
      dateOfBirth: '2006-03-15',
      gender: 'Female',
      profileImageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '6',
      email: 'peter.wilson@demo.com',
      passwordHash: 'demo123',
      roleId: 1,
      firstName: 'Peter',
      lastName: 'Wilson',
      phone: '+1234567895',
      address: '789 Student Rd',
      dateOfBirth: '2005-07-20',
      gender: 'Male',
      profileImageUrl: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private subjects: Subject[] = [
    { id: 1, name: 'Mathematics', code: 'MATH101', description: 'Basic Mathematics', createdAt: new Date() },
    { id: 2, name: 'English Language', code: 'ENG101', description: 'English Language and Literature', createdAt: new Date() },
    { id: 3, name: 'Science', code: 'SCI101', description: 'Basic Science', createdAt: new Date() },
    { id: 4, name: 'Social Studies', code: 'SS101', description: 'Social Studies', createdAt: new Date() },
    { id: 5, name: 'Computer Studies', code: 'CS101', description: 'Introduction to Computing', createdAt: new Date() }
  ];

  private terms: AcademicTerm[] = [
    { id: 1, name: 'First Term', year: '2023/2024', startDate: '2023-09-01', endDate: '2023-12-15', isCurrent: true, createdAt: new Date() },
    { id: 2, name: 'Second Term', year: '2023/2024', startDate: '2024-01-08', endDate: '2024-04-12', isCurrent: false, createdAt: new Date() },
    { id: 3, name: 'Third Term', year: '2023/2024', startDate: '2024-04-22', endDate: '2024-07-26', isCurrent: false, createdAt: new Date() }
  ];

  private classes: Class[] = [
    { id: 1, name: 'JSS 1A', level: 'Junior Secondary', capacity: 30, classTeacherId: '2', currentTermId: 1, isActive: true, createdAt: new Date() },
    { id: 2, name: 'JSS 1B', level: 'Junior Secondary', capacity: 30, classTeacherId: '2', currentTermId: 1, isActive: true, createdAt: new Date() },
    { id: 3, name: 'JSS 2A', level: 'Junior Secondary', capacity: 28, classTeacherId: '2', currentTermId: 1, isActive: true, createdAt: new Date() },
    { id: 4, name: 'SS 1A', level: 'Senior Secondary', capacity: 25, classTeacherId: '2', currentTermId: 1, isActive: true, createdAt: new Date() }
  ];

  private students: Student[] = [
    { 
      id: '1', 
      admissionNumber: 'THS/2023/001', 
      classId: 1, 
      parentId: '3', 
      admissionDate: '2023-09-01', 
      createdAt: new Date() 
    },
    { 
      id: '5', 
      admissionNumber: 'THS/2023/002', 
      classId: 1, 
      parentId: '3', 
      admissionDate: '2023-09-01', 
      createdAt: new Date() 
    },
    { 
      id: '6', 
      admissionNumber: 'THS/2023/003', 
      classId: 2, 
      parentId: '3', 
      admissionDate: '2023-09-01', 
      createdAt: new Date() 
    }
  ];

  private attendance: Attendance[] = [
    { id: 1, studentId: '1', classId: 1, date: '2023-11-01', status: 'Present', notes: null, recordedBy: '2', createdAt: new Date() },
    { id: 2, studentId: '1', classId: 1, date: '2023-11-02', status: 'Present', notes: null, recordedBy: '2', createdAt: new Date() },
    { id: 3, studentId: '1', classId: 1, date: '2023-11-03', status: 'Late', notes: 'Arrived 30 minutes late', recordedBy: '2', createdAt: new Date() },
    { id: 4, studentId: '5', classId: 1, date: '2023-11-01', status: 'Present', notes: null, recordedBy: '2', createdAt: new Date() },
    { id: 5, studentId: '5', classId: 1, date: '2023-11-02', status: 'Absent', notes: 'Sick', recordedBy: '2', createdAt: new Date() },
    { id: 6, studentId: '6', classId: 2, date: '2023-11-01', status: 'Present', notes: null, recordedBy: '2', createdAt: new Date() }
  ];

  private exams: Exam[] = [
    { 
      id: 1, 
      name: 'First Term Test', 
      classId: 1, 
      subjectId: 1, 
      termId: 1, 
      date: '2023-10-15', 
      totalMarks: 100, 
      createdBy: '2', 
      timeLimit: 120, 
      startTime: null, 
      endTime: null, 
      instructions: 'Answer all questions. Good luck!', 
      isPublished: true, 
      allowRetakes: false, 
      shuffleQuestions: false,
      createdAt: new Date() 
    },
    { 
      id: 2, 
      name: 'First Term Test', 
      classId: 1, 
      subjectId: 2, 
      termId: 1, 
      date: '2023-10-16', 
      totalMarks: 100, 
      createdBy: '2', 
      timeLimit: 90, 
      startTime: null, 
      endTime: null, 
      instructions: 'Read questions carefully before answering.', 
      isPublished: true, 
      allowRetakes: false, 
      shuffleQuestions: true,
      createdAt: new Date() 
    },
    { 
      id: 3, 
      name: 'Mid-Term Assessment', 
      classId: 1, 
      subjectId: 1, 
      termId: 1, 
      date: '2023-11-15', 
      totalMarks: 50, 
      createdBy: '2', 
      timeLimit: 60, 
      startTime: null, 
      endTime: null, 
      instructions: 'This is a mid-term assessment. Show your work.', 
      isPublished: false, 
      allowRetakes: true, 
      shuffleQuestions: false,
      createdAt: new Date() 
    }
  ];

  private examQuestions: ExamQuestion[] = [];
  private questionOptions: QuestionOption[] = [];

  private examResults: ExamResult[] = [
    { id: 1, examId: 1, studentId: '1', marksObtained: 85, grade: 'A', remarks: 'Excellent performance', recordedBy: '2', createdAt: new Date() },
    { id: 2, examId: 2, studentId: '1', marksObtained: 78, grade: 'B+', remarks: 'Good improvement', recordedBy: '2', createdAt: new Date() },
    { id: 3, examId: 1, studentId: '5', marksObtained: 72, grade: 'B', remarks: 'Good effort', recordedBy: '2', createdAt: new Date() },
    { id: 4, examId: 2, studentId: '5', marksObtained: 68, grade: 'B-', remarks: 'Need more practice in essay writing', recordedBy: '2', createdAt: new Date() },
    { id: 5, examId: 3, studentId: '1', marksObtained: 42, grade: 'A', remarks: 'Excellent', recordedBy: '2', createdAt: new Date() }
  ];

  private announcements: Announcement[] = [
    { 
      id: 1, 
      title: 'Welcome to New Academic Session', 
      content: 'We welcome all students and parents to the 2023/2024 academic session. Classes begin on September 1st, 2023.', 
      targetRoles: ['All'], 
      targetClasses: [], 
      isPublished: true, 
      publishedAt: new Date('2023-08-25'), 
      authorId: '4', 
      createdAt: new Date('2023-08-25') 
    },
    { 
      id: 2, 
      title: 'Parent-Teacher Meeting', 
      content: 'There will be a parent-teacher meeting on December 10th, 2023 to discuss student progress for the first term.', 
      targetRoles: ['Parent'], 
      targetClasses: [], 
      isPublished: true, 
      publishedAt: new Date('2023-11-15'), 
      authorId: '4', 
      createdAt: new Date('2023-11-15') 
    },
    { 
      id: 3, 
      title: 'School Sports Day', 
      content: 'Our annual sports day will be held on November 25th, 2023. All students are expected to participate.', 
      targetRoles: ['Student'], 
      targetClasses: [], 
      isPublished: true, 
      publishedAt: new Date('2023-11-01'), 
      authorId: '4', 
      createdAt: new Date('2023-11-01') 
    }
  ];

  private messages: Message[] = [
    { 
      id: 1, 
      senderId: '2', 
      recipientId: '3', 
      subject: 'Student Progress Update', 
      content: 'Your child John Doe is performing excellently in Mathematics. Keep up the good work!', 
      isRead: false, 
      createdAt: new Date('2023-11-10') 
    },
    { 
      id: 2, 
      senderId: '4', 
      recipientId: '2', 
      subject: 'Staff Meeting Reminder', 
      content: 'Reminder: Staff meeting scheduled for tomorrow at 2:00 PM in the conference room.', 
      isRead: true, 
      createdAt: new Date('2023-11-11') 
    },
    { 
      id: 3, 
      senderId: '3', 
      recipientId: '2', 
      subject: 'Request for Extra Classes', 
      content: 'Could you please arrange extra Mathematics classes for my child? Thank you.', 
      isRead: false, 
      createdAt: new Date('2023-11-12') 
    }
  ];

  private galleryCategories: GalleryCategory[] = [
    { id: 1, name: 'School Events', description: 'Photos from various school events', createdAt: new Date() },
    { id: 2, name: 'Sports Activities', description: 'Sports and recreational activities', createdAt: new Date() },
    { id: 3, name: 'Academic Achievements', description: 'Academic competitions and awards', createdAt: new Date() },
    { id: 4, name: 'School Facilities', description: 'Photos of school buildings and facilities', createdAt: new Date() }
  ];

  private galleryImages: Gallery[] = [
    { id: 1, imageUrl: '/placeholder-gallery-1.jpg', caption: 'Annual Science Fair 2023', categoryId: 1, uploadedBy: '4', createdAt: new Date() },
    { id: 2, imageUrl: '/placeholder-gallery-2.jpg', caption: 'Inter-house Sports Competition', categoryId: 2, uploadedBy: '4', createdAt: new Date() },
    { id: 3, imageUrl: '/placeholder-gallery-3.jpg', caption: 'Mathematics Olympiad Winners', categoryId: 3, uploadedBy: '4', createdAt: new Date() },
    { id: 4, imageUrl: '/placeholder-gallery-4.jpg', caption: 'New Computer Laboratory', categoryId: 4, uploadedBy: '4', createdAt: new Date() },
    { id: 5, imageUrl: '/placeholder-gallery-5.jpg', caption: 'Graduation Ceremony 2023', categoryId: 1, uploadedBy: '4', createdAt: new Date() }
  ];

  async getUser(id: string): Promise<User | undefined> {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: String(this.users.length + 1),
      ...user,
      gender: user.gender ?? null,
      passwordHash: user.passwordHash ?? null,
      phone: user.phone ?? null,
      address: user.address ?? null,
      dateOfBirth: user.dateOfBirth ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      isActive: user.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.users[index] = { ...this.users[index], ...user, updatedAt: new Date() };
    return this.users[index];
  }

  async getUsersByRole(roleId: number): Promise<User[]> {
    return this.users.filter(u => u.roleId === roleId);
  }

  async deleteUser(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  async getRoles(): Promise<Role[]> {
    return this.roles;
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return this.roles.find(r => r.name === name);
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.find(s => s.id === id);
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const newStudent: Student = {
      ...student,
      id: student.id ?? String(this.students.length + 1),
      classId: student.classId ?? null,
      parentId: student.parentId ?? null,
      admissionDate: student.admissionDate ?? null,
      createdAt: new Date()
    };
    this.students.push(newStudent);
    return newStudent;
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return this.students.filter(s => s.classId === classId);
  }

  async getAllStudents(): Promise<Student[]> {
    return this.students;
  }

  async getStudentByAdmissionNumber(admissionNumber: string): Promise<Student | undefined> {
    return this.students.find(s => s.admissionNumber === admissionNumber);
  }

  async getClasses(): Promise<Class[]> {
    return this.classes;
  }

  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.find(c => c.id === id);
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const newClass: Class = {
      id: this.classes.length + 1,
      ...classData,
      isActive: classData.isActive ?? true,
      capacity: classData.capacity ?? 30,
      classTeacherId: classData.classTeacherId ?? null,
      currentTermId: classData.currentTermId ?? null,
      createdAt: new Date()
    };
    this.classes.push(newClass);
    return newClass;
  }

  async updateClass(id: number, classData: Partial<InsertClass>): Promise<Class | undefined> {
    const index = this.classes.findIndex(c => c.id === id);
    if (index === -1) return undefined;
    
    this.classes[index] = { ...this.classes[index], ...classData };
    return this.classes[index];
  }

  async deleteClass(id: number): Promise<boolean> {
    const index = this.classes.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.classes.splice(index, 1);
    return true;
  }

  async getSubjects(): Promise<Subject[]> {
    return this.subjects;
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    return this.subjects.find(s => s.id === id);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const newSubject: Subject = {
      id: this.subjects.length + 1,
      ...subject,
      description: subject.description ?? null,
      createdAt: new Date()
    };
    this.subjects.push(newSubject);
    return newSubject;
  }

  async updateSubject(id: number, subject: Partial<InsertSubject>): Promise<Subject | undefined> {
    const index = this.subjects.findIndex(s => s.id === id);
    if (index === -1) return undefined;
    
    this.subjects[index] = { ...this.subjects[index], ...subject };
    return this.subjects[index];
  }

  async deleteSubject(id: number): Promise<boolean> {
    const index = this.subjects.findIndex(s => s.id === id);
    if (index === -1) return false;
    this.subjects.splice(index, 1);
    return true;
  }

  async getCurrentTerm(): Promise<AcademicTerm | undefined> {
    return this.terms.find(t => t.isCurrent);
  }

  async getTerms(): Promise<AcademicTerm[]> {
    return this.terms;
  }

  async recordAttendance(attendance: InsertAttendance): Promise<Attendance> {
    const newAttendance: Attendance = {
      id: this.attendance.length + 1,
      ...attendance,
      status: attendance.status ?? null,
      notes: attendance.notes ?? null,
      createdAt: new Date()
    };
    this.attendance.push(newAttendance);
    return newAttendance;
  }

  async getAttendanceByStudent(studentId: string, date?: string): Promise<Attendance[]> {
    return this.attendance.filter(a => a.studentId === studentId && (!date || a.date === date));
  }

  async getAttendanceByClass(classId: number, date: string): Promise<Attendance[]> {
    return this.attendance.filter(a => a.classId === classId && a.date === date);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const newExam: Exam = {
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
      createdAt: new Date()
    };
    this.exams.push(newExam);
    return newExam;
  }

  async getAllExams(): Promise<Exam[]> {
    return [...this.exams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getExamById(id: number): Promise<Exam | undefined> {
    return this.exams.find(e => e.id === id);
  }

  async getExamsByClass(classId: number): Promise<Exam[]> {
    return this.exams.filter(e => e.classId === classId);
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const index = this.exams.findIndex(e => e.id === id);
    if (index === -1) return undefined;
    
    this.exams[index] = { ...this.exams[index], ...exam };
    return this.exams[index];
  }

  async deleteExam(id: number): Promise<boolean> {
    const index = this.exams.findIndex(e => e.id === id);
    if (index === -1) return false;
    
    this.exams.splice(index, 1);
    return true;
  }

  async recordExamResult(result: InsertExamResult): Promise<ExamResult> {
    const newResult: ExamResult = {
      id: this.examResults.length + 1,
      ...result,
      grade: result.grade ?? null,
      remarks: result.remarks ?? null,
      createdAt: new Date()
    };
    this.examResults.push(newResult);
    return newResult;
  }

  async getExamResultsByStudent(studentId: string): Promise<ExamResult[]> {
    return this.examResults.filter(r => r.studentId === studentId);
  }

  async getExamResultsByExam(examId: number): Promise<ExamResult[]> {
    return this.examResults.filter(r => r.examId === examId);
  }

  // Exam questions management
  async createExamQuestion(question: InsertExamQuestion): Promise<ExamQuestion> {
    const newQuestion: ExamQuestion = {
      id: this.examQuestions.length + 1,
      ...question,
      createdAt: new Date()
    };
    this.examQuestions.push(newQuestion);
    return newQuestion;
  }

  async getExamQuestions(examId: number): Promise<ExamQuestion[]> {
    return this.examQuestions
      .filter(q => q.examId === examId)
      .sort((a, b) => a.orderNumber - b.orderNumber);
  }

  async updateExamQuestion(id: number, question: Partial<InsertExamQuestion>): Promise<ExamQuestion | undefined> {
    const index = this.examQuestions.findIndex(q => q.id === id);
    if (index === -1) return undefined;
    
    this.examQuestions[index] = { ...this.examQuestions[index], ...question };
    return this.examQuestions[index];
  }

  async deleteExamQuestion(id: number): Promise<boolean> {
    const index = this.examQuestions.findIndex(q => q.id === id);
    if (index === -1) return false;
    
    // Also delete associated options
    this.questionOptions = this.questionOptions.filter(o => o.questionId !== id);
    this.examQuestions.splice(index, 1);
    return true;
  }

  // Question options management
  async createQuestionOption(option: InsertQuestionOption): Promise<QuestionOption> {
    const newOption: QuestionOption = {
      id: this.questionOptions.length + 1,
      ...option,
      createdAt: new Date()
    };
    this.questionOptions.push(newOption);
    return newOption;
  }

  async getQuestionOptions(questionId: number): Promise<QuestionOption[]> {
    return this.questionOptions.filter(o => o.questionId === questionId);
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const newAnnouncement: Announcement = {
      id: this.announcements.length + 1,
      ...announcement,
      targetRoles: announcement.targetRoles ?? null,
      targetClasses: announcement.targetClasses ?? null,
      isPublished: announcement.isPublished ?? false,
      publishedAt: announcement.publishedAt ?? null,
      createdAt: new Date()
    };
    this.announcements.push(newAnnouncement);
    return newAnnouncement;
  }

  async getAnnouncements(targetRole?: string): Promise<Announcement[]> {
    if (!targetRole) return this.announcements;
    return this.announcements.filter(a => 
      a.targetRoles?.includes(targetRole) || a.targetRoles?.includes('All')
    );
  }

  async getAnnouncementById(id: number): Promise<Announcement | undefined> {
    return this.announcements.find(a => a.id === id);
  }

  async updateAnnouncement(id: number, announcement: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const index = this.announcements.findIndex(a => a.id === id);
    if (index === -1) return undefined;
    
    this.announcements[index] = { ...this.announcements[index], ...announcement };
    return this.announcements[index];
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const index = this.announcements.findIndex(a => a.id === id);
    if (index === -1) return false;
    this.announcements.splice(index, 1);
    return true;
  }

  async sendMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      id: this.messages.length + 1,
      ...message,
      isRead: message.isRead ?? false,
      createdAt: new Date()
    };
    this.messages.push(newMessage);
    return newMessage;
  }

  async getMessagesByUser(userId: string): Promise<Message[]> {
    return this.messages.filter(m => m.senderId === userId || m.recipientId === userId);
  }

  async markMessageAsRead(id: number): Promise<void> {
    const message = this.messages.find(m => m.id === id);
    if (message) {
      message.isRead = true;
    }
  }

  async createGalleryCategory(category: InsertGalleryCategory): Promise<GalleryCategory> {
    const newCategory: GalleryCategory = {
      id: this.galleryCategories.length + 1,
      ...category,
      description: category.description ?? null,
      createdAt: new Date()
    };
    this.galleryCategories.push(newCategory);
    return newCategory;
  }

  async getGalleryCategories(): Promise<GalleryCategory[]> {
    return this.galleryCategories;
  }

  async uploadGalleryImage(image: InsertGallery): Promise<Gallery> {
    const newImage: Gallery = {
      id: this.galleryImages.length + 1,
      ...image,
      caption: image.caption ?? null,
      categoryId: image.categoryId ?? null,
      uploadedBy: image.uploadedBy ?? null,
      createdAt: new Date()
    };
    this.galleryImages.push(newImage);
    return newImage;
  }

  async getGalleryImages(categoryId?: number): Promise<Gallery[]> {
    if (!categoryId) return this.galleryImages;
    return this.galleryImages.filter(i => i.categoryId === categoryId);
  }

  async getGalleryImageById(id: string): Promise<Gallery | undefined> {
    return this.galleryImages.find(img => img.id === parseInt(id));
  }

  async deleteGalleryImage(id: string): Promise<boolean> {
    const index = this.galleryImages.findIndex(img => img.id === parseInt(id));
    if (index !== -1) {
      this.galleryImages.splice(index, 1);
      return true;
    }
    return false;
  }

  // Analytics and Reports
  async getAnalyticsOverview(): Promise<any> {
    const students = this.users.filter(u => u.roleId === 1);
    const teachers = this.users.filter(u => u.roleId === 2);
    const admins = this.users.filter(u => u.roleId === 4);
    const parents = this.users.filter(u => u.roleId === 3);

    const gradeDistribution = this.calculateGradeDistribution(this.examResults);

    return {
      totalUsers: this.users.length,
      totalStudents: students.length,
      totalTeachers: teachers.length,
      totalAdmins: admins.length,
      totalParents: parents.length,
      totalClasses: this.classes.length,
      totalSubjects: this.subjects.length,
      totalExams: this.exams.length,
      totalExamResults: this.examResults.length,
      averageClassSize: this.classes.length > 0 ? Math.round(students.length / this.classes.length) : 0,
      gradeDistribution,
      subjectPerformance: this.calculateSubjectPerformance(this.examResults, this.subjects),
      recentActivity: {
        newStudentsThisMonth: students.filter(s => 
          s.createdAt && new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length,
        examsThisMonth: this.exams.filter(e => 
          e.createdAt && new Date(e.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ).length
      }
    };
  }

  async getPerformanceAnalytics(filters: any): Promise<any> {
    let examResults = [...this.examResults];
    
    // Apply filters if provided
    if (filters.classId) {
      const studentsInClass = this.students.filter(s => s.classId === filters.classId);
      const studentIds = studentsInClass.map(s => s.id);
      examResults = examResults.filter(r => studentIds.includes(r.studentId));
    }

    if (filters.subjectId) {
      const examsForSubject = this.exams.filter(e => e.subjectId === filters.subjectId);
      const examIds = examsForSubject.map(e => e.id);
      examResults = examResults.filter(r => examIds.includes(r.examId));
    }

    // Calculate performance metrics
    const totalExams = examResults.length;
    const averageScore = totalExams > 0 ? 
      examResults.reduce((sum, r) => sum + r.marksObtained, 0) / totalExams : 0;
    
    const gradeDistribution = this.calculateGradeDistribution(examResults);
    const performanceTrends = this.calculatePerformanceTrends(examResults);
    const studentPerformance = this.calculateStudentPerformance(examResults);

    return {
      totalExams,
      averageScore: Math.round(averageScore * 100) / 100,
      averagePercentage: Math.round((averageScore / 100) * 100),
      gradeDistribution,
      performanceTrends,
      topPerformers: studentPerformance.slice(0, 5),
      strugglingStudents: studentPerformance.slice(-5),
      passRate: Math.round((examResults.filter(r => r.marksObtained >= 50).length / totalExams) * 100)
    };
  }

  async getTrendAnalytics(months: number = 6): Promise<any> {
    // Generate monthly trends for demo
    const monthlyData = [];
    for (let i = months - 1; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      
      const monthName = month.toLocaleString('default', { month: 'short' });
      const year = month.getFullYear();
      
      monthlyData.push({
        month: monthName,
        year,
        students: this.users.filter(u => u.roleId === 1).length + Math.floor(Math.random() * 10) - 5,
        exams: Math.floor(this.exams.length / months) + Math.floor(Math.random() * 3),
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
  }

  async getAttendanceAnalytics(filters: any): Promise<any> {
    try {
      let attendance = [...this.attendance];
      
      // Apply filters
      if (filters.classId) {
        const studentsInClass = this.students.filter(s => s.classId === filters.classId);
        const studentIds = studentsInClass.map(s => s.id);
        attendance = attendance.filter(a => studentIds.includes(a.studentId));
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
        classComparison: this.calculateClassAttendanceComparison()
      };
    } catch (error) {
      console.error('Error in getAttendanceAnalytics:', error);
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
        error: 'Failed to calculate attendance analytics'
      };
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

  private calculateSubjectPerformance(examResults: any[], subjects: any[]): any[] {
    const subjectMap = new Map();
    subjects.forEach(s => subjectMap.set(s.id, s.name));

    const performance = new Map();
    examResults.forEach(result => {
      const exam = this.exams.find(e => e.id === result.examId);
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
      subject: subjectMap.get(subjectId) || 'Unknown',
      average: Math.round((data.total / data.count) * 100) / 100,
      examCount: data.count
    }));
  }

  private calculatePerformanceTrends(examResults: any[]): any[] {
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

  private calculateClassAttendanceComparison(): any[] {
    return this.classes.map(cls => ({
      className: cls.name,
      attendanceRate: 85 + Math.floor(Math.random() * 15),
      level: cls.level
    }));
  }

  private getFallbackAnalytics(): any {
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
}

// Use real database storage
const storage: IStorage = new DatabaseStorage();
console.log('✅ STORAGE: Using PostgreSQL DatabaseStorage with URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

export { storage };
