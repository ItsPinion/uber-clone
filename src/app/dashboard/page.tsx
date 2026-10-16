import { Suspense } from "react";
import { currentUser } from "@clerk/nextjs/server";

async function Welcome() {
  const user = await currentUser();
  const name = user?.firstName ?? user?.username ?? "rider";
  const email = user?.primaryEmailAddress?.emailAddress ?? "—";

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Welcome, {name} 👋</h1>
      <p className="mt-2 text-zinc-600">
        You&apos;re signed in as <span className="font-medium">{email}</span>.
      </p>
    </>
  );
}

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
      <Suspense
        fallback={<div className="h-16 w-72 animate-pulse rounded-lg bg-zinc-200" />}
      >
        <Welcome />
      </Suspense>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Book a ride</h2>
          <p className="mt-1 text-sm text-zinc-600">Coming on Day 4 — map-based ride requests.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold">Your profile</h2>
          <p className="mt-1 text-sm text-zinc-600">Coming on Day 3 — edit name, phone, and photo.</p>
        </div>
      </div>
    </main>
  );
}
