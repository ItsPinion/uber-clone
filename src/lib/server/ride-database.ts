import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import Database from "better-sqlite3";
import { and, desc, eq, isNull, not, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { SavedRideRequest } from "@/lib/ride";
import { rides } from "@/lib/server/schema";

type ServerDatabase = ReturnType<typeof drizzle>;
type DatabaseGlobal = typeof globalThis & { cabbookRideDatabase?: ServerDatabase };
const databaseGlobal = globalThis as DatabaseGlobal;

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
  getDatabase().insert(rides).values({
    id: ride.id,
    userId,
    createdAt: ride.createdAt,
    status: ride.status,
    payload: JSON.stringify(ride),
  }).run();
  return true;
}

export function updateRideForUser(userId: string, ride: SavedRideRequest, expectedStatus: SavedRideRequest["status"]) {
  const result = getDatabase()
    .update(rides)
    .set({ createdAt: ride.createdAt, status: ride.status, payload: JSON.stringify(ride) })
    .where(and(eq(rides.userId, userId), eq(rides.id, ride.id), eq(rides.status, expectedStatus)))
    .run();
  return result.changes === 1;
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
    .select({ payload: rides.payload })
    .from(rides)
    .where(and(
      eq(rides.id, rideId),
      or(
        and(eq(rides.status, "requested"), not(eq(rides.userId, driverUserId))),
        eq(rides.driverUserId, driverUserId),
      ),
    ))
    .get();
  return row ? JSON.parse(row.payload) as SavedRideRequest : null;
}

export function transitionRideForDriver(
  driverUserId: string,
  ride: SavedRideRequest,
  expectedStatus: SavedRideRequest["status"],
) {
  const assignedToDriver = expectedStatus === "requested"
    ? isNull(rides.driverUserId)
    : eq(rides.driverUserId, driverUserId);
  const result = getDatabase()
    .update(rides)
    .set({ createdAt: ride.createdAt, status: ride.status, payload: JSON.stringify(ride), driverUserId })
    .where(and(
      eq(rides.id, ride.id),
      eq(rides.status, expectedStatus),
      expectedStatus === "requested" ? not(eq(rides.userId, driverUserId)) : assignedToDriver,
      ...(expectedStatus === "requested" ? [assignedToDriver] : []),
    ))
    .run();
  return result.changes === 1;
}
