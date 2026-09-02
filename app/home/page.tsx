"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisGlyph } from "@/components/AxisMark";
import { Sheet } from "@/components/Sheet";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useWallet } from "@/components/WalletProvider";
import { NGN } from "@/lib/format";

const SHORTCUTS = [
  { label: "Order food", note: "Nadia's, Chicken Republic" },
  { label: "Book a ride", note: "Compares 3 apps" },
  { label: "Buy airtime", note: "MTN · 0803" },
  { label: "Pay a bill", note: "Ikeja Electric" },
];

const RECENTS = [
  { icon: "🍗", label: "Nadia's Kitchen", when: "Yesterday · delivered", amount: "₦6,700" },
  { icon: "🚗", label: "Ride to Yaba", when: "Tue · Bolt via Axis", amount: "₦1,850" },
  { icon: "📶", label: "MTN airtime", when: "Mon", amount: "₦1,000" },
];

const TOP_UP_AMOUNTS = [1000, 5000, 10000];

export default function HomePage() {
  const router = useRouter();
  const { name } = useOnboarding();
  const { balance, topUp } = useWallet();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [picked, setPicked] = useState(5000);

  const firstName = name.trim() || "there";

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="flex items-end justify-between px-5 pt-4 pb-3">
          <h2 className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">
            Axis
          </h2>
          <span className="text-[11px] tracking-[0.08em] text-faint uppercase">
            Lagos
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
          <div className="flex items-center justify-between rounded-[24px] bg-ink p-[18px] shadow-[0_18px_36px_-20px_rgb(32_30_29_/_0.6)]">
            <span>
              <span className="block text-[10px] font-bold tracking-[0.1em] text-cream/60 uppercase">
                Axis wallet
              </span>
              <span className="mt-1 block font-display text-[30px] font-extrabold tracking-[-0.02em] text-cream">
                {NGN(balance)}
              </span>
            </span>
            <button
              onClick={() => setSheetOpen(true)}
              className="rounded-full bg-cream px-[17px] py-[11px] text-[13px] font-bold text-ink transition-colors hover:bg-red hover:text-white"
            >
              Add money
            </button>
          </div>

          <button
            onClick={() => router.push("/chat")}
            className="mt-3.5 flex w-full items-center gap-3.5 rounded-[20px] bg-white px-4 py-[15px] text-left shadow-lift transition-colors hover:bg-red-tint"
          >
            <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-ink">
              <AxisGlyph size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline justify-between">
                <span className="text-[15.5px] font-bold text-ink">Axis</span>
                <span className="text-[11px] text-faint">now</span>
              </span>
              <span className="mt-0.5 block truncate text-[12.5px] text-muted">
                Ready when you are, {firstName}. Try asking me something.
              </span>
            </span>
          </button>

          <div className="mt-6 mb-3 px-0.5 text-[10px] font-bold tracking-[0.1em] text-faint uppercase">
            Your shortcuts
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {SHORTCUTS.map((s) => (
              <button
                key={s.label}
                onClick={() => router.push("/chat")}
                className="rounded-[18px] bg-white px-3.5 py-[15px] text-left shadow-card transition-colors hover:bg-red-tint"
              >
                <span className="block text-[14.5px] leading-[1.2] font-bold text-ink">
                  {s.label}
                </span>
                <span className="mt-1 block text-[11px] text-faint">{s.note}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 mb-3 px-0.5 text-[10px] font-bold tracking-[0.1em] text-faint uppercase">
            Recent
          </div>
          <div className="flex flex-col gap-2">
            {RECENTS.map((r) => (
              <div
                key={r.label}
                className="flex items-center gap-3.5 rounded-[18px] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgb(32_30_29_/_0.08)]"
              >
                <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-line text-base">
                  {r.icon}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold text-ink">
                    {r.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-faint">
                    {r.when}
                  </span>
                </span>
                <span className="text-[13px] font-bold whitespace-nowrap text-ink">
                  {r.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <div className="px-5 pt-2.5 pb-1">
            <span className="block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
              Add money
            </span>
            <span className="mt-1 block text-[12.5px] text-faint">
              Tops up your Axis wallet via Paystack. Axis never holds this
              balance directly.
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2.5 px-5 pt-4 pb-1">
            {TOP_UP_AMOUNTS.map((v) => (
              <button
                key={v}
                onClick={() => setPicked(v)}
                className={`rounded-2xl px-1.5 py-3.5 text-sm font-bold transition-colors ${
                  picked === v ? "bg-red text-white" : "bg-line text-ink"
                }`}
              >
                {NGN(v)}
              </button>
            ))}
          </div>
          <div className="px-5 pb-7">
            <button
              onClick={() => {
                topUp(picked);
                setSheetOpen(false);
              }}
              className="mt-4 w-full rounded-full bg-red py-[17px] text-[15.5px] font-bold text-white transition-colors hover:bg-red-dark"
            >
              Continue to Paystack
            </button>
            <button
              onClick={() => setSheetOpen(false)}
              className="mt-1.5 w-full rounded-full py-3.5 text-sm font-semibold text-muted transition-colors hover:bg-line"
            >
              Not now
            </button>
          </div>
        </Sheet>
      </div>
    </PhoneFrame>
  );
}