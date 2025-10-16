# 🚨 Production Image Upload Fix - Complete Solution

## Problem
Images upload successfully in Replit development but fail in production (Render + Vercel) with "Delete failed" or "Update failed" errors.

## Root Cause
Supabase Storage RLS (Row Level Security) policies are missing or incorrect. Even though the backend uses `service_role` key (which should bypass RLS), the `storage.objects` table needs explicit policies.

## ✅ Complete Fix (Follow ALL Steps)

### Step 1: Verify Environment Variables in Render

1. Go to **Render Dashboard** → Your Backend Service → Environment
2. Verify these variables exist and are correct:

```bash
SUPABASE_URL=https://vfqssftlihflcfhfzwkm.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJI... (MUST be service_role key, NOT anon key)
```

**How to get the correct keys:**
- Go to [Supabase Dashboard](https://supabase.com/dashboard)
- Select your project (vfqssftlihflcfhfzwkm)
- Click **Settings** → **API**
- Copy `URL` for SUPABASE_URL
- Copy **`service_role` secret** for SUPABASE_SERVICE_KEY (NOT the anon/public key!)

### Step 2: Apply RLS Policies (Choose ONE method)

#### Method A: Automatic (Recommended)
Run this command locally with your production DATABASE_URL:

```bash
DATABASE_URL="your_production_database_url" npm run apply-storage-policies
```

#### Method B: Manual SQL (If automatic fails)
1. Go to **Supabase Dashboard** → SQL Editor
2. Copy the entire content from `supabase-storage-policies.sql` file
3. Paste into SQL Editor
4. Click **Run**
5. Verify you see "9 policies created" message

### Step 3: Verify Configuration

Run the verification script locally:

```bash
SUPABASE_URL="your_url" SUPABASE_SERVICE_KEY="your_service_key" npm run verify-storage
```

This will check:
- ✅ Environment variables are set
- ✅ Using service_role key (not anon key)
- ✅ Buckets are accessible
- ✅ Upload functionality works

### Step 4: Redeploy Production

1. **Render Backend:**
   - Go to Render Dashboard
   - Click **Manual Deploy** → **Deploy latest commit**
   - Wait for deployment to complete

2. **Vercel Frontend:**
   - Should auto-deploy
   - OR manually trigger from Vercel Dashboard

### Step 5: Test in Production

1. Login to production admin: https://treasurehomeschool.vercel.app/portal
2. Go to **Homepage Management**
3. Try uploading a hero image:
   - Select file
   - Add alt text
   - Click Upload
4. Verify image appears and no errors

## 🔍 Troubleshooting

### Issue: "Storage authentication failed" or "Invalid JWT"
**Cause:** Using anon key instead of service_role key

**Fix:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the **service_role** secret (NOT anon/public)
3. Update SUPABASE_SERVICE_KEY in Render
4. Redeploy

### Issue: "Row-level security policy" error
**Cause:** RLS policies not applied

**Fix:**
1. Run `npm run apply-storage-policies` with DATABASE_URL
2. OR manually run SQL from `supabase-storage-policies.sql`

### Issue: "Bucket not found"
**Cause:** Storage buckets not created

**Fix:**
1. Restart Render backend (it creates buckets on startup)
2. OR manually create buckets in Supabase Dashboard → Storage:
   - homepage-images
   - gallery-images
   - profile-images
   - study-resources
   - general-uploads

### Issue: Still not working after all steps
**Diagnostic Steps:**

1. Check Render logs:
   ```
   Look for:
   ✅ Successfully uploaded to Supabase: https://...
   OR
   ❌ Supabase upload error: ...
   ```

2. Run verification locally:
   ```bash
   npm run verify-storage
   ```

3. Check Supabase logs:
   - Supabase Dashboard → Logs → Edge Logs
   - Look for 403 (permission) or 401 (auth) errors

## 📋 Verification Checklist

After completing all steps, verify:

- [ ] SUPABASE_URL is set in Render (not localhost)
- [ ] SUPABASE_SERVICE_KEY is the service_role key (not anon)
- [ ] RLS policies applied (check Supabase Dashboard → Storage → Policies)
- [ ] All 5 buckets exist in Supabase Storage
- [ ] Render backend redeployed successfully
- [ ] Test upload from production works
- [ ] Uploaded images visible on website
- [ ] No errors in Render logs

## 🎯 Why This Happens

**Development (Replit):**
- May use local filesystem (uploads/ folder)
- OR uses Supabase with your local config
- Works because policies might be set or using different storage

**Production (Render + Vercel):**
- MUST use Supabase Storage (no local filesystem)
- Requires explicit RLS policies
- Requires service_role key to bypass RLS

## 🛡️ Security Note

The RLS policies ensure:
- ✅ **Backend only** can upload/update/delete (via service_role key)
- ✅ **Public** can read/view images (anyone can see website images)
- ❌ **No direct browser uploads** (prevents unauthorized file uploads)

All uploads MUST go through your authenticated API endpoints.

## 📞 Support

If issues persist after following ALL steps:

1. Run `npm run verify-storage` and share the output
2. Check Render logs for specific error messages
3. Verify SQL policies were created in Supabase (check Policies tab)
4. Ensure service_role key is correct (not anon key)

---

**Last Updated:** October 16, 2025  
**Status:** Production-ready solution
