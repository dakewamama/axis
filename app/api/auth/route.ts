import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, encodeSession } from "@/lib/session";

// Same-origin proxy to brain's email/password auth. brain's URL stays server-only
// (BRAIN_URL, never NEXT_PUBLIC_). Returns { webUserId, email } on success or an
// { error } the form shows.
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
  const mode = b.mode === "signup" ? "signup" : "login";
  const email = typeof b.email === "string" ? b.email : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${BRAIN_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await upstream.json().catch(() => ({}));
    const res = NextResponse.json(data, { status: upstream.status });
    // On success, plant an httpOnly session cookie so the login survives the
    // browser clearing localStorage (common in in-app browsers). The cookie is
    // read back server-side by /api/auth/me to restore the profile.
    const webUserId = (data as { webUserId?: unknown }).webUserId;
    if (upstream.ok && typeof webUserId === "string" && webUserId) {
      res.cookies.set(SESSION_COOKIE, encodeSession(data), {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }
    return res;
  } catch {
    return NextResponse.json({ error: "auth service unreachable" }, { status: 502 });
  }
}
