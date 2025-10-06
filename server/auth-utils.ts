
/**
 * THS Authentication Utilities
 * Username and password generation following THS branding standards
 */

const crypto = require('crypto');

// Username format: THS-<ROLE>-<YEAR>-<OPTIONAL>-<NUMBER>
// Examples:
// - Student: THS-STU-2025-PR3-001
// - Teacher: THS-TCH-2025-MTH-002
// - Parent: THS-PAR-2025-001
// - Admin: THS-ADM-ROLE

const ROLE_CODES = {
  1: 'ADM', // Admin
  2: 'TCH', // Teacher
  3: 'STU', // Student
  4: 'PAR', // Parent
} as const;

/**
 * Generate a cryptographically strong random string for passwords
 * Uses crypto.randomBytes for security
 */
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate THS-branded username
 * @param roleId - User role ID (1=Admin, 2=Teacher, 3=Student, 4=Parent)
 * @param year - Academic year (e.g., '2025')
 * @param optional - Optional identifier (e.g., class level like 'PR3', subject like 'MTH', or '')
 * @param number - Sequential number (e.g., 1, 2, 3...)
 * @returns THS-branded username
 */
export function generateUsername(
  roleId: number,
  year: string,
  optional: string = '',
  number: number
): string {
  const roleCode = ROLE_CODES[roleId as keyof typeof ROLE_CODES] || 'USR';
  const paddedNumber = String(number).padStart(3, '0');

  if (optional) {
    return `THS-${roleCode}-${year}-${optional}-${paddedNumber}`;
  }
  return `THS-${roleCode}-${year}-${paddedNumber}`;
}

/**
 * Generate THS-branded password with strong cryptographic randomness
 * Format: THS@<YEAR>#<RANDOM>
 * Example: THS@2025#aB3k9Mx2Pq7R
 * @param year - Academic year (e.g., '2025')
 * @returns THS-branded password (16+ characters total, cryptographically secure)
 */
export function generatePassword(year: string): string {
  // Generate 12 character cryptographically secure random string
  // This gives us 62^12 ≈ 3.2×10^21 possible combinations
  const randomPart = generateRandomString(12);
  return `THS@${year}#${randomPart}`;
}

/**
 * Generate student-specific username with class code
 */
export function generateStudentUsername(className: string, currentYear: string, nextNumber: number): string {
  // Extract class code from class name (e.g., "JSS 1" -> "JSS1", "Primary 3" -> "PRI3")
  const classCode = className.replace(/\s+/g, '').toUpperCase().slice(0, 4);

  // Format: THS-STU-{YEAR}-{CLASSCODE}-{NUMBER}
  // Example: THS-STU-2025-JSS1-001
  return `THS-STU-${currentYear}-${classCode}-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Generate student password with year
 */
export function generateStudentPassword(currentYear: string): string {
  // Format: THS@{YEAR}#{RANDOM}
  // Example: THS@2025#A7B3
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `THS@${currentYear}#${randomHex}`;
}

/**
 * Parse a THS username to extract components
 * @param username - THS username to parse
 * @returns Parsed username components or null if invalid
 */
export function parseUsername(username: string): {
  prefix: string;
  roleCode: string;
  year: string;
  optional?: string;
  number: string;
} | null {
  const parts = username.split('-');

  if (parts.length < 4 || parts[0] !== 'THS') {
    return null;
  }

  if (parts.length === 4) {
    // Format: THS-ROLE-YEAR-NUMBER
    return {
      prefix: parts[0],
      roleCode: parts[1],
      year: parts[2],
      number: parts[3],
    };
  } else if (parts.length === 5) {
    // Format: THS-ROLE-YEAR-OPTIONAL-NUMBER
    return {
      prefix: parts[0],
      roleCode: parts[1],
      year: parts[2],
      optional: parts[3],
      number: parts[4],
    };
  }

  return null;
}

/**
 * Get the next available number for a given role, year, and optional identifier
 * @param existingUsernames - Array of existing usernames to check against
 * @param roleId - User role ID
 * @param year - Academic year
 * @param optional - Optional identifier
 * @returns Next available number
 */
export function getNextUserNumber(
  existingUsernames: string[],
  roleId: number,
  year: string,
  optional: string = ''
): number {
  const roleCode = ROLE_CODES[roleId as keyof typeof ROLE_CODES] || 'USR';
  const prefix = optional 
    ? `THS-${roleCode}-${year}-${optional}-`
    : `THS-${roleCode}-${year}-`;

  const numbers = existingUsernames
    .filter(username => username.startsWith(prefix))
    .map(username => {
      const parts = username.split('-');
      const numStr = parts[parts.length - 1];
      return parseInt(numStr, 10);
    })
    .filter(num => !isNaN(num));

  if (numbers.length === 0) {
    return 1;
  }

  return Math.max(...numbers) + 1;
}

/**
 * Validate THS username format with strict validation
 * Checks for proper format, valid role code, and numeric suffix
 * @param username - Username to validate
 * @returns true if valid THS format with all requirements met
 */
export function isValidThsUsername(username: string): boolean {
  const parsed = parseUsername(username);
  if (!parsed) return false;

  // Validate role code
  const validRoleCodes = ['ADM', 'TCH', 'STU', 'PAR'];
  if (!validRoleCodes.includes(parsed.roleCode)) return false;

  // Validate year format (4 digits)
  if (!/^\d{4}$/.test(parsed.year)) return false;

  // Validate number suffix (3 digits)
  if (!/^\d{3}$/.test(parsed.number)) return false;

  // If optional field exists, validate it (3-4 alphanumeric chars)
  if (parsed.optional && !/^[A-Z0-9]{2,4}$/i.test(parsed.optional)) return false;

  return true;
}

/**
 * Get role ID from role code
 * @param roleCode - Role code (ADM, TCH, STU, PAR)
 * @returns Role ID or null
 */
export function getRoleIdFromCode(roleCode: string): number | null {
  const entries = Object.entries(ROLE_CODES);
  for (const [id, code] of entries) {
    if (code === roleCode) {
      return parseInt(id, 10);
    }
  }
  return null;
}
