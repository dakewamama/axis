import { NextRequest, NextResponse } from "next/server";

// Same-origin proxy to the onboarding service's /wallet (idempotent). ONBOARDING_URL
// and INTERNAL_API_TOKEN are read only here on the server, never shipped to the
// browser and never NEXT_PUBLIC_.
const ONBOARDING_URL = process.env.ONBOARDING_URL?.replace(/\/$/, "");
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;

export async function POST(req: NextRequest) {
  if (!ONBOARDING_URL || !INTERNAL_API_TOKEN) {
    return NextResponse.json(
      { error: "wallet is not configured (set ONBOARDING_URL + INTERNAL_API_TOKEN)" },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const userId = typeof (body as { userId?: unknown })?.userId === "string"
    ? (body as { userId: string }).userId
    : "";
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${ONBOARDING_URL}/wallet`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${INTERNAL_API_TOKEN}`,
      },
      body: JSON.stringify({ userId }),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "wallet service unreachable" }, { status: 502 });
  }
}
