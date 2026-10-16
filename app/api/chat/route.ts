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
  // Button taps (e.g. Approve/Decline on a payment) go to brain as buttonId:
  // brain handles payment decisions in fixed code, never through the model.
  const buttonId = typeof b.buttonId === "string" && b.buttonId ? b.buttonId.slice(0, 100) : "";
  const text = typeof b.text === "string" ? b.text.trim().slice(0, 2000) : "";
  if (!text && !buttonId) return NextResponse.json({ error: "text is required" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "chat", { body: buttonId ? { buttonId } : { text }, userToken: session.token, timeoutMs: 60000 });
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json({ error: "chat service unreachable" }, { status: 502 });
  }
}
