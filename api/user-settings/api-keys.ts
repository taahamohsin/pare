import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth, AuthenticatedRequest, createAdminSupabase } from "../middleware/auth.js";

interface UserApiKey {
  id: string;
  user_id: string;
  provider: 'openrouter' | 'gemini';
  encrypted_api_key: Buffer;
  model_preference?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Validate OpenRouter API key format
function validateOpenRouterKey(key: string): boolean {
  return key.startsWith('sk-or-') && key.length > 20;
}

async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
  const { user, supabase } = req;

  try {
    const { data, error } = await supabase!
      .from('user_api_keys')
      .select('id, provider, model_preference, is_active, created_at, updated_at')
      .eq('user_id', user!.id)
      .eq('is_active', true);

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch API keys' });
    }

    return res.status(200).json({ data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch API keys' });
  }
}

async function handlePost(req: AuthenticatedRequest, res: VercelResponse) {
  const { user, supabase } = req;
  const { provider, api_key, model_preference } = req.body;

  try {
    if (!provider || !api_key) {
      return res.status(400).json({ error: 'Missing required fields: provider and api_key' });
    }

    if (provider === 'openrouter' && !validateOpenRouterKey(api_key)) {
      return res.status(400).json({
        error: 'Invalid OpenRouter API key format. Key should start with "sk-or-"'
      });
    }

    // Deactivate existing keys for this provider
    await supabase!
      .from('user_api_keys')
      .update({ is_active: false })
      .eq('user_id', user!.id)
      .eq('provider', provider);

    // Encrypt the API key using PostgreSQL pgcrypto
    const adminSupabase = createAdminSupabase();
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      return res.status(500).json({ error: 'Server encryption key not configured' });
    }

    const { data: encryptedData, error: encryptError } = await adminSupabase
      .rpc('encrypt_api_key', {
        plaintext: api_key,
        key: encryptionKey
      });

    if (encryptError || !encryptedData) {
      console.error('Encryption error:', encryptError);
      return res.status(500).json({ error: 'Failed to encrypt API key' });
    }

    const { data, error } = await supabase!
      .from('user_api_keys')
      .insert({
        user_id: user!.id,
        provider,
        encrypted_api_key: encryptedData,
        model_preference,
        is_active: true
      })
      .select('id, provider, model_preference, is_active, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to save API key' });
    }

    return res.status(201).json({
      data,
      message: 'API key saved successfully'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to save API key' });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse) {
  const { user, supabase } = req;
  const { id } = req.query;

  try {
    if (!id) {
      return res.status(400).json({ error: 'Missing key ID' });
    }

    const { error } = await supabase!
      .from('user_api_keys')
      .delete()
      .eq('id', id as string)
      .eq('user_id', user!.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete API key' });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete API key' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  switch (req.method) {
    case 'GET':
      return withAuth(handleGet)(req, res);
    case 'POST':
      return withAuth(handlePost)(req, res);
    case 'DELETE':
      return withAuth(handleDelete)(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}
