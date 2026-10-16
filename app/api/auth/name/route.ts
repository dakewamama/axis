import { NextRequest, NextResponse } from "next/server";
import { readSession, setSessionCookie } from "@/lib/session";

// Same-origin proxy to brain's /auth/name. Persists the display name onto the
// signed-in account (webUserId from the verified session, never the body). brain's URL stays
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
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const webUserId = session.webUserId;
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name : "";
  if (!name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
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
    if (upstream.ok) setSessionCookie(res, { ...session, name });
    return res;
  } catch {
    return NextResponse.json({ error: "auth service unreachable" }, { status: 502 });
  }
}
