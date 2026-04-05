import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");
  const supabase = createServerClient();

  let query = supabase
    .from("cases")
    .select("id, title, description, location_label, language, needs, created_at, assessments(priority_score, severity, vulnerability)")
    .in("status", ["triaged", "matched"])
    .order("created_at", { ascending: false })
    .limit(50);

  if (language) {
    query = query.eq("language", language);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort by priority_score desc
  const sorted = (data ?? []).sort((a, b) => {
    const aScore = (a.assessments as { priority_score: number }[])?.[0]?.priority_score ?? 0;
    const bScore = (b.assessments as { priority_score: number }[])?.[0]?.priority_score ?? 0;
    return bScore - aScore;
  });

  return NextResponse.json(sorted);
}
