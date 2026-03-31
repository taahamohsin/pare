import type { VercelRequest, VercelResponse } from "@vercel/node";

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

// Recommended models for cover letter generation
const RECOMMENDED_MODELS = [
  'anthropic/claude-3.5-sonnet',
  'anthropic/claude-3-opus',
  'anthropic/claude-3-haiku',
  'openai/gpt-4-turbo',
  'openai/gpt-4o',
  'google/gemini-pro-1.5',
  'meta-llama/llama-3.1-70b-instruct',
  'meta-llama/llama-3.1-405b-instruct'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch models from OpenRouter');
    }

    const data = await response.json();

    // Filter to recommended models for cover letter generation
    const models = data.data
      .filter((m: OpenRouterModel) => RECOMMENDED_MODELS.includes(m.id))
      .map((m: OpenRouterModel) => ({
        id: m.id,
        name: m.name,
        pricing: m.pricing,
        context_length: m.context_length
      }))
      .sort((a: OpenRouterModel, b: OpenRouterModel) => {
        // Sort by recommended order
        return RECOMMENDED_MODELS.indexOf(a.id) - RECOMMENDED_MODELS.indexOf(b.id);
      });

    // Set cache headers (cache for 1 hour)
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');

    return res.status(200).json({ data: models });
  } catch (error: any) {
    console.error('Error fetching OpenRouter models:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch models from OpenRouter'
    });
  }
}
