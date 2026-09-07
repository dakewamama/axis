"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getFundingBalance,
  getDeposits,
  fundingConfigured,
} from "@/lib/funding";

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

type WalletState = {
  balance: number;
  usdc: string | null;
  live: boolean;
  entries: Entry[];
  topUp: (amount: number, label?: string) => void;
  charge: (amount: number, label: string) => void;
  refresh: () => void;
  axisAddress: string;
};

const WalletContext = createContext<WalletState | null>(null);

const NGN = (n: number) => "₦" + n.toLocaleString("en-NG");

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [usdc, setUsdc] = useState<string | null>(null);
  const [deposits, setDeposits] = useState<Entry[]>([]);
  const [local, setLocal] = useState<Entry[]>([]);

  const axisAddress = process.env.NEXT_PUBLIC_AXIS_WALLET_ADDRESS ?? "";
  const live = fundingConfigured && Boolean(axisAddress);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    if (!live) return;
    getFundingBalance(axisAddress)
      .then((b) => setUsdc(b.usdc))
      .catch(() => {});
    getDeposits(axisAddress)
      .then((r) =>
        setDeposits(
          r.deposits.map((d) => ({
            id: d.signature,
            label: "USDC deposit",
            display: `$${d.usdc}`,
            positive: true,
            confirmed: true,
            at: Date.parse(d.at),
          })),
        ),
      )
      .catch(() => {});
  }, [live, axisAddress]);

  useEffect(() => {
    if (!live) return;
    refresh();
    timer.current = setInterval(refresh, 8000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live, refresh]);

  function record(label: string, amount: number, positive: boolean) {
    setLocal((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label,
        display: NGN(Math.abs(amount)),
        positive,
        confirmed: false,
        at: Date.now(),
      },
      ...prev,
    ]);
  }

  const entries = [...deposits, ...local].sort((a, b) => b.at - a.at);

  return (
    <WalletContext.Provider
      value={{
        balance,
        usdc,
        live,
        entries,
        topUp: (amount, label = "Wallet top-up") => {
          setBalance((b) => b + amount);
          record(label, amount, true);
        },
        charge: (amount, label) => {
          setBalance((b) => Math.max(0, b - amount));
          record(label, amount, false);
        },
        refresh,
        axisAddress,
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