import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { geocode } from "@/lib/geocode";
import { triageAgent } from "@/lib/agents/triage";
import { getAuthenticatedUser } from "@/lib/supabase/api-auth";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Sahaya <onboarding@resend.dev>";

async function sendConfirmationEmail(to: string, caseId: string) {
  if (!RESEND_API_KEY) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: RESEND_FROM_EMAIL,
      to: [to],
      subject: `Case Registered — ${caseId.slice(0, 8)}`,
      html: `<p>Thank you, your need has been registered.</p><p><strong>Case ID:</strong> ${caseId.slice(0, 8)}</p>`,
    }),
  });
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerClient();

  const { from, subject, body } = await request.json();

  if (!body || !from) {
    return NextResponse.json(
      { error: "Missing required fields: from, body" },
      { status: 400 }
    );
  }

  // 1. Store raw message
  const { data: message } = await supabase
    .from("messages")
    .insert({
      channel: "email",
      sender: from,
      body,
      status: "promoted",
      metadata: { from, subject, body },
    })
    .select()
    .single();

  // 2. Auto-create a case from email
  const title =
    (subject || body).length > 80
      ? (subject || body).slice(0, 77) + "..."
      : subject || body;

  const { data: caseData } = await supabase
    .from("cases")
    .insert({
      title,
      description: body,
      source_channel: "email",
      language: "hi", // default for India
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
    const locationMatch = body.match(
      /(?:in|at|from|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/
    );
    if (locationMatch) {
      const locationLabel = locationMatch[1];
      const coords = await geocode(locationLabel + ", Bengaluru").catch(
        () => null
      );
      if (coords) {
        await supabase
          .from("cases")
          .update({
            location_label: locationLabel,
            location:
              `SRID=4326;POINT(${coords.lng} ${coords.lat})` as unknown as null,
          })
          .eq("id", caseData.id);
      }
    }

    // Audit event
    await supabase.from("audit_events").insert({
      entity_type: "case",
      entity_id: caseData.id,
      action: "created",
      metadata: { source_channel: "email", sender: from },
    });

    // Auto-log case note
    await supabase.from("case_notes").insert({
      case_id: caseData.id,
      content: `Case created from email message from ${from}`,
      note_type: "system",
      author_name: "Email Intake",
    });

    triageAgent
      .generate({
        prompt: `Please assess case ${caseData.id}. This case was created from an email message.`,
      })
      .catch((err) => {
        console.error("Triage agent failed for email case:", err);
      });

    // Send confirmation email via Resend (non-blocking)
    sendConfirmationEmail(from, caseData.id).catch((err) => {
      console.error("Failed to send confirmation email:", err);
    });

    return NextResponse.json(
      { message: "Case registered", case_id: caseData.id },
      { status: 201 }
    );
  }

  return NextResponse.json({ message: "Message received" }, { status: 200 });
}
