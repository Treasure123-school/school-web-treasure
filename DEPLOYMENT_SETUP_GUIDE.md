# Deployment Setup Guide

This guide explains how to deploy your school management system for **development** (Replit/localhost) and **production** (Render backend + Vercel frontend).

---

## 🏗️ Architecture Overview

Your application supports **three deployment modes**:

1. **Replit Development** - Full-stack on Replit (auto-configured)
2. **Local Development** - Full-stack on localhost
3. **Production** - Backend on Render + Frontend on Vercel

---

## 🚀 Development Setup

### Option 1: Replit Development (Current Setup)

**Automatic Configuration:**
- ✅ Development URL: Automatically available at your Replit dev domain
- ✅ CORS: Auto-configured for `*.replit.dev` domains
- ✅ Environment: Uses `REPLIT_DEV_DOMAIN` and `REPLIT_DOMAINS` env variables
- ✅ Port: Binds to `0.0.0.0:5000` (accessible externally on port 80)

**Access Your App:**
- Click the "Webview" tab or open the Replit dev URL directly
- No additional configuration needed!

### Option 2: Local Development

**Setup Steps:**

1. **Clone the repository** to your local machine

2. **Create `.env` file** with development settings:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/database
SESSION_SECRET=your-dev-session-secret
JWT_SECRET=your-dev-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

3. **Install dependencies:**
```bash
npm install
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Access the app:**
- Open http://localhost:5000 in your browser
- CORS is pre-configured for localhost

---

## 🌐 Production Deployment (Render + Vercel)

### Step 1: Deploy Backend to Render

**1.1 Create a New Web Service on Render:**
- Go to [Render Dashboard](https://dashboard.render.com/)
- Click "New +" → "Web Service"
- Connect your GitHub repository

**1.2 Configure the Web Service:**

| Setting | Value |
|---------|-------|
| **Name** | `your-app-backend` (or your choice) |
| **Environment** | `Node` |
| **Build Command** | `npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | Free or Starter |

**1.3 Add Environment Variables on Render:**

```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://your-backend.onrender.com/api/auth/google/callback

# Frontend URL (will be set after Vercel deployment)
FRONTEND_URL=https://your-app.vercel.app
```

**1.4 Deploy:**
- Click "Create Web Service"
- Wait for the build to complete
- Note your backend URL: `https://your-backend.onrender.com`

---

### Step 2: Deploy Frontend to Vercel

**2.1 Create a New Project on Vercel:**
- Go to [Vercel Dashboard](https://vercel.com/dashboard)
- Click "New Project"
- Import your GitHub repository

**2.2 Configure the Project:**

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` (root) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist/public` |

**2.3 Add Environment Variables on Vercel:**

```bash
VITE_API_URL=https://your-backend.onrender.com
```

**2.4 Deploy:**
- Click "Deploy"
- Wait for the build to complete
- Note your frontend URL: `https://your-app.vercel.app`

---

### Step 3: Update Backend with Frontend URL

**3.1 Go back to Render Dashboard:**
- Navigate to your backend web service
- Go to "Environment" tab

**3.2 Update FRONTEND_URL:**
```bash
FRONTEND_URL=https://your-app.vercel.app
```

**3.3 Save and Redeploy:**
- Click "Save Changes"
- Render will automatically redeploy with the new environment variable

---

## 🔒 Google OAuth Configuration

**Update your Google OAuth settings:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "Credentials"
3. Edit your OAuth 2.0 Client ID
4. Add the following to **Authorized redirect URIs**:

```
# For Replit Development
https://your-replit-domain.replit.dev/api/auth/google/callback

# For Local Development
http://localhost:5000/api/auth/google/callback

# For Production (Render)
https://your-backend.onrender.com/api/auth/google/callback
```

5. Add to **Authorized JavaScript origins**:

```
# For Replit Development
https://your-replit-domain.replit.dev

# For Local Development
http://localhost:5000

# For Production (Vercel)
https://your-app.vercel.app
```

---

## 🔧 CORS Configuration

**Your app is pre-configured with CORS for:**

### Development Mode:
- ✅ `http://localhost:5173` (Vite dev server)
- ✅ `http://localhost:5000` (Express server)
- ✅ `*.vercel.app` (Vercel preview deployments)
- ✅ `*.replit.dev` (Replit development)
- ✅ Auto-detects `REPLIT_DEV_DOMAIN`
- ✅ Auto-detects `REPLIT_DOMAINS`

### Production Mode:
- ✅ `FRONTEND_URL` environment variable
- ✅ `*.vercel.app` (Vercel deployments)
- ✅ `*.render.com` (Render deployments)

**No additional CORS configuration needed!**

---

## 📝 Testing Your Deployment

### Test Replit Development:
1. Run the app on Replit
2. Open the Webview or Replit dev URL
3. Verify authentication and API calls work

### Test Local Development:
1. Run `npm run dev` locally
2. Open http://localhost:5000
3. Verify authentication and API calls work

### Test Production:
1. Open your Vercel URL: `https://your-app.vercel.app`
2. Verify the frontend loads
3. Test authentication (Google OAuth)
4. Verify API calls to Render backend work
5. Check browser console for any CORS errors

---

## 🐛 Troubleshooting

### Issue: CORS errors in production

**Solution:**
- Verify `FRONTEND_URL` is set correctly on Render
- Check that Vercel URL matches the `FRONTEND_URL` value
- Ensure both Render and Vercel deployments are live

### Issue: Google OAuth not working

**Solution:**
- Verify `GOOGLE_REDIRECT_URI` matches your backend URL
- Check Google Cloud Console has the correct redirect URIs
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set

### Issue: Can't access Replit dev URL

**Solution:**
- Verify the server is binding to `0.0.0.0:5000`
- Check that port 5000 is configured in `.replit` file
- Ensure `allowedHosts: true` is set in `vite.config.ts`

### Issue: Database connection errors

**Solution:**
- Verify `DATABASE_URL` is set correctly
- Check that your database accepts connections from Render/Replit IP addresses
- Ensure database credentials are correct

---

## 📚 Key Files

- **`.env.example`** - Environment variable template
- **`.replit`** - Replit port and workflow configuration
- **`vite.config.ts`** - Vite configuration with `allowedHosts: true`
- **`server/index.ts`** - Express server with CORS configuration
- **`server/vite.ts`** - Vite dev server middleware

---

## ✅ Deployment Checklist

### Replit Development:
- [x] Server configured to bind to `0.0.0.0:5000`
- [x] CORS auto-configured for Replit domains
- [x] Port forwarding configured in `.replit`
- [x] Vite `allowedHosts: true` enabled

### Production (Render + Vercel):
- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set on both platforms
- [ ] `FRONTEND_URL` updated on Render
- [ ] Google OAuth redirect URIs updated
- [ ] CORS tested and working
- [ ] Authentication tested and working

---

## 🎉 Success!

Your application now works in three modes:
1. ✅ **Replit Development** - Auto-configured, ready to use
2. ✅ **Local Development** - Full-stack on localhost
3. ✅ **Production** - Backend on Render + Frontend on Vercel

Happy coding! 🚀
