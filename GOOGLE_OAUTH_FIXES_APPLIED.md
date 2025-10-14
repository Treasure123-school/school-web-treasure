# Google OAuth Login Fixes - Root Causes & Solutions

## Summary
Fixed **3 critical bugs** preventing Google OAuth from working in production (Render + Vercel + Supabase).

---

## 🔴 Root Causes Identified

### Bug #1: CORS Configuration - Operator Precedence Error
**File:** `server/index.ts` (Line 21-23)

**Problem:**
```typescript
// BROKEN - Always uses development array in production!
origin: process.env.FRONTEND_URL || process.env.NODE_ENV === 'development' 
  ? ['http://localhost:5173', 'http://localhost:5000', /\.vercel\.app$/]
  : /\.vercel\.app$/,
```

**Impact:** When `FRONTEND_URL` is set (production), the boolean expression evaluates incorrectly due to operator precedence. The truthy string causes CORS to use localhost URLs instead of your Vercel domain, **blocking all OAuth requests**.

**Fix Applied:**
```typescript
// FIXED - Correctly branches on NODE_ENV
origin: process.env.NODE_ENV === 'development'
  ? ['http://localhost:5173', 'http://localhost:5000', /\.vercel\.app$/]
  : [process.env.FRONTEND_URL, /\.vercel\.app$/].filter(Boolean),
```

---

### Bug #2: Frontend API Call - Relative URL in Production
**File:** `client/src/pages/Login.tsx` (Line 142)

**Problem:**
```typescript
// BROKEN - Hits Vercel instead of Render backend!
const response = await fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Impact:** In production (Vercel), this relative URL tries to hit Vercel's server instead of your Render backend API. OAuth token validation fails because Vercel has no `/api/auth/me` endpoint.

**Fix Applied:**
```typescript
// FIXED - Uses correct backend URL in production
const response = await fetch(getApiUrl('/api/auth/me'), {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

### Bug #3: Backend Redirect - Empty Frontend URL
**File:** `server/routes.ts` (Line 2336)

**Problem:**
```typescript
// BROKEN - Empty string causes invalid redirects!
const frontendUrl = process.env.FRONTEND_URL || '';
```

**Impact:** If `FRONTEND_URL` is not set, redirects become relative paths like `/login?error=...`, keeping users on the backend domain instead of redirecting to the Vercel frontend.

**Fix Applied:**
```typescript
// FIXED - Safe fallback ensures redirect works
const frontendUrl = process.env.FRONTEND_URL || 'https://treasurehomeschool.vercel.app';
```

---

## 🚨 Additional Issue Discovered

### Widespread Fetch API Issue (14+ Files)
**Severity:** Critical for Production

**Files Affected:**
- `AdminRecoveryTools.tsx`
- `ProfileOnboarding.tsx`
- `StudentRegistration.tsx`
- `AdminDashboard.tsx`
- `Gallery.tsx`
- `HomepageManagement.tsx`
- And 8 more files...

**Problem:** These files use `fetch('/api/...')` with relative URLs instead of `getApiUrl('/api/...')`.

**Impact:** In production (Vercel), these API calls will fail because they hit Vercel instead of your Render backend.

**Recommended Fix:** Update all fetch calls to use `getApiUrl()` helper function. This is a broader refactoring that should be done separately.

---

## ✅ Deployment Checklist

### 1. **Push Code to Git**
```bash
git add .
git commit -m "Fix: Google OAuth - CORS config, frontend API calls, and redirect URLs"
git push origin main
```

### 2. **Verify Render Environment Variables**
Ensure these are set in your Render dashboard:

| Variable | Example Value | Required |
|----------|---------------|----------|
| `GOOGLE_CLIENT_ID` | `123456789...` | ✅ Yes |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | ✅ Yes |
| `FRONTEND_URL` | `https://treasurehomeschool.vercel.app` | ✅ Yes |
| `BACKEND_URL` | `https://treasure-home-backend.onrender.com` | ✅ Yes |
| `NODE_ENV` | `production` | ✅ Yes |
| `DATABASE_URL` | `postgresql://...` | ✅ Yes |
| `JWT_SECRET` | `your_secret_key` | ✅ Yes |

### 3. **Verify Vercel Environment Variables**
Ensure this is set in your Vercel dashboard:

| Variable | Example Value | Required |
|----------|---------------|----------|
| `VITE_API_URL` | `https://treasure-home-backend.onrender.com` | ✅ Yes |

**Important:** After adding/changing Vercel env vars, you must **redeploy** for changes to take effect.

### 4. **Verify Google Cloud Console**
Authorized redirect URI must include:
```
https://treasure-home-backend.onrender.com/api/auth/google/callback
```

### 5. **Test OAuth Flow**
1. Go to your Vercel frontend: `https://treasurehomeschool.vercel.app/login`
2. Click "Sign in with Google"
3. Complete Google authentication
4. Verify you're redirected back to Vercel with successful login

---

## 🔍 Debugging Tips

If OAuth still fails after deployment:

1. **Check Render Logs:**
   ```
   Look for: "❌ Google OAuth error:" or "📧 Google OAuth callback received:"
   ```

2. **Check Browser Console:**
   ```
   Look for CORS errors or failed fetch requests
   ```

3. **Verify Environment Variables:**
   ```bash
   # In Render dashboard, check all env vars are set correctly
   # In Vercel dashboard, check VITE_API_URL is set
   ```

4. **Test Backend Directly:**
   ```
   https://treasure-home-backend.onrender.com/api/auth/google
   Should redirect to Google login page
   ```

---

## 📝 Notes

- All fixes have been applied to the Replit development environment
- You must deploy these changes to Render and Vercel for production to work
- The CORS fix is critical - without it, OAuth will always fail in production
- Consider fixing the 14+ files with fetch API issues as a follow-up task

---

## 🎯 Expected Outcome

After deploying these fixes:
1. ✅ Google OAuth button will redirect to Google login
2. ✅ After Google authentication, user will be redirected back to Vercel frontend
3. ✅ Login will complete successfully and user will access their dashboard
4. ✅ No "Unable to complete Google sign-in" errors
