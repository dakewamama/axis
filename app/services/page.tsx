"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SelectRow } from "@/components/SelectRow";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useGuard } from "@/components/useGuard";
import { VERTICALS } from "@/lib/data";
import { formatPhone } from "@/lib/format";

const AUTH_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  phone: "Phone number",
};

export default function ServicesPage() {
  const router = useRouter();
  useGuard("complete");
  const { services, toggleService, authMethod, whatsapp, telegram } =
    useOnboarding();
  const [request, setRequest] = useState("");
  const [requested, setRequested] = useState(false);

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-4">
          <button
            onClick={() => router.push("/home")}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span aria-hidden="true">&larr;</span> Home
          </button>
          <h2 className="mb-2 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
            Pick what you&rsquo;ll actually use.
          </h2>
          <p className="text-[13px] leading-[1.5] text-faint">
            Everything stays available. This just sorts your shortcuts.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="mb-4 rounded-[22px] bg-white p-[18px] shadow-card">
            <div className="mb-3 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">
              Account &amp; reach
            </div>
            <dl className="flex flex-col gap-2.5 text-[13.5px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-faint">Signed in with</dt>
                <dd className="font-semibold text-ink">
                  {authMethod ? AUTH_LABEL[authMethod] : "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-faint">WhatsApp</dt>
                <dd className="font-semibold text-ink">
                  {whatsapp ? `+234 ${formatPhone(whatsapp)}` : "Not added"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-faint">Telegram</dt>
                <dd className="font-semibold text-ink">
                  {telegram ? `@${telegram}` : "Not added"}
                </dd>
              </div>
            </dl>
            <button
              onClick={() => router.push("/channels")}
              className="mt-3.5 w-full rounded-full bg-line py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            >
              Manage channels
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {VERTICALS.map((v, i) => (
              <SelectRow
                key={v.label}
                label={v.label}
                note={v.note}
                selected={services.has(i)}
                onClick={() => toggleService(i)}
                badge={
                  v.waitlist ? (
                    <span className="shrink-0 rounded-full bg-line px-2 py-1 text-[9px] font-extrabold tracking-[0.07em] text-faint uppercase">
                      Waitlist
                    </span>
                  ) : undefined
                }
              />
            ))}
          </div>

          <div className="py-4 pb-6">
            <div className="rounded-[22px] bg-white p-[18px] shadow-lift">
              <div className="mb-2 text-[10px] font-bold tracking-[0.09em] text-red-deep uppercase">
                Not listed?
              </div>
              <p className="mb-3 text-[13.5px] leading-[1.45] text-pretty text-ink">
                Name any app or service you want connected. We build the ones
                people ask for most.
              </p>
              <input
                value={request}
                onChange={(e) => {
                  setRequest(e.target.value);
                  setRequested(false);
                }}
                placeholder="e.g. my school fees portal"
                className="mb-2.5 h-[46px] w-full rounded-full bg-field px-4 text-[16px] text-ink outline-none placeholder:text-faint"
              />
              <button
                onClick={() => request.trim() && setRequested(true)}
                disabled={!request.trim()}
                className="w-full rounded-full bg-ink py-3.5 text-sm font-bold text-white transition-colors hover:bg-red disabled:opacity-40"
              >
                {requested ? "Noted, thank you" : "Request it"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-cream px-6 pt-3.5 pb-4 shadow-[0_-1px_0_var(--color-line)]">
          <span className="flex-1 text-xs text-faint">
            {services.size} selected
          </span>
          <button
            onClick={() => router.push("/home")}
            className="rounded-full bg-red px-7 py-[15px] text-[15px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark"
          >
            Done
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}