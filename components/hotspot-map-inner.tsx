"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { MapCaseWithCoords } from "./hotspot-map";

function severityColor(severity: number): string {
  if (severity >= 8) return "#ef4444";
  if (severity >= 5) return "#f97316";
  return "#3b82f6";
}

export default function HotspotMapInner({ cases }: { cases: MapCaseWithCoords[] }) {
  const center: [number, number] = [12.9716, 77.5946]; // Bengaluru

  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {cases.map((c) => {
        const severity = c.assessments?.[0]?.severity ?? 5;
        return (
          <CircleMarker
            key={c.id}
            center={[c.lat, c.lng]}
            radius={Math.max(6, severity)}
            pathOptions={{
              color: severityColor(severity),
              fillColor: severityColor(severity),
              fillOpacity: 0.6,
            }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{c.title}</strong>
                <br />
                {c.location_label}
                <br />
                Severity: {severity}/10 | Status: {c.status}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
