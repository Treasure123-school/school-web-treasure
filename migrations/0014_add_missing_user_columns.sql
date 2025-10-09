
-- Add missing columns to users table for teacher profile data
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);

-- Add index for national_id lookups
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);

-- Add comment for documentation
COMMENT ON COLUMN users.national_id IS 'National Identification Number (NIN) for teachers and staff';
COMMENT ON COLUMN users.profile_image_url IS 'URL/path to user profile image';
COMMENT ON COLUMN users.recovery_email IS 'Alternative email for password recovery';
