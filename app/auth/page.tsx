"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { StepBadge } from "@/components/StepBadge";
import { useOnboarding } from "@/components/OnboardingProvider";
import { SKIP_ONBOARDING } from "@/lib/flags";

export default function AuthPage() {
  const router = useRouter();
  const { setAuthMethod, setWebUserId, setEmail } = useOnboarding();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (SKIP_ONBOARDING) router.replace("/home");
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode, email: emailInput.trim(), password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        webUserId?: string;
        email?: string;
        error?: string;
      };
      if (!res.ok || !data.webUserId) {
        setError(data.error || "Something went wrong. Try again.");
        setBusy(false);
        return;
      }
      setEmail(data.email || emailInput.trim());
      setWebUserId(data.webUserId);
      setAuthMethod("email");
      router.push(mode === "signup" ? "/name" : "/home");
    } catch {
      setError("Couldn't reach Axis. Try again in a moment.");
      setBusy(false);
    }
  }

  const signup = mode === "signup";

  return (
    <PhoneFrame>
      <form onSubmit={submit} className="flex flex-1 animate-rise flex-col px-6 pt-7 pb-7">
        <StepBadge step={1} />
        <h2 className="mt-3.5 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
          {signup ? "Create your account." : "Welcome back."}
        </h2>
        <p className="mt-3 mb-6 text-sm leading-[1.5] text-pretty text-muted">
          Email and password. Your Axis wallet is tied to this account, so it
          follows you on any device.
        </p>

        <label className="mb-1.5 text-[13px] font-semibold text-ink">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={emailInput}
          onChange={(e) => setEmailInput(e.target.value)}
          placeholder="you@example.com"
          className="mb-4 h-12 rounded-[14px] bg-white px-4 text-[16px] text-ink shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />

        <label className="mb-1.5 text-[13px] font-semibold text-ink">Password</label>
        <input
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={signup ? "At least 8 characters" : "Your password"}
          className="h-12 rounded-[14px] bg-white px-4 text-[16px] text-ink shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ink"
        />

        {error && <p className="mt-3 text-[13.5px] font-medium text-red">{error}</p>}

        <button
          type="submit"
          disabled={busy || !emailInput.trim() || !password}
          className="mt-6 h-[52px] rounded-full bg-red text-[15.5px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          {busy ? "…" : signup ? "Create account" : "Log in"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(signup ? "login" : "signup");
            setError("");
          }}
          className="mt-4 text-[14px] font-semibold text-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          {signup ? "Have an account? Log in" : "New here? Create an account"}
        </button>
      </form>
    </PhoneFrame>
  );
}
