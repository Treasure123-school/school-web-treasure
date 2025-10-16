# Production Image Upload Fix Guide

## 🔍 Problem Diagnosis

Your production environment (Vercel + Render + Supabase) is experiencing image upload failures while development works fine. This is caused by **missing Supabase Storage RLS (Row Level Security) policies**.

## ✅ Root Cause

Even though your backend uses the `SUPABASE_SERVICE_KEY` (which should bypass RLS), Supabase Storage requires explicit RLS policies on the `storage.objects` table for:
- INSERT (uploads)
- SELECT (reading/viewing)
- UPDATE (updating files)
- DELETE (removing files)

## 🛠️ Complete Fix (3 Steps)

### Step 1: Apply Supabase Storage RLS Policies

1. **Go to your Supabase Dashboard** → https://supabase.com/dashboard
2. **Select your project** (vfqssftlihflcfhfzwkm)
3. **Navigate to SQL Editor** (left sidebar)
4. **Copy and paste the SQL from `supabase-storage-policies.sql`**
5. **Click "Run"** to execute the policies

The SQL file contains all necessary policies for:
- `homepage-images`
- `gallery-images`
- `profile-images`
- `study-resources`
- `general-uploads`

### Step 2: Verify Environment Variables

Double-check these are set correctly in **Render Dashboard**:

```bash
SUPABASE_URL=https://vfqssftlihflcfhfzwkm.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG... (your service_role key, NOT anon key)
```

**Important:** Use the `service_role` key, not the `anon` key. Find it in Supabase Dashboard → Settings → API → Project API Keys → `service_role` secret.

### Step 3: Redeploy Your Application

After applying the SQL policies:

1. **Render Backend:**
   - Go to Render Dashboard
   - Click "Manual Deploy" → "Deploy latest commit"
   - OR push a commit to trigger auto-deploy

2. **Vercel Frontend:**
   - Vercel should auto-deploy on git push
   - OR manually trigger deploy from Vercel Dashboard

## 🧪 Testing the Fix

After deploying:

1. **Login to your production admin dashboard:**
   - https://treasurehomeschool.vercel.app/portal
   
2. **Navigate to Homepage Management**

3. **Try uploading a hero image:**
   - Select Content Type: "Hero Image"
   - Choose a file
   - Add alt text
   - Click "Upload"

4. **Check Render logs** for detailed upload information:
   - You should see: `✅ Successfully uploaded to Supabase: https://...`
   - If you see errors, they'll now be much more descriptive

## 🔍 Enhanced Error Logging

The backend now provides detailed logging for troubleshooting:

### Success Logs:
```
🎯 Homepage upload request received: {...}
📦 Using Supabase Storage for upload
📤 Uploading to Supabase: bucket="homepage-images", path="..."
✅ Successfully uploaded to Supabase: https://...
📝 Creating homepage content record in database...
✅ Homepage content created successfully: 123
```

### Error Logs (if issues persist):
```
❌ Bucket "homepage-images" not found or inaccessible
❌ Supabase upload error for "...": {...}
❌ Storage permission denied. Please check Supabase RLS policies
```

## 📋 Verification Checklist

- [ ] SQL policies applied in Supabase SQL Editor
- [ ] All 9 policies show in `storage.objects` policies list
- [ ] `SUPABASE_SERVICE_KEY` is the `service_role` key (not anon)
- [ ] Render backend redeployed
- [ ] Test upload from production admin dashboard
- [ ] Check Render logs for success messages
- [ ] Verify uploaded image appears in gallery

## 🆘 If Issues Persist

### Check Supabase Logs:
1. Supabase Dashboard → Logs → Edge Logs
2. Look for storage-related errors
3. Check for 403 (permission) or 401 (auth) errors

### Check Render Logs:
1. Render Dashboard → Your Service → Logs
2. Look for the detailed error messages we added
3. Share the specific error with your team

### Common Issues:

**Issue:** "Invalid JWT" or "Storage authentication failed"
- **Fix:** Verify `SUPABASE_SERVICE_KEY` is correct (not anon key)

**Issue:** "Storage permission denied" or "row-level security policy"
- **Fix:** Re-run the SQL policies script in Supabase

**Issue:** "Bucket not found"
- **Fix:** Check bucket names in Supabase Storage dashboard match:
  - homepage-images
  - gallery-images
  - profile-images
  - study-resources
  - general-uploads

**Issue:** "Upload failed" with no specific error
- **Fix:** Check file size (must be < 5MB for images, < 10MB for documents)

## 📸 Screenshots & Evidence

After fixing, you should see:

1. **Supabase Dashboard → Storage → homepage-images:**
   - New uploaded files appearing in real-time

2. **Production Website:**
   - New hero image visible immediately
   - Gallery images displaying correctly

3. **Render Logs:**
   - Green checkmarks (✅) for successful uploads
   - No red X's (❌) for errors

## 🔄 Syncing Development & Production

**Why development works but production doesn't:**

1. **Development** uses local filesystem (`uploads/` folder) - no Supabase
2. **Production** uses Supabase Storage - requires RLS policies

Both share the same PostgreSQL database, so once images are uploaded to Supabase in development, they won't appear in production because the URLs point to different storage locations.

**Best Practice:**
- Always test in production after making changes
- Use the same storage backend in both environments (Supabase)
- Consider setting `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in Replit development environment variables

## 📞 Support

If you need further assistance:
1. Check Render logs for the new detailed error messages
2. Verify SQL policies were applied successfully
3. Contact Supabase support if storage-specific issues persist
4. Review this guide's troubleshooting section

## ✨ Expected Outcome

After following this guide:
- ✅ Homepage hero images upload successfully
- ✅ Gallery images upload successfully  
- ✅ Profile images upload successfully
- ✅ All uploads persist in Supabase Storage
- ✅ Images display correctly on production website
- ✅ Development and production parity maintained

---

**Last Updated:** October 16, 2025
**Status:** Ready for production deployment
