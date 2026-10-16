"use client";

import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "motion/react";
import type { RideLocation } from "@/lib/ride";

const GoogleMapsView = dynamic(() => import("@/components/GoogleMapsView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[var(--surface-2)]" />,
});

const MAP_BOUNDS = { south: 17.61, north: 17.82, west: 83.12, east: 83.42 };

function getMapPoint(location: RideLocation) {
  const x = ((location.lng - MAP_BOUNDS.west) / (MAP_BOUNDS.east - MAP_BOUNDS.west)) * 660 + 30;
  const y = 385 - ((location.lat - MAP_BOUNDS.south) / (MAP_BOUNDS.north - MAP_BOUNDS.south)) * 345;
  return { x, y };
}

function MapIllustration({ pickup, dropoff }: { pickup: RideLocation; dropoff: RideLocation }) {
  const pickupPoint = getMapPoint(pickup);
  const dropoffPoint = getMapPoint(dropoff);
  const curveX = (pickupPoint.x + dropoffPoint.x) / 2 + (dropoffPoint.y - pickupPoint.y) * 0.18;
  const curveY = (pickupPoint.y + dropoffPoint.y) / 2 - (dropoffPoint.x - pickupPoint.x) * 0.12;
  const route = `M ${pickupPoint.x} ${pickupPoint.y} Q ${curveX} ${curveY} ${dropoffPoint.x} ${dropoffPoint.y}`;
  const reduceMotion = useReducedMotion();
  const roads = [
    "M-20 75 C 100 112 120 36 260 64 S 470 108 740 34",
    "M-20 150 C 115 118 145 205 282 166 S 482 134 740 188",
    "M-20 275 C 106 219 170 315 280 275 S 476 230 740 302",
    "M52 -30 C 86 85 152 116 122 213 S 102 340 156 450",
    "M270 -30 C 230 80 319 134 279 220 S 304 335 248 450",
    "M464 -30 C 412 80 495 130 455 222 S 487 345 430 450",
    "M620 -30 C 567 73 643 164 590 242 S 630 342 577 450",
  ];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#edf0e8] dark:bg-[#131d17]">
      <div className="absolute inset-0 opacity-50 soft-grid" />
      <svg viewBox="0 0 720 420" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-label={`Illustrated route from ${pickup.name} to ${dropoff.name}`}>
        <defs>
          <pattern id="map-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#94a39a" fillOpacity=".2" />
          </pattern>
          <linearGradient id="route-gradient" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <rect width="720" height="420" fill="url(#map-dots)" />
        <path d="M-20 345 C 120 298 205 338 306 349 S 496 378 740 318" stroke="#d2e8e8" strokeWidth="46" fill="none" className="dark:opacity-20" />
        <path d="M-20 345 C 120 298 205 338 306 349 S 496 378 740 318" stroke="#fff" strokeWidth="2" strokeDasharray="7 7" fill="none" className="dark:opacity-20" />
        {roads.map((road, index) => (
          <g key={road}>
            <path d={road} fill="none" stroke="#fff" strokeWidth={index < 3 ? 15 : 11} strokeLinecap="round" className="dark:stroke-[#29372e]" />
            <path d={road} fill="none" stroke="#d9ded6" strokeWidth="1.3" strokeDasharray={index < 3 ? "" : "3 9"} strokeLinecap="round" className="dark:stroke-[#455348]" />
          </g>
        ))}
        <path d={route} fill="none" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity=".9" />
        <motion.path
          d={route}
          fill="none"
          stroke="url(#route-gradient)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="1"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0.7 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 1.45, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        />
        <motion.g initial={reduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.8 }}>
          <circle cx={pickupPoint.x} cy={pickupPoint.y} r="13" fill="#10b981" fillOpacity=".15" />
          <circle cx={pickupPoint.x} cy={pickupPoint.y} r="7" fill="#059669" stroke="white" strokeWidth="3" />
        </motion.g>
        <motion.g initial={reduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18, delay: 1.02 }}>
          <circle cx={dropoffPoint.x} cy={dropoffPoint.y} r="13" fill="#111827" fillOpacity=".12" />
          <rect x={dropoffPoint.x - 6} y={dropoffPoint.y - 6} width="12" height="12" rx="3" fill="#111827" stroke="white" strokeWidth="3" className="dark:fill-emerald-300 dark:stroke-[#102016]" />
        </motion.g>
        <text x="28" y="34" fill="#728078" fontSize="9" fontWeight="700" letterSpacing="2">VISAKHAPATNAM · AP</text>
      </svg>
      <motion.div className="absolute left-4 top-4 rounded-full border border-white/70 bg-white/80 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.17em] text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/70 dark:text-zinc-200" initial={reduceMotion ? false : { y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
        Route preview · Vizag
      </motion.div>
      <motion.div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-2 text-[10px] font-semibold text-zinc-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-900/75 dark:text-zinc-200" animate={reduceMotion ? undefined : { y: [0, -3, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }}>
        <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.65)]" />
        Pickup and drop-off
      </motion.div>
    </div>
  );
}

export default function RideMap({ pickup, dropoff }: { pickup: RideLocation; dropoff: RideLocation }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    return <GoogleMapsView apiKey={apiKey} pickup={pickup} dropoff={dropoff} />;
  }

  return <MapIllustration pickup={pickup} dropoff={dropoff} />;
}
