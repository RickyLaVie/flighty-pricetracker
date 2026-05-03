export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeRollingAverage } from "@/lib/alerting/average";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [snapshots, average, allPriceRows] = await Promise.all([
    prisma.priceSnapshot.findMany({
      where: { route_id: id, scraped_at: { gte: thirtyDaysAgo } },
      orderBy: { scraped_at: "asc" },
    }),
    computeRollingAverage(id),
    prisma.priceSnapshot.findMany({
      where: { route_id: id },
      select: { price: true },
    }),
  ]);

  const oldest = await prisma.priceSnapshot.findFirst({
    where: { route_id: id },
    orderBy: { scraped_at: "asc" },
    select: { scraped_at: true },
  });

  const dataAgeMs = oldest ? Date.now() - oldest.scraped_at.getTime() : 0;
  const hasBaseline = dataAgeMs >= 30 * 24 * 60 * 60 * 1000;

  // Price level stats — needs at least 5 data points to be meaningful
  const sorted = allPriceRows.map((r) => r.price).sort((a, b) => a - b);
  const priceStats =
    sorted.length >= 5
      ? {
          p25: Math.round(percentile(sorted, 25)),
          p75: Math.round(percentile(sorted, 75)),
          median: Math.round(percentile(sorted, 50)),
          count: sorted.length,
        }
      : null;

  return NextResponse.json({ snapshots, average, hasBaseline, priceStats });
}
