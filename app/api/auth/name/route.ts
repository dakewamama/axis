import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession, setSessionCookie } from "@/lib/session";

// Persist the display name onto the signed-in account through brain, which
// identifies the user from their session token, never from the request body.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) {
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
  const b = (body ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "name", { body: { name }, userToken: session.token });
    const res = NextResponse.json(data, { status });
    // Keep the cookie's name in sync so a cookie-restored profile shows it.
    if (status === 200) setSessionCookie(res, { ...session, name: name.slice(0, 80) });
    return res;
  } catch {
    return NextResponse.json({ error: "auth service unreachable" }, { status: 502 });
  }
}
