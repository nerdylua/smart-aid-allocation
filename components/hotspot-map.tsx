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
  if (!loc) return null;

  // GeoJSON format: { type: "Point", coordinates: [lng, lat] }
  if (typeof loc === "object") {
    const geo = loc as { type?: string; coordinates?: number[] };
    if (geo.type === "Point" && Array.isArray(geo.coordinates) && geo.coordinates.length >= 2) {
      return { lat: geo.coordinates[1], lng: geo.coordinates[0] };
    }
  }

  // WKB hex format from PostGIS (e.g. "0101000020E6100000..." )
  if (typeof loc === "string" && /^[0-9a-fA-F]+$/.test(loc) && loc.length >= 42) {
    try {
      // EWKB Point with SRID: 01 01000020 E6100000 <X:16hex> <Y:16hex>
      // Standard WKB Point:    01 01000000 <X:16hex> <Y:16hex>
      let offset = 2; // skip byte order
      const typeHex = loc.slice(offset, offset + 8);
      offset += 8;
      // Check for SRID flag (0x20 in type)
      const typeInt = parseInt(typeHex.match(/../g)!.reverse().join(""), 16);
      if (typeInt & 0x20000000) offset += 8; // skip SRID (4 bytes)
      const xHex = loc.slice(offset, offset + 16);
      const yHex = loc.slice(offset + 16, offset + 32);
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      // Parse X (longitude)
      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(xHex.slice(i * 2, i * 2 + 2), 16));
      const lng = view.getFloat64(0, true); // little-endian
      // Parse Y (latitude)
      for (let i = 0; i < 8; i++) view.setUint8(i, parseInt(yHex.slice(i * 2, i * 2 + 2), 16));
      const lat = view.getFloat64(0, true);
      if (isFinite(lat) && isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        return { lat, lng };
      }
    } catch {
      // fall through to null
    }
  }

  return null;
}

// Leaflet requires browser APIs, so we dynamic-import with SSR disabled
const MapInner = dynamic(() => import("./hotspot-map-inner"), { ssr: false });

interface HotspotMapProps {
  cases: MapCase[];
  heightClassName?: string;
}

export function HotspotMap({
  cases,
  heightClassName = "h-[420px] md:h-[520px] xl:h-[580px]",
}: HotspotMapProps) {
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
    <div className={`border rounded-lg overflow-hidden ${heightClassName}`}>
      <MapInner cases={casesWithCoords} />
    </div>
  );
}
