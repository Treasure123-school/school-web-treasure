# Production Deployment Guide - Complete Setup

This guide ensures your application works identically in both **development (Replit)** and **production (Vercel + Render)**.

## 🚨 Critical: Environment Variables Required

### **Render (Backend) - ALL Required**

```bash
# ========================
# CRITICAL - Authentication & Security
# ========================
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-64-chars-minimum
SESSION_SECRET=your-super-secret-session-key-64-chars-minimum

# Generate secure secrets with:
# openssl rand -base64 48

# ========================
# CRITICAL - Database
# ========================
DATABASE_URL=postgresql://user:password@host:port/database

# ========================
# CRITICAL - CORS & URL Configuration
# ========================
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-backend.onrender.com

# ========================
# CRITICAL - Supabase Storage (for images/files)
# ========================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# ========================
# OPTIONAL - Google OAuth
# ========================
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ========================
# OPTIONAL - Email/SMS Notifications
# ========================
# Add these to database settings table, not environment variables
```

### **Vercel (Frontend) - ALL Required**

```bash
# ========================
# CRITICAL - API Connection
# ========================
VITE_API_BASE_URL=https://your-backend.onrender.com

# Alternative (backward compatibility):
# VITE_API_URL=https://your-backend.onrender.com
```

---

## 📋 Step-by-Step Deployment

### Step 1: Set Up Render (Backend)

1. **Create Web Service** on Render
   - Connect your GitHub repository
   - Build Command: `npm install`
   - Start Command: `npm run start`
   - Environment: `Node`

2. **Add ALL Environment Variables** (from Render section above)
   - Go to Dashboard → Your Service → Environment
   - Add each variable one by one
   - ⚠️ **CRITICAL**: Do NOT skip any variable marked as "CRITICAL"

3. **Deploy & Verify**
   - Render will auto-deploy
   - Check logs for: `✅ POSTGRESQL DATABASE CONNECTION ESTABLISHED`
   - Check logs for: `serving on port 10000` (or your port)

### Step 2: Set Up Vercel (Frontend)

1. **Import Project** from GitHub
   - Select your repository
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist/public`

2. **Add Environment Variable**
   ```bash
   VITE_API_BASE_URL=https://your-backend.onrender.com
   ```
   - Go to Project Settings → Environment Variables
   - Add for Production, Preview, and Development

3. **Deploy & Verify**
   - Trigger deployment
   - Visit your Vercel URL
   - Open browser console - check for errors

### Step 3: Configure Database

1. **Create PostgreSQL Database** (Supabase recommended)
   - Sign up at supabase.com
   - Create new project
   - Go to Settings → Database → Connection String
   - Copy and add to Render as `DATABASE_URL`

2. **Run Migrations** (automatic on first deploy)
   - Migrations run automatically when backend starts
   - Check Render logs for: `✅ Database migrations completed successfully`

### Step 4: Configure Supabase Storage

1. **Create Storage Buckets**
   ```
   - homepage-images (public)
   - gallery-images (public)
   - profile-images (public)
   - study-resources (public)
   - general-uploads (public)
   ```

2. **Get Service Role Key**
   - Supabase Dashboard → Project Settings → API
   - Copy `service_role` key
   - Add to Render as `SUPABASE_SERVICE_KEY`

3. **Get Project URL**
   - Copy Project URL (e.g., `https://abc123.supabase.co`)
   - Add to Render as `SUPABASE_URL`

---

## 🔍 Common Issues & Solutions

### Issue 1: "401 Unauthorized" on Login

**Cause**: Missing or incorrect environment variables

**Solution**:
1. Verify `JWT_SECRET` is set in Render
2. Verify `SESSION_SECRET` is set in Render
3. Verify `FRONTEND_URL` matches your Vercel domain exactly
4. Verify `VITE_API_BASE_URL` in Vercel matches your Render domain exactly
5. Redeploy both Render and Vercel after changes

### Issue 2: Images Upload in Dev but Not in Production

**Cause**: Supabase storage not configured

**Solution**:
1. Set `SUPABASE_URL` in Render
2. Set `SUPABASE_SERVICE_KEY` in Render
3. Create all required buckets in Supabase (see Step 4 above)
4. Make all buckets public
5. Redeploy Render

### Issue 3: CORS Errors

**Cause**: Frontend URL not whitelisted

**Solution**:
1. Set `FRONTEND_URL` in Render to your exact Vercel URL
2. Include protocol: `https://your-app.vercel.app` (no trailing slash)
3. Check Render logs for: `⚠️ CORS: Rejected origin: ...`
4. If rejected, verify FRONTEND_URL matches the rejected origin
5. Redeploy Render

### Issue 4: Google Sign-In Fails

**Cause**: OAuth callback URL mismatch

**Solution**:
1. Go to Google Cloud Console → APIs & Services → Credentials
2. Edit OAuth 2.0 Client
3. Add Authorized Redirect URIs:
   ```
   https://your-backend.onrender.com/api/auth/google/callback
   ```
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in Render
5. Redeploy Render

### Issue 5: Database Connection Fails

**Cause**: Invalid connection string or SSL mode

**Solution**:
1. Verify `DATABASE_URL` includes all parts: `postgresql://user:password@host:port/database`
2. For Supabase, append: `?sslmode=require`
3. Check Render logs for connection errors
4. Test connection using Supabase SQL Editor

---

## ✅ Deployment Checklist

Use this checklist before going live:

### Backend (Render)
- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` set (64+ chars, random)
- [ ] `SESSION_SECRET` set (64+ chars, random)
- [ ] `DATABASE_URL` set with valid PostgreSQL connection
- [ ] `FRONTEND_URL` set to exact Vercel URL
- [ ] `BACKEND_URL` set to exact Render URL
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_KEY` set
- [ ] Logs show: `✅ POSTGRESQL DATABASE CONNECTION ESTABLISHED`
- [ ] Logs show: `✅ Supabase Storage initialization complete`
- [ ] No CORS errors in logs

### Frontend (Vercel)
- [ ] `VITE_API_BASE_URL` set to exact Render URL
- [ ] Build succeeds without errors
- [ ] No 401/403 errors in browser console
- [ ] No CORS errors in browser console
- [ ] Login works correctly
- [ ] Image upload/delete works

### Database
- [ ] Supabase project created
- [ ] Connection string added to Render
- [ ] All storage buckets created
- [ ] Buckets are public
- [ ] Service role key added to Render

### Google OAuth (if enabled)
- [ ] OAuth credentials created in Google Cloud Console
- [ ] Redirect URI added: `https://your-backend.onrender.com/api/auth/google/callback`
- [ ] `GOOGLE_CLIENT_ID` set in Render
- [ ] `GOOGLE_CLIENT_SECRET` set in Render

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Use Render/Vercel dashboard for secrets
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 48`
3. **Use strong SESSION_SECRET** - Different from JWT_SECRET
4. **Enable HTTPS** - Both Render and Vercel enforce HTTPS by default
5. **Rotate secrets regularly** - Update JWT_SECRET and SESSION_SECRET every 90 days
6. **Limit CORS origins** - Only allow your actual frontend domains
7. **Use service role key carefully** - Never expose SUPABASE_SERVICE_KEY to frontend

---

## 📊 Monitoring & Debugging

### Render Logs
```bash
# Check for these success messages:
✅ POSTGRESQL DATABASE CONNECTION ESTABLISHED
✅ Supabase Storage initialization complete
✅ Google OAuth authentication enabled (if configured)
✅ Database migrations completed successfully
serving on port 10000

# Watch for these errors:
🚨 MIGRATION ERROR
⚠️ CORS: Rejected origin
CRITICAL: JWT_SECRET environment variable is required
```

### Vercel Logs
```bash
# Check deployment logs:
- Build succeeds
- No environment variable warnings
- No CORS/401 errors during build

# Check Function logs (if using serverless functions)
```

### Browser Console
```bash
# Should NOT see:
- 401 Unauthorized
- CORS policy errors
- Failed to fetch

# Should see:
- Successful API calls
- No authentication errors
```

---

## 🚀 Quick Recovery Steps

If production breaks:

1. **Check Render Logs** - Look for error messages
2. **Check Browser Console** - Look for CORS/401 errors
3. **Verify Environment Variables** - Ensure all CRITICAL vars are set
4. **Redeploy Render** - Trigger manual deploy
5. **Redeploy Vercel** - Trigger manual deploy
6. **Clear Browser Cache** - Hard refresh (Ctrl+Shift+R)
7. **Check Database Connection** - Test in Supabase SQL Editor

---

## 📞 Support

If issues persist:
1. Check Render logs for specific error messages
2. Check browser console for client-side errors
3. Verify all environment variables are set correctly
4. Ensure Supabase storage buckets exist and are public
5. Test database connection independently

---

## 🔄 Syncing Dev and Production

To ensure development and production work identically:

1. **Use same database** - Point development to production database (careful!)
   - OR: Use separate dev database with same schema
   
2. **Use same storage** - Point development to production Supabase
   - OR: Use separate Supabase project for development

3. **Test locally first** - Always test changes in development before pushing

4. **Environment parity** - Keep dev `.env` in sync with production variables

5. **Git workflow**:
   ```bash
   # After making changes:
   git add .
   git commit -m "Description of changes"
   git push origin main
   
   # Render auto-deploys from main branch
   # Vercel auto-deploys from main branch
   ```

---

## 📝 Notes

- All environment variables are **case-sensitive**
- URLs should **not** have trailing slashes
- Secrets should be **64+ characters** for production
- Database migrations run **automatically** on deploy
- Supabase buckets must be **public** for image access
- CORS is configured to handle **cross-origin** requests (Render ↔ Vercel)

---

**Last Updated**: Generated for comprehensive production deployment setup
