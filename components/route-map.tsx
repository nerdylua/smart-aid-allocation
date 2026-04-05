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

// Fallback coords for known Mumbai locations
const locationCoordsFallback: Record<string, [number, number]> = {
  "Dharavi, Mumbai": [19.043, 72.855],
  "Kurla West, Mumbai": [19.0728, 72.8826],
  "Andheri East, Mumbai": [19.1197, 72.8464],
  "Govandi, Mumbai": [19.0583, 72.912],
  "Malad West, Mumbai": [19.1861, 72.8385],
  "Bandra East, Mumbai": [19.0596, 72.8411],
  "Chembur, Mumbai": [19.0522, 72.9005],
  "Vikhroli, Mumbai": [19.1066, 72.9253],
  "Borivali West, Mumbai": [19.2307, 72.8567],
  "Thane, Mumbai Metro": [19.2183, 72.9781],
  "Mankhurd, Mumbai": [19.0666, 72.9333],
  "Dadar, Mumbai": [19.0178, 72.8478],
  "Sion, Mumbai": [19.04, 72.8622],
  "Mulund, Mumbai": [19.1726, 72.9561],
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
