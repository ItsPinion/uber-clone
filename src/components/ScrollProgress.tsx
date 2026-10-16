"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: reduceMotion ? 400 : 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-emerald-400 via-emerald-300 to-lime-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]"
      style={{ scaleX, transformOrigin: "0% 50%" }}
    />
  );
}
