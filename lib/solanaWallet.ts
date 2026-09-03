// Thin bridge to the user's own Solana wallet. Axis NEVER holds the key and NEVER
// signs: the backend returns an unsigned transaction, the user's wallet signs and
// submits it, and the backend credits only after that lands on-chain.
//
// FLAG — wallet API assumption: this targets the injected-provider shape used by
// Phantom/Solflare (`window.solana.connect()` + `signAndSendTransaction`), which
// covers the common case with zero extra dependencies. If the app later
// standardizes on `@solana/wallet-adapter-react` (multi-wallet modal, mobile
// deep-linking), only THIS file changes — the funding API client and the backend
// stay exactly as they are.

import { Transaction } from "@solana/web3.js";

interface InjectedSolanaProvider {
  isPhantom?: boolean;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  signAndSendTransaction(tx: Transaction): Promise<{ signature: string }>;
}

function getProvider(): InjectedSolanaProvider {
  const provider = (globalThis as { solana?: InjectedSolanaProvider }).solana;
  if (!provider) {
    throw new Error(
      "No Solana wallet found. Install Phantom (or another Solana wallet) to connect and approve."
    );
  }
  return provider;
}

export function walletAvailable(): boolean {
  return Boolean((globalThis as { solana?: unknown }).solana);
}

/** Prompt the user to connect their wallet; returns their public key (base58). */
export async function connectWallet(): Promise<string> {
  const { publicKey } = await getProvider().connect();
  return publicKey.toString();
}

/**
 * Hand the backend-built (unsigned) transaction to the user's wallet to sign and
 * submit. Returns the transaction signature the wallet reports. This is NOT proof
 * of credit — the backend still credits only after on-chain confirmation.
 */
export async function approveTransfer(transactionBase64: string): Promise<string> {
  const tx = Transaction.from(base64ToBytes(transactionBase64));
  const { signature } = await getProvider().signAndSendTransaction(tx);
  return signature;
}

// Browser-safe base64 decode (no Node Buffer polyfill required).
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
