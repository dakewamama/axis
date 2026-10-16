import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Disconnect a connected AI app (ChatGPT, Claude…) from the signed-in account.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const b = ((await req.json().catch(() => null)) ?? {}) as Record<string, unknown>;
  if (typeof b.id !== "string" || !b.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "connections/revoke", { body: { id: b.id.slice(0, 100) }, userToken: session.token });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "settings service unreachable" }, { status: 502 });
  }
}
