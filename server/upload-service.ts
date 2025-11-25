import fs from 'fs/promises';
import path from 'path';

/**
 * Local File Upload Service
 * 
 * This service provides file uploads to local server/uploads directory
 * with automatic path organization, validation, and error handling.
 * 
 * NO EXTERNAL STORAGE - All files stored in server/uploads/
 */

export type UploadType = 'homepage' | 'gallery' | 'profile' | 'study-resource' | 'general';

export interface UploadOptions {
  uploadType: UploadType;
  maxSizeMB?: number;
  userId?: string;
  category?: string;
  classId?: number;
  subjectId?: number;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Validate file size
 */
function validateFileSize(fileSize: number, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
}

/**
 * Main upload function - saves files to local server/uploads directory
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

    // If file already has a path (disk storage mode), use it
    if (file.path) {
      // Update path to use server/uploads if needed
      let filePath = file.path;
      if (!filePath.startsWith('server/uploads')) {
        // Move file from old uploads/ to server/uploads/
        const newPath = filePath.replace(/^uploads\//, 'server/uploads/');
        filePath = newPath;
      }
      const localUrl = `/${filePath.replace(/\\/g, '/')}`;
      return {
        success: true,
        url: localUrl,
        path: filePath,
      };
    }

    // If file is in memory (buffer), save it to disk
    if (file.buffer) {
      try {
        // Map upload types to directory structure
        const dirMap: Record<string, string> = {
          'profile': 'profiles',
          'homepage': 'homepage',
          'gallery': 'gallery',
          'study-resource': 'study-resources',
          'general': 'general',
        };

        const dirName = dirMap[options.uploadType || 'general'];
        const uploadDir = path.join('server/uploads', dirName);
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
      error: 'No file data provided.',
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
 * Replace an existing file with a new one
 */
export async function replaceFile(
  oldUrl: string,
  newFile: Express.Multer.File,
  options: UploadOptions
): Promise<UploadResponse> {
  // Delete old file first
  await deleteFileFromStorage(oldUrl);

  // Upload new file
  return await uploadFileToStorage(newFile, options);
}

/**
 * Delete file from local storage
 */
export async function deleteFileFromStorage(
  url: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if this is a local filesystem path
    if (url.startsWith('/uploads/') || url.startsWith('uploads/') || 
        url.startsWith('/server/uploads/') || url.startsWith('server/uploads/')) {
      try {
        const filePath = url.startsWith('/') ? url.substring(1) : url;
        await fs.unlink(filePath);
        console.log(`✅ Deleted file: ${filePath}`);
        return { success: true };
      } catch (error: any) {
        // File might not exist, that's okay
        if (error.code === 'ENOENT') {
          console.log(`ℹ️  File not found (already deleted): ${url}`);
          return { success: true };
        }
        console.error('Failed to delete local file:', error);
        return {
          success: false,
          error: `Failed to delete file: ${error.message}`,
        };
      }
    }

    return {
      success: false,
      error: 'Invalid file URL format',
    };
  } catch (error: any) {
    console.error('Delete service error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during deletion',
    };
  }
}
