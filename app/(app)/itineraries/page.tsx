"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RouteMap } from "@/components/route-map";

interface Itinerary {
  id: string;
  name: string | null;
  status: string;
  planned_date: string;
  assignments: string[];
  total_distance_km: number | null;
  estimated_hours: number | null;
}

interface ItineraryDetail extends Itinerary {
  stops: Array<{
    id: string;
    case_id: string;
    status: string;
    cases: {
      title: string;
      location_label: string | null;
      location: unknown;
    };
  }>;
}

const statusColors: Record<string, string> = {
  planned: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
};

export default function ItinerariesPage() {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [selectedItinerary, setSelectedItinerary] = useState<ItineraryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/itineraries")
      .then((r) => r.json())
      .then((data) => { setItineraries(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function viewItinerary(id: string) {
    const res = await fetch(`/api/itineraries/${id}`);
    const data = await res.json();
    setSelectedItinerary(data);
  }

  if (loading) return <div className="text-muted-foreground">Loading routes...</div>;

  // If viewing a specific itinerary, show detail view
  if (selectedItinerary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {selectedItinerary.name ?? "Unnamed Route"}
            </h2>
            <p className="text-muted-foreground">
              {selectedItinerary.planned_date} &middot; {selectedItinerary.stops.length} stops
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedItinerary(null)}>
            Back to Routes
          </Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <Badge variant="secondary" className={statusColors[selectedItinerary.status] ?? ""}>
                    {selectedItinerary.status.replace("_", " ")}
                  </Badge>
                </div>
                {selectedItinerary.total_distance_km != null && (
                  <div>
                    <span className="text-muted-foreground">Distance:</span>{" "}
                    <span className="font-medium">{selectedItinerary.total_distance_km} km</span>
                  </div>
                )}
                {selectedItinerary.estimated_hours != null && (
                  <div>
                    <span className="text-muted-foreground">Estimated Time:</span>{" "}
                    <span className="font-medium">~{selectedItinerary.estimated_hours}h</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Route Map</CardTitle>
            </CardHeader>
            <CardContent>
              <RouteMap stops={selectedItinerary.stops} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stops ({selectedItinerary.stops.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedItinerary.stops.map((stop, index) => (
                  <div key={stop.id} className="flex items-start gap-3 p-3 border rounded-md">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{stop.cases.title}</div>
                      <div className="text-sm text-muted-foreground">{stop.cases.location_label}</div>
                    </div>
                    <Badge variant="secondary">{stop.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List view
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
            <Card key={it.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => viewItinerary(it.id)}>
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
            <div 
              key={it.id} 
              className="flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => viewItinerary(it.id)}
            >
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
