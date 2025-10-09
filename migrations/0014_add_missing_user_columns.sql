
-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_national_id ON users(national_id);
