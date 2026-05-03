export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeRollingAverage } from "@/lib/alerting/average";


export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [snapshots, average, route] = await Promise.all([
    prisma.priceSnapshot.findMany({
      where: { route_id: id, scraped_at: { gte: thirtyDaysAgo } },
      orderBy: { scraped_at: "asc" },
    }),
    computeRollingAverage(id),
    prisma.route.findUnique({ where: { id }, select: { price_stats: true, date_from: true } }),
  ]);

  const oldest = await prisma.priceSnapshot.findFirst({
    where: { route_id: id },
    orderBy: { scraped_at: "asc" },
    select: { scraped_at: true },
  });

  const dataAgeMs = oldest ? Date.now() - oldest.scraped_at.getTime() : 0;
  const hasBaseline = dataAgeMs >= 30 * 24 * 60 * 60 * 1000;

  return NextResponse.json({
    snapshots,
    average,
    hasBaseline,
    marketStats: route?.price_stats ?? null,
    departureDate: route?.date_from ?? null,
  });
}
