import { NextRequest, NextResponse } from "next/server";

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
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "auth service unreachable" }, { status: 502 });
  }
}
