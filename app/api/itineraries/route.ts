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

const locationCoordsFallback: Record<string, [number, number]> = {
  shivajinagar: [12.9841, 77.6053],
  koramangala: [12.9352, 77.6245],
  indiranagar: [12.9719, 77.6412],
  "electronic city": [12.8456, 77.6603],
  yeshwanthpur: [13.028, 77.54],
  whitefield: [12.9698, 77.75],
  "hsr layout": [12.9082, 77.6476],
  marathahalli: [12.9569, 77.7011],
  yelahanka: [13.1007, 77.5963],
  hoskote: [13.0707, 77.7984],
  bommanahalli: [12.8995, 77.622],
  malleshwaram: [13.006, 77.57],
  jayanagar: [12.925, 77.5938],
  "kr puram": [13.0055, 77.7],
  "k r puram": [13.0055, 77.7],
};

function getFallbackCoords(label: string | null | undefined) {
  if (!label) return null;
  const normalized = label
    .toLowerCase()
    .replace(/\b(bengaluru|bangalore|metro|karnataka|india)\b/g, "")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return locationCoordsFallback[normalized] ?? null;
}

function parseLocation(loc: unknown): { lat: number; lng: number } | null {
  if (!loc) return null;

  if (typeof loc === "object") {
    const geo = loc as { type?: string; coordinates?: number[] };
    if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
    }
  }

  if (typeof loc === "string" && /^[0-9a-fA-F]+$/.test(loc) && loc.length >= 42) {
    try {
      const littleEndian = loc.slice(0, 2) === "01";
      let offset = 2;
      const typeHex = loc.slice(offset, offset + 8);
      offset += 8;
      const typeInt = parseInt(
        littleEndian ? typeHex.match(/../g)!.reverse().join("") : typeHex,
        16
      );
      if (typeInt & 0x20000000) offset += 8;

      const xHex = loc.slice(offset, offset + 16);
      const yHex = loc.slice(offset + 16, offset + 32);
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);

      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(xHex.slice(i * 2, i * 2 + 2), 16));
      const lng = view.getFloat64(0, littleEndian);
      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(yHex.slice(i * 2, i * 2 + 2), 16));
      const lat = view.getFloat64(0, littleEndian);

      if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    } catch {
      return null;
    }
  }

  return null;
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
    cases: { location: unknown; location_label: string | null } | null;
  }

  const withCoords = ((assignments ?? []) as unknown as AssignmentWithCase[])
    .map((a) => {
      const parsed = parseLocation(a.cases?.location);
      if (parsed) {
        return { id: a.id, lat: parsed.lat, lng: parsed.lng, label: a.cases?.location_label };
      }

      const fallback = getFallbackCoords(a.cases?.location_label);
      if (fallback) return { id: a.id, lat: fallback[0], lng: fallback[1], label: a.cases?.location_label };

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
