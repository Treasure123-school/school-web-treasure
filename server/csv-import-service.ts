
import { parse } from 'csv-parse/sync';
import { db } from '../db';
import { users, students, parents } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { generateStudentUsername, generateParentUsername, generateTempPassword } from './username-generator';
import bcrypt from 'bcrypt';

export interface CSVRow {
  fullName: string;
  classCode: string;
  dob: string;
  parentEmail?: string;
  parentPhone?: string;
  admissionNo?: string;
}

export interface ValidationResult {
  row: number;
  data: CSVRow;
  username?: string;
  parentExists?: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportPreview {
  valid: ValidationResult[];
  invalid: ValidationResult[];
  summary: {
    total: number;
    validCount: number;
    invalidCount: number;
    newParents: number;
    existingParents: number;
  };
}

/**
 * Validates CSV file and returns preview without DB writes
 */
export async function previewCSVImport(csvContent: string): Promise<ImportPreview> {
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  const validResults: ValidationResult[] = [];
  const invalidResults: ValidationResult[] = [];
  let newParentCount = 0;
  let existingParentCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!row.fullName || row.fullName.trim() === '') {
      errors.push('Full name is required');
    }
    if (!row.classCode || row.classCode.trim() === '') {
      errors.push('Class code is required');
    }
    if (!row.dob) {
      errors.push('Date of birth is required');
    } else if (isNaN(Date.parse(row.dob))) {
      errors.push('Invalid date of birth format');
    }

    // Check if parent exists
    let parentExists = false;
    if (row.parentEmail) {
      const existingParent = await db.select()
        .from(users)
        .where(and(
          eq(users.email, row.parentEmail),
          eq(users.role, 'parent')
        ))
        .limit(1);
      
      parentExists = existingParent.length > 0;
      if (parentExists) {
        existingParentCount++;
      } else {
        newParentCount++;
      }
    } else if (!row.parentPhone) {
      warnings.push('No parent contact provided');
    }

    const result: ValidationResult = {
      row: i + 1,
      data: {
        fullName: row.fullName,
        classCode: row.classCode,
        dob: row.dob,
        parentEmail: row.parentEmail,
        parentPhone: row.parentPhone,
        admissionNo: row.admissionNo
      },
      parentExists,
      errors,
      warnings
    };

    if (errors.length === 0) {
      // Generate preview username (non-atomic, just for preview)
      try {
        const year = new Date().getFullYear();
        result.username = await generateStudentUsername(row.classCode, year);
      } catch (err) {
        result.username = `THS-STU-${new Date().getFullYear()}-${row.classCode}-XXX`;
      }
      validResults.push(result);
    } else {
      invalidResults.push(result);
    }
  }

  return {
    valid: validResults,
    invalid: invalidResults,
    summary: {
      total: rows.length,
      validCount: validResults.length,
      invalidCount: invalidResults.length,
      newParents: newParentCount,
      existingParents: existingParentCount
    }
  };
}

/**
 * Commits validated CSV import with batch processing
 */
export async function commitCSVImport(
  validRows: ValidationResult[],
  adminUserId: string
): Promise<{ successCount: number; failedRows: number[]; credentials: any[] }> {
  const credentials: any[] = [];
  const failedRows: number[] = [];
  let successCount = 0;
  const batchSize = 100;

  for (let i = 0; i < validRows.length; i += batchSize) {
    const batch = validRows.slice(i, i + batchSize);
    
    for (const item of batch) {
      try {
        await db.transaction(async (tx) => {
          const year = new Date().getFullYear();
          
          // Generate credentials
          const studentUsername = await generateStudentUsername(item.data.classCode, year);
          const studentPassword = generateTempPassword(year);
          const passwordHash = await bcrypt.hash(studentPassword, 10);

          // Create student user
          const [studentUser] = await tx.insert(users).values({
            username: studentUsername,
            passwordHash,
            role: 'student',
            status: 'active',
            mustChangePassword: true,
            email: null
          }).returning();

          // Create student record
          await tx.insert(students).values({
            userId: studentUser.id,
            fullName: item.data.fullName,
            classCode: item.data.classCode,
            dateOfBirth: new Date(item.data.dob),
            admissionNumber: item.data.admissionNo || null
          });

          // Handle parent
          let parentUserId: string | null = null;
          let parentCredentials: any = null;

          if (item.data.parentEmail || item.data.parentPhone) {
            if (item.parentExists && item.data.parentEmail) {
              // Link to existing parent
              const [existingParent] = await tx.select()
                .from(users)
                .where(eq(users.email, item.data.parentEmail))
                .limit(1);
              parentUserId = existingParent.id;
            } else {
              // Create new parent
              const parentUsername = await generateParentUsername(year);
              const parentPassword = generateTempPassword(year);
              const parentHash = await bcrypt.hash(parentPassword, 10);

              const [parentUser] = await tx.insert(users).values({
                username: parentUsername,
                passwordHash: parentHash,
                email: item.data.parentEmail || null,
                role: 'parent',
                status: 'active',
                mustChangePassword: true
              }).returning();

              await tx.insert(parents).values({
                userId: parentUser.id,
                phoneNumber: item.data.parentPhone || null
              });

              parentUserId = parentUser.id;
              parentCredentials = {
                username: parentUsername,
                password: parentPassword
              };
            }
          }

          credentials.push({
            row: item.row,
            student: {
              name: item.data.fullName,
              username: studentUsername,
              password: studentPassword,
              classCode: item.data.classCode
            },
            parent: parentCredentials
          });

          successCount++;
        });
      } catch (error) {
        console.error(`Failed to import row ${item.row}:`, error);
        failedRows.push(item.row);
      }
    }
  }

  return { successCount, failedRows, credentials };
}
