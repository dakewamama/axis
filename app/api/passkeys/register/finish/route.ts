import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// Finish enrolling a passkey: the signed attestation from the user's device.
export async function POST(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  try {
    const { status, data } = await brain(req, "passkeys/register/finish", { body, userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "passkeys are unreachable" }, { status: 502 });
  }
}
