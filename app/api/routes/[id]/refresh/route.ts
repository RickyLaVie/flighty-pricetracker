export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runScrapeForRoute } from "@/lib/scraper/orchestrator";
import { getSession } from "@/lib/session";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const route = await prisma.route.findUnique({ where: { id } });
  if (!route || route.status !== "active") {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }
  if (route.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await runScrapeForRoute(id);

  const latest = await prisma.priceSnapshot.findFirst({
    where: { route_id: id },
    orderBy: { scraped_at: "desc" },
  });

  return NextResponse.json({
    price: latest?.price ?? null,
    currency: latest?.currency ?? null,
    airline: latest?.airline ?? null,
    source: latest?.source ?? null,
    departure_date: latest?.departure_date ?? null,
    last_checked: latest?.scraped_at ?? null,
  });
}
