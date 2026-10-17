import { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Reveal } from "@/components/MotionPrimitives";
import DashboardRideSummary from "@/components/DashboardRideSummary";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function DashboardContent() {
  const user = await currentUser();
  const name = user?.firstName ?? user?.username ?? "Rider";
  const email = user?.primaryEmailAddress?.emailAddress ?? "No email added";
  const phone = user?.primaryPhoneNumber?.phoneNumber;
  const initials = getInitials(user?.fullName ?? name) || "R";

  return (
    <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-7 sm:py-11 lg:px-12">
      <Reveal className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
            Your CabBook space
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.065em] text-[var(--ink)] sm:text-5xl">
            Good to see you, {name}.
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">A little less waiting. A little more living.</p>
        </div>
        <Link href="/profile" className="group flex w-fit items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--surface)] py-1.5 pl-1.5 pr-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/40 hover:shadow-lg">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xs font-extrabold text-zinc-950 transition group-hover:rotate-6">
            {initials}
          </span>
          <span className="text-left">
            <span className="block text-xs font-bold text-[var(--ink)]">Your account</span>
            <span className="mt-0.5 block max-w-40 truncate text-[10px] text-[var(--muted)]">{email}</span>
          </span>
          <span className="ml-1 text-sm text-emerald-700 transition-transform group-hover:translate-x-1 dark:text-emerald-300" aria-hidden="true">↗</span>
        </Link>
      </Reveal>

      <Reveal delay={0.08} className="mt-8">
        <section className="dashboard-hero relative isolate min-h-[330px] overflow-hidden rounded-[28px] bg-zinc-950 text-white shadow-xl shadow-zinc-950/10 sm:min-h-[370px] sm:rounded-[34px]">
          <div className="absolute inset-0 -z-20 bg-cover bg-[position:58%_58%] transition-transform duration-[1600ms] hover:scale-[1.025]" style={{ backgroundImage: "url('/images/city-ride-hero.jpg')" }} />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,12,9,0.92)_0%,rgba(5,12,9,0.72)_48%,rgba(5,12,9,0.1)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,12,9,0.5),transparent_58%)]" />
          <div className="relative flex min-h-[330px] flex-col justify-between p-6 sm:min-h-[370px] sm:p-9 lg:p-11">
            <div className="flex items-center justify-between">
              <span className="rounded-full border border-white/20 bg-black/20 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">A better trip starts here</span>
              <span className="hidden items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-white/65 sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Here for your next move</span>
            </div>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">Your city, at your pace</p>
              <h2 className="mt-3 text-3xl font-semibold leading-[0.98] tracking-[-0.06em] sm:text-5xl">The best part of the day<br className="hidden sm:block" /> is still ahead.</h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65">Set a pick-up, choose your ride, and preview a fare for your next trip across Visakhapatnam.</p>
              <Link href="/book" className="group mt-6 inline-flex items-center gap-3 rounded-full bg-emerald-300 px-5 py-3 text-xs font-bold text-zinc-950 transition hover:bg-emerald-200">
                Plan a ride <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">↗</span>
              </Link>
            </div>
            <div className="absolute bottom-8 right-9 hidden h-36 w-36 items-center justify-center rounded-full border border-white/15 lg:flex">
              <div className="absolute inset-3 rounded-full border border-dashed border-emerald-200/40 animate-spin-slow" />
              <div className="absolute inset-8 rounded-full border border-emerald-200/20" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_22px_9px_rgba(110,231,183,0.35)] animate-pulse-soft" />
            </div>
          </div>
        </section>
      </Reveal>


      <div className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <DashboardRideSummary hasPhone={Boolean(phone)} />

        <Reveal delay={0.2}>
          <section className="h-full rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_10px_35px_rgba(15,23,18,0.025)] sm:p-7">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-300">Keep it current</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-[var(--ink)]">Rider details</h2>
              </div>
              <Link href="/profile" aria-label="Edit rider details" className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line)] text-sm text-[var(--muted)] transition hover:-translate-y-0.5 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300">↗</Link>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-zinc-950">{initials}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--ink)]">{user?.fullName ?? name}</p>
                <p className="mt-1 truncate text-xs text-[var(--muted)]">{email}</p>
              </div>
            </div>
            <div className="my-5 border-t border-[var(--line)]" />
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-2"><span className="text-[var(--muted)]">Phone number</span><span className="max-w-[60%] truncate font-semibold text-[var(--ink)]">{phone ?? "Not added yet"}</span></div>
              <div className="flex items-center justify-between gap-2"><span className="text-[var(--muted)]">Member status</span><span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Ready for a ride</span></div>
            </div>
            <Link href="/profile" className="group mt-6 inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              Edit profile <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </section>
        </Reveal>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-10 sm:px-7 lg:px-12">
      <div className="h-12 w-64 animate-pulse rounded-xl bg-[var(--surface-2)]" />
      <div className="mt-8 h-80 animate-pulse rounded-[30px] bg-[var(--surface-2)]" />
      <div className="mt-4 grid gap-4 sm:grid-cols-3"><div className="h-36 animate-pulse rounded-3xl bg-[var(--surface-2)]" /><div className="h-36 animate-pulse rounded-3xl bg-[var(--surface-2)]" /><div className="h-36 animate-pulse rounded-3xl bg-[var(--surface-2)]" /></div>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
