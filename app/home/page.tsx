"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisGlyph } from "@/components/AxisMark";
import { AddMoneySheet } from "@/components/AddMoneySheet";
import { PlacesSheet } from "@/components/PlacesSheet";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useWallet } from "@/components/WalletProvider";
import { useLocation } from "@/components/LocationProvider";
import { useGuard } from "@/components/useGuard";
import { HOME_SHORTCUTS } from "@/lib/data";
import { NGN, relativeDay } from "@/lib/format";

export default function HomePage() {
  const router = useRouter();
  useGuard("complete");
  const { name, services, reset } = useOnboarding();
  const { activeLabel, reset: resetLocation } = useLocation();
  const { balance, usdc, live, entries, axisAddress } = useWallet();
  const [draft, setDraft] = useState("");
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);

  const firstName = name.trim();

  // Shortcuts the user opted into (in onboarding /services) float to the front.
  const examples = useMemo(() => {
    const picked = (s: { vertical?: number }) =>
      s.vertical === undefined || services.has(s.vertical);
    return [...HOME_SHORTCUTS]
      .sort((a, b) => Number(picked(b)) - Number(picked(a)))
      .map((s) => s.prompt);
  }, [services]);

  function ask(text: string) {
    if (text.trim()) router.push(`/chat?q=${encodeURIComponent(text.trim())}`);
  }

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 px-5 pt-4 pb-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-ink"
          >
            <AxisGlyph size={18} />
          </span>
          <button
            onClick={() => setPlacesOpen(true)}
            className="flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span className="truncate text-[13px] font-semibold text-muted">
              {activeLabel}
            </span>
            <span aria-hidden="true" className="shrink-0 text-[9px] text-faint">
              ▼
            </span>
          </button>
          <button
            onClick={() => setTopUpOpen(true)}
            className="ml-auto flex shrink-0 items-center gap-2 rounded-full bg-white py-2 pr-2 pl-3.5 shadow-card transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span className="font-display text-[15px] font-extrabold tracking-[-0.01em] text-ink">
              {live ? (usdc === null ? "—" : `$${usdc}`) : NGN(balance)}
            </span>
            <span
              aria-hidden="true"
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-red text-[15px] leading-none font-bold text-white"
            >
              +
            </span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          <div className="pt-8 pb-5">
            <h2 className="font-display text-[38px] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance text-ink">
              {firstName
                ? `What do you need, ${firstName}?`
                : "What do you need?"}
            </h2>
          </div>

          <div className="rounded-[24px] bg-white p-2 shadow-lift">
            <textarea
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  ask(draft);
                }
              }}
              rows={1}
              placeholder="Type it like you'd say it…"
              aria-label="Ask Axis"
              className="w-full resize-none bg-transparent px-3 pt-3 pb-1 text-[16px] leading-[1.45] text-ink outline-none placeholder:text-unfilled"
            />
            <div className="flex items-center justify-between pt-1 pl-3">
              <span className="text-[11px] text-faint">
                Food · gifts · shopping
              </span>
              <button
                onClick={() => ask(draft)}
                disabled={!draft.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-lg text-white transition-all hover:bg-red disabled:opacity-25"
              >
                &rarr;
              </button>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-1.5">
            {examples.map((e) => (
              <button
                key={e}
                onClick={() => ask(e)}
                className="group flex items-center gap-2.5 rounded-full py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="h-[5px] w-[5px] shrink-0 rounded-full bg-unfilled transition-colors group-hover:bg-red"
                />
                <span className="text-[14px] text-muted transition-colors group-hover:text-ink">
                  {e}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-9 mb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-bold tracking-[0.1em] text-faint uppercase">
              Activity
            </span>
            <span className="text-[11px] text-faint">
              {entries.length} {entries.length === 1 ? "entry" : "entries"}
            </span>
          </div>
          <div>
            {entries.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-faint">
                Nothing here yet. Add money or make a request to get started.
              </p>
            ) : (
              entries.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-baseline justify-between gap-3 border-b border-line py-3.5 last:border-0"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-ink">
                        {t.label}
                      </span>
                      {!t.confirmed && (
                        <span className="shrink-0 rounded-full bg-line px-1.5 py-0.5 text-[9px] font-bold tracking-[0.06em] text-faint uppercase">
                          Demo
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-faint">
                      {relativeDay(t.at)}
                    </span>
                  </span>
                  <span
                    className={`text-[14px] font-bold whitespace-nowrap ${
                      t.positive ? "text-red-deep" : "text-ink"
                    }`}
                  >
                    {t.positive ? "+" : "−"}
                    {t.display}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 mb-8 flex flex-col gap-1.5">
            <button
              onClick={() => router.push("/services")}
              className="w-full rounded-full py-3 text-[12.5px] font-semibold text-muted transition-colors hover:bg-line hover:text-ink"
            >
              Manage services
            </button>
            <button
              onClick={() => {
                reset();
                resetLocation();
                router.replace("/");
              }}
              className="w-full rounded-full py-3 text-[12.5px] font-semibold text-faint transition-colors hover:bg-line hover:text-ink"
            >
              Start over
            </button>
          </div>
        </div>

        <PlacesSheet open={placesOpen} onClose={() => setPlacesOpen(false)} />
        <AddMoneySheet
          open={topUpOpen}
          onClose={() => setTopUpOpen(false)}
          axisAddress={axisAddress}
        />
      </div>
    </PhoneFrame>
  );
}