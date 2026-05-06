import { launchBrowser, createStealthContext, randomDelay } from "./base";
import type { Browser } from "playwright";
import type { ScrapeResult } from "./types";

function toSkyscannerDate(dateStr: string): string {
  const d = new Date(dateStr);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

function buildSkyscannerUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  isRoundTrip?: boolean
): string {
  const dep = toSkyscannerDate(departureDate);
  if (isRoundTrip === false) {
    return `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${dep}/?adults=1&cabinclass=economy&rtn=0`;
  }
  const ret = toSkyscannerDate(returnDate);
  return `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${dep}/${ret}/?adults=1&cabinclass=economy&rtn=1`;
}

export async function scrapeSkyscanner(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  sharedBrowser?: Browser,
  isRoundTrip?: boolean
): Promise<ScrapeResult | null> {
  const ownBrowser = !sharedBrowser;
  const browser = sharedBrowser ?? await launchBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  try {
    const url = buildSkyscannerUrl(origin, destination, departureDate, returnDate, isRoundTrip);
    console.log("[skyscanner] navigating:", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await randomDelay();

    console.log("[skyscanner] page url:", page.url());

    if (page.url().includes("captcha") || page.url().includes("blocked")) {
      console.log("[skyscanner] blocked, skipping");
      return null;
    }

    // Wait for results — try multiple selectors as Skyscanner changes its DOM
    const listSelectors = [
      '[data-testid="itinerary-list"]',
      '[class*="FlightsResults"]',
      '[class*="results-list"]',
    ];
    let found = false;
    for (const sel of listSelectors) {
      try {
        await page.waitForSelector(sel, { timeout: 20000 });
        found = true;
        break;
      } catch { /* try next */ }
    }
    if (!found) {
      console.log("[skyscanner] results container not found");
      return null;
    }

    await page.waitForTimeout(3000);

    const priceData = await page.evaluate(() => {
      const results: { price: number; currency: string; airline: string }[] = [];

      const cards = document.querySelectorAll(
        '[data-testid="itinerary-card-wrapper"], [data-testid="flight-card"], [class*="ItineraryCard"]'
      );

      for (const card of cards) {
        const priceEl =
          card.querySelector('[data-testid="price"]') ??
          card.querySelector('[class*="Price"]') ??
          card.querySelector('[class*="price"]');
        const airlineEl =
          card.querySelector('[data-testid="carrier-name"]') ??
          card.querySelector('[class*="CarrierName"]') ??
          card.querySelector('[class*="carrier-name"]');

        if (!priceEl) continue;

        const rawText = priceEl.textContent?.replace(/,/g, "").trim() ?? "";
        const numMatch = rawText.match(/[\d.]+/);
        if (!numMatch) continue;

        const price = parseFloat(numMatch[0]);
        if (isNaN(price) || price < 50 || price > 50000) continue;

        const currency = rawText.match(/^[A-Z]{3}/)?.[0] ?? "USD";
        const airline = airlineEl?.textContent?.trim() ?? "Unknown";

        results.push({ price, currency, airline });
      }
      return results;
    });

    console.log("[skyscanner] results:", priceData.length, "flights");
    if (priceData.length === 0) return null;

    const entries = priceData.map((r) => ({ ...r, source: "skyscanner" }));
    return { entries };
  } catch (err) {
    console.error("[skyscanner] scrape error:", err);
    return null;
  } finally {
    await context.close();
    if (ownBrowser) await browser.close();
  }
}
