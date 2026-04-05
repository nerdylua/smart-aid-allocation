import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const volunteerId = searchParams.get("volunteer_id");
  const supabase = createServerClient();

  let query = supabase.from("itineraries").select("*").order("planned_date", { ascending: false });
  if (volunteerId) query = query.eq("volunteer_id", volunteerId);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const supabase = createServerClient();

  const { volunteer_id, assignment_ids, planned_date, name } = body;

  if (!volunteer_id || !assignment_ids?.length || !planned_date) {
    return NextResponse.json({ error: "volunteer_id, assignment_ids, and planned_date are required" }, { status: 400 });
  }

  // Fetch assignment locations via their cases
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, case_id, cases(location, location_label)")
    .in("id", assignment_ids);

  interface AssignmentWithCase {
    id: string;
    case_id: string;
    cases: { location: { type: string; coordinates: number[] } | null; location_label: string | null } | null;
  }

  const withCoords = ((assignments ?? []) as unknown as AssignmentWithCase[])
    .map((a) => {
      const loc = a.cases?.location;
      if (loc && typeof loc === "object" && "coordinates" in loc) {
        const coords = loc.coordinates as number[];
        return { id: a.id, lat: coords[1], lng: coords[0], label: a.cases?.location_label };
      }
      return null;
    })
    .filter(Boolean) as { id: string; lat: number; lng: number; label: string | null }[];

  // Greedy nearest-neighbor ordering
  let ordered: typeof withCoords = [];
  if (withCoords.length > 0) {
    const remaining = [...withCoords];
    // Start from first point (or volunteer location if available)
    let current = remaining.shift()!;
    ordered.push(current);

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < remaining.length; i++) {
        const d = haversine(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      }
      current = remaining.splice(nearestIdx, 1)[0];
      ordered.push(current);
    }
  } else {
    // No geocoded locations, keep original order
    ordered = assignment_ids.map((id: string) => ({ id, lat: 0, lng: 0, label: null }));
  }

  // Compute total distance
  let totalDistance = 0;
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].lat && ordered[i - 1].lat) {
      totalDistance += haversine(ordered[i - 1].lat, ordered[i - 1].lng, ordered[i].lat, ordered[i].lng);
    }
  }

  // Estimate hours: avg 15 km/h in city + 30 min per stop
  const estimatedHours = (totalDistance / 15) + (ordered.length * 0.5);

  const { data, error } = await supabase
    .from("itineraries")
    .insert({
      volunteer_id,
      name: name ?? `Route — ${planned_date}`,
      planned_date,
      assignments: ordered.map((o) => o.id),
      total_distance_km: Math.round(totalDistance * 100) / 100,
      estimated_hours: Math.round(estimatedHours * 10) / 10,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
