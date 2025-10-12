-- Add settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
  id bigserial PRIMARY KEY,
  key varchar(100) NOT NULL UNIQUE,
  value text NOT NULL,
  description text,
  data_type varchar(20) NOT NULL DEFAULT 'string',
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS settings_key_idx ON settings(key);

-- Add counters table for atomic sequence generation
CREATE TABLE IF NOT EXISTS counters (
  id bigserial PRIMARY KEY,
  class_code varchar(50) NOT NULL,
  year varchar(9) NOT NULL,
  sequence integer NOT NULL DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(class_code, year)
);

CREATE UNIQUE INDEX IF NOT EXISTS counters_class_year_idx ON counters(class_code, year);

-- Insert default settings
INSERT INTO settings (key, value, description, data_type)
VALUES ('allow_student_self_registration', 'true', 'Enable or disable student self-registration feature', 'boolean')
ON CONFLICT (key) DO NOTHING;
