import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");
  const available = searchParams.get("available");

  const supabase = createServerClient();

  let query = supabase
    .from("users")
    .select("id, name, email, language, skills, location, availability, org_id, staffing, action, status_updated_at")
    .eq("role", "volunteer")
    .order("name");

  if (language) {
    query = query.eq("language", language);
  }
  if (available === "true") {
    query = query.eq("availability->>available", "true");
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
