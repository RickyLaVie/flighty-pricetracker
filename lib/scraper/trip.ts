import { launchBrowser, createStealthContext, randomDelay } from "./base";
import type { ScrapeResult } from "./types";

const AIRLINE_RE = /\b(STARLUX|Cathay Pacific|EVA Air|Hong Kong Express|HK Express|Hong Kong Airlines?|China Airlines?|Mandarin Airlines?|Greater Bay Airlines?|Air Macau|AirAsia|Japan Airlines?|ANA|Korean Air|Asiana|Peach|Scoot|Tigerair|Taiwan Tigerair|VietJet|Spring Airlines?)\b/i;

function buildTripUrl(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): string {
  const dep = departureDate.replace(/-/g, "");
  const ret = returnDate.replace(/-/g, "");
  return `https://www.trip.com/flights/list?flighttype=d&dcity=${origin}&acity=${destination}&ddate=${dep}&rdate=${ret}&adult=1&child=0&infant=0&cabin=Y&curr=USD&locale=en-XX`;
}

export async function scrapeTrip(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): Promise<ScrapeResult | null> {
  const browser = await launchBrowser();
  const context = await createStealthContext(browser);
  const page = await context.newPage();

  try {
    const url = buildTripUrl(origin, destination, departureDate, returnDate);
    console.log("[trip] navigating to:", url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Wait for flight list to render
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(4000);

    // Scroll to trigger lazy-loading
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(2000);

    const { priceData, debugLines, matchedCtx } = await page.evaluate((airlineReStr: string) => {
      const AIRLINE_RE = new RegExp(airlineReStr, "i");
      const TIME_RE = /\b\d{1,2}:\d{2}/;
      const results: { price: number; currency: string; airline: string }[] = [];
      const lines = (document.body.innerText ?? "").split("\n").map(l => l.trim()).filter(Boolean);

      const debugLines = lines.filter(l => /\d{2,4}/.test(l) && l.length < 40).slice(0, 30);
      const matchedCtx: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        // Trip.com shows prices as "196", "US$196", "$196", "USD 196", or "196 USD"
        const m =
          lines[i].match(/^(?:US\$|USD\s*)(\d[\d,]*)$/) ||
          lines[i].match(/^\$(\d[\d,]*)$/) ||
          lines[i].match(/^(\d[\d,]*)\s*(?:USD)?$/) ||
          lines[i].match(/^(\d[\d,]*)\s+USD$/);
        if (!m) continue;

        const price = parseFloat(m[1].replace(/,/g, ""));
        if (isNaN(price) || price < 50 || price > 50000) continue;

        // Require a time in surrounding context to avoid stray numbers
        const contextBefore = lines.slice(Math.max(0, i - 20), i).join(" ");
        const contextAfter = lines.slice(i, i + 10).join(" ");
        if (!TIME_RE.test(contextBefore) && !TIME_RE.test(contextAfter)) continue;

        const fullContext = contextBefore + " " + contextAfter;
        const airlineMatch = fullContext.match(AIRLINE_RE);
        const airline = airlineMatch ? airlineMatch[1] : "Unknown";
        if (airline === "Unknown") continue;

        results.push({ price, currency: "USD", airline });
        matchedCtx.push(`$${price} | ${airline} | ...${lines.slice(Math.max(0, i - 3), i + 3).join(" | ")}...`);
      }

      return { priceData: results, debugLines, matchedCtx };
    }, AIRLINE_RE.source);

    console.log("[trip] debug lines:", debugLines);
    console.log("[trip] matched flights:", matchedCtx);

    if (priceData.length === 0) {
      // Fallback: try DOM-based extraction
      console.log("[trip] text parse found nothing, trying DOM selectors");
      return await domFallback(page);
    }

    const lowest = priceData.reduce((a, b) => (a.price < b.price ? a : b));
    return { ...lowest, source: "trip" };
  } catch (err) {
    console.error("[trip] scrape error:", err);
    return null;
  } finally {
    await context.close();
    await browser.close();
  }
}

async function domFallback(page: import("playwright").Page): Promise<ScrapeResult | null> {
  try {
    const result = await page.evaluate(() => {
      // Trip.com React app uses data attributes and specific class patterns
      // Try common price selectors
      const priceSelectors = [
        "[class*='price']",
        "[class*='Price']",
        "[class*='fare']",
        "[class*='Fare']",
      ];

      const airlineSelectors = [
        "[class*='airline']",
        "[class*='Airline']",
        "[class*='carrier']",
        "[class*='Carrier']",
      ];

      interface FlightEntry { price: number; airline: string }
      const flights: FlightEntry[] = [];

      for (const priceSel of priceSelectors) {
        const els = document.querySelectorAll(priceSel);
        for (const el of Array.from(els)) {
          const text = (el as HTMLElement).innerText?.trim() ?? "";
          const m = text.match(/(\d[\d,]+)/);
          if (!m) continue;
          const price = parseFloat(m[1].replace(/,/g, ""));
          if (isNaN(price) || price < 50 || price > 50000) continue;

          // Look for airline in parent card
          let parent = el.parentElement;
          let airline = "Unknown";
          for (let depth = 0; depth < 8 && parent; depth++, parent = parent.parentElement) {
            const cardText = (parent as HTMLElement).innerText ?? "";
            const am = cardText.match(/\b(STARLUX|Cathay Pacific|EVA Air|Hong Kong Express|HK Express|Hong Kong Airlines|China Airlines|Mandarin Airlines|Greater Bay Airlines|Air Macau|AirAsia|Japan Airlines|ANA|Korean Air|Asiana|Peach|Scoot|Tigerair|VietJet|Spring Airlines)\b/i);
            if (am) { airline = am[1]; break; }
          }
          if (airline === "Unknown") continue;
          flights.push({ price, airline });
        }
        if (flights.length > 0) break;
      }

      if (flights.length === 0) return null;
      const lowest = flights.reduce((a, b) => a.price < b.price ? a : b);
      return { price: lowest.price, currency: "USD", airline: lowest.airline };
    });

    if (!result) return null;
    console.log("[trip] DOM fallback result:", result);
    return { ...result, source: "trip" };
  } catch {
    return null;
  }
}
