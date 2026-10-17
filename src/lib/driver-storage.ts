"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedRideRequest } from "@/lib/ride";

export function useDriverRides(enabled: boolean) {
  const [rides, setRides] = useState<SavedRideRequest[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await fetch("/api/driver/rides", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as { rides?: SavedRideRequest[]; error?: string } | null;
      if (!response.ok || !payload || !Array.isArray(payload.rides)) {
        throw new Error(payload?.error ?? "Could not load driver ride offers.");
      }
      setRides(payload.rides);
      setError("");
    } catch (rideError) {
      setError(rideError instanceof Error ? rideError.message : "Could not load driver ride offers.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(refreshWhenVisible, 15_000);
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [enabled, refresh]);

  return { rides, setRides, error, setError, isLoading, refresh };
}

export async function updateDriverRideOnServer(rideId: string, action: "accept" | "decline" | "start" | "complete") {
  const response = await fetch(`/api/driver/rides/${encodeURIComponent(rideId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const payload = await response.json().catch(() => null) as { ride?: SavedRideRequest; error?: string } | null;
  if (!response.ok || !payload?.ride) throw new Error(payload?.error ?? "Could not update the driver ride.");
  return payload.ride;
}
