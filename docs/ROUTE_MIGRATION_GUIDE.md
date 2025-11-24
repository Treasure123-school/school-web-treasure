# Route Migration Guide - New Upload System

## Overview

This guide shows how to update existing routes to use the new organized file upload system.

## Before: Old Upload Pattern

```typescript
// OLD WAY - Unorganized paths
app.post('/api/gallery/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Old: Flat file structure, manual path handling
    const fileName = `${Date.now()}_${req.file.originalname}`;
    const result = await minioStorage.uploadFile(
      'gallery-images',
      fileName,  // ❌ No organization
      req.file.buffer,
      req.file.mimetype
    );

    res.json({ url: result?.url });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed' });
  }
});
```

## After: New Organized Pattern

```typescript
// NEW WAY - Organized paths with smart helpers
import { uploadFileToStorage } from './upload-service';

app.post('/api/gallery/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const { category } = req.body; // Optional: 'events', 'sports', 'academics'

    // New: Automatic organization by year/month/category
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
      bucket: result.bucket,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Upload failed' });
  }
});
```

## Migration Examples

### 1. Profile Image Upload

**Before:**
```typescript
app.post('/api/users/profile-image', upload.single('image'), async (req, res) => {
  const fileName = `profile_${req.user!.id}_${Date.now()}.jpg`;
  const result = await minioStorage.uploadFile(
    'profile-images',
    fileName,
    req.file!.buffer,
    'image/jpeg'
  );
  // ...
});
```

**After:**
```typescript
import { uploadFileToStorage, replaceFile } from './upload-service';

app.post('/api/users/profile-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  // Automatically organizes as: profile-images/{userId}/{timestamp}_{hash}_{filename}
  const result = await uploadFileToStorage(req.file, {
    uploadType: 'profile',
    userId: req.user!.id,
    maxSizeMB: 5,
  });

  if (!result.success) {
    return res.status(500).json({ message: result.error });
  }

  // Update user record
  await db.update(users)
    .set({ profileImageUrl: result.url })
    .where(eq(users.id, req.user!.id));

  res.json({ url: result.url });
});
```

**With Auto-Delete Old Image:**
```typescript
app.post('/api/users/profile-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, req.user!.id),
  });

  // Replaces old image and deletes the previous one automatically
  const result = await replaceFile(
    user?.profileImageUrl || null,
    req.file,
    {
      uploadType: 'profile',
      userId: req.user!.id,
      maxSizeMB: 5,
    }
  );

  if (!result.success) {
    return res.status(500).json({ message: result.error });
  }

  await db.update(users)
    .set({ profileImageUrl: result.url })
    .where(eq(users.id, req.user!.id));

  res.json({ url: result.url });
});
```

### 2. Study Resources Upload

**Before:**
```typescript
app.post('/api/study-resources/upload', uploadDocument.single('file'), async (req, res) => {
  const fileName = `${Date.now()}_${req.file!.originalname}`;
  const result = await minioStorage.uploadFile(
    'study-resources',
    fileName,
    req.file!.buffer,
    req.file!.mimetype
  );
  // ...
});
```

**After:**
```typescript
app.post('/api/study-resources/upload', uploadDocument.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const { classId, subjectId, category, title, description } = req.body;

  if (!classId || !subjectId) {
    return res.status(400).json({
      message: 'Class ID and Subject ID are required',
    });
  }

  // Automatically organizes as:
  // study-resources/class-{classId}/subject-{subjectId}/{category}/{filename}
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

  // Save to database
  const [resource] = await db.insert(studyResources).values({
    title,
    description,
    fileUrl: result.url,
    filePath: result.path,
    classId: parseInt(classId),
    subjectId: parseInt(subjectId),
    category,
    uploadedBy: req.user!.id,
  }).returning();

  res.json(resource);
});
```

### 3. Homepage Content Upload

**Before:**
```typescript
app.post('/api/homepage/upload', upload.single('image'), async (req, res) => {
  const fileName = `homepage_${Date.now()}.jpg`;
  const result = await minioStorage.uploadFile(
    'homepage-images',
    fileName,
    req.file!.buffer,
    'image/jpeg'
  );
  // ...
});
```

**After:**
```typescript
app.post('/api/homepage/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file provided' });
  }

  const { section } = req.body; // 'hero', 'featured', 'about', 'slider'

  // Automatically organizes as: homepage-images/{section}/{timestamp}_{hash}_{filename}
  const result = await uploadFileToStorage(req.file, {
    uploadType: 'homepage',
    category: section,
    maxSizeMB: 5,
  });

  if (!result.success) {
    return res.status(500).json({ message: result.error });
  }

  // Save to database
  const [content] = await db.insert(homePageContent).values({
    section,
    imageUrl: result.url,
    imagePath: result.path,
    isActive: true,
  }).returning();

  res.json(content);
});
```

### 4. Multiple File Upload

**Before:**
```typescript
app.post('/api/gallery/bulk-upload', upload.array('images', 10), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const uploadedUrls: string[] = [];

  for (const file of files) {
    const fileName = `${Date.now()}_${file.originalname}`;
    const result = await minioStorage.uploadFile(
      'gallery-images',
      fileName,
      file.buffer,
      file.mimetype
    );
    if (result) uploadedUrls.push(result.url);
  }

  res.json({ urls: uploadedUrls });
});
```

**After:**
```typescript
import { uploadMultipleFiles } from './upload-service';

app.post('/api/gallery/bulk-upload', upload.array('images', 10), async (req, res) => {
  const files = req.files as Express.Multer.File[];
  
  if (!files || files.length === 0) {
    return res.status(400).json({ message: 'No files provided' });
  }

  const { category } = req.body;

  // Upload all files with organized paths
  const results = await uploadMultipleFiles(files, {
    uploadType: 'gallery',
    category,
    maxSizeMB: 5,
  });

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  res.json({
    uploaded: successful.length,
    failed: failed.length,
    urls: successful.map(r => r.url),
    errors: failed.map(r => r.error),
  });
});
```

## Key Differences

| Aspect | Old System | New System |
|--------|-----------|------------|
| Path Structure | Flat, unorganized | Hierarchical, organized |
| Filename Generation | Manual `Date.now()` | Automatic with hash |
| File Validation | Manual checks | Built-in validation |
| Error Handling | Basic | Comprehensive with details |
| Cleanup Support | Manual deletion | Helper functions |
| Organization | None | Date/category/user-based |
| Scalability | Poor (one big folder) | Excellent (distributed) |
| Maintenance | Difficult | Easy with utilities |

## Benefits of New System

1. **Automatic Organization**: Files are automatically organized by date, user, class, subject, etc.
2. **Better Performance**: Distributed folder structure prevents large directory listings
3. **Easy Cleanup**: Date-based paths enable automated cleanup policies
4. **User Isolation**: Profile images are isolated per user for GDPR compliance
5. **Validation Built-in**: File size and type validation included
6. **Error Handling**: Comprehensive error messages
7. **Maintenance Tools**: Built-in utilities for auditing, cleanup, and verification

## Migration Checklist

- [ ] Import new upload service: `import { uploadFileToStorage } from './upload-service';`
- [ ] Replace direct MinIO calls with `uploadFileToStorage()`
- [ ] Add appropriate `uploadType` parameter
- [ ] Add required context (`userId`, `classId`, `subjectId`, etc.)
- [ ] Add optional `category` for better organization
- [ ] Set appropriate `maxSizeMB` limit
- [ ] Use `replaceFile()` when updating existing files
- [ ] Update database schema to store both `url` and `path` if needed
- [ ] Test upload, download, and delete functionality
- [ ] Run cleanup utilities to remove orphaned files

## Next Steps

1. Update one route at a time
2. Test thoroughly before moving to next route
3. Run `auditBucket()` to verify organization
4. Set up periodic cleanup jobs for old files
5. Monitor storage stats with `getStorageStats()`
