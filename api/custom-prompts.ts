import { VercelRequest, VercelResponse } from "@vercel/node";
import { AuthenticatedRequest, withAuth, withOptionalAuth } from "./middleware/auth.js";

async function handlePost(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { user, supabase } = req;
        const { name, prompt_text, is_default } = req.body;

        if (!name || !prompt_text) {
            return res.status(400).json({ error: "Name and prompt text are required" });
        }

        if (is_default) {
            await supabase!
                .from("custom_prompts")
                .update({ is_default: false })
                .eq("user_id", user!.id);
        }

        const { data, error } = await supabase!
            .from("custom_prompts")
            .insert({
                user_id: user!.id,
                name,
                prompt_text,
                is_default: !!is_default
            })
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(201).json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

async function handleGet(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { user, supabase } = req;
        const { id, default: isDefault } = req.query;

        if (isDefault === "true" || req.url?.includes("/default")) {
            const { data, error } = await supabase!
                .from("custom_prompts")
                .select("*")
                .is("user_id", null)
                .single();

            if (error || !data) {
                return res.status(404).json({ error: "Default prompt not found" });
            }

            return res.status(200).json(data);
        }

        if (id) {
            const query = supabase!
                .from("custom_prompts")
                .select("*")
                .eq("id", id);

            if (user) {
                query.or(`user_id.eq.${user.id},user_id.is.null`);
            } else {
                query.is("user_id", null);
            }

            const { data, error } = await query.single();

            if (error || !data) {
                return res.status(404).json({ error: "Prompt not found" });
            }

            return res.status(200).json(data);
        } else {
            const query = supabase!
                .from("custom_prompts")
                .select("*")
                .order("created_at", { ascending: false });

            if (user) {
                query.or(`user_id.eq.${user.id},user_id.is.null`);
            } else {
                query.is("user_id", null);
            }

            const { data, error } = await query;

            if (error) {
                return res.status(500).json({ error: error.message });
            }

            return res.status(200).json({ data });
        }
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

async function handlePatch(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { user, supabase } = req;
        const { id } = req.query;
        const { name, prompt_text, is_default } = req.body;

        if (!id) {
            return res.status(400).json({ error: "Prompt ID is required" });
        }

        if (is_default) {

            await supabase!
                .from("custom_prompts")
                .update({ is_default: false })
                .eq("user_id", user!.id);

        }

        const { data, error } = await supabase!
            .from("custom_prompts")
            .update({
                name,
                prompt_text,
                is_default,
            })
            .eq("id", id)
            .eq("user_id", user!.id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data);
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

async function handleDelete(req: AuthenticatedRequest, res: VercelResponse) {
    try {
        const { user, supabase } = req;
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ error: "Prompt ID is required" });
        }

        const { error } = await supabase!
            .from("custom_prompts")
            .delete()
            .eq("id", id)
            .eq("user_id", user!.id);

        if (error) {
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json({ success: true });
    } catch (error: any) {
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
            return withAuth(handlePost)(req, res);
        case "GET":
            return withOptionalAuth(handleGet)(req, res);
        case "PATCH":
            return withAuth(handlePatch)(req, res);
        case "DELETE":
            return withAuth(handleDelete)(req, res);
        default:
            return res.status(405).json({ error: "Method not allowed" });
    }
}
