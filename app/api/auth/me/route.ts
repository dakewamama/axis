import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decodeSession } from "@/lib/session";

// Restore the signed-in profile from the httpOnly session cookie. The client
// calls this on load when localStorage has no session, so a login survives the
// browser dropping localStorage. Returns { webUserId, email, name } or {}.
export async function GET(req: NextRequest) {
  const session = decodeSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({});
  return NextResponse.json(session);
}
