# 🚀 PRODUCTION IMAGE UPLOAD - COMPLETE FIX

## 🎯 Problem
Images fail to upload in production with errors like:
- "Delete failed" 
- "Update failed"
- "new row violates row-level security policy"

## ✅ GUARANTEED FIX (3 Simple Steps)

### Step 1: Apply RLS Policies in Supabase

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project: `vfqssftlihflcfhfzwkm`

2. **Go to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run SQL**
   - Open the file: `supabase-storage-policies-safe.sql`
   - Copy the ENTIRE content (all 91 lines)
   - Paste into SQL Editor
   - Click **"RUN"** button

4. **Verify Success**
   - You should see output showing 9 policies created
   - Each line should say "✅ Policy created: ..."

### Step 2: Verify Render Environment Variables

Go to **Render Dashboard** → Your Service → **Environment**

**Check these 2 critical variables:**

```bash
SUPABASE_URL=https://vfqssftlihflcfhfzwkm.supabase.co
```

```bash
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**🚨 CRITICAL: Get the RIGHT key!**

1. Go to Supabase Dashboard → Settings → API
2. Find "Project API keys" section
3. Copy the **"service_role"** secret (NOT "anon public"!)
4. Paste as SUPABASE_SERVICE_KEY in Render

**How to tell if you have the RIGHT key:**
- ✅ service_role key starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...`
- ❌ anon key is different and WON'T WORK for backend uploads

### Step 3: Redeploy Render

1. Go to Render Dashboard → Your Service
2. Click **"Manual Deploy"** 
3. Select **"Deploy latest commit"**
4. Wait for deployment to complete (~3-5 minutes)

### Step 4: Test Upload

1. Go to your production admin dashboard
2. Try uploading an image (e.g., homepage hero image)
3. ✅ Should work now!

## 🔍 How to Verify It's Fixed

### Check 1: Policies Exist in Supabase
1. Supabase Dashboard → Storage → Policies
2. You should see 9 policies for `objects` table

### Check 2: Correct Key in Render
1. Render → Environment → SUPABASE_SERVICE_KEY
2. Copy the value
3. Go to: https://jwt.io
4. Paste the token
5. Check "Payload Data" → should show `"role": "service_role"`

### Check 3: Upload Works
1. Production admin dashboard
2. Upload a test image
3. Check it appears on the website

## 🚨 Still Not Working?

### If you see "policy" errors:
→ RLS policies not applied correctly
→ Re-run the SQL from `supabase-storage-policies-safe.sql`

### If you see "authentication failed":
→ Wrong API key in Render
→ Make sure you copied "service_role" (not "anon")

### If you see "bucket not found":
→ Buckets not created in Supabase
→ They should auto-create, but you can create manually:
  - Supabase Dashboard → Storage → Create Bucket
  - Create: `homepage-images`, `gallery-images`, `profile-images`, `study-resources`, `general-uploads`
  - Set all to "Public bucket" = YES

## 📋 Quick Checklist

- [ ] Ran `supabase-storage-policies-safe.sql` in Supabase SQL Editor
- [ ] Saw 9 policies created successfully
- [ ] SUPABASE_URL is correct in Render
- [ ] SUPABASE_SERVICE_KEY is the "service_role" secret in Render
- [ ] Redeployed Render backend
- [ ] Tested image upload in production
- [ ] Image appears on production website

## 🎉 Success!

Once all checkboxes are ✅, your production image uploads will work perfectly!

---

**Need Help?** Share:
1. Screenshot of SQL query results from Supabase
2. Screenshot of Render environment variables (hide the full key value)
3. Error message from browser console (F12 → Console)
