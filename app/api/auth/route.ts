import { NextRequest, NextResponse } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import { sessionsConfigured, setSessionCookie } from "@/lib/session";

// Same-origin proxy to brain's email/password accounts. On success brain returns
// the account and a session token; the token goes only into the signed httpOnly
// cookie, and the browser gets { webUserId, email, name } or an { error }.
export async function POST(req: NextRequest) {
  if (!brainConfigured() || !sessionsConfigured()) {
    return NextResponse.json({ error: "auth is not configured" }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const mode = b.mode === "signup" ? "signup" : "login";
  const email = typeof b.email === "string" ? b.email : "";
  const password = typeof b.password === "string" ? b.password : "";
  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }
  try {
    const { status, data } = await brain(req, mode, { body: { email, password } });
    if (status !== 200 || typeof data.token !== "string" || typeof data.webUserId !== "string") {
      return NextResponse.json({ error: data.error ?? "sign-in failed", code: data.code }, { status: status === 200 ? 502 : status });
    }
    const res = NextResponse.json({ webUserId: data.webUserId, email: data.email, name: data.name ?? "" });
    setSessionCookie(res, data);
    return res;
  } catch {
    return NextResponse.json({ error: "auth service unreachable" }, { status: 502 });
  }
}
