import { VercelRequest, VercelResponse } from "@vercel/node";
import { AuthenticatedRequest, createAdminSupabase, withAuth } from "../middleware/auth.js";

async function handleGetUploadUrl(req: AuthenticatedRequest, res: VercelResponse) {
    const { user } = req;
    const fileName = req.query.fileName as string;

    if (!fileName) {
        return res.status(400).json({ error: "fileName is required" });
    }

    try {
        const admin = createAdminSupabase();

        const { data: existingFiles, error: listError } = await admin.storage
            .from('resumes')
            .list(user.id);

        if (listError) {
            throw new Error(listError.message);
        }

        let finalFileName = fileName;
        const fileNames = new Set(existingFiles?.map(f => f.name) || []);

        if (fileNames.has(finalFileName)) {
            const dotIndex = fileName.lastIndexOf('.');
            const baseName = dotIndex !== -1 ? fileName.substring(0, dotIndex) : fileName;
            const extension = dotIndex !== -1 ? fileName.substring(dotIndex) : '';

            let counter = 1;
            while (fileNames.has(`${baseName} (${counter})${extension}`)) {
                counter++;
            }
            finalFileName = `${baseName} (${counter})${extension}`;
        }

        const { data, error } = await admin.storage
            .from('resumes')
            .createSignedUploadUrl(`${user.id}/${finalFileName}`, { upsert: true });

        if (error) {
            throw new Error(error.message);
        }

        return res.status(200).json({
            ...data,
            fileName: finalFileName
        });
    } catch (e: any) {
        return res.status(500).json({ error: e.message });
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    switch (req.method) {
        case "GET":
            return withAuth(handleGetUploadUrl)(req, res);

        default:
            return res.status(405).json({ error: "Method not allowed" });
    }
}