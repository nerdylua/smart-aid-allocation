import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();

  // Fetch the message
  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .select("*")
    .eq("id", id)
    .single();

  if (msgErr || !message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Create case from message
  const body = (message as { body: string }).body;
  const sender = (message as { sender: string }).sender;
  const title = body.length > 80 ? body.slice(0, 77) + "..." : body;

  const { data: caseData, error: caseErr } = await supabase
    .from("cases")
    .insert({
      title,
      description: body,
      source_channel: "sms",
      language: "hi",
      status: "new",
    })
    .select()
    .single();

  if (caseErr) {
    return NextResponse.json({ error: caseErr.message }, { status: 500 });
  }

  // Update message
  await supabase
    .from("messages")
    .update({ status: "promoted", promoted_case_id: caseData.id })
    .eq("id", id);

  // Audit + note
  await supabase.from("audit_events").insert({
    entity_type: "case",
    entity_id: caseData.id,
    action: "created",
    metadata: { source_channel: "sms", sender, message_id: id },
  });

  await supabase.from("case_notes").insert({
    case_id: caseData.id,
    content: `Case promoted from SMS message from ${sender}`,
    note_type: "system",
    author_name: "Message Inbox",
  });

  return NextResponse.json({ case_id: caseData.id }, { status: 201 });
}
