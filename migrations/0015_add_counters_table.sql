
-- Counter table for generating sequential usernames safely
CREATE TABLE IF NOT EXISTS class_counters (
  id BIGSERIAL PRIMARY KEY,
  class_code VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  seq INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (class_code, year)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_class_counters_lookup ON class_counters(class_code, year);

-- Add comment
COMMENT ON TABLE class_counters IS 'Atomic counter for generating sequential student usernames per class and year';
