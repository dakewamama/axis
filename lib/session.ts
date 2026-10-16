import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

// The Axis session cookie: the account's public profile (webUserId, email,
// name) plus an HMAC signature, so it cannot be forged or edited. It's httpOnly
// and server-only. Routes that act for a user take the webUserId from here,
// never from the request body or query.

export const SESSION_COOKIE = "axis_session";

export type Session = {
  webUserId: string;
  email: string;
  name: string;
};

/** Signing key from AXIS_SESSION_SECRET (32+ chars). Without it, no session is issued or accepted. */
function secret(): string | null {
  const value = process.env.AXIS_SESSION_SECRET;
  return value && value.length >= 32 ? value : null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function sessionsConfigured(): boolean {
  return secret() !== null;
}

export function encodeSession(data: {
  webUserId?: unknown;
  email?: unknown;
  name?: unknown;
}): string {
  const key = secret();
  if (!key) throw new Error("AXIS_SESSION_SECRET is not configured");
  const s: Session = {
    webUserId: typeof data.webUserId === "string" ? data.webUserId : "",
    email: typeof data.email === "string" ? data.email : "",
    name: typeof data.name === "string" ? data.name : "",
  };
  const payload = Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

export function decodeSession(value: string | undefined): Session | null {
  const key = secret();
  if (!value || !key) return null;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expected = Buffer.from(sign(payload, key));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<Session>;
    if (!s || typeof s.webUserId !== "string" || !s.webUserId) return null;
    return {
      webUserId: s.webUserId,
      email: typeof s.email === "string" ? s.email : "",
      name: typeof s.name === "string" ? s.name : "",
    };
  } catch {
    return null;
  }
}

export function readSession(req: NextRequest): Session | null {
  return decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(res: NextResponse, session: Parameters<typeof encodeSession>[0]): void {
  res.cookies.set(SESSION_COOKIE, encodeSession(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
