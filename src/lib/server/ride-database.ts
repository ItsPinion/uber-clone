import { join } from "node:path";
import Database from "better-sqlite3";
import { and, desc, eq } from "drizzle-orm";
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
  const sqlite = new Database(configuredPath);
  const database = drizzle(sqlite);
  migrate(database, { migrationsFolder: join(process.cwd(), "drizzle") });
  databaseGlobal.cabbookRideDatabase = database;
  return database;
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

export function updateRideForUser(userId: string, ride: SavedRideRequest) {
  const result = getDatabase()
    .update(rides)
    .set({ createdAt: ride.createdAt, status: ride.status, payload: JSON.stringify(ride) })
    .where(and(eq(rides.userId, userId), eq(rides.id, ride.id)))
    .run();
  return result.changes === 1;
}
