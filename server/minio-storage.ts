import { Client as MinioClient } from 'minio';

export interface MinioConfig {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
}

export interface UploadResult {
  url: string;
  path: string;
  etag: string;
}

class MinioStorageService {
  private client: MinioClient | null = null;
  private config: MinioConfig | null = null;
  private initialized = false;

  // Storage buckets
  readonly BUCKETS = {
    HOMEPAGE: 'homepage-images',
    GALLERY: 'gallery-images',
    PROFILES: 'profile-images',
    STUDY_RESOURCES: 'study-resources',
    GENERAL: 'general-uploads'
  } as const;

  initialize(): boolean {
    try {
      const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
      const port = parseInt(process.env.MINIO_PORT || '9000');
      const useSSL = process.env.MINIO_USE_SSL === 'true';
      const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
      const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';

      this.config = {
        endPoint: endpoint,
        port,
        useSSL,
        accessKey,
        secretKey,
      };

      this.client = new MinioClient(this.config);

      console.log('✅ MinIO Storage client initialized successfully');
      console.log(`   → Endpoint: ${endpoint}:${port}`);
      console.log(`   → SSL: ${useSSL}`);
      console.log(`   → Access key configured: Yes`);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize MinIO client:', error);
      this.client = null;
      this.initialized = false;
      return false;
    }
  }

  getClient(): MinioClient | null {
    return this.client;
  }

  isInitialized(): boolean {
    return this.initialized && this.client !== null;
  }

  async ensureBucketsExist(): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      console.error('❌ MinIO client not initialized');
      return false;
    }

    try {
      const buckets = Object.values(this.BUCKETS);

      for (const bucketName of buckets) {
        const exists = await client.bucketExists(bucketName);

        if (!exists) {
          await client.makeBucket(bucketName, 'us-east-1');

          // Set public-read policy for the bucket
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          };

          await client.setBucketPolicy(bucketName, JSON.stringify(policy));
          console.log(`✅ Created and configured bucket: ${bucketName}`);
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Error ensuring buckets exist:', error);
      return false;
    }
  }

  async uploadFile(
    bucket: string,
    filePath: string,
    fileBuffer: Buffer,
    contentType: string
  ): Promise<UploadResult | null> {
    const client = this.getClient();
    if (!client) {
      throw new Error('MinIO Storage not configured - missing client');
    }

    try {
      // Verify bucket exists first
      const exists = await client.bucketExists(bucket);
      if (!exists) {
        throw new Error(`Storage bucket "${bucket}" not found.`);
      }

      const result = await client.putObject(
        bucket,
        filePath,
        fileBuffer,
        fileBuffer.length,
        {
          'Content-Type': contentType,
          'x-amz-meta-uploaded-at': new Date().toISOString(),
        }
      );

      const url = this.getPublicUrl(bucket, filePath);

      return {
        url,
        path: filePath,
        etag: result.etag,
      };
    } catch (error: any) {
      console.error(`Failed to upload file to MinIO: ${filePath}`, error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      throw new Error('MinIO Storage not configured');
    }

    try {
      await client.removeObject(bucket, filePath);
      return true;
    } catch (error) {
      console.error(`Failed to delete file from MinIO: ${filePath}`, error);
      return false;
    }
  }

  getPublicUrl(bucket: string, filePath: string): string {
    if (!this.config) {
      throw new Error('MinIO not configured');
    }

    const protocol = this.config.useSSL ? 'https' : 'http';
    // For production, use the public endpoint URL if provided
    const publicEndpoint = process.env.MINIO_PUBLIC_ENDPOINT || this.config.endPoint;
    const publicPort = process.env.MINIO_PUBLIC_PORT || this.config.port;
    
    return `${protocol}://${publicEndpoint}:${publicPort}/${bucket}/${filePath}`;
  }

  async getPresignedUrl(bucket: string, filePath: string, expiry: number = 3600): Promise<string> {
    const client = this.getClient();
    if (!client) {
      throw new Error('MinIO Storage not configured');
    }

    return await client.presignedGetObject(bucket, filePath, expiry);
  }

  async fileExists(bucket: string, filePath: string): Promise<boolean> {
    const client = this.getClient();
    if (!client) {
      return false;
    }

    try {
      await client.statObject(bucket, filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async listFiles(bucket: string, prefix?: string): Promise<string[]> {
    const client = this.getClient();
    if (!client) {
      throw new Error('MinIO Storage not configured');
    }

    return new Promise((resolve, reject) => {
      const files: string[] = [];
      const stream = client.listObjects(bucket, prefix, true);

      stream.on('data', (obj) => {
        if (obj.name) {
          files.push(obj.name);
        }
      });

      stream.on('end', () => {
        resolve(files);
      });

      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}

// Export singleton instance
export const minioStorage = new MinioStorageService();
