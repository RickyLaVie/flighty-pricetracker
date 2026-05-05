import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const state = crypto.randomUUID();
  session.oauthState = state;
  await session.save();

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/auth/line/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
    redirect_uri: redirectUri,
    state,
    scope: "profile",
  });

  return NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?${params}`
  );
}
