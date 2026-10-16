import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12">
      <Suspense fallback={<div className="h-[560px] w-full max-w-md animate-pulse rounded-2xl bg-zinc-200" />}>
        <SignUp />
      </Suspense>
    </main>
  );
}
