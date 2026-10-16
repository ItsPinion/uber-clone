import Link from "next/link";
import ProfileEditor from "@/components/ProfileEditor";

export default function ProfilePage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 transition hover:text-zinc-900"
      >
        <span aria-hidden="true">←</span>
        Back to dashboard
      </Link>

      <div className="mb-7 mt-6 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Account settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-950 sm:text-4xl">
          Your profile, your way.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
          Update the details your driver can use to recognize and reach you.
        </p>
      </div>

      <ProfileEditor />
    </main>
  );
}
