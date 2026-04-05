import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: incident, error } = await supabase
    .from("incidents")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Get cases for this incident
  const { data: cases } = await supabase
    .from("cases")
    .select("id, title, status, location_label, created_at, assessments(priority_score, severity)")
    .eq("incident_id", id)
    .order("created_at", { ascending: false });

  return NextResponse.json({ ...incident, cases: cases ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  const updates: Record<string, unknown> = { ...body };
  if (body.status === "resolved" || body.status === "closed") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("incidents")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
