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
  getExamsByClass(classId: number): Promise<Exam[]>;
  recordExamResult(result: InsertExamResult): Promise<ExamResult>;
  getExamResultsByStudent(studentId: string): Promise<ExamResult[]>;

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

  async getExamsByClass(classId: number): Promise<Exam[]> {
    return await db.select().from(schema.exams)
      .where(eq(schema.exams.classId, classId))
      .orderBy(desc(schema.exams.date));
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
    { id: 1, name: 'First Term Test', classId: 1, subjectId: 1, termId: 1, date: '2023-10-15', totalMarks: 100, createdBy: '2', createdAt: new Date() },
    { id: 2, name: 'First Term Test', classId: 1, subjectId: 2, termId: 1, date: '2023-10-16', totalMarks: 100, createdBy: '2', createdAt: new Date() },
    { id: 3, name: 'Mid-Term Assessment', classId: 1, subjectId: 1, termId: 1, date: '2023-11-15', totalMarks: 50, createdBy: '2', createdAt: new Date() }
  ];

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
      createdAt: new Date()
    };
    this.exams.push(newExam);
    return newExam;
  }

  async getExamsByClass(classId: number): Promise<Exam[]> {
    return this.exams.filter(e => e.classId === classId);
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
}

// Use memory storage for now (demo mode)
const storage: IStorage = new MemoryStorage();
console.log('Using memory storage with demo data');

export { storage };
