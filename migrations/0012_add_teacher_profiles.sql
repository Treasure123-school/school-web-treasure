-- Add teacher_profiles table
CREATE TABLE IF NOT EXISTS teacher_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  staff_id VARCHAR(50) UNIQUE,
  subjects INTEGER[] DEFAULT '{}',
  assigned_classes INTEGER[] DEFAULT '{}',
  qualification VARCHAR(100),
  years_of_experience INTEGER DEFAULT 0,
  specialization VARCHAR(200),
  department VARCHAR(100),
  signature_url TEXT,
  grading_mode VARCHAR(50) DEFAULT 'manual',
  notification_preference VARCHAR(50) DEFAULT 'all',
  availability VARCHAR(50),
  first_login BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user_id ON teacher_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_staff_id ON teacher_profiles(staff_id);
