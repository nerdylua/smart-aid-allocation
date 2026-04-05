import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const supabase = createServerClient();

  // Add timestamps for status transitions
  const updates: Record<string, unknown> = { ...body };
  if (body.status === "accepted") {
    updates.accepted_at = new Date().toISOString();
  }
  if (body.status === "completed") {
    updates.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log audit event
  await supabase.from("audit_events").insert({
    entity_type: "assignment",
    entity_id: id,
    action: `status_${body.status}`,
    metadata: { case_id: data.case_id },
  });

  // Log status change as case note
  const statusLabels: Record<string, string> = {
    accepted: "Assignment accepted by volunteer",
    rejected: "Assignment declined by volunteer",
    in_progress: "Volunteer started working on case",
    completed: "Volunteer marked assignment as completed",
  };
  if (body.status && statusLabels[body.status]) {
    await supabase.from("case_notes").insert({
      case_id: data.case_id,
      content: statusLabels[body.status],
      note_type: "status_change",
      author_name: "System",
    });
  }

  return NextResponse.json(data);
}
