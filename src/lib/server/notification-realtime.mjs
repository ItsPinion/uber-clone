import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const REGISTRY_KEY = Symbol.for("cabbook.notification-realtime");
const registry = globalThis[REGISTRY_KEY] ??= { listeners: new Set(), usedTickets: new Map() };

function secret() {
  return process.env.NOTIFICATION_WS_SECRET || process.env.CLERK_SECRET_KEY || "";
}

function sign(payload) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueNotificationSocketTicket(userId, now = Date.now()) {
  if (!userId || !secret()) return null;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: now + 30_000, nonce: randomUUID() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function consumeNotificationSocketTicket(ticket, now = Date.now()) {
  if (!ticket || typeof ticket !== "string" || ticket.length > 2048 || !secret()) return null;
  const separator = ticket.lastIndexOf(".");
  if (separator < 1) return null;
  const payload = ticket.slice(0, separator);
  const suppliedSignature = Buffer.from(ticket.slice(separator + 1), "base64url");
  const expectedSignature = Buffer.from(sign(payload), "base64url");
  if (suppliedSignature.length !== expectedSignature.length || !timingSafeEqual(suppliedSignature, expectedSignature)) return null;
  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof claims.userId !== "string" || !claims.userId || typeof claims.nonce !== "string" || !claims.nonce) return null;
  if (typeof claims.expiresAt !== "number" || claims.expiresAt <= now || claims.expiresAt > now + 30_000) return null;
  for (const [nonce, expiry] of registry.usedTickets) if (expiry <= now) registry.usedTickets.delete(nonce);
  if (registry.usedTickets.has(claims.nonce)) return null;
  registry.usedTickets.set(claims.nonce, claims.expiresAt);
  return claims.userId;
}

export function subscribeNotificationEvents(listener) {
  registry.listeners.add(listener);
  return () => registry.listeners.delete(listener);
}

export function publishNotificationEvent(notification) {
  for (const listener of registry.listeners) {
    try { listener(notification); } catch { /* Delivery failures must not roll back a saved ride. */ }
  }
}
