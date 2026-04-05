"use client";

import dynamic from "next/dynamic";

interface MapCase {
  id: string;
  title: string;
  status: string;
  location_label: string | null;
  location?: unknown;
  assessments: { severity: number; priority_score: number }[];
}

export interface MapCaseWithCoords {
  id: string;
  title: string;
  status: string;
  location_label: string | null;
  lat: number;
  lng: number;
  assessments: { severity: number; priority_score: number }[];
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
  if (!loc || typeof loc !== "object") return null;
  const geo = loc as { type?: string; coordinates?: number[] };
  if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
    return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
  }
  return null;
}

// Leaflet requires browser APIs, so we dynamic-import with SSR disabled
const MapInner = dynamic(() => import("./hotspot-map-inner"), { ssr: false });

export function HotspotMap({ cases }: { cases: MapCase[] }) {
  const casesWithCoords: MapCaseWithCoords[] = [];

  for (const c of cases) {
    const parsed = parseLocation(c.location);
    if (parsed) {
      casesWithCoords.push({ ...c, lat: parsed.lat, lng: parsed.lng });
    } else {
      const fallback = locationCoordsFallback[c.location_label ?? ""];
      if (fallback) {
        casesWithCoords.push({ ...c, lat: fallback[0], lng: fallback[1] });
      }
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden" style={{ height: 400 }}>
      <MapInner cases={casesWithCoords} />
    </div>
  );
}
