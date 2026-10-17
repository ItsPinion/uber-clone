"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import NotificationPushControl from "@/components/NotificationPushControl";
import {
  clearReadRideNotificationsOnServer,
  deleteRideNotificationOnServer,
  markAllRideNotificationsReadOnServer,
  markRideNotificationReadOnServer,
  type RideNotification,
} from "@/lib/ride-storage";

type NotificationFilter = "all" | "unread";
type NotificationPage = { notifications: RideNotification[]; unreadCount: number; readCount: number; nextCursor: string | null; error?: string };

function formatNotificationDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

async function fetchNotificationPage(filter: NotificationFilter, cursor?: string): Promise<NotificationPage> {
  const params = new URLSearchParams({ filter, limit: "20" });
  if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/notifications?${params}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null) as NotificationPage | null;
  if (!response.ok || !payload || !Array.isArray(payload.notifications)) {
    throw new Error(payload?.error ?? "Could not load your notifications.");
  }
  return payload;
}

export default function NotificationHistoryExperience() {
  const { isLoaded, user } = useUser();
  const userId = isLoaded ? user?.id ?? null : null;
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [notifications, setNotifications] = useState<RideNotification[]>([]);
  const [notificationsOwnerId, setNotificationsOwnerId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readCount, setReadCount] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isClearingRead, setIsClearingRead] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let active = true;
    void fetchNotificationPage(filter).then((page) => {
      if (!active) return;
      setNotificationsOwnerId(userId);
      setNotifications(page.notifications);
      setUnreadCount(page.unreadCount);
      setReadCount(page.readCount);
      setNextCursor(page.nextCursor);
    }).catch((loadError: unknown) => {
      if (!active) return;
      setError(loadError instanceof Error ? loadError.message : "Could not load your notifications.");
    }).finally(() => {
      if (active) setIsLoading(false);
    });
    return () => { active = false; };
  }, [filter, isLoaded, userId]);

  function chooseFilter(value: NotificationFilter) {
    if (value === filter) return;
    setIsLoading(true);
    setError("");
    setNotifications([]);
    setNextCursor(null);
    setFilter(value);
  }

  const visibleNotifications = notificationsOwnerId === userId ? notifications : [];
  const visibleUnreadCount = notificationsOwnerId === userId ? unreadCount : 0;
  const visibleReadCount = notificationsOwnerId === userId ? readCount : 0;
  const isPageLoading = !isLoaded || !userId || isLoading || (notificationsOwnerId !== userId && !error);

  async function loadMore() {
    if (!nextCursor || isLoadingMore || !userId || notificationsOwnerId !== userId) return;
    setIsLoadingMore(true);
    setError("");
    try {
      const page = await fetchNotificationPage(filter, nextCursor);
      setNotifications((current) => {
        const seen = new Set(current.map((notification) => notification.id));
        return [...current, ...page.notifications.filter((notification) => !seen.has(notification.id))];
      });
      setUnreadCount(page.unreadCount);
      setReadCount(page.readCount);
      setNextCursor(page.nextCursor);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load older notifications.");
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function markRead(notification: RideNotification) {
    if (!userId || notificationsOwnerId !== userId || updatingId || deletingId || isClearingRead || isMarkingAllRead) return;
    setUpdatingId(notification.id);
    setError("");
    try {
      await markRideNotificationReadOnServer(notification.id, userId);
      setNotifications((current) => filter === "unread"
        ? current.filter((item) => item.id !== notification.id)
        : current.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
      setReadCount((count) => count + 1);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update this notification.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeNotification(notification: RideNotification) {
    if (!userId || notificationsOwnerId !== userId || updatingId || deletingId || isClearingRead || isMarkingAllRead) return;
    setDeletingId(notification.id);
    setError("");
    try {
      await deleteRideNotificationOnServer(notification.id, userId);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      if (notification.read) setReadCount((count) => Math.max(0, count - 1));
      else setUnreadCount((count) => Math.max(0, count - 1));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not remove this notification.");
    } finally {
      setDeletingId(null);
    }
  }

  async function clearRead() {
    if (!userId || notificationsOwnerId !== userId || readCount === 0 || isClearingRead || isMarkingAllRead || updatingId || deletingId) return;
    setIsClearingRead(true);
    setError("");
    try {
      await clearReadRideNotificationsOnServer(userId);
      setNotifications((current) => current.filter((notification) => !notification.read));
      setReadCount(0);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not clear read notifications.");
    } finally {
      setIsClearingRead(false);
    }
  }

  async function markAllRead() {
    if (!userId || notificationsOwnerId !== userId || unreadCount === 0 || isMarkingAllRead || isClearingRead || deletingId || updatingId) return;
    setIsMarkingAllRead(true);
    setError("");
    try {
      const updated = await markAllRideNotificationsReadOnServer(userId);
      setNotifications((current) => filter === "unread" ? [] : current.map((notification) => ({ ...notification, read: true })));
      if (filter === "unread") setNextCursor(null);
      setReadCount((count) => count + updated);
      setUnreadCount(0);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not update notifications.");
    } finally {
      setIsMarkingAllRead(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-76px)] overflow-hidden px-4 pb-20 pt-9 sm:px-7 sm:pt-14 lg:px-10">
      <div aria-hidden="true" className="soft-grid pointer-events-none absolute inset-x-0 top-0 h-[430px] opacity-50" />
      <div className="relative mx-auto max-w-[900px]">
        <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[10px] font-bold text-[var(--muted)] transition hover:text-[var(--ink)]">
          <span aria-hidden="true">←</span> Dashboard
        </Link>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mt-7 flex flex-col justify-between gap-5 sm:mt-9 sm:flex-row sm:items-end"
        >
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Your account inbox</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.055em] text-[var(--ink)] sm:text-4xl">Ride notifications</h1>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">Ride requests and trip changes, synced to your account.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[10px] font-bold text-[var(--muted)]">
              {visibleUnreadCount} unread
            </span>
            <button
              type="button"
              onClick={() => void clearRead()}
              disabled={visibleReadCount === 0 || isClearingRead || isMarkingAllRead || updatingId !== null || deletingId !== null}
              className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-[9px] font-extrabold text-[var(--muted)] transition hover:border-rose-500/35 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:text-rose-300"
            >
              {isClearingRead ? "Clearing…" : `Clear read${visibleReadCount ? ` (${visibleReadCount})` : ""}`}
            </button>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={visibleUnreadCount === 0 || isMarkingAllRead || isClearingRead || updatingId !== null || deletingId !== null}
              className="rounded-full bg-emerald-500 px-4 py-2.5 text-[10px] font-extrabold text-zinc-950 shadow-sm transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isMarkingAllRead ? "Saving…" : "Mark all read"}
            </button>
          </div>
        </motion.div>

        <NotificationPushControl />

        <section className="mt-8 overflow-hidden rounded-[24px] border border-[var(--line)] bg-[var(--surface)] shadow-[0_24px_80px_rgba(7,14,9,0.07)] dark:shadow-[0_24px_80px_rgba(0,0,0,0.14)]">
          <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-4 sm:px-6">
            <div>
              <h2 className="text-xs font-extrabold text-[var(--ink)]">Recent activity</h2>
              <p className="mt-1 text-[9px] text-[var(--muted)]">Newest updates appear first</p>
            </div>
            <div role="tablist" aria-label="Notification filter" className="flex rounded-full border border-[var(--line)] bg-[var(--surface-2)] p-1">
              {(["all", "unread"] as const).map((value) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={filter === value}
                  key={value}
                  onClick={() => chooseFilter(value)}
                  className={`rounded-full px-3 py-2 text-[9px] font-extrabold transition ${filter === value ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" : "text-[var(--muted)] hover:text-[var(--ink)]"}`}
                >
                  {value === "all" ? "All" : "Unread"}
                </button>
              ))}
            </div>
          </div>

          {error && <p role="alert" className="mx-4 mt-4 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-[10px] font-semibold text-rose-700 dark:text-rose-300 sm:mx-6">{error}</p>}

          {isPageLoading ? (
            <div className="space-y-3 p-4 sm:p-6" aria-label="Loading notifications">
              {[0, 1, 2].map((item) => <div key={item} className="h-[86px] animate-pulse rounded-2xl bg-[var(--surface-2)]" />)}
            </div>
          ) : visibleNotifications.length ? (
            <div className="divide-y divide-[var(--line)]">
              {visibleNotifications.map((notification, index) => (
                <motion.article
                  key={notification.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index, 8) * 0.025 }}
                  className={`flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 ${notification.read ? "" : "bg-emerald-500/[0.035]"}`}
                >
                  <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${notification.read ? "bg-[var(--surface-2)] text-[var(--muted)]" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"}`} aria-hidden="true">
                    <span className="text-lg">{notification.title.toLowerCase().includes("cancel") ? "×" : notification.title.toLowerCase().includes("completed") ? "✓" : "↗"}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="text-[11px] font-extrabold text-[var(--ink)]">{notification.title}</h3>
                      {!notification.read && <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">New</span>}
                    </div>
                    <p className="mt-1.5 text-[10px] leading-5 text-[var(--muted)]">{notification.message}</p>
                    <p className="mt-2 text-[9px] font-semibold text-[var(--muted)]">{formatNotificationDate(notification.createdAt)}</p>
                  </div>
                  <div className="mt-1 flex shrink-0 items-center gap-1.5">
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => void markRead(notification)}
                        disabled={updatingId !== null || deletingId !== null || isClearingRead}
                        aria-label={`Mark ${notification.title} as read`}
                        className="rounded-full border border-[var(--line)] px-3 py-2 text-[9px] font-bold text-[var(--muted)] transition hover:border-emerald-500/40 hover:text-emerald-700 disabled:opacity-50 dark:hover:text-emerald-300"
                      >
                        {updatingId === notification.id ? "Saving…" : "Mark read"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void removeNotification(notification)}
                      disabled={updatingId !== null || deletingId !== null || isClearingRead}
                      aria-label={`Remove ${notification.title}`}
                      title="Remove notification"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-rose-500/35 hover:text-rose-700 disabled:opacity-50 dark:hover:text-rose-300"
                    >
                      {deletingId === notification.id ? "…" : "×"}
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-xl text-[var(--muted)]" aria-hidden="true">♧</span>
              <h3 className="mt-4 text-xs font-extrabold text-[var(--ink)]">{filter === "unread" ? "You’re all caught up." : "No ride updates yet."}</h3>
              <p className="mx-auto mt-2 max-w-sm text-[10px] leading-5 text-[var(--muted)]">{filter === "unread" ? "New ride activity will appear here when it needs your attention." : "Ride requests and trip status changes will be saved here."}</p>
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-[var(--line)] px-4 py-4 sm:flex-row sm:px-6">
            <p className="text-[9px] text-[var(--muted)]">Showing {visibleNotifications.length} {filter === "unread" ? "unread " : ""}updates · account-synced</p>
            {notificationsOwnerId === userId && nextCursor && (
              <button type="button" onClick={() => void loadMore()} disabled={isLoadingMore} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 text-[9px] font-extrabold text-[var(--ink)] transition hover:border-emerald-500/40 disabled:opacity-50">
                {isLoadingMore ? "Loading…" : "Load older updates"}
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
