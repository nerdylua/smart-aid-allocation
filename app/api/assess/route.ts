import { NextRequest, NextResponse } from "next/server";
import { triageAgent } from "@/lib/agents/triage";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { caseId } = await request.json();

  if (!caseId || typeof caseId !== "string") {
    return NextResponse.json(
      { error: "caseId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await triageAgent.generate({
      prompt: `Triage case ${caseId}. Follow your full assessment process: fetch the case, check area stats, check duplicates, then save your assessment.`,
      onStepFinish: async ({ stepNumber }) => {
        console.log(`[Triage Agent] Step ${stepNumber} complete for case ${caseId}`);
      },
    });

    // Auto-log status change note
    const supabase = createServerClient();
    await supabase.from("case_notes").insert({
      case_id: caseId,
      content: `Case triaged by AI. Severity: ${result.output?.severity ?? "?"}/10, Vulnerability: ${result.output?.vulnerability ?? "?"}/10`,
      note_type: "status_change",
      author_name: "Triage Agent",
    });

    return NextResponse.json({
      assessment: result.output,
      steps: result.steps.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[Triage Agent] Error:", message, stack);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
