
import { db } from '../db';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Generates a unique THS student username using atomic DB counter
 * Format: THS-STU-{YEAR}-{CLASS}-{SEQ}
 * Thread-safe via database transaction
 */
export async function generateStudentUsername(classCode: string, year: number): Promise<string> {
  try {
    // Atomic upsert to get next sequence number
    const result = await db.execute(sql`
      INSERT INTO class_counters (class_code, year, seq)
      VALUES (${classCode}, ${year}, 1)
      ON CONFLICT (class_code, year) 
      DO UPDATE SET 
        seq = class_counters.seq + 1,
        updated_at = NOW()
      RETURNING seq
    `);

    const seq = result.rows[0]?.seq || 1;
    const paddedSeq = String(seq).padStart(3, '0');
    
    return `THS-STU-${year}-${classCode}-${paddedSeq}`;
  } catch (error) {
    console.error('Error generating student username:', error);
    throw new Error('Failed to generate unique username');
  }
}

/**
 * Generates a unique THS parent username
 * Format: THS-PAR-{YEAR}-{RANDOM}
 */
export async function generateParentUsername(year: number): Promise<string> {
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `THS-PAR-${year}-${randomPart}`;
}

/**
 * Generates a secure temporary password
 * Format: THS@{YEAR}#{RANDOM4}
 * Uses crypto-random generation
 */
export function generateTempPassword(year: number): string {
  const token = crypto.randomBytes(3)
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase();
  
  return `THS@${year}#${token}`;
}

/**
 * Validates username format
 */
export function validateUsername(username: string): { valid: boolean; type?: 'student' | 'parent'; error?: string } {
  if (!username) {
    return { valid: false, error: 'Username is required' };
  }

  const studentPattern = /^THS-STU-\d{4}-[A-Z0-9]+-\d{3}$/;
  const parentPattern = /^THS-PAR-\d{4}-[A-Z0-9]+$/;

  if (studentPattern.test(username)) {
    return { valid: true, type: 'student' };
  }
  
  if (parentPattern.test(username)) {
    return { valid: true, type: 'parent' };
  }

  return { valid: false, error: 'Invalid username format' };
}
