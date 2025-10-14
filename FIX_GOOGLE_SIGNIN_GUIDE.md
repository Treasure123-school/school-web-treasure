# 🔧 Fix Google Sign-In on Vercel - Step by Step

## ✅ Good News!
Your hero image is already perfect - it shows the girl with her hand raised! That's displaying correctly. ✨

## 🔴 The Google Sign-In Problem

Google Sign-In isn't working on your Vercel website because it needs proper configuration. Here's the fix:

---

## 📋 **Step-by-Step Fix**

### **Step 1: Get Your Actual Render URL**

1. Go to your Render dashboard: https://dashboard.render.com
2. Find your backend service (the one running your Express app)
3. Copy the URL - it should look like: `https://treasure-home-backend.onrender.com` or similar
4. **Write it down** - you'll need it for the next steps!

---

### **Step 2: Set Environment Variables on Render**

Go to your Render service → Environment → Add these variables:

```bash
# Replace with YOUR actual URLs
BACKEND_URL=https://YOUR-ACTUAL-BACKEND.onrender.com
FRONTEND_URL=https://YOUR-ACTUAL-VERCEL-APP.vercel.app

# Your Google credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Your JWT secret (any random secure string)
JWT_SECRET=your_super_secret_random_string_here

# Your Supabase database URL
DATABASE_URL=postgresql://your_supabase_connection_string

# Required settings
NODE_ENV=production
PORT=10000
```

**Important:** Click "Save Changes" and wait for Render to redeploy (takes 1-2 minutes)

---

### **Step 3: Set Environment Variable on Vercel**

Go to your Vercel project → Settings → Environment Variables:

```bash
# Replace with your ACTUAL Render backend URL
VITE_API_URL=https://YOUR-ACTUAL-BACKEND.onrender.com
```

**Important:** Click "Save" then go to Deployments → Click the 3 dots → Redeploy

---

### **Step 4: Update Google Cloud Console**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Scroll to **"Authorized redirect URIs"**
4. Click **"+ ADD URI"** and add:
   ```
   https://YOUR-ACTUAL-BACKEND.onrender.com/api/auth/google/callback
   ```
   (Replace with your actual Render URL!)

5. Scroll to **"Authorized JavaScript origins"**
6. Click **"+ ADD URI"** and add BOTH:
   ```
   https://YOUR-ACTUAL-VERCEL-APP.vercel.app
   https://YOUR-ACTUAL-BACKEND.onrender.com
   ```

7. Click **"SAVE"**
8. **Wait 5-10 minutes** for Google changes to take effect

---

### **Step 5: Test It!**

1. Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
2. Click "Portal Login"
3. Click "Sign in with Google"
4. You should be redirected to Google
5. After signing in, you'll be redirected back to your app!

---

## 🎯 Quick Checklist

- [ ] Get actual Render backend URL from Render dashboard
- [ ] Get actual Vercel frontend URL from Vercel dashboard
- [ ] Set all environment variables on Render
- [ ] Set `VITE_API_URL` on Vercel
- [ ] Update Google OAuth redirect URIs with actual URLs
- [ ] Wait 5-10 minutes for Google changes
- [ ] Test on your Vercel URL

---

## 🚨 Common Mistakes to Avoid

1. **Don't use placeholder URLs** like "your-backend.onrender.com"
   - Use your ACTUAL URLs!

2. **Don't forget the protocol** - use `https://` not just the domain

3. **Exact match required** - URLs in Google Console must match EXACTLY

4. **Wait for deployments** 
   - Render: Wait for build to finish
   - Vercel: Redeploy after adding env vars
   - Google: Wait 5-10 minutes

---

## 🔍 How to Find Your URLs

### Find Render Backend URL:
1. Go to https://dashboard.render.com
2. Click on your backend service
3. Look for the URL at the top (e.g., `https://treasure-home-backend.onrender.com`)

### Find Vercel Frontend URL:
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Look for "Domains" - copy the .vercel.app URL

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ No CORS errors in browser console
- ✅ Google Sign-In button redirects properly
- ✅ After Google login, you're redirected back to your app
- ✅ You can see your user profile in the portal

---

## 🆘 Still Not Working?

If you still have issues after following these steps:

1. **Check Render logs** for errors
2. **Check browser console** (F12) for error messages
3. **Verify all URLs** are actual URLs, not placeholders
4. **Double-check Google Console** - callback URL must match exactly
5. **Wait longer** - Google changes can take up to 30 minutes sometimes

---

## 💡 Pro Tip

For faster testing during development:
- Add your Replit URL to Google OAuth (for local testing)
- You can have multiple redirect URIs in Google Console
- Test locally first, then test on Vercel

---

**Need more help?** Check the detailed guide in `RENDER_VERCEL_DEPLOYMENT_GUIDE.md`
