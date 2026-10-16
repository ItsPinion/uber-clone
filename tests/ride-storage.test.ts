import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  acceptRideRequest,
  cancelRideRequest,
  completeRideRequest,
  markAllRideNotificationsRead,
  saveRideRequest,
  startRideRequest,
} from "../src/lib/ride-storage";
import { VIZAG_LOCATIONS, type DemoDriver } from "../src/lib/ride";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }

  clear() {
    this.values.clear();
  }
}

const storage = new MemoryStorage();
Object.defineProperty(globalThis, "BroadcastChannel", { configurable: true, value: undefined });
const browserEvents = new EventTarget();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: Object.assign(browserEvents, { localStorage: storage }),
});

const pickup = VIZAG_LOCATIONS.find((location) => location.id === "dwaraka");
const dropoff = VIZAG_LOCATIONS.find((location) => location.id === "rk-beach");
assert.ok(pickup);
assert.ok(dropoff);

const demoDriver: DemoDriver = {
  name: "Asha Rao",
  vehicle: "CabBook Mini · White hatchback",
  plate: "AP 31 AB 1234",
  pickupEtaMinutes: 5,
};

beforeEach(() => {
  storage.clear();
});

test("ride requests persist, follow valid lifecycle transitions, and reject invalid transitions", () => {
  const ride = saveRideRequest({
    pickup,
    dropoff,
    distanceKm: 4.2,
    fare: 110,
    category: "mini",
  });

  const savedRides = JSON.parse(storage.getItem("cabbook:ride-requests:v1") ?? "[]");
  assert.equal(savedRides[0].id, ride.id);
  assert.equal(savedRides[0].status, "requested");
  assert.equal(acceptRideRequest(ride.id, demoDriver), true);
  assert.equal(acceptRideRequest(ride.id, demoDriver), false);
  assert.equal(startRideRequest(ride.id), true);
  assert.equal(completeRideRequest(ride.id), true);
  assert.equal(startRideRequest(ride.id), false);

  const finalRides = JSON.parse(storage.getItem("cabbook:ride-requests:v1") ?? "[]");
  assert.equal(finalRides[0].status, "completed");
  assert.deepEqual(finalRides[0].driver, demoDriver);
});

test("cancellation is limited to pending requests", () => {
  const ride = saveRideRequest({ pickup, dropoff, distanceKm: 4, fare: 100, category: "mini" });
  assert.equal(cancelRideRequest(ride.id), true);
  assert.equal(cancelRideRequest(ride.id), false);

  const savedRides = JSON.parse(storage.getItem("cabbook:ride-requests:v1") ?? "[]");
  assert.equal(savedRides[0].status, "cancelled");
});

test("ride lifecycle changes create notifications that can be marked read", () => {
  const ride = saveRideRequest({ pickup, dropoff, distanceKm: 4, fare: 100, category: "mini" });
  acceptRideRequest(ride.id, demoDriver);
  startRideRequest(ride.id);
  completeRideRequest(ride.id);

  const notifications = JSON.parse(storage.getItem("cabbook:notifications:v1") ?? "[]");
  assert.equal(notifications.length, 4);
  assert.deepEqual(notifications.map((notice: { read: boolean }) => notice.read), [false, false, false, false]);

  markAllRideNotificationsRead();
  const readNotifications = JSON.parse(storage.getItem("cabbook:notifications:v1") ?? "[]");
  assert.ok(readNotifications.every((notice: { read: boolean }) => notice.read));
});
