
-- Add teacher-in-charge and timer mode fields to exams table
ALTER TABLE exams ADD COLUMN IF NOT EXISTS teacher_in_charge_id UUID REFERENCES users(id);
ALTER TABLE exams ADD COLUMN IF NOT EXISTS timer_mode VARCHAR(20) DEFAULT 'individual';

-- Add check constraint for timer_mode
ALTER TABLE exams ADD CONSTRAINT timer_mode_check 
  CHECK (timer_mode IN ('global', 'individual'));

-- Add index for teacher assignments
CREATE INDEX IF NOT EXISTS exams_teacher_in_charge_idx ON exams(teacher_in_charge_id);

-- Comments for clarity
COMMENT ON COLUMN exams.teacher_in_charge_id IS 'Teacher responsible for this exam and its grading';
COMMENT ON COLUMN exams.timer_mode IS 'global: fixed start/end times for all students, individual: duration per student';
