import { auth } from "@clerk/nextjs/server";
import { getVapidConfiguration } from "@/lib/server/push-config";

const noStore = { headers: { "Cache-Control": "private, no-store" } };

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Sign in to configure notifications." }, { status: 401, ...noStore });
  const configuration = getVapidConfiguration();
  return Response.json({ enabled: Boolean(configuration), publicKey: configuration?.publicKey ?? null }, noStore);
}
