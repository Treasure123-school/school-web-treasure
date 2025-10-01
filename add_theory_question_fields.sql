
-- Add support for theory questions with instructions and sample answers
ALTER TABLE exam_questions 
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS sample_answer TEXT;

-- Add helpful comment
COMMENT ON COLUMN exam_questions.instructions IS 'Optional instructions for students on how to answer the question';
COMMENT ON COLUMN exam_questions.sample_answer IS 'Sample or model answer for grading reference (not shown to students)';
