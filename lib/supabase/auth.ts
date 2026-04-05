import { createBrowserClient } from "@/lib/supabase/client";

export async function signInWithGoogle() {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/dashboard` },
  });
}

export async function signOut() {
  const supabase = createBrowserClient();
  return supabase.auth.signOut();
}

export async function getSession() {
  const supabase = createBrowserClient();
  return supabase.auth.getSession();
}
