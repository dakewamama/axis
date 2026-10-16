import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

// Server-only. brain's URL is BRAIN_URL (no NEXT_PUBLIC_ prefix), so it never
// ships to the browser. The client always calls this same-origin route.
const BRAIN_URL = process.env.BRAIN_URL?.replace(/\/$/, "");
// brain's POST /webhooks/web bearer token; held server-side only.
const WEB_WEBHOOK_TOKEN = process.env.WEB_WEBHOOK_TOKEN;

export async function POST(req: NextRequest) {
  if (!BRAIN_URL || !WEB_WEBHOOK_TOKEN) {
    return NextResponse.json(
      { error: "chat is not configured (set BRAIN_URL and WEB_WEBHOOK_TOKEN)" },
      { status: 503 },
    );
  }
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const userId = session.webUserId;
  const userName = typeof b.userName === "string" ? b.userName : undefined;
  const text = typeof b.text === "string" ? b.text : undefined;
  const buttonId = typeof b.buttonId === "string" ? b.buttonId : undefined;

  try {
    const upstream = await fetch(`${BRAIN_URL}/webhooks/web`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${WEB_WEBHOOK_TOKEN}` },
      body: JSON.stringify({ userId, userName, text, buttonId }),
      signal: AbortSignal.timeout(30000),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "chat service unreachable" }, { status: 502 });
  }
}
