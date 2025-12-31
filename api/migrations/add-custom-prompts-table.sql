-- Custom Prompts Table Migration

CREATE TABLE IF NOT EXISTS public.custom_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT custom_prompts_name_length CHECK (char_length(name) > 0),
  CONSTRAINT custom_prompts_prompt_text_length CHECK (char_length(prompt_text) > 0)
);

CREATE INDEX IF NOT EXISTS idx_custom_prompts_user_id ON public.custom_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_prompts_user_is_default ON public.custom_prompts(user_id, is_default);

ALTER TABLE public.custom_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own custom prompts" ON public.custom_prompts;
DROP POLICY IF EXISTS "Users can create their own custom prompts" ON public.custom_prompts;
DROP POLICY IF EXISTS "Users can update their own custom prompts" ON public.custom_prompts;
DROP POLICY IF EXISTS "Users can delete their own custom prompts" ON public.custom_prompts;

CREATE POLICY "Users can view their own and system prompts"
  ON public.custom_prompts
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create their own custom prompts"
  ON public.custom_prompts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom prompts"
  ON public.custom_prompts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom prompts"
  ON public.custom_prompts
  FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_custom_prompts_updated_at ON public.custom_prompts;
CREATE TRIGGER update_custom_prompts_updated_at
  BEFORE UPDATE ON public.custom_prompts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
