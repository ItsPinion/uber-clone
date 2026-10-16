"use client";

import { useEffect } from "react";
import { APIProvider, AdvancedMarker, ColorScheme, Map, useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";
import type { RideLocation } from "@/lib/ride";

function DrivingRoute({ pickup, dropoff }: { pickup: RideLocation; dropoff: RideLocation }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary("routes");

  useEffect(() => {
    if (!map || !routesLibrary) return;

    const renderer = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#059669",
        strokeOpacity: 0.9,
        strokeWeight: 5,
      },
    });

    void new routesLibrary.DirectionsService()
      .route({
        origin: { lat: pickup.lat, lng: pickup.lng },
        destination: { lat: dropoff.lat, lng: dropoff.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .then((directions) => renderer.setDirections(directions))
      .catch(() => renderer.setMap(null));

    return () => renderer.setMap(null);
  }, [dropoff.lat, dropoff.lng, map, pickup.lat, pickup.lng, routesLibrary]);

  return null;
}

export default function GoogleMapsView({
  apiKey,
  pickup,
  dropoff,
}: {
  apiKey: string;
  pickup: RideLocation;
  dropoff: RideLocation;
}) {
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const center = { lat: (pickup.lat + dropoff.lat) / 2, lng: (pickup.lng + dropoff.lng) / 2 };

  return (
    <APIProvider apiKey={apiKey} libraries={["routes", "marker"]}>
      <Map
        mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID"}
        center={center}
        zoom={12}
        colorScheme={resolvedTheme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT}
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        clickableIcons={false}
        className="h-full w-full"
      >
        <AdvancedMarker position={{ lat: pickup.lat, lng: pickup.lng }} title={`Pickup: ${pickup.name}`}>
          <motion.div initial={reduceMotion ? false : { y: -12, scale: 0.6 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 17 }} className="relative flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500 shadow-lg shadow-emerald-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            <span className="absolute inset-[-7px] animate-pulse-soft rounded-full border border-emerald-500/60" />
          </motion.div>
        </AdvancedMarker>
        <AdvancedMarker position={{ lat: dropoff.lat, lng: dropoff.lng }} title={`Drop-off: ${dropoff.name}`}>
          <motion.div initial={reduceMotion ? false : { y: -12, scale: 0.6 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 17, delay: 0.08 }} className="flex h-7 w-7 items-center justify-center rounded-[8px] border-2 border-white bg-zinc-950 shadow-lg dark:bg-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-zinc-950" />
          </motion.div>
        </AdvancedMarker>
        <DrivingRoute pickup={pickup} dropoff={dropoff} />
      </Map>
    </APIProvider>
  );
}
