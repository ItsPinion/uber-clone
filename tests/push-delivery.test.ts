import assert from "node:assert/strict";
import { createECDH, randomBytes, randomUUID } from "node:crypto";
import { test } from "node:test";
import webpush from "web-push";
import { listNotificationPushSubscriptionsForUser, saveNotificationPushSubscriptionForUser } from "../src/lib/server/ride-database";
import { deliverNotificationPush } from "../src/lib/server/notification-push-delivery";

process.env.CABBOOK_DATABASE_PATH = ":memory:";

test("Web Push delivers generic account alerts and prunes expired endpoints", async () => {
  const envKeys = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"] as const;
  const previous = envKeys.map((key) => process.env[key]);
  const vapid = webpush.generateVAPIDKeys();
  const userAgentKeys = createECDH("prime256v1");
  userAgentKeys.generateKeys();
  const p256dh = userAgentKeys.getPublicKey().toString("base64url");
  const auth = randomBytes(16).toString("base64url");
  process.env.VAPID_PUBLIC_KEY = vapid.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapid.privateKey;
  process.env.VAPID_SUBJECT = "mailto:push-test@example.com";
  const userId = `push-test-${randomUUID()}`;
  const activeEndpoint = `https://push.example.test/active-${randomUUID()}`;
  const expiredEndpoint = `https://push.example.test/expired-${randomUUID()}`;
  const activeSubscription = { endpoint: activeEndpoint, keys: { p256dh, auth } };
  const expiredSubscription = { endpoint: expiredEndpoint, keys: { p256dh: "C".repeat(80), auth: "D".repeat(24) } };
  try {
    assert.equal(saveNotificationPushSubscriptionForUser(userId, activeSubscription), true);
    assert.equal(saveNotificationPushSubscriptionForUser(userId, expiredSubscription), true);
    const deliveries: { endpoint: string; payload: string; ttl?: number }[] = [];
    await deliverNotificationPush({
      userId,
      data: { id: randomUUID(), title: "Ride started", message: "Private ride details", createdAt: new Date().toISOString() },
    }, async (subscription, payload, options) => {
      deliveries.push({ endpoint: subscription.endpoint, payload: String(payload), ttl: options?.TTL });
      if (subscription.endpoint === expiredEndpoint) throw Object.assign(new Error("gone"), { statusCode: 410 });
      return {};
    });
    assert.equal(deliveries.length, 2);
    assert.ok(deliveries.every((delivery) => delivery.ttl === 3600));
    const activePayload = JSON.parse(deliveries.find((delivery) => delivery.endpoint === activeEndpoint)!.payload) as { title: string; body: string };
    assert.equal(activePayload.title, "CabBook ride update");
    assert.equal(activePayload.body, "You have a new update. Sign in to CabBook to view it.");
    assert.equal(activePayload.body.includes("Private ride details"), false);
    const encryptedRequest = webpush.generateRequestDetails({
      endpoint: activeEndpoint,
      keys: activeSubscription.keys,
    }, JSON.stringify(activePayload), {
      TTL: 3600,
      vapidDetails: { subject: "mailto:push-test@example.com", publicKey: vapid.publicKey, privateKey: vapid.privateKey },
    });
    assert.ok(Buffer.isBuffer(encryptedRequest.body) && encryptedRequest.body.length > 0);
    assert.match(encryptedRequest.headers.Authorization, /^vapid t=/);
    assert.deepEqual(listNotificationPushSubscriptionsForUser(userId).map(({ endpoint }) => endpoint), [activeEndpoint]);
  } finally {
    envKeys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    });
  }
});
