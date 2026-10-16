import type { NextRequest } from "next/server";

// Server-only client for brain's /web API. BRAIN_URL and AXIS_WEB_TOKEN are never
// NEXT_PUBLIC_, so neither reaches the browser. User actions also carry the
// user's own brain session token; brain enforces that user's permissions.
const BRAIN_URL = process.env.BRAIN_URL?.replace(/\/$/, "");
const AXIS_WEB_TOKEN = process.env.AXIS_WEB_TOKEN;

export function brainConfigured(): boolean {
  return Boolean(BRAIN_URL && AXIS_WEB_TOKEN && AXIS_WEB_TOKEN.length >= 32);
}

/** Call brain; returns status + parsed JSON, or throws when brain is unreachable. */
export async function brain(
  req: NextRequest,
  path: string,
  options: { body?: unknown; userToken?: string; timeoutMs?: number } = {},
): Promise<{ status: number; data: Record<string, unknown> }> {
  if (!brainConfigured()) throw new Error("brain is not configured");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const res = await fetch(`${BRAIN_URL}/web/${path}`, {
    method: options.body === undefined ? "GET" : "POST",
    headers: {
      "content-type": "application/json",
      "x-axis-web-token": AXIS_WEB_TOKEN!,
      ...(ip ? { "x-axis-client-ip": ip } : {}),
      ...(options.userToken ? { authorization: `Bearer ${options.userToken}` } : {}),
    },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 15000),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, data };
}
