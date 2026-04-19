import { tool } from "@openai/agents/realtime";
import { z } from "zod";

export const listCases = tool({
  name: "list_cases",
  description:
    "List cases in the operational queue. Optionally filter by status and limit the number of results.",
  parameters: z.object({
    status: z
      .enum([
        "new",
        "triaged",
        "matched",
        "assigned",
        "in_progress",
        "completed",
        "closed",
      ])
      .optional()
      .describe("Filter by case status"),
    limit: z
      .number()
      .min(1)
      .max(20)
      .optional()
      .describe("Maximum number of cases to return (1–20, default 10)"),
  }),
  execute: async ({ status, limit }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("limit", String(limit ?? 10));
    const res = await fetch(`/api/cases?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) return { error: `list_cases failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const getCase = tool({
  name: "get_case",
  description:
    "Get full details for a specific case including its AI assessment and assignments.",
  parameters: z.object({
    case_id: z.string().describe("UUID of the case to retrieve"),
  }),
  execute: async ({ case_id }) => {
    const res = await fetch(`/api/cases/${case_id}`, {
      credentials: "include",
    });
    if (!res.ok) return { error: `get_case failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const listVolunteers = tool({
  name: "list_volunteers",
  description:
    "List volunteers from the roster. Optionally filter by preferred language or availability.",
  parameters: z.object({
    language: z
      .string()
      .optional()
      .describe("Filter by preferred language code, e.g. 'en', 'hi'"),
    available: z
      .boolean()
      .optional()
      .describe("If true, return only currently available volunteers"),
  }),
  execute: async ({ language, available }) => {
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (available !== undefined) params.set("available", String(available));
    const res = await fetch(`/api/volunteers?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok)
      return { error: `list_volunteers failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const createIntake = tool({
  name: "create_intake",
  description:
    "Create a new humanitarian case from voice dictation. Confirm details with the user before calling.",
  parameters: z.object({
    title: z.string().describe("Short title describing the situation"),
    description: z
      .string()
      .optional()
      .describe("Longer description of the case"),
    location_label: z
      .string()
      .optional()
      .describe("Human-readable location, e.g. 'Koramangala, Bengaluru'"),
    language: z
      .enum(["en", "hi", "ta", "mr", "bn", "te", "gu", "kn", "ml", "pa"])
      .optional()
      .describe("Primary language of the person in need"),
    needs: z
      .array(
        z.object({
          type: z.string().describe("Need type, e.g. 'water', 'food'"),
          detail: z
            .string()
            .optional()
            .describe("Specific details or urgency for this need"),
        })
      )
      .optional()
      .describe("List of needs using the same type/detail shape as intake forms"),
    person_name: z
      .string()
      .optional()
      .describe("Full name of the person in need"),
    person_age: z
      .number()
      .optional()
      .describe("Age of the person in need"),
    person_gender: z
      .string()
      .optional()
      .describe("Gender of the person in need"),
    person_phone: z
      .string()
      .optional()
      .describe("Contact phone number for the person in need"),
  }),
  execute: async ({
    title,
    description,
    location_label,
    language,
    needs,
    person_name,
    person_age,
    person_gender,
    person_phone,
  }) => {
    const person_info: Record<string, string | number> = {};
    if (person_name) person_info.name = person_name;
    if (person_age !== undefined) person_info.age = person_age;
    if (person_gender) person_info.gender = person_gender;
    if (person_phone) person_info.contact = person_phone;

    const res = await fetch("/api/intakes", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        location_label,
        language: language ?? "en",
        needs: needs ?? [],
        person_info,
        source_channel: "voice",
      }),
    });
    if (!res.ok) return { error: `create_intake failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const triggerTriage = tool({
  name: "trigger_triage",
  description:
    "Run the AI triage agent on a case to produce severity and vulnerability scores. Takes a few seconds — say 'one moment' before calling.",
  parameters: z.object({
    case_id: z.string().describe("UUID of the case to triage"),
  }),
  execute: async ({ case_id }) => {
    const res = await fetch("/api/assess", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: case_id }),
    });
    if (!res.ok)
      return { error: `trigger_triage failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const triggerMatch = tool({
  name: "trigger_match",
  description:
    "Run the AI volunteer-matching agent for a case. Takes a few seconds — say 'one moment' before calling.",
  parameters: z.object({
    case_id: z.string().describe("UUID of the case to find volunteers for"),
  }),
  execute: async ({ case_id }) => {
    const res = await fetch("/api/match", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: case_id }),
    });
    if (!res.ok)
      return { error: `trigger_match failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const createAssignment = tool({
  name: "create_assignment",
  description:
    "Assign a volunteer to a case and let the dispatch agent set the SLA. Takes a few seconds — say 'one moment' before calling. Confirm with the user before calling.",
  parameters: z.object({
    case_id: z.string().describe("UUID of the case"),
    volunteer_id: z.string().describe("UUID of the volunteer to assign"),
    match_rationale: z
      .string()
      .describe("Brief explanation of why this volunteer is a good match"),
    match_score: z
      .number()
      .min(0)
      .max(1)
      .describe("Match quality score between 0 (poor) and 1 (perfect)"),
  }),
  execute: async ({ case_id, volunteer_id, match_rationale, match_score }) => {
    const res = await fetch("/api/assignments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        caseId: case_id,
        volunteerId: volunteer_id,
        matchRationale: match_rationale,
        matchScore: match_score,
      }),
    });
    if (!res.ok)
      return { error: `create_assignment failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const addCaseNote = tool({
  name: "add_case_note",
  description: "Add a voice-transcribed note to a case.",
  parameters: z.object({
    case_id: z.string().describe("UUID of the case to annotate"),
    content: z.string().describe("The note text to record"),
    note_type: z
      .enum(["comment", "system"])
      .optional()
      .describe("Type of note — defaults to 'comment'"),
  }),
  execute: async ({ case_id, content, note_type }) => {
    const res = await fetch(`/api/cases/${case_id}/notes`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        note_type: note_type ?? "comment",
        author_name: "Voice Agent",
      }),
    });
    if (!res.ok)
      return { error: `add_case_note failed: HTTP ${res.status}` };
    return res.json();
  },
});

export const allVoiceTools = [
  listCases,
  getCase,
  listVolunteers,
  createIntake,
  triggerTriage,
  triggerMatch,
  createAssignment,
  addCaseNote,
];
