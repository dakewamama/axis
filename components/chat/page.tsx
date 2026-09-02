"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisGlyph } from "@/components/AxisMark";
import { Sheet } from "@/components/Sheet";
import { Bubble, TypingBubble } from "@/components/chat/Bubble";
import { DishRail } from "@/components/chat/DishRail";
import { UpsellCard } from "@/components/chat/UpsellCard";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useWallet } from "@/components/WalletProvider";
import { DISHES, ADDONS, FREE_DELIVERY_AT, DELIVERY_FEE } from "@/lib/data";
import { NGN } from "@/lib/format";

const FIRST_ASK = "does nadia have chicken wings";

export default function ChatPage() {
  const router = useRouter();
  const { name } = useOnboarding();
  const { balance, charge } = useWallet();

  const [sent, setSent] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [addons, setAddons] = useState<Set<number>>(new Set());
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paid, setPaid] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const firstName = name.trim() || "there";
  const dish = chosen !== null ? DISHES[chosen] : null;

  const addonTotal = [...addons].reduce((sum, i) => sum + ADDONS[i].price, 0);
  const subtotal = (dish?.price ?? 0) + addonTotal;
  const delivery = subtotal >= FREE_DELIVERY_AT ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [sent, step, chosen, addons, typing, paid]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function send(text: string) {
    setSent((prev) => [...prev, text]);
    setDraft("");
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setStep(1);
    }, 1000);
  }

  function pickDish(index: number) {
    setChosen(index);
    setTyping(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setTyping(false);
      setStep(2);
    }, 950);
  }

  function toggleAddon(index: number) {
    setAddons((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function pay() {
    charge(total);
    setSheetOpen(false);
    setPaid(true);
  }

  const insufficient = total > balance;

  return (
    <PhoneFrame>
      <div className="relative flex flex-1 animate-rise flex-col overflow-hidden bg-thread">
        <div className="flex shrink-0 items-center gap-3 bg-cream px-4 pt-2.5 pb-3 shadow-[0_1px_0_var(--color-line)]">
          <button
            onClick={() => router.push("/home")}
            aria-label="Back"
            className="px-0.5 py-1 text-xl leading-none text-ink"
          >
            &larr;
          </button>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink">
            <AxisGlyph size={21} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] leading-[1.1] font-bold text-ink">
              Axis
            </span>
            <span className="block text-[11px] text-faint">
              {typing ? "typing…" : "always on"}
            </span>
          </span>
        </div>

        <div
          ref={scrollRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-4 pb-2"
        >
          <Bubble
            who="axis"
            text={`Hi ${firstName}. I'm Axis.\n\nTell me what you need in plain words — food, a ride, airtime, a package. No menus.`}
            time="9:40"
          />

          {sent.map((text, i) => (
            <Bubble key={i} who="user" text={text} time="9:41" />
          ))}

          {sent.length > 0 && step >= 1 && (
            <>
              <Bubble
                who="axis"
                badge="Nadia's Kitchen · open until 10pm"
                text="Five plates in stock tonight. Swipe and tap one."
                time="9:41"
              />
              <DishRail onPick={pickDish} />
            </>
          )}

          {dish && (
            <>
              <Bubble
                who="user"
                text={`The ${dish.name}, please`}
                time="9:42"
              />
              {step >= 2 && (
                <>
                  <Bubble
                    who="axis"
                    badge="Supply: Chowdeck Relay"
                    text={`${dish.name} it is. Rider is 12 minutes from the kitchen.`}
                    time="9:42"
                  />
                  {!paid && (
                    <UpsellCard
                      selected={addons}
                      onToggle={toggleAddon}
                      subtotal={subtotal}
                      total={total}
                      onReview={() => setSheetOpen(true)}
                    />
                  )}
                </>
              )}
            </>
          )}

          {paid && (
            <Bubble
              who="axis"
              badge="Paid · Axis wallet"
              text={`Paid ${NGN(total)}. Order confirmed with Nadia's Kitchen.\n\nRider Emeka is on the way — I'll message you when he's 2 minutes out.`}
              time="9:44"
            />
          )}

          {typing && <TypingBubble />}
        </div>

        {sent.length === 0 && !typing && (
          <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-2.5">
            <button
              onClick={() => send(FIRST_ASK)}
              className="shrink-0 rounded-full bg-white px-4 py-2.5 text-[12.5px] font-semibold text-ink shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_6px_16px_-10px_rgb(32_30_29_/_0.25)] transition-colors hover:bg-red-tint"
            >
              {FIRST_ASK}
            </button>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-2.5 bg-thread px-3.5 pt-2.5 pb-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) send(draft.trim());
            }}
            placeholder="Ask Axis anything"
            className="h-12 flex-1 rounded-full bg-white px-[18px] text-[15px] text-ink shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_6px_16px_-10px_rgb(32_30_29_/_0.22)] outline-none placeholder:text-faint"
          />
          <button
            onClick={() => draft.trim() && send(draft.trim())}
            aria-label="Send"
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red text-[19px] text-white transition-colors hover:bg-red-dark"
          >
            &rarr;
          </button>
        </div>

        <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          <div className="flex items-center justify-between px-5 pt-2.5 pb-4">
            <span>
              <span className="block text-[10px] font-bold tracking-[0.1em] text-red-deep uppercase">
                Confirm before charge
              </span>
              <span className="mt-0.5 block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
                Your order
              </span>
            </span>
            <button
              onClick={() => setSheetOpen(false)}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-line text-[17px] text-ink"
            >
              &times;
            </button>
          </div>

          <div className="px-5">
            <div className="flex items-center gap-3.5 rounded-[22px] bg-white p-3.5 shadow-[0_1px_2px_rgb(32_30_29_/_0.08)]">
              <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl bg-line font-display text-2xl font-extrabold text-faint">
                {dish?.name.charAt(0) ?? "A"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] leading-[1.2] font-bold text-ink">
                  {dish?.name ?? "Your order"}
                </span>
                <span className="mt-1 block text-xs text-faint">
                  Nadia&rsquo;s Kitchen &middot; Yaba &middot; 25&ndash;35 min
                </span>
              </span>
            </div>

            <div className="mt-4">
              {dish && (
                <Line label={`${dish.name} · ${dish.detail}`} value={NGN(dish.price)} />
              )}
              {[...addons].map((i) => (
                <Line key={i} label={ADDONS[i].name} value={NGN(ADDONS[i].price)} />
              ))}
              <Line
                label="Delivery · Chowdeck Relay"
                value={delivery === 0 ? "Free" : NGN(delivery)}
                accent={delivery === 0}
              />
              <Line label="Axis service fee" value="₦0" />
            </div>

            <div className="flex items-baseline justify-between pt-4 pb-1.5">
              <span className="text-[11px] font-bold tracking-[0.08em] text-faint uppercase">
                Total charged
              </span>
              <span className="font-display text-[32px] font-extrabold tracking-[-0.02em] text-ink">
                {NGN(total)}
              </span>
            </div>

            <div className="flex items-start gap-2.5 pt-1.5 pb-4">
              <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-red" />
              <p className="text-xs leading-[1.5] text-pretty text-faint">
                {insufficient
                  ? `Your wallet has ${NGN(balance)}. Add money before paying.`
                  : `Debited from your Axis wallet balance of ${NGN(balance)}. Delivery fulfilled by a Chowdeck Relay rider.`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 px-5 pb-7">
            <button
              onClick={pay}
              disabled={insufficient}
              className="w-full rounded-full bg-red py-[17px] text-[15.5px] font-bold text-white transition-colors hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              {insufficient ? "Insufficient balance" : `Pay ${NGN(total)}`}
            </button>
            <button
              onClick={() => setSheetOpen(false)}
              className="w-full rounded-full py-3.5 text-sm font-semibold text-muted transition-colors hover:bg-line"
            >
              Not now
            </button>
          </div>
        </Sheet>
      </div>
    </PhoneFrame>
  );
}

function Line({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-3 border-b border-line py-3">
      <span className="flex-1 text-sm leading-[1.35] text-ink">{label}</span>
      <span
        className={`text-sm font-bold whitespace-nowrap ${
          accent ? "text-red-deep" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}