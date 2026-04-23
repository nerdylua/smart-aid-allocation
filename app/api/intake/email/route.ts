import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";
import {
  deriveMessageCaseTitle,
  promoteMessageToCase,
} from "@/lib/messages/promote";
import { sendCaseConfirmationEmail } from "@/lib/messages/confirmation-email";

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();
  const { from, subject, body, auto_promote: autoPromote } =
    await request.json();

  if (!body || !from) {
    return NextResponse.json(
      { error: "Missing required fields: from, body" },
      { status: 400 }
    );
  }

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      channel: "email",
      sender: from,
      body,
      status: "pending",
      metadata: { from, subject, body },
    })
    .select()
    .single();

  if (error || !message) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to store incoming email" },
      { status: 500 }
    );
  }

  if (!autoPromote) {
    return NextResponse.json(
      {
        message: "Message queued for review",
        message_id: message.id,
        preview_title: deriveMessageCaseTitle(subject ?? null, body),
      },
      { status: 201 }
    );
  }

  try {
    const result = await promoteMessageToCase({
      supabase,
      message: {
        id: message.id,
        sender: from,
        body,
        metadata: { from, subject, body },
      },
      authorName: "Email Intake",
    });

    await sendCaseConfirmationEmail(from, result.caseId).catch((err) => {
      console.error("Failed to send confirmation email:", err);
    });

    return NextResponse.json(
      { message: "Case registered", case_id: result.caseId },
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
