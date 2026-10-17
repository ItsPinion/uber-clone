import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import Database from "better-sqlite3";
import { and, count, desc, eq, isNotNull, isNull, lt, not, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { SavedRideRequest } from "@/lib/ride";
import { notificationPushSubscriptions, rideNotifications, rides } from "@/lib/server/schema";
import { publishNotificationEvent } from "@/lib/server/notification-realtime.mjs";

type ServerDatabase = ReturnType<typeof drizzle>;
type DatabaseGlobal = typeof globalThis & { cabbookRideDatabase?: ServerDatabase };
const databaseGlobal = globalThis as DatabaseGlobal;

type RideNotificationDraft = { title: string; message: string };

function notificationValues(userId: string, rideId: string, notification: RideNotificationDraft) {
  return {
    id: randomUUID(),
    userId,
    rideId,
    title: notification.title,
    message: notification.message,
    createdAt: new Date().toISOString(),
    readAt: null,
  };
}

function dispatchRideNotification(userId: string, notice: ReturnType<typeof notificationValues>) {
  const event = {
    userId,
    data: { id: notice.id, rideId: notice.rideId, title: notice.title, message: notice.message, createdAt: notice.createdAt, read: false },
  };
  publishNotificationEvent(event);
  void import("./notification-push-delivery")
    .then(({ deliverNotificationPush }) => deliverNotificationPush(event))
    .catch(() => undefined);
}

function getDatabase() {
  if (databaseGlobal.cabbookRideDatabase) return databaseGlobal.cabbookRideDatabase;

  const configuredPath = process.env.CABBOOK_DATABASE_PATH ?? "./data/cabbook.sqlite";
  if (configuredPath !== ":memory:") {
    mkdirSync(dirname(resolve(/* turbopackIgnore: true */ configuredPath)), { recursive: true });
  }
  const sqlite = new Database(configuredPath);
  const database = drizzle(sqlite);
  migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
  databaseGlobal.cabbookRideDatabase = database;
  return database;
}

export function checkRideDatabaseReady() {
  getDatabase().select({ id: rides.id }).from(rides).limit(1).all();
  return true;
}

export function listRidesForUser(userId: string) {
  return getDatabase()
    .select({ payload: rides.payload })
    .from(rides)
    .where(eq(rides.userId, userId))
    .orderBy(desc(rides.createdAt))
    .limit(100)
    .all()
    .map((row) => JSON.parse(row.payload) as SavedRideRequest);
}

export function findRideForUser(userId: string, rideId: string) {
  const row = getDatabase()
    .select({ payload: rides.payload })
    .from(rides)
    .where(and(eq(rides.userId, userId), eq(rides.id, rideId)))
    .get();
  return row ? JSON.parse(row.payload) as SavedRideRequest : null;
}

export function createRideForUser(userId: string, ride: SavedRideRequest) {
  const notification = notificationValues(userId, ride.id, {
    title: "Ride request saved",
    message: `${ride.pickup.name} to ${ride.dropoff.name}`,
  });
  const created = getDatabase().transaction((transaction) => {
    transaction.insert(rides).values({
      id: ride.id,
      userId,
      createdAt: ride.createdAt,
      status: ride.status,
      payload: JSON.stringify(ride),
    }).run();
    transaction.insert(rideNotifications).values(notification).run();
    return true;
  });
  if (created) dispatchRideNotification(userId, notification);
  return created;
}

export function updateRideForUser(
  userId: string,
  ride: SavedRideRequest,
  expectedStatus: SavedRideRequest["status"],
  notification?: RideNotificationDraft | null,
) {
  const notice = notification ? notificationValues(userId, ride.id, notification) : null;
  const updated = getDatabase().transaction((transaction) => {
    const result = transaction
      .update(rides)
      .set({ createdAt: ride.createdAt, status: ride.status, payload: JSON.stringify(ride) })
      .where(and(eq(rides.userId, userId), eq(rides.id, ride.id), eq(rides.status, expectedStatus)))
      .run();
    if (result.changes !== 1) return false;
    if (notice) transaction.insert(rideNotifications).values(notice).run();
    return true;
  });
  if (updated && notice) dispatchRideNotification(userId, notice);
  return updated;
}

export function listRidesForDriver(driverUserId: string) {
  return getDatabase()
    .select({ payload: rides.payload })
    .from(rides)
    .where(or(
      and(eq(rides.status, "requested"), not(eq(rides.userId, driverUserId))),
      eq(rides.driverUserId, driverUserId),
    ))
    .orderBy(desc(rides.createdAt))
    .limit(100)
    .all()
    .map((row) => JSON.parse(row.payload) as SavedRideRequest);
}

export function findRideOfferForDriver(driverUserId: string, rideId: string) {
  const row = getDatabase()
    .select({ payload: rides.payload, ownerUserId: rides.userId })
    .from(rides)
    .where(and(
      eq(rides.id, rideId),
      or(
        and(eq(rides.status, "requested"), not(eq(rides.userId, driverUserId))),
        eq(rides.driverUserId, driverUserId),
      ),
    ))
    .get();
  return row ? { ride: JSON.parse(row.payload) as SavedRideRequest, ownerUserId: row.ownerUserId } : null;
}

export function transitionRideForDriver(
  driverUserId: string,
  ownerUserId: string,
  ride: SavedRideRequest,
  expectedStatus: SavedRideRequest["status"],
  notification?: RideNotificationDraft,
) {
  const assignedToDriver = expectedStatus === "requested"
    ? isNull(rides.driverUserId)
    : eq(rides.driverUserId, driverUserId);
  const notice = notification ? notificationValues(ownerUserId, ride.id, notification) : null;
  const updated = getDatabase().transaction((transaction) => {
    const result = transaction
      .update(rides)
      .set({ createdAt: ride.createdAt, status: ride.status, payload: JSON.stringify(ride), driverUserId })
      .where(and(
        eq(rides.id, ride.id),
        eq(rides.userId, ownerUserId),
        eq(rides.status, expectedStatus),
        expectedStatus === "requested" ? not(eq(rides.userId, driverUserId)) : assignedToDriver,
        ...(expectedStatus === "requested" ? [assignedToDriver] : []),
      ))
      .run();
    if (result.changes !== 1) return false;
    if (notice) transaction.insert(rideNotifications).values(notice).run();
    return true;
  });
  if (updated && notice) dispatchRideNotification(ownerUserId, notice);
  return updated;
}

export type RideNotificationCursor = { createdAt: string; id: string };

export function listRideNotificationsForUser(
  userId: string,
  options: { unreadOnly?: boolean; cursor?: RideNotificationCursor; limit?: number } = {},
) {
  const conditions = [eq(rideNotifications.userId, userId)];
  if (options.unreadOnly) conditions.push(isNull(rideNotifications.readAt));
  if (options.cursor) {
    conditions.push(or(
      lt(rideNotifications.createdAt, options.cursor.createdAt),
      and(eq(rideNotifications.createdAt, options.cursor.createdAt), lt(rideNotifications.id, options.cursor.id)),
    )!);
  }
  return getDatabase()
    .select({
      id: rideNotifications.id,
      rideId: rideNotifications.rideId,
      title: rideNotifications.title,
      message: rideNotifications.message,
      createdAt: rideNotifications.createdAt,
      readAt: rideNotifications.readAt,
    })
    .from(rideNotifications)
    .where(and(...conditions))
    .orderBy(desc(rideNotifications.createdAt), desc(rideNotifications.id))
    .limit(Math.min(options.limit ?? 50, 51) + 1)
    .all()
    .map((notification) => ({ ...notification, read: notification.readAt !== null }));
}

export function countUnreadRideNotificationsForUser(userId: string) {
  const result = getDatabase()
    .select({ value: count() })
    .from(rideNotifications)
    .where(and(eq(rideNotifications.userId, userId), isNull(rideNotifications.readAt)))
    .get();
  return Number(result?.value ?? 0);
}

export function countReadRideNotificationsForUser(userId: string) {
  const result = getDatabase()
    .select({ value: count() })
    .from(rideNotifications)
    .where(and(eq(rideNotifications.userId, userId), isNotNull(rideNotifications.readAt)))
    .get();
  return Number(result?.value ?? 0);
}

export function deleteRideNotificationForUser(userId: string, notificationId: string) {
  return getDatabase()
    .delete(rideNotifications)
    .where(and(eq(rideNotifications.userId, userId), eq(rideNotifications.id, notificationId)))
    .run()
    .changes === 1;
}

export function deleteReadRideNotificationsForUser(userId: string) {
  return getDatabase()
    .delete(rideNotifications)
    .where(and(eq(rideNotifications.userId, userId), isNotNull(rideNotifications.readAt)))
    .run()
    .changes;
}

export type NotificationPushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export function saveNotificationPushSubscriptionForUser(userId: string, subscription: NotificationPushSubscriptionInput) {
  const database = getDatabase();
  const existing = database
    .select({ userId: notificationPushSubscriptions.userId })
    .from(notificationPushSubscriptions)
    .where(eq(notificationPushSubscriptions.endpoint, subscription.endpoint))
    .get();
  if (existing && existing.userId !== userId) return false;
  if (existing) {
    database.update(notificationPushSubscriptions)
      .set({ p256dh: subscription.keys.p256dh, auth: subscription.keys.auth })
      .where(and(eq(notificationPushSubscriptions.endpoint, subscription.endpoint), eq(notificationPushSubscriptions.userId, userId)))
      .run();
    return true;
  }
  database.insert(notificationPushSubscriptions).values({
    endpoint: subscription.endpoint,
    userId,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    createdAt: new Date().toISOString(),
  }).run();
  return true;
}

export function listNotificationPushSubscriptionsForUser(userId: string) {
  return getDatabase()
    .select({ endpoint: notificationPushSubscriptions.endpoint, p256dh: notificationPushSubscriptions.p256dh, auth: notificationPushSubscriptions.auth })
    .from(notificationPushSubscriptions)
    .where(eq(notificationPushSubscriptions.userId, userId))
    .all();
}

export function deleteNotificationPushSubscriptionForUser(userId: string, endpoint: string) {
  return getDatabase().delete(notificationPushSubscriptions)
    .where(and(eq(notificationPushSubscriptions.userId, userId), eq(notificationPushSubscriptions.endpoint, endpoint)))
    .run().changes === 1;
}

export function deleteNotificationPushSubscriptionByEndpoint(endpoint: string) {
  return getDatabase().delete(notificationPushSubscriptions)
    .where(eq(notificationPushSubscriptions.endpoint, endpoint))
    .run().changes === 1;
}

export function markRideNotificationReadForUser(userId: string, notificationId: string) {
  const database = getDatabase();
  const result = database
    .update(rideNotifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(rideNotifications.userId, userId), eq(rideNotifications.id, notificationId), isNull(rideNotifications.readAt)))
    .run();
  if (result.changes === 1) return true;
  return Boolean(database
    .select({ id: rideNotifications.id })
    .from(rideNotifications)
    .where(and(eq(rideNotifications.userId, userId), eq(rideNotifications.id, notificationId)))
    .get());
}

export function markAllRideNotificationsReadForUser(userId: string) {
  return getDatabase()
    .update(rideNotifications)
    .set({ readAt: new Date().toISOString() })
    .where(and(eq(rideNotifications.userId, userId), isNull(rideNotifications.readAt)))
    .run()
    .changes;
}
