"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { RideLocation } from "@/lib/ride";

function FitRoute({ pickup, dropoff }: { pickup: RideLocation; dropoff: RideLocation }) {
  const map = useMap();
  const bounds = useMemo<LatLngBoundsExpression>(
    () => [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
    [dropoff.lat, dropoff.lng, pickup.lat, pickup.lng],
  );

  useEffect(() => {
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [bounds, map]);

  return null;
}

export default function OpenStreetMapView({
  pickup,
  dropoff,
  onUseIllustration,
}: {
  pickup: RideLocation;
  dropoff: RideLocation;
  onUseIllustration: () => void;
}) {
  const [tilesUnavailable, setTilesUnavailable] = useState(false);
  const center: LatLngExpression = [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2];
  const route: LatLngExpression[] = [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e8eee7] dark:bg-[#17221a]">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="z-0 h-full min-h-[300px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTilesUnavailable(true),
            tileload: () => setTilesUnavailable(false),
          }}
        />
        <FitRoute pickup={pickup} dropoff={dropoff} />
        <Polyline positions={route} pathOptions={{ color: "#059669", weight: 5, opacity: 0.9, dashArray: "10 8" }} />
        <CircleMarker center={[pickup.lat, pickup.lng]} radius={9} pathOptions={{ color: "white", weight: 3, fillColor: "#059669", fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -9]}>{`Pickup: ${pickup.name}`}</Tooltip>
        </CircleMarker>
        <CircleMarker center={[dropoff.lat, dropoff.lng]} radius={9} pathOptions={{ color: "white", weight: 3, fillColor: "#111827", fillOpacity: 1 }}>
          <Tooltip direction="top" offset={[0, -9]}>{`Drop-off: ${dropoff.name}`}</Tooltip>
        </CircleMarker>
      </MapContainer>

      <div className="pointer-events-none absolute left-3 top-3 z-[500] rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.17em] text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/85 dark:text-zinc-200">
        OpenStreetMap · Vizag
      </div>
      <div className="absolute bottom-3 left-3 z-[500] max-w-[70%] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[9px] leading-4 text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/85 dark:text-zinc-300">
        Approximate straight-line route · fare and distance are estimates
      </div>
      {tilesUnavailable && (
        <div role="status" className="absolute right-3 top-3 z-[500] flex max-w-[230px] items-center gap-2 rounded-xl border border-amber-500/25 bg-white/95 px-3 py-2 text-[9px] leading-4 text-zinc-700 shadow-md dark:bg-zinc-900/95 dark:text-zinc-200">
          Map tiles are unavailable.
          <button type="button" onClick={onUseIllustration} className="shrink-0 font-bold text-emerald-700 underline underline-offset-2 dark:text-emerald-300">Use local illustration</button>
        </div>
      )}
    </div>
  );
}
