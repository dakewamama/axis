"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getFundingBalance, fundingConfigured } from "@/lib/funding";

export type Transaction = {
  id: string;
  label: string;
  amount: number;
  at: number;
};

type WalletState = {
  balance: number;
  usdc: string | null;
  live: boolean;
  transactions: Transaction[];
  topUp: (amount: number, label?: string) => void;
  charge: (amount: number, label: string) => void;
  refreshUsdc: () => void;
  axisAddress: string;
};

const SEED: Transaction[] = [
  { id: "s1", label: "Nadia's Kitchen", amount: -6700, at: Date.now() - 864e5 },
  { id: "s2", label: "Ride to Yaba", amount: -1850, at: Date.now() - 3 * 864e5 },
  { id: "s3", label: "Wallet top-up", amount: 10000, at: Date.now() - 3 * 864e5 },
  { id: "s4", label: "MTN airtime", amount: -1000, at: Date.now() - 4 * 864e5 },
];

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(12400);
  const [transactions, setTransactions] = useState<Transaction[]>(SEED);
  const [usdc, setUsdc] = useState<string | null>(null);

  const axisAddress = process.env.NEXT_PUBLIC_AXIS_WALLET_ADDRESS ?? "";
  const live = fundingConfigured && Boolean(axisAddress);

  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refreshUsdc = useCallback(() => {
    if (!live) return;
    getFundingBalance(axisAddress)
      .then((b) => setUsdc(b.usdc))
      .catch(() => {});
  }, [live, axisAddress]);

  useEffect(() => {
    if (!live) return;
    refreshUsdc();
    timer.current = setInterval(refreshUsdc, 8000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [live, refreshUsdc]);

  function record(label: string, amount: number) {
    setTransactions((prev) => [
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        label,
        amount,
        at: Date.now(),
      },
      ...prev,
    ]);
  }

  return (
    <WalletContext.Provider
      value={{
        balance,
        usdc,
        live,
        transactions,
        topUp: (amount, label = "Wallet top-up") => {
          setBalance((b) => b + amount);
          record(label, amount);
        },
        charge: (amount, label) => {
          setBalance((b) => Math.max(0, b - amount));
          record(label, -amount);
        },
        refreshUsdc,
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