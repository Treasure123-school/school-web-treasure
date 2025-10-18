# Student Profile Update Fix - Documentation

## Problem
Student profile updates were not being persisted to the database when students completed their profile setup through the profile completion flow.

## Root Cause
The `/api/student/profile/setup` endpoint was calling `storage.updateStudent()` incorrectly. The method expects data to be wrapped in `userPatch` and `studentPatch` objects, but the route was passing fields directly.

Additionally, the `students` table was missing the `emergencyPhone` field, and the `emergencyContact` field was too short (20 characters) to accommodate full names.

## Changes Made

### 1. Database Schema Updates (`shared/schema.ts`)
- Added `emergencyPhone` field to students table: `varchar(20)`
- Increased `emergencyContact` field length from `varchar(20)` to `varchar(200)` to accommodate full names

```typescript
export const students = pgTable("students", {
  id: uuid("id").references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  admissionNumber: varchar("admission_number", { length: 50 }).notNull().unique(),
  classId: integer("class_id").references(() => classes.id),
  parentId: uuid("parent_id").references(() => users.id, { onDelete: 'set null' }),
  admissionDate: date("admission_date").defaultNow(),
  emergencyContact: varchar("emergency_contact", { length: 200 }), // UPDATED
  emergencyPhone: varchar("emergency_phone", { length: 20 }), // NEW FIELD
  medicalInfo: text("medical_info"),
  guardianName: varchar("guardian_name", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### 2. API Route Fix (`server/routes.ts`)
Fixed the `/api/student/profile/setup` endpoint to properly structure data for the `updateStudent` method:

```typescript
// Before (INCORRECT):
const updatedStudent = await storage.updateStudent(userId, {
  emergencyContact: profileData.emergencyContact,
  emergencyPhone: profileData.emergencyPhone,
  guardianName: profileData.emergencyContact,
  medicalInfo: bloodGroup ? `Blood Group: ${bloodGroup}` : null,
});

// After (CORRECT):
const updatedStudent = await storage.updateStudent(userId, {
  studentPatch: {
    emergencyContact: emergencyContact || null,
    emergencyPhone: emergencyPhone || null,
    guardianName: emergencyContact || null,
    medicalInfo: bloodGroup ? `Blood Group: ${bloodGroup}` : null,
  }
});
```

## Database Migration

### Development (Replit)
The migration has been applied successfully to the development database using the corrected migration file.

### Production (Supabase)
To apply these changes to your production Supabase database, you can either:

**Option 1: Use the Migration File (Recommended)**
Apply the migration file directly in the Supabase SQL Editor:

```sql
-- From migrations/0005_romantic_darkhawk.sql
ALTER TABLE "students" ALTER COLUMN "emergency_contact" SET DATA TYPE varchar(200);
ALTER TABLE "students" ADD COLUMN "emergency_phone" varchar(20);
```

**Option 2: Run Individual Statements**
If you prefer, run these commands in the Supabase SQL Editor:

```sql
-- 1. Modify emergency_contact column to accommodate full names
ALTER TABLE students ALTER COLUMN emergency_contact TYPE VARCHAR(200);

-- 2. Add emergency_phone column (skip if already exists)
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
```

**Migration File:** `migrations/0005_romantic_darkhawk.sql`

**Note:** The migration file has been cleaned to only include the necessary schema changes. The redundant `profile_skipped` column addition has been removed since it already exists in the database.

## Testing the Fix

### In Development (Replit)
1. Log in as a student who hasn't completed their profile
2. Navigate to the profile setup page
3. Fill in all required fields:
   - Phone number
   - Recovery email
   - Date of birth
   - Gender
   - Blood group
   - Home address
   - Emergency contact name
   - Emergency contact phone
4. Submit the form
5. Verify that all data is saved correctly in the database

### In Production (Vercel Frontend + Render Backend)
1. Apply the SQL migrations to your Supabase production database (see above)
2. Deploy the updated code to Render (backend) and Vercel (frontend)
3. Test the profile setup flow as described above

## Files Modified
1. `shared/schema.ts` - Updated students table schema
2. `server/routes.ts` - Fixed profile setup endpoint
3. `migrations/0005_romantic_darkhawk.sql` - Generated migration file

## Deployment Checklist

### Backend (Render)
- [ ] Ensure latest code is deployed
- [ ] Verify DATABASE_URL environment variable is set correctly
- [ ] Check application logs for any errors

### Frontend (Vercel)
- [ ] Ensure latest code is deployed
- [ ] Verify API endpoint URLs point to Render backend
- [ ] Test profile setup flow end-to-end

### Database (Supabase)
- [ ] Run the SQL migration commands (see above)
- [ ] Verify new columns exist in the `students` table
- [ ] Check that existing data is not affected

## Verification Queries

To verify the changes in your Supabase database:

```sql
-- Check the students table structure
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('emergency_contact', 'emergency_phone');

-- Expected output:
-- emergency_contact | character varying | 200
-- emergency_phone   | character varying | 20
```

## Rollback Plan (If Needed)

If you need to rollback these changes:

```sql
-- Remove the emergency_phone column
ALTER TABLE students DROP COLUMN IF EXISTS emergency_phone;

-- Revert emergency_contact back to varchar(20)
-- WARNING: This will truncate any names longer than 20 characters
ALTER TABLE students ALTER COLUMN emergency_contact TYPE VARCHAR(20);
```

## Additional Notes
- The fix maintains backward compatibility with existing student records
- Students who have already completed their profiles are not affected
- The profile completion flow now correctly saves all user-level and student-level fields
- All changes are persisted in a database transaction to ensure data consistency
