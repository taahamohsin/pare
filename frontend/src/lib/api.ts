import { supabase } from "./supabaseClient";

export interface CoverLetter {
  id: string;
  user_id: string;
  template_name: string;
  template_description: string;
  cover_letter_content: string;
  resume_text?: string;
  resume_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  resume_text: string;
  is_default: boolean;
  download_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomPrompt {
  id: string;
  user_id: string | null;
  name: string;
  prompt_text: string;
  is_default: boolean;
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
  resume_id?: string;
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

export async function listResumes(
  limit = 10,
  offset = 0
): Promise<{ data: Resume[]; count: number }> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `/api/resumes?limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch resumes");
  }

  return response.json();
}

export async function getResume(id: string): Promise<Resume> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/resumes?id=${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch resume");
  }

  return response.json();
}

async function getUploadUrl(fileName: string): Promise<{ path: string; signedUrl: string; token: string }> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/resumes/upload-url?fileName=${fileName}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to get upload url");
  }

  return response.json();
}

export async function uploadResume(
  file: File, is_default = false
): Promise<Resume> {
  const token = await getAuthToken();

  if (!token) {
    const base64Content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file: {
          filename: file.name,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          content: base64Content,
          is_default: false,
        },
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to parse resume");
    }

    return response.json();
  }

  try {
    const { path, token: uploadToken } = await getUploadUrl(file.name);

    const { data, error } = await supabase
      .storage
      .from('resumes')
      .uploadToSignedUrl(path, uploadToken, file);

    const { fullPath } = data || {};

    if (error) {
      throw new Error(error.message || "Failed to upload resume");
    }
    const response = await fetch("/api/resumes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        file: {
          filename: file.name,
          original_filename: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: fullPath,
          is_default,
        },
      })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Failed to upload resume");
    }

    return response.json();
  } catch (error) {
    console.error(error)
    throw new Error("Failed to upload resume");
  }
}

export async function deleteResume(id: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/resumes?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete resume");
  }
}

export async function updateResume(id: string, payload: Partial<Resume>): Promise<Resume> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/resumes?id=${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update resume");
  }

  return response.json();
}

export async function listCustomPrompts(): Promise<{ data: CustomPrompt[] }> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/custom-prompts", { headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch custom prompts");
  }

  return response.json();
}

export async function createCustomPrompt(payload: {
  name: string;
  prompt_text: string;
  is_default?: boolean;
}): Promise<CustomPrompt> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch("/api/custom-prompts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to create custom prompt");
  }

  return response.json();
}

export async function updateCustomPrompt(
  id: string,
  payload: Partial<CustomPrompt>
): Promise<CustomPrompt> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/custom-prompts?id=${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to update custom prompt");
  }

  return response.json();
}

export async function deleteCustomPrompt(id: string): Promise<void> {
  const token = await getAuthToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`/api/custom-prompts?id=${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to delete custom prompt");
  }
}

export async function getSystemDefaultPrompt(): Promise<CustomPrompt> {
  const response = await fetch("/api/custom-prompts?default=true");

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch default prompt");
  }

  return response.json();
}

export async function generateCoverLetter(data: {
  jobTitle: string;
  jobDescription: string;
  resumeText: string;
  promptOverride?: string;
}): Promise<string> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch("/api/generate-cover-letter", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to generate cover letter");
  }

  return response.text();
}
