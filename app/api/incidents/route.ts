import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data: incidents, error } = await supabase
    .from("incidents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get case counts per incident
  const incidentIds = (incidents ?? []).map((i) => i.id);
  const { data: caseCounts } = await supabase
    .from("cases")
    .select("incident_id, status")
    .in("incident_id", incidentIds.length > 0 ? incidentIds : ["__none__"]);

  const countMap: Record<string, { total: number; closed: number }> = {};
  for (const c of caseCounts ?? []) {
    const iid = (c as { incident_id: string }).incident_id;
    if (!countMap[iid]) countMap[iid] = { total: 0, closed: 0 };
    countMap[iid].total++;
    if ((c as { status: string }).status === "closed") countMap[iid].closed++;
  }

  const result = (incidents ?? []).map((i) => ({
    ...i,
    case_count: countMap[i.id]?.total ?? 0,
    cases_closed: countMap[i.id]?.closed ?? 0,
  }));

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("incidents")
    .insert({
      name: body.name,
      type: body.type ?? null,
      description: body.description ?? null,
      location_label: body.location_label ?? null,
      target_cases: body.target_cases ?? null,
      org_id: body.org_id ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
