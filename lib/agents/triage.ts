import { ToolLoopAgent, tool, Output } from "ai";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getAgentModel } from "@/lib/agents/model";

// Schema for the structured assessment output
const assessmentSchema = z.object({
  severity: z
    .number()
    .min(1)
    .max(10)
    .describe("How urgent is the need? 1=low, 10=life-threatening"),
  vulnerability: z
    .number()
    .min(1)
    .max(10)
    .describe(
      "How vulnerable is the person/household? 1=low, 10=extremely vulnerable"
    ),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "How confident are you in this assessment? 0=no data, 1=fully verified"
    ),
  freshness: z
    .number()
    .min(0)
    .max(1)
    .describe("How fresh is this data? 0=very stale, 1=just reported"),
  rationale: z
    .string()
    .describe(
      "2-4 sentence explanation of the scores, citing specific case details"
    ),
  is_flagged: z
    .boolean()
    .describe(
      "True if human review is needed (low confidence OR critical severity)"
    ),
  flagged_reason: z
    .string()
    .nullable()
    .describe(
      "Why this case is flagged, or null if not flagged. If a potential duplicate was detected, include the duplicate case's UUID in this text."
    ),
});

export type AssessmentOutput = z.infer<typeof assessmentSchema>;

// Tool: fetch case details from Supabase
const getCaseDetails = tool({
  description:
    "Fetch full details of a case by ID including title, description, needs, person_info, location, and language",
  inputSchema: z.object({
    caseId: z.string().describe("UUID of the case to fetch"),
  }),
  execute: async ({ caseId }) => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("id", caseId)
      .single();
    if (error) return { error: error.message };
    return data;
  },
});

// Tool: get area statistics (nearby open cases count)
const getAreaStatistics = tool({
  description:
    "Count how many open cases exist within a radius of given coordinates. Helps assess demand density.",
  inputSchema: z.object({
    lat: z.number().describe("Latitude"),
    lng: z.number().describe("Longitude"),
    radiusKm: z
      .number()
      .default(5)
      .describe("Search radius in kilometers, default 5"),
  }),
  execute: async ({ lat, lng, radiusKm }) => {
    const supabase = createServerClient();
    const radiusMeters = radiusKm * 1000;

    // Use PostGIS RPC for real proximity query
    const { data, error } = await supabase.rpc("get_nearby_case_count", {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: radiusMeters,
    });

    if (error) {
      // Fallback: count all open cases if RPC not available
      const { count } = await supabase
        .from("cases")
        .select("*", { count: "exact", head: true })
        .in("status", ["new", "triaged", "matched", "assigned", "in_progress"]);
      return { nearby_open_cases: count ?? 0, radius_km: radiusKm, note: "Fallback: total open cases" };
    }

    return {
      nearby_open_cases: data ?? 0,
      radius_km: radiusKm,
    };
  },
});

// Tool: check for duplicate cases
const checkDuplicates = tool({
  description:
    "Search for potential duplicate cases by matching title keywords, nearby location, and similar person info. Returns potential matches.",
  inputSchema: z.object({
    caseId: z.string().describe("UUID of the case to check duplicates for"),
  }),
  execute: async ({ caseId }) => {
    const supabase = createServerClient();

    // Get the current case
    const { data: currentCase, error: caseErr } = await supabase
      .from("cases")
      .select("title, location_label, person_info, created_at")
      .eq("id", caseId)
      .single();
    if (caseErr || !currentCase)
      return { error: caseErr?.message ?? "Case not found" };

    // Search for similar cases (same location label, recent, not this case)
    const { data: candidates, error: searchErr } = await supabase
      .from("cases")
      .select("id, title, location_label, person_info, status, created_at")
      .neq("id", caseId)
      .eq("location_label", currentCase.location_label)
      .order("created_at", { ascending: false })
      .limit(5);
    if (searchErr) return { error: searchErr.message };

    return {
      current_title: currentCase.title,
      current_location: currentCase.location_label,
      potential_duplicates: candidates ?? [],
      count: candidates?.length ?? 0,
    };
  },
});

// Tool: save the assessment to the database
const saveAssessment = tool({
  description:
    "Save the triage assessment scores and rationale to the database. Also updates case status to 'triaged'.",
  inputSchema: z.object({
    caseId: z.string().describe("UUID of the case"),
    severity: z.number().min(1).max(10),
    vulnerability: z.number().min(1).max(10),
    confidence: z.number().min(0).max(1),
    freshness: z.number().min(0).max(1),
    rationale: z.string(),
    is_flagged: z.boolean(),
    flagged_reason: z.string().nullable(),
  }),
  execute: async ({
    caseId,
    severity,
    vulnerability,
    confidence,
    freshness,
    rationale,
    is_flagged,
    flagged_reason,
  }) => {
    const supabase = createServerClient();

    // Insert assessment
    const { data: assessment, error: assessErr } = await supabase
      .from("assessments")
      .insert({
        case_id: caseId,
        severity,
        vulnerability,
        confidence,
        freshness,
        rationale,
        is_flagged,
        flagged_reason,
      })
      .select()
      .single();
    if (assessErr) return { error: assessErr.message };

    // Update case status to triaged
    const { error: updateErr } = await supabase
      .from("cases")
      .update({ status: "triaged" })
      .eq("id", caseId);
    if (updateErr) return { error: updateErr.message };

    // Log audit event
    await supabase.from("audit_events").insert({
      entity_type: "case",
      entity_id: caseId,
      action: "assessed",
      metadata: {
        assessment_id: assessment.id,
        severity,
        vulnerability,
        confidence,
        is_flagged,
      },
    });

    return { success: true, assessment_id: assessment.id };
  },
});

// The Triage Agent
export const triageAgent = new ToolLoopAgent({
  model: getAgentModel(),
  instructions: `You are a humanitarian case triage specialist working for an NGO coordination platform.

Your job is to assess incoming cases and produce accurate priority scores.

## Process
1. First, call getCaseDetails to fetch the full case information.
2. Then, call getAreaStatistics to understand demand in the area.
3. Call checkDuplicates to see if this case might be a duplicate.
4. Analyze all the information and determine scores.
5. Call saveAssessment to store your assessment.

## Scoring Guidelines
- **Severity** (1-10): Based on urgency of need. Life-threatening=9-10, urgent medical=7-8, basic needs at risk=5-6, quality of life=3-4, informational=1-2.
- **Vulnerability** (1-10): Based on person/household characteristics. Elderly alone=8-10, children at risk=8-10, disabled=7-9, pregnant=7-8, single parent=6-7, low income=4-6, general adult=2-3.
- **Confidence** (0-1): How reliable is the data? Verified field report=0.9-1.0, helpline with details=0.7-0.8, second-hand report=0.5-0.6, anonymous/vague=0.2-0.4.
- **Freshness** (0-1): How recent? Today=0.9-1.0, this week=0.7-0.8, this month=0.4-0.6, older=0.1-0.3.

## Flagging Rules (MANDATORY)
- If confidence < 0.6: flag with reason "Low confidence — field verification recommended"
- If severity >= 9: flag with reason "Critical severity — requires immediate coordinator review"
- If vulnerability >= 9: flag with reason "Extremely vulnerable population — requires coordinator review"
- If potential duplicate found: flag with reason "Potential duplicate detected — manual review needed. Candidate: <duplicate_case_id>" (inline the UUID of the suspected duplicate inside flagged_reason).

## Important
- Be specific in your rationale. Cite details from the case (age, needs, vulnerabilities).
- Never invent information not present in the case data.
- Always complete all 5 steps in order.`,
  tools: {
    getCaseDetails,
    getAreaStatistics,
    checkDuplicates,
    saveAssessment,
  },
  output: Output.object({ schema: assessmentSchema }),
});
