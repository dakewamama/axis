"use client";

import { createContext, useContext, useEffect, useState } from "react";

type AuthMethod = "google" | "apple" | "phone";

const KEY = "axis:onboarding:v1";

type Persisted = {
  name: string;
  authMethod: AuthMethod | null;
  services: number[];
  channels: number[];
  whatsapp: string;
  telegram: string;
};

type OnboardingState = {
  hydrated: boolean;
  name: string;
  setName: (name: string) => void;
  authMethod: AuthMethod | null;
  setAuthMethod: (method: AuthMethod) => void;
  services: Set<number>;
  toggleService: (index: number) => void;
  channels: Set<number>;
  toggleChannel: (index: number) => void;
  whatsapp: string;
  setWhatsapp: (value: string) => void;
  telegram: string;
  setTelegram: (value: string) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [services, setServices] = useState<Set<number>>(
    () => new Set([0, 1, 2, 3, 4, 5, 6]),
  );
  const [channels, setChannels] = useState<Set<number>>(() => new Set([0, 1]));
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (typeof p.name === "string") setName(p.name);
        if (p.authMethod) setAuthMethod(p.authMethod);
        if (Array.isArray(p.services)) setServices(new Set(p.services));
        if (Array.isArray(p.channels)) setChannels(new Set(p.channels));
        if (typeof p.whatsapp === "string") setWhatsapp(p.whatsapp);
        if (typeof p.telegram === "string") setTelegram(p.telegram);
      }
    } catch {
      // corrupt or unavailable storage — fall through to defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: Persisted = {
        name,
        authMethod,
        services: [...services],
        channels: [...channels],
        whatsapp,
        telegram,
      };
      sessionStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // storage full or blocked
    }
  }, [hydrated, name, authMethod, services, channels, whatsapp, telegram]);

  const toggle =
    (setter: React.Dispatch<React.SetStateAction<Set<number>>>) =>
    (index: number) =>
      setter((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });

  function reset() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setName("");
    setAuthMethod(null);
    setServices(new Set([0, 1, 2, 3, 4, 5, 6]));
    setChannels(new Set([0, 1]));
    setWhatsapp("");
    setTelegram("");
  }

  return (
    <OnboardingContext.Provider
      value={{
        hydrated,
        name,
        setName,
        authMethod,
        setAuthMethod,
        services,
        toggleService: toggle(setServices),
        channels,
        toggleChannel: toggle(setChannels),
        whatsapp,
        setWhatsapp,
        telegram,
        setTelegram,
        reset,
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