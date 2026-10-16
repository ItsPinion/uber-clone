"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useTheme } from "next-themes";

function SunIcon() {
  return (
    <motion.svg
      initial={{ rotate: -70, scale: 0.65, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      exit={{ rotate: 70, scale: 0.65, opacity: 0 }}
      transition={{ duration: 0.28 }}
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2.5v2M12 19.5v2M4.4 4.4l1.4 1.4m12.4 12.4 1.4 1.4M2.5 12h2m15 0h2M4.4 19.6l1.4-1.4M18.2 5.8l1.4-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </motion.svg>
  );
}

function MoonIcon() {
  return (
    <motion.svg
      initial={{ rotate: 70, scale: 0.65, opacity: 0 }}
      animate={{ rotate: 0, scale: 1, opacity: 1 }}
      exit={{ rotate: -70, scale: 0.65, opacity: 0 }}
      transition={{ duration: 0.28 }}
      viewBox="0 0 24 24"
      fill="none"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path d="M20.1 15.2A8.5 8.5 0 0 1 8.8 3.9 8.6 8.6 0 1 0 20.1 15.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m16.7 4.2.5 1.3 1.3.5-1.3.5-.5 1.3-.5-1.3-1.3-.5 1.3-.5.5-1.3Z" fill="currentColor" />
    </motion.svg>
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const reduceMotion = useReducedMotion();

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      whileHover={reduceMotion ? undefined : { scale: 1.08, rotate: isDark ? -8 : 8 }}
      whileTap={reduceMotion ? undefined : { scale: 0.9 }}
      transition={{ type: "spring", stiffness: 420, damping: 20 }}
      aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Switch color theme"}
      title={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Color theme"}
      className="theme-toggle flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-sm transition-colors hover:border-emerald-500/60 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/20"
    >
      <AnimatePresence mode="wait" initial={false}>
        {mounted && isDark ? (
          <MoonIcon key="moon" />
        ) : (
          <SunIcon key="sun" />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
