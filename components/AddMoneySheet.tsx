"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Sheet } from "@/components/Sheet";

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
import {
  getDepositAddress,
  buildTransfer,
  fundingConfigured,
  type DepositAddress,
} from "@/lib/funding";
import { connectWallet, approveTransfer } from "@/lib/solanaWallet";
import { useWallet } from "@/components/WalletProvider";

type Mode = "choose" | "deposit" | "approve";

const USDC_AMOUNTS = ["5", "10", "25"];

/**
 * Fund the Axis wallet with USDC on Solana. Two paths, both user-authorized:
 *   1. Deposit — show the address + QR; the user sends from any wallet/exchange.
 *   2. Connect & approve — the backend builds an unsigned transfer; the user's
 *      own wallet signs it.
 * Either way the balance is credited server-side, only after on-chain
 * confirmation — this UI never asserts a credit, it just watches for it.
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
  const [mode, setMode] = useState<Mode>("choose");

  // Reset to the chooser each time the sheet opens.
  useEffect(() => {
    if (open) setMode("choose");
  }, [open]);

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="px-5 pt-2.5 pb-1">
        <span className="block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          Add money
        </span>
        <span className="mt-1 block text-[12.5px] text-faint">
          Fund your Axis wallet with USDC on Solana. You approve every transfer in
          your own wallet before it is sent.
        </span>
      </div>

      {!fundingConfigured ? (
        <Notice>
          Crypto funding isn’t configured yet. Set{" "}
          <code>NEXT_PUBLIC_FUNDING_API</code> to the payments service URL.
        </Notice>
      ) : !axisAddress ? (
        <Notice>
          No Axis wallet address yet. It’s issued server-side from your account
          when the settlement path is live.
        </Notice>
      ) : mode === "choose" ? (
        <Chooser onPick={setMode} onClose={onClose} />
      ) : mode === "deposit" ? (
        <DepositView owner={axisAddress} onBack={() => setMode("choose")} />
      ) : (
        <ApproveView owner={axisAddress} onBack={() => setMode("choose")} />
      )}
    </Sheet>
  );
}

function Chooser({
  onPick,
  onClose,
}: {
  onPick: (m: Mode) => void;
  onClose: () => void;
}) {
  return (
    <div className="px-5 pt-4 pb-7">
      <button
        onClick={() => onPick("deposit")}
        className="mb-2.5 w-full rounded-2xl bg-white p-4 text-left shadow-card transition-colors hover:bg-red-tint"
      >
        <span className="block text-[15px] font-bold text-ink">
          Show my deposit address
        </span>
        <span className="mt-0.5 block text-[12.5px] text-faint">
          Send USDC from any wallet or exchange. Credited after it confirms.
        </span>
      </button>
      <button
        onClick={() => onPick("approve")}
        className="w-full rounded-2xl bg-white p-4 text-left shadow-card transition-colors hover:bg-red-tint"
      >
        <span className="block text-[15px] font-bold text-ink">
          Connect wallet &amp; approve
        </span>
        <span className="mt-0.5 block text-[12.5px] text-faint">
          Approve a USDC transfer in your own Solana wallet.
        </span>
      </button>
      <button
        onClick={onClose}
        className="mt-3 w-full rounded-full py-3.5 text-sm font-semibold text-muted transition-colors hover:bg-line"
      >
        Not now
      </button>
    </div>
  );
}

function DepositView({ owner, onBack }: { owner: string; onBack: () => void }) {
  const [addr, setAddr] = useState<DepositAddress | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const { usdc: credited } = useWallet();

  useEffect(() => {
    let alive = true;
    getDepositAddress(owner)
      .then((a) => alive && setAddr(a))
      .catch((e) => alive && setError((e as Error).message));
    return () => {
      alive = false;
    };
  }, [owner]);

  async function copy() {
    if (!addr) return;
    await navigator.clipboard.writeText(addr.owner);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="px-5 pt-4 pb-7">
      {error ? (
        <p className="text-[13px] text-red-deep">{error}</p>
      ) : !addr ? (
        <p className="text-[13px] text-faint">Loading your address…</p>
      ) : (
        <>
          <div className="flex justify-center rounded-2xl bg-white p-4 shadow-card">
            <QRCodeSVG value={addr.qr} size={168} bgColor="transparent" />
          </div>
          <button
            onClick={copy}
            className="mt-3 w-full rounded-2xl bg-line px-4 py-3 text-left transition-colors hover:bg-red-tint"
          >
            <span className="block text-[10px] font-bold tracking-[0.08em] text-faint uppercase">
              Your Axis USDC address {copied && "· copied"}
            </span>
            <span className="mt-1 block font-mono text-[12px] break-all text-ink">
              {addr.owner}
            </span>
          </button>
          <p className="mt-3 text-[12.5px] text-faint">
            Send only USDC on Solana. Your balance updates after the deposit
            confirms on-chain ({addr.requiredCommitment}).
          </p>
        </>
      )}

      <CreditedRow credited={credited} />
      <BackButton onClick={onBack} />
    </div>
  );
}

function ApproveView({ owner, onBack }: { owner: string; onBack: () => void }) {
  const [amount, setAmount] = useState("10");
  const [wallet, setWallet] = useState("");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { usdc: credited } = useWallet();

  async function connect() {
    setError("");
    try {
      setWallet(await connectWallet());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function approve() {
    setError("");
    setBusy(true);
    try {
      setStatus("Building transfer…");
      const built = await buildTransfer(wallet, owner, amount);
      setStatus("Approve in your wallet…");
      const sig = await approveTransfer(built.transactionBase64);
      setStatus(`Submitted (${sig.slice(0, 8)}…). Waiting for confirmation…`);
    } catch (e) {
      setError((e as Error).message);
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="px-5 pt-4 pb-7">
      <div className="grid grid-cols-3 gap-2.5">
        {USDC_AMOUNTS.map((v) => (
          <button
            key={v}
            onClick={() => setAmount(v)}
            className={`rounded-2xl px-1.5 py-3.5 text-sm font-bold transition-colors ${
              amount === v ? "bg-red text-white" : "bg-line text-ink"
            }`}
          >
            ${v}
          </button>
        ))}
      </div>

      {!wallet ? (
        <button
          onClick={connect}
          className="mt-4 w-full rounded-full bg-ink py-[17px] text-[15.5px] font-bold text-white transition-colors hover:bg-red-dark"
        >
          Connect wallet
        </button>
      ) : (
        <button
          onClick={approve}
          disabled={busy}
          className="mt-4 w-full rounded-full bg-red py-[17px] text-[15.5px] font-bold text-white transition-colors hover:bg-red-dark disabled:opacity-40"
        >
          Approve ${amount} USDC in wallet
        </button>
      )}

      {wallet && (
        <p className="mt-2 text-center font-mono text-[11px] text-faint">
          {wallet.slice(0, 6)}…{wallet.slice(-6)}
        </p>
      )}
      {status && <p className="mt-2 text-[12.5px] text-muted">{status}</p>}
      {error && <p className="mt-2 text-[12.5px] text-red-deep">{error}</p>}

      <CreditedRow credited={credited} />
      <BackButton onClick={onBack} />
    </div>
  );
}

function CreditedRow({ credited }: { credited: string | null }) {
  if (credited === null) return null;
  return (
    <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3">
      <span className="text-[12px] text-faint">Confirmed balance</span>
      <span className="font-display text-[15px] font-extrabold text-ink">
        {credited} USDC
      </span>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mt-1.5 w-full rounded-full py-3.5 text-sm font-semibold text-muted transition-colors hover:bg-line"
    >
      Back
    </button>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 pt-4 pb-7">
      <p className="rounded-2xl bg-line px-4 py-3.5 text-[12.5px] leading-relaxed text-muted [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-ink">
        {children}
      </p>
    </div>
  );
}
