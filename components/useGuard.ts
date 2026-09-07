"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOnboarding } from "./OnboardingProvider";

type Requirement = "authed" | "named" | "complete";

/**
 * Route guard. Redirects (never pushes — a pushing guard traps the back button)
 * to the earliest unmet onboarding step. It only fires once the provider has
 * hydrated from sessionStorage, so a restored session isn't bounced to /auth on
 * first paint. Pass preserveQuery on /chat so a shared ?q intent survives the
 * onboarding round-trip and the user lands back on it.
 */
export function useGuard(
  req: Requirement,
  opts?: { preserveQuery?: boolean },
): boolean {
  const router = useRouter();
  const search = useSearchParams();
  const { hydrated, authMethod, name } = useOnboarding();

  useEffect(() => {
    if (!hydrated) return;
    const authed = authMethod !== null;
    const named = name.trim() !== "";

    let target: string | null = null;
    if (!authed) target = "/auth";
    else if (req !== "authed" && !named) target = "/name";
    // "complete" also allows in once authed + named (channels is optional).

    if (target) {
      if (opts?.preserveQuery) {
        const qs = search.toString();
        if (qs) target += `?${qs}`;
      }
      router.replace(target);
    }
  }, [hydrated, authMethod, name, req, opts?.preserveQuery, router, search]);

  return hydrated;
}
