import { getIronSession, type IronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  oauthState?: string;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD ?? "flighty-iron-session-default-key-change-me!",
  cookieName: "flighty-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
