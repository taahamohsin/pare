-- Migration: Rename job fields to template fields
-- This migration renames job_title and job_description to template_name and template_description

ALTER TABLE cover_letters
  RENAME COLUMN job_title TO template_name;

ALTER TABLE cover_letters
  RENAME COLUMN job_description TO template_description;

ALTER TABLE cover_letters
  DROP CONSTRAINT IF EXISTS cover_letters_job_title_length;

ALTER TABLE cover_letters
  DROP CONSTRAINT IF EXISTS cover_letters_job_description_length;

ALTER TABLE cover_letters
  ADD CONSTRAINT cover_letters_template_name_length
  CHECK (char_length(template_name) > 0);

ALTER TABLE cover_letters
  ADD CONSTRAINT cover_letters_template_description_length
  CHECK (char_length(template_description) > 0);

SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'cover_letters'
  AND table_schema = 'public'
ORDER BY ordinal_position;
