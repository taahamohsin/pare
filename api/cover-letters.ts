import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

interface CoverLetter {
    id: string;
    user_id: string;
    template_name: string;
    template_description: string;
    cover_letter_content: string;
    resume_text?: string;
    created_at: string;
    updated_at: string;
}

export default async function handleListCoverLetters(
    req: VercelRequest,
    res: VercelResponse
) {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const token = auth.replace("Bearer ", "");

    const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        }
    );

    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
        console.error("Auth error:", authError);
        console.error("Auth data:", authData);
        return res.status(401).json({ error: "Unauthorized", details: authError?.message });
    }

    const userId = authData.user.id;

    try {
        switch (req.method) {
            case "GET":
                return handleList(req, res, userId, supabase);
            case "POST":
                return handleCreate(req, res, userId, supabase);
            case "PATCH":
                return handleUpdate(req, res, userId, supabase);
            case "DELETE":
                return handleDelete(req, res, userId, supabase);
            default:
                return res.status(405).json({ error: "Method not allowed" });
        }
    } catch (err: any) {
        console.error("Cover letters API error:", err);
        return res.status(500).json({ error: err.message || "Internal server error" });
    }
}

async function handleList(
    req: VercelRequest,
    res: VercelResponse,
    userId: string,
    supabase: any
) {
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const { count, error: countError } = await supabase
        .from("cover_letters")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

    if (countError) {
        throw new Error("Failed to count cover letters");
    }

    const { data, error } = await supabase
        .from("cover_letters")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        throw new Error("Failed to fetch cover letters");
    }

    return res.status(200).json({
        data: data as CoverLetter[],
        total: count || 0,
    });
}

async function handleCreate(
    req: VercelRequest,
    res: VercelResponse,
    userId: string,
    supabase: any
) {
    const { template_name, template_description, cover_letter_content, resume_text } = req.body;

    if (!template_name || !template_description || !cover_letter_content) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const { data, error } = await supabase
        .from("cover_letters")
        .insert({
            user_id: userId,
            template_name,
            template_description,
            cover_letter_content,
            resume_text: resume_text || null,
        })
        .select()
        .single();

    if (error) {
        throw new Error("Failed to create cover letter");
    }

    return res.status(201).json({ data: data as CoverLetter });
}

async function handleUpdate(
    req: VercelRequest,
    res: VercelResponse,
    userId: string,
    supabase: any
) {
    const id = req.query.id as string;

    if (!id) {
        return res.status(400).json({ error: "Missing cover letter ID" });
    }

    const { template_name, template_description, cover_letter_content } = req.body;

    const updates: Partial<CoverLetter> = {};
    if (template_name !== undefined) updates.template_name = template_name;
    if (template_description !== undefined) updates.template_description = template_description;
    if (cover_letter_content !== undefined) updates.cover_letter_content = cover_letter_content;

    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
    }

    const { data, error } = await supabase
        .from("cover_letters")
        .update(updates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Cover letter not found" });
        }
        throw new Error("Failed to update cover letter");
    }

    return res.status(200).json({ data: data as CoverLetter });
}

async function handleDelete(
    req: VercelRequest,
    res: VercelResponse,
    userId: string,
    supabase: any
) {
    const id = req.query.id as string;

    if (!id) {
        return res.status(400).json({ error: "Missing cover letter ID" });
    }

    const { error } = await supabase
        .from("cover_letters")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        if (error.code === "PGRST116") {
            return res.status(404).json({ error: "Cover letter not found" });
        }
        throw new Error("Failed to delete cover letter");
    }

    return res.status(200).json({ success: true });
}
