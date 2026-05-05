import { getLineClient } from "./client";
import type { TierInfo } from "@/lib/alerting/tiers";

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function buildGoogleFlightsSearchUrl(origin: string, destination: string, date: string) {
  return `https://www.google.com/travel/flights?q=Flights+from+${origin}+to+${destination}+on+${date}&hl=en`;
}

export async function sendPriceAlert(opts: {
  userId: string;
  origin: string;
  destination: string;
  date_from: Date;
  date_to: Date;
  price: number;
  average: number;
  dropPercent: number;
  tierInfo: TierInfo;
}) {
  const client = getLineClient();
  const searchUrl = buildGoogleFlightsSearchUrl(
    opts.origin,
    opts.destination,
    formatDate(opts.date_from)
  );

  const text =
    `${opts.tierInfo.emoji} ${opts.tierInfo.label}\n` +
    `Route: ${opts.origin} → ${opts.destination}\n` +
    `Dates: ${formatDate(opts.date_from)} – ${formatDate(opts.date_to)}\n` +
    `Price: ${opts.price.toLocaleString()}\n` +
    `30-day avg: ${Math.round(opts.average).toLocaleString()}\n` +
    `Drop: ${opts.dropPercent}% below average\n` +
    `Search: ${searchUrl}`;

  await client.pushMessage({ to: opts.userId, messages: [{ type: "text", text }] });
}

export async function sendScraperFailureAlert(
  origin: string,
  destination: string,
  lastSuccess: Date | null
) {
  const client = getLineClient();
  const userId = process.env.LINE_USER_ID ?? "";
  const since = lastSuccess
    ? lastSuccess.toISOString().replace("T", " ").slice(0, 16) + " UTC"
    : "never";

  const text =
    `⚠ Scraper failure: ${origin} → ${destination} — no data since ${since}. Please check the scraper.`;

  await client.pushMessage({ to: userId, messages: [{ type: "text", text }] });
}

export async function sendStatusReply(replyToken: string, text: string) {
  const client = getLineClient();
  await client.replyMessage({ replyToken, messages: [{ type: "text", text }] });
}
