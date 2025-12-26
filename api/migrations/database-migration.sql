-- Cover Letters Table Migration

CREATE TABLE IF NOT EXISTS cover_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  cover_letter_content TEXT NOT NULL,
  resume_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT cover_letters_job_title_length CHECK (char_length(job_title) > 0),
  CONSTRAINT cover_letters_job_description_length CHECK (char_length(job_description) > 0),
  CONSTRAINT cover_letters_content_length CHECK (char_length(cover_letter_content) > 0)
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_created ON cover_letters(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can create their own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can update their own cover letters" ON cover_letters;
DROP POLICY IF EXISTS "Users can delete their own cover letters" ON cover_letters;

CREATE POLICY "Users can view their own cover letters"
  ON cover_letters
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cover letters"
  ON cover_letters
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cover letters"
  ON cover_letters
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cover letters"
  ON cover_letters
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_cover_letters_updated_at ON cover_letters;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_cover_letters_updated_at
  BEFORE UPDATE ON cover_letters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

SELECT
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'cover_letters';

SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'cover_letters';
