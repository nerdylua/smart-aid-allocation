"use client";

import dynamic from "next/dynamic";

export interface RouteStop {
  id: string;
  lat: number;
  lng: number;
  title: string;
  location_label: string | null;
  status?: string;
}

const locationCoordsFallback: Record<string, [number, number]> = {
  "Shivajinagar, Bengaluru": [12.9841, 77.6053],
  "Koramangala, Bengaluru": [12.9352, 77.6245],
  "Indiranagar, Bengaluru": [12.9719, 77.6412],
  "Electronic City, Bengaluru": [12.8456, 77.6603],
  "Yeshwanthpur, Bengaluru": [13.028, 77.54],
  "Whitefield, Bengaluru": [12.9698, 77.75],
  "HSR Layout, Bengaluru": [12.9082, 77.6476],
  "Marathahalli, Bengaluru": [12.9569, 77.7011],
  "Yelahanka, Bengaluru": [13.1007, 77.5963],
  "Hoskote, Bengaluru Metro": [13.0707, 77.7984],
  "Bommanahalli, Bengaluru": [12.8995, 77.622],
  "Malleshwaram, Bengaluru": [13.006, 77.57],
  "Jayanagar, Bengaluru": [12.925, 77.5938],
  "KR Puram, Bengaluru": [13.0055, 77.7],
};

function parseLocation(loc: unknown): { lat: number; lng: number } | null {
  if (!loc) return null;

  // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
  if (typeof loc === "object") {
    const geo = loc as { type?: string; coordinates?: number[] };
    if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
    }
  }

  // WKB hex format from PostGIS
  if (typeof loc === "string" && /^[0-9a-fA-F]+$/.test(loc) && loc.length >= 42) {
    try {
      let offset = 2;
      const typeHex = loc.slice(offset, offset + 8);
      offset += 8;
      const typeInt = parseInt(typeHex.match(/../g)!.reverse().join(""), 16);
      if (typeInt & 0x20000000) offset += 8;
      const xHex = loc.slice(offset, offset + 16);
      const yHex = loc.slice(offset + 16, offset + 32);
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(xHex.slice(i * 2, i * 2 + 2), 16));
      const lng = view.getFloat64(0, true);
      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(yHex.slice(i * 2, i * 2 + 2), 16));
      const lat = view.getFloat64(0, true);
      if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    } catch {
      // fall through
    }
  }

  return null;
}

// Leaflet requires browser APIs
const RouteMapInner = dynamic(
  () => import("./route-map-inner"),
  { ssr: false }
);

interface RouteMapProps {
  stops: Array<{
    id: string;
    case_id?: string;
    status?: string;
    cases?: {
      title: string;
      location_label: string | null;
      location?: unknown;
    };
  }>;
}

export function RouteMap({ stops }: RouteMapProps) {
  const routeStops: RouteStop[] = [];

  for (const stop of stops) {
    const caseData = stop.cases;
    if (!caseData) continue;

    const parsed = parseLocation(caseData.location);
    if (parsed) {
      routeStops.push({
        id: stop.id,
        lat: parsed.lat,
        lng: parsed.lng,
        title: caseData.title,
        location_label: caseData.location_label,
        status: stop.status,
      });
    } else {
      const fallback = locationCoordsFallback[caseData.location_label ?? ""];
      if (fallback) {
        routeStops.push({
          id: stop.id,
          lat: fallback[0],
          lng: fallback[1],
          title: caseData.title,
          location_label: caseData.location_label,
          status: stop.status,
        });
      }
    }
  }

  if (routeStops.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground" style={{ height: 400 }}>
        No route data available
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden" style={{ height: 400 }}>
      <RouteMapInner stops={routeStops} />
    </div>
  );
}
