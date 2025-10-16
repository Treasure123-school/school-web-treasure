# ✅ Render Environment Variables Checklist

## Copy-Paste These into Render Dashboard

Go to: **Render Dashboard → Your Service → Environment Tab**

### 1. Basic Configuration
```
NODE_ENV=production
```

### 2. URLs (⚠️ Replace with your actual URLs)
```
FRONTEND_URL=https://your-vercel-app.vercel.app
BACKEND_URL=https://your-render-backend.onrender.com
```

### 3. Database (Should already be set)
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### 4. Security Secrets (⚠️ Generate unique values)
```bash
# Run these commands locally to generate:
openssl rand -base64 48  # Use for JWT_SECRET
openssl rand -base64 48  # Use for SESSION_SECRET
```

Then set:
```
JWT_SECRET=<paste-generated-value-here>
SESSION_SECRET=<paste-generated-value-here>
```

### 5. Supabase Storage (⚠️ Get from Supabase Dashboard)
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6. Google OAuth (⚠️ Get from Google Cloud Console)
```
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxx
```

---

## Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

```
VITE_API_URL=https://your-render-backend.onrender.com
```

---

## Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services → Credentials**
3. Click your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   ```
   https://your-render-backend.onrender.com/api/auth/google/callback
   ```
5. Click **Save**

---

## Verification

After setting all variables in Render:

1. **Check Render Logs** for:
   ```
   ✅ All required environment variables are properly configured!
   ```

2. **Test in Browser**:
   - ✅ No CORS errors in console
   - ✅ Google login works
   - ✅ File uploads work
   - ✅ Dashboard data loads

---

## Total Variables Needed: 10

- [x] NODE_ENV
- [x] FRONTEND_URL
- [x] BACKEND_URL  
- [x] DATABASE_URL
- [x] JWT_SECRET
- [x] SESSION_SECRET
- [x] SUPABASE_URL
- [x] SUPABASE_SERVICE_KEY
- [x] GOOGLE_CLIENT_ID
- [x] GOOGLE_CLIENT_SECRET
