import { prisma } from "@/lib/db";
import { listActiveRoutes } from "@/lib/routes/queries";
import { scrapeGoogleFlights } from "./google-flights";
import { scrapeSkyscanner } from "./skyscanner";
import { sendScraperFailureAlert } from "@/lib/linebot/notifications";
import { evaluateAndAlert } from "@/lib/alerting/engine";

function getDatesInRange(from: Date, to: Date): string[] {
  const dates: string[] = [];
  const current = new Date(from);
  while (current <= to) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export async function runScrapeForRoute(routeId: string) {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route || route.status !== "active") return;

  const { origin, destination } = route;
  const dates = getDatesInRange(route.date_from, route.date_to);

  // Scrape all dates in range, keep the cheapest result overall
  type Candidate = { price: number; currency: string; airline: string; source: string; departureDate: string };
  let best: Candidate | null = null;

  for (const departureDate of dates) {
    const sources = [
      () => scrapeGoogleFlights(origin, destination, departureDate),
      () => scrapeSkyscanner(origin, destination, departureDate),
    ];
    for (const scrape of sources) {
      try {
        const result = await scrape();
        if (result && (!best || result.price < best.price)) {
          best = { ...result, departureDate };
        }
      } catch (err) {
        console.error(`Scrape error for route ${routeId} on ${departureDate}:`, err);
      }
    }
  }

  if (best) {
    const snapshot = await prisma.priceSnapshot.create({
      data: {
        route_id: routeId,
        source: best.source,
        price: best.price,
        currency: best.currency,
        airline: best.airline,
        departure_date: new Date(best.departureDate),
      },
    });
    await evaluateAndAlert(routeId, snapshot.price);
  } else {
    await checkConsecutiveFailures(routeId);
  }
}

async function checkConsecutiveFailures(routeId: string) {
  // Get the last 2 scrape run timestamps from the route's snapshots
  // A "run" is identified by grouping snapshots by a time window.
  // Simpler proxy: check if there are 0 snapshots in the last 8 hours (2 x 4h cycles).
  const twoRunsAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
  const recentSnapshots = await prisma.priceSnapshot.count({
    where: {
      route_id: routeId,
      scraped_at: { gte: twoRunsAgo },
    },
  });

  if (recentSnapshots === 0) {
    const lastSnapshot = await prisma.priceSnapshot.findFirst({
      where: { route_id: routeId },
      orderBy: { scraped_at: "desc" },
    });
    const route = await prisma.route.findUnique({ where: { id: routeId } });
    if (route) {
      await sendScraperFailureAlert(
        route.origin,
        route.destination,
        lastSnapshot?.scraped_at ?? null
      );
    }
  }
}

export async function runScrapeForAllActiveRoutes() {
  const routes = await listActiveRoutes();
  for (const route of routes) {
    await runScrapeForRoute(route.id);
  }
}
