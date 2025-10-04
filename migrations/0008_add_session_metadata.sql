
-- Add metadata column to exam_sessions for storing violation data and other session info
ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS metadata TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN exam_sessions.metadata IS 'JSON string containing violation count, penalty marks, and other session metadata';
