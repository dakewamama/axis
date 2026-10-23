// The user's transaction history: Axis payments and requests (brain) merged with
// the wallet's own ledger of deposits and debits (onboarding). Server-assembled.
export type ActivityStatus =
  | "awaiting_approval"
  | "in_progress"
  | "checking"
  | "completed"
  | "failed"
  | "declined"
  | "expired";

export type ActivityItem = {
  id: string;
  kind: "payment" | "airtime" | "deposit" | "other";
  title: string;
  subtitle: string;
  /** Money into the wallet (deposits) or out of it. */
  direction: "in" | "out";
  /** Naira obligation in kobo, when there is one. */
  amountKobo?: string;
  /** USDC base units: the wallet's actual debit or credit, when the wallet recorded it. */
  usdcMinor?: string;
  /** The most the user approved to leave the wallet (USDC base units). */
  maxDebitMinor?: string;
  /** Token that funded a payout, or that was deposited. */
  asset?: "USDC" | "SOL";
  lamports?: string;
  status: ActivityStatus;
  note: string;
  at: string;
  approvalId?: string;
  /** Solana transaction signature, for deposits. */
  signature?: string;
};

export type TimelineEntry = { at: string; text: string; proof?: string };

export const STATUS: Record<ActivityStatus, { label: string; tone: string }> = {
  awaiting_approval: { label: "Needs you", tone: "bg-red-tint text-red-deep" },
  checking: { label: "Checking", tone: "bg-amber/20 text-ink" },
  in_progress: { label: "In progress", tone: "bg-line text-muted" },
  completed: { label: "Done", tone: "bg-ink text-white" },
  failed: { label: "Didn't go through", tone: "bg-line text-faint" },
  declined: { label: "Declined", tone: "bg-line text-faint" },
  expired: { label: "Expired", tone: "bg-line text-faint" },
};

const MICRO = BigInt(1_000_000);
const HUNDRED = BigInt(100);
const BILLION = BigInt(1_000_000_000);

export function usdc(minor: string): string {
  const v = BigInt(minor);
  const cents = (v % MICRO) / BigInt(10_000);
  return `${(v / MICRO).toLocaleString("en-NG")}.${cents.toString().padStart(2, "0")} USDC`;
}

export function naira(kobo: string): string {
  const v = BigInt(kobo);
  const rest = v % HUNDRED;
  return `₦${(v / HUNDRED).toLocaleString("en-NG")}${rest ? "." + rest.toString().padStart(2, "0") : ""}`;
}

export function sol(lamports: string): string {
  const v = BigInt(lamports);
  const frac = (v % BILLION).toString().padStart(9, "0").replace(/0+$/, "").slice(0, 4);
  return `${v / BILLION}${frac ? "." + frac : ""} SOL`;
}

/** The headline amount of an item: naira when it is a naira obligation, else the USDC value. */
export function amountOf(i: ActivityItem): string {
  const sign = i.direction === "in" ? "+" : "−";
  if (i.amountKobo) return `${sign}${naira(i.amountKobo)}`;
  if (i.usdcMinor) return `${sign}${usdc(i.usdcMinor)}`;
  return "";
}

export function explorer(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}

export async function loadActivity(): Promise<ActivityItem[]> {
  const res = await fetch("/api/activity", { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { items?: ActivityItem[]; error?: string };
  if (!res.ok) throw new Error(data.error || "Couldn't load your activity.");
  return data.items ?? [];
}

export async function loadActivityItem(id: string): Promise<{ item: ActivityItem; timeline: TimelineEntry[] }> {
  const res = await fetch(`/api/activity/${encodeURIComponent(id)}`, { cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as { item?: ActivityItem; timeline?: TimelineEntry[]; error?: string };
  if (!res.ok || !data.item) throw new Error(res.status === 404 ? "This isn't in your activity." : data.error || "Couldn't load this.");
  return { item: data.item, timeline: data.timeline ?? [] };
}
