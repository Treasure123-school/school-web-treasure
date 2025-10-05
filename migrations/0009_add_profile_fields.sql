
-- Add missing profile and security fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Nigeria',
ADD COLUMN IF NOT EXISTS security_question VARCHAR(255),
ADD COLUMN IF NOT EXISTS security_answer_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS data_policy_agreed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_policy_agreed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_state ON users(state);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
