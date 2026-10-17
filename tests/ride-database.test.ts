import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { VIZAG_LOCATIONS, type SavedRideRequest } from "../src/lib/ride";
import { checkRideDatabaseReady, createRideForUser, findRideForUser, listRidesForUser, updateRideForUser } from "../src/lib/server/ride-database";

// Keep the test database in memory; the runtime database is a git-ignored file.
process.env.CABBOOK_DATABASE_PATH = ":memory:";

function makeRide(): SavedRideRequest {
  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    pickup: VIZAG_LOCATIONS[0],
    dropoff: VIZAG_LOCATIONS[2],
    distanceKm: 3.5,
    fare: 140,
    category: "comfort",
    status: "requested",
  };
}

test("SQLite readiness check runs successfully after migrations", () => {
  assert.equal(checkRideDatabaseReady(), true);
});

test("SQLite stores ride data under its Clerk user and does not expose it to another user", () => {
  const ownerId = randomUUID();
  const otherUserId = randomUUID();
  const ride = makeRide();

  assert.equal(createRideForUser(ownerId, ride), true);
  assert.deepEqual(listRidesForUser(ownerId), [ride]);
  assert.deepEqual(listRidesForUser(otherUserId), []);
  assert.equal(findRideForUser(otherUserId, ride.id), null);
});

test("SQLite updates only the matching user's ride", () => {
  const ownerId = randomUUID();
  const otherUserId = randomUUID();
  const ride = makeRide();
  createRideForUser(ownerId, ride);

  const completedRide = { ...ride, status: "completed" as const };
  assert.equal(updateRideForUser(otherUserId, completedRide), false);
  assert.equal(findRideForUser(ownerId, ride.id)?.status, "requested");
  assert.equal(updateRideForUser(ownerId, completedRide), true);
  assert.equal(findRideForUser(ownerId, ride.id)?.status, "completed");
});
