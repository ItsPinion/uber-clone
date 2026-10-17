import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";

type ServiceWorkerTestEvent = {
  data?: { json: () => unknown; text?: () => string } | null;
  notification?: { data?: { url?: string }; close: () => void };
  waitUntil?: (promise: Promise<unknown>) => void;
};

test("push service worker displays generic alerts and opens only same-origin notification links", async () => {
  const handlers = new Map<string, (event: ServiceWorkerTestEvent) => void>();
  const shown: { title: string; options: { body: string; data: { url: string } } }[] = [];
  const navigated: string[] = [];
  const focused: string[] = [];
  const opened: string[] = [];
  const existingClient = {
    url: "https://cabbook.example/dashboard",
    navigate: async (url: string) => { navigated.push(url); return existingClient; },
    focus: async () => { focused.push("focused"); },
  };
  const self = {
    location: { origin: "https://cabbook.example" },
    registration: { showNotification: async (title: string, options: { body: string; data: { url: string } }) => { shown.push({ title, options }); } },
    clients: {
      matchAll: async () => [existingClient],
      openWindow: async (url: string) => { opened.push(url); },
    },
    addEventListener: (type: string, handler: (event: ServiceWorkerTestEvent) => void) => handlers.set(type, handler),
  };
  runInNewContext(readFileSync("public/sw.js", "utf8"), { self, URL });

  let pushPromise: Promise<unknown> | undefined;
  handlers.get("push")?.({
    data: { json: () => ({ title: "CabBook ride update", body: "You have a new update. Sign in to CabBook to view it.", url: "/notifications" }) },
    waitUntil: (promise: Promise<unknown>) => { pushPromise = promise; },
  });
  assert.ok(pushPromise);
  await pushPromise;
  assert.equal(shown[0].title, "CabBook ride update");
  assert.equal(shown[0].options.data.url, "/notifications");

  let clickPromise: Promise<unknown> | undefined;
  handlers.get("notificationclick")?.({
    notification: { data: { url: "/notifications" }, close() {} },
    waitUntil: (promise: Promise<unknown>) => { clickPromise = promise; },
  });
  assert.ok(clickPromise);
  await clickPromise;
  assert.deepEqual(navigated, ["https://cabbook.example/notifications"]);
  assert.deepEqual(focused, ["focused"]);
  assert.deepEqual(opened, []);

  let externalClickPromise: Promise<unknown> | undefined;
  handlers.get("notificationclick")?.({
    notification: { data: { url: "https://attacker.example/" }, close() {} },
    waitUntil: (promise: Promise<unknown>) => { externalClickPromise = promise; },
  });
  assert.equal(externalClickPromise, undefined);
  assert.deepEqual(opened, []);
});
