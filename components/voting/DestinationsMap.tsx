"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapDestination {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  voteCount: number;
}

interface DestinationsMapProps {
  destinations: MapDestination[];
  highlightId?: string | null;
  heightClassName?: string;
}

function buildMarkerIcon(voteCount: number, highlighted: boolean) {
  const size = highlighted ? 36 : Math.min(34, 22 + voteCount * 3);
  const background = highlighted ? "#059669" : "#18181b";

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${background};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.35);">${voteCount}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export default function DestinationsMap({
  destinations,
  highlightId = null,
  heightClassName = "h-72",
}: DestinationsMapProps) {
  const located = useMemo(
    () =>
      destinations.filter(
        (d): d is MapDestination & { latitude: number; longitude: number } =>
          d.latitude != null && d.longitude != null
      ),
    [destinations]
  );

  if (located.length === 0) {
    return (
      <div
        className={`flex ${heightClassName} items-center justify-center rounded-lg border border-dashed border-sage-300 text-sm text-sage-500`}
      >
        No destinations have a map location yet.
      </div>
    );
  }

  const bounds = L.latLngBounds(located.map((d) => [d.latitude, d.longitude]));

  return (
    <div className={`${heightClassName} overflow-hidden rounded-lg border border-sage-200`}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [32, 32], maxZoom: 12 }}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map((d) => (
          <Marker
            key={d.id}
            position={[d.latitude, d.longitude]}
            icon={buildMarkerIcon(d.voteCount, d.id === highlightId)}
          >
            <Popup>
              <span className="font-medium">{d.name}</span>
              <br />
              {d.voteCount} {d.voteCount === 1 ? "vote" : "votes"}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
