import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/session";

// Restore the signed-in profile from the httpOnly session cookie. The client
// calls this on load when localStorage has no session, so a login survives the
// browser dropping localStorage. Returns { webUserId, email, name } or {}.
export async function GET(req: NextRequest) {
  const session = readSession(req);
  if (!session) return NextResponse.json({});
  return NextResponse.json(session);
}
