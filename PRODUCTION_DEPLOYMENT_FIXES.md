# Production Deployment Issues & Fixes

## 🔍 Root Cause Analysis

After thorough investigation, the following issues were identified that prevent features from working in production (Vercel + Render) while they work fine in Replit development:

### **Issue 1: Missing VITE_API_URL Environment Variable in Vercel**
- **Problem**: Frontend builds without `VITE_API_URL` will use relative URLs which hit Vercel instead of Render backend
- **Impact**: All API calls fail silently or return 404/502 errors
- **Fix**: Add `VITE_API_URL=https://your-backend.onrender.com` in Vercel environment variables

### **Issue 2: Missing FRONTEND_URL in Render**
- **Problem**: CORS blocks requests from Vercel frontend to Render backend
- **Impact**: "CORS policy: No 'Access-Control-Allow-Origin' header" errors
- **Fix**: Add `FRONTEND_URL=https://your-app.vercel.app` in Render environment variables

### **Issue 3: SESSION_SECRET and JWT_SECRET Not Set**
- **Problem**: Authentication tokens cannot be verified without these secrets
- **Impact**: Login works but session immediately expires, users get logged out
- **Fix**: Add strong random secrets in Render (see below)

### **Issue 4: Google OAuth Redirect URI Mismatch**
- **Problem**: Google OAuth callback URL not configured for production
- **Impact**: Google sign-in fails with "redirect_uri_mismatch" error
- **Fix**: Update Google Cloud Console with production callback URL

### **Issue 5: Cookie Settings for Cross-Domain**
- **Problem**: Cookies might not work across different domains (Vercel <-> Render)
- **Impact**: Session persistence fails, users need to login repeatedly
- **Fix**: Ensure `sameSite: 'none'` and `secure: true` (already in code, just needs HTTPS)

### **Issue 6: Database Migrations Not Running**
- **Problem**: Migrations might not run automatically on Render startup
- **Impact**: Missing tables, columns, or schema changes
- **Fix**: Verify build command includes migration step

---

## ✅ Complete Fix Checklist

### **Step 1: Fix Render Backend Environment Variables**

Go to your Render service → Environment → Add these variables:

```bash
# Required - Core Secrets (Generate strong random values)
SESSION_SECRET=<generate-64-char-random-string>
JWT_SECRET=<generate-64-char-random-string>

# Required - Database
DATABASE_URL=<your-supabase-connection-string>

# Required - URLs for CORS and OAuth
BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-app.vercel.app

# Required - Environment
NODE_ENV=production

# Optional - Google OAuth (if using)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
```

**How to generate secrets:**
```bash
# On Mac/Linux:
openssl rand -base64 48

# Or use Node.js:
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# Or online (ensure it's 64+ characters):
https://www.random.org/strings/?num=1&len=64&digits=on&upperalpha=on&loweralpha=on
```

### **Step 2: Fix Vercel Frontend Environment Variables**

Go to your Vercel project → Settings → Environment Variables → Add:

```bash
# CRITICAL - Backend API URL
VITE_API_URL=https://your-backend.onrender.com
```

**Important:** After adding this, you MUST redeploy:
```bash
vercel --prod
```

Or trigger a redeploy from Vercel dashboard.

### **Step 3: Fix Google OAuth Configuration**

If using Google Sign-In, update your Google Cloud Console:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add **Authorized JavaScript origins**:
   - `https://your-app.vercel.app`
   - `https://your-backend.onrender.com`
4. Add **Authorized redirect URIs**:
   - `https://your-backend.onrender.com/api/auth/google/callback`
5. Save changes

### **Step 4: Verify Build Commands**

#### **Render (Backend)**
Ensure your service has:
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

#### **Vercel (Frontend)**
Ensure your project has:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `npm install`

### **Step 5: Verify Database Connection**

In Render dashboard:
1. Go to your service → Logs
2. Check for "✅ POSTGRESQL DATABASE CONNECTION ESTABLISHED"
3. If you see connection errors:
   - Verify DATABASE_URL is correct
   - Check Supabase allows connections from Render IPs
   - Ensure connection string includes `?sslmode=require`

---

## 🧪 Testing the Fixes

### **1. Test Backend Health**
```bash
curl https://your-backend.onrender.com/api/health
# Should return: {"status":"ok","environment":"production"}
```

### **2. Test CORS**
```bash
curl -H "Origin: https://your-app.vercel.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     --verbose \
     https://your-backend.onrender.com/api/auth/login
# Should return: Access-Control-Allow-Origin: https://your-app.vercel.app
```

### **3. Test Frontend API Connection**
1. Open browser DevTools (F12)
2. Go to: `https://your-app.vercel.app`
3. Check Network tab
4. API calls should go to: `https://your-backend.onrender.com/api/...`
5. Should NOT see CORS errors

### **4. Test Login Flow**
1. Try username/password login
2. Try Google Sign-In (if configured)
3. Check if session persists after page refresh
4. Verify user stays logged in

---

## 🔧 Common Production Issues & Solutions

### **Issue: "Failed to fetch" errors**
**Cause**: VITE_API_URL not set in Vercel
**Solution**: Add `VITE_API_URL` environment variable and redeploy

### **Issue: CORS errors in browser console**
**Cause**: FRONTEND_URL not set in Render
**Solution**: Add `FRONTEND_URL` and redeploy Render service

### **Issue: Login works but immediately logs out**
**Cause**: SESSION_SECRET or JWT_SECRET missing/mismatch
**Solution**: Set both secrets in Render (must be same across deploys)

### **Issue: Google Sign-In fails**
**Cause**: redirect_uri not authorized in Google Console
**Solution**: Add production callback URL to Google OAuth credentials

### **Issue: 502 Bad Gateway**
**Cause**: Backend not starting properly
**Solution**: Check Render logs for errors, verify DATABASE_URL

### **Issue: Session doesn't persist**
**Cause**: Cookie settings not compatible with cross-domain
**Solution**: Already fixed in code, just ensure both services use HTTPS

### **Issue: Database connection fails**
**Cause**: Wrong connection string or network issue
**Solution**: 
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db?sslmode=require`
- Check Supabase connection pooler is active
- Ensure Render can access Supabase (check firewall rules)

---

## 📋 Environment Variables Quick Reference

### **Render (Backend) - Required Variables:**
| Variable | Example | Notes |
|----------|---------|-------|
| `NODE_ENV` | `production` | Must be production |
| `DATABASE_URL` | `postgresql://...` | From Supabase/Neon |
| `SESSION_SECRET` | Random 64+ chars | For session encryption |
| `JWT_SECRET` | Random 64+ chars | For JWT tokens |
| `BACKEND_URL` | `https://backend.onrender.com` | Your Render URL |
| `FRONTEND_URL` | `https://app.vercel.app` | Your Vercel URL |

### **Render (Backend) - Optional Variables:**
| Variable | Example | Notes |
|----------|---------|-------|
| `GOOGLE_CLIENT_ID` | `123456...apps.googleusercontent.com` | For Google OAuth |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | For Google OAuth |
| `GOOGLE_CALLBACK_URL` | `https://backend.onrender.com/api/auth/google/callback` | OAuth callback |

### **Vercel (Frontend) - Required Variables:**
| Variable | Example | Notes |
|----------|---------|-------|
| `VITE_API_URL` | `https://backend.onrender.com` | Your Render backend URL |

---

## 🚀 Deployment Workflow

### **Initial Deployment:**
1. ✅ Deploy backend to Render first
2. ✅ Get Render URL (e.g., `https://xyz.onrender.com`)
3. ✅ Deploy frontend to Vercel
4. ✅ Get Vercel URL (e.g., `https://abc.vercel.app`)
5. ✅ Update Render with `FRONTEND_URL` = Vercel URL
6. ✅ Update Vercel with `VITE_API_URL` = Render URL
7. ✅ Update Google OAuth (if using)
8. ✅ Test everything

### **Update Deployment:**
1. Make code changes locally
2. Commit and push to GitHub
3. Both Render and Vercel auto-deploy
4. If env vars changed, manually redeploy

---

## 🎯 Success Criteria

Your deployment is successful when:
- [ ] Backend health endpoint returns 200 OK
- [ ] Frontend loads without CORS errors
- [ ] Login with username/password works
- [ ] Google Sign-In works (if configured)
- [ ] Session persists after page refresh
- [ ] All API calls successfully reach backend
- [ ] Database operations work (CRUD)
- [ ] File uploads work (if applicable)
- [ ] All features from Replit work in production

---

## 📞 Support

If issues persist after following this guide:
1. Check Render logs for backend errors
2. Check Vercel deployment logs
3. Check browser DevTools Network tab for failed requests
4. Verify all environment variables are set correctly
5. Ensure both services are using HTTPS
6. Check database connection pooler is active

---

## 🔐 Security Checklist

Before going live:
- [ ] Strong SESSION_SECRET (64+ characters, random)
- [ ] Strong JWT_SECRET (64+ characters, random)
- [ ] DATABASE_URL has `?sslmode=require`
- [ ] Google OAuth credentials secured (not in code)
- [ ] CORS only allows your frontend domain
- [ ] HTTPS enforced on both Render and Vercel
- [ ] No secrets committed to GitHub
- [ ] Environment variables set correctly

---

**✨ Your school management system should now work perfectly in production!**
