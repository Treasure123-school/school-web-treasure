import { format } from 'date-fns';
import path from 'path';
import crypto from 'crypto';

/**
 * Smart File Path Organization System for MinIO Storage
 * 
 * This module provides standardized path generation for organized file storage
 * across all MinIO buckets with date-based and category-based organization.
 */

export interface FilePathOptions {
  userId?: string;
  classId?: number;
  subjectId?: number;
  category?: string;
  originalFilename: string;
  preserveExtension?: boolean;
}

/**
 * Generate a unique filename with timestamp and random hash
 */
export function generateUniqueFilename(originalFilename: string, preserveExtension: boolean = true): string {
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');
  
  if (preserveExtension) {
    const ext = path.extname(originalFilename);
    const nameWithoutExt = path.basename(originalFilename, ext);
    const sanitizedName = sanitizeName(nameWithoutExt);
    return `${timestamp}_${randomHash}_${sanitizedName}${ext}`;
  }
  
  const sanitizedName = sanitizeName(originalFilename);
  return `${timestamp}_${randomHash}_${sanitizedName}`;
}

/**
 * Sanitize filename to remove special characters
 */
export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 100); // Limit length
}

/**
 * Get current date parts for path organization
 */
function getDateParts() {
  const now = new Date();
  return {
    year: format(now, 'yyyy'),
    month: format(now, 'MM'),
    day: format(now, 'dd'),
    timestamp: format(now, 'yyyy-MM-dd_HH-mm-ss'),
  };
}

/**
 * Homepage Images Path Generator
 * Structure: homepage-images/{category}/{timestamp}_{filename}
 * 
 * Categories: hero, featured, about, slider
 */
export function generateHomepagePath(options: FilePathOptions): string {
  const { category = 'general', originalFilename } = options;
  const filename = generateUniqueFilename(originalFilename);
  
  const validCategories = ['hero', 'featured', 'about', 'slider', 'general'];
  const sanitizedCategory = validCategories.includes(category) ? category : 'general';
  
  return `${sanitizedCategory}/${filename}`;
}

/**
 * Gallery Images Path Generator
 * Structure: gallery-images/{year}/{month}/{filename}
 * 
 * Organized by year and month for easy archival
 */
export function generateGalleryPath(options: FilePathOptions): string {
  const { originalFilename, category } = options;
  const { year, month } = getDateParts();
  const filename = generateUniqueFilename(originalFilename);
  
  // Optional category subfolder (e.g., events, sports, academics)
  if (category) {
    return `${year}/${month}/${sanitizeName(category)}/${filename}`;
  }
  
  return `${year}/${month}/${filename}`;
}

/**
 * Profile Images Path Generator
 * Structure: profile-images/{userId}/{timestamp}_{filename}
 * 
 * Organized by user ID for easy lookup and cleanup
 */
export function generateProfilePath(options: FilePathOptions): string {
  const { userId, originalFilename } = options;
  
  if (!userId) {
    throw new Error('userId is required for profile image paths');
  }
  
  const filename = generateUniqueFilename(originalFilename);
  return `${userId}/${filename}`;
}

/**
 * Study Resources Path Generator
 * Structure: study-resources/{classId}/{subjectId}/{category}/{filename}
 * 
 * Categories: past-papers, notes, assignments, textbooks
 * Organized by class and subject for easy navigation
 */
export function generateStudyResourcePath(options: FilePathOptions): string {
  const { classId, subjectId, category = 'general', originalFilename } = options;
  
  if (!classId || !subjectId) {
    throw new Error('classId and subjectId are required for study resource paths');
  }
  
  const validCategories = ['past-papers', 'notes', 'assignments', 'textbooks', 'general'];
  const sanitizedCategory = validCategories.includes(category) ? category : 'general';
  
  const filename = generateUniqueFilename(originalFilename);
  return `class-${classId}/subject-${subjectId}/${sanitizedCategory}/${filename}`;
}

/**
 * General Uploads Path Generator
 * Structure: general-uploads/{date}/{type}/{filename}
 * 
 * Types: documents, csv, reports, signatures, misc
 * Organized by date and file type
 */
export function generateGeneralPath(options: FilePathOptions): string {
  const { category = 'misc', originalFilename } = options;
  const { year, month } = getDateParts();
  const filename = generateUniqueFilename(originalFilename);
  
  const validTypes = ['documents', 'csv', 'reports', 'signatures', 'misc'];
  const fileType = validTypes.includes(category) ? category : 'misc';
  
  return `${year}/${month}/${fileType}/${filename}`;
}

/**
 * Extract file info from existing URL or path
 * Useful for migrations and cleanup operations
 */
export function parseFilePath(urlOrPath: string): {
  bucket?: string;
  path: string;
  filename: string;
  directory: string;
} {
  // Remove protocol and domain if it's a full URL
  let filePath = urlOrPath;
  if (urlOrPath.includes('://')) {
    const url = new URL(urlOrPath);
    filePath = url.pathname.substring(1); // Remove leading /
  }
  
  // Extract bucket if present (format: bucket/path/to/file)
  const parts = filePath.split('/');
  const bucket = parts.length > 1 ? parts[0] : undefined;
  const pathWithoutBucket = bucket ? parts.slice(1).join('/') : filePath;
  
  const filename = path.basename(pathWithoutBucket);
  const directory = path.dirname(pathWithoutBucket);
  
  return {
    bucket,
    path: pathWithoutBucket,
    filename,
    directory: directory === '.' ? '' : directory,
  };
}

/**
 * Get file extension and MIME type
 */
export function getFileInfo(filename: string): {
  extension: string;
  mimeType: string;
  category: 'image' | 'document' | 'video' | 'other';
} {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.csv': 'text/csv',
    '.txt': 'text/plain',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
  };
  
  const categories: Record<string, 'image' | 'document' | 'video' | 'other'> = {
    '.jpg': 'image',
    '.jpeg': 'image',
    '.png': 'image',
    '.gif': 'image',
    '.webp': 'image',
    '.svg': 'image',
    '.pdf': 'document',
    '.doc': 'document',
    '.docx': 'document',
    '.xls': 'document',
    '.xlsx': 'document',
    '.csv': 'document',
    '.txt': 'document',
    '.mp4': 'video',
    '.mov': 'video',
  };
  
  return {
    extension: ext,
    mimeType: mimeTypes[ext] || 'application/octet-stream',
    category: categories[ext] || 'other',
  };
}

/**
 * Validate file size
 */
export function validateFileSize(size: number, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}

/**
 * Generate cleanup paths for old files
 * Returns paths that can be used to list and delete old files
 */
export function generateCleanupPaths(bucket: string, olderThanDays: number = 90): {
  bucket: string;
  cutoffDate: Date;
  searchPrefixes: string[];
} {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
  
  const year = format(cutoffDate, 'yyyy');
  const month = format(cutoffDate, 'MM');
  
  // Generate prefixes for date-organized buckets
  const prefixes: string[] = [];
  
  if (bucket === 'gallery-images' || bucket === 'general-uploads') {
    // These use year/month structure
    prefixes.push(`${year}/${month}/`);
  }
  
  return {
    bucket,
    cutoffDate,
    searchPrefixes: prefixes,
  };
}
