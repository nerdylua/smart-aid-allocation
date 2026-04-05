"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface IncidentDetail {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  status: string;
  location_label: string | null;
  target_cases: number | null;
  started_at: string;
  resolved_at: string | null;
  cases: {
    id: string;
    title: string;
    status: string;
    location_label: string | null;
    created_at: string;
    assessments: { priority_score: number; severity: number }[];
  }[];
}

const statusColors: Record<string, string> = {
  active: "bg-red-100 text-red-800",
  monitoring: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function IncidentDetailPage() {
  const params = useParams();
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/incidents/${params.id}`)
      .then((r) => r.json())
      .then((d) => { setIncident(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  async function updateStatus(status: string) {
    await fetch(`/api/incidents/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const res = await fetch(`/api/incidents/${params.id}`);
    setIncident(await res.json());
  }

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (!incident) return <div className="text-muted-foreground">Incident not found</div>;

  const cases = incident.cases ?? [];
  const closedCount = cases.filter((c) => c.status === "closed").length;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{incident.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary" className={statusColors[incident.status] ?? ""}>
              {incident.status}
            </Badge>
            {incident.type && <span className="text-sm text-muted-foreground">{incident.type}</span>}
            {incident.location_label && <span className="text-sm text-muted-foreground">| {incident.location_label}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {incident.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("monitoring")}>
              Set Monitoring
            </Button>
          )}
          {(incident.status === "active" || incident.status === "monitoring") && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("resolved")}>
              Resolve
            </Button>
          )}
        </div>
      </div>

      {incident.description && (
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm">{incident.description}</p>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cases.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{closedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{incident.target_cases ?? "—"}</div>
            {incident.target_cases && (
              <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${Math.min((closedCount / incident.target_cases) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cases list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cases ({cases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">No cases linked to this incident yet.</p>
          ) : (
            <div className="space-y-2">
              {cases.map((c) => {
                const severity = c.assessments?.[0]?.severity;
                return (
                  <Link key={c.id} href={`/cases/${c.id}`}>
                    <div className="flex items-center justify-between p-2 border rounded-md hover:bg-muted/50">
                      <div>
                        <span className="text-sm font-medium">{c.title}</span>
                        <span className="text-xs text-muted-foreground ml-2">{c.location_label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {severity && (
                          <span className={`text-xs font-mono ${severity >= 8 ? "text-red-600" : severity >= 5 ? "text-orange-600" : ""}`}>
                            {severity}/10
                          </span>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {c.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
