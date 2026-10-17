import { auth } from "@clerk/nextjs/server";
import { issueNotificationSocketTicket } from "@/lib/server/notification-realtime.mjs";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function POST() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to connect to notification updates." }, { status: 401, ...noStore });
  const ticket = issueNotificationSocketTicket(userId);
  if (!ticket) return Response.json({ error: "Live notifications are not configured." }, { status: 503, ...noStore });
  return Response.json({ ticket, expiresInSeconds: 30 }, noStore);
}
