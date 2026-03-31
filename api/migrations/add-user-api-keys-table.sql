-- Migration: Add user_api_keys table for secure API key storage
-- Description: Stores encrypted user API keys for OpenRouter and other providers
-- Created: 2026-03-25

-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- User API Keys Table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('openrouter', 'gemini')),
  encrypted_api_key BYTEA NOT NULL, -- Encrypted using pgp_sym_encrypt
  model_preference TEXT, -- e.g., 'anthropic/claude-3.5-sonnet'
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Only one active key per provider per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_user_provider
ON public.user_api_keys (user_id, provider, is_active)
WHERE is_active = TRUE;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id
  ON public.user_api_keys(user_id);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider
  ON public.user_api_keys(user_id, provider)
  WHERE is_active = TRUE;

-- Enable Row Level Security
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own API keys"
  ON public.user_api_keys
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API keys"
  ON public.user_api_keys
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
  ON public.user_api_keys
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
  ON public.user_api_keys
  FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update trigger for updated_at column
CREATE OR REPLACE FUNCTION update_user_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_api_keys_updated_at
  BEFORE UPDATE ON public.user_api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_user_api_keys_updated_at();

-- Encryption/Decryption helper functions
-- These are exposed as RPC functions for the backend to call

CREATE OR REPLACE FUNCTION public.encrypt_api_key(plaintext TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(plaintext, key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.decrypt_api_key(encrypted_key BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_key, key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.user_api_keys IS
  'Stores encrypted user API keys for AI providers (OpenRouter, Gemini, etc.)';

COMMENT ON COLUMN public.user_api_keys.encrypted_api_key IS
  'API key encrypted using pgp_sym_encrypt() with ENCRYPTION_KEY env variable';

COMMENT ON COLUMN public.user_api_keys.model_preference IS
  'User preferred model ID for this provider (e.g., anthropic/claude-3.5-sonnet)';

COMMENT ON COLUMN public.user_api_keys.is_active IS
  'Only one active key per provider allowed per user';

COMMENT ON FUNCTION public.encrypt_api_key(TEXT, TEXT) IS
  'Encrypts plaintext API key using pgp_sym_encrypt with provided key';

COMMENT ON FUNCTION public.decrypt_api_key(BYTEA, TEXT) IS
  'Decrypts encrypted API key using pgp_sym_decrypt with provided key';
