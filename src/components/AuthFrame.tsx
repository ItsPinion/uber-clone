"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

export default function AuthFrame({ children, eyebrow, title, detail }: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  detail: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-14 sm:py-20">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-[10%] top-[13%] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 26, 0], y: [0, -18, 0], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[10%] right-[11%] h-72 w-72 rounded-full bg-lime-400/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -20, 0], y: [0, 16, 0], scale: [1, 0.88, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_30px_100px_rgba(12,20,14,0.12)] lg:grid-cols-[0.9fr_1.1fr]">
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="relative hidden min-h-[600px] flex-col justify-between overflow-hidden bg-zinc-950 p-9 text-white lg:flex xl:p-12"
        >
          <div className="absolute inset-0 bg-cover bg-[position:65%_55%] opacity-75" style={{ backgroundImage: "url('/images/city-ride-hero.jpg')" }} />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,9,0.38),rgba(5,12,9,0.92))]" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-emerald-300 text-zinc-950">✳</span>
            <span className="text-lg font-extrabold tracking-[-0.06em]">cab<span className="text-emerald-300">book</span></span>
          </div>
          <div className="relative pb-4">
            <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-200 backdrop-blur">{eyebrow}</span>
            <h1 className="mt-6 max-w-sm text-5xl font-semibold leading-[0.94] tracking-[-0.075em]">{title}</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">{detail}</p>
            <div className="mt-9 flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((bar) => (
                <motion.span key={bar} className="h-1 rounded-full bg-emerald-300" style={{ width: `${10 + ((bar * 7) % 24)}px` }} animate={reduceMotion ? undefined : { opacity: [0.25, 0.9, 0.25], scaleY: [0.75, 1.3, 0.75] }} transition={{ duration: 1.5, repeat: Infinity, delay: bar * 0.12 }} />
              ))}
            </div>
          </div>
        </motion.section>
        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
          className="flex min-h-[590px] flex-col items-center justify-center px-5 py-10 sm:px-10 lg:px-12"
        >
          <div className="mb-6 w-full max-w-md lg:hidden">
            <p className="text-xs font-extrabold tracking-[-0.04em] text-[var(--ink)]">cab<span className="text-emerald-600">book</span></p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">{eyebrow}</p>
          </div>
          <div className="w-full max-w-md">{children}</div>
        </motion.section>
      </div>
    </main>
  );
}
