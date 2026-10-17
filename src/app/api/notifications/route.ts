import { auth } from "@clerk/nextjs/server";
import {
  countUnreadRideNotificationsForUser,
  listRideNotificationsForUser,
  markAllRideNotificationsReadForUser,
  type RideNotificationCursor,
} from "@/lib/server/ride-database";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

function parseCursor(value: string | null): RideNotificationCursor | undefined | null {
  if (!value) return undefined;
  if (value.length > 512) return null;
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
    const cursor = parsed as { createdAt?: unknown; id?: unknown };
    if (typeof cursor.createdAt !== "string" || Number.isNaN(Date.parse(cursor.createdAt))) return null;
    if (typeof cursor.id !== "string" || cursor.id.length < 1 || cursor.id.length > 100) return null;
    return { createdAt: cursor.createdAt, id: cursor.id };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to view notifications." }, { status: 401, ...noStore });
  const searchParams = new URL(request.url).searchParams;
  const filter = searchParams.get("filter") ?? "all";
  if (filter !== "all" && filter !== "unread") {
    return Response.json({ error: "Choose all or unread notifications." }, { status: 400, ...noStore });
  }
  const rawLimit = searchParams.get("limit") ?? "20";
  if (!/^[1-9][0-9]*$/.test(rawLimit) || Number(rawLimit) > 50) {
    return Response.json({ error: "Page size must be from 1 to 50." }, { status: 400, ...noStore });
  }
  const cursor = parseCursor(searchParams.get("cursor"));
  if (cursor === null) return Response.json({ error: "The notification cursor is invalid." }, { status: 400, ...noStore });
  const limit = Number(rawLimit);
  try {
    const rows = listRideNotificationsForUser(userId, { unreadOnly: filter === "unread", cursor, limit });
    const hasMore = rows.length > limit;
    const notifications = hasMore ? rows.slice(0, limit) : rows;
    const lastNotification = notifications.at(-1);
    const nextCursor = hasMore && lastNotification
      ? Buffer.from(JSON.stringify({ createdAt: lastNotification.createdAt, id: lastNotification.id })).toString("base64url")
      : null;
    return Response.json({
      notifications,
      unreadCount: countUnreadRideNotificationsForUser(userId),
      nextCursor,
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
