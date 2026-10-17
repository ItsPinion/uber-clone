import { auth } from "@clerk/nextjs/server";
import { calculateDistanceKm, DEMO_DRIVER_LOCATION, type DemoDriver, type RideReview, type RideStatus } from "@/lib/ride";
import { findRideForUser, updateRideForUser } from "@/lib/server/ride-database";

type RouteContext = { params: Promise<{ rideId: string }> };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nextRideForAction(ride: NonNullable<ReturnType<typeof findRideForUser>>, body: Record<string, unknown>) {
  const action = body.action;
  const transitions: Partial<Record<string, { from: RideStatus; to: RideStatus }>> = {
    cancel: { from: "requested", to: "cancelled" },
  };

  if (action === "review") {
    if (ride.status !== "completed") return { error: "Only completed rides can be reviewed.", status: 409 };
    if (ride.review) return { error: "This ride already has a review.", status: 409 };
    if (!Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5) {
      return { error: "Choose a rating from 1 to 5 stars.", status: 400 };
    }
    if (typeof body.comment !== "string" || body.comment.length > 500) {
      return { error: "Review notes must be 500 characters or fewer.", status: 400 };
    }
    const review: RideReview = {
      rating: Number(body.rating),
      comment: body.comment.trim(),
      createdAt: new Date().toISOString(),
    };
    return { ride: { ...ride, review } };
  }

  if (typeof action !== "string" || !transitions[action]) {
    return { error: "Choose a supported rider action.", status: 400 };
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

  return { ride: { ...ride, status: transition.to, ...(driver ? { driver } : {}) } };
}

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to update this ride." }, { status: 401 });

  const { rideId } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON ride action." }, { status: 400 });
  }
  if (!isRecord(body)) return Response.json({ error: "Send a ride action." }, { status: 400 });

  try {
    const ride = findRideForUser(userId, rideId);
    if (!ride) return Response.json({ error: "Ride not found." }, { status: 404 });

    const result = nextRideForAction(ride, body);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    if (!updateRideForUser(userId, result.ride, ride.status)) {
      return Response.json({ error: "Ride update was not saved." }, { status: 409 });
    }
    return Response.json({ ride: result.ride }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Could not update this ride in the local database." }, { status: 500 });
  }
}
