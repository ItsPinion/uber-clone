import { randomUUID } from "node:crypto";
import { auth } from "@clerk/nextjs/server";
import { calculateDistanceKm, estimateFare, VIZAG_LOCATIONS, type RideCategory, type SavedRideRequest } from "@/lib/ride";
import { createRideForUser, listRidesForUser } from "@/lib/server/ride-database";

const categories: RideCategory[] = ["mini", "comfort", "xl"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function getSignedInUserId() {
  const { userId } = await auth();
  return userId;
}

export async function GET() {
  const userId = await getSignedInUserId();
  if (!userId) return Response.json({ error: "Sign in to view ride history." }, { status: 401 });

  try {
    return Response.json({ rides: listRidesForUser(userId) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Could not load rides from the local database." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const userId = await getSignedInUserId();
  if (!userId) return Response.json({ error: "Sign in to request a ride." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a valid JSON ride request." }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.pickupId !== "string" || typeof body.dropoffId !== "string" || typeof body.category !== "string") {
    return Response.json({ error: "Choose a pickup, drop-off, and ride category." }, { status: 400 });
  }

  const pickup = VIZAG_LOCATIONS.find((location) => location.id === body.pickupId);
  const dropoff = VIZAG_LOCATIONS.find((location) => location.id === body.dropoffId);
  if (!pickup || !dropoff || pickup.id === dropoff.id || !categories.includes(body.category as RideCategory)) {
    return Response.json({ error: "Choose valid, different Visakhapatnam stops and a supported ride category." }, { status: 400 });
  }

  const category = body.category as RideCategory;
  const distanceKm = calculateDistanceKm(pickup, dropoff);
  const ride: SavedRideRequest = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    pickup,
    dropoff,
    distanceKm,
    fare: estimateFare(distanceKm, category),
    category,
    status: "requested",
  };

  try {
    createRideForUser(userId, ride);
    return Response.json({ ride }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json({ error: "Could not save this ride to the local database." }, { status: 500 });
  }
}
