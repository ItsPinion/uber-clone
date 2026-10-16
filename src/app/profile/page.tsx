import Link from "next/link";
import ProfileEditor from "@/components/ProfileEditor";
import { Reveal } from "@/components/MotionPrimitives";

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-8 sm:px-7 sm:py-11 lg:px-12">
      <Reveal>
        <Link href="/dashboard" className="group inline-flex items-center gap-2 text-xs font-semibold text-[var(--muted)] transition hover:text-emerald-700 dark:hover:text-emerald-300">
          <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">←</span>
          Back to your space
        </Link>
        <div className="mb-7 mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Account, made personal</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.065em] text-[var(--ink)] sm:text-5xl">Your details, just right.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
              Keep the essentials up to date, so every CabBook trip feels a little more like yours.
            </p>
          </div>
          <span className="flex w-fit items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
            Private to your account
          </span>
        </div>
      </Reveal>
      <Reveal delay={0.1} distance={30}>
        <ProfileEditor />
      </Reveal>
    </main>
  );
}
