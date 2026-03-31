import { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenRouter } from '@openrouter/sdk';
import { withAuth, AuthenticatedRequest, createAdminSupabase } from './middleware/auth.js';

interface JDAnalysis {
  technical_skills: string[];
  soft_skills: string[];
  key_responsibilities: string[];
  seniority_level: string;
  company_culture_signals: string[];
  tone_signals: string;
  ats_keywords: string[];
  required_experience_years?: string;
  nice_to_have_skills: string[];
}

const ANALYSIS_PROMPT = `You are an expert recruiter and ATS (Applicant Tracking System) specialist. Analyze the following job description and extract structured information.

Job Description:
{JOB_DESCRIPTION}

Extract and return ONLY valid JSON with the following structure (no markdown, no code blocks, just raw JSON):

{
  "technical_skills": ["skill1", "skill2", ...],
  "soft_skills": ["skill1", "skill2", ...],
  "key_responsibilities": ["responsibility1", "responsibility2", ...],
  "seniority_level": "Junior|Mid-Level|Senior|Staff|Principal|Executive",
  "company_culture_signals": ["signal1", "signal2", ...],
  "tone_signals": "formal|casual|innovative|traditional|collaborative|fast-paced|...",
  "ats_keywords": ["keyword1", "keyword2", ...],
  "required_experience_years": "X-Y years or null",
  "nice_to_have_skills": ["skill1", "skill2", ...]
}

Guidelines:
- technical_skills: Programming languages, frameworks, tools, technologies explicitly mentioned
- soft_skills: Communication, leadership, teamwork, problem-solving, etc.
- key_responsibilities: Main duties and tasks described in the role
- seniority_level: Infer from title, responsibilities, and experience requirements
- company_culture_signals: Values, work style, team structure hints
- tone_signals: Overall writing style - formal/casual, innovative/traditional, etc.
- ats_keywords: Important terms that should appear in resume/cover letter for ATS matching
- required_experience_years: Extract from "X+ years" or "X-Y years experience" mentions
- nice_to_have_skills: Skills listed as "bonus", "preferred", "nice to have", etc.

Be thorough but concise. Extract only what's explicitly stated or strongly implied.`;

async function analyzeWithOpenRouter(
  jobDescription: string,
  apiKey: string
): Promise<JDAnalysis> {
  const openrouter = new OpenRouter({
    apiKey: apiKey
  });

  const prompt = ANALYSIS_PROMPT.replace('{JOB_DESCRIPTION}', jobDescription);

  // Use Claude Haiku for fast, cheap analysis (~$0.0001 per analysis)
  const response = await openrouter.chat.send({
    httpReferer: process.env.APP_URL || 'http://localhost:5173',
    xTitle: 'Pare Job Analysis',
    chatGenerationParams: {
      model: 'anthropic/claude-3-5-haiku',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3, // Low temperature for consistent structured output
      maxTokens: 1000
    }
  });

  const text = response.choices[0]?.message?.content || '';

  // Clean up response - remove markdown code blocks if present
  const cleanedText = text
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const analysis = JSON.parse(cleanedText);
    return analysis;
  } catch (error) {
    console.error('Failed to parse OpenRouter response:', cleanedText);
    throw new Error('Failed to parse job description analysis. Please try again.');
  }
}

async function handler(req: AuthenticatedRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, supabase } = req;
    const { jobDescription } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid jobDescription in request body'
      });
    }

    if (jobDescription.trim().length < 50) {
      return res.status(400).json({
        error: 'Job description is too short. Please provide a detailed job description.'
      });
    }

    // Fetch user's OpenRouter API key
    const { data: apiKeyData, error: keyError } = await supabase!
      .from('user_api_keys')
      .select('encrypted_api_key')
      .eq('user_id', user!.id)
      .eq('provider', 'openrouter')
      .eq('is_active', true)
      .single();

    if (keyError || !apiKeyData) {
      return res.status(403).json({
        error: 'Job description analysis requires an OpenRouter API key. Please add one in your profile settings.'
      });
    }

    // Decrypt API key using admin client
    const adminSupabase = createAdminSupabase();
    const encryptionKey = process.env.ENCRYPTION_KEY;

    if (!encryptionKey) {
      console.error('ENCRYPTION_KEY not set in environment');
      return res.status(500).json({
        error: 'Server configuration error. Please contact support.'
      });
    }

    const { data: decryptedData, error: decryptError } = await adminSupabase
      .rpc('decrypt_api_key', {
        encrypted_key: apiKeyData.encrypted_api_key,
        key: encryptionKey
      });

    if (decryptError || !decryptedData) {
      console.error('Decryption error:', decryptError);
      return res.status(500).json({
        error: 'Failed to decrypt API key. Please try re-adding your key.'
      });
    }

    // Analyze with OpenRouter
    const analysis = await analyzeWithOpenRouter(jobDescription, decryptedData);

    return res.status(200).json({
      success: true,
      data: analysis
    });
  } catch (error: any) {
    console.error('Error analyzing job description:', error);
    return res.status(500).json({
      error: error.message || 'Failed to analyze job description. Please try again.'
    });
  }
}

export default withAuth(handler);
