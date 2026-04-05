import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orgId = searchParams.get("org_id");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const supabase = createServerClient();

  let query = supabase
    .from("cases")
    .select(
      "*, assessments(*), assignments(*)"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }
  if (orgId) {
    query = query.eq("org_id", orgId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
