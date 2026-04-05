import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Fetch assignment details for the ordered IDs
  const assignmentIds = (data.assignments as string[]) ?? [];
  let stops: unknown[] = [];

  if (assignmentIds.length > 0) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("id, case_id, status, cases(title, location_label, location)")
      .in("id", assignmentIds);

    // Re-order to match itinerary order
    const assignmentMap = new Map((assignments ?? []).map((a) => [a.id, a]));
    stops = assignmentIds.map((aid) => assignmentMap.get(aid)).filter(Boolean);
  }

  return NextResponse.json({ ...data, stops });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("itineraries")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
