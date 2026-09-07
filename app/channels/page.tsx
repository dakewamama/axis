"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StepBadge } from "@/components/StepBadge";
import { SelectRow } from "@/components/SelectRow";
import { ChannelField } from "@/components/ChannelField";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useGuard } from "@/components/useGuard";
import { CHANNELS } from "@/lib/data";
import { formatPhone } from "@/lib/format";

export default function ChannelsPage() {
  const router = useRouter();
  useGuard("named");
  const {
    channels,
    toggleChannel,
    whatsapp,
    setWhatsapp,
    telegram,
    setTelegram,
  } = useOnboarding();

  return (
    <PhoneFrame>
      <div className="flex min-h-0 flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-4">
          <StepBadge step={3} />
          <h2 className="mt-3.5 mb-2 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
            Where do you want to reach Axis?
          </h2>
          <p className="text-[13px] leading-[1.5] text-faint">
            Axis lives here first. Mirror it anywhere else you already chat.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-4">
          <div className="flex flex-col gap-2.5">
            {CHANNELS.map((c, i) => {
              const locked = c.kind === "primary" || c.kind === "soon";
              const selected = c.kind === "primary" || channels.has(i);
              const isWhatsapp = c.label === "WhatsApp";
              const isTelegram = c.label === "Telegram";
              const expanded = selected && (isWhatsapp || isTelegram);

              return (
                <div key={c.label}>
                  <SelectRow
                    label={c.label}
                    note={c.note}
                    selected={selected}
                    disabled={locked}
                    dimmed={c.kind === "soon"}
                    attached={expanded}
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

                  {selected && isWhatsapp && (
                    <ChannelField
                      id="whatsapp"
                      label="WhatsApp number"
                      prefix="+234"
                      value={formatPhone(whatsapp)}
                      onChange={(v) =>
                        setWhatsapp(v.replace(/\D/g, "").slice(0, 10))
                      }
                      placeholder="803 123 4567"
                      hint="We'll message you here the day Axis goes live on WhatsApp."
                      inputMode="numeric"
                      autoComplete="tel-national"
                    />
                  )}

                  {selected && isTelegram && (
                    <ChannelField
                      id="telegram"
                      label="Telegram username"
                      prefix="@"
                      value={telegram}
                      onChange={(v) =>
                        setTelegram(v.replace(/[^a-zA-Z0-9_]/g, ""))
                      }
                      placeholder="yourhandle"
                      hint="Optional. Helps us find you when the Telegram mirror opens."
                      lowercase
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-2.5">
            <span className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-red" />
            <p className="text-xs leading-[1.5] text-pretty text-faint">
              Same account, same wallet, same order history on every channel. No
              single platform owns your Axis.
            </p>
          </div>
        </div>

        <div className="shrink-0 bg-cream px-6 pt-3.5 pb-4 shadow-[0_-1px_0_var(--color-line)]">
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