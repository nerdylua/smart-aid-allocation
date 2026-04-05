import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function getAuthenticatedUser(
  request: NextRequest
): Promise<User | null> {
  const cookieHeader = request.headers.get("cookie") ?? "";

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Cookie: cookieHeader } } }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
