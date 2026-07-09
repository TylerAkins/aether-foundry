import { NextResponse } from "next/server";

import { getKVisaAssistantLaunchTokenJwks } from "@/lib/products/kvisa-launch-token";

export async function GET(): Promise<NextResponse> {
  const jwks = await getKVisaAssistantLaunchTokenJwks();

  return NextResponse.json(jwks, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=300",
    },
  });
}
