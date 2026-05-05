export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId || !session.lineAccessToken) {
    return NextResponse.json({ friendFlag: false });
  }

  try {
    const res = await fetch("https://api.line.me/friendship/v1/status", {
      headers: { Authorization: `Bearer ${session.lineAccessToken}` },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ friendFlag: data.friendFlag ?? false });
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ friendFlag: false });
}
