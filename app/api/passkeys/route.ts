import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { readSession } from "@/lib/session";

// The user's passkeys: a device biometric or security key they can use instead
// of the transaction PIN. GET lists them.
export async function GET(req: NextRequest) {
  if (!brainConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const session = readSession(req);
  if (!session) return NextResponse.json({ error: "not signed in" }, { status: 401 });
  try {
    const { status, data } = await brain(req, "passkeys", { userToken: session.token });
    return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "passkeys are unreachable" }, { status: 502 });
  }
}
