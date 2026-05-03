import { launchBrowser, createStealthContext } from "./base";
import type { Browser } from "playwright";
import type { ScrapeResult, MarketStats } from "./types";

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

interface FlightStatsResponse {
  monthPrices?: { chartData?: { values?: number[]; labels?: string[] } };
}

// Maps Momondo airline display names to a canonical name we recognise
const AIRLINE_DISPLAY_MAP: Record<string, string> = {
  "HK Express": "HK Express",
  "Hong Kong Express": "HK Express",
  "Cathay Pacific": "Cathay Pacific",
  "EVA Air": "EVA Air",
  "STARLUX Airlines": "STARLUX Airlines",
  "China Airlines": "China Airlines",
  "Mandarin Airlines": "Mandarin Airlines",
  "Greater Bay Airlines": "Greater Bay Airlines",
  "Air Macau": "Air Macau",
  "AirAsia": "AirAsia",
  "Japan Airlines": "Japan Airlines",
  "ANA": "ANA",
  "Korean Air": "Korean Air",
  "Asiana": "Asiana",
  "Peach": "Peach",
  "Scoot": "Scoot",
  "Tigerair Taiwan": "Taiwan Tigerair",
  "Taiwan Tigerair": "Taiwan Tigerair",
  "VietJet Air": "VietJet",
  "Spring Airlines": "Spring Airlines",
};

function buildMomondoUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): string {
  return `https://www.momondo.com/flight-search/${origin}-${destination}/${departureDate}/${returnDate}?adults=1&sort=price_a`;
}

interface AirlineItem {
  id: string;
  displayValue: string;
  price?: { price: number; currency: string };
  disabled?: boolean;
}

interface PollResponse {
  filterData?: {
    airlines?: { items?: AirlineItem[] };
  };
}

export async function scrapeMomondo(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  sharedBrowser?: Browser
): Promise<ScrapeResult | null> {
  const ownBrowser = !sharedBrowser;
  const browser = sharedBrowser ?? await launchBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  // Accumulate poll API responses — Momondo polls repeatedly as results load
  const pollBodies: PollResponse[] = [];
  let flightStats: FlightStatsResponse | undefined;

  page.on("response", async (resp) => {
    const u = resp.url();
    if (u.includes("/i/api/search/dynamic/flights/poll")) {
      try { pollBodies.push(await resp.json()); } catch {}
    } else if (u.includes("FlightStatisticsAction") || u.includes("flightstatistics")) {
      try { flightStats = (await resp.json()) as FlightStatsResponse; } catch {}
    }
  });

  try {
    const url = buildMomondoUrl(origin, destination, departureDate, returnDate);
    console.log("[momondo] navigating:", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for multiple poll cycles so most results load
    await page.waitForTimeout(12000);

    console.log("[momondo] poll responses received:", pollBodies.length);

    // Merge all airline items across poll cycles — later polls have more complete prices
    const airlineMap = new Map<string, { name: string; price: number; currency: string }>();

    for (const poll of pollBodies) {
      const items = poll.filterData?.airlines?.items ?? [];
      for (const item of items) {
        if (!item.price || item.disabled) continue;
        const { price, currency } = item.price;
        if (typeof price !== "number" || price < 50 || price > 50000) continue;

        const existing = airlineMap.get(item.id);
        if (!existing || price < existing.price) {
          airlineMap.set(item.id, {
            name: AIRLINE_DISPLAY_MAP[item.displayValue] ?? item.displayValue,
            price,
            currency: currency ?? "USD",
          });
        }
      }
    }

    console.log("[momondo] airlines from JSON:", [...airlineMap.values()].map(a => `${a.name} $${a.price}`));

    if (airlineMap.size > 0) {
      const cheapest = [...airlineMap.values()].reduce((a, b) => (a.price < b.price ? a : b));

      // Build market stats from FlightStatisticsAction if available
      let marketStats: MarketStats | undefined;
      const monthValues = flightStats?.monthPrices?.chartData?.values;
      const monthLabels = flightStats?.monthPrices?.chartData?.labels;
      if (monthValues && monthValues.length === 12 && monthLabels) {
        const sorted = [...monthValues].sort((a, b) => a - b);
        marketStats = {
          source: "momondo",
          updatedAt: new Date().toISOString(),
          monthlyAvg: monthValues,
          monthLabels,
          p25: Math.round(percentile(sorted, 25)),
          p75: Math.round(percentile(sorted, 75)),
          median: Math.round(percentile(sorted, 50)),
        };
        console.log("[momondo] market stats:", `p25=$${marketStats.p25} median=$${marketStats.median} p75=$${marketStats.p75}`);
      }

      return { price: cheapest.price, currency: cheapest.currency, airline: cheapest.name, source: "momondo", marketStats };
    }

    // Fallback: body-text parse
    console.log("[momondo] JSON parse found nothing, falling back to body text");
    return await bodyTextFallback(page);
  } catch (err) {
    console.error("[momondo] scrape error:", err);
    return null;
  } finally {
    await context.close();
    if (ownBrowser) await browser.close();
  }
}

async function bodyTextFallback(page: import("playwright").Page): Promise<ScrapeResult | null> {
  const AIRLINE_RE = /\b(STARLUX Airlines?|Cathay Pacific|EVA Air|HK Express|Hong Kong Express|Hong Kong Airlines?|China Airlines?|Mandarin Airlines?|Greater Bay Airlines?|Air Macau|AirAsia|Japan Airlines?|ANA|Korean Air|Asiana|Peach|Scoot|Tigerair|Taiwan Tigerair|VietJet|Spring Airlines?)\b/i;

  const { results } = await page.evaluate((airlineReStr: string) => {
    const AIRLINE_RE = new RegExp(airlineReStr, "i");
    const lines = (document.body.innerText ?? "").split("\n").map(l => l.trim()).filter(Boolean);
    const results: { price: number; currency: string; airline: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      // Momondo price format: "$195" or "$195 • 1h 52m"
      const m = lines[i].match(/^\$(\d[\d,]*)(?:\s|$)/);
      if (!m) continue;
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (isNaN(price) || price < 50 || price > 50000) continue;

      const context = lines.slice(Math.max(0, i - 5), i + 3).join(" ");
      const airlineMatch = context.match(AIRLINE_RE);
      if (!airlineMatch) continue;

      results.push({ price, currency: "USD", airline: airlineMatch[1] });
    }
    return { results };
  }, AIRLINE_RE.source);

  if (results.length === 0) return null;
  const lowest = results.reduce((a, b) => (a.price < b.price ? a : b));
  console.log("[momondo] body text fallback result:", lowest);
  return { ...lowest, source: "momondo" };
}
