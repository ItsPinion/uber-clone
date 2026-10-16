import { Suspense } from "react";
import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";

export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
          Day 1 · Project setup &amp; authentication
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
          Your ride is one tap away.
        </h1>
        <p className="mt-4 text-lg text-zinc-600">
          Sign up to book rides, track your driver, and pay securely.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Suspense fallback={<div className="h-12" />}>
          <Show when="signed-out">
            <SignUpButton>
              <button className="w-full rounded-xl bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-700 sm:w-auto">
                Get started
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <Link
              href="/dashboard"
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              Go to dashboard
            </Link>
          </Show>
          </Suspense>
        </div>
      </section>
    </main>
  );
}
