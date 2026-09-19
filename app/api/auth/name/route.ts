import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decodeSession, encodeSession } from "@/lib/session";

// Same-origin proxy to brain's /auth/name. Persists the display name onto the
// account (keyed by webUserId) so login restores the profile. brain's URL stays
// server-only (BRAIN_URL, never NEXT_PUBLIC_).
const BRAIN_URL = process.env.BRAIN_URL?.replace(/\/$/, "");

export async function POST(req: NextRequest) {
  if (!BRAIN_URL) {
    return NextResponse.json({ error: "auth is not configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const webUserId = typeof b.webUserId === "string" ? b.webUserId : "";
  const name = typeof b.name === "string" ? b.name : "";
  if (!webUserId || !name.trim()) {
    return NextResponse.json({ error: "webUserId and name are required" }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${BRAIN_URL}/auth/name`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ webUserId, name }),
    });
    const data = await upstream.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: upstream.status });
    // Keep the session cookie's name in sync so a cookie-restored profile shows
    // the name the user just set (not the "" from signup).
    if (upstream.ok) {
      const current = decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
      if (current && current.webUserId === webUserId) {
        res.cookies.set(SESSION_COOKIE, encodeSession({ ...current, name }), {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 24 * 365,
        });
      }
    }
    return res;
  } catch {
    return NextResponse.json({ error: "auth service unreachable" }, { status: 502 });
  }
}
