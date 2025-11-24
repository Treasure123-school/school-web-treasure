import { minioStorage } from './minio-storage';
import {
  generateHomepagePath,
  generateGalleryPath,
  generateProfilePath,
  generateStudyResourcePath,
  generateGeneralPath,
  getFileInfo,
  validateFileSize,
  FilePathOptions,
} from './file-path-helpers';
import fs from 'fs/promises';
import path from 'path';

/**
 * Enhanced Upload Service with Smart Path Organization
 * 
 * This service provides a high-level interface for file uploads with automatic
 * path organization, validation, and error handling.
 */

export type UploadType = 'homepage' | 'gallery' | 'profile' | 'study-resource' | 'general';

export interface UploadOptions extends Partial<FilePathOptions> {
  uploadType: UploadType;
  maxSizeMB?: number;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  bucket?: string;
  error?: string;
}

/**
 * Main upload function with automatic path organization
 */
export async function uploadFileToStorage(
  file: Express.Multer.File,
  options: UploadOptions
): Promise<UploadResponse> {
  try {
    // Validate file size
    const maxSize = options.maxSizeMB || 5;
    if (!validateFileSize(file.size, maxSize)) {
      return {
        success: false,
        error: `File size exceeds maximum allowed size of ${maxSize}MB`,
      };
    }

    // Get file info
    const fileInfo = getFileInfo(file.originalname);

    // Check if MinIO is initialized
    if (!minioStorage.isInitialized()) {
      // FALLBACK: Use local filesystem storage
      // This maintains backward compatibility when MinIO is not available
      if (file.path) {
        // File was already stored on disk by multer (disk storage mode)
        const localUrl = `/${file.path.replace(/\\/g, '/')}`;
        return {
          success: true,
          url: localUrl,
          path: file.path,
        };
      }
      
      if (file.buffer) {
        // File is in memory (memory storage mode) - write to disk ourselves
        try {
          // Map upload types to existing directory structure (pluralized)
          const dirMap: Record<string, string> = {
            'profile': 'profiles',
            'homepage': 'homepage',
            'gallery': 'gallery',
            'study-resource': 'study-resources',
            'general': '', // Root uploads directory
          };
          
          const dirName = dirMap[options.uploadType || 'general'];
          const uploadDir = dirName ? path.join('uploads', dirName) : 'uploads';
          await fs.mkdir(uploadDir, { recursive: true });
          
          const timestamp = Date.now();
          const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
          const filename = `${timestamp}_${sanitizedName}`;
          const filePath = path.join(uploadDir, filename);
          
          await fs.writeFile(filePath, file.buffer);
          
          const localUrl = `/${filePath.replace(/\\/g, '/')}`;
          return {
            success: true,
            url: localUrl,
            path: filePath,
          };
        } catch (error: any) {
          console.error('Failed to write file to disk:', error);
          return {
            success: false,
            error: `Failed to save file to disk: ${error.message}`,
          };
        }
      }
      
      return {
        success: false,
        error: 'File storage service is not available and no file data provided.',
      };
    }

    // Determine bucket and generate organized path
    const { bucket, filePath } = generateUploadPath(file.originalname, options);

    // Ensure we have buffer for MinIO upload
    if (!file.buffer) {
      return {
        success: false,
        error: 'File buffer not available. Configure multer with memory storage for MinIO.',
      };
    }

    // Perform MinIO upload
    const result = await minioStorage.uploadFile(
      bucket,
      filePath,
      file.buffer,
      fileInfo.mimeType
    );

    if (!result) {
      return {
        success: false,
        error: 'File upload failed. Please try again.',
      };
    }

    return {
      success: true,
      url: result.url,
      path: result.path,
      bucket,
    };
  } catch (error: any) {
    console.error('Upload service error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during upload',
    };
  }
}

/**
 * Generate organized path based on upload type
 */
function generateUploadPath(
  originalFilename: string,
  options: UploadOptions
): { bucket: string; filePath: string } {
  const { uploadType, ...pathOptions } = options;

  const filePathOptions: FilePathOptions = {
    ...pathOptions,
    originalFilename,
    preserveExtension: true,
  };

  let bucket: string;
  let filePath: string;

  switch (uploadType) {
    case 'homepage':
      bucket = minioStorage.BUCKETS.HOMEPAGE;
      filePath = generateHomepagePath(filePathOptions);
      break;

    case 'gallery':
      bucket = minioStorage.BUCKETS.GALLERY;
      filePath = generateGalleryPath(filePathOptions);
      break;

    case 'profile':
      bucket = minioStorage.BUCKETS.PROFILES;
      filePath = generateProfilePath(filePathOptions);
      break;

    case 'study-resource':
      bucket = minioStorage.BUCKETS.STUDY_RESOURCES;
      filePath = generateStudyResourcePath(filePathOptions);
      break;

    case 'general':
    default:
      bucket = minioStorage.BUCKETS.GENERAL;
      filePath = generateGeneralPath(filePathOptions);
      break;
  }

  return { bucket, filePath };
}

/**
 * Delete file from storage
 */
export async function deleteFileFromStorage(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if this is a local filesystem path (starts with /uploads/)
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      try {
        const filePath = url.startsWith('/') ? url.substring(1) : url;
        await fs.unlink(filePath);
        return { success: true };
      } catch (error: any) {
        console.error('Failed to delete local file:', error);
        return {
          success: false,
          error: `Failed to delete file: ${error.message}`,
        };
      }
    }

    // Otherwise, assume it's a MinIO URL
    if (!minioStorage.isInitialized()) {
      return {
        success: false,
        error: 'File storage service is not available',
      };
    }

    // Extract bucket and path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.substring(1).split('/');
    const bucket = pathParts[0];
    const filePath = pathParts.slice(1).join('/');

    const success = await minioStorage.deleteFile(bucket, filePath);

    if (!success) {
      return {
        success: false,
        error: 'Failed to delete file',
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Delete file error:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete file',
    };
  }
}

/**
 * Upload multiple files
 */
export async function uploadMultipleFiles(
  files: Express.Multer.File[],
  options: UploadOptions
): Promise<UploadResponse[]> {
  const uploadPromises = files.map((file) => uploadFileToStorage(file, options));
  return Promise.all(uploadPromises);
}

/**
 * Replace existing file (delete old, upload new)
 */
export async function replaceFile(
  oldUrl: string | null,
  newFile: Express.Multer.File,
  options: UploadOptions
): Promise<UploadResponse> {
  // Upload new file first
  const uploadResult = await uploadFileToStorage(newFile, options);

  // If upload successful and there's an old file, delete it
  if (uploadResult.success && oldUrl) {
    await deleteFileFromStorage(oldUrl);
  }

  return uploadResult;
}

/**
 * Get presigned URL for temporary access
 */
export async function getTemporaryUrl(
  bucket: string,
  filePath: string,
  expirySeconds: number = 3600
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (!minioStorage.isInitialized()) {
      return {
        success: false,
        error: 'File storage service is not available',
      };
    }

    const url = await minioStorage.getPresignedUrl(bucket, filePath, expirySeconds);

    return {
      success: true,
      url,
    };
  } catch (error: any) {
    console.error('Get presigned URL error:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate temporary URL',
    };
  }
}

/**
 * List files in a bucket with optional prefix (for cleanup/migration)
 */
export async function listStorageFiles(
  bucket: string,
  prefix?: string
): Promise<{ success: boolean; files?: string[]; error?: string }> {
  try {
    if (!minioStorage.isInitialized()) {
      return {
        success: false,
        error: 'File storage service is not available',
      };
    }

    const files = await minioStorage.listFiles(bucket, prefix);

    return {
      success: true,
      files,
    };
  } catch (error: any) {
    console.error('List files error:', error);
    return {
      success: false,
      error: error.message || 'Failed to list files',
    };
  }
}

/**
 * Check if file exists
 */
export async function fileExists(
  bucket: string,
  filePath: string
): Promise<boolean> {
  try {
    if (!minioStorage.isInitialized()) {
      return false;
    }

    return await minioStorage.fileExists(bucket, filePath);
  } catch (error) {
    console.error('File exists check error:', error);
    return false;
  }
}
