import { createBrowserClient } from "@/lib/supabase/client";

export async function signInWithGoogle() {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
  window.location.replace("/login");
}

export async function getSession() {
  const supabase = createBrowserClient();
  return supabase.auth.getSession();
}
