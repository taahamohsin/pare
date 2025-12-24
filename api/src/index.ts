import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateCoverLetter } from "./utils.js";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { jobTitle, jobDescription, resumeText } = req.body;

  if (!jobTitle || !jobDescription || !resumeText) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const result = await generateCoverLetter(
      jobTitle,
      jobDescription,
      resumeText
    );

    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error generating cover letter:", error);

    if (
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
    }

    return res
      .status(500)
      .json({ error: "Failed to generate cover letter" });
  }
}
