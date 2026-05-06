import { prisma } from "@/lib/db";
import { launchBrowser } from "./base";
import { scrapeGoogleFlights } from "./google-flights";
import { scrapeSkyscanner } from "./skyscanner";
import { scrapeMomondo } from "./momondo";
import { sendScraperFailureAlert } from "@/lib/linebot/notifications";
import { evaluateAndAlert } from "@/lib/alerting/engine";
import type { Browser } from "playwright";
import type { ScrapeEntry, MarketStats } from "./types";

const BUDGET_AIRLINES = [
  "hong kong express", "hk express", "airasia", "air asia",
  "peach", "scoot", "tigerair", "taiwan tigerair",
  "vietjet", "vietjet air", "spring airlines", "greater bay airlines", "greater bay",
  "jeju air", "jin air", "jetstar", "cebu pacific", "nok air", "thai lion air",
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

  let browser: Browser | undefined;
  try {
    browser = await launchBrowser();
  } catch (err) {
    console.error(`[orchestrator] browser launch failed for route ${routeId}:`, err);
    await checkConsecutiveFailures(routeId);
    return;
  }

  const scrapers = [
    () => scrapeMomondo(origin, destination, departureDate, returnDate, browser, route.require_checked_baggage),
    () => scrapeGoogleFlights(origin, destination, departureDate, returnDate, browser),
    () => scrapeSkyscanner(origin, destination, departureDate, returnDate, browser),
  ];

  // Collect ALL entries from ALL scrapers
  const allEntries: ScrapeEntry[] = [];
  let marketStats: MarketStats | undefined;

  try {
    for (const scrape of scrapers) {
      try {
        const result = await scrape();
        if (!result) continue;
        allEntries.push(...result.entries);
        if (result.marketStats) marketStats = result.marketStats;
      } catch (err) {
        console.error(`[orchestrator] scrape error for route ${routeId}:`, err);
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  if (allEntries.length === 0) {
    await checkConsecutiveFailures(routeId);
    return;
  }

  console.log(`[orchestrator] total entries before filter: ${allEntries.length}`);

  const requireBaggage = route.require_checked_baggage;
  const excludeBudget = route.exclude_budget_airlines;

  // When baggage is required, trust Momondo's URL-level baggage filter over isBudgetAirline proxy.
  // Other scrapers can't filter by baggage, so we narrow the pool to Momondo results when available.
  const momondoEntries = allEntries.filter((e) => e.source === "momondo");
  const useMomondoPool = requireBaggage && momondoEntries.length > 0;
  const pool = useMomondoPool ? momondoEntries : allEntries;

  // Fallback to isBudgetAirline proxy only when baggage is required but Momondo has no data
  const needsBudgetProxy = excludeBudget || (requireBaggage && !useMomondoPool);

  // Priority 1: known non-budget airlines
  const knownNonBudget = pool.filter((e) => {
    if (e.airline === "Unknown") return false;
    if (needsBudgetProxy && isBudgetAirline(e.airline)) return false;
    if (excludeBudget && useMomondoPool && isBudgetAirline(e.airline)) return false;
    return true;
  });

  // Priority 2: known airlines
  const knownAny = pool.filter((e) => e.airline !== "Unknown");

  // Priority 3: all entries as last resort
  const candidates =
    knownNonBudget.length > 0 ? knownNonBudget :
    knownAny.length > 0 ? knownAny :
    pool;

  console.log(`[orchestrator] pool=${pool.length}(momondoOnly=${useMomondoPool}) candidates=${candidates.length} (knownNonBudget=${knownNonBudget.length}, knownAny=${knownAny.length}, total=${allEntries.length})`);

  // Pick the cheapest across all sources
  const cheapest = candidates.reduce((a, b) => (a.price < b.price ? a : b));
  console.log(`[orchestrator] cheapest: $${cheapest.price} via ${cheapest.source} (${cheapest.airline})`);

  const snapshot = await prisma.priceSnapshot.create({
    data: {
      route_id: routeId,
      source: cheapest.source,
      price: cheapest.price,
      currency: cheapest.currency,
      airline: cheapest.airline,
      departure_date: new Date(departureDate),
    },
  });

  if (marketStats) {
    await prisma.route.update({
      where: { id: routeId },
      data: { price_stats: marketStats as object },
    });
  }

  await evaluateAndAlert(routeId, snapshot.price);
}

async function checkConsecutiveFailures(routeId: string) {
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
  const routes = await prisma.route.findMany({
    where: { status: "active" },
    select: { id: true },
  });
  for (const route of routes) {
    await runScrapeForRoute(route.id);
  }
}
