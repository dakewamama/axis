import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Same-origin proxy to brain's web chat. brain runs the assistant under the
// signed-in user's own session, so it can only do what that account may do.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) {
    return NextResponse.json({ error: "chat is not configured (set BRAIN_URL and AXIS_WEB_TOKEN)" }, { status: 503 });
  }
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  // Button taps arrive as buttonId; the assistant reads them as the user's text.
  const text = typeof b.text === "string" && b.text.trim() ? b.text : typeof b.buttonId === "string" ? b.buttonId : "";
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "chat", { body: { text: text.slice(0, 2000) }, userToken: session.token, timeoutMs: 60000 });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "chat service unreachable" }, { status: 502 });
  }
}
