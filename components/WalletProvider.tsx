"use client";

import { createContext, useContext, useState } from "react";

type WalletState = {
  balance: number;
  topUp: (amount: number) => void;
  charge: (amount: number) => void;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(12400);

  return (
    <WalletContext.Provider
      value={{
        balance,
        topUp: (amount) => setBalance((b) => b + amount),
        charge: (amount) => setBalance((b) => Math.max(0, b - amount)),
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