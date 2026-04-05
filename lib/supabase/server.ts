import { createClient } from "@supabase/supabase-js";

// Server-side client (uses service role key, bypasses RLS)
// Use in API routes and server actions only
// Types are applied per-query via .returns<T>() or casting
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
