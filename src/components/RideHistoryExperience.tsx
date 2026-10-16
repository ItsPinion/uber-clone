"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useRideRequests } from "@/lib/ride-storage";
import { formatRupees, getRidePricing, type RideStatus } from "@/lib/ride";

const filters = ["all", "active", "completed", "other"] as const;
type RideFilter = (typeof filters)[number];

const statusLabels: Record<RideStatus, string> = {
  requested: "Finding a driver",
  accepted: "Driver matched",
  in_progress: "In progress",
  completed: "Completed",
  declined: "Passed on",
  cancelled: "Cancelled",
};

const statusStyles: Record<RideStatus, string> = {
  requested: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  in_progress: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  completed: "bg-[var(--surface-2)] text-[var(--muted)]",
  declined: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  cancelled: "bg-[var(--surface-2)] text-[var(--muted)]",
};

function isActive(status: RideStatus) {
  return status === "requested" || status === "accepted" || status === "in_progress";
}

function formatRideDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function matchesFilter(status: RideStatus, filter: RideFilter) {
  if (filter === "active") return isActive(status);
  if (filter === "completed") return status === "completed";
  if (filter === "other") return status === "cancelled" || status === "declined";
  return true;
}

export default function RideHistoryExperience() {
  const rides = useRideRequests();
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<RideFilter>("all");
  const [query, setQuery] = useState("");

  const sortedRides = useMemo(
    () => [...rides].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)),
    [rides],
  );
  const filteredRides = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return sortedRides.filter((ride) => {
      if (!matchesFilter(ride.status, filter)) return false;
      if (!normalizedQuery) return true;
      return [
        ride.pickup.name,
        ride.pickup.area,
        ride.dropoff.name,
        ride.dropoff.area,
        ride.id,
        getRidePricing(ride.category).label,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
    });
  }, [filter, query, sortedRides]);

  const completedRides = rides.filter((ride) => ride.status === "completed");
  const activeRides = rides.filter((ride) => isActive(ride.status));
  const estimatedCompletedFares = completedRides.reduce((sum, ride) => sum + ride.fare, 0);

  return (
    <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-8 sm:px-7 sm:py-11 lg:px-12">
      <motion.header
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"
      >
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Your journey
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.065em] text-[var(--ink)] sm:text-5xl">Ride history</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">All your CabBook demo requests, statuses, and estimated fares in one place.</p>
        </div>
        <Link href="/book" className="group inline-flex w-fit items-center gap-3 rounded-full bg-emerald-500 px-5 py-3 text-xs font-bold text-zinc-950 shadow-lg shadow-emerald-700/10 transition hover:-translate-y-0.5 hover:bg-emerald-400">
          Plan another ride <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↗</span>
        </Link>
      </motion.header>

      <section aria-label="Ride history summary" className="mt-7 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Completed trips", value: String(completedRides.length).padStart(2, "0"), note: "Trips marked complete" },
          { label: "Active requests", value: String(activeRides.length).padStart(2, "0"), note: "Waiting, matched, or in progress" },
          { label: "Estimated fares", value: formatRupees(estimatedCompletedFares), note: "Completed demo trips only" },
        ].map((stat) => (
          <article key={stat.label} className="rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_10px_35px_rgba(15,23,18,0.025)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.19em] text-[var(--muted)]">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{stat.value}</p>
            <p className="mt-1 text-[10px] text-[var(--muted)]">{stat.note}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[26px] border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[0_16px_55px_rgba(15,23,18,0.035)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-[-0.04em] text-[var(--ink)]">Your trips</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">{filteredRides.length} {filteredRides.length === 1 ? "request" : "requests"} shown</p>
          </div>
          <label className="flex h-11 w-full items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--canvas)] px-4 text-[var(--muted)] sm:max-w-[300px]">
            <span aria-hidden="true">⌕</span>
            <span className="sr-only">Search ride history</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search places or ride ID" className="min-w-0 flex-1 bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--muted)]" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="rounded-full px-1 text-sm hover:text-[var(--ink)]">×</button>}
          </label>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter rides by status">
          {filters.map((value) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-bold capitalize transition ${filter === value ? "bg-emerald-500 text-zinc-950" : "border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--ink)]"}`}>
              {value === "other" ? "Cancelled / passed" : value}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3" aria-live="polite">
          {filteredRides.map((ride, index) => (
            <motion.article
              key={ride.id}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.24) }}
              className="rounded-[19px] border border-[var(--line)] bg-[var(--canvas)]/70 p-4 sm:p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-1 flex w-4 shrink-0 flex-col items-center" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500" />
                    <span className="my-1 h-6 border-l border-dashed border-[var(--line)]" />
                    <span className="h-2.5 w-2.5 rounded-sm bg-zinc-950 dark:bg-emerald-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--ink)]">{ride.pickup.name} <span className="text-emerald-700 dark:text-emerald-300">→</span> {ride.dropoff.name}</p>
                    <p className="mt-1 truncate text-[10px] text-[var(--muted)]">{ride.pickup.area} to {ride.dropoff.area}</p>
                    <p className="mt-2 text-[9px] text-[var(--muted)]">{formatRideDate(ride.createdAt)} · Ref {ride.id.slice(0, 13)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-3 sm:justify-end sm:border-0 sm:pt-0">
                  <div className="sm:text-right">
                    <p className="text-sm font-bold text-[var(--ink)]">{formatRupees(ride.fare)}</p>
                    <p className="mt-1 text-[9px] text-[var(--muted)]">{getRidePricing(ride.category).label} · {ride.distanceKm.toFixed(1)} km</p>
                  </div>
                  <span className={`rounded-full px-3 py-1.5 text-[9px] font-bold ${statusStyles[ride.status]}`}>{statusLabels[ride.status]}</span>
                </div>
              </div>
              {ride.driver && <p className="mt-3 border-t border-[var(--line)] pt-3 text-[10px] text-[var(--muted)]">Driver: <span className="font-semibold text-[var(--ink)]">{ride.driver.name}</span> · {ride.driver.vehicle} · {ride.driver.plate}</p>}
            </motion.article>
          ))}

          {filteredRides.length === 0 && (
            <div className="flex min-h-52 flex-col items-center justify-center rounded-[20px] border border-dashed border-[var(--line)] bg-[var(--canvas)]/70 px-5 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-700 dark:text-emerald-300">✦</span>
              <h3 className="mt-4 text-sm font-semibold text-[var(--ink)]">{rides.length ? "No matching rides" : "Your next trip starts here"}</h3>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--muted)]">{rides.length ? "Try a different search or status filter." : "Your demo ride requests will show here after you plan a trip."}</p>
              {rides.length === 0 && <Link href="/book" className="mt-4 rounded-full border border-[var(--line)] px-4 py-2 text-[10px] font-bold text-[var(--ink)] transition hover:border-emerald-500/50">Plan a ride ↗</Link>}
            </div>
          )}
        </div>
      </section>

      <p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-[10px] leading-5 text-[var(--muted)]">
        Demo notice: ride history is stored in this browser&apos;s local storage and is not account-synced. Fares are estimates, not receipts or proof of payment. Clearing browser data removes this history.
      </p>
    </main>
  );
}
