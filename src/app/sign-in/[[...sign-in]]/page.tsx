import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Suspense fallback={<div className="h-[480px] w-full max-w-md animate-pulse rounded-2xl bg-zinc-200" />}>
        <SignIn />
      </Suspense>
    </main>
  );
}
