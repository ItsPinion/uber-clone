"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useUser } from "@clerk/nextjs";
import type { DemoDriver, RideLocation, RideCategory, RideStatus, SavedRideRequest, RideReview } from "@/lib/ride";

const LEGACY_STORAGE_KEY = "cabbook:ride-requests:v1";
const LEGACY_NOTIFICATIONS_KEY = "cabbook:notifications:v1";
const CHANGE_EVENT = "cabbook:ride-data-change";
const CHANNEL_NAME = "cabbook:ride-updates";
const EMPTY_RIDES: SavedRideRequest[] = [];
const EMPTY_NOTIFICATIONS: RideNotification[] = [];
type RideNotificationSnapshot = { notifications: RideNotification[]; unreadCount: number };
const EMPTY_NOTIFICATION_SNAPSHOT: RideNotificationSnapshot = { notifications: EMPTY_NOTIFICATIONS, unreadCount: 0 };
const serverNotifications = new Map<string, RideNotificationSnapshot>();
let activeNotificationUserId: string | null = null;
let notificationSessionGeneration = 0;
const notificationRefreshes = new Map<string, Promise<void>>();
let cachedRidesKey: string | null = null;
let cachedRidesRaw: string | null = null;
let cachedRides: SavedRideRequest[] = EMPTY_RIDES;
let cachedNotificationsKey: string | null = null;
let cachedNotificationsRaw: string | null = null;
let cachedNotifications: RideNotification[] = EMPTY_NOTIFICATIONS;
let syncChannel: BroadcastChannel | null = null;
const serverRefreshes = new Map<string, Promise<void>>();
const localRideMutations = new Map<string, Map<string, number>>();
let rideMutationSequence = 0;

export type RideNotification = {
  id: string;
  rideId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

function makeId(prefix: string) {
  return globalThis.crypto?.randomUUID?.() ?? `${prefix}-${Date.now()}`;
}

function rideStorageKey(userId: string | null) {
  return userId ? `cabbook:ride-requests:v2:${encodeURIComponent(userId)}` : LEGACY_STORAGE_KEY;
}

function notificationStorageKey(userId: string | null) {
  return userId ? `cabbook:notifications:v2:${encodeURIComponent(userId)}` : LEGACY_NOTIFICATIONS_KEY;
}

function getSyncChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  syncChannel ??= new BroadcastChannel(CHANNEL_NAME);
  return syncChannel;
}

function notifySubscribers() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
  getSyncChannel()?.postMessage({ type: "state-changed" });
}

function getRidesSnapshot(userId: string | null = null) {
  if (typeof window === "undefined") return EMPTY_RIDES;
  const storageKey = rideStorageKey(userId);
  try {
    const rawValue = window.localStorage.getItem(storageKey) ?? "[]";
    if (storageKey !== cachedRidesKey || rawValue !== cachedRidesRaw) {
      cachedRidesKey = storageKey;
      cachedRidesRaw = rawValue;
      const parsed: unknown = JSON.parse(rawValue);
      cachedRides = Array.isArray(parsed) ? (parsed as SavedRideRequest[]) : EMPTY_RIDES;
    }
  } catch {
    cachedRidesKey = storageKey;
    cachedRidesRaw = "[]";
    cachedRides = EMPTY_RIDES;
  }
  return cachedRides;
}

function getNotificationsSnapshot(userId: string | null = null) {
  if (typeof window === "undefined") return EMPTY_NOTIFICATIONS;
  const storageKey = notificationStorageKey(userId);
  try {
    const rawValue = window.localStorage.getItem(storageKey) ?? "[]";
    if (storageKey !== cachedNotificationsKey || rawValue !== cachedNotificationsRaw) {
      cachedNotificationsKey = storageKey;
      cachedNotificationsRaw = rawValue;
      const parsed: unknown = JSON.parse(rawValue);
      cachedNotifications = Array.isArray(parsed) ? (parsed as RideNotification[]) : EMPTY_NOTIFICATIONS;
    }
  } catch {
    cachedNotificationsKey = storageKey;
    cachedNotificationsRaw = "[]";
    cachedNotifications = EMPTY_NOTIFICATIONS;
  }
  return cachedNotifications;
}

function subscribeToRideData(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  const channel = getSyncChannel();
  channel?.addEventListener("message", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    channel?.removeEventListener("message", onStoreChange);
  };
}

export function useRideRequests() {
  const { isLoaded, user } = useUser();
  const userId = isLoaded ? user?.id ?? null : null;
  const rides = useSyncExternalStore(
    subscribeToRideData,
    () => userId ? getRidesSnapshot(userId) : EMPTY_RIDES,
    () => EMPTY_RIDES,
  );
  useEffect(() => {
    if (!userId) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshRideRequestsFromServer(userId);
    };
    void refreshRideRequestsFromServer(userId);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId]);
  return rides;
}

function refreshRideRequestsFromServer(userId: string) {
  const inFlight = serverRefreshes.get(userId);
  if (inFlight) return inFlight;
  const refresh = hydrateRideRequestsFromServer(userId).finally(() => {
    if (serverRefreshes.get(userId) === refresh) serverRefreshes.delete(userId);
  });
  serverRefreshes.set(userId, refresh);
  return refresh;
}

async function hydrateRideRequestsFromServer(userId: string) {
  const mutationSequenceAtStart = rideMutationSequence;
  try {
    const response = await fetch("/api/rides", { cache: "no-store" });
    const payload = await response.json().catch(() => null) as { rides?: SavedRideRequest[] } | null;
    if (!response.ok || !payload || !Array.isArray(payload.rides)) return;
    replaceRideRequestsFromServer(payload.rides, userId, mutationSequenceAtStart);
  } catch {
    // Keep the account-scoped local cache available if the API is temporarily offline.
  }
}

async function readApiPayload(response: Response) {
  return await response.json().catch(() => null) as { ride?: SavedRideRequest; error?: string } | null;
}

export async function requestRideFromServer(pickupId: string, dropoffId: string, category: RideCategory) {
  const response = await fetch("/api/rides", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pickupId, dropoffId, category }),
  });
  const payload = await readApiPayload(response);
  if (!response.ok || !payload?.ride) throw new Error(payload?.error ?? "Could not save the ride to the database.");
  return payload.ride;
}

export type RideUpdateAction = "cancel" | "decline" | "accept" | "start" | "complete" | "review";

export async function updateRideOnServer(rideId: string, action: RideUpdateAction, details: Record<string, unknown> = {}) {
  const response = await fetch(`/api/rides/${encodeURIComponent(rideId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...details, action }),
  });
  const payload = await readApiPayload(response);
  if (!response.ok || !payload?.ride) throw new Error(payload?.error ?? "Could not save the ride update.");
  return payload.ride;
}

export function useRideNotifications() {
  const { isLoaded, user } = useUser();
  const userId = isLoaded ? user?.id ?? null : null;
  const notifications = useSyncExternalStore(
    subscribeToRideData,
    () => userId ? serverNotifications.get(userId) ?? EMPTY_NOTIFICATION_SNAPSHOT : EMPTY_NOTIFICATION_SNAPSHOT,
    () => EMPTY_NOTIFICATION_SNAPSHOT,
  );

  useEffect(() => {
    if (activeNotificationUserId !== userId) {
      activeNotificationUserId = userId;
      notificationSessionGeneration += 1;
    }
    if (!userId) return;
    const sessionGeneration = notificationSessionGeneration;
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshRideNotificationsFromServer(userId, sessionGeneration);
    };
    void refreshRideNotificationsFromServer(userId, sessionGeneration);
    const interval = window.setInterval(refresh, 15_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [userId]);
  return notifications;
}

function refreshRideNotificationsFromServer(userId: string, sessionGeneration = notificationSessionGeneration) {
  if (activeNotificationUserId !== userId) return Promise.resolve();
  const requestKey = `${sessionGeneration}:${userId}`;
  const inFlight = notificationRefreshes.get(requestKey);
  if (inFlight) return inFlight;
  const refresh = (async () => {
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { notifications?: RideNotification[]; unreadCount?: number } | null;
      if (!response.ok || !Array.isArray(payload?.notifications) || activeNotificationUserId !== userId || notificationSessionGeneration !== sessionGeneration) return;
      serverNotifications.set(userId, {
        notifications: payload.notifications,
        unreadCount: Number.isInteger(payload.unreadCount) ? Number(payload.unreadCount) : payload.notifications.filter((notification) => !notification.read).length,
      });
      notifySubscribers();
    } catch {
      // Keep the last server snapshot visible when polling temporarily fails.
    }
  })().finally(() => {
    if (notificationRefreshes.get(requestKey) === refresh) notificationRefreshes.delete(requestKey);
  });
  notificationRefreshes.set(requestKey, refresh);
  return refresh;
}

export async function markRideNotificationReadOnServer(notificationId: string, userId: string | null) {
  const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "read" }),
  });
  if (!response.ok) throw new Error("Could not update this notification.");
  if (userId) await refreshRideNotificationsFromServer(userId);
}

export async function markAllRideNotificationsReadOnServer(userId: string | null) {
  const response = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "read-all" }),
  });
  if (!response.ok) throw new Error("Could not update notifications.");
  const payload = await response.json().catch(() => null) as { updated?: number } | null;
  if (userId) await refreshRideNotificationsFromServer(userId);
  return Number(payload?.updated ?? 0);
}

export async function deleteRideNotificationOnServer(notificationId: string, userId: string | null) {
  const response = await fetch(`/api/notifications/${encodeURIComponent(notificationId)}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Could not remove this notification.");
  if (userId) await refreshRideNotificationsFromServer(userId);
}

export async function clearReadRideNotificationsOnServer(userId: string | null) {
  const response = await fetch("/api/notifications", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "clear-read" }),
  });
  if (!response.ok) throw new Error("Could not clear read notifications.");
  const payload = await response.json().catch(() => null) as { deleted?: number } | null;
  if (userId) await refreshRideNotificationsFromServer(userId);
  return Number(payload?.deleted ?? 0);
}

// Kept for the browser-local storage unit tests and old, unclaimed browser data.
// The signed-in ride flows only create records through requestRideFromServer.
export function saveRideRequest(request: Omit<SavedRideRequest, "id" | "createdAt" | "status" | "driver">) {
  const nextRide: SavedRideRequest = {
    ...request,
    id: makeId("ride"),
    createdAt: new Date().toISOString(),
    status: "requested",
  };
  return cacheServerRideRequest(nextRide);
}

export function cacheServerRideRequest(ride: SavedRideRequest, userId: string | null = null) {
  recordLocalRideMutation(ride, userId);
  const nextList = [ride, ...getRidesSnapshot(userId).filter((existing) => existing.id !== ride.id)].slice(0, 100);
  persistRides(nextList, userId ? undefined : {
    rideId: ride.id,
    title: "New ride request",
    message: `${ride.pickup.name} to ${ride.dropoff.name}`,
  }, userId);
  return ride;
}

export function cacheServerRideUpdate(ride: SavedRideRequest, action: RideUpdateAction, userId: string | null = null) {
  recordLocalRideMutation(ride, userId);
  const messages: Partial<Record<RideUpdateAction, Pick<RideNotification, "title" | "message">>> = {
    cancel: { title: "Ride request cancelled", message: "The rider cancelled this demo request." },
    decline: { title: "Ride request passed on", message: "A driver passed on this demo request." },
    accept: { title: "Driver matched", message: `${ride.driver?.name ?? "A driver"} is heading to pick-up in about ${ride.driver?.pickupEtaMinutes ?? "a few"} minutes.` },
    start: { title: "Ride started", message: "Your demo trip is now in progress." },
    complete: { title: "Ride completed", message: "Your demo trip is complete. Thanks for riding with CabBook." },
  };
  const nextList = [ride, ...getRidesSnapshot(userId).filter((existing) => existing.id !== ride.id)].slice(0, 100);
  const notification = messages[action];
  persistRides(nextList, !userId && notification ? { ...notification, rideId: ride.id } : undefined, userId);
  return ride;
}

function recordLocalRideMutation(ride: SavedRideRequest, userId: string | null) {
  if (!userId) return;
  rideMutationSequence += 1;
  const userMutations = localRideMutations.get(userId) ?? new Map<string, number>();
  userMutations.set(ride.id, rideMutationSequence);
  if (userMutations.size > 100) {
    const oldestRideId = userMutations.keys().next().value;
    if (oldestRideId) userMutations.delete(oldestRideId);
  }
  localRideMutations.set(userId, userMutations);
}

function replaceRideRequestsFromServer(serverRides: SavedRideRequest[], userId: string, mutationSequenceAtStart: number) {
  const storageKey = rideStorageKey(userId);
  const serverById = new Map(serverRides.map((ride) => [ride.id, ride]));
  const localRides = getRidesSnapshot(userId);
  const userMutations = localRideMutations.get(userId);
  for (const ride of localRides) {
    if ((userMutations?.get(ride.id) ?? 0) > mutationSequenceAtStart) serverById.set(ride.id, ride);
  }
  const rides = [...serverById.values()]
    .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
    .slice(0, 100);
  const serialized = JSON.stringify(rides);
  try {
    window.localStorage.setItem(storageKey, serialized);
    if (cachedRidesKey === storageKey) {
      cachedRides = rides;
      cachedRidesRaw = serialized;
    }
    notifySubscribers();
  } catch {
    throw new Error("This browser could not cache server rides locally.");
  }
}

export function saveRideReview(rideId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Choose a rating from 1 to 5 stars.");
  }
  if (comment.length > 500) {
    throw new Error("Keep your review under 500 characters.");
  }

  const rides = getRidesSnapshot();
  const currentRide = rides.find((ride) => ride.id === rideId);
  if (!currentRide || currentRide.status !== "completed" || currentRide.review) return false;

  const review = { rating, comment: comment.trim(), createdAt: new Date().toISOString() };
  const nextRides = rides.map((ride) => ride.id === rideId ? { ...ride, review } : ride);
  persistRides(nextRides);
  return true;
}

export function cancelRideRequest(rideId: string) {
  return updateRideRequest(rideId, "cancelled", ["requested"], {
    title: "Ride request cancelled",
    message: "The rider cancelled this demo request.",
  });
}

export function declineRideRequest(rideId: string) {
  return updateRideRequest(rideId, "declined", ["requested"], {
    title: "Ride request passed on",
    message: "A driver passed on this demo request.",
  });
}

export function acceptRideRequest(rideId: string, driver: DemoDriver) {
  return updateRideRequest(rideId, "accepted", ["requested"], {
    title: "Driver matched",
    message: `${driver.name} is heading to pick-up in about ${driver.pickupEtaMinutes} minutes.`,
  }, driver);
}

export function startRideRequest(rideId: string) {
  return updateRideRequest(rideId, "in_progress", ["accepted"], {
    title: "Ride started",
    message: "Your demo trip is now in progress.",
  });
}

export function completeRideRequest(rideId: string) {
  return updateRideRequest(rideId, "completed", ["in_progress"], {
    title: "Ride completed",
    message: "Your demo trip is complete. Thanks for riding with CabBook.",
  });
}

function updateRideRequest(
  rideId: string,
  status: RideStatus,
  allowedCurrentStatuses: RideStatus[],
  notification: Pick<RideNotification, "title" | "message">,
  driver?: DemoDriver,
) {
  const rides = getRidesSnapshot();
  const currentRide = rides.find((ride) => ride.id === rideId);
  if (!currentRide || !allowedCurrentStatuses.includes(currentRide.status)) return false;

  const nextRides = rides.map((ride) =>
    ride.id === rideId
      ? { ...ride, status, ...(driver ? { driver } : {}) }
      : ride,
  );
  persistRides(nextRides, { ...notification, rideId });
  return true;
}

function persistRides(
  rides: SavedRideRequest[],
  notification?: Pick<RideNotification, "rideId" | "title" | "message">,
  userId: string | null = null,
) {
  cachedRides = rides;
  cachedRidesKey = rideStorageKey(userId);
  cachedRidesRaw = JSON.stringify(rides);
  try {
    window.localStorage.setItem(cachedRidesKey, cachedRidesRaw);
    if (notification) addNotification(notification, false, userId);
    notifySubscribers();
  } catch {
    throw new Error("This browser could not save the ride update. Check that local storage is available.");
  }
}

function addNotification(
  notification: Pick<RideNotification, "rideId" | "title" | "message">,
  shouldNotify = true,
  userId: string | null = null,
) {
  const nextNotification: RideNotification = {
    ...notification,
    id: makeId("notice"),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const nextList = [nextNotification, ...getNotificationsSnapshot(userId)].slice(0, 30);
  cachedNotifications = nextList;
  cachedNotificationsKey = notificationStorageKey(userId);
  cachedNotificationsRaw = JSON.stringify(nextList);
  window.localStorage.setItem(cachedNotificationsKey, cachedNotificationsRaw);
  if (shouldNotify) notifySubscribers();
}

export function markRideNotificationRead(notificationId: string, userId: string | null = null) {
  updateNotificationReads((notification) => notification.id === notificationId, userId);
}

export function markAllRideNotificationsRead(userId: string | null = null) {
  updateNotificationReads(() => true, userId);
}

function updateNotificationReads(shouldMarkRead: (notification: RideNotification) => boolean, userId: string | null) {
  const notifications = getNotificationsSnapshot(userId);
  const nextList = notifications.map((notification) =>
    shouldMarkRead(notification) ? { ...notification, read: true } : notification,
  );
  if (nextList.every((notification, index) => notification === notifications[index])) return;

  cachedNotifications = nextList;
  cachedNotificationsKey = notificationStorageKey(userId);
  cachedNotificationsRaw = JSON.stringify(nextList);
  try {
    window.localStorage.setItem(cachedNotificationsKey, cachedNotificationsRaw);
    notifySubscribers();
  } catch {
    throw new Error("This browser could not save notification changes.");
  }
}

export type { RideLocation, RideCategory, SavedRideRequest, RideStatus, DemoDriver, RideReview };
