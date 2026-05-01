import { launchBrowser, createStealthContext, randomDelay } from "./base";
import type { ScrapeResult } from "./types";

function buildGoogleFlightsUrl(
  origin: string,
  destination: string,
  date: string
): string {
  return `https://www.google.com/travel/flights?q=one+way+flights+from+${origin}+to+${destination}+on+${date}&hl=en&curr=USD`;
}

export async function scrapeGoogleFlights(
  origin: string,
  destination: string,
  departureDate: string,
  _returnDate?: string
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
    const { priceData, debugPriceLines, matchedCtx } = await page.evaluate(() => {
      const results: { price: number; currency: string; airline: string }[] = [];
      const lines = (document.body.innerText ?? "").split("\n").map(l => l.trim()).filter(Boolean);

      const AIRLINE_RE = /\b(STARLUX Airlines?|Cathay Pacific|EVA Air|Hong Kong Express|HK Express|Hong Kong Airlines?|China Airlines?|Mandarin Airlines?|Greater Bay Airlines?|Air Macau|AirAsia|Japan Airlines?|ANA|Korean Air|Asiana|Peach|Scoot|Tigerair|Taiwan Tigerair|VietJet|Spring Airlines?)\b/i;
      // Match both 12-hr ("6:00 AM") and 24-hr ("06:00") flight times
      const TIME_RE = /\b\d{1,2}:\d{2}/;

      const debugPriceLines = lines.filter(l => /\$\d/.test(l)).slice(0, 20);
      const matchedCtx: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        // Price lines look like "$206" or "$206 round trip"
        const priceMatch = lines[i].match(/^\$(\d[\d,]*)(?:\s|$)/);
        if (!priceMatch) continue;

        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (isNaN(price) || price < 50 || price > 50000) continue;

        // Skip calendar-grid cells: price directly preceded by a short date line like "Jun 24" or "24"
        const prevLine = lines[i - 1] ?? "";
        if (/^[A-Z][a-z]{2}\s+\d{1,2}$/.test(prevLine) || /^\d{1,2}$/.test(prevLine)) continue;

        // Require a flight departure/arrival time in the preceding lines to exclude
        // any remaining date-grid "cheapest day" prices
        const contextBefore = lines.slice(Math.max(0, i - 20), i).join(" ");
        if (!TIME_RE.test(contextBefore)) continue;

        // Look for airline in surrounding lines
        const fullContext = contextBefore + " " + lines.slice(i, i + 5).join(" ");
        const airlineMatch = fullContext.match(AIRLINE_RE);
        const airline = airlineMatch ? airlineMatch[1] : "Unknown";

        results.push({ price, currency: "USD", airline });
        matchedCtx.push(`$${price} | ${airline} | ...${lines.slice(Math.max(0, i - 5), i + 2).join(" | ")}...`);
      }
      return { priceData: results, debugPriceLines, matchedCtx };
    });

    console.log("[google-flights] price lines found:", debugPriceLines);
    console.log("[google-flights] matched flights:", matchedCtx);

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
