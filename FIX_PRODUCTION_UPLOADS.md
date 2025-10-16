# 🚀 Fix Production Image Uploads - 3 SIMPLE STEPS

**Problem:** Images fail to upload in production  
**Cause:** Missing storage policies + wrong API key  
**Time to fix:** 5 minutes

---

## ✅ Step 1: Apply Storage Policies (2 minutes)

### What to do:
1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Open file: `supabase-storage-policies-safe.sql` (in this project)
6. **Copy EVERYTHING** from that file
7. **Paste** into Supabase SQL Editor
8. Click **RUN**
9. ✅ You should see "9 policies created"

**Verify it worked:**
```sql
-- Run this in Supabase SQL Editor:
SELECT COUNT(*) FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';
-- Should return: 9
```

---

## ✅ Step 2: Fix API Key in Render (2 minutes)

### Get the CORRECT key from Supabase:
1. Supabase Dashboard → **Settings** → **API**
2. Find "Project API keys" section
3. Look for **"service_role"** (NOT "anon public")
4. Click **"Copy"** next to service_role secret

### Update Render:
1. Render Dashboard → Your Service → **Environment**
2. Find `SUPABASE_SERVICE_KEY`
3. **Replace** the value with the service_role key you just copied
4. Click **Save Changes**

**⚠️ CRITICAL:** 
- ✅ Use: `service_role` secret (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz...`)
- ❌ DON'T use: `anon public` key (this won't work!)

---

## ✅ Step 3: Redeploy (1 minute)

1. Render Dashboard → Your Service
2. Click **Manual Deploy**
3. Select **Deploy latest commit**
4. Wait ~3 minutes for deployment

---

## 🧪 Test It Works

1. Go to your **production admin dashboard**
2. Navigate to **Homepage Images** or **Gallery**
3. **Upload a test image**
4. ✅ Should upload successfully!
5. Check the image appears on your **public website**

---

## 🔍 Quick Verification Commands

### Check policies exist (Supabase SQL Editor):
```sql
-- Run: check-production-storage.sql
-- Should show 9 policies + 5 buckets
```

### Check you have the right key:
1. Copy your SUPABASE_SERVICE_KEY from Render
2. Go to https://jwt.io
3. Paste the key
4. Check decoded payload shows: `"role": "service_role"` ✅

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Policy violation" error | Re-run SQL from `supabase-storage-policies-safe.sql` |
| "Authentication failed" | Check you used service_role key (not anon) |
| "Bucket not found" | Create buckets in Supabase Storage (make them Public) |
| Still not working | Run `check-production-storage.sql` and share results |

---

## 📁 Files You Need

1. **`supabase-storage-policies-safe.sql`** ← Run this in Supabase SQL Editor
2. **`check-production-storage.sql`** ← Use to verify setup
3. **`PRODUCTION_FIX_STEPS.md`** ← Detailed guide (if needed)

---

## ✨ Done!

After completing all 3 steps:
- ✅ 9 RLS policies applied
- ✅ Correct service_role key in Render
- ✅ Production redeployed
- ✅ Image uploads working

**Your production should now work perfectly!** 🎉
