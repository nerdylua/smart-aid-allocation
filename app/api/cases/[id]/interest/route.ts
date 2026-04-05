import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  const volunteerId = body.volunteer_id;
  if (!volunteerId) {
    return NextResponse.json({ error: "volunteer_id is required" }, { status: 400 });
  }

  // Check if already has a pending interest/assignment for this case
  const { data: existing } = await supabase
    .from("assignments")
    .select("id")
    .eq("case_id", caseId)
    .eq("volunteer_id", volunteerId)
    .in("status", ["assigned", "accepted", "in_progress"])
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: "Already expressed interest in this case" }, { status: 409 });
  }

  // Create pending assignment (coordinator approval needed)
  const { data, error } = await supabase
    .from("assignments")
    .insert({
      case_id: caseId,
      volunteer_id: volunteerId,
      status: "assigned",
      match_rationale: "Volunteer self-selected — pending coordinator approval",
      match_score: null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit event
  await supabase.from("audit_events").insert({
    entity_type: "assignment",
    entity_id: data.id,
    action: "volunteer_interest",
    metadata: { case_id: caseId, volunteer_id: volunteerId },
  });

  // Case note
  await supabase.from("case_notes").insert({
    case_id: caseId,
    content: "A volunteer expressed interest in this case",
    note_type: "system",
    author_name: "Volunteer Hub",
  });

  return NextResponse.json(data, { status: 201 });
}
