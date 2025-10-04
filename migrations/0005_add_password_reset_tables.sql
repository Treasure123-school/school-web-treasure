
-- Add password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address VARCHAR(45),
  reset_by UUID REFERENCES users(id)
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Add password reset attempts table for rate limiting
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id BIGSERIAL PRIMARY KEY,
  identifier VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_password_reset_attempts_identifier ON password_reset_attempts(identifier);
CREATE INDEX idx_password_reset_attempts_attempted_at ON password_reset_attempts(attempted_at);

-- Add recovery email and account locking fields to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP WITH TIME ZONE;

COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with expiry and usage tracking';
COMMENT ON TABLE password_reset_attempts IS 'Tracks password reset attempts for rate limiting and security';
