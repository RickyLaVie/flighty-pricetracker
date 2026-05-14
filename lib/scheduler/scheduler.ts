import cron from "node-cron";
import { prisma } from "@/lib/db";
import { runScrapeForRoute, runScrapeForAllActiveRoutes } from "@/lib/scraper/orchestrator";

function isBlackoutHour(): boolean {
  const hour = new Date().getHours();
  return hour >= 0 && hour <= 5;
}

function withRandomOffset(fn: () => Promise<void>, maxOffsetMs = 30 * 60 * 1000) {
  const delay = Math.floor(Math.random() * maxOffsetMs);
  setTimeout(fn, delay);
}

async function runNearDepartureRoutes() {
  if (isBlackoutHour()) {
    console.log("[scheduler] Blackout window — skipping near-departure scrape");
    return;
  }
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

  const routes = await prisma.route.findMany({
    where: {
      status: "active",
      date_from: { lte: sevenDaysFromNow },
    },
  });

  for (const route of routes) {
    await runScrapeForRoute(route.id);
  }
}

async function runAllRoutes() {
  if (isBlackoutHour()) {
    console.log("[scheduler] Blackout window — skipping full scrape");
    return;
  }
  await runScrapeForAllActiveRoutes();
}

export function startScheduler() {
  // Every 8 hours — applies random 0–30 min offset at each tick
  cron.schedule("0 */8 * * *", () => {
    withRandomOffset(runAllRoutes);
  });

  // Every 2 hours for near-departure routes
  cron.schedule("0 */2 * * *", () => {
    withRandomOffset(runNearDepartureRoutes, 10 * 60 * 1000);
  });

  console.log("[scheduler] Started — 8h full scrape, 2h near-departure scrape");
}
