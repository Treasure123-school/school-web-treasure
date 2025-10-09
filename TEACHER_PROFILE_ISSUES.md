
# Teacher Profile System - Current Issues & Root Causes

**Generated:** January 2025  
**Status:** Critical bugs preventing profile creation and data display

---

## 🔴 CRITICAL ISSUES

### 1. Database Schema Missing Columns
**Status:** BLOCKING profile creation  
**Root Cause:** Required columns don't exist in `users` table

**Missing Columns:**
- `national_id` (VARCHAR)
- `profile_image_url` (TEXT)
- `recovery_email` (VARCHAR)

**Impact:**
- Profile creation fails with database constraint errors
- Backend tries to insert data into non-existent columns
- Teacher setup process crashes

**Evidence:**
```
Database query failed: column "national_id" does not exist
Database query failed: column "profile_image_url" does not exist
```

**Files Affected:**
- Database schema: `migrations/0014_add_missing_user_columns.sql` (created but not applied)
- Backend: `server/routes.ts` (lines 914-1027)
- Frontend: `client/src/pages/portal/TeacherProfileSetup.tsx`

---

### 2. Migration Not Applied to Database
**Status:** CRITICAL  
**Root Cause:** Migration file exists but hasn't been executed against database

**Problem:**
- File `migrations/0014_add_missing_user_columns.sql` was created
- Contains correct SQL to add missing columns
- Never run against the actual database
- Shell commands to apply migration may have failed silently

**Required Action:**
```sql
-- Must be executed manually
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
```

---

### 3. Profile Data Not Fetching Correctly
**Status:** HIGH PRIORITY  
**Root Cause:** API endpoint returns incomplete data structure

**Problem:**
- `/api/teacher/profile/me` endpoint exists
- Returns user data but missing profile-specific fields
- Frontend expects `nationalId` and `profileImageUrl` from `teacherProfile` object
- Backend not joining `users` table with `teacher_profiles` table properly

**Expected Response:**
```json
{
  "id": "uuid",
  "nationalId": "12345678901",
  "profileImageUrl": "/uploads/profiles/image.jpg",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Actual Response:**
```json
{
  "id": "uuid",
  "firstName": "John",
  "lastName": "Doe"
  // nationalId and profileImageUrl missing
}
```

**Files Affected:**
- `server/routes.ts` (lines 1310-1360) - GET `/api/teacher/profile/me`
- `client/src/pages/portal/TeacherProfile.tsx` (lines 39-40, 127-128)

---

### 4. Cache Update Race Condition
**Status:** MEDIUM PRIORITY  
**Root Cause:** Profile query cache not updated before navigation

**Problem:**
1. Teacher submits profile successfully
2. Backend creates profile in database
3. Frontend invalidates query cache
4. Navigates to dashboard immediately
5. Dashboard loads before cache refresh completes
6. Old cache data shows `hasProfile: false`
7. Dashboard redirects back to setup page (infinite loop)

**Current Code (Wrong):**
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['/api/teacher/profile/me'] });
  navigate('/portal/teacher'); // Too fast!
}
```

**Required Fix:**
```typescript
onSuccess: (data) => {
  // Update cache immediately
  queryClient.setQueryData(['/api/teacher/profile/me'], {
    ...data,
    hasProfile: true
  });
  
  // Then navigate
  setTimeout(() => navigate('/portal/teacher'), 2000);
}
```

**Files Affected:**
- `client/src/pages/portal/TeacherProfileSetup.tsx` (lines 162-170)

---

### 5. Empty String vs NULL Handling
**Status:** MEDIUM PRIORITY  
**Root Cause:** Backend expects NULL but receives empty string ""

**Problem:**
- Frontend sends `staffId: ""` when field is empty
- PostgreSQL unique constraint fails on multiple empty strings
- Should send `undefined` or `null` instead
- Backend doesn't validate/convert empty strings to NULL

**Current Code:**
```typescript
submitData.append('staffId', formData.staffId || ''); // ❌ Wrong
```

**Required Fix:**
```typescript
if (formData.staffId && formData.staffId.trim() !== '') {
  submitData.append('staffId', formData.staffId.trim());
}
// Don't append if empty - backend will handle NULL
```

**Files Affected:**
- `client/src/pages/portal/TeacherProfileSetup.tsx` (line ~530)
- `server/routes.ts` (lines 914-940)

---

### 6. Profile Image Display Issues
**Status:** MEDIUM PRIORITY  
**Root Cause:** Multiple path/URL inconsistencies

**Problems:**
1. Image uploaded to `/uploads/profiles/` successfully
2. Database stores path as `/uploads/profiles/filename.jpg`
3. Frontend tries to display from `teacherProfile?.profileImageUrl`
4. But `teacherProfile` object doesn't have `profileImageUrl` field
5. Falls back to placeholder image

**Path Issues:**
- Upload: Saves to filesystem correctly
- Database: Stores path correctly in `users.profile_image_url`
- API: Doesn't return `profile_image_url` in response
- Frontend: Looks for wrong field name

**Files Affected:**
- `server/routes.ts` (line 1022) - stores `profileImageUrl` during creation
- `server/routes.ts` (line 1323) - doesn't include in profile response
- `client/src/pages/portal/TeacherProfile.tsx` (line 497) - tries to display

---

### 7. National ID (NIN) Display Issues  
**Status:** MEDIUM PRIORITY  
**Root Cause:** Same as Profile Image - field not in API response

**Problem:**
- NIN submitted successfully during profile creation
- Stored in database (when column exists)
- Not returned by `/api/teacher/profile/me` endpoint
- Frontend shows empty/undefined

**Files Affected:**
- Same as Profile Image issue above

---

## 📊 AFFECTED FEATURES

### Profile Creation Flow:
1. ❌ Form submission fails due to missing database columns
2. ❌ If it succeeds, data not stored in correct columns
3. ❌ Success message shows but profile incomplete

### Dashboard Display:
1. ❌ Profile image not shown (API doesn't return it)
2. ❌ National ID not shown (API doesn't return it)
3. ❌ Redirect loop (cache race condition)
4. ❌ Incomplete profile data displayed

---

## 🔧 REQUIRED FIXES (Priority Order)

### Fix 1: Apply Database Migration (CRITICAL)
**Action:** Execute migration against production database
```bash
psql $DATABASE_URL -f migrations/0014_add_missing_user_columns.sql
```

### Fix 2: Update API Response to Include All Fields
**File:** `server/routes.ts` (line ~1323)
```typescript
const completeProfile = {
  ...user,
  nationalId: user.nationalId || '',
  profileImageUrl: user.profileImageUrl || '',
  // ... other fields
};
```

### Fix 3: Fix Cache Update Before Navigation
**File:** `client/src/pages/portal/TeacherProfileSetup.tsx`
```typescript
onSuccess: (response) => {
  queryClient.setQueryData(['/api/teacher/profile/me'], {
    ...response,
    hasProfile: true,
    nationalId: formData.nationalId,
    profileImageUrl: response.profileImageUrl
  });
  
  setTimeout(() => navigate('/portal/teacher'), 2000);
}
```

### Fix 4: Fix Empty String Handling
**File:** `client/src/pages/portal/TeacherProfileSetup.tsx`
```typescript
if (formData.staffId?.trim()) {
  submitData.append('staffId', formData.staffId.trim());
}
```

---

## 🎯 SUCCESS CRITERIA

When all fixes are applied:
- ✅ Migration adds missing columns to `users` table
- ✅ Profile creation succeeds without database errors
- ✅ API returns all profile fields (nationalId, profileImageUrl)
- ✅ Dashboard displays profile image correctly
- ✅ Dashboard displays National ID correctly
- ✅ No redirect loop after profile creation
- ✅ Cache updates before navigation
- ✅ Empty staffId handled as NULL, not empty string

---

## 📝 VERIFICATION STEPS

1. **Check Database Schema:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('national_id', 'profile_image_url', 'recovery_email');
   ```

2. **Test Profile Creation:**
   - Create new teacher profile
   - Verify no database errors
   - Check success message appears

3. **Test Dashboard Display:**
   - Navigate to teacher dashboard
   - Verify profile image shows
   - Verify NIN shows
   - Verify no redirect loop

4. **Check API Response:**
   ```bash
   curl -H "Authorization: Bearer <token>" \
        http://localhost:5000/api/teacher/profile/me
   ```

---

**Document Version:** 1.0  
**Last Updated:** January 2025  
**Status:** Comprehensive issue documentation complete
