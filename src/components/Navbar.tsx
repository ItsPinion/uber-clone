"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { motion, useReducedMotion } from "motion/react";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  return (
    <motion.header
      initial={reduceMotion ? false : { y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--header)] backdrop-blur-2xl"
    >
      <nav className="mx-auto flex h-[76px] max-w-[1360px] items-center justify-between gap-3 px-4 sm:px-7 lg:px-10">
        <Link href="/" aria-label="CabBook home" className="group flex shrink-0 items-center gap-3">
          <motion.span
            whileHover={reduceMotion ? undefined : { rotate: -8, scale: 1.06 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-[14px] bg-emerald-500 text-zinc-950 shadow-[0_8px_22px_rgba(16,185,129,0.22)]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M5.2 13.8 6.7 8.9a2 2 0 0 1 1.9-1.4h6.8a2 2 0 0 1 1.9 1.4l1.5 4.9v3.1H5.2v-3.1Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
              <path d="M6.2 12.6h11.6M8.2 16.9v1.6m7.6-1.6v1.6M7.3 10.1h.1m9.2 0h.1" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 bg-white/30"
              initial={{ x: "-120%", skewX: -18 }}
              animate={{ x: ["-120%", "120%"] }}
              transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3.4, ease: "easeInOut" }}
            />
          </motion.span>
          <span className="leading-none">
            <span className="block text-[17px] font-extrabold tracking-[-0.06em] text-[var(--ink)]">
              cab<span className="text-emerald-600">book</span>
            </span>
            <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              City rides, elevated
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Show when="signed-in">
            <div className="hidden items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--surface)] p-1 sm:flex">
              <Link
                href="/dashboard"
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                className="nav-link relative rounded-full px-4 py-2 text-xs font-semibold"
              >
                {pathname === "/dashboard" && <motion.span layoutId="nav-active-indicator" transition={{ type: "spring", stiffness: 360, damping: 30 }} className="absolute inset-0 z-0 rounded-full bg-emerald-500/10" />}
                <span className="relative z-10">Dashboard</span>
              </Link>
              <Link
                href="/profile"
                aria-current={pathname === "/profile" ? "page" : undefined}
                className="nav-link relative rounded-full px-4 py-2 text-xs font-semibold"
              >
                {pathname === "/profile" && <motion.span layoutId="nav-active-indicator" transition={{ type: "spring", stiffness: 360, damping: 30 }} className="absolute inset-0 z-0 rounded-full bg-emerald-500/10" />}
                <span className="relative z-10">Profile</span>
              </Link>
              <Link
                href="/book"
                aria-current={pathname === "/book" ? "page" : undefined}
                className="nav-link relative rounded-full px-4 py-2 text-xs font-semibold"
              >
                {pathname === "/book" && <motion.span layoutId="nav-active-indicator" transition={{ type: "spring", stiffness: 360, damping: 30 }} className="absolute inset-0 z-0 rounded-full bg-emerald-500/10" />}
                <span className="relative z-10">Book</span>
              </Link>
              <Link
                href="/driver"
                aria-current={pathname === "/driver" ? "page" : undefined}
                className="nav-link relative rounded-full px-4 py-2 text-xs font-semibold"
              >
                {pathname === "/driver" && <motion.span layoutId="nav-active-indicator" transition={{ type: "spring", stiffness: 360, damping: 30 }} className="absolute inset-0 z-0 rounded-full bg-emerald-500/10" />}
                <span className="relative z-10">Drive</span>
              </Link>
            </div>
          </Show>

          <ThemeToggle />

          <Show when="signed-out">
            <SignInButton>
              <motion.button
                whileHover={reduceMotion ? undefined : { y: -1 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className="hidden rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)] sm:inline-flex"
              >
                Log in
              </motion.button>
            </SignInButton>
            <SignUpButton>
              <motion.button
                whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                className="rounded-full bg-zinc-950 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-zinc-950/10 transition hover:bg-emerald-600 hover:text-zinc-950 sm:px-5 sm:text-sm dark:bg-emerald-400 dark:text-zinc-950 dark:hover:bg-emerald-300"
              >
                Get started <span className="ml-1" aria-hidden="true">↗</span>
              </motion.button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/book" aria-current={pathname === "/book" ? "page" : undefined} className="mobile-nav-link sm:hidden">Ride</Link>
              <Link href="/driver" aria-current={pathname === "/driver" ? "page" : undefined} className="mobile-nav-link sm:hidden">Drive</Link>
              <UserButton />
            </div>
          </Show>
        </div>
      </nav>
    </motion.header>
  );
}
