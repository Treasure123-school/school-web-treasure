# 🚀 Complete Production Deployment Guide

## 📋 Overview

This guide will help you deploy your school management system to production with:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Express + Node.js)
- **Database**: PostgreSQL (Neon/Supabase)
- **File Storage**: Supabase Storage (for images and uploads)

---

## 🚨 Critical Issues Fixed

### ✅ **1. Vercel Configuration Fixed**
- **Problem**: `vercel.json` was trying to build the entire app (frontend + backend) on Vercel
- **Solution**: Updated to only deploy the frontend static files
- **Impact**: Vercel will now correctly build only the React frontend

### ✅ **2. Render Configuration Fixed**
- **Problem**: Missing TypeScript build configuration
- **Solution**: Updated `render.yaml` with proper build and start commands
- **Impact**: Render will correctly compile TypeScript and run the Express backend

### ✅ **3. File Upload System Fixed**
- **Problem**: Images stored locally in `uploads/` folder (gets wiped on Render restarts)
- **Solution**: Configured Supabase Storage for persistent file uploads
- **Impact**: All images will be stored permanently in Supabase cloud storage

### ✅ **4. Authentication Fixed**
- **Problem**: Cookies/sessions not working between Vercel and Render
- **Solution**: Already configured with proper CORS and cross-domain settings
- **Impact**: Login and authentication will work correctly in production

---

## 🔧 Step 1: Set Up Supabase Storage

### **1.1 Create Supabase Project** (if you don't have one)

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project details:
   - **Name**: school-management-storage
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project"

### **1.2 Get Supabase Credentials**

Once your project is ready:

1. Go to **Project Settings** (gear icon) → **API**
2. Copy these values (you'll need them later):
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### **1.3 Create Storage Buckets**

Your app will automatically create these buckets on first run:
- `homepage-images` - Homepage hero/banner images
- `gallery-images` - School gallery photos
- `profile-images` - User profile pictures
- `study-resources` - PDF and document uploads
- `general-uploads` - Other files

**Note**: The app creates these automatically when you set the Supabase environment variables!

---

## 🗄️ Step 2: Set Up Database

### **Option A: Use Supabase PostgreSQL** (Recommended)

1. In your Supabase project, go to **Project Settings** → **Database**
2. Copy the **Connection String** (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
3. Replace `[YOUR-PASSWORD]` with your actual database password
4. This will be your `DATABASE_URL`

### **Option B: Use Neon PostgreSQL**

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string
4. This will be your `DATABASE_URL`

---

## ☁️ Step 3: Deploy Backend to Render

### **3.1 Push Your Code to GitHub**

```bash
# Make sure you're in your project directory
git add .
git commit -m "Fix production deployment configuration"
git push origin main
```

### **3.2 Create Render Web Service**

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `school-management-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Instance Type**: Free (or paid for better performance)

### **3.3 Set Environment Variables on Render**

Go to your Render service → **Environment** tab and add these variables:

```bash
# Node Environment
NODE_ENV=production

# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

# Frontend URL (will add after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app

# Session & JWT Secrets (generate strong random strings)
SESSION_SECRET=your-super-secret-session-key-here-minimum-32-characters
JWT_SECRET=your-super-secret-jwt-key-here-minimum-32-characters

# Supabase Storage
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (if using Google Sign-In)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback
```

**To generate secure secrets:**
```bash
# On your terminal (Mac/Linux)
openssl rand -base64 32

# Or use an online generator (make sure it's 32+ characters)
```

### **3.4 Deploy**

1. Click **"Create Web Service"** or **"Manual Deploy"**
2. Wait for deployment to complete (5-10 minutes)
3. Copy your backend URL (e.g., `https://school-management-backend.onrender.com`)
4. **Important**: Go back and update the `FRONTEND_URL` variable once you have your Vercel URL

---

## 🌐 Step 4: Deploy Frontend to Vercel

### **4.1 Create Vercel Project**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Other (or Vite if available)
   - **Build Command**: `npm run build` (already configured)
   - **Output Directory**: `dist/public` (already configured)
   - **Install Command**: `npm install` (already configured)

### **4.2 Set Environment Variables on Vercel**

In Vercel project settings → **Environment Variables**, add:

```bash
# Backend API URL (your Render URL)
VITE_API_URL=https://school-management-backend.onrender.com
```

### **4.3 Deploy**

1. Click **"Deploy"**
2. Wait for deployment to complete (2-5 minutes)
3. Copy your Vercel URL (e.g., `https://your-app.vercel.app`)
4. **Important**: Go back to Render and update the `FRONTEND_URL` variable with your Vercel URL

---

## 🔐 Step 5: Configure Google OAuth (if using)

### **5.1 Update Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add these to **Authorized redirect URIs**:
   ```
   https://your-backend.onrender.com/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```
4. Add these to **Authorized JavaScript origins**:
   ```
   https://your-app.vercel.app
   https://your-backend.onrender.com
   http://localhost:5000
   ```
5. Click **Save**

**Note**: Changes can take 5-10 minutes to propagate

---

## ✅ Step 6: Verify Deployment

### **6.1 Test Backend**

Visit `https://your-backend.onrender.com/api/health` - should return `{"status":"ok"}`

### **6.2 Test Frontend**

1. Visit `https://your-app.vercel.app`
2. Try logging in with username/password
3. Try Google Sign-In (if configured)
4. Upload an image (should go to Supabase Storage)

### **6.3 Check Browser Console**

Open DevTools (F12):
- **No CORS errors** should appear
- **Network tab**: Check requests are going to your Render backend
- **Application tab** → **Cookies**: Session cookies should be present

---

## 🐛 Common Issues & Solutions

### **Issue: "CORS Error" in browser**

**Solution:**
1. Verify `FRONTEND_URL` on Render matches your exact Vercel URL
2. Check Render logs for CORS rejection messages
3. Make sure both URLs use `https://` (no trailing slash)

### **Issue: "Authentication not working"**

**Solution:**
1. Check `SESSION_SECRET` and `JWT_SECRET` are set on Render
2. Verify `FRONTEND_URL` is correct
3. Clear browser cookies and try again
4. Check browser DevTools → Application → Cookies (should see session cookie)

### **Issue: "Images not uploading"**

**Solution:**
1. Verify all 3 Supabase environment variables are set on Render
2. Check Render logs for Supabase errors
3. Verify Supabase buckets were created (check Supabase dashboard → Storage)

### **Issue: "Render build fails"**

**Solution:**
1. Check Render logs for specific error
2. Common fixes:
   - Ensure `NODE_ENV=production` is set
   - Verify `package.json` has correct scripts
   - Check TypeScript compilation errors
3. Try manual deploy again

### **Issue: "Database connection failed"**

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check your database password has no special characters that need escaping
3. Ensure your database allows connections from Render's IP range
4. For Supabase: Go to Settings → Database → Connection pooling → Enable

---

## 📊 Monitoring & Logs

### **View Render Logs**
1. Render Dashboard → Your Service → Logs
2. Look for startup errors or runtime issues

### **View Vercel Logs**
1. Vercel Dashboard → Your Project → Deployments → Click deployment
2. Check Functions logs or Build logs

### **View Supabase Logs**
1. Supabase Dashboard → Logs
2. Check for storage upload errors

---

## 🔄 Updating Your App

### **When you make changes:**

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Render automatically redeploys** (if auto-deploy is enabled)

3. **Vercel automatically redeploys** (automatically enabled)

### **Force Manual Deploy:**

- **Render**: Dashboard → Manual Deploy → Deploy Latest Commit
- **Vercel**: Dashboard → Deployments → Redeploy

---

## 🎯 Quick Checklist

Before going live, verify:

- [ ] Render backend is deployed and healthy (`/api/health` returns 200)
- [ ] Vercel frontend is deployed and accessible
- [ ] All environment variables are set correctly on both platforms
- [ ] `FRONTEND_URL` on Render matches your Vercel URL
- [ ] `VITE_API_URL` on Vercel matches your Render URL
- [ ] Database connection is working (check Render logs)
- [ ] Supabase Storage is configured (all 3 env vars set)
- [ ] Google OAuth redirect URIs are updated (if using)
- [ ] File uploads work (images go to Supabase, not local storage)
- [ ] Authentication works (login, session persists)
- [ ] No CORS errors in browser console

---

## 💰 Cost Estimate (Free Tier)

| Service | Free Tier | Paid Option |
|---------|-----------|-------------|
| **Render** | 750 hours/month (sleeps after 15min idle) | $7/mo always-on |
| **Vercel** | 100GB bandwidth, unlimited deployments | $20/mo per seat |
| **Supabase** | 500MB database, 1GB storage | $25/mo Pro |

**Total Free Tier Cost**: $0/month (with limitations)
**Recommended Paid Setup**: ~$32/month for production use

---

## 📞 Need Help?

If you encounter issues:

1. **Check logs first**:
   - Render logs for backend errors
   - Vercel logs for frontend build errors
   - Browser DevTools Console for client errors

2. **Common debugging commands**:
   ```bash
   # View Render logs
   # Go to Render Dashboard → Your Service → Logs
   
   # Test backend locally
   npm run dev
   curl http://localhost:5000/api/health
   
   # Test production backend
   curl https://your-backend.onrender.com/api/health
   ```

3. **Verify environment variables match** between:
   - Local `.env` (development)
   - Render Environment Variables (production backend)
   - Vercel Environment Variables (production frontend)

---

## ✨ Success Indicators

You'll know everything is working when:

- ✅ Frontend loads on Vercel URL without errors
- ✅ Backend health check returns `200 OK`
- ✅ Login works and session persists after refresh
- ✅ Image uploads save to Supabase Storage (check Supabase dashboard)
- ✅ No CORS errors in browser console
- ✅ API requests successfully reach Render backend
- ✅ Database queries work (users can be created/read)

---

**🎉 Congratulations!** Your school management system is now deployed to production!
