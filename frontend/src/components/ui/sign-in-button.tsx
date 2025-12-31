import { IconBrandGithub } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";

interface SignInButtonProps {
    setIsSigningIn: (isSigningIn: boolean) => void;
}

async function signInWithGitHub(setIsSigningIn: (isSigningIn: boolean) => void) {
    const redirectTo = `${window.location.origin}/auth/callback`;
    setIsSigningIn(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
            redirectTo,
            skipBrowserRedirect: false,
        },
    });

    if (data) {
        setIsSigningIn(false);
    }

    if (error) {
        console.error("OAuth error:", error);
        throw error;
    }
}

export default function SignInButton({ setIsSigningIn }: SignInButtonProps) {
    return (
        <Button
            onClick={() => signInWithGitHub(setIsSigningIn)}
            icon={<IconBrandGithub className="text-black size-4" />}
            className="bg-zinc-100 text-black hover:bg-white hover:scale-[1.02] transition-all border-none font-semibold px-2.5 lg:px-4"
        >
            <span className="hidden lg:inline">Sign in with GitHub</span>
        </Button >
    );
}
