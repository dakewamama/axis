import { NextRequest, NextResponse } from "next/server";

// Server-only. brain's URL is BRAIN_URL (no NEXT_PUBLIC_ prefix), so it never
// ships to the browser. The client always calls this same-origin route.
const BRAIN_URL = process.env.BRAIN_URL?.replace(/\/$/, "");

export async function POST(req: NextRequest) {
  if (!BRAIN_URL) {
    return NextResponse.json(
      { error: "chat is not configured (set BRAIN_URL)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const b = (body ?? {}) as Record<string, unknown>;
  const userId = typeof b.userId === "string" ? b.userId : "";
  const text = typeof b.text === "string" ? b.text : undefined;
  const buttonId = typeof b.buttonId === "string" ? b.buttonId : undefined;
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${BRAIN_URL}/webhooks/web`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, text, buttonId }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "chat service unreachable" }, { status: 502 });
  }
}
