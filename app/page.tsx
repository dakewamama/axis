"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisMark } from "@/components/AxisMark";
import { useOnboarding } from "@/components/OnboardingProvider";

// Entry gate. No splash — route straight based on the restored session so a
// returning user lands on /home without logging in again. New/logged-out users
// go to /auth. Session is restored from localStorage or the httpOnly cookie by
// OnboardingProvider before `hydrated` flips true.
export default function IndexPage() {
  const router = useRouter();
  const { hydrated, authMethod, name } = useOnboarding();

  useEffect(() => {
    if (!hydrated) return;
    if (authMethod) {
      router.replace(name.trim() ? "/home" : "/name");
    } else {
      router.replace("/auth");
    }
  }, [hydrated, authMethod, name, router]);

  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <AxisMark />
      </div>
    </PhoneFrame>
  );
}
