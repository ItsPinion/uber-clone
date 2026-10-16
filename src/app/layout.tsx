import { Suspense } from "react";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CabBook – Cab Booking App",
  description: "Book rides, track drivers, and pay seamlessly.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        // Browser extensions (e.g. Dark Reader) add attributes to <html> before React hydrates.
        suppressHydrationWarning
      >
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
