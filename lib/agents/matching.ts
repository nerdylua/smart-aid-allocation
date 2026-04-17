import { ToolLoopAgent, tool, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const matchResultSchema = z.object({
  candidates: z.array(
    z.object({
      volunteer_id: z.string(),
      volunteer_name: z.string(),
      match_score: z
        .number()
        .min(0)
        .max(1)
        .describe("Overall match quality 0-1"),
      rationale: z
        .string()
        .describe("Why this volunteer is a good match"),
      skills_matched: z.array(z.string()),
      distance_km: z.number().nullable(),
      language_match: z.boolean(),
    })
  ).describe("Top 3 candidates ranked by match_score descending"),
  case_id: z.string(),
  no_match_reason: z
    .string()
    .nullable()
    .describe("If fewer than 3 candidates, explain why"),
});

export type MatchResult = z.infer<typeof matchResultSchema>;

type VolunteerRow = {
  id: string;
  name: string;
  skills: string[] | null;
  language: string | null;
  availability: Record<string, unknown> | null;
  staffing: string;
  action: string;
  lat: number | null;
  lng: number | null;
};

const getCaseForMatching = tool({
  description:
    "Fetch case details needed for volunteer matching: title, needs, language, person_info, location label, and numeric lat/lng (null if the case has no coordinates).",
  inputSchema: z.object({
    caseId: z.string(),
  }),
  execute: async ({ caseId }) => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .rpc("get_case_for_matching", { p_case_id: caseId })
      .single();
    if (error) return { error: error.message };
    if (!data) return { error: "Case not found" };
    return data;
  },
});

const getAvailableVolunteers = tool({
  description:
    "Fetch available volunteers (role=volunteer, staffing in available|on_shift, action=idle). Each volunteer includes their skills, language code, and numeric lat/lng. Language is returned as data — use it for scoring language_match, not as a filter. If skills are provided, volunteers are sorted by how many of their skills match (case-insensitive substring).",
  inputSchema: z.object({
    skills: z
      .array(z.string())
      .optional()
      .describe("Sort by any of these skills (OR match). No hard filter applied."),
  }),
  execute: async ({ skills }) => {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc(
      "get_available_volunteers_for_matching"
    );
    if (error) return { error: error.message };

    const results = (data ?? []) as VolunteerRow[];

    if (skills && skills.length > 0) {
      const withSkillMatch = results.map((v) => ({
        ...v,
        matching_skills: (v.skills ?? []).filter((s) =>
          skills.some((needed) =>
            s.toLowerCase().includes(needed.toLowerCase())
          )
        ),
      }));
      withSkillMatch.sort(
        (a, b) => b.matching_skills.length - a.matching_skills.length
      );
      return withSkillMatch;
    }

    return results;
  },
});

const computeDistance = tool({
  description:
    "Compute approximate distance in km between two geographic points using haversine formula",
  inputSchema: z.object({
    fromLat: z.number(),
    fromLng: z.number(),
    toLat: z.number(),
    toLng: z.number(),
  }),
  execute: async ({ fromLat, fromLng, toLat, toLng }) => {
    const R = 6371; // Earth radius in km
    const dLat = ((toLat - fromLat) * Math.PI) / 180;
    const dLng = ((toLng - fromLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((fromLat * Math.PI) / 180) *
        Math.cos((toLat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return { distance_km: Math.round(R * c * 100) / 100 };
  },
});

const checkExistingAssignments = tool({
  description:
    "Check if a volunteer already has active assignments (to avoid overloading them)",
  inputSchema: z.object({
    volunteerId: z.string(),
  }),
  execute: async ({ volunteerId }) => {
    const supabase = createServerClient();
    const { count, error } = await supabase
      .from("assignments")
      .select("*", { count: "exact", head: true })
      .eq("volunteer_id", volunteerId)
      .in("status", ["assigned", "accepted", "in_progress"]);
    if (error) return { error: error.message };
    return { active_assignments: count ?? 0 };
  },
});

export const matchingAgent = new ToolLoopAgent({
  model: openai("gpt-5.4-mini"),
  instructions: `You are a volunteer matching specialist for a humanitarian coordination platform.

Your job is to find the best-fit volunteers for a given case.

## Process
1. Call getCaseForMatching to get case details. The result includes the case's numeric lat/lng (may be null).
2. Call getAvailableVolunteers, passing relevant skill keywords extracted from the case needs. Every returned volunteer includes their own lat/lng and language.
3. For promising candidates, call computeDistance using the case lat/lng and the volunteer lat/lng to compute proximity in km. Skip this call if either side lacks coordinates.
4. Call checkExistingAssignments for top candidates to check workload.
5. Rank and return the top 3 candidates.

## Matching Criteria (weighted)
- **Skills match** (35%): Do the volunteer's skills align with case needs?
- **Language match** (25%): Does volunteer.language equal the case's language? This is a PREFERENCE, not a hard filter. A strong match on the other criteria can outweigh a language mismatch.
- **Proximity** (25%): How close is the volunteer to the case location?
- **Availability** (15%): Is the volunteer not overloaded with existing assignments?

## Scoring
- Compute a match_score (0-1) for each candidate based on the weighted criteria above.
- Set language_match=true only when volunteer.language equals case.language.
- Set distance_km from computeDistance, or null when coordinates are missing on either side.
- Be specific in the rationale about why each volunteer was selected.
- If fewer than 3 suitable volunteers are found, explain why in no_match_reason.

## Important
- Never assign a volunteer who lacks critical skills for a safety-sensitive case.
- Do not exclude a volunteer solely because their language differs — reflect that in the score instead.
- If no volunteers match at all, return an empty candidates array with a clear no_match_reason.`,
  tools: {
    getCaseForMatching,
    getAvailableVolunteers,
    computeDistance,
    checkExistingAssignments,
  },
  output: Output.object({ schema: matchResultSchema }),
});
