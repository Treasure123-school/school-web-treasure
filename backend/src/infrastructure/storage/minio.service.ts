import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';

export interface UploadResult {
  url: string;
  path: string;
  etag: string;
}

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: MinioClient;
  private readonly buckets = [
    'homepage-images',
    'gallery-images',
    'profile-images',
    'study-resources',
    'general-uploads',
  ];

  constructor(private configService: ConfigService) {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<number>('MINIO_PORT', 9000);
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false);
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY', 'minioadmin');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY', 'minioadmin');

    this.minioClient = new MinioClient({
      endPoint: endpoint,
      port,
      useSSL,
      accessKey,
      secretKey,
    });
  }

  async onModuleInit() {
    await this.ensureBucketsExist();
  }

  private async ensureBucketsExist() {
    for (const bucket of this.buckets) {
      try {
        const exists = await this.minioClient.bucketExists(bucket);
        if (!exists) {
          await this.minioClient.makeBucket(bucket, 'us-east-1');
          
          // Set public-read policy
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
          
          await this.minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
          this.logger.log(`✅ Created and configured bucket: ${bucket}`);
        }
      } catch (error) {
        this.logger.error(`❌ Error ensuring bucket ${bucket} exists:`, error);
      }
    }
  }

  async uploadFile(
    bucket: string,
    filePath: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<UploadResult> {
    try {
      const result = await this.minioClient.putObject(
        bucket,
        filePath,
        buffer,
        buffer.length,
        {
          'Content-Type': contentType,
          'x-amz-meta-uploaded-at': new Date().toISOString(),
        },
      );

      const url = this.getPublicUrl(bucket, filePath);

      return {
        url,
        path: filePath,
        etag: result.etag,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to MinIO: ${filePath}`, error);
      throw error;
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<boolean> {
    try {
      await this.minioClient.removeObject(bucket, filePath);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file from MinIO: ${filePath}`, error);
      return false;
    }
  }

  getPublicUrl(bucket: string, filePath: string): string {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT', 'localhost');
    const port = this.configService.get<number>('MINIO_PORT', 9000);
    const useSSL = this.configService.get<boolean>('MINIO_USE_SSL', false);
    
    const protocol = useSSL ? 'https' : 'http';
    return `${protocol}://${endpoint}:${port}/${bucket}/${filePath}`;
  }

  async getPresignedUrl(bucket: string, filePath: string, expiry: number = 3600): Promise<string> {
    return await this.minioClient.presignedGetObject(bucket, filePath, expiry);
  }

  async fileExists(bucket: string, filePath: string): Promise<boolean> {
    try {
      await this.minioClient.statObject(bucket, filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}
