"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { HoverLift, Reveal, Stagger, StaggerItem } from "@/components/MotionPrimitives";

const rideFeatures = [
  {
    number: "01",
    title: "A little more you-time",
    body: "Settle in, pick your playlist, and let the city pass by for a while.",
    icon: "✳",
    tag: "THE COMMUTE",
  },
  {
    number: "02",
    title: "Right there when you land",
    body: "From the airport curb to your front door, your next stop feels easy.",
    icon: "↗",
    tag: "THE GETAWAY",
  },
  {
    number: "03",
    title: "Out a little later",
    body: "Good evenings deserve a comfortable ride home, whenever they end.",
    icon: "☾",
    tag: "THE NIGHT OUT",
  },
];

function ArrowUpRight() {
  return <span aria-hidden="true" className="inline-block transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">↗</span>;
}

export default function HomeExperience() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImageY = useTransform(scrollYProgress, [0, 1], [0, 92]);

  return (
    <main className="flex-1 overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="mx-auto max-w-[1440px] px-3 pt-3 sm:px-5 lg:px-8 lg:pt-5">
        <section ref={heroRef} className="hero-frame relative isolate min-h-[650px] overflow-hidden rounded-[30px] bg-zinc-950 text-white sm:min-h-[700px] sm:rounded-[38px] lg:min-h-[730px]">
          <motion.div
            className="absolute inset-0 -z-20 bg-cover bg-[position:60%_55%]"
            style={{ backgroundImage: "url('/images/city-ride-hero.jpg')", y: reduceMotion ? 0 : heroImageY }}
            initial={reduceMotion ? false : { scale: 1.14, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,12,9,0.9)_0%,rgba(5,12,9,0.7)_43%,rgba(5,12,9,0.18)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,rgba(5,12,9,0.68)_0%,transparent_48%)]" />
          <div className="absolute inset-0 -z-10 soft-grid opacity-40" />
          <svg aria-hidden="true" viewBox="0 0 560 340" className="pointer-events-none absolute right-[1%] top-[22%] hidden h-[68%] w-[48%] overflow-visible opacity-75 lg:block">
            <motion.path
              d="M34 250 C 118 248, 104 104, 206 114 S 276 268, 368 206 S 418 54, 526 68"
              fill="none"
              stroke="rgba(167,243,208,0.65)"
              strokeWidth="1.4"
              strokeDasharray="5 8"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={reduceMotion ? { pathLength: 1, opacity: 0.35 } : { pathLength: [0, 1, 1], opacity: [0, 0.85, 0.3] }}
              transition={{ duration: 9, repeat: reduceMotion ? 0 : Infinity, repeatDelay: 0.8, ease: "easeInOut" }}
            />
            <motion.circle
              cx="34" cy="250" r="4" fill="#a7f3d0"
              animate={reduceMotion ? undefined : { scale: [1, 1.8, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.circle
              cx="526" cy="68" r="4" fill="#d9f99d"
              animate={reduceMotion ? undefined : { scale: [1, 1.7, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 3.2, repeat: Infinity, delay: 0.65, ease: "easeInOut" }}
            />
          </svg>

          <motion.div
            aria-hidden="true"
            className="absolute right-[8%] top-[12%] hidden h-56 w-56 rounded-full border border-white/15 lg:block"
            animate={reduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute -left-1 top-1/2 h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_20px_7px_rgba(110,231,183,0.55)]" />
          </motion.div>
          <motion.div
            aria-hidden="true"
            className="absolute right-[13%] top-[17%] hidden h-40 w-40 rounded-full border border-dashed border-white/15 lg:block"
            animate={reduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
          />

          <div className="relative flex min-h-[650px] flex-col justify-between p-6 sm:min-h-[700px] sm:p-10 lg:min-h-[730px] lg:p-14">
            <div className="flex items-center justify-between gap-4">
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.17em] text-white/80 backdrop-blur-md sm:px-4 sm:text-[11px]"
              >
                <motion.span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-300"
                  animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45], scale: [0.85, 1.2, 0.85] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                The city is yours
              </motion.div>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45, duration: 0.55 }}
                className="hidden text-right text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55 sm:block"
              >
                Made for the way<br />you move
              </motion.p>
            </div>

            <div className="relative z-10 max-w-3xl pb-10 pt-16 sm:pb-12 sm:pt-20 lg:pb-16">
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.7 }}
                className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-200 sm:text-xs"
              >
                <span className="h-px w-9 bg-emerald-300" />
                City rides, reimagined
              </motion.p>
              <motion.h1
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: reduceMotion ? 0 : 0.13, delayChildren: 0.36 } },
                }}
                className="max-w-4xl text-[clamp(3.6rem,10vw,8.4rem)] font-semibold leading-[0.85] tracking-[-0.085em]"
              >
                <motion.span variants={{ hidden: { y: 70, opacity: 0, rotateX: -24 }, show: { y: 0, opacity: 1, rotateX: 0 } }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="block overflow-hidden pb-1">Go where</motion.span>
                <motion.span variants={{ hidden: { y: 70, opacity: 0, rotateX: -24 }, show: { y: 0, opacity: 1, rotateX: 0 } }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="block overflow-hidden pb-2 text-emerald-300">life takes you.</motion.span>
              </motion.h1>
              <motion.p
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9, duration: 0.7 }}
                className="mt-6 max-w-lg text-sm leading-6 text-white/72 sm:mt-7 sm:text-base sm:leading-7"
              >
                A calmer, more considered way to move through your city. The good part starts before you arrive.
              </motion.p>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.06, duration: 0.65 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Suspense fallback={<div className="h-14 w-44 rounded-full bg-white/15" />}>
                  <Show when="signed-out">
                    <SignUpButton>
                      <motion.button
                        whileHover={reduceMotion ? undefined : { y: -3, scale: 1.025, boxShadow: "0 22px 60px rgba(16,185,129,0.3)" }}
                        whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 320, damping: 20 }}
                        className="group inline-flex items-center justify-center gap-3 rounded-full bg-emerald-300 px-7 py-4 text-sm font-bold text-zinc-950"
                      >
                        Find your ride <ArrowUpRight />
                      </motion.button>
                    </SignUpButton>
                  </Show>
                  <Show when="signed-in">
                    <Link href="/dashboard" className="group inline-flex items-center justify-center gap-3 rounded-full bg-emerald-300 px-7 py-4 text-sm font-bold text-zinc-950 transition hover:bg-emerald-200">
                      Open dashboard <ArrowUpRight />
                    </Link>
                  </Show>
                </Suspense>
                <motion.a
                  href="#the-ride"
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/25 bg-white/[0.07] px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/15"
                >
                  Take a look <span className="inline-block transition-transform group-hover:translate-y-0.5">↓</span>
                </motion.a>
              </motion.div>

              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.35, duration: 0.8 }}
                className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-medium text-white/60 sm:mt-10"
              >
                <span className="flex items-center gap-2"><span className="text-emerald-300">✳</span> Thoughtful trips</span>
                <span className="hidden h-1 w-1 rounded-full bg-white/35 sm:block" />
                <span className="flex items-center gap-2"><span className="text-emerald-300">✳</span> People-first service</span>
                <span className="hidden h-1 w-1 rounded-full bg-white/35 sm:block" />
                <span className="flex items-center gap-2"><span className="text-emerald-300">✳</span> Your time, respected</span>
              </motion.div>
            </div>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.1, duration: 0.8, type: "spring", stiffness: 100, damping: 18 }}
              whileHover={reduceMotion ? undefined : { y: -5, rotate: -1 }}
              className="absolute bottom-6 right-6 hidden w-[250px] rounded-[22px] border border-white/20 bg-black/35 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl md:block lg:bottom-12 lg:right-12 lg:w-[285px]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/55">The little details</span>
                <span className="rounded-full bg-emerald-300/15 px-2 py-1 text-[9px] font-bold text-emerald-200">CABBOOK CARE</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <motion.span
                  animate={reduceMotion ? undefined : { y: [0, -4, 0], rotate: [0, -5, 0] }}
                  transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-300 text-xl text-zinc-950"
                >
                  ✦
                </motion.span>
                <div>
                  <p className="text-sm font-semibold text-white">A softer landing.</p>
                  <p className="mt-1 text-xs text-white/55">Every trip gets the details right.</p>
                </div>
              </div>
              <div className="mt-4 flex gap-1.5">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((dot) => (
                  <motion.span
                    key={dot}
                    animate={reduceMotion ? undefined : { opacity: [0.25, 0.9, 0.25], scaleY: [0.7, 1.35, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: dot * 0.09, ease: "easeInOut" }}
                    className="h-1 flex-1 origin-center rounded-full bg-emerald-300"
                  />
                ))}
              </div>
            </motion.div>

            <motion.div
              aria-hidden="true"
              className="absolute bottom-9 right-[37%] hidden h-2 w-2 rounded-full bg-emerald-200 shadow-[0_0_20px_8px_rgba(110,231,183,0.3)] lg:block"
              animate={reduceMotion ? undefined : { y: [0, -13, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 4.3, repeat: Infinity }}
            />
          </div>
        </section>
      </div>

      <section className="relative mx-auto max-w-[1320px] px-5 pb-4 pt-12 sm:px-8 sm:pt-16 lg:px-12 lg:pt-20">
        <div className="soft-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 opacity-60" />
        <Reveal className="flex flex-col justify-between gap-8 border-b border-[var(--line)] pb-9 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">An easier kind of everyday</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.06em] text-[var(--ink)] sm:text-5xl">
              The ride is part of<br className="hidden sm:block" /> the story.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-6 text-[var(--muted)] sm:text-base">
            A little less logistics. A little more living. CabBook is designed around the moments that make a city feel like yours.
          </p>
        </Reveal>

        <Stagger className="grid gap-3 py-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5 lg:py-8">
          {rideFeatures.map((feature, index) => (
            <StaggerItem key={feature.number}>
              <HoverLift>
                <article className="feature-card group relative h-full overflow-hidden rounded-[25px] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_10px_40px_rgba(15,23,18,0.025)] sm:p-7">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-[var(--muted)]">{feature.number} / 03</span>
                    <motion.span
                      whileHover={reduceMotion ? undefined : { rotate: 45, scale: 1.18 }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-xl text-emerald-700 dark:text-emerald-300"
                    >
                      {feature.icon}
                    </motion.span>
                  </div>
                  <p className="mt-8 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">{feature.tag}</p>
                  <h3 className="mt-2 max-w-xs text-2xl font-semibold tracking-[-0.05em] text-[var(--ink)]">{feature.title}</h3>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--muted)]">{feature.body}</p>
                  <div className="mt-7 flex items-center justify-between border-t border-[var(--line)] pt-4">
                    <span className="text-xs font-medium text-[var(--muted)]">A better trip begins here</span>
                    <motion.span
                      animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                      transition={{ duration: 2.4 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
                      className="text-emerald-700 dark:text-emerald-300"
                    >
                      ↗
                    </motion.span>
                  </div>
                  <motion.div
                    aria-hidden="true"
                    className="absolute -bottom-24 -right-20 h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl"
                    initial={{ opacity: 0, scale: 0.5 }}
                    whileHover={{ opacity: 1, scale: 1.3 }}
                    transition={{ duration: 0.5 }}
                  />
                </article>
              </HoverLift>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <Reveal className="mx-auto max-w-[1320px] px-5 pb-16 pt-5 sm:px-8 sm:pb-24 lg:px-12">
        <section id="the-ride" className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface-2)] p-6 sm:p-9 lg:p-12">
          <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border border-emerald-500/10" />
          <div className="absolute -right-4 -top-12 h-52 w-52 rounded-full border border-emerald-500/10" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-300">Small details. Big difference.</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-[var(--ink)] sm:text-5xl">Arrive a little more like yourself.</h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--muted)] sm:text-base">
                We&apos;re building a ride experience that feels thoughtful from the first hello to the last turn.
              </p>
            </div>
            <motion.div whileHover={reduceMotion ? undefined : { y: -3 }} whileTap={reduceMotion ? undefined : { scale: 0.97 }}>
              <Suspense fallback={<div className="h-12 w-36 rounded-full bg-emerald-500/20" />}>
                <Show when="signed-out">
                  <SignUpButton>
                    <button className="group inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-400">
                      Ride with us <ArrowUpRight />
                    </button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard" className="group inline-flex items-center gap-3 whitespace-nowrap rounded-full bg-emerald-500 px-6 py-3.5 text-sm font-bold text-zinc-950 shadow-lg shadow-emerald-600/15 transition hover:bg-emerald-400">
                    Your dashboard <ArrowUpRight />
                  </Link>
                </Show>
              </Suspense>
            </motion.div>
          </div>
        </section>
      </Reveal>

      <div className="overflow-hidden border-y border-[var(--line)] py-4 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--muted)]">
        <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
          {[...Array(2)].map((_, repeat) => (
            <div key={repeat} className="flex items-center gap-8 pr-8">
              {Array.from({ length: 8 }, (_, index) => (
                <span key={`${repeat}-${index}`} className="flex items-center gap-8">
                  <span>Go at your pace</span><span className="text-emerald-500">✳</span>
                  <span>Take the scenic route</span><span className="text-emerald-500">✳</span>
                  <span>Make time for the good stuff</span><span className="text-emerald-500">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <footer className="mx-auto flex w-full max-w-[1320px] flex-col justify-between gap-3 px-5 py-7 text-xs text-[var(--muted)] sm:flex-row sm:items-center sm:px-8 lg:px-12">
        <p>© 2026 CabBook. A better way to get there.</p>
        <p className="flex items-center gap-2"><span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" /> Made for the moments between.</p>
      </footer>
    </main>
  );
}
