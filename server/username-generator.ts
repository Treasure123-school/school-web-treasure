import { db } from './storage';
import { counters } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Role code constants for username generation
 */
const ROLE_CODES = {
  STUDENT: 'STU',
  PARENT: 'PAR',
  TEACHER: 'TCH',
  ADMIN: 'ADM',
} as const;

/**
 * Atomically generates next sequential number for a role
 * Uses PostgreSQL ON CONFLICT for atomic increment
 */
async function getNextSequenceForRole(roleCode: string): Promise<number> {
  const result = await db
    .insert(counters)
    .values({
      roleCode,
      classCode: 'N/A',
      year: '2025',
      sequence: 1
    })
    .onConflictDoUpdate({
      target: [counters.roleCode],
      set: {
        sequence: sql`${counters.sequence} + 1`,
        updatedAt: new Date()
      }
    })
    .returning();

  return result[0].sequence;
} // fixed
/**
 * Generates student username
 * Format: THS-STU-###
 * Example: THS-STU-021
 */
export async function generateStudentUsername(): Promise<string> {
  const sequence = await getNextSequenceForRole(ROLE_CODES.STUDENT);
  return `THS-${ROLE_CODES.STUDENT}-${String(sequence).padStart(3, '0')}`;
} // fixed
/**
 * Generates parent username
 * Format: THS-PAR-###
 * Example: THS-PAR-012
 */
export async function generateParentUsername(): Promise<string> {
  const sequence = await getNextSequenceForRole(ROLE_CODES.PARENT);
  return `THS-${ROLE_CODES.PARENT}-${String(sequence).padStart(3, '0')}`;
} // fixed
/**
 * Generates teacher username
 * Format: THS-TCH-###
 * Example: THS-TCH-005
 */
export async function generateTeacherUsername(): Promise<string> {
  const sequence = await getNextSequenceForRole(ROLE_CODES.TEACHER);
  return `THS-${ROLE_CODES.TEACHER}-${String(sequence).padStart(3, '0')}`;
} // fixed
/**
 * Generates admin username
 * Format: THS-ADM-###
 * Example: THS-ADM-001
 */
export async function generateAdminUsername(): Promise<string> {
  const sequence = await getNextSequenceForRole(ROLE_CODES.ADMIN);
  return `THS-${ROLE_CODES.ADMIN}-${String(sequence).padStart(3, '0')}`;
} // fixed
/**
 * Generates username for any role by role ID
 * @param roleId - User role ID (1=Admin, 2=Teacher, 3=Student, 4=Parent)
 */
export async function generateUsernameByRole(roleId: number): Promise<string> {
  switch (roleId) {
    case 1: // Admin
      return generateAdminUsername();
    case 2: // Teacher
      return generateTeacherUsername();
    case 3: // Student
      return generateStudentUsername();
    case 4: // Parent
      return generateParentUsername();
    default:
      throw new Error(`Invalid role ID: ${roleId}`);
  }
}

/**
 * Generates temporary password
 * Format: THS@{YEAR}#{RAND4}
 * Example: THS@2025#8372
 */
export function generateTempPassword(year: number = new Date().getFullYear()): string {
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `THS@${year}#${random4}`;
} // fixed
/**
 * Validates username format (supports both old and new formats)
 * New format: THS-{ROLE}-###
 * Old format: THS-{ROLE}-{YEAR}-{OPTIONAL}-###
 */
export function validateUsername(username: string): { 
  valid: boolean; 
  type?: 'student' | 'parent' | 'teacher' | 'admin'; 
  format?: 'new' | 'old';
  error?: string 
} {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  } // fixed
  // New simplified format: THS-ROLE-###
  const newStudentPattern = /^THS-STU-\d{3}$/;
  const newParentPattern = /^THS-PAR-\d{3}$/;
  const newTeacherPattern = /^THS-TCH-\d{3}$/;
  const newAdminPattern = /^THS-ADM-\d{3}$/;

  // Old format: THS-ROLE-YEAR-CLASS-### or THS-ROLE-YEAR-###
  const oldStudentPattern = /^THS-STU-\d{4}-[A-Z0-9]+-\d{3}$/;
  const oldParentPattern = /^THS-PAR-\d{4}-\d{3}$/;
  const oldTeacherPattern = /^THS-TCH-\d{4}-[A-Z0-9]+-\d{3}$/;
  const oldAdminPattern = /^THS-ADM-\d{4}-\d{3}$/;

  // Check new format first (preferred)
  if (newStudentPattern.test(username)) {
    return { valid: true, type: 'student', format: 'new' };
  }
  if (newParentPattern.test(username)) {
    return { valid: true, type: 'parent', format: 'new' };
  }
  if (newTeacherPattern.test(username)) {
    return { valid: true, type: 'teacher', format: 'new' };
  }
  if (newAdminPattern.test(username)) {
    return { valid: true, type: 'admin', format: 'new' };
  } // fixed
  // Check old format for backwards compatibility
  if (oldStudentPattern.test(username)) {
    return { valid: true, type: 'student', format: 'old' };
  }
  if (oldParentPattern.test(username)) {
    return { valid: true, type: 'parent', format: 'old' };
  }
  if (oldTeacherPattern.test(username)) {
    return { valid: true, type: 'teacher', format: 'old' };
  }
  if (oldAdminPattern.test(username)) {
    return { valid: true, type: 'admin', format: 'old' };
  } // fixed
  return { valid: false, error: 'Invalid username format' };
}
