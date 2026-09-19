// The Axis session cookie. It holds only the account's public profile
// (webUserId, email, name) — no password, no secret — so the login can be
// restored when the browser drops localStorage. It's httpOnly (set on the
// server, invisible to page JS). The webUserId is an unguessable UUID and the
// wallet layer already keys off it, so this carries no more trust than the
// localStorage it backs up.

export const SESSION_COOKIE = "axis_session";

export type Session = {
  webUserId: string;
  email: string;
  name: string;
};

export function encodeSession(data: {
  webUserId?: unknown;
  email?: unknown;
  name?: unknown;
}): string {
  const s: Session = {
    webUserId: typeof data.webUserId === "string" ? data.webUserId : "",
    email: typeof data.email === "string" ? data.email : "",
    name: typeof data.name === "string" ? data.name : "",
  };
  return Buffer.from(JSON.stringify(s), "utf8").toString("base64url");
}

export function decodeSession(value: string | undefined): Session | null {
  if (!value) return null;
  try {
    const s = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    ) as Partial<Session>;
    if (!s || typeof s.webUserId !== "string" || !s.webUserId) return null;
    return {
      webUserId: s.webUserId,
      email: typeof s.email === "string" ? s.email : "",
      name: typeof s.name === "string" ? s.name : "",
    };
  } catch {
    return null;
  }
}
