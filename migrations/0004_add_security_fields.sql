-- Migration: Add security and audit fields for secure authentication
-- Created: 2025-10-03

-- Create new enums (ignore if already exists)
CREATE TYPE IF NOT EXISTS user_status AS ENUM ('pending', 'active', 'suspended', 'disabled');
CREATE TYPE IF NOT EXISTS created_via AS ENUM ('bulk', 'invite', 'self', 'google', 'admin');

-- Add new security columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status user_status DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_via created_via DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at timestamp;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip varchar(45);
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret text;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);
CREATE INDEX IF NOT EXISTS users_google_id_idx ON users(google_id);

-- Create invites table for staff onboarding
CREATE TABLE IF NOT EXISTS invites (
  id bigserial PRIMARY KEY,
  token varchar(255) NOT NULL UNIQUE,
  email varchar(255) NOT NULL,
  role_id bigint NOT NULL REFERENCES roles(id),
  created_by uuid NOT NULL REFERENCES users(id),
  expires_at timestamp NOT NULL,
  accepted_at timestamp,
  accepted_by uuid REFERENCES users(id),
  created_at timestamp DEFAULT now()
);

-- Create indexes for invites table
CREATE INDEX IF NOT EXISTS invites_token_idx ON invites(token);
CREATE INDEX IF NOT EXISTS invites_email_idx ON invites(email);

-- Update existing users to have 'active' status
UPDATE users SET status = 'active' WHERE status IS NULL;
UPDATE users SET created_via = 'admin' WHERE created_via IS NULL;
