import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

export default async function handler(
    req: VercelRequest,
    res: VercelResponse
) {
    const auth = req.headers.authorization;
    if (!auth) {
        return res.status(401).json({ user: null });
    }

    const token = auth.replace("Bearer ", "");

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
        return res.status(401).json({ user: null });
    }

    return res.status(200).json({
        user: {
            id: data.user.id,
            email: data.user.email,
            provider: data.user.app_metadata.provider,
        },
    });
}
