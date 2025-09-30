
-- Add missing columns to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_type VARCHAR(20) DEFAULT 'exam';
ALTER TABLE exams ADD COLUMN IF NOT EXISTS time_limit INTEGER;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS instructions TEXT;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS allow_retakes BOOLEAN DEFAULT false;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS shuffle_questions BOOLEAN DEFAULT false;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS auto_grading_enabled BOOLEAN DEFAULT true;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS instant_feedback BOOLEAN DEFAULT false;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_correct_answers BOOLEAN DEFAULT false;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS passing_score INTEGER;
ALTER TABLE exams ADD COLUMN IF NOT EXISTS grading_scale TEXT DEFAULT 'standard';

-- Add check constraint for exam_type
ALTER TABLE exams ADD CONSTRAINT exam_type_check 
  CHECK (exam_type IN ('test', 'exam'));

-- Create enum type if it doesn't exist (for future use)
DO $$ BEGIN
  CREATE TYPE exam_type_enum AS ENUM ('test', 'exam');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
