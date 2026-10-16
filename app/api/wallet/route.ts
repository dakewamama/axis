import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

// Same-origin proxy to the onboarding service's /wallet (idempotent). ONBOARDING_URL
// and INTERNAL_API_TOKEN are read only here on the server, never shipped to the
// browser and never NEXT_PUBLIC_. The user is always the verified session's
// webUserId; a userId in the query or body is ignored.
const ONBOARDING_URL = process.env.ONBOARDING_URL?.replace(/\/$/, "");
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;

// Spendable balance (deposits minus spends) + NGN estimate for the user's wallet.
export async function GET(req: NextRequest) {
  if (!ONBOARDING_URL || !INTERNAL_API_TOKEN) {
    return NextResponse.json(
      { error: "wallet is not configured (set ONBOARDING_URL + INTERNAL_API_TOKEN)" },
      { status: 503 },
    );
  }
  const userId = readSession(req)?.webUserId;
  if (!userId) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }
  try {
    const upstream = await fetch(
      `${ONBOARDING_URL}/wallet/balance?userId=${encodeURIComponent(userId)}`,
      { headers: { authorization: `Bearer ${INTERNAL_API_TOKEN}` }, signal: AbortSignal.timeout(15000) },
    );
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "wallet service unreachable" }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  if (!ONBOARDING_URL || !INTERNAL_API_TOKEN) {
    return NextResponse.json(
      { error: "wallet is not configured (set ONBOARDING_URL + INTERNAL_API_TOKEN)" },
      { status: 503 },
    );
  }

  const userId = readSession(req)?.webUserId;
  if (!userId) {
    return NextResponse.json({ error: "not signed in" }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${ONBOARDING_URL}/wallet`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${INTERNAL_API_TOKEN}`,
      },
      body: JSON.stringify({ userId }),
      signal: AbortSignal.timeout(15000),
    });
    const data = await upstream.json().catch(() => ({}));
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: "wallet service unreachable" }, { status: 502 });
  }
}
