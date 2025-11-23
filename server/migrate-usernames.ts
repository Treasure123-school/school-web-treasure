/**
 * Migration Script: Update Usernames to New Simplified Format
 * 
 * This script migrates all existing usernames from the old format to the new simplified format:
 * OLD: THS-STU-2025-PR3-001, THS-PAR-2025-012, etc.
 * NEW: THS-STU-001, THS-PAR-012, THS-TCH-005, THS-ADM-001
 * 
 * Run with: npx tsx server/migrate-usernames.ts
 */

import { db } from './storage';
import { users, counters } from '../shared/schema';
import { eq, sql } from 'drizzle-orm';

// Role mappings
const ROLE_CODES = {
  1: 'ADM', // Admin
  2: 'TCH', // Teacher
  3: 'STU', // Student
  4: 'PAR', // Parent
} as const;

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  details: {
    students: number;
    parents: number;
    teachers: number;
    admins: number;
  };
}

/**
 * Check if username is in old format
 */
function isOldFormat(username: string): boolean {
  if (!username) return false;
  
  // Old formats:
  // THS-STU-2025-PR3-001 (5 parts)
  // THS-PAR-2025-001 (4 parts)
  // THS-TCH-2025-MTH-002 (5 parts)
  const parts = username.split('-');
  return parts.length >= 4 && /^\d{4}$/.test(parts[2]); // Has year in third position
}

/**
 * Extract sequence number from old username
 */
function extractSequenceNumber(username: string): number {
  const parts = username.split('-');
  const lastPart = parts[parts.length - 1];
  return parseInt(lastPart, 10) || 1;
}

/**
 * Initialize counters for all roles
 */
async function initializeCounters(): Promise<void> {
  
  for (const [roleId, roleCode] of Object.entries(ROLE_CODES)) {
    try {
      await db
        .insert(counters)
        .values({
          roleCode,
          sequence: 0
        })
        .onConflictDoNothing();
      
    } catch (error) {
    }
  }
}

/**
 * Get next sequence number for a role
 */
async function getNextSequence(roleCode: string): Promise<number> {
  const result = await db
    .update(counters)
    .set({
      sequence: sql`${counters.sequence} + 1`,
      updatedAt: new Date()
    })
    .where(eq(counters.roleCode, roleCode))
    .returning();

  return result[0].sequence;
}

/**
 * Main migration function
 */
async function migrateUsernames(): Promise<void> {

  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    details: {
      students: 0,
      parents: 0,
      teachers: 0,
      admins: 0,
    }
  };

  try {
    // Initialize counters
    await initializeCounters();

    // Get all users
    const allUsers = await db.select().from(users);
    stats.total = allUsers.length;

    // Group users by role
    const usersByRole: Record<string, typeof allUsers> = {
      'ADM': [],
      'TCH': [],
      'STU': [],
      'PAR': [],
    };

    for (const user of allUsers) {
      const roleCode = ROLE_CODES[user.roleId as keyof typeof ROLE_CODES];
      if (roleCode) {
        usersByRole[roleCode].push(user);
      }
    }

    // Process each role
    for (const [roleCode, roleUsers] of Object.entries(usersByRole)) {
      if (roleUsers.length === 0) continue;


      for (const user of roleUsers) {
        const oldUsername = user.username;
        
        if (!oldUsername) {
          stats.skipped++;
          continue;
        }

        // Check if already in new format
        if (!isOldFormat(oldUsername)) {
          stats.skipped++;
          continue;
        }

        try {
          // Generate new username
          const sequence = await getNextSequence(roleCode);
          const newUsername = `THS-${roleCode}-${String(sequence).padStart(3, '0')}`;

          // Update user
          await db
            .update(users)
            .set({ username: newUsername, updatedAt: new Date() })
            .where(eq(users.id, user.id));

          stats.migrated++;

          // Update role-specific stats
          if (roleCode === 'STU') stats.details.students++;
          else if (roleCode === 'PAR') stats.details.parents++;
          else if (roleCode === 'TCH') stats.details.teachers++;
          else if (roleCode === 'ADM') stats.details.admins++;

        } catch (error) {
          stats.errors++;
        }
      }
    }

    // Print summary
    
    if (stats.migrated > 0) {
    } else {
    }

  } catch (error) {
    throw error;
  }
}

// Run migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUsernames()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      process.exit(1);
    });
}

export { migrateUsernames };
