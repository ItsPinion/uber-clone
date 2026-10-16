import { Suspense } from "react";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

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
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">
            Rider home
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
            Good to see you, {name}.
          </h1>
          <p className="mt-2 text-sm text-zinc-600 sm:text-base">
            Your next ride is just around the corner.
          </p>
        </div>
        <Link
          href="/profile"
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
            {initials}
          </span>
          Manage profile
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <section className="relative mt-8 overflow-hidden rounded-3xl bg-zinc-950 p-6 text-white shadow-lg sm:p-9">
        <div className="absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/10 sm:right-20 sm:top-[-7rem]" />
        <div className="absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/10 sm:right-32 sm:top-[-4rem]" />
        <div className="relative z-[1] max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Your city, your schedule
          </span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Wherever you&apos;re headed, let&apos;s get you there.
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-zinc-300 sm:text-base">
            Set up your rider details now. Ride booking and pickup locations are coming next.
          </p>
          <span className="mt-7 inline-flex cursor-not-allowed items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white/75">
            Booking opens soon
            <span aria-hidden="true">↗</span>
          </span>
        </div>
        <div aria-hidden="true" className="absolute bottom-0 right-5 hidden h-52 w-72 sm:block">
          <div className="absolute bottom-8 left-10 h-28 w-28 rounded-full border border-emerald-300/20" />
          <div className="absolute bottom-14 left-16 h-16 w-16 rounded-full border border-emerald-300/30" />
          <div className="absolute bottom-[5.4rem] left-[5.55rem] h-3 w-3 rounded-full bg-emerald-300 shadow-[0_0_24px_8px_rgba(110,231,183,0.2)]" />
          <div className="absolute bottom-10 left-[8.3rem] h-2 w-2 rounded-full bg-white" />
          <div className="absolute bottom-[5.8rem] left-[6.3rem] h-14 w-20 -rotate-12 border-b-2 border-dashed border-emerald-200/60" />
          <span className="absolute bottom-7 right-5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-300">
            YOUR NEXT STOP
          </span>
        </div>
      </section>

      <section aria-label="Ride overview" className="mt-5 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Completed rides</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-zinc-950">0</p>
          <p className="mt-1 text-xs text-zinc-500">Your ride history will show up here.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Next trip</p>
          <p className="mt-3 text-lg font-semibold text-zinc-950">No rides scheduled</p>
          <p className="mt-1 text-xs text-zinc-500">Book a ride when the feature is ready.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Account status</p>
          <p className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-zinc-950">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Ready to ride
          </p>
          <p className="mt-1 text-xs text-zinc-500">Signed in as {email}</p>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Recent activity</h2>
              <p className="mt-1 text-sm text-zinc-500">Your latest trips at a glance.</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
              0 trips
            </span>
          </div>
          <div className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-5 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow-sm" aria-hidden="true">
              ↗
            </span>
            <p className="mt-3 text-sm font-semibold text-zinc-800">No rides yet</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
              Once you take your first ride, the route, fare, and receipt will appear here.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-zinc-950">Rider profile</h2>
              <p className="mt-1 text-sm text-zinc-500">Keep your contact details up to date.</p>
            </div>
            <Link
              href="/profile"
              aria-label="Edit rider profile"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50"
            >
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900">{user?.fullName ?? name}</p>
              <p className="truncate text-xs text-zinc-500">{email}</p>
            </div>
          </div>
          <div className="mt-5 border-t border-zinc-100 pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Phone number</p>
            <p className="mt-1 text-sm font-medium text-zinc-800">{phone ?? "Add a number to your profile"}</p>
          </div>
          <Link
            href="/profile"
            className="mt-5 inline-flex text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Edit your details <span className="ml-1" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          <div className="h-9 w-64 animate-pulse rounded-lg bg-zinc-200" />
          <div className="mt-8 h-64 animate-pulse rounded-3xl bg-zinc-200" />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
            <div className="h-28 animate-pulse rounded-2xl bg-zinc-200" />
          </div>
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
