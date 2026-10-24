import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Begin a passkey step-up: brain returns the WebAuthn request options the user
// signs to approve money movement. The signed assertion goes with the action
// itself (as `passkey`), not back here.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  try {
    const { status, data } = await brain(req, "passkeys/auth", { body: {}, userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "passkeys are unreachable" }, { status: 502 });
  }
}
