"use client";

import { useEffect, useState } from "react";

type PushConfig = { enabled: boolean; publicKey: string | null; error?: string };
type ControlState = "loading" | "unsupported" | "unconfigured" | "off" | "on" | "working" | "error";

function decodeApplicationServerKey(value: string) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (character) => character.charCodeAt(0));
}

export default function NotificationPushControl() {
  const [state, setState] = useState<ControlState>("loading");
  const [message, setMessage] = useState("");
  const [config, setConfig] = useState<PushConfig | null>(null);
  const [hasExistingSubscription, setHasExistingSubscription] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications/push-config", { cache: "no-store" })
      .then(async (response) => await response.json() as PushConfig)
      .then(async (result) => {
        if (!active) return;
        setConfig(result);
        if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
          setState("unsupported");
          return;
        }
        if (!result.enabled || !result.publicKey) {
          setState("unconfigured");
          return;
        }
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        const subscription = await registration.pushManager.getSubscription();
        if (!active) return;
        setHasExistingSubscription(Boolean(subscription));
        if (!subscription) {
          setState("off");
          return;
        }
        const syncResponse = await fetch("/api/notifications/push-subscriptions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription.toJSON()),
        });
        if (!syncResponse.ok) {
          const payload = await syncResponse.json().catch(() => null) as { error?: string } | null;
          throw new Error(payload?.error ?? "Could not sync this browser’s push subscription.");
        }
        if (active) setState("on");
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setMessage(loadError instanceof Error ? loadError.message : "Could not check push notification settings.");
        setState("error");
      });
    return () => { active = false; };
  }, []);

  async function togglePush() {
    if (state !== "off" && state !== "on" && state !== "error") return;
    setState("working");
    setMessage("");
    try {
      const permissionRequest = state === "off" && Notification.permission === "default"
        ? Notification.requestPermission()
        : null;
      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();
      if (existing) {
        const response = await fetch("/api/notifications/push-subscriptions", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: existing.endpoint }),
        });
        if (!response.ok) throw new Error("Could not disable device notifications.");
        await existing.unsubscribe();
        setHasExistingSubscription(false);
        setState("off");
        return;
      }
      if (Notification.permission === "denied") throw new Error("Notifications are blocked in this browser’s site settings.");
      const permission = permissionRequest
        ? await permissionRequest
        : Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Allow notifications in the browser prompt to enable device alerts.");
      if (!config?.publicKey) throw new Error("The push service is not configured.");
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeApplicationServerKey(config.publicKey),
      });
      const response = await fetch("/api/notifications/push-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) {
        await subscription.unsubscribe();
        setHasExistingSubscription(false);
        throw new Error(payload?.error ?? "Could not enable device notifications.");
      }
      setHasExistingSubscription(true);
      setState("on");
    } catch (toggleError) {
      setMessage(toggleError instanceof Error ? toggleError.message : "Could not update device notification settings.");
      setState("error");
    }
  }

  const isEnabled = state === "on";
  const isBusy = state === "loading" || state === "working";
  const title = state === "unconfigured"
    ? "Device alerts need server setup"
    : state === "unsupported"
      ? "This browser does not support device alerts"
      : state === "error"
        ? message
        : isEnabled
          ? "Device alerts are on for this browser"
          : "Get ride updates when CabBook is closed";

  return (
    <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-[var(--ink)]">Device notifications</p>
        <p className="mt-1 text-[9px] leading-4 text-[var(--muted)]">{title}</p>
      </div>
      {(state === "on" || state === "off" || state === "working" || state === "loading" || state === "error") && (
        <button
          type="button"
          onClick={() => void togglePush()}
          disabled={isBusy}
          className="shrink-0 rounded-full border border-[var(--line)] px-4 py-2 text-[9px] font-extrabold text-[var(--ink)] transition hover:border-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isBusy ? "Please wait…" : isEnabled ? "Turn off" : hasExistingSubscription ? "Disconnect browser" : "Enable device alerts"}
        </button>
      )}
      {message && state !== "error" && <p role="alert" className="text-[9px] text-rose-600 dark:text-rose-300">{message}</p>}
      {state === "error" && <p role="alert" className="sr-only">{message}</p>}
    </div>
  );
}
