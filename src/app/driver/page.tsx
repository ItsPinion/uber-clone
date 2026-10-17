import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import DriverExperience from "@/components/DriverExperience";
import { isDriverUser } from "@/lib/server/driver-access";

export default async function DriverPage() {
  const { userId } = await auth();
  if (!userId || !isDriverUser(userId)) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-20 sm:px-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">CabBook partner access</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">Driver access isn’t enabled.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
          This account is not on the operator’s driver allow-list. Ask the CabBook operator to add your Clerk user ID to `CABBOOK_DRIVER_USER_IDS` before opening the shared ride queue.
        </p>
        <Link href="/dashboard" className="mt-6 w-fit rounded-full border border-[var(--line)] px-4 py-2.5 text-xs font-semibold text-[var(--ink)] transition hover:border-emerald-500/50">
          Return to rider dashboard
        </Link>
      </main>
    );
  }

  return <DriverExperience />;
}
