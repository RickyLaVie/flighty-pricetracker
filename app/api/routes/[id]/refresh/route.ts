import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runScrapeForRoute } from "@/lib/scraper/orchestrator";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const route = await prisma.route.findUnique({ where: { id } });
  if (!route || route.status !== "active") {
    return NextResponse.json({ error: "Route not found" }, { status: 404 });
  }

  await runScrapeForRoute(id);

  const latest = await prisma.priceSnapshot.findFirst({
    where: { route_id: id },
    orderBy: { scraped_at: "desc" },
  });

  return NextResponse.json({
    price: latest?.price ?? null,
    currency: latest?.currency ?? null,
    last_checked: latest?.scraped_at ?? null,
  });
}
