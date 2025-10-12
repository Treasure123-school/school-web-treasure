import { db } from "./storage";
import { counters } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Generate student username using atomic sequence
 * Format: THS-STU-<YEAR>-<CLASS>-<SEQ3>
 * Example: THS-STU-2025-PR3-001
 */
export async function generateStudentUsername(classCode: string): Promise<string> {
  const year = new Date().getFullYear().toString();
  
  // Atomic upsert to get next sequence number
  const result = await db
    .insert(counters)
    .values({
      classCode,
      year,
      sequence: 1,
    })
    .onConflictDoUpdate({
      target: [counters.classCode, counters.year],
      set: {
        sequence: sql`${counters.sequence} + 1`,
        updatedAt: new Date(),
      },
    })
    .returning({ sequence: counters.sequence });

  const sequence = result[0].sequence;
  const seqStr = sequence.toString().padStart(3, '0');
  
  return `THS-STU-${year}-${classCode}-${seqStr}`;
}

/**
 * Generate parent username
 * Format: THS-PAR-<YEAR>-<RND4>
 * Example: THS-PAR-2025-A3K9
 */
export function generateParentUsername(): string {
  const year = new Date().getFullYear().toString();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase().slice(0, 4);
  
  return `THS-PAR-${year}-${random}`;
}

/**
 * Generate secure temporary password
 * Format: THS@<YEAR>#<RAND4>
 * Example: THS@2025#Ab7K
 */
export function generateTempPassword(): string {
  const year = new Date().getFullYear().toString();
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let random = '';
  
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(crypto.randomInt(0, chars.length));
  }
  
  return `THS@${year}#${random}`;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(plainPassword, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(plainPassword: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hash);
}

/**
 * Get next sequence for a class (for preview purposes)
 */
export async function getNextSequencePreview(classCode: string): Promise<number> {
  const year = new Date().getFullYear().toString();
  
  const result = await db
    .select({ sequence: counters.sequence })
    .from(counters)
    .where(and(
      eq(counters.classCode, classCode),
      eq(counters.year, year)
    ))
    .limit(1);
  
  if (result.length > 0) {
    return result[0].sequence + 1;
  }
  
  return 1;
}

/**
 * Generate preview username without committing to database
 */
export async function generateStudentUsernamePreview(classCode: string): Promise<string> {
  const year = new Date().getFullYear().toString();
  const nextSeq = await getNextSequencePreview(classCode);
  const seqStr = nextSeq.toString().padStart(3, '0');
  
  return `THS-STU-${year}-${classCode}-${seqStr}`;
}
