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

const getCaseForMatching = tool({
  description:
    "Fetch case details needed for volunteer matching: needs, location, language, person_info",
  inputSchema: z.object({
    caseId: z.string(),
  }),
  execute: async ({ caseId }) => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("cases")
      .select("id, title, needs, location, location_label, language, person_info")
      .eq("id", caseId)
      .single();
    if (error) return { error: error.message };
    return data;
  },
});

const getAvailableVolunteers = tool({
  description:
    "Fetch available volunteers filtered by skills and/or language. Returns volunteers with their skills, language, and location.",
  inputSchema: z.object({
    skills: z
      .array(z.string())
      .optional()
      .describe("Filter by any of these skills (OR match)"),
    language: z
      .string()
      .optional()
      .describe("Preferred language code (e.g. 'hi', 'mr', 'en')"),
  }),
  execute: async ({ skills, language }) => {
    const supabase = createServerClient();
    let query = supabase
      .from("users")
      .select("id, name, skills, language, location, availability, staffing, action")
      .eq("role", "volunteer")
      .in("staffing", ["available", "on_shift"])
      .eq("action", "idle");

    if (language) {
      query = query.eq("language", language);
    }

    const { data, error } = await query.limit(20);
    if (error) return { error: error.message };

    // If skills filter provided, do client-side overlap check
    const results = data ?? [];
    if (skills && skills.length > 0) {
      const withSkillMatch = results.map((v) => ({
        ...v,
        matching_skills: (v.skills as string[] ?? []).filter((s: string) =>
          skills.some((needed) => s.toLowerCase().includes(needed.toLowerCase()))
        ),
      }));
      // Sort by number of matching skills, but keep all
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
1. Call getCaseForMatching to understand the case needs, location, and language.
2. Call getAvailableVolunteers with relevant skill keywords extracted from the case needs.
3. For promising candidates, call computeDistance to check proximity.
4. Call checkExistingAssignments for top candidates to check workload.
5. Rank and return the top 3 candidates.

## Matching Criteria (weighted)
- **Skills match** (35%): Do the volunteer's skills align with case needs?
- **Language match** (25%): Does the volunteer speak the case's language?
- **Proximity** (25%): How close is the volunteer to the case location?
- **Availability** (15%): Is the volunteer not overloaded with existing assignments?

## Scoring
- Compute a match_score (0-1) for each candidate based on the weighted criteria above.
- Be specific in the rationale about why each volunteer was selected.
- If fewer than 3 suitable volunteers are found, explain why in no_match_reason.

## Important
- Never assign a volunteer who lacks critical skills for a safety-sensitive case.
- Prefer volunteers who speak the beneficiary's language.
- If no volunteers match at all, return an empty candidates array with a clear no_match_reason.`,
  tools: {
    getCaseForMatching,
    getAvailableVolunteers,
    computeDistance,
    checkExistingAssignments,
  },
  output: Output.object({ schema: matchResultSchema }),
});
