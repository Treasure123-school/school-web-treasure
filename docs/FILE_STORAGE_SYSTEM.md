# File Storage Organization System

## Overview

This document describes the organized file storage system for Treasure-Home School Management System using MinIO object storage with smart path organization.

## Architecture

### Storage Buckets

The system uses 5 MinIO buckets with organized folder structures:

#### 1. `homepage-images` - Website Content
```
homepage-images/
├── hero/                    # Hero section images
│   └── {timestamp}_{hash}_{filename}
├── featured/                # Featured content images
│   └── {timestamp}_{hash}_{filename}
├── about/                   # About section images
│   └── {timestamp}_{hash}_{filename}
├── slider/                  # Slider/carousel images
│   └── {timestamp}_{hash}_{filename}
└── general/                 # Other homepage images
    └── {timestamp}_{hash}_{filename}
```

#### 2. `gallery-images` - School Gallery
```
gallery-images/
├── {year}/                  # e.g., 2025/
│   ├── {month}/            # e.g., 01/, 02/, etc.
│   │   ├── {category}/     # Optional: events, sports, academics
│   │   │   └── {timestamp}_{hash}_{filename}
│   │   └── {timestamp}_{hash}_{filename}
```

**Purpose**: Year/month organization for easy archival and seasonal cleanup.

#### 3. `profile-images` - User Avatars & Signatures
```
profile-images/
├── {userId}/               # User's UUID
│   ├── {timestamp}_{hash}_{filename}  # Profile pictures
│   └── {timestamp}_{hash}_{filename}  # Signatures
```

**Purpose**: Per-user isolation for easy lookup and user data deletion.

#### 4. `study-resources` - Learning Materials
```
study-resources/
├── class-{classId}/        # e.g., class-1/, class-2/
│   ├── subject-{subjectId}/    # e.g., subject-1/, subject-2/
│   │   ├── past-papers/
│   │   │   └── {timestamp}_{hash}_{filename}
│   │   ├── notes/
│   │   │   └── {timestamp}_{hash}_{filename}
│   │   ├── assignments/
│   │   │   └── {timestamp}_{hash}_{filename}
│   │   ├── textbooks/
│   │   │   └── {timestamp}_{hash}_{filename}
│   │   └── general/
│   │       └── {timestamp}_{hash}_{filename}
```

**Purpose**: Hierarchical organization by class and subject for easy navigation and permissions.

#### 5. `general-uploads` - Miscellaneous Files
```
general-uploads/
├── {year}/                 # e.g., 2025/
│   ├── {month}/           # e.g., 01/, 02/
│   │   ├── documents/     # PDFs, Word docs
│   │   ├── csv/           # CSV imports
│   │   ├── reports/       # Generated reports
│   │   ├── signatures/    # Signature files
│   │   └── misc/          # Other files
```

**Purpose**: Date-based organization for general files with type categorization.

## Usage

### Uploading Files in Routes

```typescript
import { uploadFileToStorage } from './upload-service';

// Example: Upload profile image
app.post('/api/upload/profile', authenticateUser, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const result = await uploadFileToStorage(req.file, {
    uploadType: 'profile',
    userId: req.user!.id,
    maxSizeMB: 5,
  });

  if (!result.success) {
    return res.status(500).json({ message: result.error });
  }

  res.json({
    url: result.url,
    path: result.path,
  });
});

// Example: Upload study resource
app.post('/api/upload/study-resource', authenticateUser, upload.single('file'), async (req, res) => {
  const { classId, subjectId, category } = req.body;

  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const result = await uploadFileToStorage(req.file, {
    uploadType: 'study-resource',
    classId: parseInt(classId),
    subjectId: parseInt(subjectId),
    category, // 'past-papers', 'notes', 'assignments', 'textbooks'
    maxSizeMB: 10,
  });

  if (!result.success) {
    return res.status(500).json({ message: result.error });
  }

  res.json({
    url: result.url,
    path: result.path,
  });
});

// Example: Upload gallery image
app.post('/api/upload/gallery', authenticateUser, upload.single('file'), async (req, res) => {
  const { category } = req.body; // Optional: 'events', 'sports', 'academics'

  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const result = await uploadFileToStorage(req.file, {
    uploadType: 'gallery',
    category,
    maxSizeMB: 5,
  });

  if (!result.success) {
    return res.status(500).json({ message: result.error });
  }

  res.json({
    url: result.url,
    path: result.path,
  });
});
```

### Deleting Files

```typescript
import { deleteFileFromStorage } from './upload-service';

// Example: Delete old profile image when updating
const oldImageUrl = user.profileImageUrl;
if (oldImageUrl) {
  await deleteFileFromStorage(oldImageUrl);
}
```

### Replacing Files

```typescript
import { replaceFile } from './upload-service';

// Example: Update profile image (auto-deletes old one)
const result = await replaceFile(
  user.profileImageUrl, // Old URL (will be deleted)
  req.file,             // New file
  {
    uploadType: 'profile',
    userId: req.user!.id,
  }
);
```

## File Management Utilities

### Audit Bucket Contents

```typescript
import { auditBucket } from './storage-migration-utility';

const result = await auditBucket('gallery-images');
console.log(`Total files: ${result.count}`);
console.log('Files:', result.files);
```

### Cleanup Old Files

```typescript
import { cleanupOldFiles } from './storage-migration-utility';

// Delete files older than 90 days from gallery
const result = await cleanupOldFiles('gallery-images', 90);
console.log(`Deleted ${result.deleted} old files`);
```

### Get Storage Statistics

```typescript
import { getStorageStats } from './storage-migration-utility';

const stats = await getStorageStats();
console.log('Storage stats:', stats);

// Output example:
// {
//   'homepage-images': {
//     fileCount: 45,
//     totalSize: 12458960,  // bytes
//     oldestFile: Date,
//     newestFile: Date
//   },
//   ...
// }
```

### Verify File Existence

```typescript
import { verifyFileExists, batchVerifyFiles } from './storage-migration-utility';

// Single file
const exists = await verifyFileExists('http://localhost:9000/profile-images/user123/image.jpg');

// Multiple files
const urls = [/* array of URLs from database */];
const verification = await batchVerifyFiles(urls);
console.log(`Found ${verification.existing} of ${verification.total} files`);
console.log(`Missing files:`, verification.missingUrls);
```

## Benefits of This System

### 1. **Fast File Lookup**
- Profile images: Direct path via userId
- Study resources: Organized by class/subject
- Gallery: Organized by date

### 2. **Easy Cleanup**
- Date-based folders enable automated cleanup of old files
- Per-user folders enable easy user data deletion (GDPR compliance)

### 3. **Scalability**
- Prevents single folder from having thousands of files
- Distributes files across organized structure
- Supports multi-million file storage

### 4. **Data Retention**
- Easy to implement retention policies
- Can archive old gallery images by year/month
- Simple backup strategies

### 5. **Performance**
- Reduces directory listing overhead
- Enables efficient prefix-based searches
- Supports CDN caching strategies

## Migration Notes

### Migrating Existing Files

If you have existing files in flat structure, you can migrate them:

```typescript
// Example migration script (to be run manually)
import { auditBucket } from './storage-migration-utility';
import { minioStorage } from './minio-storage';
import { generateProfilePath, generateGalleryPath } from './file-path-helpers';

async function migrateProfileImages() {
  const result = await auditBucket('profile-images');
  
  if (!result.success || !result.files) {
    console.error('Failed to audit bucket');
    return;
  }

  for (const file of result.files) {
    // If file is not in organized structure (no userId folder)
    if (!file.path.includes('/')) {
      // Extract userId from database and reorganize
      // This is a placeholder - implement based on your needs
      console.log(`Need to migrate: ${file.path}`);
    }
  }
}
```

## Environment Variables

No additional environment variables required. The system uses existing MinIO configuration:

- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_USE_SSL`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_PUBLIC_ENDPOINT` (optional, for public URLs)
- `MINIO_PUBLIC_PORT` (optional, for public URLs)

## Security Considerations

1. **Access Control**: Bucket policies are set to public-read for uploaded files
2. **File Validation**: Automatic file type and size validation
3. **Sanitization**: Filenames are sanitized to prevent path traversal
4. **User Isolation**: Profile images are isolated per user
5. **Presigned URLs**: Available for temporary secure access

## Best Practices

1. **Always use the upload service** instead of direct MinIO calls
2. **Delete old files** when updating (use `replaceFile` helper)
3. **Validate file types** at the route level before uploading
4. **Set appropriate maxSizeMB** based on upload type
5. **Use categories** for better organization (gallery, study resources)
6. **Run periodic cleanup** for old files in date-organized buckets
7. **Monitor storage stats** to track usage and plan capacity

## Troubleshooting

### Files Not Appearing
- Check MinIO is running and initialized
- Verify bucket permissions are set correctly
- Check firewall/network rules if using remote MinIO

### Upload Failures
- Verify file size is within limits
- Check MinIO connection status
- Review server logs for detailed error messages

### Missing Files
- Use `batchVerifyFiles` utility to check database URLs
- Run `auditBucket` to see what's actually in storage
- Check if files were accidentally deleted during cleanup

## Future Enhancements

- Automatic file versioning
- Image resizing and optimization on upload
- Virus scanning integration
- Automatic backup to cloud storage
- File deduplication system
- Advanced search and tagging
