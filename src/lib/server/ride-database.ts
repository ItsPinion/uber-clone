import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import Database from "better-sqlite3";
import { and, count, desc, eq, isNull, not, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { SavedRideRequest } from "@/lib/ride";
import { rideNotifications, rides } from "@/lib/server/schema";

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
  return getDatabase().transaction((transaction) => {
    transaction.insert(rides).values({
      id: ride.id,
      userId,
      createdAt: ride.createdAt,
      status: ride.status,
      payload: JSON.stringify(ride),
    }).run();
    transaction.insert(rideNotifications).values(notificationValues(userId, ride.id, {
      title: "Ride request saved",
      message: `${ride.pickup.name} to ${ride.dropoff.name}`,
    })).run();
    return true;
  });
}

export function updateRideForUser(
  userId: string,
  ride: SavedRideRequest,
  expectedStatus: SavedRideRequest["status"],
  notification?: RideNotificationDraft | null,
) {
  return getDatabase().transaction((transaction) => {
    const result = transaction
      .update(rides)
      .set({ createdAt: ride.createdAt, status: ride.status, payload: JSON.stringify(ride) })
      .where(and(eq(rides.userId, userId), eq(rides.id, ride.id), eq(rides.status, expectedStatus)))
      .run();
    if (result.changes !== 1) return false;
    if (notification) transaction.insert(rideNotifications).values(notificationValues(userId, ride.id, notification)).run();
    return true;
  });
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
  return getDatabase().transaction((transaction) => {
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
    if (notification) transaction.insert(rideNotifications).values(notificationValues(ownerUserId, ride.id, notification)).run();
    return true;
  });
}

export function listRideNotificationsForUser(userId: string) {
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
    .where(eq(rideNotifications.userId, userId))
    .orderBy(desc(rideNotifications.createdAt))
    .limit(50)
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
