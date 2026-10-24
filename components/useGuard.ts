"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "./OnboardingProvider";
import { SKIP_ONBOARDING } from "@/lib/flags";
import { rememberReturnTo } from "@/lib/returnTo";

type Requirement = "authed" | "named" | "complete";

/**
 * Route guard. Redirects (never pushes — a pushing guard traps the back button)
 * to the earliest unmet onboarding step. It only fires once the provider has
 * hydrated from sessionStorage, so a restored session isn't bounced to /auth on
 * first paint. A deep link (an approval, a place tag, a payment) is remembered,
 * so the user lands back on it after signing in.
 */
export function useGuard(req: Requirement): boolean {
  const router = useRouter();
  const { hydrated, authMethod, name } = useOnboarding();

  useEffect(() => {
    if (SKIP_ONBOARDING) return; // test bypass: never redirect
    if (!hydrated) return;
    const authed = authMethod !== null;
    const named = name.trim() !== "";

    let target: string | null = null;
    if (!authed) target = "/auth";
    else if (req !== "authed" && !named) target = "/name";
    // "complete" also allows in once authed + named (channels is optional).

    if (target) {
      rememberReturnTo(window.location.pathname + window.location.search);
      router.replace(target);
    }
  }, [hydrated, authMethod, name, req, router]);

  return hydrated;
}
