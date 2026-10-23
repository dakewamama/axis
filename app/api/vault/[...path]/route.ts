import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

const SECTIONS = new Set(["beneficiaries", "addresses", "phones"]);
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Create (/section), update (/section/id) or delete (/section/id/delete) a saved entry.
export async function POST(req: NextRequest, ctx: RouteContext<"/api/vault/[...path]">) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const [section, id, action, ...rest] = (await ctx.params).path;
  const valid =
    SECTIONS.has(section ?? "") &&
    rest.length === 0 &&
    (id === undefined || ID.test(id)) &&
    (action === undefined || (action === "delete" && id !== undefined));
  if (!valid) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  try {
    const path = ["vault", section, id, action].filter(Boolean).join("/");
    const { status, data } = await brain(req, path, { body, userToken: session.token });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "saved details are unreachable" }, { status: 502 });
  }
}
