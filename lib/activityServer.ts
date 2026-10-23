import type { NextRequest } from "next/server";
import { brain, brainConfigured } from "@/lib/brain";
import type { ActivityItem, ActivityStatus } from "@/lib/activity";

// Server-only: assembles the history from brain and the onboarding wallet ledger.
const ONBOARDING_URL = process.env.ONBOARDING_URL?.replace(/\/$/, "");
const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN;

type BrainItem = Omit<ActivityItem, "direction" | "usdcMinor" | "asset"> & {
  kind: "payment" | "airtime" | "other";
  fundingAsset?: "USDC" | "SOL";
  ledgerKey?: string;
};
type Deposit = { id: string; signature: string; asset: "USDC" | "SOL"; usdcMinor: string; lamports?: string; at: string };
type Debit = { key: string; usdcMinor: string; reason: string; state: string; at: string };
type WalletRecord = { deposits: Deposit[]; debits: Debit[] };

const DEBIT_STATUS: Record<string, ActivityStatus> = {
  SETTLED: "completed",
  RELEASED: "failed",
  REVERSED: "failed",
  IN_DOUBT: "checking",
  PENDING: "in_progress",
};

async function walletRecord(userId: string): Promise<WalletRecord | null> {
  if (!ONBOARDING_URL || !INTERNAL_API_TOKEN) return null;
  try {
    const res = await fetch(`${ONBOARDING_URL}/wallet/activity?userId=${encodeURIComponent(userId)}`, {
      headers: { authorization: `Bearer ${INTERNAL_API_TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });
    return res.ok ? ((await res.json()) as WalletRecord) : null;
  } catch {
    return null;
  }
}

function fromBrain(b: BrainItem, debits: Map<string, Debit>): ActivityItem {
  const { fundingAsset, ledgerKey, ...rest } = b;
  const debit = ledgerKey ? debits.get(ledgerKey) : undefined;
  return {
    ...rest,
    direction: "out",
    ...(debit ? { usdcMinor: debit.usdcMinor } : {}),
    ...(fundingAsset ? { asset: fundingAsset } : {}),
  };
}

function fromDeposit(d: Deposit): ActivityItem {
  return {
    id: `deposit:${d.id}`,
    kind: "deposit",
    title: "Added to your wallet",
    subtitle: d.asset === "SOL" ? "SOL deposit, valued in USDC when it arrived" : "USDC deposit",
    direction: "in",
    usdcMinor: d.usdcMinor,
    asset: d.asset,
    ...(d.lamports ? { lamports: d.lamports } : {}),
    status: "completed",
    note: "Credited once it was final on Solana.",
    at: d.at,
    signature: d.signature,
  };
}

function fromDebit(d: Debit): ActivityItem {
  const airtime = /airtime/i.test(d.reason);
  const status = DEBIT_STATUS[d.state] ?? "in_progress";
  return {
    id: `debit:${d.key}`,
    kind: airtime ? "airtime" : "other",
    title: airtime ? "Airtime" : d.reason.charAt(0).toUpperCase() + d.reason.slice(1),
    subtitle: "From your wallet",
    direction: "out",
    usdcMinor: d.usdcMinor,
    status,
    note:
      status === "checking"
        ? "Axis is confirming the outcome with the provider. It will not charge twice."
        : status === "failed"
          ? "It did not go through. The money is back in your wallet."
          : status === "completed"
            ? "Done."
            : "In progress.",
    at: d.at,
  };
}

/** The user's full history, newest first. Throws only when brain is unreachable. */
export async function activityFor(req: NextRequest, userId: string, token: string): Promise<ActivityItem[]> {
  if (!brainConfigured()) throw new Error("not configured");
  const [{ status, data }, wallet] = await Promise.all([brain(req, "activity", { userToken: token }), walletRecord(userId)]);
  if (status !== 200) throw new Error(`brain ${status}`);
  const debits = new Map((wallet?.debits ?? []).map((d) => [d.key, d]));
  const brainItems = (data.items as BrainItem[]) ?? [];
  const claimed = new Set(brainItems.map((b) => b.ledgerKey).filter(Boolean));
  const items = [
    ...brainItems.map((b) => fromBrain(b, debits)),
    ...(wallet?.deposits ?? []).map(fromDeposit),
    ...(wallet?.debits ?? []).filter((d) => !claimed.has(d.key)).map(fromDebit),
  ];
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
