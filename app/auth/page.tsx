"use client";

import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StepBadge } from "@/components/StepBadge";
import { useOnboarding } from "@/components/OnboardingProvider";

function GoogleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 48 48"
      className="shrink-0"
      aria-hidden="true"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 384 512"
      fill="currentColor"
      className="shrink-0"
      aria-hidden="true"
    >
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
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
    icon: <GoogleIcon />,
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