import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import AuthFrame from "@/components/AuthFrame";

export default function SignInPage() {
  return (
    <AuthFrame
      eyebrow="Welcome back"
      title="The city is still yours."
      detail="Sign in to pick up where you left off. Your next great day is only a ride away."
    >
      <Suspense fallback={<div className="h-[480px] w-full animate-pulse rounded-2xl bg-[var(--surface-2)]" />}>
        <SignIn />
      </Suspense>
    </AuthFrame>
  );
}
