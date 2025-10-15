# 🚨 Production Issues & Solutions

## Problem Summary

Your school management system works perfectly in **Replit Development** but has issues in **Production** (Vercel frontend + Render backend):

1. ✅ **Google OAuth** - FIXED
2. ⚠️ **Authentication not persisting** - NEEDS ENV VARS
3. 🚨 **File uploads disappear** - CRITICAL ISSUE (explained below)

---

## Issue 1: Google OAuth ✅ FIXED

### Problem
Error: `"Unknown authentication strategy 'google'"`

### Solution
✅ **Already Fixed** - Google OAuth is now enabled. The workflow was restarted to load the environment variables.

### Verification
Check your Replit logs - you should see:
```
✅ Google OAuth authentication enabled
```

---

## Issue 2: Authentication Works in Dev but Not Production ⚠️

### Problem
- Login works in Replit development
- Login fails or doesn't persist in production (Vercel + Render)

### Root Cause
Missing environment variables in production. Your production backend and frontend don't have the necessary configuration.

### Solution

#### Step 1: Set Render Backend Environment Variables

Go to **Render Dashboard** → Your Service → **Environment**

Add these variables:

```bash
# CRITICAL - Must be set
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
DATABASE_URL=<your-supabase-connection-string>

# CRITICAL - Session Security (generate random 64-char strings)
SESSION_SECRET=<generate-random-secret>
JWT_SECRET=<generate-random-secret>

# Generate secrets using:
# openssl rand -base64 48
# OR
# node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Google OAuth (copy from Replit Secrets)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback

# Supabase (for file uploads - CRITICAL for images)
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>
```

#### Step 2: Set Vercel Frontend Environment Variables

Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**

Add this variable:

```bash
VITE_API_URL=https://your-backend.onrender.com
```

**Important:** After adding, redeploy Vercel:
```bash
vercel --prod
```

#### Step 3: Update Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client
3. Add to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   https://your-backend.onrender.com
   ```
4. Add to **Authorized redirect URIs**:
   ```
   https://your-backend.onrender.com/api/auth/google/callback
   ```
5. Save and wait 5-10 minutes for changes to propagate

---

## Issue 3: File Uploads Disappear in Production 🚨 CRITICAL

### Problem
- Images upload successfully in Replit development
- Admin dashboard updates (hero images, gallery) work in Replit
- **BUT in production (Render)**: Images disappear after deployment/restart
- Users see broken images or missing content

### Root Cause

**Render uses ephemeral filesystem** - This means:
- Files stored locally are **wiped on every restart/deployment**
- The `uploads/` directory doesn't persist
- Each container has its own filesystem (no sharing)

**Your current code stores files locally:**
```javascript
// This works in Replit but FAILS in production
const storage = multer.diskStorage({
  destination: 'uploads/homepage',  // ❌ Local filesystem
  filename: (req, file, cb) => { ... }
});
```

### Solution: Use Supabase Storage

You're already using Supabase for your database. Use Supabase Storage for files too!

#### Why Supabase Storage?
- ✅ **Persistent** - Files never disappear
- ✅ **Already have Supabase** - No new service needed
- ✅ **Free tier** - 1GB storage included
- ✅ **CDN** - Fast image delivery worldwide
- ✅ **Automatic backups** - Files are safe

---

## Next Steps to Fix File Uploads

### Option 1: I Can Implement Supabase Storage for You

I can integrate Supabase Storage into your application:

1. **Install Supabase client library**
2. **Create storage buckets** (homepage, gallery, profiles, etc.)
3. **Update upload routes** to use Supabase Storage
4. **Update delete routes** to remove from Supabase
5. **Update image URLs** to use Supabase CDN
6. **Test in development** before deploying

**Estimated time:** 15-20 minutes

**What you need:**
- Your Supabase Project URL
- Your Supabase Service Role Key (found in Supabase Dashboard → Settings → API)

Would you like me to implement this? Just say "Yes, integrate Supabase Storage" and I'll get started.

### Option 2: Temporary Workaround (Not Recommended)

You could use a different cloud storage service:
- AWS S3
- Cloudinary
- Google Cloud Storage

But Supabase Storage is the best fit since you're already using Supabase.

---

## How to Get Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Service Role Key** (secret key, starts with `eyJ...`)

⚠️ **Never commit these keys to GitHub!** Always use environment variables.

---

## Why Things Work in Replit but Not Production

| Feature | Replit Development | Production (Render) |
|---------|-------------------|---------------------|
| **Filesystem** | Persistent local storage | Ephemeral (wiped on restart) |
| **Database** | Supabase dev database | Supabase production database |
| **Environment** | Auto-loaded from Replit Secrets | Must manually set in Render |
| **CORS** | Same origin (localhost:5000) | Cross-domain (Vercel ↔ Render) |
| **Sessions** | Same domain cookies | Cross-domain requires SameSite=none |

---

## Summary of Required Actions

### ✅ Already Done
- [x] Google OAuth enabled in Replit

### ⚠️ You Must Do
- [ ] Set all environment variables in Render
- [ ] Set VITE_API_URL in Vercel
- [ ] Update Google OAuth redirect URIs
- [ ] Decide on file storage solution

### 🚨 Critical (Choose One)
- [ ] **Option A:** Let me integrate Supabase Storage (recommended)
- [ ] **Option B:** Use a different cloud storage service

---

## Testing Production Deployment

Once environment variables are set, test:

1. **Backend Health:**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend:**
   - Open `https://your-app.vercel.app`
   - Open DevTools (F12) → Network tab
   - Verify API calls go to your Render backend
   - No CORS errors should appear

3. **Authentication:**
   - Try username/password login
   - Try Google Sign-In
   - Refresh page - you should stay logged in

4. **File Uploads (after Supabase Storage integration):**
   - Upload hero image in admin dashboard
   - Refresh page - image should still be there
   - Redeploy Render - image should persist

---

## Need Help?

Just reply with:
- "Set up Supabase Storage" - I'll integrate it for you
- "I have my Supabase keys" - Share them (as Replit Secrets, never in chat)
- "Show me existing docs" - I'll point you to the other guides

The existing documentation is in:
- `PRODUCTION_FIX_SUMMARY.md`
- `RENDER_VERCEL_DEPLOYMENT_GUIDE.md`

---

**Status:** Google OAuth ✅ Fixed | Environment Variables ⚠️ Needs Setup | File Storage 🚨 Critical Issue
