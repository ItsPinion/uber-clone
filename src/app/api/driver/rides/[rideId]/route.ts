import { auth } from "@clerk/nextjs/server";
import { calculateDistanceKm, DEMO_DRIVER_LOCATION, type DemoDriver, type RideStatus, type SavedRideRequest } from "@/lib/ride";
import { isDriverUser } from "@/lib/server/driver-access";
import { findRideOfferForDriver, transitionRideForDriver } from "@/lib/server/ride-database";

type RouteContext = { params: Promise<{ rideId: string }> };
const noStore = { headers: { "Cache-Control": "private, no-store" } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nextRideForAction(ride: SavedRideRequest, body: Record<string, unknown>) {
  const transitions: Partial<Record<string, { from: RideStatus; to: RideStatus }>> = {
    accept: { from: "requested", to: "accepted" },
    decline: { from: "requested", to: "declined" },
    start: { from: "accepted", to: "in_progress" },
    complete: { from: "in_progress", to: "completed" },
  };
  const action = body.action;
  if (typeof action !== "string" || !transitions[action]) {
    return { error: "Choose a supported driver action.", status: 400 };
  }
  const transition = transitions[action];
  if (!transition || ride.status !== transition.from) {
    return { error: "That action is not valid for the current ride status.", status: 409 };
  }

  let driver: DemoDriver | undefined;
  if (action === "accept") {
    const distance = calculateDistanceKm(DEMO_DRIVER_LOCATION, ride.pickup);
    driver = {
      name: "CabBook Demo Driver",
      vehicle: "Emerald sedan · 2024",
      plate: "DEMO · AP 31",
      pickupEtaMinutes: Math.max(3, Math.ceil(distance * 3 + 2)),
    };
  }
  const notification = action === "accept"
    ? { title: "Driver matched", message: `${driver?.name ?? "A driver"} accepted your ride request.` }
    : action === "decline"
      ? { title: "Request passed on", message: "A demo driver passed on your ride request." }
      : action === "start"
        ? { title: "Ride started", message: "Your demo trip is now in progress." }
        : { title: "Ride completed", message: "Your demo trip is complete. Thanks for riding with CabBook." };
  return {
    ride: { ...ride, status: transition.to, ...(driver ? { driver } : {}) },
    expectedStatus: transition.from,
    notification,
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to update a driver ride." }, { status: 401, ...noStore });
  if (!isDriverUser(userId)) return Response.json({ error: "Driver access is not enabled for this account." }, { status: 403, ...noStore });

  const { rideId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON driver action." }, { status: 400, ...noStore });
  }
  if (!isRecord(body)) return Response.json({ error: "Send a driver action." }, { status: 400, ...noStore });

  try {
    const rideRecord = findRideOfferForDriver(userId, rideId);
    if (!rideRecord) return Response.json({ error: "Ride offer not found." }, { status: 404, ...noStore });
    const result = nextRideForAction(rideRecord.ride, body);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status, ...noStore });
    if (!transitionRideForDriver(userId, rideRecord.ownerUserId, result.ride, result.expectedStatus, result.notification)) {
      return Response.json({ error: "This ride offer was already updated. Refresh your list." }, { status: 409, ...noStore });
    }
    return Response.json({ ride: result.ride }, noStore);
  } catch {
    return Response.json({ error: "Could not update this ride in the local database." }, { status: 500, ...noStore });
  }
}
