# 📸 Image Upload Storage Locations Guide

## 📁 Folder Structure

Your application stores all uploaded images in the `uploads/` folder. Here's the complete organized structure:

```
workspace/
└── uploads/                          ← Root upload directory (where all images are stored)
    ├── profiles/                     ← User profile images & signatures
    │   ├── {userId}/                 ← Each user gets their own subfolder
    │   │   ├── 1702315400000_photo.jpg
    │   │   ├── 1702315401000_signature.png
    │   │   └── ...
    │   └── {userId}/
    │
    ├── homepage/                     ← Homepage/website content images
    │   ├── banner/
    │   │   ├── 1702315500000_banner.jpg
    │   │   └── ...
    │   ├── slider/
    │   │   ├── 1702315501000_slide.jpg
    │   │   └── ...
    │   └── other/
    │
    ├── gallery/                      ← School/gallery images
    │   ├── {categoryId}/
    │   │   ├── 1702315600000_photo.jpg
    │   │   └── ...
    │
    ├── study-resources/              ← Educational/study materials
    │   ├── {subjectId}/
    │   │   ├── 1702315700000_resource.pdf
    │   │   └── ...
    │
    └── general/                      ← General/miscellaneous files
        ├── 1702315800000_file.jpg
        └── ...
```

---

## 🎯 Which Upload Endpoints Store Images Where?

### 1. **Profile Images** 
- **Folder:** `uploads/profiles/{userId}/`
- **API Endpoint:** `POST /api/upload`
- **When Used:** When users upload their profile picture
- **Example:** 
  - User ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
  - File: `uploads/profiles/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1702315400000_profile.jpg`

**Code:**
```typescript
// From server/routes.ts - Profile image upload
router.post("/api/upload", authenticateUser, uploadMiddleware.single("file"), async (req, res) => {
  const response = await uploadFileToStorage(req.file, {
    uploadType: 'profile',
    userId: req.user?.id  // ← Creates user-specific subfolder
  });
  // Image stored in: uploads/profiles/{userId}/
});
```

---

### 2. **Homepage Images**
- **Folder:** `uploads/homepage/{category}/`
- **API Endpoint:** `POST /api/upload/homepage`
- **When Used:** When uploading banner, slider, or homepage content
- **Example:** 
  - Category: `banner`
  - File: `uploads/homepage/banner/1702315500000_banner.jpg`

**Code:**
```typescript
// From server/routes.ts - Homepage image upload
router.post("/api/upload/homepage", authenticateUser, uploadMiddleware.single("file"), async (req, res) => {
  const response = await uploadFileToStorage(req.file, {
    uploadType: 'homepage',
    category: req.body.category  // ← Creates category subfolder
  });
  // Image stored in: uploads/homepage/{category}/
});
```

---

### 3. **Teacher Profile & Signatures**
- **Folder:** `uploads/profiles/{teacherId}/`
- **API Endpoints:** 
  - `POST /api/teacher/profile/setup` - Initial setup with signature
  - `PATCH /api/teacher/profile/me` - Profile updates
- **When Used:** When teachers upload profile photo and signature during setup
- **Example:**
  - Teacher ID: `b2c3d4e5-f6a7-8901-bcde-f12345678901`
  - Files stored:
    - `uploads/profiles/b2c3d4e5-f6a7-8901-bcde-f12345678901/1702315401000_signature.png`
    - `uploads/profiles/b2c3d4e5-f6a7-8901-bcde-f12345678901/1702315402000_profile.jpg`

---

### 4. **Gallery/School Images**
- **Folder:** `uploads/gallery/{categoryId}/`
- **API Endpoint:** `POST /api/gallery` (assumed from schema)
- **When Used:** When uploading photos for school gallery/events
- **Example:**
  - Category ID: `5` (e.g., "Sports Day")
  - File: `uploads/gallery/5/1702315600000_sports_photo.jpg`

---

### 5. **Study Resources**
- **Folder:** `uploads/study-resources/{subjectId}/`
- **API Endpoint:** `POST /api/study-resources` (assumed from schema)
- **When Used:** When teachers upload study materials, PDFs, notes
- **Example:**
  - Subject ID: `12` (e.g., "Mathematics")
  - File: `uploads/study-resources/12/1702315700000_algebra_notes.pdf`

---

### 6. **General/Miscellaneous Files**
- **Folder:** `uploads/general/`
- **API Endpoint:** Various endpoints
- **When Used:** For files that don't fit other categories
- **Example:**
  - File: `uploads/general/1702315800000_document.pdf`

---

## 🔍 How to Access These Folders

### From Replit File Explorer
1. Open your Replit workspace
2. Look in the file tree on the left sidebar
3. You should see an `uploads/` folder in the root
4. Navigate to any subfolder to see your images:
   ```
   uploads/
   ├── profiles/
   ├── homepage/
   ├── gallery/
   ├── study-resources/
   └── general/
   ```

### From Terminal
```bash
# View all uploaded files
ls -R uploads/

# View profile images
ls uploads/profiles/

# View homepage images
ls uploads/homepage/

# View a specific user's files
ls uploads/profiles/{userId}/

# Count all uploaded images
find uploads/ -type f | wc -l
```

---

## 📊 Real-World Examples

### Example 1: User Uploads Profile Picture

**What happens:**
```
User ID: "550e8400-e29b-41d4-a716-446655440000"
Uploads: profile_photo.jpg
↓
API Endpoint: POST /api/upload
Upload Type: 'profile'
↓
Stored at: uploads/profiles/550e8400-e29b-41d4-a716-446655440000/1702315400000_profile_photo.jpg
↓
URL returned: /uploads/profiles/550e8400-e29b-41d4-a716-446655440000/1702315400000_profile_photo.jpg
```

### Example 2: Teacher Uploads Signature During Setup

**What happens:**
```
Teacher ID: "660e8400-e29b-41d4-a716-446655440001"
Uploads: signature.png
↓
API Endpoint: POST /api/teacher/profile/setup
Upload Type: 'profile'
↓
Stored at: uploads/profiles/660e8400-e29b-41d4-a716-446655440001/1702315401000_signature.png
↓
URL returned: /uploads/profiles/660e8400-e29b-41d4-a716-446655440001/1702315401000_signature.png
```

### Example 3: Upload Homepage Banner

**What happens:**
```
Uploads: banner_2024.jpg
Category: "banner"
↓
API Endpoint: POST /api/upload/homepage
Upload Type: 'homepage'
↓
Stored at: uploads/homepage/banner/1702315500000_banner_2024.jpg
↓
URL returned: /uploads/homepage/banner/1702315500000_banner_2024.jpg
```

---

## 🗂️ Folder Organization Benefits

Your organized folder structure provides:

| Benefit | How It Helps |
|---------|-------------|
| **Easy Location** | Find any image quickly by knowing its type (profile, homepage, etc.) |
| **User-Based Separation** | Each user's files in their own subfolder = easy to delete/manage per user |
| **Category-Based** | Homepage images grouped by category (banner, slider) |
| **Scalable** | As your app grows, folder structure stays organized |
| **Backup Friendly** | Easy to backup specific types of files |
| **Cloud Ready** | Same structure works with MinIO or other cloud storage |

---

## 💾 File Naming Convention

All files use a timestamp prefix for uniqueness:

```
{timestamp}_{originalFilename}
↓
1702315400000_profile.jpg
↑ Unix timestamp (milliseconds)
   = Ensures no file overwrites
   = Easy to sort by upload time
```

**Example:**
- `1702315400000_photo.jpg` - uploaded at timestamp 1702315400000
- `1702315401000_signature.png` - uploaded 1 second later
- Never conflicts even if two users upload files with same name!

---

## 🔗 How to Display Images in Your Frontend

### Using the stored path in your web application:

```javascript
// Frontend code to display image
const imageUrl = response.url;  // e.g., "/uploads/profiles/userId/1702315400000_photo.jpg"

// In React:
<img src={imageUrl} alt="Profile" />

// The backend serves these automatically from the uploads folder
```

---

## ⚙️ Configuration

Your current storage configuration (from `.env`):

```bash
STORAGE_MODE=disk              # Using FREE disk storage
UPLOAD_DIR=uploads             # Root upload directory
```

All files are stored **locally** on your Replit workspace under the `uploads/` folder.

---

## 🚀 When You Upgrade to Cloud Storage

When you're ready to upgrade to cloud storage (MinIO, Cloudflare R2, etc.):

**Same folder structure applies!** Files will be stored:
```
Cloud Storage Bucket:
└── profiles/
    ├── {userId}/
    └── {userId}/

└── homepage/
    ├── banner/
    └── ...

└── gallery/
└── study-resources/
└── general/
```

**No code changes needed!** Your application automatically handles both disk and cloud storage.

---

## 📌 Quick Reference

| Upload Type | Folder | API Endpoint | Purpose |
|------------|--------|--------------|---------|
| **Profile** | `uploads/profiles/{userId}/` | `POST /api/upload` | User profile pictures & signatures |
| **Homepage** | `uploads/homepage/{category}/` | `POST /api/upload/homepage` | Banner, slider, website content |
| **Gallery** | `uploads/gallery/{categoryId}/` | `POST /api/gallery` | School photos & events |
| **Study Resources** | `uploads/study-resources/{subjectId}/` | `POST /api/study-resources` | Educational materials |
| **General** | `uploads/general/` | Various | Miscellaneous files |

---

## ✅ Summary

**Your images are stored in:**
- **Root folder:** `uploads/` (at the top level of your Replit workspace)
- **Organized by type:** `profiles/`, `homepage/`, `gallery/`, `study-resources/`, `general/`
- **Access:** Open Replit file explorer → click `uploads/` folder
- **Files named:** `{timestamp}_{originalName}` to avoid conflicts
- **Accessible via:** URLs like `/uploads/profiles/{userId}/{filename}`

Everything is organized and easy to locate! 🎉
