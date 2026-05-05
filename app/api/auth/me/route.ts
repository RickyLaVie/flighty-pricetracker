export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json(null);
  }
  return NextResponse.json({
    userId: session.userId,
    displayName: session.displayName ?? null,
    pictureUrl: session.pictureUrl ?? null,
  });
}
