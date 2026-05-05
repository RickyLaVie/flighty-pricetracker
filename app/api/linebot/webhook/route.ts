export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { validateSignature } from "@line/bot-sdk";
import type { webhook } from "@line/bot-sdk";
import { listActiveRoutes } from "@/lib/routes/queries";
import { sendStatusReply } from "@/lib/linebot/notifications";

type CallbackRequest = webhook.CallbackRequest;
type MessageEvent = webhook.MessageEvent;
type TextMessageContent = webhook.TextMessageContent;

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET ?? "";
  return validateSignature(body, secret, signature);
}

function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

async function handleTextMessage(
  event: MessageEvent & { message: TextMessageContent }
) {
  const text = (event.message as TextMessageContent).text.trim().toLowerCase();
  const replyToken = event.replyToken;
  if (!replyToken) return;

  // Get the LINE userId of the sender to show only their routes
  const senderId = (event.source as { userId?: string })?.userId;

  if (text === "status") {
    if (!senderId) {
      await sendStatusReply(replyToken, "Unable to identify user.");
      return;
    }

    const routes = await listActiveRoutes(senderId);
    if (routes.length === 0) {
      await sendStatusReply(replyToken, "No routes tracked yet. Visit the web app to add routes.");
      return;
    }
    type RouteWithSnapshot = Awaited<ReturnType<typeof listActiveRoutes>>[number];
    const lines = routes.map((r: RouteWithSnapshot) => {
      const latest = r.snapshots[0];
      const price = latest
        ? `${latest.price.toLocaleString()} ${latest.currency}`
        : "No data yet";
      const airline = latest?.airline && latest.airline !== "Unknown"
        ? latest.airline
        : null;
      const checked = latest
        ? latest.scraped_at.toISOString().replace("T", " ").slice(0, 16) + " UTC"
        : "Never";
      const bookingUrl = `https://www.google.com/travel/flights?q=flights+from+${r.origin}+to+${r.destination}+on+${formatDate(r.date_from)}+returning+${formatDate(r.date_to)}&hl=en&curr=USD`;
      return (
        `${r.origin} → ${r.destination}\n` +
        `  Dates: ${formatDate(r.date_from)} – ${formatDate(r.date_to)}\n` +
        `  Price: ${price}${airline ? ` (${airline})` : ""}\n` +
        `  Checked: ${checked}\n` +
        `  Book: ${bookingUrl}`
      );
    });
    await sendStatusReply(
      replyToken,
      `Tracking ${routes.length} route(s):\n\n${lines.join("\n\n")}`
    );
    return;
  }

  await sendStatusReply(
    replyToken,
    "Available commands:\n• status — show your tracked routes and latest prices"
  );
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as CallbackRequest;

  for (const event of body.events) {
    if (
      event.type === "message" &&
      (event as MessageEvent).message?.type === "text"
    ) {
      try {
        await handleTextMessage(
          event as MessageEvent & { message: TextMessageContent }
        );
      } catch (err) {
        console.error("[webhook] handleTextMessage error:", err);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
