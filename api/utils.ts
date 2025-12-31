import { GoogleGenAI } from "@google/genai";

export async function generateCoverLetter(jobTitle: string, jobDescription: string, resumeText: string, promptOverride: string) {
  const ai = new GoogleGenAI({});

  const date = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
  const finalPrompt = promptOverride
    .replace(/{jobTitle}/g, jobTitle)
    .replace(/{jobDescription}/g, jobDescription)
    .replace(/{resumeText}/g, resumeText)
    .replace(/{date}/g, date);

  const result = await ai.models.generateContent({
    model: "gemma-3-12b-it",
    contents: finalPrompt
  });
  return result.text;
}
