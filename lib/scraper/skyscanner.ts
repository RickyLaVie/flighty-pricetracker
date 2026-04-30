import { launchBrowser, createStealthContext, randomDelay } from "./base";
import type { ScrapeResult } from "./types";

function buildSkyscannerUrl(
  origin: string,
  destination: string,
  date: string
): string {
  // date format: YYMMDD for Skyscanner
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `https://www.skyscanner.net/transport/flights/${origin.toLowerCase()}/${destination.toLowerCase()}/${yy}${mm}${dd}/?adults=1&cabinclass=economy&ref=home&rtn=0`;
}

export async function scrapeSkyscanner(
  origin: string,
  destination: string,
  departureDate: string
): Promise<ScrapeResult | null> {
  const browser = await launchBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  try {
    const url = buildSkyscannerUrl(origin, destination, departureDate);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await randomDelay();

    // Wait for price cards to appear
    await page.waitForSelector('[data-testid="itinerary-list"]', { timeout: 20000 });

    const priceData = await page.evaluate(() => {
      const results: { price: number; currency: string; airline: string }[] = [];

      // Skyscanner price cards typically have data-testid="price"
      const cards = document.querySelectorAll('[data-testid="itinerary-card-wrapper"], [data-testid="flight-card"]');
      for (const card of cards) {
        const priceEl = card.querySelector('[data-testid="price"]')
          ?? card.querySelector('[class*="price"]');
        const airlineEl = card.querySelector('[data-testid="carrier-name"]')
          ?? card.querySelector('[class*="CarrierName"], [class*="carrier-name"]');

        if (!priceEl) continue;

        const rawText = priceEl.textContent?.replace(/,/g, "").trim() ?? "";
        const numMatch = rawText.match(/[\d.]+/);
        if (!numMatch) continue;

        const price = parseFloat(numMatch[0]);
        if (isNaN(price) || price <= 0) continue;

        const currency = rawText.match(/^[A-Z]{3}/)?.[0] ?? "USD";
        const airline = airlineEl?.textContent?.trim() ?? "Unknown";

        results.push({ price, currency, airline });
      }
      return results;
    });

    if (priceData.length === 0) return null;

    const lowest = priceData.reduce((a, b) => (a.price < b.price ? a : b));
    return { ...lowest, source: "skyscanner" };
  } catch {
    return null;
  } finally {
    await context.close();
    await browser.close();
  }
}
