"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisGlyph } from "@/components/AxisMark";
import { Sheet } from "@/components/Sheet";
import { PlacesSheet } from "@/components/PlacesSheet";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useWallet } from "@/components/WalletProvider";
import { useLocation } from "@/components/LocationProvider";
import { NGN } from "@/lib/format";

const EXAMPLES = [
  "does nadia have chicken wings",
  "cheapest ride to yaba right now",
  "₦2k airtime on my 0803 line",
  "pay my Ikeja Electric bill",
];

const LEDGER = [
  { label: "Nadia's Kitchen", when: "Yesterday", amount: -6700 },
  { label: "Ride to Yaba", when: "Tuesday", amount: -1850 },
  { label: "Wallet top-up", when: "Tuesday", amount: 10000 },
  { label: "MTN airtime", when: "Monday", amount: -1000 },
];

const TOP_UP_AMOUNTS = [1000, 5000, 10000];

export default function HomePage() {
  const router = useRouter();
  const { name } = useOnboarding();
  const { balance, topUp } = useWallet();
  const { activeLabel } = useLocation();
  const [draft, setDraft] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [picked, setPicked] = useState(5000);

  const firstName = name.trim();

  function ask(text: string) {
    if (text.trim()) router.push(`/chat?q=${encodeURIComponent(text.trim())}`);
  }

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 px-5 pt-4 pb-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-ink">
            <AxisGlyph size={18} />
          </span>
          <button
            onClick={() => setPlacesOpen(true)}
            className="flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-white"
          >
            <span className="truncate text-[13px] font-semibold text-muted">
              {activeLabel}
            </span>
            <span className="shrink-0 text-[9px] text-faint">▼</span>
          </button>
          <button
            onClick={() => setTopUpOpen(true)}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-white py-2 pr-2 pl-3.5 shadow-card transition-colors hover:bg-red-tint"
          >
            <span className="font-display text-[15px] font-extrabold tracking-[-0.01em] text-ink">
              {NGN(balance)}
            </span>
            <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red text-[15px] leading-none font-bold text-white">
              +
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="pt-8 pb-5">
            <h2 className="font-display text-[38px] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance text-ink">
              {firstName ? `What do you need, ${firstName}?` : "What do you need?"}
            </h2>
          </div>

          <div className="rounded-[24px] bg-white p-2 shadow-lift">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(draft);
                }
              }}
              rows={2}
              placeholder="Type it like you'd say it…"
              className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-[16px] leading-[1.45] text-ink outline-none placeholder:text-unfilled"
            />
            <div className="flex items-center justify-between pt-1 pl-3">
              <span className="text-[11px] text-faint">
                Food · rides · bills · money
              </span>
              <button
                onClick={() => ask(draft)}
                disabled={!draft.trim()}
                aria-label="Ask Axis"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red text-lg text-white transition-all hover:bg-red-dark disabled:bg-unfilled"
              >
                &rarr;
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-1.5">
            {EXAMPLES.map((e) => (
              <button
                key={e}
                onClick={() => ask(e)}
                className="group flex items-center gap-2.5 rounded-full py-1.5 text-left transition-colors"
              >
                <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-unfilled transition-colors group-hover:bg-red" />
                <span className="text-[14px] text-muted transition-colors group-hover:text-ink">
                  {e}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-9 mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-bold tracking-[0.1em] text-faint uppercase">
              This week
            </span>
            <span className="text-[11px] text-faint">4 orders</span>
          </div>
          <div className="pb-8">
            {LEDGER.map((l) => (
              <div
                key={l.label}
                className="flex items-baseline justify-between gap-3 border-b border-line py-3.5 last:border-0"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">
                    {l.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-faint">
                    {l.when}
                  </span>
                </span>
                <span
                  className={`text-[14px] font-bold whitespace-nowrap ${
                    l.amount > 0 ? "text-red-deep" : "text-ink"
                  }`}
                >
                  {l.amount > 0 ? "+" : "−"}
                  {NGN(Math.abs(l.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <PlacesSheet open={placesOpen} onClose={() => setPlacesOpen(false)} />

        <Sheet open={topUpOpen} onClose={() => setTopUpOpen(false)}>
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
                setTopUpOpen(false);
              }}
              className="mt-4 w-full rounded-full bg-red py-[17px] text-[15.5px] font-bold text-white transition-colors hover:bg-red-dark"
            >
              Continue to Paystack
            </button>
            <button
              onClick={() => setTopUpOpen(false)}
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