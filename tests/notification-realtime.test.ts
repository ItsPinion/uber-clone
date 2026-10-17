import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { after, test } from "node:test";
import WebSocket from "ws";
import { createRideForUser, listNotificationPushSubscriptionsForUser } from "../src/lib/server/ride-database";
import { VIZAG_LOCATIONS, type SavedRideRequest } from "../src/lib/ride";
import webpush from "web-push";

process.env.CABBOOK_DATABASE_PATH = ":memory:";

const require = createRequire(`${process.cwd()}/tests/notification-realtime.test.ts`);
const clerkModuleId = require.resolve("@clerk/nextjs/server");
const originalClerkModule = require.cache[clerkModuleId];
let activeUserId: string | null = null;
require.cache[clerkModuleId] = {
  id: clerkModuleId,
  filename: clerkModuleId,
  loaded: true,
  exports: { auth: async () => ({ userId: activeUserId }) },
} as NonNullable<(typeof require.cache)[string]>;

test("notification socket tickets are signed, short-lived, and single-use", async () => {
  const previousSecret = process.env.NOTIFICATION_WS_SECRET;
  process.env.NOTIFICATION_WS_SECRET = "notification-ticket-test-secret";
  try {
    const { consumeNotificationSocketTicket, issueNotificationSocketTicket } = await import("../src/lib/server/notification-realtime.mjs");
    const now = Date.now();
    const ticket = issueNotificationSocketTicket("rider-a", now);
    assert.ok(ticket);
    assert.equal(consumeNotificationSocketTicket(ticket, now + 1), "rider-a");
    assert.equal(consumeNotificationSocketTicket(ticket, now + 2), null);
    assert.equal(consumeNotificationSocketTicket(`${ticket.slice(0, -1)}x`, now + 2), null);
    const expired = issueNotificationSocketTicket("rider-b", now - 31_000);
    assert.ok(expired);
    assert.equal(consumeNotificationSocketTicket(expired, now), null);
  } finally {
    if (previousSecret === undefined) delete process.env.NOTIFICATION_WS_SECRET;
    else process.env.NOTIFICATION_WS_SECRET = previousSecret;
  }
});

test("notification WebSocket authenticates same-origin clients and delivers only their account events", async (t) => {
  const previousSecret = process.env.NOTIFICATION_WS_SECRET;
  process.env.NOTIFICATION_WS_SECRET = "notification-websocket-test-secret";
  const { attachNotificationWebSocket } = await import("../src/lib/server/notification-websocket.mjs");
  const { issueNotificationSocketTicket } = await import("../src/lib/server/notification-realtime.mjs");
  const server = createServer();
  const sockets = attachNotificationWebSocket(server);
  let competingFrameworkUpgrades = 0;
  server.on("upgrade", () => { competingFrameworkUpgrades += 1; });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(async () => {
    sockets.close();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (previousSecret === undefined) delete process.env.NOTIFICATION_WS_SECRET;
    else process.env.NOTIFICATION_WS_SECRET = previousSecret;
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const origin = `http://127.0.0.1:${address.port}`;
  const ticket = issueNotificationSocketTicket("rider-a");
  assert.ok(ticket);
  const client = new WebSocket(`${origin}/api/notifications/socket?ticket=${encodeURIComponent(ticket)}`, { headers: { Origin: origin } });
  const received: string[] = [];
  client.on("message", (value) => received.push(value.toString()));
  const readyMessage = once(client, "message");
  await once(client, "open");
  await readyMessage;
  assert.deepEqual(JSON.parse(received[0]), { type: "ready" });
  assert.equal(competingFrameworkUpgrades, 0);

  createRideForUser("rider-b", makeRide("ride-private"));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(received.length, 1);

  const delivered = once(client, "message");
  createRideForUser("rider-a", makeRide("ride-owned"));
  const [message] = await delivered;
  const payload = JSON.parse(message.toString()) as { type: string; notification: { rideId: string; title: string; message: string; read: boolean } };
  assert.equal(payload.type, "notification");
  assert.equal(payload.notification.rideId, "ride-owned");
  assert.equal(payload.notification.title, "Ride request saved");
  assert.equal(payload.notification.message, "Dwaraka Nagar to Ramakrishna Beach");
  assert.equal(payload.notification.read, false);

  const replay = new WebSocket(`${origin}/api/notifications/socket?ticket=${encodeURIComponent(ticket)}`, { headers: { Origin: origin } });
  const replayError = once(replay, "error");
  const [error] = await replayError;
  assert.match(String((error as Error).message), /401|Unexpected server response/);

  const foreignTicket = issueNotificationSocketTicket("rider-a");
  assert.ok(foreignTicket);
  const foreign = new WebSocket(`${origin}/api/notifications/socket?ticket=${encodeURIComponent(foreignTicket)}`, { headers: { Origin: "https://attacker.example" } });
  const foreignError = once(foreign, "error");
  const [forbidden] = await foreignError;
  assert.match(String((forbidden as Error).message), /403|Unexpected server response/);
  client.close();
  await once(client, "close");
});

test("push subscription endpoints preserve account ownership and expose only the public VAPID key", async () => {
  const previousPublicKey = process.env.VAPID_PUBLIC_KEY;
  const previousPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const previousSubject = process.env.VAPID_SUBJECT;
  const previousSocketSecret = process.env.NOTIFICATION_WS_SECRET;
  process.env.NOTIFICATION_WS_SECRET = "notification-route-test-secret";
  const keys = webpush.generateVAPIDKeys();
  process.env.VAPID_PUBLIC_KEY = keys.publicKey;
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  process.env.VAPID_SUBJECT = "mailto:test@example.com";
  const { GET: getConfig } = await import("../src/app/api/notifications/push-config/route");
  const socketTicketRoute = await import("../src/app/api/notifications/socket-ticket/route");
  const subscriptionsRoute = await import("../src/app/api/notifications/push-subscriptions/route");
  const ownerId = `push-owner-${randomUUID()}`;
  const otherId = `push-other-${randomUUID()}`;
  const endpoint = `https://push.example.test/${randomUUID()}`;
  const subscription = { endpoint, keys: { p256dh: "A".repeat(80), auth: "B".repeat(24) } };
  try {
    activeUserId = null;
    assert.equal((await getConfig()).status, 401);
    assert.equal((await socketTicketRoute.POST()).status, 401);
    activeUserId = ownerId;
    const ticketResponse = await socketTicketRoute.POST();
    assert.equal(ticketResponse.status, 200);
    const ticketBody = await ticketResponse.json() as { ticket: string; expiresInSeconds: number };
    assert.ok(ticketBody.ticket);
    assert.equal(ticketBody.expiresInSeconds, 30);
    const configResponse = await getConfig();
    assert.equal(configResponse.status, 200);
    assert.deepEqual(await configResponse.json(), { enabled: true, publicKey: keys.publicKey });
    assert.match(configResponse.headers.get("Cache-Control") ?? "", /private.*no-store/);
    assert.equal((await subscriptionsRoute.POST(new Request("http://localhost/api/notifications/push-subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) }))).status, 201);
    activeUserId = otherId;
    const conflict = await subscriptionsRoute.POST(new Request("http://localhost/api/notifications/push-subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) }));
    assert.equal(conflict.status, 409);
    assert.equal((await subscriptionsRoute.DELETE(new Request("http://localhost/api/notifications/push-subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) }))).status, 200);
    assert.equal(listNotificationPushSubscriptionsForUser(ownerId).length, 1);
    activeUserId = ownerId;
    await subscriptionsRoute.DELETE(new Request("http://localhost/api/notifications/push-subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint }) }));
    assert.equal(listNotificationPushSubscriptionsForUser(ownerId).length, 0);
    assert.equal((await subscriptionsRoute.POST(new Request("http://localhost/api/notifications/push-subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...subscription, endpoint: "http://not-https.example/sub" }) }))).status, 400);
  } finally {
    activeUserId = null;
    restorePushConfig(previousPublicKey, "VAPID_PUBLIC_KEY");
    restorePushConfig(previousPrivateKey, "VAPID_PRIVATE_KEY");
    restorePushConfig(previousSubject, "VAPID_SUBJECT");
    restorePushConfig(previousSocketSecret, "NOTIFICATION_WS_SECRET");
  }
});

function makeRide(id: string): SavedRideRequest {
  return {
    id,
    createdAt: new Date().toISOString(),
    pickup: VIZAG_LOCATIONS[0],
    dropoff: VIZAG_LOCATIONS[2],
    distanceKm: 3,
    fare: 100,
    category: "mini",
    status: "requested",
  };
}

function restorePushConfig(value: string | undefined, key: string) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

after(() => {
  if (originalClerkModule) require.cache[clerkModuleId] = originalClerkModule;
  else delete require.cache[clerkModuleId];
});
