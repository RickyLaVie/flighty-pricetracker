import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(req: Request) {
  const session = await getSession();
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/?login_error=denied`);
  }

  if (!session.oauthState || state !== session.oauthState) {
    return NextResponse.redirect(`${baseUrl}/?login_error=csrf`);
  }

  const redirectUri = `${baseUrl}/api/auth/line/callback`;

  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: process.env.LINE_LOGIN_CHANNEL_ID!,
      client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET!,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[line/callback] token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(`${baseUrl}/?login_error=token`);
  }

  const { access_token } = await tokenRes.json();

  const profileRes = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(`${baseUrl}/?login_error=profile`);
  }

  const profile = await profileRes.json();

  session.userId = profile.userId;
  session.displayName = profile.displayName;
  session.pictureUrl = profile.pictureUrl;
  delete session.oauthState;
  await session.save();

  return NextResponse.redirect(`${baseUrl}/`);
}
