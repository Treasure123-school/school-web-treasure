
-- Add guardian_name column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_students_guardian_name ON students(guardian_name);
