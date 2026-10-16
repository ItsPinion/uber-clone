import { Suspense } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "CabBook – Cab Booking App",
  description: "Book rides, track drivers, and pay seamlessly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
          <Suspense fallback={<div className="h-[61px] border-b border-zinc-200 bg-white" />}>
            <Navbar />
          </Suspense>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
