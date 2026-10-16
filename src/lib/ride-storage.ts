"use client";

import { useSyncExternalStore } from "react";
import type { DemoDriver, RideLocation, RideCategory, RideStatus, SavedRideRequest } from "@/lib/ride";

const STORAGE_KEY = "cabbook:ride-requests:v1";
const NOTIFICATIONS_KEY = "cabbook:notifications:v1";
const CHANGE_EVENT = "cabbook:ride-data-change";
const CHANNEL_NAME = "cabbook:ride-updates";
const EMPTY_RIDES: SavedRideRequest[] = [];
const EMPTY_NOTIFICATIONS: RideNotification[] = [];
let cachedRidesRaw: string | null = null;
let cachedRides: SavedRideRequest[] = EMPTY_RIDES;
let cachedNotificationsRaw: string | null = null;
let cachedNotifications: RideNotification[] = EMPTY_NOTIFICATIONS;
let syncChannel: BroadcastChannel | null = null;

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

function getSyncChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return null;
  syncChannel ??= new BroadcastChannel(CHANNEL_NAME);
  return syncChannel;
}

function notifySubscribers() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
  getSyncChannel()?.postMessage({ type: "state-changed" });
}

function getRidesSnapshot() {
  if (typeof window === "undefined") return EMPTY_RIDES;
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
    if (rawValue !== cachedRidesRaw) {
      cachedRidesRaw = rawValue;
      const parsed: unknown = JSON.parse(rawValue);
      cachedRides = Array.isArray(parsed) ? (parsed as SavedRideRequest[]) : EMPTY_RIDES;
    }
  } catch {
    cachedRidesRaw = "[]";
    cachedRides = EMPTY_RIDES;
  }
  return cachedRides;
}

function getNotificationsSnapshot() {
  if (typeof window === "undefined") return EMPTY_NOTIFICATIONS;
  try {
    const rawValue = window.localStorage.getItem(NOTIFICATIONS_KEY) ?? "[]";
    if (rawValue !== cachedNotificationsRaw) {
      cachedNotificationsRaw = rawValue;
      const parsed: unknown = JSON.parse(rawValue);
      cachedNotifications = Array.isArray(parsed) ? (parsed as RideNotification[]) : EMPTY_NOTIFICATIONS;
    }
  } catch {
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
  return useSyncExternalStore(subscribeToRideData, getRidesSnapshot, () => EMPTY_RIDES);
}

export function useRideNotifications() {
  return useSyncExternalStore(subscribeToRideData, getNotificationsSnapshot, () => EMPTY_NOTIFICATIONS);
}

export function saveRideRequest(request: Omit<SavedRideRequest, "id" | "createdAt" | "status" | "driver">) {
  const nextRide: SavedRideRequest = {
    ...request,
    id: makeId("ride"),
    createdAt: new Date().toISOString(),
    status: "requested",
  };
  const nextList = [nextRide, ...getRidesSnapshot()].slice(0, 20);
  persistRides(nextList, {
    rideId: nextRide.id,
    title: "New ride request",
    message: `${nextRide.pickup.name} to ${nextRide.dropoff.name}`,
  });
  return nextRide;
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

function persistRides(rides: SavedRideRequest[], notification: Pick<RideNotification, "rideId" | "title" | "message">) {
  cachedRides = rides;
  cachedRidesRaw = JSON.stringify(rides);
  try {
    window.localStorage.setItem(STORAGE_KEY, cachedRidesRaw);
    addNotification(notification, false);
    notifySubscribers();
  } catch {
    throw new Error("This browser could not save the ride update. Check that local storage is available.");
  }
}

function addNotification(notification: Pick<RideNotification, "rideId" | "title" | "message">, shouldNotify = true) {
  const nextNotification: RideNotification = {
    ...notification,
    id: makeId("notice"),
    createdAt: new Date().toISOString(),
    read: false,
  };
  const nextList = [nextNotification, ...getNotificationsSnapshot()].slice(0, 30);
  cachedNotifications = nextList;
  cachedNotificationsRaw = JSON.stringify(nextList);
  window.localStorage.setItem(NOTIFICATIONS_KEY, cachedNotificationsRaw);
  if (shouldNotify) notifySubscribers();
}

export function markRideNotificationRead(notificationId: string) {
  updateNotificationReads((notification) => notification.id === notificationId);
}

export function markAllRideNotificationsRead() {
  updateNotificationReads(() => true);
}

function updateNotificationReads(shouldMarkRead: (notification: RideNotification) => boolean) {
  const notifications = getNotificationsSnapshot();
  const nextList = notifications.map((notification) =>
    shouldMarkRead(notification) ? { ...notification, read: true } : notification,
  );
  if (nextList.every((notification, index) => notification === notifications[index])) return;

  cachedNotifications = nextList;
  cachedNotificationsRaw = JSON.stringify(nextList);
  try {
    window.localStorage.setItem(NOTIFICATIONS_KEY, cachedNotificationsRaw);
    notifySubscribers();
  } catch {
    throw new Error("This browser could not save notification changes.");
  }
}

export type { RideLocation, RideCategory, SavedRideRequest, RideStatus, DemoDriver };
