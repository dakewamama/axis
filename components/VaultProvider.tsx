"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useOnboarding } from "@/components/OnboardingProvider";
import { EMPTY_VAULT, type Section, type Vault, loadVault, removeEntry, saveEntry } from "@/lib/vault";

type VaultState = {
  vault: Vault;
  /** True once the server copy has loaded for the signed-in user. */
  loaded: boolean;
  error: string;
  reload: () => Promise<void>;
  /** Create (no id) or update an entry; throws with a user-facing message. */
  save: (section: Section, details: Record<string, unknown>, id?: string) => Promise<Vault>;
  remove: (section: Section, id: string) => Promise<Vault>;
};

const VaultContext = createContext<VaultState | null>(null);

/**
 * The signed-in user's saved details (people they pay, addresses, phone lines),
 * kept on the server by brain so they follow the account to every device and to
 * every connected AI app. Nothing here is stored in the browser.
 */
export function VaultProvider({ children }: { children: React.ReactNode }) {
  const { hydrated, authMethod, webUserId } = useOnboarding();
  const [vault, setVault] = useState<Vault>(EMPTY_VAULT);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const signedIn = hydrated && authMethod !== null;

  const reload = useCallback(async () => {
    try {
      setVault(await loadVault());
      setLoaded(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your saved details.");
    }
  }, []);

  useEffect(() => {
    if (signedIn) {
      // Fetching the account's saved details once signed in.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void reload();
    } else {
      setVault(EMPTY_VAULT);
      setLoaded(false);
    }
  }, [signedIn, webUserId, reload]);

  const save = useCallback(async (section: Section, details: Record<string, unknown>, id?: string) => {
    const next = await saveEntry(section, details, id);
    setVault(next);
    return next;
  }, []);

  const remove = useCallback(async (section: Section, id: string) => {
    const next = await removeEntry(section, id);
    setVault(next);
    return next;
  }, []);

  return (
    <VaultContext.Provider value={{ vault, loaded, error, reload, save, remove }}>
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}
