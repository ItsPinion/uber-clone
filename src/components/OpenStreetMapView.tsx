"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { RideLocation } from "@/lib/ride";
import { createRoadRouteUrl, parseRoadRoute, type RoadRoute } from "@/lib/road-routing";

type RouteStatus = "loading" | "ready" | "fallback";

function FitRoute({ coordinates }: { coordinates: LatLngExpression[] }) {
  const map = useMap();
  const bounds = useMemo<LatLngBoundsExpression>(
    () => coordinates as LatLngBoundsExpression,
    [coordinates],
  );

  useEffect(() => {
    if (coordinates.length > 1) map.fitBounds(bounds, { padding: [48, 48], maxZoom: 14 });
  }, [bounds, coordinates.length, map]);

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
  const [routeResult, setRouteResult] = useState<{
    url: string;
    status: Exclude<RouteStatus, "loading">;
    route: RoadRoute | null;
  } | null>(null);
  const center: LatLngExpression = [(pickup.lat + dropoff.lat) / 2, (pickup.lng + dropoff.lng) / 2];
  const routeUrl = useMemo(
    () => createRoadRouteUrl(pickup, dropoff),
    [dropoff, pickup],
  );
  const matchingResult = routeResult?.url === routeUrl ? routeResult : null;
  const routeStatus: RouteStatus = matchingResult?.status ?? "loading";
  const roadRoute = routeStatus === "ready" ? matchingResult?.route ?? null : null;
  const directRoute = useMemo<LatLngExpression[]>(
    () => [[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]],
    [dropoff.lat, dropoff.lng, pickup.lat, pickup.lng],
  );
  const routeCoordinates: LatLngExpression[] = roadRoute?.coordinates ?? directRoute;

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

    fetch(routeUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Road routing returned ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        if (!isCurrent) return;
        const route = parseRoadRoute(payload);
        if (!route) throw new Error("No road route was returned");
        setRouteResult({ url: routeUrl, status: "ready", route });
      })
      .catch(() => {
        if (isCurrent) setRouteResult({ url: routeUrl, status: "fallback", route: null });
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [routeUrl]);

  const routeDescription = routeStatus === "ready" && roadRoute
    ? "Road-following route · trip metrics are estimates"
    : routeStatus === "loading"
      ? "Finding a road route…"
      : "Road route unavailable · showing a direct line";

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
        <FitRoute coordinates={routeCoordinates} />
        <Polyline positions={routeCoordinates} pathOptions={{ color: "white", weight: 9, opacity: 0.9, lineCap: "round", lineJoin: "round" }} />
        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: "#059669",
            weight: 5,
            opacity: 0.98,
            lineCap: "round",
            lineJoin: "round",
            dashArray: roadRoute ? undefined : "8 8",
          }}
        />
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
      <div className="absolute bottom-3 left-3 z-[500] max-w-[78%] rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-[9px] leading-4 text-zinc-600 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/85 dark:text-zinc-300" role="status" aria-live="polite">
        {routeDescription}
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
