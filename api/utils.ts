import { GoogleGenAI } from "@google/genai";
import { OpenRouter } from "@openrouter/sdk";

export interface AIGenerationConfig {
  provider: 'gemini' | 'openrouter';
  apiKey: string;
  model?: string;
}

export interface JDAnalysis {
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

export async function generateCoverLetter(
  jobTitle: string,
  jobDescription: string,
  resumeText: string,
  promptOverride: string,
  config?: AIGenerationConfig,
  jdAnalysis?: JDAnalysis
): Promise<string> {
  const date = new Date().toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });

  let processedPrompt = promptOverride
    .replace(/{jobTitle}/g, jobTitle)
    .replace(/{jobDescription}/g, jobDescription)
    .replace(/{resumeText}/g, resumeText)
    .replace(/{date}/g, date);

  // If JD analysis is provided, enhance the prompt with structured insights
  if (jdAnalysis) {
    const analysisContext = `
STRUCTURED JOB ANALYSIS (Use this to optimize your cover letter for ATS and relevance):

Required Technical Skills: ${jdAnalysis.technical_skills.join(', ')}
Required Soft Skills: ${jdAnalysis.soft_skills.join(', ')}
Key Responsibilities: ${jdAnalysis.key_responsibilities.join('; ')}
Seniority Level: ${jdAnalysis.seniority_level}
${jdAnalysis.required_experience_years ? `Experience Required: ${jdAnalysis.required_experience_years}` : ''}
Company Culture: ${jdAnalysis.company_culture_signals.join(', ')}
Tone Expectation: ${jdAnalysis.tone_signals}
Critical ATS Keywords: ${jdAnalysis.ats_keywords.join(', ')}
${jdAnalysis.nice_to_have_skills.length > 0 ? `Nice-to-Have Skills: ${jdAnalysis.nice_to_have_skills.join(', ')}` : ''}

IMPORTANT: Incorporate these keywords and skills naturally into your cover letter to maximize ATS matching and demonstrate strong fit.
`;

    processedPrompt = analysisContext + '\n\n' + processedPrompt;
  }

  // Use OpenRouter if config provided, otherwise fallback to Gemini
  if (config?.provider === 'openrouter') {
    return generateWithOpenRouter(processedPrompt, config);
  }

  // Fallback: Shared Gemini key
  return generateWithGemini(processedPrompt);
}

async function generateWithGemini(prompt: string): Promise<string> {
  const ai = new GoogleGenAI({});

  const result = await ai.models.generateContent({
    model: "gemma-3-12b-it",
    contents: prompt
  });

  return result.text;
}

async function generateWithOpenRouter(
  prompt: string,
  config: AIGenerationConfig
): Promise<string> {
  const openrouter = new OpenRouter({
    apiKey: config.apiKey,
  });

  const model = config.model || 'anthropic/claude-3.5-sonnet';

  const response = await openrouter.chat.send({
    httpReferer: process.env.APP_URL || 'http://localhost:5173',
    xTitle: 'Pare Cover Letter Generation',
    chatGenerationParams: {
      model,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 2000
    }
  });

  return response.choices[0]?.message?.content || '';
}
