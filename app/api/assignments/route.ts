import { NextRequest, NextResponse } from "next/server";
import { dispatchAgent } from "@/lib/agents/dispatch";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const { caseId, volunteerId, matchRationale, matchScore, action } =
    await request.json();

  try {
    if (action === "escalate") {
      const result = await dispatchAgent.generate({
        prompt: `Escalate case ${caseId}. Reason: ${matchRationale || "No suitable volunteer available"}. Follow escalation process.`,
      });

      const supabase = createServerClient();
      await supabase.from("case_notes").insert({
        case_id: caseId,
        content: `Case escalated: ${matchRationale || "No suitable volunteer available"}`,
        note_type: "escalation",
        author_name: "Dispatch Agent",
      });

      return NextResponse.json({ dispatch: result.output, steps: result.steps.length });
    }

    if (!caseId || !volunteerId) {
      return NextResponse.json(
        { error: "caseId and volunteerId are required" },
        { status: 400 }
      );
    }

    const result = await dispatchAgent.generate({
      prompt: `Assign volunteer ${volunteerId} to case ${caseId}. Match rationale: "${matchRationale || "Coordinator approved"}". Match score: ${matchScore ?? 0.8}. Follow assignment process.`,
    });

    const supabase = createServerClient();
    await supabase.from("case_notes").insert({
      case_id: caseId,
      content: `Volunteer assigned to case. Rationale: ${matchRationale || "Coordinator approved"}`,
      note_type: "status_change",
      author_name: "Dispatch Agent",
    });

    return NextResponse.json({
      dispatch: result.output,
      steps: result.steps.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Dispatch Agent] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
