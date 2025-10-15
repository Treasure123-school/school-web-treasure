# Homepage Image Upload Fix - Complete Guide

## Issues Fixed ✅

### 1. **Upload Error Handling**
**Problem:** When image uploads failed, the server returned errors that weren't in JSON format, causing "Unexpected end of JSON input" errors in the browser.

**Solution:** Added dedicated multer error handling middleware that catches all upload-related errors and formats them as proper JSON responses with helpful error messages.

### 2. **Authentication Token Handling**
**Problem:** The upload form was sending malformed tokens (like "Bearer null" or "Bearer undefined") when the authentication token was missing or expired.

**Solution:** Added proper token validation that:
- Checks if a token exists before sending requests
- Shows clear authentication error messages
- Prevents sending malformed authorization headers

## How to Use the Homepage Image Upload Feature

### Step 1: Log in as Admin
1. Navigate to `/login` or click "Portal Login" in the navigation
2. Enter your admin credentials
3. You'll be redirected to the admin dashboard

### Step 2: Access Homepage Management
1. From the admin dashboard, navigate to **Homepage Management**
2. Or directly visit: `/portal/admin/homepage-management`

### Step 3: Upload a New Image
1. Click the **"Add Content"** button
2. Fill in the form:
   - **Content Type:** Choose from:
     - Hero Image (main homepage banner)
     - Gallery Preview 1, 2, 3
     - About Section
     - Featured Content
   - **Display Order:** Number to control ordering (0 = first)
   - **Image File:** Choose your image file
     - Supported formats: JPEG, JPG, PNG, GIF, WEBP
     - Maximum size: 5MB
   - **Alt Text:** Required for accessibility (describe the image)
   - **Caption:** Optional description text
3. Click **"Upload"** button
4. Wait for success confirmation

### Step 4: Manage Existing Images
- **Edit:** Click the edit icon to update alt text, caption, display order, or active status
- **Delete:** Click the trash icon to remove an image
- **Toggle Active/Inactive:** Use the switch when editing to show/hide content

## Error Messages You Might See

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Authentication required. Please log in again." | Your session expired or you're not logged in | Log in again with admin credentials |
| "File size exceeds the maximum allowed limit" | Image is larger than 5MB | Compress or resize your image |
| "Only image files are allowed!" | Wrong file type uploaded | Use JPEG, JPG, PNG, GIF, or WEBP |
| "Content type is required" | Didn't select a content type | Choose a content type from the dropdown |

## Testing the Fix

### Test Case 1: Valid Image Upload
1. Log in as admin
2. Go to Homepage Management
3. Upload a valid image (under 5MB, correct format)
4. ✅ Should see success message
5. ✅ Image should appear in the content list
6. ✅ Image should be visible on the homepage

### Test Case 2: File Too Large
1. Try to upload an image larger than 5MB
2. ✅ Should see clear error: "File size exceeds the maximum allowed limit"

### Test Case 3: Wrong File Type
1. Try to upload a PDF or other non-image file
2. ✅ Should see error: "Only image files are allowed!"

### Test Case 4: Missing Token
1. Clear your browser's localStorage or wait for token expiration
2. Try to upload an image
3. ✅ Should see error: "Authentication required. Please log in again."

## Technical Details

### Changes Made
1. **server/index.ts:** Added multer error handling middleware
2. **client/src/pages/portal/HomepageManagement.tsx:** 
   - Added token validation
   - Improved error handling for all mutations (upload, update, delete)
   - Added try-catch for JSON parsing failures

### Files Affected
- `server/index.ts` - Multer error middleware
- `client/src/pages/portal/HomepageManagement.tsx` - Token validation and error handling

## Next Steps

1. **Test the upload feature** with your admin account
2. **Upload a hero section image** to replace the current one
3. **Verify the image appears** on the homepage at `/`
4. **Report any issues** if you encounter them

---

**Note:** All error messages are now properly formatted as JSON, so you'll always see helpful error messages instead of parsing errors.
