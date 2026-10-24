import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Remove one passkey.
export async function DELETE(req: NextRequest, ctx: RouteContext<"/api/passkeys/[id]">) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const { status, data } = await brain(req, `passkeys/${encodeURIComponent(id)}`, { method: "DELETE", userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "passkeys are unreachable" }, { status: 502 });
  }
}
