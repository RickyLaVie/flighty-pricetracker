import { launchBrowser, createStealthContext, randomDelay } from "./base";
import type { ScrapeResult } from "./types";

const AIRLINE_RE = /\b(STARLUX|Cathay Pacific|EVA Air|Hong Kong Express|HK Express|Hong Kong Airlines?|China Airlines?|Mandarin Airlines?|Greater Bay Airlines?|Air Macau|AirAsia|Japan Airlines?|ANA|All Nippon Airways?|JAL|Korean Air|Asiana Airlines?|Peach|Scoot|Tigerair|Taiwan Tigerair|VietJet Air?|Spring Airlines?)\b/i;

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

    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(4000);
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
        const m =
          lines[i].match(/^(?:US\$|USD\s*)(\d[\d,]*)$/) ||
          lines[i].match(/^\$(\d[\d,]*)$/) ||
          lines[i].match(/^(\d[\d,]*)\s*(?:USD)?$/) ||
          lines[i].match(/^(\d[\d,]*)\s+USD$/);
        if (!m) continue;

        const price = parseFloat(m[1].replace(/,/g, ""));
        if (isNaN(price) || price < 50 || price > 50000) continue;

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

    if (priceData.length === 0) return null;

    const entries = priceData.map((r) => ({ ...r, source: "trip" }));
    return { entries };
  } catch (err) {
    console.error("[trip] scrape error:", err);
    return null;
  } finally {
    await context.close();
    await browser.close();
  }
}
