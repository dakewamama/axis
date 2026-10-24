import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Begin enrolling a passkey: brain returns the WebAuthn creation options.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  try {
    const { status, data } = await brain(req, "passkeys/register", { body: {}, userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "passkeys are unreachable" }, { status: 502 });
  }
}
