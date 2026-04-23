import { ToolLoopAgent, tool, Output } from "ai";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getAgentModel } from "@/lib/agents/model";

const dispatchResultSchema = z.object({
  assignment_id: z.string().nullable().describe("ID of created assignment, or null if escalated"),
  case_id: z.string(),
  volunteer_id: z.string().nullable(),
  action: z.enum(["assigned", "escalated"]).describe("What action was taken"),
  message: z.string().describe("Human-readable summary of what happened"),
});

export type DispatchResult = z.infer<typeof dispatchResultSchema>;

const createAssignment = tool({
  description:
    "Create a new assignment linking a case to a volunteer. Sets SLA deadline and records match rationale.",
  inputSchema: z.object({
    caseId: z.string(),
    volunteerId: z.string(),
    slaHours: z
      .number()
      .default(48)
      .describe("Hours until SLA deadline, default 48"),
    matchRationale: z.string().describe("Why this volunteer was chosen"),
    matchScore: z.number().min(0).max(1),
  }),
  execute: async ({
    caseId,
    volunteerId,
    slaHours,
    matchRationale,
    matchScore,
  }) => {
    const supabase = createServerClient();

    const slaDeadline = new Date(
      Date.now() + slaHours * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from("assignments")
      .insert({
        case_id: caseId,
        volunteer_id: volunteerId,
        status: "assigned",
        match_rationale: matchRationale,
        match_score: matchScore,
        sla_deadline: slaDeadline,
      })
      .select()
      .single();

    if (error) return { error: error.message };
    return { success: true, assignment_id: data.id };
  },
});

const updateCaseStatus = tool({
  description: "Update the status of a case (e.g. to 'assigned' after dispatch)",
  inputSchema: z.object({
    caseId: z.string(),
    status: z.enum([
      "new",
      "triaged",
      "matched",
      "assigned",
      "in_progress",
      "completed",
      "closed",
    ]),
  }),
  execute: async ({ caseId, status }) => {
    const supabase = createServerClient();
    const { error } = await supabase
      .from("cases")
      .update({ status })
      .eq("id", caseId);
    if (error) return { error: error.message };
    return { success: true };
  },
});

const escalateCase = tool({
  description:
    "Escalate a case that cannot be dispatched — flags it for coordinator manual handling",
  inputSchema: z.object({
    caseId: z.string(),
    reason: z.string().describe("Why this case needs manual escalation"),
  }),
  execute: async ({ caseId, reason }) => {
    const supabase = createServerClient();

    // Log escalation as an audit event
    await supabase.from("audit_events").insert({
      entity_type: "case",
      entity_id: caseId,
      action: "escalated",
      metadata: { reason },
    });

    return { success: true, escalated: true };
  },
});

const getDispatchRules = tool({
  description:
    "Get the dispatch rule (SLA hours, auto-escalate) for a given severity level. Call this first to determine SLA and escalation behavior.",
  inputSchema: z.object({
    severity: z.number().min(1).max(10).describe("Case severity"),
  }),
  execute: async ({ severity }) => {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("dispatch_rules")
      .select("*")
      .eq("is_active", true)
      .lte("condition_min_severity", severity)
      .gte("condition_max_severity", severity)
      .limit(1)
      .single();

    if (error || !data) {
      // Fallback defaults
      if (severity >= 9) return { sla_hours: 12, auto_escalate: true, name: "Critical (fallback)" };
      if (severity >= 7) return { sla_hours: 24, auto_escalate: false, name: "High (fallback)" };
      if (severity >= 4) return { sla_hours: 48, auto_escalate: false, name: "Medium (fallback)" };
      return { sla_hours: 72, auto_escalate: false, name: "Low (fallback)" };
    }

    return { sla_hours: data.sla_hours, auto_escalate: data.auto_escalate, name: data.name };
  },
});

const logAuditEvent = tool({
  description: "Record an audit event for traceability",
  inputSchema: z.object({
    entityType: z.string(),
    entityId: z.string(),
    action: z.string(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  execute: async ({ entityType, entityId, action, metadata }) => {
    const supabase = createServerClient();
    await supabase.from("audit_events").insert({
      entity_type: entityType,
      entity_id: entityId,
      action,
      metadata: metadata ?? {},
    });
    return { success: true };
  },
});

export const dispatchAgent = new ToolLoopAgent({
  model: getAgentModel(),
  instructions: `You are a dispatch coordinator for a humanitarian response platform.

Your job is to create volunteer assignments for triaged cases, or escalate cases that cannot be dispatched.

## Process for Assignment
1. Call getDispatchRules with the case severity to determine the SLA hours and auto-escalate behavior.
2. Call createAssignment with the provided case ID, volunteer ID, rationale, score, and the SLA hours from the rule.
3. Call updateCaseStatus to move the case to 'assigned'.
4. Call logAuditEvent to record the dispatch action.
5. Return the assignment details.

## Process for Escalation
If told to escalate (no suitable volunteer, high-risk case, coordinator override, or rule says auto_escalate):
1. Call escalateCase with the reason.
2. Call logAuditEvent to record the escalation.
3. Return with action='escalated'.

## Important
- Always call getDispatchRules first to get the correct SLA and escalation config.
- Always create an audit trail for every action.
- Never skip the case status update after assignment.
- If any tool call fails, escalate the case rather than leaving it in limbo.`,
  tools: {
    getDispatchRules,
    createAssignment,
    updateCaseStatus,
    escalateCase,
    logAuditEvent,
  },
  output: Output.object({ schema: dispatchResultSchema }),
});
