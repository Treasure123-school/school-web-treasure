# Production Deployment Guide - Profile Skip Feature Fix

## Issue Fixed
**Critical Bug**: Students and parents were unable to login due to missing database columns (`profile_skipped`, `profile_completed`, `profile_completion_percentage`).

## Status
✅ **Fixed in Development** - All tests passing, login working correctly

---

## Required Production Migrations

### 1. Supabase Database Migration (CRITICAL - DO THIS FIRST)

#### Option A: Via Supabase SQL Editor (Recommended)
1. Log into your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query and paste the following SQL:

```sql
-- Add profile completion columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_skipped BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Update existing users to have default values
UPDATE users 
SET profile_completed = COALESCE(profile_completed, false),
    profile_skipped = COALESCE(profile_skipped, false),
    profile_completion_percentage = COALESCE(profile_completion_percentage, 0)
WHERE profile_completed IS NULL OR profile_skipped IS NULL OR profile_completion_percentage IS NULL;
```

4. Click **Run** to execute
5. Verify the columns were created:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('profile_completed', 'profile_skipped', 'profile_completion_percentage')
ORDER BY column_name;
```

Expected output:
- `profile_completed` | boolean | false
- `profile_completion_percentage` | integer | 0
- `profile_skipped` | boolean | false

#### Option B: Via Command Line
If you have Supabase CLI configured:

```bash
# Using psql with your production DATABASE_URL
psql $DATABASE_URL -f add-profile-columns.sql
```

---

### 2. Render Backend Deployment

The code changes are already in your repository. Simply:

1. **Merge/Push your changes** to your main branch
2. Render will automatically detect the changes and redeploy
3. **Verify deployment logs** show no errors
4. Test login immediately after deployment

**Critical**: The database migration MUST be complete before the backend deploys, or you'll get the same login errors in production.

---

### 3. Vercel Frontend Deployment

No frontend changes needed - the frontend already has the correct code.

1. Vercel will auto-deploy when you push to main
2. No special configuration required
3. Verify the site loads correctly after deployment

---

## Testing Checklist (Production)

After deployment, verify the following:

### 1. Student Login
- [ ] Navigate to `/login`
- [ ] Use a student account (format: `THS-STU-2025-XXX-###`)
- [ ] Verify successful login
- [ ] Dashboard loads without errors

### 2. Parent Login
- [ ] Navigate to `/login`
- [ ] Use a parent account
- [ ] Verify successful login
- [ ] Dashboard loads without errors

### 3. Profile Skip Feature
- [ ] Login as a new student
- [ ] Navigate to profile setup page
- [ ] Click "Skip for now"
- [ ] Verify you're redirected to dashboard
- [ ] Verify limited features message appears
- [ ] Verify profile can be completed later from settings

### 4. Student Creation
- [ ] Login as admin
- [ ] Navigate to student management
- [ ] Create a new student
- [ ] Verify no errors occur
- [ ] Verify student record is created with correct defaults

---

## Rollback Plan (If Needed)

If issues occur after production deployment:

### Rollback Database Changes:
```sql
-- Only run if you need to undo the migration
ALTER TABLE users 
DROP COLUMN IF EXISTS profile_completed,
DROP COLUMN IF EXISTS profile_skipped,
DROP COLUMN IF EXISTS profile_completion_percentage;
```

### Rollback Code Changes:
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

---

## Environment-Specific Notes

### Development (Replit)
✅ Already fixed and tested

### Production
- **Frontend**: Vercel (no changes needed, will auto-deploy)
- **Backend**: Render (will auto-deploy from git)
- **Database**: Supabase (requires manual migration via SQL editor)

---

## Summary of Changes

### Database Schema
- Added `profile_completed` column (boolean, default: false)
- Added `profile_skipped` column (boolean, default: false)  
- Added `profile_completion_percentage` column (integer, default: 0)

### Code Changes
- Fixed 2 instances of `storage.getUserById()` to `storage.getUser()` in `server/routes.ts`
  - Line 6007: `/api/student/profile/status` endpoint
  - Line 6101: `/api/student/profile/skip` endpoint

---

## Support

If you encounter issues during production deployment:

1. **Check Render Logs**: Look for database connection or query errors
2. **Check Supabase Logs**: Verify the migration completed successfully
3. **Verify Environment Variables**: Ensure `DATABASE_URL` points to production database
4. **Test Individual Endpoints**: Use Postman/curl to test `/api/auth/login` directly

---

## Security Considerations

✅ All default values are safe (false for booleans, 0 for integer)
✅ No existing data is modified destructively
✅ Backward compatible with existing user records
✅ No sensitive data exposed in logs

---

**Deployment Order (IMPORTANT)**:
1. ✅ Run Supabase migration FIRST
2. ✅ Deploy backend to Render
3. ✅ Deploy frontend to Vercel (auto)
4. ✅ Test all critical flows

**Estimated Downtime**: < 1 minute (during database migration)

---

Generated: $(date)
Status: Ready for Production Deployment
