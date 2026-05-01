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
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Dismiss cookie consent dialog if present
    try {
      await page.locator('button:has-text("Accept all")').first().click({ timeout: 3000 });
    } catch {
      // no consent dialog
    }

    // Wait for network to settle after JS renders flight results
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(3000);

    // Parse prices directly from body text (most reliable across DOM structure changes)
    const priceData = await page.evaluate(() => {
      const results: { price: number; currency: string; airline: string }[] = [];
      const lines = (document.body.innerText ?? "").split("\n").map(l => l.trim()).filter(Boolean);

      const AIRLINE_RE = /\b(STARLUX Airlines?|Cathay Pacific|EVA Air|Hong Kong Express|Hong Kong Airlines?|China Airlines?|Mandarin Airlines?|AirAsia|Japan Airlines?|ANA|Korean Air|Asiana)\b/i;

      for (let i = 0; i < lines.length; i++) {
        // Price lines look like "$291" or "$1,234" — standalone dollar amount
        const priceMatch = lines[i].match(/^\$(\d[\d,]*)$/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (isNaN(price) || price < 50 || price > 50000) continue;

        // Skip header summary prices like "Cheapest from $280"
        const prevLine = i > 0 ? lines[i - 1].toLowerCase() : "";
        if (/^from$|cheapest|starting|price/.test(prevLine)) continue;

        // Look for airline in surrounding lines (within 6 lines)
        const context = lines.slice(i, i + 7).join(" ");
        const airlineMatch = context.match(AIRLINE_RE);
        const airline = airlineMatch ? airlineMatch[1] : "Unknown";

        results.push({ price, currency: "USD", airline });
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
