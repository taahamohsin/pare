import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { supabase } from "@/lib/supabaseClient";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type GeminiErrorCategory = "rate_limit" | "other";

export function classifyGeminiError(error: unknown): GeminiErrorCategory {
  if (typeof error !== "object" || error === null) {
    return "other";
  }

  const err = error as {
    status?: number;
    code?: number | string;
    message?: string;
  };

  // Gemini / Google APIs consistently use 429 for rate limiting
  if (err.status === 429 || err.code === 429) {
    return "rate_limit";
  }

  // Fallback: some SDKs surface the code as a string
  if (typeof err.code === "string" && err.code.includes("RESOURCE_EXHAUSTED")) {
    return "rate_limit";
  }

  return "other";
}

export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
}
