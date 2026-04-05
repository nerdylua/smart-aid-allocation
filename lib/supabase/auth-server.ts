import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Auth-aware server client (uses publishable key + cookies for user session)
// Use in layouts, server components, and auth callback
export async function createAuthClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components (read-only cookies)
            // This is fine — the middleware handles refresh
          }
        },
      },
    }
  );
}
