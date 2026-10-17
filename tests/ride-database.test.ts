import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { VIZAG_LOCATIONS, type SavedRideRequest } from "../src/lib/ride";
import {
  checkRideDatabaseReady,
  createRideForUser,
  findRideForUser,
  findRideOfferForDriver,
  listRideNotificationsForUser,
  listRidesForDriver,
  listRidesForUser,
  countUnreadRideNotificationsForUser,
  markAllRideNotificationsReadForUser,
  markRideNotificationReadForUser,
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
  const initialNotifications = listRideNotificationsForUser(ownerId);
  assert.equal(initialNotifications.length, 1);
  assert.equal(initialNotifications[0].title, "Ride request saved");
  assert.equal(initialNotifications[0].read, false);
  assert.equal(listRideNotificationsForUser(otherUserId).some((notification) => notification.rideId === ride.id), false);
  assert.deepEqual(listRidesForUser(otherUserId), []);
  assert.equal(findRideForUser(otherUserId, ride.id), null);
});

test("notification pages use stable descending cursors and unread filtering", () => {
  const ownerId = randomUUID();
  for (let index = 0; index < 3; index++) createRideForUser(ownerId, makeRide());
  const firstPage = listRideNotificationsForUser(ownerId, { limit: 1 });
  assert.equal(firstPage.length, 2, "one extra row signals that another page exists");
  const cursor = { createdAt: firstPage[0].createdAt, id: firstPage[0].id };
  const secondPage = listRideNotificationsForUser(ownerId, { limit: 1, cursor });
  assert.notEqual(secondPage[0].id, firstPage[0].id);
  const allIds = [firstPage[0].id, secondPage[0].id];
  assert.equal(new Set(allIds).size, allIds.length);
  assert.equal(listRideNotificationsForUser(ownerId, { unreadOnly: true }).length, 3);
  markRideNotificationReadForUser(ownerId, firstPage[0].id);
  assert.equal(listRideNotificationsForUser(ownerId, { unreadOnly: true }).length, 2);
});

test("notification read actions are private to their owning account", () => {
  const ownerId = randomUUID();
  const otherUserId = randomUUID();
  createRideForUser(ownerId, makeRide());
  createRideForUser(otherUserId, makeRide());
  const ownerNotification = listRideNotificationsForUser(ownerId)[0];
  const otherNotification = listRideNotificationsForUser(otherUserId)[0];

  assert.equal(markRideNotificationReadForUser(ownerId, otherNotification.id), false);
  assert.equal(markAllRideNotificationsReadForUser(ownerId), 1);
  assert.equal(countUnreadRideNotificationsForUser(ownerId), 0);
  assert.equal(countUnreadRideNotificationsForUser(otherUserId), 1);
  assert.equal(markRideNotificationReadForUser(ownerId, ownerNotification.id), true);
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
  assert.equal(transitionRideForDriver(driverId, riderId, acceptedRide, "requested", { title: "Driver matched", message: "Driver assigned." }), true);
  assert.equal(transitionRideForDriver(otherDriverId, riderId, acceptedRide, "requested", { title: "Driver matched", message: "Driver assigned." }), false);
  assert.equal(findRideOfferForDriver(otherDriverId, riderRide.id), null);
  assert.ok(!listRidesForDriver(otherDriverId).some((ride) => ride.id === riderRide.id));

  const startedRide = { ...acceptedRide, status: "in_progress" as const };
  assert.equal(transitionRideForDriver(driverId, riderId, startedRide, "accepted", { title: "Ride started", message: "In progress." }), true);
  const completedRide = { ...startedRide, status: "completed" as const };
  assert.equal(transitionRideForDriver(driverId, riderId, completedRide, "in_progress", { title: "Ride completed", message: "Complete." }), true);
  assert.equal(findRideForUser(riderId, riderRide.id)?.status, "completed");
  const rideNotifications = listRideNotificationsForUser(riderId).filter((notification) => notification.rideId === riderRide.id);
  assert.deepEqual(rideNotifications.map((notification) => notification.title), ["Ride completed", "Ride started", "Driver matched", "Ride request saved"]);
  assert.equal(countUnreadRideNotificationsForUser(riderId), rideNotifications.length);
  assert.equal(markRideNotificationReadForUser(riderId, rideNotifications[0].id), true);
  assert.equal(markRideNotificationReadForUser(otherDriverId, rideNotifications[1].id), false);
  assert.equal(markAllRideNotificationsReadForUser(riderId), rideNotifications.length - 1);
  assert.equal(countUnreadRideNotificationsForUser(riderId), 0);
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
