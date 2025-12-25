import { IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

async function signInWithGitHub() {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo },
    });

    if (error) throw error;
}

export default function SignInButton() {
    return (
        <Button
            onClick={signInWithGitHub}
            icon={<IconBrandGithub className="text-black size-4" />}
            className="bg-zinc-100 text-black hover:bg-white hover:scale-[1.02] transition-all border-none font-semibold px-2.5 lg:px-4"
        >
            <span className="hidden lg:inline">Sign in with GitHub</span>
        </Button >
    );
}
