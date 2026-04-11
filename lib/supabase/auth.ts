import { createBrowserClient } from "@/lib/supabase/client";

export async function signInWithGoogle() {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

export async function signInWithPassword(email: string, password: string) {
  const supabase = createBrowserClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
  window.location.replace("/");
}

export async function getSession() {
  const supabase = createBrowserClient();
  return supabase.auth.getSession();
}
