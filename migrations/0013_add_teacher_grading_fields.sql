-- Add auto-grading fields to teacher_profiles table
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "auto_grade_theory_questions" boolean DEFAULT false;
ALTER TABLE "teacher_profiles" ADD COLUMN IF NOT EXISTS "theory_grading_instructions" text;
