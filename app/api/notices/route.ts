import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Updates about the user's payments that reached an outcome after they last saw them.
export async function GET(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ notices: [] });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const since = req.nextUrl.searchParams.get("since") ?? "";
  try {
    const { status, data } = await brain(req, `notices?since=${encodeURIComponent(since)}`, { userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "updates are unreachable" }, { status: 502 });
  }
}
