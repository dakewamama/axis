"use client";

import { createContext, useContext, useState } from "react";

type WalletState = {
  balance: number;
  topUp: (amount: number) => void;
  charge: (amount: number) => void;
  /**
   * The user's Axis wallet address (Solana owner pubkey) — the destination for
   * USDC funding. FLAG: in this prototype it comes from
   * NEXT_PUBLIC_AXIS_WALLET_ADDRESS. In production it is the authenticated user's
   * custodial pubkey from the onboarding custody server (getUserPublicKey), set
   * at sign-in. Empty string until configured.
   */
  axisAddress: string;
};

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(12400);
  const axisAddress = process.env.NEXT_PUBLIC_AXIS_WALLET_ADDRESS ?? "";

  return (
    <WalletContext.Provider
      value={{
        balance,
        topUp: (amount) => setBalance((b) => b + amount),
        charge: (amount) => setBalance((b) => Math.max(0, b - amount)),
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