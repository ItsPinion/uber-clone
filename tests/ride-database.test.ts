import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { VIZAG_LOCATIONS, type SavedRideRequest } from "../src/lib/ride";
import {
  checkRideDatabaseReady,
  createRideForUser,
  findRideForUser,
  findRideOfferForDriver,
  listRidesForDriver,
  listRidesForUser,
  transitionRideForDriver,
  updateRideForUser,
} from "../src/lib/server/ride-database";

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

test("driver queue is shared, excludes a driver's own requests, and claims rides once", () => {
  const riderId = randomUUID();
  const driverId = randomUUID();
  const otherDriverId = randomUUID();
  const riderRide = makeRide();
  const driverRide = makeRide();
  createRideForUser(riderId, riderRide);
  createRideForUser(driverId, driverRide);

  const driverOffers = listRidesForDriver(driverId).map((ride) => ride.id);
  assert.ok(driverOffers.includes(riderRide.id));
  assert.ok(!driverOffers.includes(driverRide.id));
  assert.equal(findRideOfferForDriver(driverId, driverRide.id), null);

  const acceptedRide = {
    ...riderRide,
    status: "accepted" as const,
    driver: { name: "Demo Driver", vehicle: "Demo sedan", plate: "DEMO", pickupEtaMinutes: 5 },
  };
  assert.equal(transitionRideForDriver(driverId, acceptedRide, "requested"), true);
  assert.equal(transitionRideForDriver(otherDriverId, acceptedRide, "requested"), false);
  assert.equal(findRideOfferForDriver(otherDriverId, riderRide.id), null);
  assert.ok(!listRidesForDriver(otherDriverId).some((ride) => ride.id === riderRide.id));

  const startedRide = { ...acceptedRide, status: "in_progress" as const };
  assert.equal(transitionRideForDriver(driverId, startedRide, "accepted"), true);
  const completedRide = { ...startedRide, status: "completed" as const };
  assert.equal(transitionRideForDriver(driverId, completedRide, "in_progress"), true);
  assert.equal(findRideForUser(riderId, riderRide.id)?.status, "completed");
  const driverRides = listRidesForDriver(driverId);
  assert.equal(driverRides.find((ride) => ride.id === riderRide.id)?.status, "completed");
  assert.ok(!driverRides.some((ride) => ride.id === driverRide.id));
});

test("SQLite updates only the matching user's ride", () => {
  const ownerId = randomUUID();
  const otherUserId = randomUUID();
  const ride = makeRide();
  createRideForUser(ownerId, ride);

  const completedRide = { ...ride, status: "completed" as const };
  assert.equal(updateRideForUser(otherUserId, completedRide, "requested"), false);
  assert.equal(findRideForUser(ownerId, ride.id)?.status, "requested");
  assert.equal(updateRideForUser(ownerId, completedRide, "requested"), true);
  assert.equal(findRideForUser(ownerId, ride.id)?.status, "completed");
});
