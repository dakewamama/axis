import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { clearSessionCookie, readSession } from "@/lib/session";

// Revoke the brain session, then clear the cookie. The cookie is cleared even if
// brain is unreachable; the brain session then expires on its own.
export async function POST(req: NextRequest) {
  const session = readSession(req);
  if (session && brainConfigured()) {
    await brain(req, "logout", { body: {}, userToken: session.token }).catch(() => undefined);
  }
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
