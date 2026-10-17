import { connection, NextResponse } from "next/server";
import { checkRideDatabaseReady } from "@/lib/server/ride-database";

export async function GET() {
  await connection();
  try {
    checkRideDatabaseReady();
    return NextResponse.json({ status: "ok" });
  } catch {
    // Keep database paths and driver errors out of a public response.
    return NextResponse.json({ status: "not_ready" }, { status: 503 });
  }
}
