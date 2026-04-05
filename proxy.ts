import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public routes that don't require auth
const publicPaths = ["/login", "/api/intake/sms"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/") {
    return NextResponse.next();
  }

  // Check for Supabase auth token in cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    // If Supabase not configured, allow all (dev mode)
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.getAll().find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  if (!authCookie) {
    // No auth cookie — check if this might be a fresh session with token in URL
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.next(); // Allow API routes (service role key handles auth)
    }

    // Try to verify session via Supabase
    try {
      const supabase = createClient(supabaseUrl, supabasePublishableKey);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } catch {
      // If auth check fails, redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
