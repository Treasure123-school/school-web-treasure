import crypto from 'crypto';
import { storage } from './storage';

export interface StudentRegistrationData {
  fullName: string;
  classCode: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  parentEmail: string;
  parentPhone: string;
}

export interface RegistrationPreview {
  suggestedUsername: string;
  parentExists: boolean;
  errors: string[];
}

export interface RegistrationResult {
  studentUsername: string;
  parentCreated: boolean;
  parentUsername?: string;
  parentPassword?: string;
  errors: string[];
}

export async function generateStudentUsername(classCode: string): Promise<string> {
  const year = new Date().getFullYear();
  const sequence = await storage.getNextSequence(classCode, year.toString());
  const paddedSequence = sequence.toString().padStart(3, '0');
  return `THS-STU-${year}-${classCode}-${paddedSequence}`;
}

export function generateParentUsername(): string {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `THS-PAR-${year}-${randomPart}`;
}

export function generateTempPassword(): string {
  const year = new Date().getFullYear();
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `THS@${year}#${randomPart}`;
}

export function validateRegistrationData(data: StudentRegistrationData): string[] {
  const errors: string[] = [];

  if (!data.fullName || data.fullName.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  }

  if (!data.classCode || data.classCode.trim().length === 0) {
    errors.push('Class code is required');
  }

  if (!data.gender || !['Male', 'Female', 'Other'].includes(data.gender)) {
    errors.push('Valid gender is required');
  }

  if (!data.dateOfBirth) {
    errors.push('Date of birth is required');
  } else {
    const dob = new Date(data.dateOfBirth);
    const age = (new Date().getTime() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (age < 2 || age > 25) {
      errors.push('Student age must be between 2 and 25 years');
    }
  }

  if (!data.parentEmail && !data.parentPhone) {
    errors.push('At least one parent contact (email or phone) is required');
  }

  if (data.parentEmail && !isValidEmail(data.parentEmail)) {
    errors.push('Parent email is invalid');
  }

  if (data.parentPhone && !isValidPhone(data.parentPhone)) {
    errors.push('Parent phone number is invalid');
  }

  return errors;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

export async function checkParentExists(email: string): Promise<{ exists: boolean; userId?: string }> {
  if (!email) {
    return { exists: false };
  }

  const parentRole = await storage.getRoleByName('parent');
  if (!parentRole) {
    return { exists: false };
  }

  const users = await storage.getAllUsers();
  const parent = users.find(u => u.email === email && u.roleId === parentRole.id);
  
  if (parent) {
    return { exists: true, userId: parent.id };
  }

  return { exists: false };
}
