import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// The Axis place the user is at: from a scanned tag code, or their latest precise location.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  const code = typeof b.code === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(b.code) ? b.code : undefined;
  try {
    const { status, data } = await brain(req, "place", { body: code ? { code } : {}, userToken: session.token });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "place service unreachable" }, { status: 502 });
  }
}
