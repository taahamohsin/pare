import type { VercelResponse } from "@vercel/node";
import { generateCoverLetter } from "./utils.js";
import { AuthenticatedRequest, withOptionalAuth } from "./middleware/auth.js";

async function handleGenerateCoverLetter(
  req: AuthenticatedRequest,
  res: VercelResponse
) {
  const { jobTitle, jobDescription, resumeText } = req.body;
  let { promptOverride } = req.body;
  const { user, supabase } = req;

  try {
    if (!jobTitle || !jobDescription || !resumeText) {
      throw new Error("Missing required fields");
    }

    if (!promptOverride) {
      const query = supabase!
        .from("custom_prompts")
        .select("prompt_text");

      if (user) {
        // Logged in: Fetch user's default or system default
        const { data, error } = await query
          .or(`user_id.is.null,and(user_id.eq.${user.id},is_default.eq.true)`)
          .order("user_id", { ascending: true })
          .limit(1)
          .single();

        if (error || !data) {
          throw new Error("No default prompt set for this user. Please set one in settings.");
        }
        promptOverride = data.prompt_text;
      } else {
        const { data, error } = await query
          .is("user_id", null)
          .single();

        if (error || !data) {
          throw new Error("No default system prompt found. Please sign in to create your own.");
        }
        promptOverride = data.prompt_text;
      }
    }

    const result = await generateCoverLetter(
      jobTitle,
      jobDescription,
      resumeText,
      promptOverride
    );

    return res.status(200).send(result);
  } catch (err: any) {
    if (
      err?.status === 429 ||
      err?.code === 429 ||
      err?.message?.includes("RESOURCE_EXHAUSTED")
    ) {
      return res
        .status(429)
        .json({ error: "Rate limit exceeded. Please try again later." });
    }

    return res.status(500).json({ error: err.message || "Failed to generate cover letter" });
  }
}

export default async function handler(
  req: AuthenticatedRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return withOptionalAuth(handleGenerateCoverLetter)(req, res);
}
