import { NextResponse } from "next/server";

import { checkDatabaseHealth } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const isAvailable = await checkDatabaseHealth();

  if (isAvailable) {
    return NextResponse.json({ status: "available" });
  }

  return NextResponse.json({ status: "unavailable" }, { status: 503 });
}
