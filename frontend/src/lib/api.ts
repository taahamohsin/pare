import { supabase } from "./supabaseClient";

export interface CoverLetter {
  id: string;
  user_id: string;
  template_name: string;
  template_description: string;
  cover_letter_content: string;
  resume_text?: string;
  created_at: string;
  updated_at: string;
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export async function listCoverLetters(
  limit = 10,
  offset = 0
): Promise<{ data: CoverLetter[]; total: number }> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `/api/cover-letters?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch cover letters");
  }

  return response.json();
}

export async function createCoverLetter(payload: {
  template_name: string;
  template_description: string;
  cover_letter_content: string;
  resume_text?: string;
}): Promise<CoverLetter> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/cover-letters", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to save cover letter");
  }

  const result = await response.json();
  return result.data;
}

export async function updateCoverLetter(
  id: string,
  payload: Partial<
    Pick<CoverLetter, "template_name" | "template_description" | "cover_letter_content">
  >
): Promise<CoverLetter> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/cover-letters?id=${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update cover letter");
  }

  const result = await response.json();
  return result.data;
}

export async function deleteCoverLetter(id: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/cover-letters?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete cover letter");
  }
}
