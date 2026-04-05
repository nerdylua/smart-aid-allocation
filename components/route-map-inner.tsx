"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { DivIcon } from "leaflet";
import "leaflet/dist/leaflet.css";

interface RouteStop {
  id: string;
  lat: number;
  lng: number;
  title: string;
  location_label: string | null;
  status?: string;
}

function createNumberedIcon(number: number): DivIcon {
  return new DivIcon({
    className: "custom-numbered-marker",
    html: `
      <div style="
        background-color: #3b82f6;
        color: white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${number}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function RouteMapInner({ stops }: { stops: RouteStop[] }) {
  // Calculate center as average of all stops
  const centerLat = stops.reduce((sum, s) => sum + s.lat, 0) / stops.length;
  const centerLng = stops.reduce((sum, s) => sum + s.lng, 0) / stops.length;
  const center: [number, number] = [centerLat, centerLng];

  // Create polyline path connecting all stops in order
  const polylinePath: [number, number][] = stops.map((s) => [s.lat, s.lng]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Draw polyline connecting all stops */}
      <Polyline
        positions={polylinePath}
        pathOptions={{
          color: "#3b82f6",
          weight: 3,
          opacity: 0.7,
          dashArray: "10, 10",
        }}
      />

      {/* Draw numbered markers for each stop */}
      {stops.map((stop, index) => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={createNumberedIcon(index + 1)}
        >
          <Popup>
            <div className="text-sm">
              <strong>Stop {index + 1}</strong>
              <br />
              {stop.title}
              <br />
              {stop.location_label}
              {stop.status && (
                <>
                  <br />
                  Status: {stop.status}
                </>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
