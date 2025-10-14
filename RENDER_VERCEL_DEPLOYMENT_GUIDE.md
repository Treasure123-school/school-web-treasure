# 🚀 Render + Vercel + Supabase Deployment Guide

## 🔴 Problem Fixed: Cross-Domain Authentication

Your authentication was failing because cookies weren't working between Render (backend) and Vercel (frontend). This has been fixed with:

1. ✅ **Trust proxy** enabled for Render
2. ✅ **Session cookies** configured with `sameSite: 'none'` for cross-domain
3. ✅ **CORS** configured to allow credentials
4. ✅ **Google OAuth callback URL** updated to use backend URL

---

## 📋 Environment Variables Setup

### **1. Render Backend Environment Variables**

Go to your Render dashboard → Select your backend service → Environment Variables

```bash
# Required - Database
DATABASE_URL=your_supabase_connection_string

# Required - Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# Required - Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Required - URLs
BACKEND_URL=https://your-backend.onrender.com
FRONTEND_URL=https://your-app.vercel.app

# Optional - For explicit callback URL
GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback

# Required - Environment
NODE_ENV=production
PORT=10000
```

**Important Notes:**
- Render automatically sets `PORT=10000` - keep it as is
- Replace `your-backend.onrender.com` with your actual Render backend URL
- Replace `your-app.vercel.app` with your actual Vercel frontend URL

---

### **2. Vercel Frontend Environment Variables**

Go to your Vercel dashboard → Select your project → Settings → Environment Variables

```bash
# Required - Backend API URL (your Render backend)
VITE_API_URL=https://your-backend.onrender.com
```

**Important:** Replace `your-backend.onrender.com` with your actual Render backend URL

---

## 🔐 Google Cloud Console Setup

### **1. Update Authorized Redirect URIs**

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. Select your OAuth 2.0 Client ID
2. Under **Authorized redirect URIs**, add:
   ```
   https://your-backend.onrender.com/api/auth/google/callback
   http://localhost:5000/api/auth/google/callback
   ```

### **2. Update Authorized JavaScript Origins**

Under **Authorized JavaScript origins**, add:
```
https://your-app.vercel.app
https://your-backend.onrender.com
http://localhost:5000
```

**⚠️ Important:** 
- Use your **actual URLs** (replace the placeholders)
- Changes can take 5-10 minutes to propagate
- Both Render and Vercel URLs must use HTTPS

---

## 🧪 Testing Authentication

### **Test Google Sign-In:**

1. Go to your Vercel URL: `https://your-app.vercel.app`
2. Click "Portal Login" → "Sign in with Google"
3. Complete Google authentication
4. Check browser DevTools:
   - **Network tab:** Look for `Set-Cookie` header in OAuth callback response
   - **Application tab → Cookies:** Should see `sessionId` cookie from Render domain
   - Cookie should have `SameSite=None` and `Secure` flags

### **Test Username/Password Login:**

1. Go to Portal Login
2. Enter username and password
3. Check Network tab for JWT token in response
4. Token should be saved to `localStorage`

---

## 🔍 Troubleshooting

### **Problem: "Cookies not being sent"**

**Solution:**
1. Verify `FRONTEND_URL` on Render matches your exact Vercel URL
2. Check browser DevTools → Application → Cookies
3. Ensure cookies have `SameSite=None` and `Secure=true`
4. Try in Chrome (Safari/Brave block third-party cookies by default)

### **Problem: "redirect_uri_mismatch" error**

**Solution:**
1. Check Google Cloud Console has correct callback URL
2. Verify `BACKEND_URL` on Render is correct
3. URL must match exactly (including https://)
4. Wait 5-10 minutes after changing Google Console settings

### **Problem: "CORS error"**

**Solution:**
1. Verify `FRONTEND_URL` is set correctly on Render
2. Check Render logs for CORS-related errors
3. Ensure Vercel URL matches exactly (no trailing slash)

### **Problem: "Session not persisting"**

**Solution:**
1. Verify `NODE_ENV=production` is set on Render
2. Check that `trust proxy` is enabled (it is now)
3. Ensure your Render app is using HTTPS (free tier includes it)

---

## 🎯 Quick Checklist

- [ ] Set all environment variables on Render
- [ ] Set `VITE_API_URL` on Vercel
- [ ] Update Google OAuth redirect URIs
- [ ] Wait 5-10 minutes for Google changes to propagate
- [ ] Test authentication on your Vercel URL
- [ ] Check browser DevTools for cookies and errors

---

## 📱 How It Works Now

### **Google OAuth Flow:**

1. User clicks "Sign in with Google" on Vercel frontend
2. Frontend redirects to: `https://your-backend.onrender.com/api/auth/google`
3. Render backend redirects to Google for authentication
4. Google redirects back to: `https://your-backend.onrender.com/api/auth/google/callback`
5. Backend creates session and sets cookie with `SameSite=None; Secure`
6. Backend redirects to Vercel frontend with success message
7. Frontend makes authenticated requests with `credentials: 'include'`
8. Browser sends session cookie with each request

### **Username/Password Flow:**

1. User enters credentials on Vercel frontend
2. Frontend sends POST to: `https://your-backend.onrender.com/api/auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores JWT in `localStorage`
5. Frontend includes JWT in `Authorization: Bearer <token>` header for all requests

---

## 🚨 Important Security Notes

1. **Never commit `.env` files** - Use Render/Vercel dashboard for secrets
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -base64 32`
3. **HTTPS required** - Both Render and Vercel enforce HTTPS by default
4. **Session cookies** - Automatically handled by browser (more secure than localStorage)
5. **JWT tokens** - Stored in localStorage (works but less secure than httpOnly cookies)

---

## 📞 Need Help?

If you're still having issues:

1. Check Render logs for errors
2. Check browser DevTools → Console for frontend errors
3. Check Network tab for failed requests
4. Verify all environment variables are set correctly
5. Ensure Google OAuth settings match your URLs exactly

---

## ✅ Success Indicators

You'll know it's working when:

- ✅ No CORS errors in browser console
- ✅ Google OAuth redirects successfully
- ✅ Session cookies appear in DevTools with `SameSite=None; Secure`
- ✅ API requests include cookies/Authorization headers
- ✅ User stays logged in after page refresh
- ✅ Backend logs show successful authentication

---

## 🔄 Development vs Production

**Development (Replit):**
- Uses `sameSite: 'lax'` (same origin)
- HTTP allowed on localhost
- Frontend and backend on same domain (localhost:5000)

**Production (Render + Vercel):**
- Uses `sameSite: 'none'` (cross-domain required)
- HTTPS enforced
- Frontend (Vercel) and backend (Render) on different domains

The code automatically handles these differences based on `NODE_ENV` environment variable.
