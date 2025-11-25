import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Automated SQLite Database Backup System
 * 
 * Creates timestamped backups of the SQLite database in server/backups/
 * Automatically removes old backups to prevent disk space issues
 */

const DB_PATH = './server/data/app.db';
const BACKUP_DIR = './server/backups';
const MAX_BACKUPS = 10; // Keep only the last 10 backups

export async function createBackup(): Promise<{ success: boolean; backupPath?: string; error?: string }> {
  try {
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });

    // Create timestamped backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup_${timestamp}.db`;
    const backupPath = path.join(BACKUP_DIR, backupFilename);

    // Copy database file (SQLite is file-based, simple copy works)
    await fs.copyFile(DB_PATH, backupPath);

    console.log(`✅ Database backup created: ${backupPath}`);

    // Clean up old backups
    await cleanupOldBackups();

    return {
      success: true,
      backupPath,
    };
  } catch (error: any) {
    console.error('❌ Backup failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

async function cleanupOldBackups() {
  try {
    // Get all backup files
    const files = await fs.readdir(BACKUP_DIR);
    const backupFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => ({
        name: f,
        path: path.join(BACKUP_DIR, f),
      }));

    // Sort by name (timestamp is in filename)
    backupFiles.sort((a, b) => b.name.localeCompare(a.name));

    // Remove old backups beyond MAX_BACKUPS
    if (backupFiles.length > MAX_BACKUPS) {
      const toDelete = backupFiles.slice(MAX_BACKUPS);
      for (const file of toDelete) {
        await fs.unlink(file.path);
        console.log(`🗑️  Removed old backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('⚠️  Cleanup old backups failed:', error);
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<string[]> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    return files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .sort((a, b) => b.localeCompare(a)); // Newest first
  } catch (error) {
    console.error('Failed to list backups:', error);
    return [];
  }
}

/**
 * Restore database from a backup
 * WARNING: This will overwrite the current database!
 */
export async function restoreBackup(backupFilename: string): Promise<{ success: boolean; error?: string }> {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFilename);
    
    // Verify backup exists
    await fs.access(backupPath);

    // Create a backup of current database before restoring
    await createBackup();

    // Restore the backup
    await fs.copyFile(backupPath, DB_PATH);

    console.log(`✅ Database restored from: ${backupFilename}`);

    return { success: true };
  } catch (error: any) {
    console.error('❌ Restore failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Auto-backup on server startup (only in development for safety)
if (process.env.NODE_ENV === 'development') {
  createBackup().then(result => {
    if (result.success) {
      console.log('📦 Auto-backup completed on startup');
    }
  });
}
