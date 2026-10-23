import { NextRequest, NextResponse } from "next/server";
import { brain } from "@/lib/brain";
import { readSession } from "@/lib/session";
import { activityFor } from "@/lib/activityServer";

// One history item and its timeline. Deposits and wallet debits come from the
// wallet's ledger; Axis payments and requests carry brain's timeline with proof.
export async function GET(req: NextRequest, ctx: RouteContext<"/api/activity/[id]">) {
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const item = (await activityFor(req, session.webUserId, session.token)).find((i) => i.id === id);
    if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (item.kind === "deposit" || id.startsWith("debit:")) {
      return NextResponse.json({ item, timeline: [{ at: item.at, text: item.note, ...(item.signature ? { proof: item.signature } : {}) }] });
    }
    const { status, data } = await brain(req, `activity/${encodeURIComponent(id)}`, { userToken: session.token });
    if (status !== 200) return NextResponse.json(data, { status });
    return NextResponse.json(
      { item, timeline: data.timeline ?? [], reports: data.reports ?? [], reasons: data.reasons ?? {} },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "activity is unreachable" }, { status: 502 });
  }
}
