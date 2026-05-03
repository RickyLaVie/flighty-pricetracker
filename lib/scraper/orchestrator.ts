import { prisma } from "@/lib/db";
import { listActiveRoutes } from "@/lib/routes/queries";
import { launchBrowser } from "./base";
import { scrapeGoogleFlights } from "./google-flights";
import { scrapeSkyscanner } from "./skyscanner";
import { scrapeMomondo } from "./momondo";
import { sendScraperFailureAlert } from "@/lib/linebot/notifications";
import { evaluateAndAlert } from "@/lib/alerting/engine";
import type { Browser } from "playwright";

const BUDGET_AIRLINES = [
  "hong kong express", "hk express", "airasia", "air asia",
  "peach", "scoot", "tigerair", "taiwan tigerair",
  "vietjet", "spring airlines", "greater bay airlines", "greater bay",
];

function isBudgetAirline(airline: string): boolean {
  const lower = airline.toLowerCase();
  return BUDGET_AIRLINES.some((b) => lower.includes(b));
}

export async function runScrapeForRoute(routeId: string) {
  const route = await prisma.route.findUnique({ where: { id: routeId } });
  if (!route || route.status !== "active") return;

  const { origin, destination } = route;
  const departureDate = route.date_from.toISOString().split("T")[0];
  const returnDate = route.date_to.toISOString().split("T")[0];

  // Launch ONE browser for the whole run — avoids resource contention on Railway
  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
  } catch (err) {
    console.error(`[orchestrator] browser launch failed for route ${routeId}:`, err);
    await checkConsecutiveFailures(routeId);
    return;
  }

  const sources = [
    () => scrapeMomondo(origin, destination, departureDate, returnDate, browser),
    () => scrapeGoogleFlights(origin, destination, departureDate, returnDate, browser),
    () => scrapeSkyscanner(origin, destination, departureDate, returnDate, browser),
  ];

  let successCount = 0;
  try {
    for (const scrape of sources) {
      try {
        const result = await scrape();
        if (result) {
          // Apply route-level filters
          if (route.exclude_budget_airlines && isBudgetAirline(result.airline)) continue;
          if (route.require_checked_baggage && isBudgetAirline(result.airline)) continue;

          const snapshot = await prisma.priceSnapshot.create({
            data: {
              route_id: routeId,
              source: result.source,
              price: result.price,
              currency: result.currency,
              airline: result.airline,
              departure_date: new Date(departureDate),
            },
          });
          await evaluateAndAlert(routeId, snapshot.price);
          successCount++;
          break; // First successful source wins — don't let a later source overwrite with a worse price
        }
      } catch (err) {
        console.error(`Scrape error for route ${routeId}:`, err);
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  if (successCount === 0) {
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
