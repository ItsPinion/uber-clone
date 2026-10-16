"use client";

import Link from "next/link";
import { useMemo } from "react";
import { HoverLift, Reveal, Stagger, StaggerItem } from "@/components/MotionPrimitives";
import { useRideRequests } from "@/lib/ride-storage";
import { formatRupees, getRidePricing, type RideStatus } from "@/lib/ride";

const statusLabels: Record<RideStatus, string> = {
  requested: "Finding a driver",
  accepted: "Driver matched",
  in_progress: "In progress",
  completed: "Completed",
  declined: "Passed on",
  cancelled: "Cancelled",
};

function isActive(status: RideStatus) {
  return status === "requested" || status === "accepted" || status === "in_progress";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(date);
}

export default function DashboardRideSummary({ hasPhone }: { hasPhone: boolean }) {
  const rides = useRideRequests();
  const recentRides = useMemo(
    () => [...rides].sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt)).slice(0, 3),
    [rides],
  );
  const completedCount = rides.filter((ride) => ride.status === "completed").length;
  const activeCount = rides.filter((ride) => isActive(ride.status)).length;

  const stats = [
    { label: "Trips completed", value: String(completedCount).padStart(2, "0"), note: completedCount ? "Nice travels" : "Your first ride is waiting", icon: "↗" },
    { label: "Active requests", value: String(activeCount).padStart(2, "0"), note: activeCount ? "Check your ride status" : "No active ride", icon: "⌖" },
    { label: "Rider profile", value: hasPhone ? "Ready" : "Set up", note: hasPhone ? "Contact details saved" : "Add your phone number", icon: "✳" },
  ];

  return (
    <div className="space-y-4">
      <Stagger className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        {stats.map((stat) => (
          <StaggerItem key={stat.label}>
            <HoverLift>
              <article className="group flex min-h-[140px] items-start justify-between rounded-[22px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_10px_35px_rgba(15,23,18,0.025)] transition-colors sm:p-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.19em] text-[var(--muted)]">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--ink)]">{stat.value}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{stat.note}</p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-lg text-emerald-700 transition-transform group-hover:rotate-12 dark:text-emerald-300">{stat.icon}</span>
              </article>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>

      <Reveal delay={0.12}>
        <section className="h-full rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_10px_35px_rgba(15,23,18,0.025)] sm:p-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Your journey</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Recent rides</h2>
            </div>
            <Link href="/history" className="group inline-flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-[9px] font-bold text-[var(--muted)] transition hover:text-emerald-700 dark:hover:text-emerald-300">
              {rides.length} {rides.length === 1 ? "trip" : "trips"} <span aria-hidden="true" className="transition-transform group-hover:translate-x-0.5">↗</span>
            </Link>
          </div>

          {recentRides.length ? (
            <div className="mt-5 divide-y divide-[var(--line)]">
              {recentRides.map((ride) => (
                <Link key={ride.id} href="/history" className="group flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--ink)]">{ride.pickup.area} <span className="text-emerald-700 dark:text-emerald-300">→</span> {ride.dropoff.area}</p>
                    <p className="mt-1 truncate text-[9px] text-[var(--muted)]">{formatDate(ride.createdAt)} · {getRidePricing(ride.category).label}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-[var(--ink)]">{formatRupees(ride.fare)}</p>
                    <p className="mt-1 text-[9px] text-[var(--muted)]">{statusLabels[ride.status]}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="relative mt-5 flex min-h-[145px] flex-col items-center justify-center overflow-hidden rounded-[18px] border border-dashed border-[var(--line)] bg-[var(--canvas)]/70 px-5 text-center">
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-emerald-500/15" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface)] text-lg shadow-sm animate-float">✦</div>
              <p className="relative mt-3 text-sm font-semibold text-[var(--ink)]">Your first trip will feel good here.</p>
              <p className="relative mt-1 text-xs text-[var(--muted)]">Your demo requests will appear here.</p>
            </div>
          )}
          <Link href="/history" className="group mt-5 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            View ride history <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
