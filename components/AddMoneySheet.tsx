"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Sheet } from "@/components/Sheet";
import { useWallet } from "@/components/WalletProvider";

// The QR generator is ~285 KB. Load it only when the deposit view actually
// mounts (a user interaction), never in the initial /home bundle.
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[168px] w-[168px] items-center justify-center text-[12px] text-faint">
        Loading QR…
      </div>
    ),
  },
);

// USDC mint on Solana mainnet. Encoding it in the Solana Pay URI lets wallets
// pre-select USDC instead of SOL when they scan.
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/**
 * Fund the Axis wallet with USDC on Solana. The wallet is tied to the account,
 * so funding is simply "send USDC to your address" — from any wallet or
 * exchange. The balance is credited server-side, only after on-chain
 * confirmation; this UI never asserts a credit, it just shows the address.
 */
export function AddMoneySheet({
  open,
  onClose,
  axisAddress,
}: {
  open: boolean;
  onClose: () => void;
  axisAddress: string;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pt-2.5 pb-1">
        <span className="block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          Add money
        </span>
        <span className="mt-1 block text-[12.5px] text-faint">
          Send USDC on Solana to your Axis wallet. It’s credited automatically
          once the transfer confirms on-chain.
        </span>
      </div>

      {!axisAddress ? (
        <div className="px-5 pt-4 pb-7">
          <p className="rounded-2xl bg-white px-4 py-4 text-[13px] text-faint shadow-card">
            Setting up your wallet… this takes a moment after you sign in. If it
            doesn’t appear, reopen this in a moment.
          </p>
          <BackButton onClick={onClose} label="Close" />
        </div>
      ) : (
        <DepositView owner={axisAddress} onClose={onClose} />
      )}
    </Sheet>
  );
}

function DepositView({ owner, onClose }: { owner: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const { usdc: credited } = useWallet();
  const qr = `solana:${owner}?spl-token=${USDC_MINT}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(owner);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the address is visible to copy manually
    }
  }

  return (
    <div className="px-5 pt-4 pb-7">
      <div className="flex justify-center rounded-2xl bg-white p-4 shadow-card">
        <QRCodeSVG value={qr} size={168} bgColor="transparent" />
      </div>
      <button
        onClick={copy}
        className="mt-3 w-full rounded-2xl bg-line px-4 py-3 text-left transition-colors hover:bg-red-tint"
      >
        <span className="block text-[10px] font-bold tracking-[0.08em] text-faint uppercase">
          Your Axis USDC address {copied && "· copied"}
        </span>
        <span className="mt-1 block font-mono text-[12px] break-all text-ink">
          {owner}
        </span>
      </button>
      <p className="mt-3 text-[12.5px] text-faint">
        Send only USDC on Solana to this address. Sending any other token or
        network can lose the funds.
      </p>

      {credited !== null && (
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
          <span className="text-[12px] text-faint">Confirmed balance</span>
          <span className="font-display text-[15px] font-extrabold text-ink">
            {credited} USDC
          </span>
        </div>
      )}
      <BackButton onClick={onClose} label="Done" />
    </div>
  );
}

function BackButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="mt-4 w-full rounded-full py-3.5 text-sm font-semibold text-muted transition-colors hover:bg-line"
    >
      {label}
    </button>
  );
}
