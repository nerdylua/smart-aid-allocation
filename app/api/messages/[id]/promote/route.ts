import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { promoteMessageToCase } from "@/lib/messages/promote";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .select("*")
    .eq("id", id)
    .single();

  if (msgErr || !message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (message.promoted_case_id) {
    return NextResponse.json(
      { case_id: message.promoted_case_id, already_promoted: true },
      { status: 200 }
    );
  }

  try {
    const result = await promoteMessageToCase({
      supabase,
      message: {
        id: message.id,
        sender: message.sender,
        body: message.body,
        metadata:
          typeof message.metadata === "object" && message.metadata
            ? (message.metadata as Record<string, unknown>)
            : null,
      },
      authorName: "Message Inbox",
    });

    return NextResponse.json(
      { case_id: result.caseId, already_promoted: result.alreadyPromoted },
      { status: 201 }
    );
  } catch (promotionError) {
    return NextResponse.json(
      {
        error:
          promotionError instanceof Error
            ? promotionError.message
            : "Failed to promote message",
      },
      { status: 500 }
    );
  }
}
