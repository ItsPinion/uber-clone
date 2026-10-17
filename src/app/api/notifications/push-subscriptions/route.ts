import { auth } from "@clerk/nextjs/server";
import { getVapidConfiguration } from "@/lib/server/push-config";
import {
  deleteNotificationPushSubscriptionForUser,
  saveNotificationPushSubscriptionForUser,
  type NotificationPushSubscriptionInput,
} from "@/lib/server/ride-database";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

function isSubscription(value: unknown): value is NotificationPushSubscriptionInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const subscription = value as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  if (typeof subscription.endpoint !== "string" || subscription.endpoint.length > 2048) return false;
  try {
    const endpoint = new URL(subscription.endpoint);
    if (endpoint.protocol !== "https:" || !endpoint.hostname) return false;
  } catch {
    return false;
  }
  if (typeof subscription.keys !== "object" || subscription.keys === null) return false;
  return typeof subscription.keys.p256dh === "string"
    && /^[A-Za-z0-9_-]{32,256}$/.test(subscription.keys.p256dh)
    && typeof subscription.keys.auth === "string"
    && /^[A-Za-z0-9_-]{16,128}$/.test(subscription.keys.auth);
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to enable push notifications." }, { status: 401, ...noStore });
  if (!getVapidConfiguration()) {
    return Response.json({ error: "Push notifications are not configured on this server." }, { status: 503, ...noStore });
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send a valid push subscription." }, { status: 400, ...noStore }); }
  if (!isSubscription(body)) return Response.json({ error: "The push subscription is invalid." }, { status: 400, ...noStore });
  try {
    const saved = saveNotificationPushSubscriptionForUser(userId, body);
    if (!saved) return Response.json({ error: "This push endpoint belongs to another account." }, { status: 409, ...noStore });
    return Response.json({ ok: true }, { status: 201, ...noStore });
  } catch {
    return Response.json({ error: "Could not save this push subscription." }, { status: 500, ...noStore });
  }
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to disable push notifications." }, { status: 401, ...noStore });
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Send the push endpoint to remove." }, { status: 400, ...noStore }); }
  if (typeof body !== "object" || body === null || Array.isArray(body)
    || typeof (body as { endpoint?: unknown }).endpoint !== "string"
    || (body as { endpoint: string }).endpoint.length > 2048) {
    return Response.json({ error: "The push endpoint is invalid." }, { status: 400, ...noStore });
  }
  try {
    deleteNotificationPushSubscriptionForUser(userId, (body as { endpoint: string }).endpoint);
    return Response.json({ ok: true }, noStore);
  } catch {
    return Response.json({ error: "Could not remove this push subscription." }, { status: 500, ...noStore });
  }
}
