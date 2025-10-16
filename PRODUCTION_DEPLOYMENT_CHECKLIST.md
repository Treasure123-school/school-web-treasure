# Production Deployment Quick Reference Checklist

## ✅ Pre-Deployment Checklist

### Code Changes (Already Applied ✅)
- [x] Fixed `vite.config.ts` - conditionally import Replit plugins only in development
- [x] Fixed `server/supabase-storage.ts` - lazy initialization of Supabase client at runtime
- [x] Updated `render.yaml` - corrected environment variable names
- [x] Updated `server/routes.ts` - changed `isSupabaseStorageEnabled` to function call

---

## 🔧 Render Backend Configuration

### Environment Variables (Set These)

**⚠️ IMPORTANT: Get these values from the attached file the user provided**

```bash
# Database (from Supabase Dashboard or attached file)
DATABASE_URL=postgresql://postgres.xxxxx:xxxxx@aws-1-us-east-1.pooler.supabase.com:6543/postgres

# URLs
BACKEND_URL=https://treasure-home-backend.onrender.com
FRONTEND_URL=https://treasurehomeschool.vercel.app
NODE_ENV=production

# Authentication (use values from attached file or generate new secure random strings)
JWT_SECRET=<your-jwt-secret-from-attached-file>
SESSION_SECRET=<your-session-secret-from-attached-file>

# Google OAuth (from Google Cloud Console or attached file)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://treasure-home-backend.onrender.com/api/auth/google/callback

# Supabase Storage (CRITICAL FOR IMAGE UPLOADS - from Supabase Dashboard or attached file)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=<your-supabase-service-role-key>
```

**📝 Note:** Refer to the environment file you provided (`treasure-home-backend.env`) for the actual secret values.

### Verify Build Settings
- Build Command: `npm install --include=dev && npm run build` ✅
- Start Command: `npm run start` ✅
- Health Check Path: `/api/health` ✅

---

## 🌐 Vercel Frontend Configuration

### Environment Variables (Set This)
```bash
VITE_API_URL=https://treasure-home-backend.onrender.com
```

### Build Settings
- Framework Preset: **Vite**
- Build Command: `vite build` (default) ✅
- Output Directory: `dist/public` ✅

---

## 🔑 Google Cloud Console

### Update OAuth 2.0 Client
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select OAuth 2.0 Client ID

#### Authorized Redirect URIs:
```
https://treasure-home-backend.onrender.com/api/auth/google/callback
http://localhost:5000/api/auth/google/callback
```

#### Authorized JavaScript Origins:
```
https://treasurehomeschool.vercel.app
https://treasure-home-backend.onrender.com
http://localhost:5000
```

3. **Save** and wait 5-10 minutes for changes to propagate

---

## 👥 User Access Management

### Why Only One Email Works in Production

**Issue:** Google OAuth validates users against database records. Only `treasurehomeschool@gmail.com` works because:
1. It exists in the production database
2. Has `status = 'active'`
3. Has proper role assignment

### To Allow Other Users to Sign In

**Option 1: Add User to Database (Recommended)**
1. Go to Supabase Dashboard
2. Navigate to Table Editor → `users` table
3. Insert new user record:
   ```sql
   email: newteacher@example.com
   first_name: FirstName
   last_name: LastName
   role_id: <teacher or admin role id>
   status: active
   google_id: null (will be set on first login)
   ```

**Option 2: Query to Add User**
```sql
INSERT INTO users (email, first_name, last_name, role_id, status)
VALUES ('newteacher@example.com', 'First', 'Last', <role_id>, 'active');
```

**Find Role IDs:**
```sql
SELECT id, name FROM roles;
```

---

## 🚀 Deployment Order

### Step 1: Deploy Backend
1. ✅ Ensure all environment variables are set in Render
2. Push code changes to Git
3. Trigger Render deployment
4. Monitor build logs for success
5. Verify: `https://treasure-home-backend.onrender.com/api/health`

### Step 2: Deploy Frontend  
1. ✅ Set `VITE_API_URL` in Vercel
2. Trigger Vercel deployment
3. Wait for build completion
4. Verify: `https://treasurehomeschool.vercel.app`

### Step 3: Test Everything
- [ ] Homepage loads correctly
- [ ] Google OAuth login works (approved users)
- [ ] Admin dashboard accessible
- [ ] Image upload works and persists
- [ ] Hero section shows correct image

---

## 🔍 Quick Verification Tests

### Backend Health
```bash
curl https://treasure-home-backend.onrender.com/api/health
# Expected: {"status":"ok"}
```

### Supabase Storage Initialized
Check Render logs for:
```
✅ Supabase Storage client initialized
✅ Supabase Storage initialization complete
```

### Frontend API Connection
1. Open: https://treasurehomeschool.vercel.app
2. Open Browser DevTools → Network tab
3. Refresh page
4. Verify API calls go to: `treasure-home-backend.onrender.com`

---

## 🐛 Common Issues & Quick Fixes

### Build Fails on Render
**Error:** `Cannot find module '@replit/vite-plugin-runtime-error-modal'`
**Fix:** Ensure latest `vite.config.ts` is pushed to Git ✅

### Images Don't Persist
**Error:** Uploaded images disappear after deployment
**Fix:** 
1. Verify `SUPABASE_URL` is set
2. Verify `SUPABASE_SERVICE_KEY` is set (service_role key, not anon key)
3. Check Render logs for: `✅ Supabase Storage client initialized`

### Google OAuth Fails
**Error:** "Access denied" or "Pending approval"
**Fix:**
1. Add user to database with `status='active'`
2. Verify Google Console redirect URIs are correct
3. Wait 10 minutes after Google Console changes

### Frontend Can't Connect
**Error:** CORS or network errors in browser console
**Fix:**
1. Set `VITE_API_URL` in Vercel
2. Redeploy frontend
3. Hard refresh browser (Ctrl+Shift+R)

---

## ✅ Success Checklist

After deployment, verify all items:

- [ ] Backend builds successfully on Render
- [ ] Backend health endpoint returns `{"status":"ok"}`
- [ ] Render logs show: `✅ Supabase Storage client initialized`
- [ ] Frontend deploys successfully on Vercel
- [ ] Homepage loads without errors
- [ ] No CORS errors in browser console
- [ ] Google OAuth works for `treasurehomeschool@gmail.com`
- [ ] Admin can upload images through dashboard
- [ ] Uploaded images persist after page refresh
- [ ] Hero section image matches admin dashboard setting

---

## 📞 Need Help?

Refer to: `PRODUCTION_FIXES_COMPLETE.md` for detailed explanations and troubleshooting.

**Critical Files Changed:**
- `vite.config.ts` - Fixed plugin loading
- `server/supabase-storage.ts` - Fixed runtime initialization
- `server/routes.ts` - Updated function calls
- `render.yaml` - Fixed environment variable names
