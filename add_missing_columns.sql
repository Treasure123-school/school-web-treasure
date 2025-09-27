-- Add missing columns to exam_questions table
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS auto_gradable boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS expected_answers text[],
ADD COLUMN IF NOT EXISTS case_sensitive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_partial_credit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS partial_credit_rules text,
ADD COLUMN IF NOT EXISTS explanation_text text,
ADD COLUMN IF NOT EXISTS hint_text text;

-- Add missing columns to student_answers table
ALTER TABLE student_answers
ADD COLUMN IF NOT EXISTS auto_scored boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_override boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback_text text,
ADD COLUMN IF NOT EXISTS partial_credit_reason text;

-- Add missing columns to question_options table
ALTER TABLE question_options
ADD COLUMN IF NOT EXISTS partial_credit_value integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS explanation_text text;

-- CRITICAL FIX: Add missing columns to exam_results table for auto-scoring
ALTER TABLE exam_results
ADD COLUMN IF NOT EXISTS score integer,
ADD COLUMN IF NOT EXISTS max_score integer,
ADD COLUMN IF NOT EXISTS auto_scored boolean DEFAULT false;
