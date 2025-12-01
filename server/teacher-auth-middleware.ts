import { db } from './db';
import { teacherClassAssignments, unauthorizedAccessLogs } from '@shared/schema.pg';
import { eq, and, isNull, or, gte, sql } from 'drizzle-orm';
import { ROLE_IDS } from '@shared/role-constants';

function sanitizeIp(ip: string | undefined): string | null {
  if (!ip) return null;
  const sanitized = ip.replace(/[^a-fA-F0-9.:,\s]/g, '').substring(0, 45);
  return sanitized || null;
}

interface TeacherAuthRequest {
  user?: {
    userId: string;
    roleId: number;
    roleName?: string;
  };
  headers: {
    'x-forwarded-for'?: string;
    'user-agent'?: string;
  };
  ip?: string;
}

export interface TeacherAssignmentCheck {
  teacherId: string;
  classId?: number;
  subjectId?: number;
  termId?: number;
}

export async function checkTeacherAssignment(
  teacherId: string,
  classId?: number,
  subjectId?: number,
  termId?: number
): Promise<boolean> {
  try {
    const now = new Date();
    
    const conditions = [
      eq(teacherClassAssignments.teacherId, teacherId),
      eq(teacherClassAssignments.isActive, true),
      or(
        isNull(teacherClassAssignments.validUntil),
        gte(teacherClassAssignments.validUntil, now)
      )
    ];

    if (classId) {
      conditions.push(eq(teacherClassAssignments.classId, classId));
    }
    if (subjectId) {
      conditions.push(eq(teacherClassAssignments.subjectId, subjectId));
    }
    if (termId) {
      conditions.push(eq(teacherClassAssignments.termId, termId));
    }

    const assignments = await db
      .select()
      .from(teacherClassAssignments)
      .where(and(...conditions))
      .limit(1);

    return assignments.length > 0;
  } catch (error) {
    console.error('Error checking teacher assignment:', error);
    return false;
  }
}

export async function getTeacherAssignments(
  teacherId: string,
  termId?: number
): Promise<typeof teacherClassAssignments.$inferSelect[]> {
  try {
    const now = new Date();
    
    const conditions = [
      eq(teacherClassAssignments.teacherId, teacherId),
      eq(teacherClassAssignments.isActive, true),
      or(
        isNull(teacherClassAssignments.validUntil),
        gte(teacherClassAssignments.validUntil, now)
      )
    ];

    if (termId) {
      conditions.push(eq(teacherClassAssignments.termId, termId));
    }

    return await db
      .select()
      .from(teacherClassAssignments)
      .where(and(...conditions));
  } catch (error) {
    console.error('Error getting teacher assignments:', error);
    return [];
  }
}

export async function logUnauthorizedAccess(
  userId: string | undefined,
  attemptedAction: string,
  attemptedResource: string,
  classId?: number,
  subjectId?: number,
  reason?: string,
  req?: TeacherAuthRequest
): Promise<void> {
  try {
    await db.insert(unauthorizedAccessLogs).values({
      userId: userId || null,
      attemptedAction,
      attemptedResource,
      classId: classId || null,
      subjectId: subjectId || null,
      ipAddress: sanitizeIp(req?.headers?.['x-forwarded-for']) || sanitizeIp(req?.ip),
      userAgent: req?.headers?.['user-agent']?.substring(0, 500) || null,
      reason: reason || 'Unauthorized access attempt',
    });
  } catch (error) {
    console.error('Error logging unauthorized access:', error);
  }
}

export const authorizeTeacherForClassSubject = (action: string) => {
  return async (req: any, res: any, next: any) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { roleId, userId } = req.user;

      if (roleId === ROLE_IDS.SUPER_ADMIN || roleId === ROLE_IDS.ADMIN) {
        return next();
      }

      if (roleId !== ROLE_IDS.TEACHER) {
        await logUnauthorizedAccess(
          userId,
          action,
          req.originalUrl,
          undefined,
          undefined,
          'User is not a teacher',
          req
        );
        return res.status(403).json({ message: "Only teachers can perform this action" });
      }

      const classId = parseInt(req.params.classId || req.body.classId);
      const subjectId = parseInt(req.params.subjectId || req.body.subjectId);
      const termId = req.params.termId ? parseInt(req.params.termId) : undefined;

      if (!classId && !subjectId) {
        return next();
      }

      const hasAssignment = await checkTeacherAssignment(
        userId,
        classId || undefined,
        subjectId || undefined,
        termId
      );

      if (!hasAssignment) {
        await logUnauthorizedAccess(
          userId,
          action,
          req.originalUrl,
          classId || undefined,
          subjectId || undefined,
          'Teacher not assigned to this class/subject combination',
          req
        );
        return res.status(403).json({ 
          message: "You are not authorized to access this class/subject. Please contact your administrator if you believe this is an error." 
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ message: "Authorization check failed" });
    }
  };
};

export const validateTeacherCanCreateExam = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { roleId, userId } = req.user;

    if (roleId === ROLE_IDS.SUPER_ADMIN || roleId === ROLE_IDS.ADMIN) {
      return next();
    }

    if (roleId !== ROLE_IDS.TEACHER) {
      await logUnauthorizedAccess(userId, 'create_exam', req.originalUrl, undefined, undefined, 'User is not a teacher', req);
      return res.status(403).json({ message: "Only teachers can create exams" });
    }

    const { classId, subjectId } = req.body;

    if (!classId || !subjectId) {
      return res.status(400).json({ message: "Class and subject are required" });
    }

    const hasAssignment = await checkTeacherAssignment(userId, classId, subjectId);

    if (!hasAssignment) {
      await logUnauthorizedAccess(
        userId,
        'create_exam',
        req.originalUrl,
        classId,
        subjectId,
        'Teacher not assigned to this class/subject for exam creation',
        req
      );
      return res.status(403).json({ 
        message: "You are not assigned to teach this subject in this class. Please contact your administrator." 
      });
    }

    next();
  } catch (error) {
    console.error('Exam creation authorization error:', error);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

export const validateTeacherCanEnterScores = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { roleId, userId } = req.user;

    if (roleId === ROLE_IDS.SUPER_ADMIN || roleId === ROLE_IDS.ADMIN) {
      return next();
    }

    if (roleId !== ROLE_IDS.TEACHER) {
      await logUnauthorizedAccess(userId, 'enter_scores', req.originalUrl, undefined, undefined, 'User is not a teacher', req);
      return res.status(403).json({ message: "Only teachers can enter scores" });
    }

    const classId = parseInt(req.params.classId || req.body.classId);
    const subjectId = parseInt(req.params.subjectId || req.body.subjectId);

    if (!classId || !subjectId) {
      return res.status(400).json({ message: "Class and subject are required" });
    }

    const hasAssignment = await checkTeacherAssignment(userId, classId, subjectId);

    if (!hasAssignment) {
      await logUnauthorizedAccess(
        userId,
        'enter_scores',
        req.originalUrl,
        classId,
        subjectId,
        'Teacher not assigned to this class/subject for score entry',
        req
      );
      return res.status(403).json({ 
        message: "You are not assigned to this class/subject. Please contact your administrator." 
      });
    }

    next();
  } catch (error) {
    console.error('Score entry authorization error:', error);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};

export const validateTeacherCanViewResults = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { roleId, userId } = req.user;

    if (roleId === ROLE_IDS.SUPER_ADMIN || roleId === ROLE_IDS.ADMIN) {
      return next();
    }

    if (roleId !== ROLE_IDS.TEACHER) {
      return res.status(403).json({ message: "Only teachers can view class results" });
    }

    const classId = parseInt(req.params.classId || req.query.classId);
    const subjectId = parseInt(req.params.subjectId || req.query.subjectId);

    if (classId || subjectId) {
      const hasAssignment = await checkTeacherAssignment(
        userId,
        classId || undefined,
        subjectId || undefined
      );

      if (!hasAssignment) {
        await logUnauthorizedAccess(
          userId,
          'view_results',
          req.originalUrl,
          classId || undefined,
          subjectId || undefined,
          'Teacher not assigned to this class/subject for viewing results',
          req
        );
        return res.status(403).json({ 
          message: "You are not authorized to view results for this class/subject." 
        });
      }
    }

    next();
  } catch (error) {
    console.error('View results authorization error:', error);
    return res.status(500).json({ message: "Authorization check failed" });
  }
};
