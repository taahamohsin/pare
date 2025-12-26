import { GoogleGenAI } from "@google/genai";

export async function generateCoverLetter(jobTitle: string, jobDescription: string, resumeText: string) {
  const ai = new GoogleGenAI({});

  const result = await ai.models.generateContent({
    model: "gemma-3-12b-it",
    contents: `You are a ${jobTitle} writing a tailored cover letter.
      Your task is to:
      1. Extract relevant technical signals from the resume text provided.
      2. Align those signals with the ${jobTitle} role and the job description.
      3. Write a concise, technically grounded cover letter.

      CRITICAL OUTPUT REQUIREMENTS:
      - Output MUST be plain text only.
      - Do NOT use Markdown.
      - Do NOT use asterisks, bolding, italics, bullet points, \n, or headings.
      - Do NOT apply special typography, spacing, or stylistic formatting.
      - Write as a normal professional cover letter suitable for PDF or email.

      The cover letter MUST include the following sections in this exact order:
      1. Header block (top-left, plain text, no styling):
        - Hiring Manager or Hiring Team (use "Hiring Manager" if unknown)
        - Company name: ONLY include if explicitly stated in the job description. If not found, SKIP this line entirely. NEVER write "Company name", "[Company Name]", or any placeholder.
        - Company location: ONLY include if city/state are explicitly stated in the job description. If not found, SKIP this line entirely. NEVER write "Company location", "[City, State]", or any placeholder.
        - Today's date ${new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} in MM/DD/YYYY format

      2. Salutation line:
        - "Dear Hiring Manager," or "Dear <Title> Hiring Team,"

      3. Body paragraphs:
        - 2–4 paragraphs forming the main cover letter body
        - The cover letter MUST end with a brief, professional call-to-action inviting the hiring manager to continue the conversation or schedule an interview.

      4. Closing line:
        - "Sincerely," or "Best regards,"

      5. Signature:
        - Candidate full name on its own line in Sentence Case with no blank line between the closing line and the name

      Content constraints:
      - Length: 250–300 words
      - Tone: confident, professional, technical
      - Avoid generic enthusiasm or filler language
      - Reference specific technologies, systems, or projects from the resume
      - Explicitly connect past experience to the job’s responsibilities
      - Do NOT invent experience not supported by the resume
      - If company name or location is not provided, omit those lines cleanly.
      - Do not insert placeholders or brackets.
      Resume:
      ${resumeText}

      Job description:
      ${jobDescription}
    `});
  return result.text;
}
