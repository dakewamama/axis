// The user's Axis configuration, as brain enforces it for every connected app.
export type ServiceSetting = { id: string; label: string; note: string; enabled: boolean };
export type Limits = {
  asset: "USDC";
  tier: number;
  perPaymentMinor: string | null;
  monthlyMinor: string | null;
  tierPerPaymentMinor: string;
  tierMonthlyMinor: string;
};
export type Connection = { id: string; name: string; expiresAt: string };
export type Settings = { services: ServiceSetting[]; limits: Limits; connections: Connection[]; mcpUrl: string | null; spendingPaused: boolean };

async function call(path: string, body?: unknown): Promise<Settings> {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Settings & { error?: string };
  if (!res.ok) throw new Error(data.error || `settings ${res.status}`);
  return data;
}

// USDC has 6 decimals. (BigInt() rather than literals: tsconfig targets below ES2020.)
const MICRO = BigInt(1_000_000);

export const loadSettings = () => call("/api/settings");
export const saveSettings = (patch: { disabledServices?: string[]; perPaymentMinor?: string | null; monthlyMinor?: string | null; spendingPaused?: boolean }) =>
  call("/api/settings", patch);
export const disconnect = (id: string) => call("/api/connections/revoke", { id });

/** "12.5" USDC -> "12500000" base units; null for empty; throws on bad input. */
export function toMinor(usdc: string): string | null {
  const t = usdc.trim();
  if (!t) return null;
  if (!/^\d{1,12}(\.\d{1,6})?$/.test(t)) throw new Error("Enter an amount like 25 or 12.50");
  const [w, f = ""] = t.split(".");
  const v = BigInt(w!) * MICRO + BigInt(f.padEnd(6, "0"));
  if (v <= BigInt(0)) throw new Error("Enter an amount above 0");
  return v.toString();
}

export function fromMinor(minor: string | null): string {
  if (!minor) return "";
  const v = BigInt(minor);
  const f = (v % MICRO).toString().padStart(6, "0").replace(/0+$/, "");
  return `${v / MICRO}${f ? "." + f : ""}`;
}
