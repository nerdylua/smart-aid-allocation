import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("assessments")
    .select("severity, vulnerability, priority_score, is_flagged, confidence, case_id, cases(location_label, language, needs)");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface Row {
    severity: number;
    vulnerability: number;
    priority_score: number;
    is_flagged: boolean;
    confidence: number;
    cases: { location_label: string | null; language: string; needs: { type: string }[] } | null;
  }

  const rows = (data ?? []) as unknown as Row[];

  // Group by region
  const byRegion: Record<string, Row[]> = {};
  const byLanguage: Record<string, Row[]> = {};
  const byNeedType: Record<string, Row[]> = {};

  for (const r of rows) {
    const region = r.cases?.location_label ?? "Unknown";
    const lang = r.cases?.language ?? "unknown";
    const needType = (r.cases?.needs as { type: string }[])?.[0]?.type ?? "unknown";

    (byRegion[region] ??= []).push(r);
    (byLanguage[lang] ??= []).push(r);
    (byNeedType[needType] ??= []).push(r);
  }

  function computeStats(group: Record<string, Row[]>) {
    return Object.entries(group).map(([key, items]) => {
      const count = items.length;
      const avgSeverity = items.reduce((s, i) => s + i.severity, 0) / count;
      const avgVulnerability = items.reduce((s, i) => s + i.vulnerability, 0) / count;
      const avgPriority = items.reduce((s, i) => s + i.priority_score, 0) / count;
      const flagged = items.filter((i) => i.is_flagged).length;
      const flagRate = flagged / count;
      return {
        group: key,
        case_count: count,
        avg_severity: Math.round(avgSeverity * 10) / 10,
        avg_vulnerability: Math.round(avgVulnerability * 10) / 10,
        avg_priority_score: Math.round(avgPriority * 10) / 10,
        flag_rate: Math.round(flagRate * 100) / 100,
      };
    });
  }

  const regionStats = computeStats(byRegion);
  const languageStats = computeStats(byLanguage);
  const needTypeStats = computeStats(byNeedType);

  // Compute disparity ratio (max flag rate / min flag rate among groups with > 0 cases)
  function disparityRatio(stats: { flag_rate: number; case_count: number }[]) {
    const rates = stats.filter((s) => s.case_count >= 2).map((s) => s.flag_rate);
    if (rates.length < 2) return null;
    const min = Math.min(...rates);
    const max = Math.max(...rates);
    if (min === 0) return max > 0 ? Infinity : 1;
    return Math.round((max / min) * 100) / 100;
  }

  return NextResponse.json({
    by_region: regionStats,
    by_language: languageStats,
    by_need_type: needTypeStats,
    disparity: {
      region: disparityRatio(regionStats),
      language: disparityRatio(languageStats),
      need_type: disparityRatio(needTypeStats),
    },
    total_assessed: rows.length,
  });
}
