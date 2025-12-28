import { VercelRequest, VercelResponse } from "@vercel/node";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import mammoth from "mammoth";
import { AuthenticatedRequest, createAdminSupabase, withAuth, withOptionalAuth } from "./middleware/auth.js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }

    return fullText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    return "";
  }
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    return "";
  }
}


async function handleUpload(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const { user, supabase } = req;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { file } = body;
    const { filename, original_filename, file_size, file_type, storage_path, is_default } = file;

    if (user) {
      const admin = createAdminSupabase();
      const { data: fileData, error: downloadError } = await admin.storage
        .from('resumes')
        .download(storage_path.split('/').slice(1).join('/')); // Remove bucket name from path if present

      let resume_text = "";
      if (!downloadError && fileData) {
        const buffer = Buffer.from(await fileData.arrayBuffer());
        const extension = filename.split('.').pop()?.toLowerCase();

        if (extension === 'pdf') {
          resume_text = await extractTextFromPdf(buffer);
        } else if (extension === 'docx') {
          resume_text = await extractTextFromDocx(buffer);
        }
      } else if (downloadError) {
        console.error("Error downloading file for parsing:", downloadError);
      }

      const { data, error } = await supabase!.from("resumes")
        .insert({
          user_id: user!.id,
          filename,
          original_filename,
          file_size,
          file_type,
          storage_path,
          resume_text,
          is_default,
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data);
    }
    else {
      const { content } = file;
      if (!content) {
        return res.status(400).json({ error: "File content is required for anonymous parsing" });
      }

      const buffer = Buffer.from(content, 'base64');
      const extension = filename.split('.').pop()?.toLowerCase();
      let resume_text = "";

      if (extension === 'pdf') {
        resume_text = await extractTextFromPdf(buffer);
      } else if (extension === 'docx') {
        resume_text = await extractTextFromDocx(buffer);
      }

      return res.json({
        id: 'anonymous-' + Date.now(),
        filename,
        original_filename,
        file_size,
        file_type,
        resume_text,
        is_default: false,
      });
    }
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const { user, supabase } = req;
    const { id, limit = "10", offset = "0" } = req.query;

    if (id) {
      const { data: resume, error } = await supabase!
        .from("resumes")
        .select("*")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();

      if (error || !resume) {
        return res.status(404).json({ error: "Resume not found" });
      }
      const admin = createAdminSupabase();

      const path = resume.storage_path.startsWith('resumes/')
        ? resume.storage_path.split('/').slice(1).join('/')
        : resume.storage_path;

      const { data: signedUrlData, error: signedUrlError } = await admin.storage
        .from("resumes")
        .createSignedUrl(path, 3600); // 1 hour

      if (signedUrlError) {
        console.error("Error generating signed URL:", signedUrlError);
        return res.status(500).json({ error: "Failed to generate download URL" });
      }

      return res.status(200).json({
        ...resume,
        download_url: signedUrlData?.signedUrl || null,
      });
    } else {
      const { data: resumes, error, count } = await supabase!
        .from("resumes")
        .select("*", { count: "exact" })
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        return res.status(500).json({ error: "Failed to fetch resumes" });
      }

      return res.status(200).json({ data: resumes || [], count: count || 0 });
    }
  } catch (error: any) {
    console.error("Get error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const { user, supabase } = req;
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Resume ID is required" });
    }

    const { data: resume, error: fetchError } = await supabase!
      .from("resumes")
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", user!.id)
      .single();

    if (fetchError || !resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    const { error: storageError } = await supabase!.storage.from("resumes").remove([resume.storage_path]);

    if (storageError) {
      console.error("Storage delete error:", storageError);
    }

    const { error: deleteError } = await supabase!.from("resumes").delete().eq("id", id).eq("user_id", user!.id);

    if (deleteError) {
      return res.status(500).json({ error: "Failed to delete resume" });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: error.message });
  }
}

async function handleUpdate(req: AuthenticatedRequest, res: VercelResponse) {
  try {
    const { user, supabase } = req;
    const { id } = req.query;
    const { is_default, resume_text } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Resume ID is required" });
    }

    const updateData: any = {};
    if (typeof is_default === "boolean") {
      updateData.is_default = is_default;
    }
    if (typeof resume_text === "string") {
      updateData.resume_text = resume_text;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update fields provided" });
    }

    if (is_default === true) {
      await supabase!.from("resumes").update({ is_default: false }).eq("user_id", user!.id).eq("is_default", true);
    }
    const { data: resume, error } = await supabase!
      .from("resumes")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user!.id)
      .select()
      .single();

    if (error || !resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    return res.status(200).json(resume);
  } catch (error: any) {
    console.error("Update error:", error);
    return res.status(500).json({ error: error.message });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  switch (req.method) {
    case "POST":
      return withOptionalAuth(handleUpload)(req, res);
    case "GET":
      return withAuth(handleGet)(req, res);
    case "DELETE":
      return withAuth(handleDelete)(req, res);
    case "PATCH":
      return withAuth(handleUpdate)(req, res);
    default:
      return res.status(405).json({ error: "Method not allowed" });
  }
}