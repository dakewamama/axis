"use client";

import { createContext, useContext, useState } from "react";

type AuthMethod = "google" | "apple" | "phone";

type OnboardingState = {
  name: string;
  setName: (name: string) => void;
  authMethod: AuthMethod | null;
  setAuthMethod: (method: AuthMethod) => void;
  services: Set<number>;
  toggleService: (index: number) => void;
  channels: Set<number>;
  toggleChannel: (index: number) => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [name, setName] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [services, setServices] = useState<Set<number>>(
    () => new Set([0, 1, 2, 3, 4, 5, 6]),
  );
  const [channels, setChannels] = useState<Set<number>>(() => new Set([0, 1]));

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<Set<number>>>) =>
    (index: number) =>
      setter((prev) => {
        const next = new Set(prev);
        next.has(index) ? next.delete(index) : next.add(index);
        return next;
      });

  return (
    <OnboardingContext.Provider
      value={{
        name,
        setName,
        authMethod,
        setAuthMethod,
        services,
        toggleService: toggle(setServices),
        channels,
        toggleChannel: toggle(setChannels),
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  }
  return ctx;
}