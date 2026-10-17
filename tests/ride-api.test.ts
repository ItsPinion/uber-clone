import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import {
  cacheServerRideRequest,
  cacheServerRideUpdate,
  requestRideFromServer,
  updateRideOnServer,
} from "../src/lib/ride-storage";
import { updateDriverRideOnServer } from "../src/lib/driver-storage";
import { calculateDistanceKm, estimateFare, VIZAG_LOCATIONS, type SavedRideRequest } from "../src/lib/ride";

process.env.CABBOOK_DATABASE_PATH = ":memory:";
let activeUserId: string | null = "rider-one";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, String(value));
  }
}

const storage = new MemoryStorage();
const browserEvents = new EventTarget();
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: Object.assign(browserEvents, { localStorage: storage }),
});
Object.defineProperty(globalThis, "BroadcastChannel", { configurable: true, value: undefined });

test("signed-in client ride flows persist through the authenticated API and remain owner-scoped", async () => {
  const auth = async () => ({ userId: activeUserId });
  const require = createRequire(`${process.cwd()}/tests/ride-api.test.ts`);
  const clerkModuleId = require.resolve("@clerk/nextjs/server");
  const originalClerkModule = require.cache[clerkModuleId];
  const originalFetch = globalThis.fetch;
  const originalDriverIds = process.env.CABBOOK_DRIVER_USER_IDS;
  process.env.CABBOOK_DRIVER_USER_IDS = "driver-one,driver-two";
  require.cache[clerkModuleId] = {
    id: clerkModuleId,
    filename: clerkModuleId,
    loaded: true,
    exports: { auth },
  } as NonNullable<(typeof require.cache)[string]>;

  try {
    const ridesRoute = await import("../src/app/api/rides/route");
    const rideRoute = await import("../src/app/api/rides/[rideId]/route");
    const driverRidesRoute = await import("../src/app/api/driver/rides/route");
    const driverRideRoute = await import("../src/app/api/driver/rides/[rideId]/route");
    const notificationsRoute = await import("../src/app/api/notifications/route");
    const notificationRoute = await import("../src/app/api/notifications/[notificationId]/route");
    globalThis.fetch = async (input, init) => {
      const requestUrl = new URL(String(input), "http://localhost");
      const request = new Request(requestUrl, init);
      if (requestUrl.pathname === "/api/rides" && request.method === "POST") return ridesRoute.POST(request);
      if (requestUrl.pathname === "/api/notifications" && request.method === "GET") return notificationsRoute.GET(request);
      if (requestUrl.pathname === "/api/notifications" && request.method === "PATCH") return notificationsRoute.PATCH(request);
      if (requestUrl.pathname === "/api/notifications" && request.method === "DELETE") return notificationsRoute.DELETE(request);
      const notificationMatch = requestUrl.pathname.match(/^\/api\/notifications\/([^/]+)$/);
      if (notificationMatch && request.method === "PATCH") {
        const notificationId = decodeURIComponent(notificationMatch[1]);
        return notificationRoute.PATCH(request, { params: Promise.resolve({ notificationId }) });
      }
      if (notificationMatch && request.method === "DELETE") {
        const notificationId = decodeURIComponent(notificationMatch[1]);
        return notificationRoute.DELETE(request, { params: Promise.resolve({ notificationId }) });
      }
      if (requestUrl.pathname === "/api/driver/rides" && request.method === "GET") return driverRidesRoute.GET();
      const driverRideMatch = requestUrl.pathname.match(/^\/api\/driver\/rides\/([^/]+)$/);
      if (driverRideMatch && request.method === "PATCH") {
        const rideId = decodeURIComponent(driverRideMatch[1]);
        return driverRideRoute.PATCH(request, { params: Promise.resolve({ rideId }) });
      }
      const rideMatch = requestUrl.pathname.match(/^\/api\/rides\/([^/]+)$/);
      if (rideMatch && request.method === "PATCH") {
        const rideId = decodeURIComponent(rideMatch[1]);
        return rideRoute.PATCH(request, { params: Promise.resolve({ rideId }) });
      }
      throw new Error(`Unexpected client API request: ${request.method} ${requestUrl.pathname}`);
    };

    const listRides = () => ridesRoute.GET();
    const listDriverRides = () => driverRidesRoute.GET();
    const create = (body: unknown) => ridesRoute.POST(new Request("http://localhost/api/rides", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
    const update = (rideId: string, body: unknown) => rideRoute.PATCH(new Request(`http://localhost/api/rides/${rideId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ rideId }) });
    const notificationRead = (notificationId: string, body: unknown = { action: "read" }) => notificationRoute.PATCH(new Request(`http://localhost/api/notifications/${notificationId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ notificationId }) });
    const notificationDelete = (notificationId: string) => notificationRoute.DELETE(new Request(`http://localhost/api/notifications/${notificationId}`, { method: "DELETE" }), { params: Promise.resolve({ notificationId }) });
    const notificationsDelete = (body: unknown) => notificationsRoute.DELETE(new Request("http://localhost/api/notifications", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
    const notificationsGet = (query = "") => notificationsRoute.GET(new Request(`http://localhost/api/notifications${query}`));
    const notificationsUpdate = (body: unknown) => notificationsRoute.PATCH(new Request("http://localhost/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }));
    const driverUpdate = (rideId: string, body: unknown) => driverRideRoute.PATCH(new Request(`http://localhost/api/driver/rides/${rideId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ rideId }) });
    const malformedDriverUpdate = (rideId: string) => driverRideRoute.PATCH(new Request(`http://localhost/api/driver/rides/${rideId}`, { method: "PATCH", body: "not-json" }), { params: Promise.resolve({ rideId }) });
    const malformedCreate = () => ridesRoute.POST(new Request("http://localhost/api/rides", { method: "POST", body: "not-json" }));
    const malformedUpdate = (rideId: string) => rideRoute.PATCH(new Request(`http://localhost/api/rides/${rideId}`, { method: "PATCH", body: "not-json" }), { params: Promise.resolve({ rideId }) });
    const json = async <T>(response: Response) => await response.json() as T;
    const pickup = VIZAG_LOCATIONS.find((location) => location.id === "dwaraka");
    const dropoff = VIZAG_LOCATIONS.find((location) => location.id === "rk-beach");
    assert.ok(pickup);
    assert.ok(dropoff);

    const listResponse = await listRides();
    assert.equal(listResponse.status, 200);
    assert.match(listResponse.headers.get("Cache-Control") ?? "", /private.*no-store/);
    assert.deepEqual(await json<{ rides: unknown[] }>(listResponse), { rides: [] });
    assert.equal((await malformedCreate()).status, 400);
    assert.equal((await create({ pickupId: pickup.id, dropoffId: pickup.id, category: "comfort" })).status, 400);
    assert.equal((await create({ pickupId: pickup.id, dropoffId: dropoff.id, category: "scooter" })).status, 400);
    activeUserId = null;
    assert.equal((await listRides()).status, 401);
    assert.equal((await notificationsGet()).status, 401);
    assert.equal((await notificationsUpdate({ action: "read-all" })).status, 401);
    assert.equal((await notificationsDelete({ action: "clear-read" })).status, 401);
    assert.equal((await notificationDelete("notices-forbidden")).status, 401);
    assert.equal((await notificationRead("notices-forbidden", { action: "read" })).status, 401);
    await assert.rejects(requestRideFromServer(pickup.id, dropoff.id, "comfort"), /Sign in to request a ride/);
    activeUserId = "rider-one";
    await assert.rejects(requestRideFromServer("unknown", dropoff.id, "comfort"), /valid, different Visakhapatnam stops/);

    const created = await requestRideFromServer(pickup.id, dropoff.id, "comfort");
    assert.equal(created.status, "requested");
    assert.equal(created.distanceKm, calculateDistanceKm(pickup, dropoff));
    assert.equal(created.fare, estimateFare(created.distanceKm, "comfort"));
    cacheServerRideRequest(created, "rider-one");
    const rideId = created.id;
    const initialNotificationResponse = await notificationsGet();
    assert.equal(initialNotificationResponse.status, 200);
    assert.match(initialNotificationResponse.headers.get("Cache-Control") ?? "", /private.*no-store/);
    const initialNotifications = await json<{ notifications: { id: string; rideId: string; title: string; read: boolean }[]; unreadCount: number; readCount: number }>(initialNotificationResponse);
    assert.equal(initialNotifications.unreadCount, 1);
    assert.equal(initialNotifications.readCount, 0);
    assert.equal(initialNotifications.notifications[0].rideId, rideId);
    assert.equal(initialNotifications.notifications[0].title, "Ride request saved");
    assert.equal(initialNotifications.notifications[0].read, false);
    assert.equal((await notificationsGet("?filter=recent")).status, 400);
    assert.equal((await notificationsGet("?limit=0")).status, 400);
    assert.equal((await notificationsGet("?limit=51")).status, 400);
    assert.equal((await notificationsGet("?cursor=not-a-cursor")).status, 400);
    assert.equal((await notificationRead(initialNotifications.notifications[0].id, { action: "archive" })).status, 400);

    activeUserId = null;
    assert.equal((await listDriverRides()).status, 401);
    assert.equal((await driverUpdate(rideId, { action: "accept" })).status, 401);
    activeUserId = "rider-two";
    assert.deepEqual(await json<{ rides: unknown[] }>(await listRides()), { rides: [] });
    assert.deepEqual(await json<{ notifications: unknown[]; unreadCount: number; readCount: number; nextCursor: string | null }>(await notificationsGet()), { notifications: [], unreadCount: 0, readCount: 0, nextCursor: null });
    assert.equal((await notificationRead(initialNotifications.notifications[0].id)).status, 404);
    assert.equal((await notificationsUpdate({ action: "delete-all" })).status, 400);
    assert.equal((await notificationsDelete({ action: "clear-all" })).status, 400);
    assert.equal((await notificationDelete(initialNotifications.notifications[0].id)).status, 404);
    await assert.rejects(updateRideOnServer(rideId, "cancel"), /Ride not found/);
    assert.equal((await listDriverRides()).status, 403);
    assert.equal((await driverUpdate(rideId, { action: "accept" })).status, 403);

    activeUserId = "rider-one";
    assert.equal((await malformedUpdate(rideId)).status, 400);
    assert.equal((await update(rideId, { action: "teleport" })).status, 400);
    assert.equal((await update(rideId, { action: "accept" })).status, 400);

    activeUserId = "driver-one";
    assert.equal((await malformedDriverUpdate(rideId)).status, 400);
    assert.equal((await driverUpdate(rideId, { action: "teleport" })).status, 400);
    assert.equal((await driverUpdate("missing-ride", { action: "accept" })).status, 404);
    const driverOwnRide = await requestRideFromServer(pickup.id, dropoff.id, "mini");
    cacheServerRideRequest(driverOwnRide, "driver-one");
    const driverOffers = await json<{ rides: SavedRideRequest[] }>(await listDriverRides());
    assert.ok(driverOffers.rides.some((ride) => ride.id === rideId));
    assert.ok(!driverOffers.rides.some((ride) => ride.id === driverOwnRide.id));
    const accepted = await updateDriverRideOnServer(rideId, "accept");
    assert.equal(accepted.status, "accepted");
    assert.equal(accepted.driver?.name, "CabBook Demo Driver");
    await assert.rejects(updateDriverRideOnServer(rideId, "accept"), /not valid for the current ride status/);

    activeUserId = "driver-two";
    const secondDriverOffers = await json<{ rides: SavedRideRequest[] }>(await listDriverRides());
    assert.ok(secondDriverOffers.rides.some((ride) => ride.id === driverOwnRide.id));
    assert.ok(!secondDriverOffers.rides.some((ride) => ride.id === rideId));
    await assert.rejects(updateDriverRideOnServer(rideId, "start"), /Ride offer not found/);

    activeUserId = "driver-one";
    const started = await updateDriverRideOnServer(rideId, "start");
    assert.equal(started.status, "in_progress");
    const completed = await updateDriverRideOnServer(rideId, "complete");
    assert.equal(completed.status, "completed");
    await assert.rejects(updateDriverRideOnServer(rideId, "complete"), /not valid for the current ride status/);
    cacheServerRideUpdate(completed, "complete", "rider-one");
    activeUserId = "rider-one";
    const lifecycleNotifications = await json<{ notifications: { id: string; rideId: string; title: string; read: boolean }[]; unreadCount: number }>(await notificationsGet());
    const thisRideNotifications = lifecycleNotifications.notifications.filter((notice) => notice.rideId === rideId);
    assert.deepEqual(thisRideNotifications.map((notice) => notice.title), ["Ride completed", "Ride started", "Driver matched", "Ride request saved"]);
    assert.equal(thisRideNotifications.every((notice) => !notice.read), true);
    assert.equal((await notificationRead(thisRideNotifications[0].id)).status, 200);
    const markedAll = await json<{ updated: number; unreadCount: number }>(await notificationsUpdate({ action: "read-all" }));
    assert.equal(markedAll.unreadCount, 0);
    assert.equal(markedAll.updated, lifecycleNotifications.unreadCount - 1);
    const clearedUnreadPage = await json<{ notifications: unknown[]; unreadCount: number; readCount: number; nextCursor: string | null }>(await notificationsGet("?filter=unread"));
    assert.deepEqual(clearedUnreadPage, { notifications: [], unreadCount: 0, readCount: 4, nextCursor: null });
    const clearedReadResponse = await notificationsDelete({ action: "clear-read" });
    assert.equal(clearedReadResponse.status, 200);
    assert.deepEqual(await json<{ ok: boolean; deleted: number; unreadCount: number; readCount: number }>(clearedReadResponse), { ok: true, deleted: 4, unreadCount: 0, readCount: 0 });
    assert.deepEqual((await json<{ notifications: unknown[] }>(await notificationsGet())).notifications, []);
    await assert.rejects(updateRideOnServer(rideId, "review", { rating: 0, comment: "invalid" }), /1 to 5 stars/);
    await assert.rejects(updateRideOnServer(rideId, "review", { rating: 5, comment: "x".repeat(501) }), /500 characters or fewer/);
    const reviewed = await updateRideOnServer(rideId, "review", { rating: 5, comment: "  Smooth ride!  " });
    assert.equal(reviewed.review?.comment, "Smooth ride!");
    cacheServerRideUpdate(reviewed, "review", "rider-one");
    await assert.rejects(updateRideOnServer(rideId, "review", { rating: 4, comment: "duplicate" }), /already has a review/);

    const history = await json<{ rides: SavedRideRequest[] }>(await listRides());
    assert.equal(history.rides.length, 1);
    assert.equal(history.rides[0].id, rideId);
    assert.equal(history.rides[0].status, "completed");
    assert.equal(history.rides[0].review?.comment, "Smooth ride!");
    const userCache = JSON.parse(storage.getItem("cabbook:ride-requests:v2:rider-one") ?? "[]") as SavedRideRequest[];
    const userNotifications = JSON.parse(storage.getItem("cabbook:notifications:v2:rider-one") ?? "[]") as { rideId: string }[];
    assert.equal(userCache[0].review?.comment, "Smooth ride!");
    assert.deepEqual(userNotifications, [], "signed-in notification records come from the persistent server API, not browser storage");

    const declinedRide = await requestRideFromServer(pickup.id, dropoff.id, "mini");
    cacheServerRideRequest(declinedRide, "rider-one");
    activeUserId = "driver-one";
    const declined = await updateDriverRideOnServer(declinedRide.id, "decline");
    assert.equal(declined.status, "declined");
    activeUserId = "rider-one";
    cacheServerRideUpdate(declined, "decline", "rider-one");

    const cancelledRide = await requestRideFromServer(pickup.id, dropoff.id, "xl");
    cacheServerRideRequest(cancelledRide, "rider-one");
    const cancelled = await updateRideOnServer(cancelledRide.id, "cancel");
    assert.equal(cancelled.status, "cancelled");
    cacheServerRideUpdate(cancelled, "cancel", "rider-one");
    const terminalNotifications = await json<{ notifications: { id: string; rideId: string; title: string }[]; unreadCount: number }>(await notificationsGet());
    assert.ok(terminalNotifications.notifications.some((notice) => notice.rideId === declinedRide.id && notice.title === "Request passed on"));
    const cancelledNotice = terminalNotifications.notifications.find((notice) => notice.rideId === cancelledRide.id && notice.title === "Ride request cancelled");
    assert.ok(cancelledNotice);
    const deletedNoticeResponse = await notificationDelete(cancelledNotice.id);
    assert.equal(deletedNoticeResponse.status, 200);
    const afterSingleDelete = await json<{ notifications: { id: string }[]; unreadCount: number }>(await notificationsGet());
    assert.equal(afterSingleDelete.unreadCount, terminalNotifications.unreadCount - 1);
    assert.equal(afterSingleDelete.notifications.some((notice) => notice.id === cancelledNotice.id), false);
    assert.equal((await notificationDelete(cancelledNotice.id)).status, 404);
    const firstPage = await json<{ notifications: { id: string; read: boolean }[]; nextCursor: string | null }>(await notificationsGet("?limit=1"));
    assert.equal(firstPage.notifications.length, 1);
    assert.ok(firstPage.nextCursor);
    const secondPage = await json<{ notifications: { id: string }[]; nextCursor: string | null }>(await notificationsGet(`?limit=1&cursor=${firstPage.nextCursor}`));
    assert.equal(secondPage.notifications.length, 1);
    assert.notEqual(secondPage.notifications[0].id, firstPage.notifications[0].id);
    const unreadPage = await json<{ notifications: { read: boolean }[] }>(await notificationsGet("?filter=unread&limit=50"));
    assert.ok(unreadPage.notifications.length > 0);
    assert.equal(unreadPage.notifications.every((notice) => !notice.read), true);
  } finally {
    activeUserId = "rider-one";
    globalThis.fetch = originalFetch;
    if (originalClerkModule) require.cache[clerkModuleId] = originalClerkModule;
    else delete require.cache[clerkModuleId];
    if (originalDriverIds === undefined) delete process.env.CABBOOK_DRIVER_USER_IDS;
    else process.env.CABBOOK_DRIVER_USER_IDS = originalDriverIds;
  }
});
