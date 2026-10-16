import { Suspense } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import Navbar from "@/components/Navbar";
import ScrollProgress from "@/components/ScrollProgress";
import PageTransition from "@/components/PageTransition";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "CabBook — Move at your pace",
  description: "Thoughtful city rides, made simple. Book a ride with CabBook.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html lang="en" className="h-full antialiased" suppressHydrationWarning>
        <body className="flex min-h-full flex-col bg-[var(--canvas)] text-[var(--ink)]">
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem storageKey="cabbook-theme">
            <ScrollProgress />
            <Suspense fallback={<div className="h-[76px] border-b border-[var(--line)] bg-[var(--header)]" />}>
              <Navbar />
            </Suspense>
            <Suspense fallback={<div className="min-h-[calc(100vh-76px)] flex-1" />}>
              <PageTransition>{children}</PageTransition>
            </Suspense>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
