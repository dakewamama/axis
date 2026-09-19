"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SKIP_ONBOARDING } from "@/lib/flags";

type AuthMethod = "google" | "apple" | "email";

const KEY = "axis:onboarding:v1";

type Persisted = {
  name: string;
  email: string;
  authMethod: AuthMethod | null;
  services: number[];
  channels: number[];
  whatsapp: string;
  telegram: string;
  webUserId: string;
};

function newWebUserId(): string {
  try {
    return `web_${crypto.randomUUID()}`;
  } catch {
    return `web_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  }
}

type OnboardingState = {
  hydrated: boolean;
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  setWebUserId: (id: string) => void;
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
  webUserId: string;
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
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [services, setServices] = useState<Set<number>>(
    () => new Set([0, 1, 2, 3, 4, 5, 6]),
  );
  const [channels, setChannels] = useState<Set<number>>(() => new Set([0, 1]));
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [webUserId, setWebUserId] = useState("");

  useEffect(() => {
    let hadAuth = false;
    let storedId = "";
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (typeof p.name === "string") setName(p.name);
        if (typeof p.email === "string") setEmail(p.email);
        if (p.authMethod) {
          setAuthMethod(p.authMethod);
          hadAuth = true;
        }
        if (Array.isArray(p.services)) setServices(new Set(p.services));
        if (Array.isArray(p.channels)) setChannels(new Set(p.channels));
        if (typeof p.whatsapp === "string") setWhatsapp(p.whatsapp);
        if (typeof p.telegram === "string") setTelegram(p.telegram);
        if (typeof p.webUserId === "string" && p.webUserId) storedId = p.webUserId;
      }
    } catch {
      // corrupt or unavailable storage — fall through to defaults
    }

    // Test bypass: seed a throwaway identity so onboarding is "complete" and
    // chat (greeting, userId) works without clicking through the flow.
    if (SKIP_ONBOARDING) {
      setWebUserId(storedId || newWebUserId());
      setAuthMethod((m) => m ?? "google");
      setName((n) => n || "Tester");
      setHydrated(true);
      return;
    }

    // Logged in per localStorage — trust it and go.
    if (hadAuth) {
      setWebUserId(storedId || newWebUserId());
      setHydrated(true);
      return;
    }

    // No local session. Before deciding the user is logged out, try the httpOnly
    // session cookie — this is what keeps a login alive after the browser drops
    // localStorage (common in in-app browsers).
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((s: { webUserId?: string; email?: string; name?: string }) => {
        if (!alive) return;
        if (s && s.webUserId) {
          setWebUserId(s.webUserId);
          if (s.email) setEmail(s.email);
          if (s.name) setName(s.name);
          setAuthMethod("email");
        } else {
          setWebUserId(storedId || newWebUserId());
        }
      })
      .catch(() => {
        if (alive) setWebUserId(storedId || newWebUserId());
      })
      .finally(() => {
        if (alive) setHydrated(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: Persisted = {
        name,
        email,
        authMethod,
        services: [...services],
        channels: [...channels],
        whatsapp,
        telegram,
        webUserId,
      };
      localStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // storage full or blocked
    }
  }, [
    hydrated,
    name,
    email,
    authMethod,
    services,
    channels,
    whatsapp,
    telegram,
    webUserId,
  ]);

  // The account wallet is provisioned + polled by WalletProvider (which owns the
  // wallet lifecycle), keyed off this same webUserId.

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
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    // Clear the server session cookie too, else /api/auth/me would restore.
    void fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setName("");
    setEmail("");
    setAuthMethod(null);
    setServices(new Set([0, 1, 2, 3, 4, 5, 6]));
    setChannels(new Set([0, 1]));
    setWhatsapp("");
    setTelegram("");
    setWebUserId(newWebUserId());
  }

  return (
    <OnboardingContext.Provider
      value={{
        hydrated,
        name,
        setName,
        email,
        setEmail,
        setWebUserId,
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
        webUserId,
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