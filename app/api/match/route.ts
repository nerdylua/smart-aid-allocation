import { NextRequest, NextResponse } from "next/server";
import { matchingAgent } from "@/lib/agents/matching";

export async function POST(request: NextRequest) {
  const { caseId } = await request.json();

  if (!caseId || typeof caseId !== "string") {
    return NextResponse.json(
      { error: "caseId is required" },
      { status: 400 }
    );
  }

  try {
    const result = await matchingAgent.generate({
      prompt: `Find the best volunteer matches for case ${caseId}. Follow your full matching process.`,
    });

    return NextResponse.json({
      match: result.output,
      steps: result.steps.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Matching Agent] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
