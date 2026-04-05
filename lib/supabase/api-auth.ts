import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<User | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll() {
          // API routes don't need to refresh cookies
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
