"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StepBadge } from "@/components/StepBadge";
import { useOnboarding } from "@/components/OnboardingProvider";

function AppleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
      <path d="M10 2c1 .5 2 2 2 5" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

const METHODS = [
  {
    id: "google" as const,
    label: "Continue with Google",
    // No fake "G" mark — a non-official Google glyph fails brand review. Use the
    // official asset here when available; until then the label carries it.
    icon: null,
  },
  { id: "apple" as const, label: "Continue with Apple", icon: <AppleIcon /> },
  { id: "phone" as const, label: "Use my phone number", icon: <PhoneIcon /> },
];

export default function AuthPage() {
  const router = useRouter();
  const { setAuthMethod } = useOnboarding();

  function choose(method: (typeof METHODS)[number]["id"]) {
    setAuthMethod(method);
    router.push("/name");
  }

  return (
    <PhoneFrame>
      <div className="flex flex-1 animate-rise flex-col px-6 pt-7 pb-7">
        <StepBadge step={1} />
        <h2 className="mt-3.5 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          Sign in once.
        </h2>
        <p className="mt-3 mb-6 text-sm leading-[1.5] text-pretty text-muted">
          No forms, no seed phrase. Signing in creates your Axis wallet in the
          background. It&rsquo;s how you pay for things later.
        </p>

        <div
          role="group"
          aria-label="Sign-in options"
          className="flex flex-col gap-2.5"
        >
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => choose(m.id)}
              className="flex items-center gap-3.5 rounded-[18px] bg-white px-[18px] py-[17px] text-left text-[15.5px] font-semibold text-ink shadow-card transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            >
              {m.icon}
              <span className="flex-1">{m.label}</span>
              <span aria-hidden="true" className="text-red-deep">
                &rarr;
              </span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex items-start gap-2.5 pt-5">
          <span
            aria-hidden="true"
            className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-red"
          />
          <p className="text-sm leading-[1.5] text-pretty text-muted">
            Your Axis wallet is created for you and used only to pay for what you
            ask for. It stays tied to your account.
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}