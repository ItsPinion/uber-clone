"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { markAllRideNotificationsRead, markRideNotificationRead, useRideNotifications } from "@/lib/ride-storage";

function relativeTime(timestamp: string) {
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (elapsedSeconds < 45) return "just now";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)}m ago`;
  if (elapsedSeconds < 86400) return `${Math.floor(elapsedSeconds / 3600)}h ago`;
  return `${Math.floor(elapsedSeconds / 86400)}d ago`;
}

export default function NotificationBell() {
  const notifications = useRideNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const unreadCount = notifications.reduce((count, notification) => count + (notification.read ? 0 : 1), 0);
  const latestNotifications = notifications.slice(0, 8);

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        whileHover={reduceMotion ? undefined : { y: -2, rotate: 5 }}
        whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={isOpen}
        aria-controls="cabbook-notifications"
        className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-sm transition hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]" aria-hidden="true">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span key="unread-count" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 440, damping: 19 }} className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-[var(--surface)] bg-emerald-500 px-1 text-[8px] font-extrabold leading-none text-zinc-950">
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.section
            id="cabbook-notifications"
            role="dialog"
            aria-label="Ride notifications"
            initial={reduceMotion ? false : { opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+12px)] z-50 w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[22px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(7,14,9,0.2)]"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-4">
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">Ride updates</p>
                <p className="mt-0.5 text-[9px] text-[var(--muted)]">Live in this browser</p>
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRideNotificationsRead} className="text-[9px] font-bold text-emerald-700 transition hover:text-emerald-500 dark:text-emerald-300">Mark all read</button>
              )}
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {latestNotifications.length ? latestNotifications.map((notification, index) => (
                <motion.button
                  type="button"
                  key={notification.id}
                  initial={reduceMotion ? false : { opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.025 }}
                  onClick={() => markRideNotificationRead(notification.id)}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-[var(--surface-2)] ${notification.read ? "opacity-65" : "bg-emerald-500/[0.045]"}`}
                >
                  <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${notification.read ? "bg-[var(--surface-2)] text-[var(--muted)]" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`}>
                    <span className="text-xs" aria-hidden="true">{notification.title.includes("cancel") ? "×" : notification.title.includes("completed") ? "✓" : "↗"}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-[var(--ink)]">{notification.title}</span>
                      {!notification.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />}
                    </span>
                    <span className="mt-1 block text-[9px] leading-4 text-[var(--muted)]">{notification.message}</span>
                    <span className="mt-1.5 block text-[8px] font-medium text-[var(--muted)]">{relativeTime(notification.createdAt)}</span>
                  </span>
                </motion.button>
              )) : (
                <div className="px-4 py-10 text-center">
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted)]">♧</span>
                  <p className="mt-3 text-[10px] font-semibold text-[var(--ink)]">You&apos;re all caught up.</p>
                  <p className="mt-1 text-[9px] text-[var(--muted)]">Ride requests and status changes will show here.</p>
                </div>
              )}
            </div>
            <div className="border-t border-[var(--line)] px-4 py-2.5 text-center text-[8px] font-medium text-[var(--muted)]">Same-origin demo notifications · no push service connected</div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
