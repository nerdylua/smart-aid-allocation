import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { geocode } from "@/lib/geocode";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();

  // Twilio sends form-urlencoded
  const formData = await request.formData();
  const body = formData.get("Body") as string | null;
  const from = formData.get("From") as string | null;
  const messageSid = formData.get("MessageSid") as string | null;

  if (!body || !from) {
    return new NextResponse("<Response><Message>Invalid request</Message></Response>", {
      status: 400,
      headers: { "Content-Type": "text/xml" },
    });
  }

  // 1. Store raw message
  const { data: message } = await supabase
    .from("messages")
    .insert({
      channel: "sms",
      sender: from,
      body,
      status: "promoted",
      metadata: { message_sid: messageSid, from, body },
    })
    .select()
    .single();

  // 2. Auto-create a case from SMS
  const title = body.length > 80 ? body.slice(0, 77) + "..." : body;

  const { data: caseData } = await supabase
    .from("cases")
    .insert({
      title,
      description: body,
      source_channel: "sms",
      language: "hi", // default for India SMS
      status: "new",
    })
    .select()
    .single();

  if (caseData) {
    // Link message to case
    if (message) {
      await supabase
        .from("messages")
        .update({ promoted_case_id: caseData.id })
        .eq("id", message.id);
    }

    // Try to geocode any location mentions (best effort)
    const locationMatch = body.match(/(?:in|at|from|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (locationMatch) {
      const locationLabel = locationMatch[1];
      const coords = await geocode(locationLabel + ", Mumbai").catch(() => null);
      if (coords) {
        await supabase
          .from("cases")
          .update({
            location_label: locationLabel,
            location: `SRID=4326;POINT(${coords.lng} ${coords.lat})` as unknown as null,
          })
          .eq("id", caseData.id);
      }
    }

    // Audit event
    await supabase.from("audit_events").insert({
      entity_type: "case",
      entity_id: caseData.id,
      action: "created",
      metadata: { source_channel: "sms", sender: from },
    });

    // Auto-log case note
    await supabase.from("case_notes").insert({
      case_id: caseData.id,
      content: `Case created from SMS message from ${from}`,
      note_type: "system",
      author_name: "SMS Intake",
    });

    const twiml = `<Response><Message>Thank you, your need has been registered. Case ID: ${caseData.id.slice(0, 8)}</Message></Response>`;
    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  }

  return new NextResponse(
    "<Response><Message>Thank you, your message has been received.</Message></Response>",
    { headers: { "Content-Type": "text/xml" } }
  );
}
