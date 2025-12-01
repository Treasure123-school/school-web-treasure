import { Router, Request, Response } from 'express';
import { db } from './db';
import { 
  teacherClassAssignments, 
  teacherAssignmentHistory, 
  gradingBoundaries, 
  continuousAssessment,
  classes,
  subjects,
  users,
  academicTerms,
  students
} from '@shared/schema.pg';
import { eq, and, desc, sql, isNull, or, gte, inArray } from 'drizzle-orm';
import { ROLE_IDS } from '@shared/role-constants';
import { z } from 'zod';
import { 
  checkTeacherAssignment, 
  getTeacherAssignments, 
  logUnauthorizedAccess 
} from './teacher-auth-middleware';

const router = Router();

const createAssignmentSchema = z.object({
  teacherId: z.string().min(1),
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  termId: z.number().int().positive().optional(),
  session: z.string().optional(),
  department: z.string().optional(),
  validUntil: z.string().optional(),
});

const updateAssignmentSchema = z.object({
  isActive: z.boolean().optional(),
  termId: z.number().int().positive().optional().nullable(),
  session: z.string().optional(),
  department: z.string().optional(),
  validUntil: z.string().optional().nullable(),
});

const gradingBoundarySchema = z.object({
  name: z.string().min(1),
  grade: z.string().min(1),
  minScore: z.number().int().min(0).max(100),
  maxScore: z.number().int().min(0).max(100),
  remark: z.string().optional(),
  gradePoint: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  termId: z.number().int().positive().optional().nullable(),
  classId: z.number().int().positive().optional().nullable(),
  subjectId: z.number().int().positive().optional().nullable(),
});

const continuousAssessmentSchema = z.object({
  studentId: z.string().min(1),
  classId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  termId: z.number().int().positive(),
  testScore: z.number().int().min(0).max(40).optional(),
  examScore: z.number().int().min(0).max(60).optional(),
});

const requireAuth = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

const requireAdmin = (req: Request, res: Response, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  const user = req.user as { roleId: number };
  if (user.roleId !== ROLE_IDS.SUPER_ADMIN && user.roleId !== ROLE_IDS.ADMIN) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

function sanitizeIp(ip: string | undefined): string | null {
  if (!ip) return null;
  const sanitized = ip.replace(/[^a-fA-F0-9.:,\s]/g, '').substring(0, 45);
  return sanitized || null;
}

router.get('/api/teacher-assignments', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; roleId: number };
    const { teacherId, classId, subjectId, termId, active, includeInactive } = req.query;
    const now = new Date();

    let conditions: any[] = [];

    if (user.roleId === ROLE_IDS.TEACHER) {
      conditions.push(eq(teacherClassAssignments.teacherId, user.id));
      conditions.push(eq(teacherClassAssignments.isActive, true));
      conditions.push(or(
        isNull(teacherClassAssignments.validUntil),
        gte(teacherClassAssignments.validUntil, now)
      ));
    } else {
      if (teacherId && typeof teacherId === 'string') {
        conditions.push(eq(teacherClassAssignments.teacherId, teacherId));
      }
      if (active === 'true' || includeInactive !== 'true') {
        conditions.push(eq(teacherClassAssignments.isActive, true));
      }
    }

    if (classId) {
      conditions.push(eq(teacherClassAssignments.classId, parseInt(classId as string)));
    }
    if (subjectId) {
      conditions.push(eq(teacherClassAssignments.subjectId, parseInt(subjectId as string)));
    }
    if (termId) {
      conditions.push(eq(teacherClassAssignments.termId, parseInt(termId as string)));
    }

    const assignments = await db
      .select({
        id: teacherClassAssignments.id,
        teacherId: teacherClassAssignments.teacherId,
        classId: teacherClassAssignments.classId,
        subjectId: teacherClassAssignments.subjectId,
        department: teacherClassAssignments.department,
        termId: teacherClassAssignments.termId,
        session: teacherClassAssignments.session,
        isActive: teacherClassAssignments.isActive,
        validUntil: teacherClassAssignments.validUntil,
        createdAt: teacherClassAssignments.createdAt,
        teacherFirstName: users.firstName,
        teacherLastName: users.lastName,
        className: classes.name,
        classLevel: classes.level,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(teacherClassAssignments)
      .leftJoin(users, eq(teacherClassAssignments.teacherId, users.id))
      .leftJoin(classes, eq(teacherClassAssignments.classId, classes.id))
      .leftJoin(subjects, eq(teacherClassAssignments.subjectId, subjects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(teacherClassAssignments.createdAt));

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching teacher assignments:', error);
    res.status(500).json({ message: 'Failed to fetch assignments' });
  }
});

router.post('/api/teacher-assignments', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    const data = createAssignmentSchema.parse(req.body);

    const existingAssignment = await db
      .select()
      .from(teacherClassAssignments)
      .where(and(
        eq(teacherClassAssignments.teacherId, data.teacherId),
        eq(teacherClassAssignments.classId, data.classId),
        eq(teacherClassAssignments.subjectId, data.subjectId),
        eq(teacherClassAssignments.isActive, true),
        data.termId ? eq(teacherClassAssignments.termId, data.termId) : isNull(teacherClassAssignments.termId)
      ))
      .limit(1);

    if (existingAssignment.length > 0) {
      const existing = existingAssignment[0];
      return res.status(409).json({ 
        message: 'This teacher is already assigned to this class/subject combination',
        existingAssignment: {
          id: existing.id,
          termId: existing.termId,
          session: existing.session,
          validUntil: existing.validUntil
        },
        hint: 'You can update the existing assignment or deactivate it before creating a new one.'
      });
    }

    let newAssignment;
    try {
      [newAssignment] = await db.insert(teacherClassAssignments).values({
        teacherId: data.teacherId,
        classId: data.classId,
        subjectId: data.subjectId,
        termId: data.termId || null,
        session: data.session || null,
        department: data.department || null,
        assignedBy: user.id,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: true,
      }).returning();
    } catch (dbError: any) {
      if (dbError.code === '23505') {
        return res.status(409).json({ 
          message: 'A duplicate assignment already exists for this teacher-class-subject combination.',
          hint: 'Please check existing assignments or update the current one.'
        });
      }
      throw dbError;
    }

    await db.insert(teacherAssignmentHistory).values({
      assignmentId: newAssignment.id,
      teacherId: data.teacherId,
      classId: data.classId,
      subjectId: data.subjectId,
      action: 'created',
      newValues: JSON.stringify(newAssignment),
      performedBy: user.id,
      ipAddress: sanitizeIp(req.headers['x-forwarded-for'] as string) || sanitizeIp(req.ip),
    });

    res.status(201).json(newAssignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating teacher assignment:', error);
    res.status(500).json({ message: 'Failed to create assignment' });
  }
});

router.put('/api/teacher-assignments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    const assignmentId = parseInt(req.params.id);
    const data = updateAssignmentSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(teacherClassAssignments)
      .where(eq(teacherClassAssignments.id, assignmentId));

    if (!existing) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const updateData: any = { updatedAt: new Date() };
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.termId !== undefined) updateData.termId = data.termId;
    if (data.session !== undefined) updateData.session = data.session;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.validUntil !== undefined) {
      updateData.validUntil = data.validUntil ? new Date(data.validUntil) : null;
    }

    const [updated] = await db
      .update(teacherClassAssignments)
      .set(updateData)
      .where(eq(teacherClassAssignments.id, assignmentId))
      .returning();

    await db.insert(teacherAssignmentHistory).values({
      assignmentId,
      teacherId: existing.teacherId,
      classId: existing.classId,
      subjectId: existing.subjectId,
      action: 'updated',
      previousValues: JSON.stringify(existing),
      newValues: JSON.stringify(updated),
      performedBy: user.id,
      ipAddress: sanitizeIp(req.headers['x-forwarded-for'] as string) || sanitizeIp(req.ip),
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error updating teacher assignment:', error);
    res.status(500).json({ message: 'Failed to update assignment' });
  }
});

router.delete('/api/teacher-assignments/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    const assignmentId = parseInt(req.params.id);

    const [existing] = await db
      .select()
      .from(teacherClassAssignments)
      .where(eq(teacherClassAssignments.id, assignmentId));

    if (!existing) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    await db.insert(teacherAssignmentHistory).values({
      assignmentId,
      teacherId: existing.teacherId,
      classId: existing.classId,
      subjectId: existing.subjectId,
      action: 'deleted',
      previousValues: JSON.stringify(existing),
      performedBy: user.id,
      reason: req.body.reason || null,
      ipAddress: sanitizeIp(req.headers['x-forwarded-for'] as string) || sanitizeIp(req.ip),
    });

    await db
      .delete(teacherClassAssignments)
      .where(eq(teacherClassAssignments.id, assignmentId));

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher assignment:', error);
    res.status(500).json({ message: 'Failed to delete assignment' });
  }
});

router.get('/api/grading-boundaries', requireAuth, async (req: Request, res: Response) => {
  try {
    const { termId, classId, subjectId, defaultOnly } = req.query;
    let conditions: any[] = [];

    if (termId) conditions.push(eq(gradingBoundaries.termId, parseInt(termId as string)));
    if (classId) conditions.push(eq(gradingBoundaries.classId, parseInt(classId as string)));
    if (subjectId) conditions.push(eq(gradingBoundaries.subjectId, parseInt(subjectId as string)));
    if (defaultOnly === 'true') conditions.push(eq(gradingBoundaries.isDefault, true));

    const boundaries = await db
      .select()
      .from(gradingBoundaries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(gradingBoundaries.minScore));

    res.json(boundaries);
  } catch (error) {
    console.error('Error fetching grading boundaries:', error);
    res.status(500).json({ message: 'Failed to fetch grading boundaries' });
  }
});

router.post('/api/grading-boundaries', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    const data = gradingBoundarySchema.parse(req.body);

    if (data.minScore > data.maxScore) {
      return res.status(400).json({ message: 'Minimum score cannot be greater than maximum score' });
    }

    const [newBoundary] = await db.insert(gradingBoundaries).values({
      name: data.name,
      grade: data.grade,
      minScore: data.minScore,
      maxScore: data.maxScore,
      remark: data.remark || null,
      gradePoint: data.gradePoint || null,
      isDefault: data.isDefault || false,
      termId: data.termId || null,
      classId: data.classId || null,
      subjectId: data.subjectId || null,
      createdBy: user.id,
    }).returning();

    res.status(201).json(newBoundary);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error creating grading boundary:', error);
    res.status(500).json({ message: 'Failed to create grading boundary' });
  }
});

router.post('/api/grading-boundaries/bulk', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    const { boundaries, name, isDefault, termId, classId, subjectId } = req.body;

    if (!Array.isArray(boundaries) || boundaries.length === 0) {
      return res.status(400).json({ message: 'Boundaries array is required' });
    }

    const boundariesToInsert = boundaries.map(b => ({
      name: name || 'Standard',
      grade: b.grade,
      minScore: b.minScore,
      maxScore: b.maxScore,
      remark: b.remark || null,
      gradePoint: b.gradePoint || null,
      isDefault: isDefault || false,
      termId: termId || null,
      classId: classId || null,
      subjectId: subjectId || null,
      createdBy: user.id,
    }));

    const created = await db.insert(gradingBoundaries).values(boundariesToInsert).returning();

    res.status(201).json(created);
  } catch (error) {
    console.error('Error creating bulk grading boundaries:', error);
    res.status(500).json({ message: 'Failed to create grading boundaries' });
  }
});

router.delete('/api/grading-boundaries/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const boundaryId = parseInt(req.params.id);
    await db.delete(gradingBoundaries).where(eq(gradingBoundaries.id, boundaryId));
    res.json({ message: 'Grading boundary deleted successfully' });
  } catch (error) {
    console.error('Error deleting grading boundary:', error);
    res.status(500).json({ message: 'Failed to delete grading boundary' });
  }
});

router.get('/api/continuous-assessment', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; roleId: number };
    const { classId, subjectId, termId, studentId } = req.query;

    let conditions: any[] = [];

    if (user.roleId === ROLE_IDS.TEACHER) {
      const assignments = await getTeacherAssignments(user.id, termId ? parseInt(termId as string) : undefined);
      if (assignments.length === 0) {
        return res.json([]);
      }
      const classIds = [...new Set(assignments.map(a => a.classId))];
      const subjectIds = [...new Set(assignments.map(a => a.subjectId))];
      conditions.push(inArray(continuousAssessment.classId, classIds));
      conditions.push(inArray(continuousAssessment.subjectId, subjectIds));
    }

    if (classId) conditions.push(eq(continuousAssessment.classId, parseInt(classId as string)));
    if (subjectId) conditions.push(eq(continuousAssessment.subjectId, parseInt(subjectId as string)));
    if (termId) conditions.push(eq(continuousAssessment.termId, parseInt(termId as string)));
    if (studentId) conditions.push(eq(continuousAssessment.studentId, studentId as string));

    const assessments = await db
      .select({
        id: continuousAssessment.id,
        studentId: continuousAssessment.studentId,
        classId: continuousAssessment.classId,
        subjectId: continuousAssessment.subjectId,
        termId: continuousAssessment.termId,
        testScore: continuousAssessment.testScore,
        examScore: continuousAssessment.examScore,
        totalScore: continuousAssessment.totalScore,
        grade: continuousAssessment.grade,
        remark: continuousAssessment.remark,
        isLocked: continuousAssessment.isLocked,
        createdAt: continuousAssessment.createdAt,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
      })
      .from(continuousAssessment)
      .leftJoin(students, eq(continuousAssessment.studentId, students.id))
      .leftJoin(users, eq(students.id, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(continuousAssessment.createdAt));

    res.json(assessments);
  } catch (error) {
    console.error('Error fetching continuous assessments:', error);
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
});

router.post('/api/continuous-assessment', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; roleId: number };
    const data = continuousAssessmentSchema.parse(req.body);

    if (user.roleId === ROLE_IDS.TEACHER) {
      const hasAssignment = await checkTeacherAssignment(user.id, data.classId, data.subjectId);
      if (!hasAssignment) {
        await logUnauthorizedAccess(
          user.id,
          'enter_ca_score',
          '/api/continuous-assessment',
          data.classId,
          data.subjectId,
          'Teacher not assigned to this class/subject',
          req as any
        );
        return res.status(403).json({ message: 'You are not authorized to enter scores for this class/subject' });
      }
    }

    const totalScore = (data.testScore || 0) + (data.examScore || 0);
    
    const defaultBoundaries = await db
      .select()
      .from(gradingBoundaries)
      .where(eq(gradingBoundaries.isDefault, true))
      .orderBy(desc(gradingBoundaries.minScore));

    let grade = 'F';
    let remark = 'Fail';
    for (const boundary of defaultBoundaries) {
      if (totalScore >= boundary.minScore && totalScore <= boundary.maxScore) {
        grade = boundary.grade;
        remark = boundary.remark || '';
        break;
      }
    }

    const [existing] = await db
      .select()
      .from(continuousAssessment)
      .where(and(
        eq(continuousAssessment.studentId, data.studentId),
        eq(continuousAssessment.classId, data.classId),
        eq(continuousAssessment.subjectId, data.subjectId),
        eq(continuousAssessment.termId, data.termId)
      ));

    if (existing) {
      if (existing.isLocked) {
        return res.status(403).json({ message: 'This assessment record is locked and cannot be modified' });
      }

      const [updated] = await db
        .update(continuousAssessment)
        .set({
          testScore: data.testScore ?? existing.testScore,
          examScore: data.examScore ?? existing.examScore,
          totalScore,
          grade,
          remark,
          enteredBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(continuousAssessment.id, existing.id))
        .returning();

      return res.json(updated);
    }

    const [newAssessment] = await db.insert(continuousAssessment).values({
      studentId: data.studentId,
      classId: data.classId,
      subjectId: data.subjectId,
      termId: data.termId,
      testScore: data.testScore || null,
      examScore: data.examScore || null,
      totalScore,
      grade,
      remark,
      teacherId: user.roleId === ROLE_IDS.TEACHER ? user.id : null,
      enteredBy: user.id,
    }).returning();

    res.status(201).json(newAssessment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Validation error', errors: error.errors });
    }
    console.error('Error saving continuous assessment:', error);
    res.status(500).json({ message: 'Failed to save assessment' });
  }
});

router.post('/api/continuous-assessment/:id/lock', requireAdmin, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string };
    const assessmentId = parseInt(req.params.id);

    const [updated] = await db
      .update(continuousAssessment)
      .set({
        isLocked: true,
        lockedBy: user.id,
        lockedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(continuousAssessment.id, assessmentId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error locking assessment:', error);
    res.status(500).json({ message: 'Failed to lock assessment' });
  }
});

router.post('/api/continuous-assessment/:id/unlock', requireAdmin, async (req: Request, res: Response) => {
  try {
    const assessmentId = parseInt(req.params.id);

    const [updated] = await db
      .update(continuousAssessment)
      .set({
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(continuousAssessment.id, assessmentId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error unlocking assessment:', error);
    res.status(500).json({ message: 'Failed to unlock assessment' });
  }
});

router.get('/api/teacher-assignments/history', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { teacherId, limit = '50' } = req.query;
    let conditions: any[] = [];

    if (teacherId) {
      conditions.push(eq(teacherAssignmentHistory.teacherId, teacherId as string));
    }

    const history = await db
      .select({
        id: teacherAssignmentHistory.id,
        assignmentId: teacherAssignmentHistory.assignmentId,
        teacherId: teacherAssignmentHistory.teacherId,
        classId: teacherAssignmentHistory.classId,
        subjectId: teacherAssignmentHistory.subjectId,
        action: teacherAssignmentHistory.action,
        previousValues: teacherAssignmentHistory.previousValues,
        newValues: teacherAssignmentHistory.newValues,
        reason: teacherAssignmentHistory.reason,
        createdAt: teacherAssignmentHistory.createdAt,
        performedByFirstName: users.firstName,
        performedByLastName: users.lastName,
      })
      .from(teacherAssignmentHistory)
      .leftJoin(users, eq(teacherAssignmentHistory.performedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(teacherAssignmentHistory.createdAt))
      .limit(parseInt(limit as string));

    res.json(history);
  } catch (error) {
    console.error('Error fetching assignment history:', error);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

router.get('/api/teacher/my-classes', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; roleId: number };
    
    if (user.roleId !== ROLE_IDS.TEACHER) {
      return res.status(403).json({ message: 'Only teachers can access this endpoint' });
    }

    const now = new Date();
    const assignments = await db
      .select({
        assignmentId: teacherClassAssignments.id,
        classId: teacherClassAssignments.classId,
        subjectId: teacherClassAssignments.subjectId,
        termId: teacherClassAssignments.termId,
        session: teacherClassAssignments.session,
        className: classes.name,
        classLevel: classes.level,
        subjectName: subjects.name,
        subjectCode: subjects.code,
        termName: academicTerms.name,
        termYear: academicTerms.year,
      })
      .from(teacherClassAssignments)
      .innerJoin(classes, eq(teacherClassAssignments.classId, classes.id))
      .innerJoin(subjects, eq(teacherClassAssignments.subjectId, subjects.id))
      .leftJoin(academicTerms, eq(teacherClassAssignments.termId, academicTerms.id))
      .where(and(
        eq(teacherClassAssignments.teacherId, user.id),
        eq(teacherClassAssignments.isActive, true),
        or(
          isNull(teacherClassAssignments.validUntil),
          gte(teacherClassAssignments.validUntil, now)
        )
      ));

    res.json(assignments);
  } catch (error) {
    console.error('Error fetching teacher classes:', error);
    res.status(500).json({ message: 'Failed to fetch assigned classes' });
  }
});

router.get('/api/teacher/my-students/:classId/:subjectId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user as { id: string; roleId: number };
    const classId = parseInt(req.params.classId);
    const subjectId = parseInt(req.params.subjectId);
    
    if (user.roleId !== ROLE_IDS.TEACHER) {
      return res.status(403).json({ message: 'Only teachers can access this endpoint' });
    }

    const hasAssignment = await checkTeacherAssignment(user.id, classId, subjectId);
    if (!hasAssignment) {
      await logUnauthorizedAccess(
        user.id,
        'view_students',
        req.originalUrl,
        classId,
        subjectId,
        'Teacher not assigned to this class/subject',
        req as any
      );
      return res.status(403).json({ message: 'You are not authorized to view students for this class/subject' });
    }

    const studentList = await db
      .select({
        id: students.id,
        admissionNumber: students.admissionNumber,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        department: students.department,
      })
      .from(students)
      .innerJoin(users, eq(students.id, users.id))
      .where(eq(students.classId, classId))
      .orderBy(users.firstName, users.lastName);

    res.json(studentList);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

export default router;
