import { supabase } from "./supabaseClient";

export async function loginWithGitHub() {
  await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function logout() {
  await supabase.auth.signOut();
}
