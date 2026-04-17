import { NextRequest, NextResponse } from "next/server";
import { dispatchAgent } from "@/lib/agents/dispatch";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId, volunteerId, matchRationale, matchScore, action } =
    await request.json();

  try {
    if (action === "escalate") {
      const supabaseForLookup = createServerClient();
      const { data: assessment } = await supabaseForLookup
        .from("assessments")
        .select("severity")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      const severity = assessment?.severity ?? 5;

      const result = await dispatchAgent.generate({
        prompt: `Escalate case ${caseId} (severity ${severity}/10). Reason: ${matchRationale || "No suitable volunteer available"}. Follow escalation process.`,
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

    const supabaseForLookup = createServerClient();
    const { data: assessment } = await supabaseForLookup
      .from("assessments")
      .select("severity")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    const severity = assessment?.severity ?? 5;

    const result = await dispatchAgent.generate({
      prompt: `Assign volunteer ${volunteerId} to case ${caseId}. The case severity is ${severity}/10 — call getDispatchRules with severity ${severity} to determine the correct SLA. Match rationale: "${matchRationale || "Coordinator approved"}". Match score: ${matchScore ?? 0.8}. Follow assignment process.`,
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
