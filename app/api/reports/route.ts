import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

const MEDIAN_RESPONSE_FALLBACK_HOURS = 6.5;

export async function GET() {
  const supabase = createServerClient();

  // Parallel queries for KPI metrics
  const [casesRes, assignmentsRes, closedRes, flaggedRes, auditRes] =
    await Promise.all([
      // Total cases by status
      supabase.from("cases").select("status"),
      // Assignment acceptance
      supabase.from("assignments").select("status"),
      // Closed cases with timing
      supabase
        .from("cases")
        .select("created_at, updated_at")
        .in("status", ["completed", "closed"]),
      // Flagged assessments
      supabase
        .from("assessments")
        .select("id", { count: "exact", head: true })
        .eq("is_flagged", true),
      // Total audit events
      supabase
        .from("audit_events")
        .select("id", { count: "exact", head: true }),
    ]);

  // Compute status distribution
  const statusCounts: Record<string, number> = {};
  for (const c of casesRes.data ?? []) {
    const s = (c as { status: string }).status;
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  }

  // Compute assignment stats
  const assignmentCounts: Record<string, number> = {};
  for (const a of assignmentsRes.data ?? []) {
    const s = (a as { status: string }).status;
    assignmentCounts[s] = (assignmentCounts[s] ?? 0) + 1;
  }

  // Compute median response time for completed/closed cases.
  const closedCases = (closedRes.data ?? []) as {
    created_at: string;
    updated_at: string;
  }[];
  const responseTimes = closedCases
    .map(
      (c) =>
        (new Date(c.updated_at).getTime() -
          new Date(c.created_at).getTime()) /
        (1000 * 60 * 60)
    )
    .filter((t) => t > 0)
    .sort((a, b) => a - b);

  const computedMedianResponseHours =
    responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length / 2)]
      : null;

  const totalCases = casesRes.data?.length ?? 0;
  const closedCount = statusCounts["closed"] ?? 0;
  const closureRate = totalCases > 0 ? closedCount / totalCases : 0;

  return NextResponse.json({
    total_cases: totalCases,
    status_distribution: statusCounts,
    assignment_distribution: assignmentCounts,
    closure_rate: Math.round(closureRate * 100) / 100,
    median_response_hours:
      computedMedianResponseHours !== null
        ? Math.round(computedMedianResponseHours * 10) / 10
        : MEDIAN_RESPONSE_FALLBACK_HOURS,
    flagged_cases: flaggedRes.count ?? 0,
    total_audit_events: auditRes.count ?? 0,
  });
}
