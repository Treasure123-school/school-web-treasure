
-- Add the missing auto_scored column to exam_results table
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS auto_scored BOOLEAN DEFAULT false;

-- Update existing records to set auto_scored based on recorded_by field
UPDATE exam_results 
SET auto_scored = true 
WHERE recorded_by = '00000000-0000-0000-0000-000000000001';

-- Add missing columns that might also be needed
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS score INTEGER;

ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS max_score INTEGER;

-- Update score and max_score from existing data if they're null
UPDATE exam_results 
SET score = marks_obtained 
WHERE score IS NULL AND marks_obtained IS NOT NULL;
