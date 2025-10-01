
-- Add manual_scores table for teacher grading
CREATE TABLE IF NOT EXISTS manual_scores (
  id BIGSERIAL PRIMARY KEY,
  answer_id BIGINT NOT NULL REFERENCES student_answers(id) ON DELETE CASCADE,
  grader_id UUID NOT NULL REFERENCES users(id),
  awarded_marks INTEGER NOT NULL DEFAULT 0,
  comment TEXT,
  graded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(answer_id)
);

-- Add performance_events table for monitoring
CREATE TABLE IF NOT EXISTS performance_events (
  id BIGSERIAL PRIMARY KEY,
  session_id INTEGER REFERENCES exam_sessions(id),
  event_type VARCHAR(50) NOT NULL,
  duration INTEGER, -- in milliseconds
  metadata JSONB,
  user_id UUID REFERENCES users(id),
  client_side BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_manual_scores_answer_id ON manual_scores(answer_id);
CREATE INDEX IF NOT EXISTS idx_manual_scores_grader_id ON manual_scores(grader_id);
CREATE INDEX IF NOT EXISTS idx_performance_events_session_id ON performance_events(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_events_event_type ON performance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_performance_events_created_at ON performance_events(created_at);

-- Add exam result fields for enhanced reporting
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS auto_scored BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS breakdown JSONB,
ADD COLUMN IF NOT EXISTS question_details JSONB;

-- Add fields to track exam session metadata
ALTER TABLE exam_sessions 
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

-- Update exam_results table to include score and maxScore
ALTER TABLE exam_results 
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS max_score INTEGER;
