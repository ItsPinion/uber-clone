import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateDistanceKm,
  DEMO_DRIVER_LOCATION,
  estimateFare,
  formatRupees,
  rankRideOffers,
  VIZAG_LOCATIONS,
  type SavedRideRequest,
} from "../src/lib/ride";

test("distance estimates are positive, symmetric, and stable for identical stops", () => {
  const dwaraka = VIZAG_LOCATIONS.find((location) => location.id === "dwaraka");
  const airport = VIZAG_LOCATIONS.find((location) => location.id === "airport");
  assert.ok(dwaraka);
  assert.ok(airport);

  assert.equal(calculateDistanceKm(dwaraka, dwaraka), 1);
  assert.equal(calculateDistanceKm(dwaraka, airport), calculateDistanceKm(airport, dwaraka));
  assert.ok(calculateDistanceKm(dwaraka, airport) > 1);
});

test("fare estimates apply category pricing and round up to the next ten rupees", () => {
  assert.equal(estimateFare(0, "mini"), 50);
  assert.equal(estimateFare(3, "mini"), 90);
  assert.equal(estimateFare(3, "comfort"), 130);
  assert.equal(estimateFare(3, "xl"), 200);
});

test("rupee formatting uses Indian currency conventions", () => {
  assert.equal(formatRupees(1250), "₹1,250");
});

test("driver offers contain only requested rides and are ranked by pickup distance", () => {
  const dwaraka = VIZAG_LOCATIONS.find((location) => location.id === "dwaraka");
  const airport = VIZAG_LOCATIONS.find((location) => location.id === "airport");
  const beach = VIZAG_LOCATIONS.find((location) => location.id === "rk-beach");
  assert.ok(dwaraka);
  assert.ok(airport);
  assert.ok(beach);

  const rides: SavedRideRequest[] = [
    { id: "far", createdAt: "2026-10-16T00:00:00.000Z", pickup: airport, dropoff: beach, distanceKm: 10, fare: 200, category: "mini", status: "requested" },
    { id: "near", createdAt: "2026-10-16T00:00:00.000Z", pickup: dwaraka, dropoff: beach, distanceKm: 4, fare: 100, category: "mini", status: "requested" },
    { id: "done", createdAt: "2026-10-16T00:00:00.000Z", pickup: dwaraka, dropoff: beach, distanceKm: 4, fare: 100, category: "mini", status: "completed" },
  ];

  const offers = rankRideOffers(rides, DEMO_DRIVER_LOCATION);
  assert.deepEqual(offers.map(({ ride }) => ride.id), ["near", "far"]);
  assert.ok(offers.every((offer) => offer.pickupEtaMinutes >= 3));
});
