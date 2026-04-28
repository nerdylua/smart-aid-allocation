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
    const caseData = Array.isArray(stop.cases) ? stop.cases[0] : stop.cases;
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
      const fallback = getFallbackCoords(caseData.location_label);
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
