// Recurring tasks (scheduled payments to saved people, rate alerts), stored and run by brain.
import { usdc } from "@/lib/activity";
export type Schedule =
  | { every: "month"; day: number }
  | { every: "week"; weekday: number }
  | { every: "year"; month: number; day: number }
  | { every: "days"; n: number };

export type StandingOrder = {
  id: string;
  kind: "pay" | "rate_alert";
  label: string;
  status: "proposed" | "active" | "paused" | "ended";
  mode: "ask" | "auto";
  autoMaxMinor: string | null;
  schedule: Schedule | null;
  spec: { beneficiaryId?: string; amountNaira?: string; purpose?: string; direction?: "above" | "below"; ngnPerUsdc?: number };
  nextRunAt: string | null;
  runsLeft: number | null;
  source: "user" | "assistant";
  autoUntil: string | null;
  autoTotalMinor: string | null;
  autoUsedMinor: string;
  originText: string | null;
  autoRuns: number;
  lastRun: { dueAt: string; outcome: string; detail: string } | null;
};

async function call(path: string, body?: unknown): Promise<StandingOrder[]> {
  const res = await fetch(path, body === undefined ? { cache: "no-store" } : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { orders?: StandingOrder[]; error?: string };
  if (!res.ok) throw new Error(data.error || `Couldn't reach recurring tasks (${res.status}).`);
  return data.orders ?? [];
}

export const loadStanding = () => call("/api/standing");
export const createStanding = (body: Record<string, unknown>) => call("/api/standing", body);
/** Auto-pay terms: most per payment, when it ends, and an optional total allowance (USDC base units). */
export type AutoTerms = { autoMaxMinor: string | null; autoUntil?: string; autoTotalMinor?: string | null };

export const confirmStanding = (id: string, terms: AutoTerms) => call(`/api/standing/${id}/confirm`, terms);
export const updateStanding = (id: string, body: { action: "pause" | "resume" | "end" | "set_auto" } & Partial<AutoTerms>) =>
  call(`/api/standing/${id}`, body);

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ordinal = (n: number) => `${n}${n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th"}`;

export function describeSchedule(s: Schedule): string {
  if (s.every === "month") return `Every month on the ${ordinal(s.day)}`;
  if (s.every === "week") return `Every ${WEEKDAYS[s.weekday]}`;
  if (s.every === "year") return `Every year on ${s.day} ${MONTHS[s.month - 1]}`;
  return s.n === 1 ? "Every day" : `Every ${s.n} days`;
}

export { WEEKDAYS, MONTHS };

/** "auto-pay up to 110.00 USDC each, 10.30 of 300.00 used, until 24 Apr" */
export function autoSummary(o: StandingOrder): string {
  const until = o.autoUntil ? new Date(o.autoUntil).toLocaleDateString("en-NG", { timeZone: "Africa/Lagos", day: "numeric", month: "short", year: "numeric" }) : "";
  const total = o.autoTotalMinor ? `, ${usdc(o.autoUsedMinor)} of ${usdc(o.autoTotalMinor)} used` : "";
  return `auto-pay up to ${usdc(o.autoMaxMinor!)} each${total}${until ? `, until ${until}` : ""}`;
}

