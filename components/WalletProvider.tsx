"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useOnboarding } from "@/components/OnboardingProvider";

export type Entry = {
  id: string;
  label: string;
  /** Naira for demo activity; USDC decimal string for confirmed deposits. */
  display: string;
  positive: boolean;
  /** True only for entries the backend confirmed on-chain. */
  confirmed: boolean;
  at: number;
};

/**
 * "provisioning" — waiting on the first wallet response.
 * "ready"        — address known.
 * "unavailable"  — the wallet call failed (e.g. proxy not configured); not a
 *                  transient "just a moment", so the UI should say so honestly.
 */
export type WalletStatus = "provisioning" | "ready" | "unavailable";

type WalletState = {
  /** Server-computed NGN estimate of the spendable balance. */
  balance: number;
  /** Spendable USDC as a decimal string, or null until the first read. */
  usdc: string | null;
  /** True once the user's wallet address is known. */
  live: boolean;
  status: WalletStatus;
  entries: Entry[];
  refresh: () => void;
  /** The user's deposit address (USDC on Solana). */
  axisAddress: string;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { hydrated, authMethod, webUserId } = useOnboarding();
  const [address, setAddress] = useState("");
  const [usdc, setUsdc] = useState<string | null>(null);
  const [ngn, setNgn] = useState(0);
  const [status, setStatus] = useState<WalletStatus>("provisioning");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const provisioning = useRef(false);

  const authed = Boolean(hydrated && authMethod && webUserId);

  // Ensure the user's wallet exists and learn its address. Idempotent
  // server-side; retries on the next poll if it fails (e.g. wallet not yet
  // configured). The address is the money key everything else hangs off.
  const ensureWallet = useCallback(async () => {
    if (!authed || address || provisioning.current) return;
    provisioning.current = true;
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: webUserId }),
      });
      const data = (await res.json().catch(() => ({}))) as { address?: string };
      if (res.ok && data.address) {
        setAddress(data.address);
        setStatus("ready");
      } else {
        // Not a transient wait — the wallet path is misconfigured or erroring.
        setStatus("unavailable");
      }
    } catch {
      setStatus("unavailable");
    } finally {
      provisioning.current = false;
    }
  }, [authed, address, webUserId]);

  // Poll spendable balance (deposits minus spends) for the user's wallet.
  const refresh = useCallback(async () => {
    if (!authed) return;
    if (!address) {
      void ensureWallet();
      return;
    }
    try {
      const res = await fetch(
        `/api/wallet?userId=${encodeURIComponent(webUserId)}`,
      );
      if (!res.ok) return;
      const data = (await res.json().catch(() => ({}))) as {
        usdc?: number;
        ngn?: number | null;
      };
      if (typeof data.usdc === "number") setUsdc(data.usdc.toFixed(2));
      if (typeof data.ngn === "number") setNgn(data.ngn);
    } catch {
      // transient — next tick retries
    }
  }, [authed, address, webUserId, ensureWallet]);

  useEffect(() => {
    if (!authed) return;
    void ensureWallet();
  }, [authed, ensureWallet]);

  useEffect(() => {
    if (!authed) return;
    void refresh();
    timer.current = setInterval(() => void refresh(), 8000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [authed, refresh]);

  const live = Boolean(address);
  // No on-chain deposit history endpoint yet; the balance is the source of truth.
  const entries: Entry[] = [];

  return (
    <WalletContext.Provider
      value={{
        balance: ngn,
        usdc,
        live,
        status,
        entries,
        refresh: () => void refresh(),
        axisAddress: address,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
