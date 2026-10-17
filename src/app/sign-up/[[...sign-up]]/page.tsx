import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import AuthFrame from "@/components/AuthFrame";

export default function SignUpPage() {
  return (
    <AuthFrame
      eyebrow="Your ride starts here"
      title="Make room for more."
      detail="Create your CabBook account and make the in-between feel like part of the journey."
    >
      <Suspense fallback={<div className="h-[560px] w-full animate-pulse rounded-2xl bg-[var(--surface-2)]" />}>
        <SignUp />
      </Suspense>
    </AuthFrame>
  );
}
