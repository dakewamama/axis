import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Precise device location for the signed-in user; brain keeps it 15 minutes.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
  const body = { latitude: num(b.latitude), longitude: num(b.longitude), accuracyM: num(b.accuracyM) };
  if (Object.values(body).some(Number.isNaN)) return NextResponse.json({ error: "invalid location" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "location", { body, userToken: session.token });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "location service unreachable" }, { status: 502 });
  }
}
