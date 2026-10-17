import { auth } from "@clerk/nextjs/server";
import {
  countUnreadRideNotificationsForUser,
  listRideNotificationsForUser,
  markAllRideNotificationsReadForUser,
} from "@/lib/server/ride-database";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to view notifications." }, { status: 401, ...noStore });
  try {
    return Response.json({
      notifications: listRideNotificationsForUser(userId),
      unreadCount: countUnreadRideNotificationsForUser(userId),
    }, noStore);
  } catch {
    return Response.json({ error: "Could not load notifications." }, { status: 500, ...noStore });
  }
}

export async function PATCH(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to update notifications." }, { status: 401, ...noStore });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a valid notification action." }, { status: 400, ...noStore });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body) || (body as { action?: unknown }).action !== "read-all") {
    return Response.json({ error: "Choose a supported notification action." }, { status: 400, ...noStore });
  }
  try {
    const updated = markAllRideNotificationsReadForUser(userId);
    return Response.json({ updated, unreadCount: countUnreadRideNotificationsForUser(userId) }, noStore);
  } catch {
    return Response.json({ error: "Could not update notifications." }, { status: 500, ...noStore });
  }
}
