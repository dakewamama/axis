"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { SelectRow } from "@/components/SelectRow";
import { useOnboarding } from "@/components/OnboardingProvider";
import { VERTICALS } from "@/lib/data";

export default function ServicesPage() {
  const router = useRouter();
  const { services, toggleService } = useOnboarding();
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
                className="mb-2.5 h-[46px] w-full rounded-full bg-field px-4 text-sm text-ink outline-none placeholder:text-faint"
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