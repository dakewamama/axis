import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Approve (with the transaction PIN) or decline a payment request.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/payments/[id]/decide">) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  try {
    const { status, data } = await brain(req, `payments/${id}/decide`, { body, userToken: session.token, timeoutMs: 60000 });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "payments are unreachable" }, { status: 502 });
  }
}
