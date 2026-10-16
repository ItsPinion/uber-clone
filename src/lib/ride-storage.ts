"use client";

import { useSyncExternalStore } from "react";
import type { RideLocation, RideCategory, SavedRideRequest } from "@/lib/ride";

const STORAGE_KEY = "cabbook:ride-requests:v1";
const CHANGE_EVENT = "cabbook:ride-requests-change";
const EMPTY_RIDES: SavedRideRequest[] = [];
let cachedRawValue: string | null = null;
let cachedRides: SavedRideRequest[] = EMPTY_RIDES;

function getRidesSnapshot() {
  if (typeof window === "undefined") return EMPTY_RIDES;

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY) ?? "[]";
    if (rawValue !== cachedRawValue) {
      cachedRawValue = rawValue;
      const parsed: unknown = JSON.parse(rawValue);
      cachedRides = Array.isArray(parsed) ? (parsed as SavedRideRequest[]) : EMPTY_RIDES;
    }
  } catch {
    cachedRawValue = "[]";
    cachedRides = EMPTY_RIDES;
  }

  return cachedRides;
}

function subscribeToRides(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
  };
}

export function useRideRequests() {
  return useSyncExternalStore(subscribeToRides, getRidesSnapshot, () => EMPTY_RIDES);
}

export function saveRideRequest(request: Omit<SavedRideRequest, "id" | "createdAt" | "status">) {
  const nextRide: SavedRideRequest = {
    ...request,
    id: globalThis.crypto?.randomUUID?.() ?? `ride-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: "requested",
  };
  const nextList = [nextRide, ...getRidesSnapshot()].slice(0, 20);
  persistRides(nextList);
  return nextRide;
}

export function cancelRideRequest(rideId: string) {
  const nextList = getRidesSnapshot().map((ride) =>
    ride.id === rideId ? { ...ride, status: "cancelled" as const } : ride,
  );
  persistRides(nextList);
}

function persistRides(rides: SavedRideRequest[]) {
  cachedRides = rides;
  cachedRawValue = JSON.stringify(rides);
  try {
    window.localStorage.setItem(STORAGE_KEY, cachedRawValue);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    throw new Error("This browser could not save the ride request. Check that local storage is available.");
  }
}

export type { RideLocation, RideCategory, SavedRideRequest };
