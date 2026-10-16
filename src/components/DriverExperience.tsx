"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cacheServerRideUpdate, updateRideOnServer, useRideRequests } from "@/lib/ride-storage";
import { DEMO_DRIVER_LOCATION, formatRupees, getRidePricing, rankRideOffers } from "@/lib/ride";
import type { SavedRideRequest } from "@/lib/ride";

const DEMO_DRIVER = {
  vehicle: "Emerald sedan · 2024",
  plate: "DEMO · AP 31",
};

function RideStatusBadge({ status }: { status: SavedRideRequest["status"] }) {
  const labels: Record<SavedRideRequest["status"], string> = {
    requested: "New request",
    accepted: "Driver assigned",
    in_progress: "On the way",
    completed: "Completed",
    declined: "Passed on",
    cancelled: "Cancelled",
  };
  const color = status === "requested"
    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
    : status === "accepted" || status === "in_progress"
      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : "bg-[var(--surface-2)] text-[var(--muted)]";

  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${color}`}>
    {status === "requested" && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-amber-500" />}
    {labels[status]}
  </span>;
}

export default function DriverExperience() {
  const { isLoaded, user } = useUser();
  const userId = isLoaded ? user?.id ?? null : null;
  const requests = useRideRequests();
  const [isOnline, setIsOnline] = useState(true);
  const [error, setError] = useState("");
  const [updatingRideId, setUpdatingRideId] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const offers = useMemo(() => rankRideOffers(requests, DEMO_DRIVER_LOCATION), [requests]);
  const activeRide = requests.find((ride) => ride.status === "accepted" || ride.status === "in_progress");
  const completeCount = requests.filter((ride) => ride.status === "completed").length;
  const offeredCount = offers.length;
  const history = requests.filter((ride) => ["completed", "declined", "cancelled"].includes(ride.status)).slice(0, 4);

  async function updateRide(rideId: string, action: "accept" | "decline" | "start" | "complete") {
    if (!userId) {
      setError("Sign in before updating a ride.");
      return;
    }
    setError("");
    setUpdatingRideId(rideId);
    try {
      const updated = await updateRideOnServer(rideId, action);
      cacheServerRideUpdate(updated, action, userId);
    } catch (rideError) {
      setError(rideError instanceof Error ? rideError.message : "Could not update the ride status.");
    } finally {
      setUpdatingRideId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-7 sm:py-11 lg:px-12">
      <motion.header initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Link href="/dashboard" className="group inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)] transition hover:text-emerald-700 dark:hover:text-emerald-300"><span className="transition-transform group-hover:-translate-x-1">←</span> Rider home</Link>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">CabBook partner space</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.065em] text-[var(--ink)] sm:text-5xl">Your next ride is here.</h1>
          <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">Review nearby trip requests and choose what works for you.</p>
        </div>
        <motion.button type="button" onClick={() => setIsOnline((online) => !online)} whileHover={reduceMotion ? undefined : { y: -2 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }} aria-pressed={isOnline} className={`inline-flex w-fit items-center gap-3 rounded-full border px-4 py-2.5 text-xs font-bold transition ${isOnline ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]"}`}>
          <span className="relative flex h-2.5 w-2.5"><span className={`absolute inset-0 rounded-full ${isOnline ? "animate-ping bg-emerald-500/40" : ""}`} /><span className={`relative h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-zinc-400"}`} /></span>
          {isOnline ? "You’re online" : "You’re offline"}
          <span className={`relative h-5 w-9 rounded-full transition-colors ${isOnline ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"}`}><motion.span animate={{ x: isOnline ? 17 : 2 }} transition={{ type: "spring", stiffness: 420, damping: 28 }} className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm" /></span>
        </motion.button>
      </motion.header>

      <motion.section initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.08, duration: 0.6 }} className="relative mt-8 overflow-hidden rounded-[28px] bg-zinc-950 p-6 text-white sm:p-9">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-emerald-200/10" />
        <div className="absolute -right-7 -top-16 h-56 w-56 rounded-full border border-dashed border-emerald-200/15 animate-spin-slow" />
        <div className="relative z-10 flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/70"><span className="text-emerald-300">✳</span> Demo driver · {DEMO_DRIVER_LOCATION.area}</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">Good rides begin with a good match.</h2>
            <p className="mt-2 max-w-lg text-xs leading-5 text-white/55 sm:text-sm">Offers are sorted by pickup distance from your demo driver location. Accept one to assign it to this driver.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-64">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Open offers</p><motion.p key={offeredCount} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-2 text-3xl font-semibold tracking-tight text-emerald-300">{offeredCount.toString().padStart(2, "0")}</motion.p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur"><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/45">Trips completed</p><motion.p key={completeCount} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-2 text-3xl font-semibold tracking-tight text-white">{completeCount.toString().padStart(2, "0")}</motion.p></div>
          </div>
        </div>
      </motion.section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <section className="min-w-0">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div><p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Sorted by closest pick-up</p><h2 className="mt-1.5 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Trip requests <span className="text-[var(--muted)]">({offers.length})</span></h2></div>
            <span className="hidden text-[9px] text-[var(--muted)] sm:inline">Updates sync between same-browser tabs</span>
          </div>

          <AnimatePresence mode="popLayout">
            {offers.length > 0 ? (
              <motion.div layout className="space-y-3">
                {offers.map(({ ride, pickupDistanceKm, pickupEtaMinutes }, index) => (
                  <motion.article layout key={ride.id} initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -18, scale: 0.98 }} transition={{ delay: index * 0.045, duration: 0.35 }} whileHover={reduceMotion ? undefined : { y: -2 }} className="overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_12px_38px_rgba(15,23,18,0.035)]">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5">
                      <div className="flex items-center gap-2"><RideStatusBadge status={ride.status} /><span className="text-[9px] text-[var(--muted)]">{new Date(ride.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}</span></div>
                      <span className="text-[9px] font-semibold text-[var(--muted)]">Ref {ride.id.slice(0, 9)}</span>
                    </div>
                    <div className="grid gap-4 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
                      <div className="grid grid-cols-[20px_1fr] gap-x-3 gap-y-3">
                        <div className="relative flex flex-col items-center"><span className="z-[1] mt-1 h-2.5 w-2.5 rounded-full border-2 border-emerald-500 bg-[var(--surface)]" /><span className="my-1 h-6 border-l border-dashed border-[var(--line)]" /><span className="z-[1] h-2.5 w-2.5 rounded-[3px] bg-zinc-950 dark:bg-emerald-300" /></div>
                        <div><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Pick-up · {pickupEtaMinutes} min from you</p><p className="mt-1 text-sm font-semibold text-[var(--ink)]">{ride.pickup.name}</p><p className="text-[10px] text-[var(--muted)]">{ride.pickup.area}</p></div>
                        <span />
                        <div><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Drop-off</p><p className="mt-1 text-sm font-semibold text-[var(--ink)]">{ride.dropoff.name}</p><p className="text-[10px] text-[var(--muted)]">{ride.dropoff.area}</p></div>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-3 sm:min-w-44 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                        <div className="sm:text-right"><p className="text-[8px] font-bold uppercase tracking-[0.15em] text-[var(--muted)]">Estimated earnings</p><p className="mt-1 text-xl font-bold tracking-tight text-[var(--ink)]">{formatRupees(ride.fare)}</p><p className="text-[9px] text-[var(--muted)]">{getRidePricing(ride.category).label} · {ride.distanceKm.toFixed(1)} km</p></div>
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">{pickupDistanceKm.toFixed(1)} km away</span>
                      </div>
                    </div>
                    <div className="flex gap-2 border-t border-[var(--line)] bg-[var(--canvas)]/60 p-3 sm:justify-end sm:px-5">
                      <motion.button type="button" disabled={!isOnline || Boolean(activeRide) || updatingRideId === ride.id} onClick={() => void updateRide(ride.id, "decline")} whileHover={reduceMotion ? undefined : { scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="rounded-full px-4 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-40">Pass</motion.button>
                      <motion.button type="button" disabled={!isOnline || Boolean(activeRide) || updatingRideId === ride.id} onClick={() => void updateRide(ride.id, "accept")} whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }} className="rounded-full bg-emerald-500 px-5 py-2 text-xs font-bold text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">{!isOnline ? "Go online to accept" : activeRide ? "Finish active ride first" : updatingRideId === ride.id ? "Saving…" : "Accept ride ↗"}</motion.button>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            ) : (
              <motion.div key="empty-offers" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} className="relative flex min-h-64 flex-col items-center justify-center overflow-hidden rounded-[24px] border border-dashed border-[var(--line)] bg-[var(--surface)] px-5 py-9 text-center">
                <div className="absolute h-40 w-40 rounded-full border border-emerald-500/10 animate-pulse-soft" />
                <div className="absolute h-28 w-28 rounded-full border border-dashed border-emerald-500/20 animate-spin-slow" />
                <motion.span animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 5, 0] }} transition={{ duration: 3.4, repeat: Infinity }} className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-700 dark:text-emerald-300">⌖</motion.span>
                <h3 className="relative mt-4 text-sm font-bold text-[var(--ink)]">{isOnline ? "You’re in the right place." : "You’re offline for now."}</h3>
                <p className="relative mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">{isOnline ? "New requests from the rider booking demo will appear here. Keep this page open while testing." : "Switch online when you’re ready to see nearby trip offers."}</p>
                <Link href="/book" className="relative mt-4 rounded-full border border-[var(--line)] px-4 py-2 text-[10px] font-bold text-[var(--muted)] transition hover:border-emerald-500/40 hover:text-emerald-700 dark:hover:text-emerald-300">Create a rider demo request ↗</Link>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && <motion.p role="alert" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800 dark:border-rose-200/30 dark:bg-rose-950/40 dark:text-rose-200">{error}</motion.p>}
          </AnimatePresence>
        </section>

        <aside className="space-y-4">
          <AnimatePresence mode="wait">
            {activeRide ? (
              <motion.section key={activeRide.id} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="rounded-[23px] border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.19em] text-emerald-700 dark:text-emerald-300">Your active trip</p><h2 className="mt-2 text-lg font-semibold tracking-tight text-[var(--ink)]">{activeRide.status === "accepted" ? "Head to the pick-up" : "Ride in progress"}</h2></div><RideStatusBadge status={activeRide.status} /></div>
                <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  <p className="text-xs font-semibold text-[var(--ink)]">{activeRide.pickup.name}</p><div className="my-2 ml-1.5 h-5 border-l border-dashed border-emerald-500/40" /><p className="text-xs font-semibold text-[var(--ink)]">{activeRide.dropoff.name}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3 text-[10px]"><span className="text-[var(--muted)]">Estimated fare</span><span className="font-bold text-[var(--ink)]">{formatRupees(activeRide.fare)}</span></div>
                </div>
                <motion.button type="button" disabled={updatingRideId === activeRide.id} onClick={() => void updateRide(activeRide.id, activeRide.status === "accepted" ? "start" : "complete")} whileHover={reduceMotion || updatingRideId === activeRide.id ? undefined : { y: -2 }} whileTap={reduceMotion || updatingRideId === activeRide.id ? undefined : { scale: 0.98 }} className="mt-4 w-full rounded-full bg-emerald-500 px-4 py-3 text-xs font-bold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60">{updatingRideId === activeRide.id ? "Saving…" : activeRide.status === "accepted" ? "Start trip" : "Complete trip"} <span aria-hidden="true">↗</span></motion.button>
                <p className="mt-3 text-center text-[9px] leading-4 text-[var(--muted)]">Demo status changes appear in the rider&apos;s open booking tab.</p>
              </motion.section>
            ) : (
              <motion.section key="driver-availability" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-[23px] border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
                <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-emerald-700 dark:text-emerald-300">On the map</p>
                <h2 className="mt-2 text-lg font-semibold tracking-tight text-[var(--ink)]">Your demo driver spot</h2>
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-lg text-emerald-700 dark:text-emerald-300">⌖</span>
                  <div><p className="text-xs font-bold text-[var(--ink)]">{DEMO_DRIVER_LOCATION.name}</p><p className="mt-1 text-[10px] text-[var(--muted)]">{DEMO_DRIVER_LOCATION.area} · Visakhapatnam</p></div>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px]"><span className="text-[var(--muted)]">Vehicle</span><span className="font-semibold text-[var(--ink)]">{DEMO_DRIVER.vehicle}</span></div>
                <div className="mt-2 flex items-center justify-between text-[10px]"><span className="text-[var(--muted)]">Registration</span><span className="font-semibold text-[var(--ink)]">{DEMO_DRIVER.plate}</span></div>
              </motion.section>
            )}
          </AnimatePresence>

          <section className="rounded-[23px] border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[var(--muted)]">Recent activity</p><h2 className="mt-1.5 text-sm font-semibold text-[var(--ink)]">Last trip updates</h2></div><span className="text-[9px] font-semibold text-[var(--muted)]">{history.length} items</span></div>
            <div className="mt-4 space-y-3">
              {history.length ? history.map((ride) => <div key={ride.id} className="flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3"><div className="min-w-0"><p className="truncate text-[10px] font-semibold text-[var(--ink)]">{ride.pickup.area} → {ride.dropoff.area}</p><p className="mt-1 text-[9px] text-[var(--muted)]">{formatRupees(ride.fare)} · {ride.distanceKm.toFixed(1)} km</p></div><RideStatusBadge status={ride.status} /></div>) : <p className="rounded-xl bg-[var(--surface-2)] px-3 py-3 text-[10px] leading-5 text-[var(--muted)]">Completed or passed-on trips will appear here.</p>}
            </div>
          </section>
        </aside>
      </div>

      <p className="mt-5 text-center text-[9px] leading-5 text-[var(--muted)]">Ride updates are persisted to your account and cached for same-origin tab sync. This is still a demo driver flow, not a real matching service.</p>
    </main>
  );
}
