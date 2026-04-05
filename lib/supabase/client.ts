import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createSSRBrowserClient> | null = null;

// Browser client singleton (cookie-based auth via @supabase/ssr)
export function createBrowserClient() {
  if (!client) {
    client = createSSRBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );
  }
  return client;
}
