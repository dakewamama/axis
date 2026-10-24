import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Start a payment (to a saved person, a place, or a typed account). Nothing moves until it is approved.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "payments/request", { body, userToken: session.token, timeoutMs: 30000 });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "payments are unreachable" }, { status: 502 });
  }
}
