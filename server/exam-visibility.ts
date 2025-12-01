import { storage } from './storage';

interface StudentExamVisibilityContext {
  studentId: string;
  classId: number;
  classLevel: string;
  department?: string;
}

interface SubjectInfo {
  id: number;
  category: string;
}

function isSeniorSecondaryLevel(level: string): boolean {
  const normalizedLevel = level.trim().toLowerCase();
  return (
    normalizedLevel.includes('senior secondary') ||
    normalizedLevel.includes('senior_secondary') ||
    /^ss\s*[123]$/i.test(normalizedLevel) ||
    /^sss\s*[123]$/i.test(normalizedLevel)
  );
}

function normalizeCategory(category: string | null | undefined): string {
  return (category || 'general').trim().toLowerCase();
}

function normalizeDepartment(department: string | null | undefined): string | undefined {
  const normalized = (department || '').trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
}

export async function getStudentExamVisibilityContext(studentId: string): Promise<StudentExamVisibilityContext | null> {
  const student = await storage.getStudent(studentId);
  
  if (!student || !student.classId) {
    return null;
  }
  
  const studentClass = await storage.getClass(student.classId);
  if (!studentClass) {
    return null;
  }
  
  return {
    studentId,
    classId: student.classId,
    classLevel: studentClass.level || '',
    department: normalizeDepartment(student.department)
  };
}

export function filterExamsForStudentContext(
  exams: any[],
  context: StudentExamVisibilityContext,
  subjects: SubjectInfo[]
): any[] {
  const isSS = isSeniorSecondaryLevel(context.classLevel);
  
  let filteredExams = exams.filter((exam: any) => {
    return exam.isPublished && exam.classId === context.classId;
  });
  
  if (isSS) {
    const studentDept = context.department;
    
    if (studentDept) {
      const validSubjectIds = subjects
        .filter(s => {
          const category = normalizeCategory(s.category);
          return category === 'general' || category === studentDept;
        })
        .map(s => s.id);
      
      filteredExams = filteredExams.filter((exam: any) => 
        validSubjectIds.includes(exam.subjectId)
      );
    } else {
      const generalSubjectIds = subjects
        .filter(s => normalizeCategory(s.category) === 'general')
        .map(s => s.id);
      
      filteredExams = filteredExams.filter((exam: any) => 
        generalSubjectIds.includes(exam.subjectId)
      );
    }
  } else {
    const generalSubjectIds = subjects
      .filter(s => normalizeCategory(s.category) === 'general')
      .map(s => s.id);
    
    filteredExams = filteredExams.filter((exam: any) => 
      generalSubjectIds.includes(exam.subjectId)
    );
  }
  
  return filteredExams;
}

export async function getVisibleExamsForStudent(studentId: string): Promise<any[]> {
  const context = await getStudentExamVisibilityContext(studentId);
  
  if (!context) {
    console.log(`[EXAM-VISIBILITY] No student context found for studentId: ${studentId}`);
    console.log(`[EXAM-VISIBILITY] Make sure student has a record in students table with valid classId`);
    return [];
  }
  
  const [allExams, subjects] = await Promise.all([
    storage.getAllExams(),
    storage.getSubjects()
  ]);
  
  const visibleExams = filterExamsForStudentContext(allExams, context, subjects);
  
  console.log(`[EXAM-VISIBILITY] Student ${studentId} context:`, {
    classId: context.classId,
    classLevel: context.classLevel,
    department: context.department,
    isSS: isSeniorSecondaryLevel(context.classLevel)
  });
  console.log(`[EXAM-VISIBILITY] Found ${allExams.length} total exams, ${visibleExams.length} visible to student`);
  
  return visibleExams;
}

export async function getVisibleExamsForParent(parentId: string): Promise<any[]> {
  const children = await storage.getStudentsByParentId(parentId);
  
  if (!children || children.length === 0) {
    return [];
  }
  
  const childContexts = await Promise.all(
    children.map((child: any) => getStudentExamVisibilityContext(child.id))
  );
  
  const validContexts = childContexts.filter((ctx): ctx is StudentExamVisibilityContext => ctx !== null);
  
  if (validContexts.length === 0) {
    return [];
  }
  
  const [allExams, subjects] = await Promise.all([
    storage.getAllExams(),
    storage.getSubjects()
  ]);
  
  const childExamsMap = new Map<number, any>();
  
  for (const context of validContexts) {
    const childExams = filterExamsForStudentContext(allExams, context, subjects);
    for (const exam of childExams) {
      if (!childExamsMap.has(exam.id)) {
        childExamsMap.set(exam.id, exam);
      }
    }
  }
  
  return Array.from(childExamsMap.values());
}

export async function canStudentAccessExam(studentId: string, examId: number): Promise<boolean> {
  const visibleExams = await getVisibleExamsForStudent(studentId);
  return visibleExams.some((exam: any) => exam.id === examId);
}

export async function getStudentsForTeacherExam(
  teacherId: string, 
  examClassId: number, 
  examSubjectId: number
): Promise<any[]> {
  const students = await storage.getStudentsByClass(examClassId);
  
  if (!students || students.length === 0) {
    return [];
  }
  
  const subjects = await storage.getSubjects();
  const examSubject = subjects.find(s => s.id === examSubjectId);
  
  if (!examSubject) {
    return [];
  }
  
  const examSubjectCategory = normalizeCategory(examSubject.category);
  
  if (examSubjectCategory === 'general') {
    return students;
  }
  
  const studentClass = await storage.getClass(examClassId);
  
  if (!studentClass || !isSeniorSecondaryLevel(studentClass.level)) {
    return students;
  }
  
  return students.filter((student: any) => {
    const studentDept = normalizeDepartment(student.department);
    return studentDept === examSubjectCategory;
  });
}
