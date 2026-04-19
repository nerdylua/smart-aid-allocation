import { tool } from "@openai/agents/realtime";
import { z } from "zod";

const tag = (id: unknown) =>
  typeof id === "string" && id.length >= 6 ? id.slice(-6) : "";

const truncate = (text: unknown, max: number) => {
  if (typeof text !== "string") return undefined;
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

const get = (obj: unknown, key: string): unknown =>
  typeof obj === "object" && obj !== null
    ? (obj as Record<string, unknown>)[key]
    : undefined;

export const listCases = tool({
  name: "list_cases",
  description: "List queue cases. Optional status filter.",
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
      .optional(),
    limit: z.number().min(1).max(10).optional(),
  }),
  execute: async ({ status, limit }) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("limit", String(limit ?? 5));
    const res = await fetch(`/api/cases?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    if (!Array.isArray(data)) return { cases: [] };

    const cases = data.map((row) => {
      const assessments = Array.isArray(get(row, "assessments"))
        ? (get(row, "assessments") as unknown[])
        : [];
      const latest = assessments[assessments.length - 1];
      const assignments = Array.isArray(get(row, "assignments"))
        ? (get(row, "assignments") as unknown[])
        : [];
      const needs = Array.isArray(get(row, "needs"))
        ? (get(row, "needs") as unknown[])
        : [];
      return {
        id: get(row, "id"),
        tag: tag(get(row, "id")),
        title: get(row, "title"),
        status: get(row, "status"),
        severity: get(latest, "severity"),
        needs_count: needs.length,
        assigned: assignments.length > 0,
      };
    });
    return { cases };
  },
});

export const getCase = tool({
  name: "get_case",
  description: "Get one case's details by id.",
  parameters: z.object({
    case_id: z.string(),
  }),
  execute: async ({ case_id }) => {
    const res = await fetch(`/api/cases/${case_id}`, {
      credentials: "include",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const row = await res.json();

    const assessments = Array.isArray(get(row, "assessments"))
      ? (get(row, "assessments") as unknown[])
      : [];
    const latest = assessments[assessments.length - 1];
    const assignments = Array.isArray(get(row, "assignments"))
      ? (get(row, "assignments") as unknown[])
      : [];
    const person = (get(row, "person_info") ?? {}) as Record<string, unknown>;

    return {
      id: get(row, "id"),
      tag: tag(get(row, "id")),
      title: get(row, "title"),
      status: get(row, "status"),
      location: get(row, "location_label"),
      language: get(row, "language"),
      needs: get(row, "needs"),
      person_name: person.name,
      person_phone: person.contact,
      severity: get(latest, "severity"),
      vulnerability: get(latest, "vulnerability"),
      confidence: get(latest, "confidence"),
      assignments_count: assignments.length,
    };
  },
});

export const listVolunteers = tool({
  name: "list_volunteers",
  description: "List volunteer roster. Optional language/availability filter.",
  parameters: z.object({
    language: z.string().optional(),
    available: z.boolean().optional(),
  }),
  execute: async ({ language, available }) => {
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (available !== undefined) params.set("available", String(available));
    const res = await fetch(`/api/volunteers?${params.toString()}`, {
      credentials: "include",
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    if (!Array.isArray(data)) return { volunteers: [] };

    const volunteers = data.slice(0, 15).map((row) => {
      const skills = Array.isArray(get(row, "skills"))
        ? (get(row, "skills") as unknown[]).slice(0, 4)
        : [];
      const availability = (get(row, "availability") ?? {}) as Record<
        string,
        unknown
      >;
      return {
        id: get(row, "id"),
        tag: tag(get(row, "id")),
        name: get(row, "name"),
        language: get(row, "language"),
        available: availability.available === true,
        skills,
      };
    });
    return { volunteers };
  },
});

export const createIntake = tool({
  name: "create_intake",
  description: "Create a new case from voice. Confirm details first.",
  parameters: z.object({
    title: z.string(),
    description: z.string().optional(),
    location_label: z.string().optional(),
    language: z
      .enum(["en", "hi", "ta", "mr", "bn", "te", "gu", "kn", "ml", "pa"])
      .optional(),
    needs: z
      .array(
        z.object({
          type: z.string(),
          detail: z.string().optional(),
        })
      )
      .optional(),
    person_name: z.string().optional(),
    person_age: z.number().optional(),
    person_gender: z.string().optional(),
    person_phone: z.string().optional(),
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
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const row = await res.json();
    return {
      ok: true,
      id: get(row, "id"),
      tag: tag(get(row, "id")),
      status: get(row, "status"),
    };
  },
});

export const triggerTriage = tool({
  name: "trigger_triage",
  description: "Run AI triage on a case. Takes a few seconds — say 'one moment' first.",
  parameters: z.object({
    case_id: z.string(),
  }),
  execute: async ({ case_id }) => {
    const res = await fetch("/api/assess", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: case_id }),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    const assessment = get(data, "assessment");
    return {
      ok: true,
      severity: get(assessment, "severity"),
      vulnerability: get(assessment, "vulnerability"),
      confidence: get(assessment, "confidence"),
    };
  },
});

export const triggerMatch = tool({
  name: "trigger_match",
  description: "Find volunteer matches for a case. Takes a few seconds — say 'one moment' first.",
  parameters: z.object({
    case_id: z.string(),
  }),
  execute: async ({ case_id }) => {
    const res = await fetch("/api/match", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ caseId: case_id }),
    });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    const match = get(data, "match");
    const candidates = Array.isArray(get(match, "candidates"))
      ? (get(match, "candidates") as unknown[]).slice(0, 3)
      : [];
    const top = candidates.map((c) => ({
      volunteer_id: get(c, "volunteer_id"),
      name: get(c, "volunteer_name"),
      score: get(c, "match_score"),
      rationale: truncate(get(c, "rationale"), 120),
      language_match: get(c, "language_match"),
      distance_km: get(c, "distance_km"),
    }));
    return {
      ok: true,
      candidates: top,
      no_match_reason: truncate(get(match, "no_match_reason"), 100),
    };
  },
});

export const createAssignment = tool({
  name: "create_assignment",
  description: "Assign a volunteer to a case. Confirm with the user first. Takes a few seconds — say 'one moment'.",
  parameters: z.object({
    case_id: z.string(),
    volunteer_id: z.string(),
    match_rationale: z.string(),
    match_score: z.number().min(0).max(1),
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
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = await res.json();
    const dispatch = get(data, "dispatch");
    return {
      ok: true,
      action: get(dispatch, "action"),
      assignment_tag: tag(get(dispatch, "assignment_id")),
      message: truncate(get(dispatch, "message"), 120),
    };
  },
});

export const addCaseNote = tool({
  name: "add_case_note",
  description: "Add a note to a case.",
  parameters: z.object({
    case_id: z.string(),
    content: z.string(),
    note_type: z.enum(["comment", "system"]).optional(),
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
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const row = await res.json();
    return { ok: true, note_tag: tag(get(row, "id")) };
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
