-- Migration: Add resumes table and update cover_letters table

-- Create resumes table
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
  storage_path TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT resumes_filename_length CHECK (char_length(filename) > 0),
  CONSTRAINT resumes_file_size_limit CHECK (file_size > 0 AND file_size <= 52428800), -- 50 MB max
  CONSTRAINT unique_default_per_user UNIQUE (user_id, is_default) WHERE is_default = TRUE
);

-- Create indexes for performance
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at DESC);
CREATE INDEX idx_resumes_user_created ON resumes(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resumes table
CREATE POLICY "Users can view own resumes" ON resumes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" ON resumes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" ON resumes
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" ON resumes
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update trigger for updated_at
CREATE TRIGGER update_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add resume_id column to cover_letters table (nullable for backward compatibility)
ALTER TABLE cover_letters
ADD COLUMN IF NOT EXISTS resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL;

-- Create index for cover_letters.resume_id foreign key lookups
CREATE INDEX IF NOT EXISTS idx_cover_letters_resume_id ON cover_letters(resume_id);

-- Comments for documentation
COMMENT ON TABLE resumes IS 'Stores user uploaded resumes with file metadata and parsed text';
COMMENT ON COLUMN resumes.storage_path IS 'Path in Supabase Storage bucket: {user_id}/{filename}';
COMMENT ON COLUMN resumes.resume_text IS 'Parsed text content from PDF/DOCX file';
COMMENT ON COLUMN resumes.is_default IS 'If true, this resume is auto-selected for new cover letters';
COMMENT ON COLUMN cover_letters.resume_id IS 'Foreign key to resumes table. NULL for legacy cover letters with resume_text';