import { auth } from "@clerk/nextjs/server";
import {
  countReadRideNotificationsForUser,
  countUnreadRideNotificationsForUser,
  deleteRideNotificationForUser,
  markRideNotificationReadForUser,
} from "@/lib/server/ride-database";

type RouteContext = { params: Promise<{ notificationId: string }> };
const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function PATCH(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to update notifications." }, { status: 401, ...noStore });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Send a valid notification action." }, { status: 400, ...noStore });
  }
  if (typeof body !== "object" || body === null || Array.isArray(body) || (body as { action?: unknown }).action !== "read") {
    return Response.json({ error: "Choose a supported notification action." }, { status: 400, ...noStore });
  }
  const { notificationId } = await context.params;
  try {
    if (!markRideNotificationReadForUser(userId, notificationId)) {
      return Response.json({ error: "Notification not found." }, { status: 404, ...noStore });
    }
    return Response.json({ ok: true }, noStore);
  } catch {
    return Response.json({ error: "Could not update this notification." }, { status: 500, ...noStore });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to remove notifications." }, { status: 401, ...noStore });
  const { notificationId } = await context.params;
  try {
    if (!deleteRideNotificationForUser(userId, notificationId)) {
      return Response.json({ error: "Notification not found." }, { status: 404, ...noStore });
    }
    return Response.json({
      ok: true,
      unreadCount: countUnreadRideNotificationsForUser(userId),
      readCount: countReadRideNotificationsForUser(userId),
    }, noStore);
  } catch {
    return Response.json({ error: "Could not remove this notification." }, { status: 500, ...noStore });
  }
}
