import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Change one recurring task (/id) or confirm a proposed one (/id/confirm).
export async function POST(req: NextRequest, ctx: RouteContext<"/api/standing/[...path]">) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const [id, action, ...rest] = (await ctx.params).path;
  if (!ID.test(id ?? "") || rest.length || (action !== undefined && action !== "confirm")) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  try {
    const { status, data } = await brain(req, ["standing", id, action].filter(Boolean).join("/"), { body, userToken: session.token });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "recurring tasks are unreachable" }, { status: 502 });
  }
}
