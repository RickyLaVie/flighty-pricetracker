import { launchBrowser, createStealthContext, randomDelay } from "./base";
import type { ScrapeResult } from "./types";

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  date: string
): string {
  return `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${destination}+on+${date}&hl=en&curr=USD`;
}

export async function scrapeGoogleFlights(
  origin: string,
  destination: string,
  departureDate: string
): Promise<ScrapeResult | null> {
  const browser = await launchBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  try {
    const url = buildGoogleFlightsUrl(origin, destination, departureDate);
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await randomDelay();

    // Wait for flight list items with role="listitem" containing price info
    await page.waitForSelector('[role="listitem"]', { timeout: 15000 });

    // Extract all price spans — Google Flights uses aria-label patterns
    const priceData = await page.evaluate(() => {
      const results: { price: number; currency: string; airline: string }[] = [];

      const items = document.querySelectorAll('[role="listitem"]');
      for (const item of items) {
        // Price is typically in a span with a currency symbol
        const priceEl = item.querySelector('[aria-label*="$"], [aria-label*="TWD"], [aria-label*="USD"], [aria-label*="JPY"]')
          ?? item.querySelector('.YMlIz, .FpEdX span, [data-gs]');
        const airlineEl = item.querySelector('[data-testid="airline-name"]')
          ?? item.querySelector('.sSHqwe, .h1fkLb');

        if (!priceEl) continue;

        const rawText = priceEl.textContent?.replace(/,/g, "").trim() ?? "";
        const numMatch = rawText.match(/[\d.]+/);
        if (!numMatch) continue;

        const price = parseFloat(numMatch[0]);
        if (isNaN(price) || price <= 0) continue;

        const currency = rawText.includes("$") ? "USD" : rawText.slice(0, 3).trim() || "USD";
        const airline = airlineEl?.textContent?.trim() ?? "Unknown";

        results.push({ price, currency, airline });
      }
      return results;
    });

    if (priceData.length === 0) return null;

    const lowest = priceData.reduce((a, b) => (a.price < b.price ? a : b));
    return { ...lowest, source: "google_flights" };
  } catch (err) {
    console.error("[google-flights] scrape error:", err);
    return null;
  } finally {
    await context.close();
    await browser.close();
  }
}
