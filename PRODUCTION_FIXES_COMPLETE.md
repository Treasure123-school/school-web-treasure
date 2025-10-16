# Production Deployment Fixes - Complete Guide

## 🔧 Critical Issues Fixed

### 1. **Render Build Failure - FIXED ✅**

**Problem:** Build was failing with error:
```
Cannot find module '@replit/vite-plugin-runtime-error-modal' 
imported from /opt/render/project/src/vite.config.ts
```

**Root Cause:** The plugin was imported unconditionally in `vite.config.ts` but was listed in `devDependencies`. During production builds, the module was imported before devDependencies were available.

**Solution Applied:**
- Modified `vite.config.ts` to conditionally import the plugin only in development:
```typescript
// OLD (broken):
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// NEW (fixed):
...(process.env.NODE_ENV !== "production"
  ? [(await import("@replit/vite-plugin-runtime-error-modal")).default()]
  : [])
```

---

### 2. **Image Upload Failures - FIXED ✅**

**Problem:** 
- Images uploaded through admin dashboard didn't persist in production
- Hero section image in production differed from development
- Uploaded files disappeared after each Render deployment

**Root Cause:** Supabase Storage client was being initialized at build time (when environment variables weren't available), causing it to fall back to local `/uploads` folder which resets on every Render deployment.

**Solution Applied:**
- Refactored `server/supabase-storage.ts` to use lazy initialization
- Supabase client now initializes at runtime when environment variables are available:

```typescript
// Lazy initialization - runs at runtime, not build time
function getSupabaseClient(): ReturnType<typeof createClient> | null {
  if (initializationAttempted) {
    return supabaseClient;
  }
  
  initializationAttempted = true;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  // ... initialization logic
}

export const supabase = { get: () => getSupabaseClient() };
```

**Updated All Usages:**
- Changed `if (isSupabaseStorageEnabled)` → `if (isSupabaseStorageEnabled())`
- Changed `supabase.storage` → `supabase.get().storage` throughout the codebase

---

### 3. **Google OAuth Restriction - REQUIRES MANUAL FIX ⚠️**

**Problem:** Only `treasurehomeschool@gmail.com` can sign in via Google OAuth in production. Other emails fail authentication.

**Root Cause:** The Google OAuth strategy in `server/google-auth.ts` validates users against:
1. Approved teacher list in database
2. User account status (active/pending/suspended)
3. Role-based authorization

**Why Development Works but Production Doesn't:**
- Development uses in-memory storage with seeded/approved users
- Production Supabase database doesn't have the same pre-approved users
- Only `treasurehomeschool@gmail.com` exists in production database with proper status

**REQUIRED ACTIONS FOR PRODUCTION:**

#### Option A: Approve Users in Database (Recommended)
For each authorized staff member, ensure they have:
1. An active user record in the `users` table
2. Correct role assignment (teacher/admin)
3. Account status = 'active'
4. For teachers: entry in approved teacher list OR set `requiresApproval: false`

```sql
-- Example: Approve a new teacher
INSERT INTO users (email, first_name, last_name, role_id, status, google_id)
VALUES ('newteacher@example.com', 'First', 'Last', <teacher_role_id>, 'active', NULL);
```

#### Option B: Modify OAuth Logic (Not Recommended)
If you want to auto-provision new users via Google OAuth:
1. Update `server/google-auth.ts` around lines 60-120
2. Change the approval logic to auto-activate users with specific email domains
3. Be cautious: This reduces security

#### Google Cloud Console Verification ✅
Ensure these are configured:
- **Authorized Redirect URIs:** 
  - `https://treasure-home-backend.onrender.com/api/auth/google/callback`
- **Authorized JavaScript Origins:**
  - `https://treasurehomeschool.vercel.app`
  - `https://treasure-home-backend.onrender.com`

---

## 📋 Complete Production Deployment Checklist

### Render Backend Setup

#### 1. Environment Variables (All Required)
```bash
# Database
DATABASE_URL=postgresql://postgres.xxx:password@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# URLs
BACKEND_URL=https://treasure-home-backend.onrender.com
FRONTEND_URL=https://treasurehomeschool.vercel.app

# Authentication
JWT_SECRET=<generate-secure-random-string>
SESSION_SECRET=<generate-secure-random-string>

# Google OAuth
GOOGLE_CLIENT_ID=578610661363-ev4igr5ufcd2d9i18g38kt158o54rvdr.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://treasure-home-backend.onrender.com/api/auth/google/callback

# Supabase Storage (CRITICAL)
SUPABASE_URL=https://vfqssftlihflcfhfzwkm.supabase.co
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>

# Node Environment
NODE_ENV=production
```

#### 2. Build Configuration
✅ **Already Configured in `render.yaml`:**
- Build Command: `npm install --include=dev && npm run build`
- Start Command: `npm run start`
- Health Check: `/api/health`

---

### Vercel Frontend Setup

#### 1. Environment Variables
```bash
# API Configuration (CRITICAL)
VITE_API_URL=https://treasure-home-backend.onrender.com

# OR (alternative naming)
VITE_API_BASE_URL=https://treasure-home-backend.onrender.com
```

#### 2. Build Configuration
- Framework Preset: Vite
- Build Command: `vite build` (default)
- Output Directory: `dist/public` (from vite.config.ts)
- Root Directory: Leave empty or `./`

---

### Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. **Authorized Redirect URIs:**
   ```
   https://treasure-home-backend.onrender.com/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback (for local dev)
   ```
4. **Authorized JavaScript Origins:**
   ```
   https://treasurehomeschool.vercel.app
   https://treasure-home-backend.onrender.com
   http://localhost:5000 (for local dev)
   ```
5. Save and wait 5-10 minutes for changes to propagate

---

### Supabase Configuration

#### 1. Storage Buckets (Auto-created by backend)
The backend automatically creates these buckets on startup:
- `homepage-images`
- `gallery-images`
- `profile-images`
- `study-resources`
- `general-uploads`

#### 2. Storage Policies
Ensure each bucket has public read access:
1. Go to Storage in Supabase Dashboard
2. For each bucket, set policy: **Public Access - Read Only**
3. Write access is controlled by backend service key

#### 3. Database Setup
Your PostgreSQL database should have:
- All tables migrated (runs automatically on backend start)
- Academic terms seeded (runs automatically)
- User roles created (runs automatically)

---

## 🚀 Deployment Steps (In Order)

### Step 1: Deploy Backend to Render
1. Push code changes to your Git repository
2. Render will auto-deploy (if enabled) or manually trigger deploy
3. **Wait for build to complete successfully**
4. Check logs for:
   ```
   ✅ Supabase Storage client initialized
   ✅ Supabase Storage initialization complete
   📱 Application name set: Supavisor
   serving on port 5000
   ```

### Step 2: Verify Backend
1. Visit: `https://treasure-home-backend.onrender.com/api/health`
2. Should return: `{"status":"ok"}`
3. Check: `https://treasure-home-backend.onrender.com/api/announcements`
4. Should return JSON array (may be empty)

### Step 3: Deploy Frontend to Vercel
1. Set `VITE_API_URL` environment variable
2. Trigger new deployment
3. Wait for build to complete

### Step 4: Test Full Flow
1. Visit: `https://treasurehomeschool.vercel.app`
2. Try Google OAuth login with approved account
3. Upload test image through admin dashboard
4. Verify image persists (check Supabase Storage bucket)
5. Refresh page - hero image should remain

---

## 🔍 Troubleshooting

### Build Still Fails on Render
**Check:**
- Ensure you've pushed the latest `vite.config.ts` changes
- Verify `NODE_ENV=production` is set in Render
- Check build logs for specific error

### Images Still Not Persisting
**Check:**
1. Render logs show: `✅ Supabase Storage client initialized`
2. If not, verify:
   - `SUPABASE_URL` is set correctly
   - `SUPABASE_SERVICE_KEY` is set correctly (service_role key, not anon key)
   - No typos in environment variable names

### Google OAuth Fails for New Users
**Check:**
1. User exists in database with `status='active'`
2. User has correct role assignment
3. For teachers: user is in approved teacher list OR approval is disabled
4. Google Cloud Console has correct redirect URIs
5. Wait 5-10 minutes after Google Console changes

### Frontend Can't Connect to Backend
**Check:**
1. `VITE_API_URL` is set in Vercel
2. Redeploy frontend after setting env var
3. Check browser console for CORS errors
4. Verify CORS origin in `server/index.ts` includes Vercel domain

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ Render build completes without errors
- ✅ Backend logs show Supabase Storage initialized
- ✅ No CORS errors in browser console
- ✅ Google OAuth works for approved users
- ✅ Images uploaded in admin dashboard persist after page refresh
- ✅ Hero section image matches what's set in admin dashboard
- ✅ Session persists across page refreshes
- ✅ API requests in Network tab show correct backend URL

---

## 📝 Important Notes

1. **Database Sharing:** Development and production both use the same Supabase database. Be careful with test data.

2. **Image Storage:** All images are stored in Supabase Storage buckets, not on Render's filesystem.

3. **User Management:** New Google OAuth users must be pre-approved in database OR you must modify the OAuth logic.

4. **Environment Variables:** Frontend and backend must have correct URLs pointing to each other.

5. **Cache:** If changes don't appear, try hard refresh (Ctrl+Shift+R) or clear browser cache.

---

## 🆘 Still Having Issues?

If problems persist after following this guide:

1. **Check All Logs:**
   - Render deployment logs
   - Render runtime logs  
   - Browser console
   - Browser Network tab

2. **Verify Environment Variables:**
   ```bash
   # In Render, check Settings > Environment
   # In Vercel, check Settings > Environment Variables
   ```

3. **Test Individually:**
   - Backend health endpoint
   - Frontend loads
   - API calls from frontend
   - Google OAuth flow
   - Image upload

4. **Common Mistakes:**
   - Typos in environment variable names
   - Wrong Supabase key (using anon key instead of service_role key)
   - Forgot to redeploy after changing env vars
   - Google Console changes not propagated yet (wait 10 minutes)
