import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import Database from "better-sqlite3";
import type { SavedRideRequest } from "@/lib/ride";

type RideRow = {
  id: string;
  user_id: string;
  created_at: string;
  status: string;
  payload: string;
};

type DatabaseGlobal = typeof globalThis & { cabbookRideDatabase?: Database.Database };
const databaseGlobal = globalThis as DatabaseGlobal;

function getDatabase() {
  if (databaseGlobal.cabbookRideDatabase) return databaseGlobal.cabbookRideDatabase;

  const databasePath = process.env.CABBOOK_DATABASE_PATH ?? join(process.cwd(), "data", "cabbook.sqlite");
  if (databasePath !== ":memory:") mkdirSync(dirname(databasePath), { recursive: true });

  const database = new Database(databasePath);
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS rides (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      status TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS rides_user_created_idx ON rides (user_id, created_at DESC);
  `);

  databaseGlobal.cabbookRideDatabase = database;
  return database;
}

function hydrateRide(row: RideRow): SavedRideRequest {
  return JSON.parse(row.payload) as SavedRideRequest;
}

export function listRidesForUser(userId: string) {
  const rows = getDatabase()
    .prepare("SELECT id, user_id, created_at, status, payload FROM rides WHERE user_id = ? ORDER BY created_at DESC LIMIT 100")
    .all(userId) as unknown as RideRow[];
  return rows.map(hydrateRide);
}

export function findRideForUser(userId: string, rideId: string) {
  const row = getDatabase()
    .prepare("SELECT id, user_id, created_at, status, payload FROM rides WHERE user_id = ? AND id = ?")
    .get(userId, rideId) as RideRow | undefined;
  return row ? hydrateRide(row) : null;
}

export function createRideForUser(userId: string, ride: SavedRideRequest) {
  const result = getDatabase()
    .prepare("INSERT INTO rides (id, user_id, created_at, status, payload) VALUES (?, ?, ?, ?, ?)")
    .run(ride.id, userId, ride.createdAt, ride.status, JSON.stringify(ride));
  return Number(result.changes) === 1;
}

export function updateRideForUser(userId: string, ride: SavedRideRequest) {
  const result = getDatabase()
    .prepare("UPDATE rides SET created_at = ?, status = ?, payload = ? WHERE user_id = ? AND id = ?")
    .run(ride.createdAt, ride.status, JSON.stringify(ride), userId, ride.id);
  return Number(result.changes) === 1;
}
