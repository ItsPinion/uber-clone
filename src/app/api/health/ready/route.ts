import { connection, NextResponse } from "next/server";
import { checkRideDatabaseReady } from "@/lib/server/ride-database";

export function createReadinessResponse() {
  try {
    checkRideDatabaseReady();
    return NextResponse.json(
      { status: "ok" },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    // Keep database paths and driver errors out of a public response.
    return NextResponse.json(
      { status: "not_ready" },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

export async function GET() {
  await connection();
  return createReadinessResponse();
}
