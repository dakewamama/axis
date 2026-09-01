"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StepBadge } from "@/components/StepBadge";
import { SelectRow } from "@/components/SelectRow";
import { useOnboarding } from "@/components/OnboardingProvider";
import { CHANNELS } from "@/lib/data";

export default function ChannelsPage() {
  const router = useRouter();
  const { channels, toggleChannel } = useOnboarding();

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col overflow-y-auto pb-6">
        <div className="px-6 pt-7 pb-4">
          <StepBadge step={4} />
          <h2 className="mt-3.5 mb-2 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
            Where do you want to reach Axis?
          </h2>
          <p className="text-[13px] leading-[1.5] text-faint">
            Axis lives here first. Mirror it anywhere else you already chat.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 px-6">
          {CHANNELS.map((c, i) => {
            const locked = c.kind === "primary" || c.kind === "soon";
            return (
              <SelectRow
                key={c.label}
                label={c.label}
                note={c.note}
                selected={c.kind === "primary" || channels.has(i)}
                disabled={locked}
                onClick={() => !locked && toggleChannel(i)}
                badge={
                  c.kind === "primary" ? (
                    <span className="shrink-0 rounded-full bg-red px-2 py-1 text-[9px] font-extrabold tracking-[0.07em] text-white uppercase">
                      Default
                    </span>
                  ) : c.kind === "soon" ? (
                    <span className="shrink-0 rounded-full bg-line px-2 py-1 text-[9px] font-extrabold tracking-[0.07em] text-faint uppercase">
                      Soon
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </div>

        <div className="px-6 pt-6">
          <div className="mb-6 flex items-start gap-2.5">
            <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-red" />
            <p className="text-xs leading-[1.5] text-pretty text-faint">
              Same account, same wallet, same order history on every channel. No
              single platform owns your Axis.
            </p>
          </div>
          <button
            onClick={() => router.push("/home")}
            className="w-full rounded-full bg-red py-[17px] text-[15.5px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark"
          >
            Finish setup
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}