# Google OAuth Production Issues - Root Cause & Fix

## 🔍 Root Cause Analysis

### Issue 1: Database-Level Restriction (CODE)
The system intentionally restricts Google OAuth to:
- ✅ Users with `teacher` or `admin` roles  
- ✅ Users with `active` status
- ❌ Blocks students, parents, pending, suspended, or disabled accounts

**Why only treasurehomeschool@gmail.com works:**
- In production database: only this email exists with teacher/admin role + active status
- In development: you likely have test users with proper roles
- Other emails either don't exist OR have wrong role/status in production

### Issue 2: Google Cloud Console Configuration
Your OAuth app might be in **Testing mode** which restricts sign-ins to test users only.

---

## 🛠️ FIXES REQUIRED

### Fix 1: Add Users to Production Database (If Needed)
If you want other staff members to sign in with Google:

1. Go to your production admin dashboard
2. Create user accounts with:
   - Role: `Teacher` or `Admin`
   - Status: `Active`
   - Email: Their Google email address

### Fix 2: Google Cloud Console Setup ⚠️ CRITICAL

**Go to:** https://console.cloud.google.com/apis/credentials

#### Step 1: Verify OAuth Consent Screen Status
1. Click on "OAuth consent screen" (left sidebar)
2. **Check Publishing Status:**
   - If it says **"Testing"**: Only test users can sign in
   - It should say **"In Production"** or **"Published"**

#### Step 2: Add Test Users (If in Testing mode)
If your app is in Testing mode and you want to keep it that way:
1. Scroll down to "Test users"
2. Click "+ ADD USERS"
3. Add the Google email addresses that need access
4. Click "SAVE"

#### Step 3: Publish App (Recommended for Production)
To allow any Google account to sign in:
1. Click "PUBLISH APP" button
2. Confirm publishing
3. **Note:** You may need to complete verification if using sensitive scopes

#### Step 4: Verify Authorized Redirect URIs
1. Go to "Credentials" tab
2. Click your OAuth 2.0 Client ID
3. Under **"Authorized redirect URIs"**, ensure you have:
   ```
   https://treasure-home-backend.onrender.com/api/auth/google/callback
   ```
4. Under **"Authorized JavaScript origins"**, ensure you have:
   ```
   https://treasurehomeschool.vercel.app
   https://treasure-home-backend.onrender.com
   ```

---

## 🎯 Recommended Solution

**For Production (Public School System):**
1. ✅ Publish your OAuth consent screen to allow any Google account
2. ✅ Keep the code restriction (only allow teacher/admin roles with active status)
3. ✅ New teachers sign in with Google → they get marked as "requiresApproval" → Admin approves them in dashboard

**This provides:**
- ✅ Security: Only approved staff can access the system
- ✅ Convenience: Teachers can use Google sign-in
- ✅ Control: Admin approves new accounts before granting access

---

## 🧪 Testing After Fixes

1. **Test User Creation:**
   - Create a teacher account in production with a different Gmail
   - Set role to "Teacher" and status to "Active"
   - Try signing in with Google OAuth

2. **Test OAuth Consent:**
   - Use an email NOT in your test users list
   - Verify it can reach the OAuth consent screen
   - Check if login succeeds (if user exists in database) or shows approval message

---

## 📝 Summary

The restriction is **intentional and secure**. To fix:
1. Publish your Google OAuth app (remove from Testing mode)
2. Add users to production database with teacher/admin roles
3. Verify authorized redirect URIs are correct
