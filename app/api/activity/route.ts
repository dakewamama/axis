import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";
import { activityFor } from "@/lib/activityServer";

// The signed-in user's transaction history (payments, requests, deposits, debits).
export async function GET(req: NextRequest) {
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  try {
    const items = await activityFor(req, session.webUserId, session.token);
    return NextResponse.json({ items }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "activity is unreachable" }, { status: 502 });
  }
}
