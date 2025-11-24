import { minioStorage } from './minio-storage';
import { parseFilePath } from './file-path-helpers';

/**
 * Storage Migration and Cleanup Utilities
 * 
 * Tools for managing file migrations, cleanup, and maintenance of MinIO storage
 */

export interface MigrationStats {
  total: number;
  migrated: number;
  failed: number;
  skipped: number;
  errors: string[];
}

/**
 * List all files in a bucket (useful for auditing)
 */
export async function auditBucket(bucketName: string): Promise<{
  success: boolean;
  files?: Array<{
    path: string;
    size?: number;
    lastModified?: Date;
  }>;
  count?: number;
  error?: string;
}> {
  try {
    if (!minioStorage.isInitialized()) {
      return { success: false, error: 'MinIO not initialized' };
    }

    const client = minioStorage.getClient();
    if (!client) {
      return { success: false, error: 'MinIO client not available' };
    }

    const files: Array<{ path: string; size?: number; lastModified?: Date }> = [];

    return new Promise((resolve) => {
      const stream = client.listObjects(bucketName, '', true);

      stream.on('data', (obj) => {
        if (obj.name) {
          files.push({
            path: obj.name,
            size: obj.size,
            lastModified: obj.lastModified,
          });
        }
      });

      stream.on('end', () => {
        resolve({
          success: true,
          files,
          count: files.length,
        });
      });

      stream.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
        });
      });
    });
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to audit bucket',
    };
  }
}

/**
 * Delete old files from date-organized buckets
 */
export async function cleanupOldFiles(
  bucketName: string,
  olderThanDays: number = 90
): Promise<{
  success: boolean;
  deleted?: number;
  errors?: string[];
}> {
  try {
    if (!minioStorage.isInitialized()) {
      return { success: false, errors: ['MinIO not initialized'] };
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const auditResult = await auditBucket(bucketName);
    if (!auditResult.success || !auditResult.files) {
      return {
        success: false,
        errors: [auditResult.error || 'Failed to list files'],
      };
    }

    const filesToDelete = auditResult.files.filter((file) => {
      if (!file.lastModified) return false;
      return file.lastModified < cutoffDate;
    });

    const errors: string[] = [];
    let deleted = 0;

    for (const file of filesToDelete) {
      try {
        const success = await minioStorage.deleteFile(bucketName, file.path);
        if (success) {
          deleted++;
        } else {
          errors.push(`Failed to delete ${file.path}`);
        }
      } catch (error: any) {
        errors.push(`Error deleting ${file.path}: ${error.message}`);
      }
    }

    return {
      success: true,
      deleted,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [error.message || 'Cleanup failed'],
    };
  }
}

/**
 * Get storage statistics for all buckets
 */
export async function getStorageStats(): Promise<{
  success: boolean;
  stats?: Record<
    string,
    {
      fileCount: number;
      totalSize: number;
      oldestFile?: Date;
      newestFile?: Date;
    }
  >;
  error?: string;
}> {
  try {
    if (!minioStorage.isInitialized()) {
      return { success: false, error: 'MinIO not initialized' };
    }

    const buckets = Object.values(minioStorage.BUCKETS);
    const stats: Record<string, any> = {};

    for (const bucket of buckets) {
      const auditResult = await auditBucket(bucket);

      if (auditResult.success && auditResult.files) {
        const files = auditResult.files;
        const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
        const dates = files
          .map((f) => f.lastModified)
          .filter((d): d is Date => d !== undefined);

        stats[bucket] = {
          fileCount: files.length,
          totalSize,
          oldestFile: dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : undefined,
          newestFile: dates.length > 0 ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined,
        };
      } else {
        stats[bucket] = {
          fileCount: 0,
          totalSize: 0,
          error: auditResult.error,
        };
      }
    }

    return {
      success: true,
      stats,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get storage stats',
    };
  }
}

/**
 * Verify file integrity (check if URLs in database actually exist in storage)
 */
export async function verifyFileExists(url: string): Promise<boolean> {
  try {
    if (!url || !minioStorage.isInitialized()) {
      return false;
    }

    const parsed = parseFilePath(url);
    if (!parsed.bucket) {
      return false;
    }

    return await minioStorage.fileExists(parsed.bucket, parsed.path);
  } catch (error) {
    return false;
  }
}

/**
 * Batch verify multiple file URLs
 */
export async function batchVerifyFiles(urls: string[]): Promise<{
  total: number;
  existing: number;
  missing: number;
  missingUrls: string[];
}> {
  const results = await Promise.all(urls.map((url) => verifyFileExists(url)));

  const missingUrls = urls.filter((_, index) => !results[index]);

  return {
    total: urls.length,
    existing: results.filter((r) => r).length,
    missing: missingUrls.length,
    missingUrls,
  };
}

/**
 * Export bucket contents list (useful for backup planning)
 */
export async function exportBucketManifest(bucketName: string): Promise<{
  success: boolean;
  manifest?: string;
  error?: string;
}> {
  try {
    const auditResult = await auditBucket(bucketName);

    if (!auditResult.success || !auditResult.files) {
      return {
        success: false,
        error: auditResult.error || 'Failed to audit bucket',
      };
    }

    const manifest = JSON.stringify(
      {
        bucket: bucketName,
        exportDate: new Date().toISOString(),
        fileCount: auditResult.files.length,
        files: auditResult.files.map((f) => ({
          path: f.path,
          size: f.size,
          lastModified: f.lastModified?.toISOString(),
        })),
      },
      null,
      2
    );

    return {
      success: true,
      manifest,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to export manifest',
    };
  }
}
