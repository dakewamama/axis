// Client for the onboarding crypto-funding API (USDC on Solana). The backend is
// the live payments layer in `onboarding/payments`; this file only talks to it
// over HTTP. It never sees a private key and never credits a balance — crediting
// happens server-side, only after on-chain confirmation.

const API = process.env.NEXT_PUBLIC_FUNDING_API?.replace(/\/$/, "");

export interface DepositAddress {
  owner: string;
  usdcAta: string;
  mint: string;
  qr: string; // Solana Pay URI
  requiredCommitment: string;
}

export interface FundingBalance {
  owner: string;
  usdc: string; // canonical decimal string
  baseUnits: string;
}

export interface BuiltTransfer {
  transactionBase64: string;
  destinationAta: string;
  baseUnits: string;
  amountUsdc: string;
  mint: string;
}

/**
 * One backend-confirmed on-chain deposit. The payments service converts base
 * units to `usdc` (a canonical decimal string) server-side, so the client never
 * does float money math — it displays this string verbatim.
 */
export interface CreditRecord {
  signature: string;
  usdc: string; // canonical decimal string, already converted server-side
  at: string; // ISO timestamp of crediting
}

export interface DepositsResponse {
  owner: string;
  deposits: CreditRecord[];
}

function base(): string {
  if (!API) {
    throw new Error(
      "Crypto funding is not configured. Set NEXT_PUBLIC_FUNDING_API to the payments service URL."
    );
  }
  return API;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return unwrap<T>(res);
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`);
  return unwrap<T>(res);
}

async function unwrap<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    throw new Error((data as { error?: string }).error ?? `funding API ${res.status}`);
  }
  return data as T;
}

/** Issue (idempotently) the user's deposit address and arm the on-chain watch. */
export function getDepositAddress(owner: string): Promise<DepositAddress> {
  return post<DepositAddress>("/funding/address", { owner });
}

/** Durably-credited USDC balance for the user's Axis wallet. */
export function getFundingBalance(owner: string): Promise<FundingBalance> {
  return get<FundingBalance>(`/funding/balance?owner=${encodeURIComponent(owner)}`);
}

/** Backend-confirmed on-chain deposit history, newest first. */
export function getDeposits(owner: string): Promise<DepositsResponse> {
  return get<DepositsResponse>(`/funding/deposits?owner=${encodeURIComponent(owner)}`);
}

/** Build an UNSIGNED USDC transfer for the user's wallet to approve. */
export function buildTransfer(
  fromWallet: string,
  owner: string,
  amountUsdc: string
): Promise<BuiltTransfer> {
  return post<BuiltTransfer>("/funding/build-transfer", {
    fromWallet,
    owner,
    amountUsdc,
  });
}

export const fundingConfigured = Boolean(API);
