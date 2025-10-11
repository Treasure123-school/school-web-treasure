import { db } from '../db';
import { users, students, parents, counters } from '@db/schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';

/**
 * Atomically generates next student username using database counters
 * Format: THS-STU-{YEAR}-{CLASS}-{SEQ}
 */
export async function generateStudentUsername(classCode: string, year: number): Promise<string> {
  const yearStr = year.toString();

  // Atomic increment using PostgreSQL ON CONFLICT
  const result = await db
    .insert(counters)
    .values({
      classCode,
      year: yearStr,
      sequence: 1
    })
    .onConflictDoUpdate({
      target: [counters.classCode, counters.year],
      set: {
        sequence: sql`${counters.sequence} + 1`,
        updatedAt: new Date()
      }
    })
    .returning();

  const sequence = result[0].sequence;
  return `THS-STU-${yearStr}-${classCode.toUpperCase()}-${String(sequence).padStart(3, '0')}`;
}

/**
 * Generates parent username atomically
 * Format: THS-PAR-{YEAR}-{SEQ}
 */
export async function generateParentUsername(year: number): Promise<string> {
  const yearStr = year.toString();
  const classCode = 'PARENT'; // Special class code for parents

  const result = await db
    .insert(counters)
    .values({
      classCode,
      year: yearStr,
      sequence: 1
    })
    .onConflictDoUpdate({
      target: [counters.classCode, counters.year],
      set: {
        sequence: sql`${counters.sequence} + 1`,
        updatedAt: new Date()
      }
    })
    .returning();

  const sequence = result[0].sequence;
  return `THS-PAR-${yearStr}-${String(sequence).padStart(3, '0')}`;
}

/**
 * Generates temporary password
 * Format: THS@{YEAR}#{RAND4}
 */
export function generateTempPassword(year: number): string {
  const random4 = Math.floor(1000 + Math.random() * 9000);
  return `THS@${year}#${random4}`;
}

/**
 * Validates username format
 */
export function validateUsername(username: string): { valid: boolean; type?: 'student' | 'parent'; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  const studentPattern = /^THS-STU-\d{4}-[A-Z0-9]+-\d{3}$/;
  const parentPattern = /^THS-PAR-\d{4}-\d{3}$/; // Updated to match generated format

  if (studentPattern.test(username)) {
    return { valid: true, type: 'student' };
  }

  if (parentPattern.test(username)) {
    return { valid: true, type: 'parent' };
  }

  return { valid: false, error: 'Invalid username format' };
}