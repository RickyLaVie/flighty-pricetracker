import { prisma } from "@/lib/db";

export async function computeRollingAverage(routeId: string): Promise<number | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const result = await prisma.priceSnapshot.aggregate({
    where: {
      route_id: routeId,
      scraped_at: { gte: thirtyDaysAgo },
    },
    _avg: { price: true },
    _count: true,
  });

  // Require data spanning at least 30 days — check oldest snapshot date
  const oldest = await prisma.priceSnapshot.findFirst({
    where: { route_id: routeId },
    orderBy: { scraped_at: "asc" },
    select: { scraped_at: true },
  });

  if (!oldest) return null;

  const dataAgeMs = Date.now() - oldest.scraped_at.getTime();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  if (dataAgeMs < thirtyDaysMs) return null;

  return result._avg.price;
}
