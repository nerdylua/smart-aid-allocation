import { SupabaseClient } from "@supabase/supabase-js";
import { geocode } from "@/lib/geocode";
import { triageAgent } from "@/lib/agents/triage";

type MessageRow = {
  id: string;
  sender: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  promoted_case_id?: string | null;
};

type PromoteOptions = {
  supabase: SupabaseClient;
  message: MessageRow;
  authorName: string;
};

const BENGALURU_LOCALITIES = [
  "Shivajinagar",
  "Koramangala",
  "Indiranagar",
  "Electronic City",
  "Whitefield",
  "HSR Layout",
  "Marathahalli",
  "Yelahanka",
  "Bommanahalli",
  "Jayanagar",
  "KR Puram",
  "K R Puram",
  "Hebbal",
  "Bellandur",
  "Banashankari",
  "Rajajinagar",
  "Malleshwaram",
  "BTM Layout",
  "Basavanagudi",
  "Ulsoor",
  "Mahadevapura",
  "Varthur",
  "Sarjapur",
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeLocality(locality: string) {
  return locality.replace(/\s+/g, " ").trim();
}

export function deriveMessageCaseTitle(subject: string | null, body: string) {
  const candidate = subject?.trim() || body.trim();
  return candidate.length > 80 ? `${candidate.slice(0, 77)}...` : candidate;
}

export function extractBengaluruLocationLabel(text: string) {
  const haystack = text.trim();
  if (!haystack) return null;

  const exactLocality = BENGALURU_LOCALITIES.find((locality) =>
    new RegExp(`\\b${escapeRegex(locality)}\\b`, "i").test(haystack)
  );
  if (exactLocality) {
    return normalizeLocality(exactLocality);
  }

  const genericMatch = haystack.match(
    /\b(?:in|at|from|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i
  );
  return genericMatch?.[1] ? normalizeLocality(genericMatch[1]) : null;
}

export async function promoteMessageToCase({
  supabase,
  message,
  authorName,
}: PromoteOptions) {
  if (message.promoted_case_id) {
    return { caseId: message.promoted_case_id, alreadyPromoted: true };
  }

  const metadata = (message.metadata ?? {}) as Record<string, unknown>;
  const subject =
    typeof metadata.subject === "string" ? metadata.subject : null;
  const combinedText = `${subject ?? ""}\n${message.body}`.trim();
  const locationLabel = extractBengaluruLocationLabel(combinedText);

  const { data: caseData, error: caseErr } = await supabase
    .from("cases")
    .insert({
      title: deriveMessageCaseTitle(subject, message.body),
      description: message.body,
      source_channel: "email",
      language: "hi",
      status: "new",
      location_label: locationLabel,
    })
    .select()
    .single();

  if (caseErr || !caseData) {
    throw new Error(caseErr?.message ?? "Failed to create case");
  }

  await supabase
    .from("messages")
    .update({ status: "promoted", promoted_case_id: caseData.id })
    .eq("id", message.id);

  if (locationLabel) {
    const coords = await geocode(
      `${locationLabel}, Bengaluru, Karnataka, India`
    ).catch(() => null);
    if (coords) {
      await supabase
        .from("cases")
        .update({
          location:
            `SRID=4326;POINT(${coords.lng} ${coords.lat})` as unknown as null,
        })
        .eq("id", caseData.id);
    }
  }

  await supabase.from("audit_events").insert({
    entity_type: "case",
    entity_id: caseData.id,
    action: "created",
    metadata: {
      source_channel: "email",
      sender: message.sender,
      message_id: message.id,
      promoted_from_inbox: true,
    },
  });

  await supabase.from("case_notes").insert({
    case_id: caseData.id,
    content: `Case promoted from email message from ${message.sender}`,
    note_type: "system",
    author_name: authorName,
  });

  triageAgent
    .generate({
      prompt: `Please assess case ${caseData.id}. This case was created from an email message and promoted from the inbox.`,
    })
    .catch((err) => {
      console.error("Triage agent failed for promoted email case:", err);
    });

  return { caseId: caseData.id, alreadyPromoted: false };
}
