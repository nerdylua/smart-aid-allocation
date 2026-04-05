import { Suspense } from "react";
import { createServerClient } from "@/lib/supabase/server";
import { KpiCards } from "@/components/kpi-cards";
import { CaseQueue } from "@/components/case-queue";
import { HotspotMap } from "@/components/hotspot-map";
import { BiasAuditPanel } from "@/components/bias-audit-panel";
import { RealtimeRefresh } from "@/components/realtime-refresh";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createServerClient();

  // Parallel data fetches — all via Supabase server client (no self-fetch)
  const [casesRes, flaggedRes, incidentsRes] = await Promise.all([
    supabase
      .from("cases")
      .select("id, title, status, location_label, location, language, created_at, assessments(priority_score, severity, is_flagged)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("assessments")
      .select("id", { count: "exact", head: true })
      .eq("is_flagged", true),
    supabase
      .from("incidents")
      .select("id, name, status, type")
      .in("status", ["active", "monitoring"])
      .limit(5),
  ]);

  const cases = (casesRes.data ?? []) as Array<{
    id: string;
    title: string;
    status: string;
    location_label: string | null;
    location: unknown;
    language: string;
    created_at: string;
    assessments: { priority_score: number; severity: number; is_flagged: boolean }[];
  }>;

  // Compute KPIs directly from case data
  const statusCounts: Record<string, number> = {};
  for (const c of cases) {
    statusCounts[c.status] = (statusCounts[c.status] ?? 0) + 1;
  }
  const closedCount = statusCounts["closed"] ?? 0;
  const closureRate = cases.length > 0 ? closedCount / cases.length : 0;

  const kpiData = {
    total_cases: cases.length,
    closure_rate: Math.round(closureRate * 100) / 100,
    median_response_hours: null as number | null,
    flagged_cases: flaggedRes.count ?? 0,
    status_distribution: statusCounts,
  };

  return (
    <div className="space-y-6">
      <RealtimeRefresh />
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Command Dashboard</h2>
        <p className="text-muted-foreground">
          Real-time overview of cases, hotspots, and response metrics.
        </p>
      </div>

      <KpiCards data={kpiData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">Hotspot Map</h3>
          <Suspense fallback={<div className="h-[400px] border rounded-lg flex items-center justify-center text-muted-foreground">Loading map...</div>}>
            <HotspotMap cases={cases} />
          </Suspense>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Priority Queue ({cases.length} cases)
          </h3>
          <CaseQueue cases={cases} />
        </div>
      </div>

      {/* Active Incidents */}
      {(incidentsRes.data ?? []).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Active Incidents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(incidentsRes.data ?? []).map((i: { id: string; name: string; status: string; type: string | null }) => (
              <a key={i.id} href={`/incidents/${i.id}`} className="block p-3 border rounded-md hover:bg-muted/50">
                <div className="font-medium text-sm">{i.name}</div>
                <div className="text-xs text-muted-foreground">{i.type ?? "incident"} &middot; {i.status}</div>
              </a>
            ))}
          </div>
        </div>
      )}

      <BiasAuditPanel />
    </div>
  );
}
