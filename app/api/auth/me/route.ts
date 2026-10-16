import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { clearSessionCookie, publicProfile, readSession } from "@/lib/session";

// Restore the signed-in profile from the httpOnly session cookie. brain confirms
// the session is still valid (not logged out elsewhere or expired). Returns
// { webUserId, email, name } or {}.
export async function GET(req: NextRequest) {
  const session = readSession(req);
  if (!session) return NextResponse.json({});
  if (brainConfigured()) {
    try {
      const { status } = await brain(req, "me", { userToken: session.token });
      if (status === 401) {
        const res = NextResponse.json({});
        clearSessionCookie(res);
        return res;
      }
    } catch {
      // brain unreachable: keep the profile; actions will fail until it is back.
    }
  }
  return NextResponse.json(publicProfile(session));
}
