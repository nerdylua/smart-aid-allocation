import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("verifications")
    .insert({
      assignment_id: body.assignment_id,
      proof_notes: body.proof_notes ?? null,
      proof_media_url: body.proof_media_url ?? null,
      verified_by: body.verified_by ?? null,
      outcome: body.outcome,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If verified, close the assignment and case
  if (body.outcome === "confirmed") {
    // Close assignment
    await supabase
      .from("assignments")
      .update({ status: "closed" })
      .eq("id", body.assignment_id);

    // Get case_id from assignment
    const { data: assignment } = await supabase
      .from("assignments")
      .select("case_id")
      .eq("id", body.assignment_id)
      .single();

    if (assignment) {
      await supabase
        .from("cases")
        .update({ status: "closed" })
        .eq("id", assignment.case_id);

      // Audit event
      await supabase.from("audit_events").insert({
        entity_type: "case",
        entity_id: assignment.case_id,
        action: "closed",
        actor_id: body.verified_by ?? null,
        metadata: { verification_id: data.id, outcome: body.outcome },
      });

      // Log status change note
      await supabase.from("case_notes").insert({
        case_id: assignment.case_id,
        content: `Case verified and closed. Outcome: ${body.outcome}`,
        note_type: "status_change",
        author_name: "System",
      });
    }
  }

  return NextResponse.json(data, { status: 201 });
}
