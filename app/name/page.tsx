"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StepBadge } from "@/components/StepBadge";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useGuard } from "@/components/useGuard";

export default function NamePage() {
  const router = useRouter();
  const { name, setName } = useOnboarding();
  useGuard("authed");

  const trimmed = name.trim();

  function advance() {
    if (trimmed) router.push("/channels");
  }

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col px-6 pt-7 pb-7">
        <StepBadge step={2} />
        <h2 className="mt-3.5 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          What should Axis call you?
        </h2>

        <div className="mt-6 rounded-[20px] bg-white px-[18px] py-4 shadow-card">
          <label
            htmlFor="firstName"
            className="mb-1.5 block text-[10px] font-bold tracking-[0.09em] text-faint uppercase"
          >
            First name
          </label>
          <input
            id="firstName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && advance()}
            placeholder="Tunde"
            autoComplete="given-name"
            autoFocus
            className="w-full bg-transparent font-display text-[22px] font-bold tracking-[-0.01em] text-ink outline-none placeholder:text-unfilled"
          />
        </div>

        <p className="mt-3.5 px-0.5 text-[13px] leading-[1.5] text-faint">
          Used in receipts and when a rider calls you. Nothing else.
        </p>

        <div className="mt-auto flex gap-2.5">
          <button
            onClick={() => router.back()}
            className="rounded-full bg-white px-6 py-[17px] text-[14.5px] font-semibold text-ink shadow-card transition-colors hover:bg-line"
          >
            Back
          </button>
          <button
            onClick={advance}
            disabled={!trimmed}
            className="flex-1 rounded-full bg-red py-[17px] text-[15.5px] font-bold text-white shadow-cta transition-all hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            Continue
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}