
import { parse } from 'csv-parse/sync';
import { db } from '../db';
import * as schema from '@db/schema';
import { users, students } from '@db/schema';
import { eq, and } from 'drizzle-orm';
import { generateStudentUsername, generateParentUsername, generateStudentPassword, generateParentPassword } from './username-generator';
import bcrypt from 'bcrypt';

export interface CSVRow {
  fullName: string;
  classCode: string;
  dob: string;
  gender: string;
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

  // Get all classes to validate class codes
  const classes = await db.select().from(schema.classes);
  const validClassCodes = classes.map(c => c.name);

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
    } else if (!validClassCodes.includes(row.classCode)) {
      errors.push(`Invalid class code: ${row.classCode}. Valid codes: ${validClassCodes.join(', ')}`);
    }
    if (!row.dob) {
      errors.push('Date of birth is required');
    } else if (isNaN(Date.parse(row.dob))) {
      errors.push('Invalid date of birth format (use YYYY-MM-DD)');
    }
    if (!row.gender || !['Male', 'Female', 'Other'].includes(row.gender)) {
      errors.push('Gender must be Male, Female, or Other');
    }

    // Check if parent exists by phone
    let parentExists = false;
    if (row.parentPhone) {
      const existingParent = await db.select()
        .from(users)
        .where(and(
          eq(users.phone, row.parentPhone),
          eq(users.roleId, 4) // Parent role
        ))
        .limit(1);
      
      parentExists = existingParent.length > 0;
      if (parentExists) {
        existingParentCount++;
      } else {
        newParentCount++;
      }
    } else {
      warnings.push('No parent phone provided - student will have no parent link');
    }

    const result: ValidationResult = {
      row: i + 1,
      data: {
        fullName: row.fullName,
        classCode: row.classCode,
        dob: row.dob,
        gender: row.gender,
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
      const year = new Date().getFullYear();
      const classInfo = classes.find(c => c.name === row.classCode);
      result.username = `THS-STU-${year}-${classInfo?.id || 'X'}-XXX`;
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

  // Get all classes for ID lookup
  const classes = await db.select().from(schema.classes);

  for (const item of validRows) {
    try {
      await db.transaction(async (tx) => {
        const year = new Date().getFullYear();
        const classInfo = classes.find(c => c.name === item.data.classCode);
        
        if (!classInfo) {
          throw new Error(`Class not found: ${item.data.classCode}`);
        }

        // Split full name into first and last
        const nameParts = item.data.fullName.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        // Generate student credentials
        const studentUsername = await generateStudentUsername(item.data.classCode, year);
        const studentPassword = await generateStudentPassword();
        const passwordHash = await bcrypt.hash(studentPassword, 10);

        // Create student user
        const [studentUser] = await tx.insert(users).values({
          username: studentUsername,
          email: `${studentUsername}@ths.edu`, // Auto-generate email
          passwordHash,
          roleId: 3, // Student
          firstName,
          lastName,
          gender: item.data.gender as any,
          dateOfBirth: item.data.dob,
          isActive: true,
          status: 'active',
          createdVia: 'bulk',
          createdBy: adminUserId,
          mustChangePassword: true
        }).returning();

        // Generate admission number if not provided
        const admissionNumber = item.data.admissionNo || `THS/${year}/${String(successCount + 1).padStart(4, '0')}`;

        // Create student record
        await tx.insert(students).values({
          id: studentUser.id,
          admissionNumber,
          classId: classInfo.id,
          admissionDate: new Date().toISOString().split('T')[0],
          emergencyContact: item.data.parentPhone || null
        });

        // Handle parent
        let parentUserId: string | null = null;
        let parentCredentials: any = null;

        if (item.data.parentPhone) {
          if (item.parentExists) {
            // Link to existing parent by phone
            const [existingParent] = await tx.select()
              .from(users)
              .where(and(
                eq(users.phone, item.data.parentPhone),
                eq(users.roleId, 4)
              ))
              .limit(1);
            
            if (existingParent) {
              parentUserId = existingParent.id;
              
              // Update student with parent link
              await tx.update(students)
                .set({ parentId: parentUserId })
                .where(eq(students.id, studentUser.id));
            }
          } else {
            // Create new parent
            const parentUsername = await generateParentUsername(year);
            const parentPassword = await generateParentPassword();
            const parentHash = await bcrypt.hash(parentPassword, 10);

            const [parentUser] = await tx.insert(users).values({
              username: parentUsername,
              email: item.data.parentEmail || `${parentUsername}@ths.edu`,
              passwordHash: parentHash,
              roleId: 4, // Parent
              firstName: `Parent of ${firstName}`,
              lastName: lastName,
              phone: item.data.parentPhone,
              isActive: true,
              status: 'active',
              createdVia: 'bulk',
              createdBy: adminUserId,
              mustChangePassword: true
            }).returning();

            parentUserId = parentUser.id;
            
            // Update student with parent link
            await tx.update(students)
              .set({ parentId: parentUserId })
              .where(eq(students.id, studentUser.id));

            parentCredentials = {
              username: parentUsername,
              password: parentPassword
            };
          }
        }

        credentials.push({
          row: item.row,
          student: {
            id: studentUser.id,
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

  return { successCount, failedRows, credentials };
}
