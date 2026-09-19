import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

// Clear the session cookie. Called from the client's reset()/sign-out.
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
