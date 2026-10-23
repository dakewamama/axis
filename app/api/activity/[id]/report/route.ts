import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Report a problem with one item of the user's history.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/activity/[id]/report">) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  try {
    const { status, data } = await brain(req, `activity/${encodeURIComponent(id)}/report`, { body, userToken: session.token });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "support is unreachable" }, { status: 502 });
  }
}
