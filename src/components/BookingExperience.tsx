"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import RideMap from "@/components/RideMap";
import { calculateDistanceKm, estimateFare, formatRupees, getRidePricing, VIZAG_LOCATIONS, type RideCategory } from "@/lib/ride";
import { cancelRideRequest, saveRideRequest, useRideRequests } from "@/lib/ride-storage";

const RIDE_CATEGORIES: { id: RideCategory; description: string; icon: string; detail: string }[] = [
  { id: "mini", description: "A comfy city run", icon: "◌", detail: "Quick & easy" },
  { id: "comfort", description: "A little extra room", icon: "✳", detail: "Most popular" },
  { id: "xl", description: "Room for everyone", icon: "▦", detail: "Up to 6 seats" },
];

export default function BookingExperience() {
  const [pickupId, setPickupId] = useState("dwaraka");
  const [dropoffId, setDropoffId] = useState("rk-beach");
  const [category, setCategory] = useState<RideCategory>("comfort");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const rideRequests = useRideRequests();
  const reduceMotion = useReducedMotion();

  const pickup = VIZAG_LOCATIONS.find((location) => location.id === pickupId) ?? VIZAG_LOCATIONS[0];
  const dropoff = VIZAG_LOCATIONS.find((location) => location.id === dropoffId) ?? VIZAG_LOCATIONS[2];
  const distanceKm = useMemo(() => calculateDistanceKm(pickup, dropoff), [pickup, dropoff]);
  const fare = estimateFare(distanceKm, category);
  const pricing = getRidePricing(category);
  const eta = Math.max(4, Math.round(distanceKm * 1.6 + 3));
  const request = rideRequests.find((ride) => ride.id === requestId) ?? (requestId ? null : rideRequests[0] ?? null);

  function requestRide() {
    setError("");
    if (pickup.id === dropoff.id) {
      setError("Choose a different drop-off point so we can plan your trip.");
      return;
    }

    try {
      const created = saveRideRequest({ pickup, dropoff, distanceKm, fare, category });
      setRequestId(created.id);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not save this ride request.");
    }
  }

  function swapLocations() {
    setPickupId(dropoffId);
    setDropoffId(pickupId);
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-7 sm:py-11 lg:px-12">
      <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Link href="/dashboard" className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-emerald-700 dark:hover:text-emerald-300"><span className="transition-transform group-hover:-translate-x-1">←</span> Your CabBook space</Link>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">Let&apos;s go somewhere</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.065em] text-[var(--ink)] sm:text-5xl">Where to today?</h1>
          <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">Choose your stops. We&apos;ll take care of the in-between.</p>
        </div>
        <span className="flex w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]"><span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" /> Visakhapatnam, AP</span>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] xl:gap-7">
        <motion.section initial={reduceMotion ? false : { opacity: 0, x: -18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08, duration: 0.6 }} className="rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_16px_55px_rgba(15,23,18,0.045)] sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Plan your ride</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Pick-up & drop-off</h2>
            </div>
            <motion.span animate={reduceMotion ? undefined : { rotate: [0, 7, -5, 0] }} transition={{ duration: 4.5, repeat: Infinity }} className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-lg text-emerald-700 dark:text-emerald-300">⌖</motion.span>
          </div>

          <div className="relative mt-6 space-y-3">
            <div className="pointer-events-none absolute bottom-[-16px] left-[18px] top-[46px] border-l border-dashed border-emerald-500/40" />
            <label className="relative block rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-3.5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.17em] text-[var(--muted)]"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Pick-up location</span>
              <select value={pickupId} onChange={(event) => setPickupId(event.target.value)} className="mt-2 w-full appearance-none bg-transparent pr-7 text-sm font-semibold text-[var(--ink)] outline-none">
                {VIZAG_LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.area}</option>)}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 mt-1 text-[var(--muted)]">⌄</span>
            </label>

            <motion.button type="button" aria-label="Swap pick-up and drop-off" onClick={swapLocations} whileHover={reduceMotion ? undefined : { rotate: 180, scale: 1.06 }} whileTap={reduceMotion ? undefined : { scale: 0.92 }} transition={{ type: "spring", stiffness: 240, damping: 16 }} className="absolute right-3 top-[73px] z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--muted)] shadow-sm">↕</motion.button>

            <label className="relative block rounded-2xl border border-[var(--line)] bg-[var(--canvas)] p-3.5 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/10">
              <span className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.17em] text-[var(--muted)]"><span className="h-2 w-2 rounded-[2px] bg-zinc-950 dark:bg-emerald-300" /> Drop-off location</span>
              <select value={dropoffId} onChange={(event) => setDropoffId(event.target.value)} className="mt-2 w-full appearance-none bg-transparent pr-7 text-sm font-semibold text-[var(--ink)] outline-none">
                {VIZAG_LOCATIONS.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.area}</option>)}
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 mt-1 text-[var(--muted)]">⌄</span>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[var(--muted)]">Choose your ride</p>
              <p className="mt-1 text-xs text-[var(--muted)]">All fares are estimates</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{distanceKm.toFixed(1)} km · {eta} min</span>
          </div>

          <div className="mt-3 space-y-2">
            {RIDE_CATEGORIES.map((ride, index) => {
              const selected = category === ride.id;
              return (
                <motion.button key={ride.id} type="button" onClick={() => setCategory(ride.id)} whileHover={reduceMotion ? undefined : { x: 3 }} whileTap={reduceMotion ? undefined : { scale: 0.99 }} className={`relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${selected ? "border-emerald-500 bg-emerald-500/[0.07] shadow-[0_4px_20px_rgba(16,185,129,0.08)]" : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-2)]"}`}>
                  <motion.span animate={selected && !reduceMotion ? { y: [0, -2, 0], rotate: [0, -4, 0] } : undefined} transition={{ duration: 2.2 + index * 0.3, repeat: Infinity }} className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${selected ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-[var(--surface-2)] text-[var(--muted)]"}`}>{ride.icon}</motion.span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-xs font-bold text-[var(--ink)]">{getRidePricing(ride.id).label}{ride.id === "comfort" && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-bold uppercase text-emerald-700 dark:text-emerald-300">Popular</span>}</span>
                    <span className="mt-1 block text-[10px] text-[var(--muted)]">{ride.description} · {getRidePricing(ride.id).capacity}</span>
                  </span>
                  <span className="mr-1 text-right">
                    <span className="block text-sm font-bold text-[var(--ink)]">{formatRupees(estimateFare(distanceKm, ride.id))}</span>
                    <span className="mt-0.5 block text-[9px] text-[var(--muted)]">est. fare</span>
                  </span>
                  <span className={`absolute right-3 top-3 h-2 w-2 rounded-full transition-colors ${selected ? "bg-emerald-500" : "bg-transparent"}`} />
                </motion.button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {error && <motion.p key="booking-error" role="alert" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-200/30 dark:bg-rose-950/40 dark:text-rose-200">{error}</motion.p>}
          </AnimatePresence>

          <motion.button type="button" onClick={requestRide} whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }} className="group mt-5 flex w-full items-center justify-center gap-3 rounded-full bg-emerald-500 px-5 py-4 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-700/15 transition hover:bg-emerald-400">
            Request {pricing.label}<motion.span aria-hidden="true" animate={reduceMotion ? undefined : { x: [0, 4, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>↗</motion.span>
          </motion.button>
          <p className="mt-3 text-center text-[9px] leading-4 text-[var(--muted)]">Demo only: open <Link href="/driver" target="_blank" rel="noreferrer" className="font-bold text-emerald-700 underline decoration-emerald-500/30 underline-offset-2 dark:text-emerald-300">Driver dashboard</Link> in another tab to accept this request. Server-side matching comes with the backend.</p>
        </motion.section>

        <motion.section initial={reduceMotion ? false : { opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.14, duration: 0.65 }} className="flex min-h-[430px] flex-col overflow-hidden rounded-[26px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_16px_55px_rgba(15,23,18,0.045)] sm:min-h-[550px]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4 sm:px-6">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Your route</p><p className="mt-1 text-xs font-semibold text-[var(--ink)]">{pickup.area} <span className="mx-1 text-emerald-600">→</span> {dropoff.area}</p></div>
            <div className="flex items-center gap-2 rounded-full bg-[var(--surface-2)] p-1">
              <motion.button type="button" aria-label="Zoom in on route map" onClick={() => setZoom((value) => Math.min(1.28, value + 0.08))} whileTap={reduceMotion ? undefined : { scale: 0.85 }} className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface)]">+</motion.button>
              <motion.button type="button" aria-label="Zoom out on route map" onClick={() => setZoom((value) => Math.max(0.88, value - 0.08))} whileTap={reduceMotion ? undefined : { scale: 0.85 }} className="flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface)]">−</motion.button>
            </div>
          </div>
          <motion.div animate={{ scale: zoom }} transition={{ type: "spring", stiffness: 180, damping: 20 }} className="min-h-0 flex-1 origin-center">
            <RideMap pickup={pickup} dropoff={dropoff} />
          </motion.div>
          <div className="grid grid-cols-3 divide-x divide-[var(--line)] border-t border-[var(--line)]">
            <div className="px-3 py-4 text-center"><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Distance</p><p className="mt-1 text-sm font-bold text-[var(--ink)]">{distanceKm.toFixed(1)} km</p></div>
            <div className="px-3 py-4 text-center"><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Arrival</p><p className="mt-1 text-sm font-bold text-[var(--ink)]">~{eta} min</p></div>
            <div className="px-3 py-4 text-center"><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Estimated fare</p><p className="mt-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">{formatRupees(fare)}</p></div>
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {request && (
          <motion.section key={request.id} initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }} transition={{ type: "spring", stiffness: 210, damping: 22 }} className="mt-5 rounded-[24px] border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <motion.span animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], rotate: [0, 5, 0] }} transition={{ duration: 2.6, repeat: Infinity }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg text-zinc-950">✓</motion.span>
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">{request.status === "requested" ? "Your ride request is waiting" : request.status === "accepted" ? "A driver accepted your ride" : request.status === "in_progress" ? "You’re on your way" : request.status === "completed" ? "Trip complete — thanks for riding" : request.status === "declined" ? "This driver passed on the request" : "Demo request cancelled"}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{request.pickup.name} → {request.dropoff.name} · {getRidePricing(request.category).label} · {formatRupees(request.fare)}</p>
                  {request.driver && <p className="mt-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">{request.driver.name} · {request.driver.vehicle} · about {request.driver.pickupEtaMinutes} min away</p>}
                  <p className="mt-1 text-[9px] font-medium text-[var(--muted)]">Reference {request.id.slice(0, 13)} · demo request stored on this device</p>
                </div>
              </div>
              {request.status === "requested" && <motion.button type="button" onClick={() => cancelRideRequest(request.id)} whileHover={reduceMotion ? undefined : { scale: 1.03 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="w-fit rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-rose-700">Cancel request</motion.button>}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
