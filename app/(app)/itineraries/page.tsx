"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Itinerary {
  id: string;
  name: string | null;
  status: string;
  planned_date: string;
  assignments: string[];
  total_distance_km: number | null;
  estimated_hours: number | null;
}

const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
};

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/itineraries")
      .then((r) => r.json())
      .then((data) => { setItineraries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground">Loading routes...</div>;

  const active = itineraries.filter((i) => i.status !== "completed");
  const completed = itineraries.filter((i) => i.status === "completed");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Routes</h2>
        <p className="text-muted-foreground">
          Planned itineraries for volunteer field visits.
        </p>
      </div>

      {itineraries.length === 0 && (
        <p className="text-sm text-muted-foreground">No routes planned yet. Routes are created from the assignments page.</p>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Active ({active.length})</h3>
          {active.map((it) => (
            <Card key={it.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{it.name ?? "Unnamed Route"}</CardTitle>
                  <Badge variant="secondary" className={statusColors[it.status] ?? ""}>
                    {it.status.replace("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{it.planned_date}</span>
                  <span>{it.assignments.length} stops</span>
                  {it.total_distance_km != null && <span>{it.total_distance_km} km</span>}
                  {it.estimated_hours != null && <span>~{it.estimated_hours}h</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Completed ({completed.length})</h3>
          {completed.map((it) => (
            <div key={it.id} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <span className="text-sm font-medium">{it.name}</span>
                <span className="text-xs text-muted-foreground ml-2">
                  {it.planned_date} &middot; {it.assignments.length} stops
                </span>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">completed</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
