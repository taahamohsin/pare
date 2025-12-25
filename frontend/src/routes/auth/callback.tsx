import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabaseClient";

export const Route = createFileRoute("/auth/callback")({
    beforeLoad: async () => {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
            throw redirect({
                to: "/",
                search: { error: "auth_failed" },
            });
        }

        throw redirect({ to: "/" });
    },

    component: () => <div>Signing you in…</div>,
});
