import { Injectable, BadRequestException } from '@nestjs/common';
import { MinioService } from '../../infrastructure/storage/minio.service';
import { LoggingService } from '../../infrastructure/logging/logging.service';
import * as path from 'path';

@Injectable()
export class FilesService {
  constructor(
    private minioService: MinioService,
    private loggingService: LoggingService,
  ) {}

  async uploadFile(file: Express.Multer.File, bucket: string, userId: string) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const filePath = `${userId}/${filename}`;

    const result = await this.minioService.uploadFile(
      bucket,
      filePath,
      file.buffer,
      file.mimetype,
    );

    this.loggingService.audit('File uploaded', userId, {
      bucket,
      filePath,
      size: file.size,
      mimetype: file.mimetype,
    });

    return result;
  }

  async deleteFile(bucket: string, filePath: string, userId: string) {
    const success = await this.minioService.deleteFile(bucket, filePath);
    
    if (success) {
      this.loggingService.audit('File deleted', userId, { bucket, filePath });
    }

    return { success };
  }

  async getPresignedUrl(bucket: string, filePath: string) {
    const url = await this.minioService.getPresignedUrl(bucket, filePath, 3600);
    return { url };
  }
}
