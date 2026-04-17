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
