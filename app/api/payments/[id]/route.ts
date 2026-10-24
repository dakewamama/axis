import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// A payment request waiting for the signed-in owner's decision (e.g. one asked
// for from ChatGPT or Claude). Approve/Decline go through /api/payments/<id>/decide.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/payments/[id]">) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return NextResponse.json({ error: "not found" }, { status: 404 });
  try {
    const { status, data } = await brain(req, `payments/${id}`, { userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "payments are unreachable" }, { status: 502 });
  }
}
