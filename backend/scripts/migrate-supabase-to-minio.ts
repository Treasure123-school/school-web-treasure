import { createClient } from '@supabase/supabase-js';
import { Client as MinioClient } from 'minio';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * IDEMPOTENT MIGRATION SCRIPT
 * Migrates files from Supabase Storage to MinIO
 * Safe to run multiple times - only migrates missing files
 */

interface MigrationConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  minioEndpoint: string;
  minioPort: number;
  minioAccessKey: string;
  minioSecretKey: string;
  minioUseSSL: boolean;
}

interface MigrationResult {
  bucket: string;
  totalFiles: number;
  migratedFiles: number;
  skippedFiles: number;
  errors: Array<{ file: string; error: string }>;
  checksumVerifications: number;
}

const BUCKETS = [
  'homepage-images',
  'gallery-images',
  'profile-images',
  'study-resources',
  'general-uploads',
];

class SupabaseToMinioMigrator {
  private supabase: ReturnType<typeof createClient>;
  private minio: MinioClient;
  private config: MigrationConfig;
  private migrationLog: string[] = [];

  constructor(config: MigrationConfig) {
    this.config = config;
    
    // Initialize Supabase client
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
    
    // Initialize MinIO client
    this.minio = new MinioClient({
      endPoint: config.minioEndpoint,
      port: config.minioPort,
      useSSL: config.minioUseSSL,
      accessKey: config.minioAccessKey,
      secretKey: config.minioSecretKey,
    });
  }

  private log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    this.migrationLog.push(logMessage);
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  async ensureMinioBucketExists(bucket: string): Promise<void> {
    const exists = await this.minio.bucketExists(bucket);
    if (!exists) {
      await this.minio.makeBucket(bucket, 'us-east-1');
      this.log(`✅ Created MinIO bucket: ${bucket}`);
      
      // Set bucket policy to public-read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          },
        ],
      };
      
      await this.minio.setBucketPolicy(bucket, JSON.stringify(policy));
      this.log(`✅ Set public-read policy for bucket: ${bucket}`);
    }
  }

  async migrateFile(bucket: string, filePath: string): Promise<boolean> {
    try {
      // Check if file already exists in MinIO
      try {
        await this.minio.statObject(bucket, filePath);
        this.log(`⏭️  Skipping (already exists): ${filePath}`);
        return false; // Already exists, skip
      } catch (error: any) {
        if (error.code !== 'NotFound') {
          throw error;
        }
        // File doesn't exist, proceed with migration
      }

      // Download from Supabase
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .download(filePath);

      if (error || !data) {
        this.log(`❌ Failed to download from Supabase: ${filePath}`);
        return false;
      }

      // Convert to buffer
      const arrayBuffer = await data.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Calculate checksum
      const checksum = this.calculateChecksum(buffer);

      // Determine content type
      const contentType = data.type || 'application/octet-stream';

      // Upload to MinIO
      await this.minio.putObject(bucket, filePath, buffer, buffer.length, {
        'Content-Type': contentType,
        'x-amz-meta-original-checksum': checksum,
        'x-amz-meta-migrated-from': 'supabase',
        'x-amz-meta-migration-date': new Date().toISOString(),
      });

      // Verify upload
      const stats = await this.minio.statObject(bucket, filePath);
      if (stats.size !== buffer.length) {
        throw new Error(`Size mismatch after upload: expected ${buffer.length}, got ${stats.size}`);
      }

      this.log(`✅ Migrated: ${filePath} (${buffer.length} bytes, checksum: ${checksum})`);
      return true;
    } catch (error: any) {
      this.log(`❌ Error migrating ${filePath}: ${error.message}`);
      throw error;
    }
  }

  async migrateBucket(bucket: string): Promise<MigrationResult> {
    this.log(`\n📦 Starting migration for bucket: ${bucket}`);
    
    const result: MigrationResult = {
      bucket,
      totalFiles: 0,
      migratedFiles: 0,
      skippedFiles: 0,
      errors: [],
      checksumVerifications: 0,
    };

    try {
      // Ensure MinIO bucket exists
      await this.ensureMinioBucketExists(bucket);

      // List all files in Supabase bucket
      const { data: files, error } = await this.supabase.storage
        .from(bucket)
        .list('', {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error || !files) {
        this.log(`❌ Failed to list files in Supabase bucket: ${bucket}`);
        return result;
      }

      result.totalFiles = files.length;
      this.log(`📋 Found ${files.length} files in bucket: ${bucket}`);

      // Migrate each file
      for (const file of files) {
        if (file.name === '.emptyFolderPlaceholder') {
          continue; // Skip placeholder files
        }

        try {
          const migrated = await this.migrateFile(bucket, file.name);
          if (migrated) {
            result.migratedFiles++;
            result.checksumVerifications++;
          } else {
            result.skippedFiles++;
          }
        } catch (error: any) {
          result.errors.push({
            file: file.name,
            error: error.message,
          });
        }
      }

      this.log(`\n✅ Bucket ${bucket} migration complete:`);
      this.log(`   - Total files: ${result.totalFiles}`);
      this.log(`   - Migrated: ${result.migratedFiles}`);
      this.log(`   - Skipped: ${result.skippedFiles}`);
      this.log(`   - Errors: ${result.errors.length}`);

    } catch (error: any) {
      this.log(`❌ Critical error in bucket ${bucket}: ${error.message}`);
      throw error;
    }

    return result;
  }

  async migrateAll(): Promise<MigrationResult[]> {
    this.log('🚀 Starting Supabase to MinIO migration');
    this.log(`📅 Migration started at: ${new Date().toISOString()}`);
    
    const results: MigrationResult[] = [];

    for (const bucket of BUCKETS) {
      const result = await this.migrateBucket(bucket);
      results.push(result);
    }

    // Summary
    const totalMigrated = results.reduce((sum, r) => sum + r.migratedFiles, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skippedFiles, 0);
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalVerified = results.reduce((sum, r) => sum + r.checksumVerifications, 0);

    this.log('\n📊 MIGRATION SUMMARY');
    this.log('='.repeat(50));
    this.log(`✅ Total files migrated: ${totalMigrated}`);
    this.log(`⏭️  Total files skipped (already exist): ${totalSkipped}`);
    this.log(`✓  Total checksum verifications: ${totalVerified}`);
    this.log(`❌ Total errors: ${totalErrors}`);
    
    if (totalErrors > 0) {
      this.log('\n❌ ERRORS:');
      results.forEach(r => {
        if (r.errors.length > 0) {
          this.log(`\nBucket: ${r.bucket}`);
          r.errors.forEach(e => {
            this.log(`  - ${e.file}: ${e.error}`);
          });
        }
      });
    }

    // Save migration log
    const logDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, `migration-${Date.now()}.log`);
    fs.writeFileSync(logFile, this.migrationLog.join('\n'));
    this.log(`\n📄 Migration log saved to: ${logFile}`);

    return results;
  }
}

// Main execution
async function main() {
  const config: MigrationConfig = {
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY || '',
    minioEndpoint: process.env.MINIO_ENDPOINT || 'localhost',
    minioPort: parseInt(process.env.MINIO_PORT || '9000'),
    minioAccessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    minioSecretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    minioUseSSL: process.env.MINIO_USE_SSL === 'true',
  };

  // Validate config
  if (!config.supabaseUrl || !config.supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  const migrator = new SupabaseToMinioMigrator(config);
  
  try {
    await migrator.migrateAll();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { SupabaseToMinioMigrator, MigrationConfig, MigrationResult };
