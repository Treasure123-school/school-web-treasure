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
