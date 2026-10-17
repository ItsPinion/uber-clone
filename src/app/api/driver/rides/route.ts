import { auth } from "@clerk/nextjs/server";
import { isDriverUser } from "@/lib/server/driver-access";
import { listRidesForDriver } from "@/lib/server/ride-database";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to view driver offers." }, { status: 401, ...noStore });
  if (!isDriverUser(userId)) return Response.json({ error: "Driver access is not enabled for this account." }, { status: 403, ...noStore });

  try {
    return Response.json({ rides: listRidesForDriver(userId) }, noStore);
  } catch {
    return Response.json({ error: "Could not load driver offers from the local database." }, { status: 500, ...noStore });
  }
}
