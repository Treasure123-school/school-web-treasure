
-- Seed default academic terms for 2024/2025 academic year
INSERT INTO academic_terms (name, year, start_date, end_date, is_current) VALUES
  ('First Term', '2024/2025', '2024-09-01', '2024-12-15', true),
  ('Second Term', '2024/2025', '2025-01-06', '2025-04-10', false),
  ('Third Term', '2024/2025', '2025-04-21', '2025-07-18', false)
ON CONFLICT DO NOTHING;
