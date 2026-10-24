"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { PinNeeded, pinStatus, setPin } from "@/lib/pin";

type Mode = "enter" | "create" | "confirm";
type Ask = { mode: Mode; message: string; resolve: (pin: string | null) => void };

type PinState = {
  /**
   * Run an action that may need the transaction PIN. It is tried without one;
   * if brain asks for the PIN, the user is prompted (or asked to create one) and
   * the action is retried with it. Resolves null if the user cancels.
   */
  withPin: <T>(action: (pin?: string) => Promise<T>) => Promise<T | null>;
  /** Create or change the PIN from Settings. */
  changePin: () => Promise<boolean>;
};

const PinContext = createContext<PinState | null>(null);

export function PinProvider({ children }: { children: React.ReactNode }) {
  const [ask, setAsk] = useState<Ask | null>(null);

  const prompt = useCallback((mode: Mode, message: string) => new Promise<string | null>((resolve) => setAsk({ mode, message, resolve })), []);

  /** Ask for a new PIN twice; save it (with the current one when changing). */
  const createPin = useCallback(
    async (current?: string): Promise<string | null> => {
      let message = "Create a 4-digit transaction PIN. You'll use it to approve payments.";
      for (;;) {
        const first = await prompt("create", message);
        if (!first) return null;
        const again = await prompt("confirm", "Enter the same PIN again.");
        if (!again) return null;
        if (again !== first) {
          message = "Those didn't match. Create your PIN again.";
          continue;
        }
        try {
          await setPin(first, current);
          return first;
        } catch (e) {
          message = e instanceof Error ? e.message : "Couldn't save your PIN.";
        }
      }
    },
    [prompt],
  );

  const withPin = useCallback(
    async <T,>(action: (pin?: string) => Promise<T>): Promise<T | null> => {
      let pin: string | undefined;
      for (;;) {
        try {
          return await action(pin);
        } catch (e) {
          if (!(e instanceof PinNeeded)) throw e;
          if (e.code === "pin_locked") throw new Error(e.message);
          const next =
            e.code === "pin_not_set"
              ? await createPin()
              : await prompt(
                  "enter",
                  e.code === "wrong_pin"
                    ? `${e.message}${e.attemptsLeft !== undefined ? ` ${e.attemptsLeft} ${e.attemptsLeft === 1 ? "try" : "tries"} left.` : ""}`
                    : "Enter your transaction PIN.",
                );
          if (!next) return null;
          pin = next;
        }
      }
    },
    [createPin, prompt],
  );

  const changePin = useCallback(async () => {
    if (!(await pinStatus()).set) return Boolean(await createPin());
    const current = await prompt("enter", "Enter your current PIN.");
    if (!current) return false;
    return Boolean(await createPin(current));
  }, [createPin, prompt]);

  return (
    <PinContext.Provider value={{ withPin, changePin }}>
      {children}
      <PinSheet
        ask={ask}
        onDone={(pin) => {
          ask?.resolve(pin);
          setAsk(null);
        }}
      />
    </PinContext.Provider>
  );
}

function PinSheet({ ask, onDone }: { ask: Ask | null; onDone: (pin: string | null) => void }) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // A fresh prompt starts empty.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue("");
    if (ask) setTimeout(() => input.current?.focus(), 50);
  }, [ask]);
  const title = ask?.mode === "create" ? "Create your PIN" : ask?.mode === "confirm" ? "Confirm your PIN" : "Transaction PIN";
  return (
    <Sheet open={Boolean(ask)} onClose={() => onDone(null)}>
      <form
        className="px-5 pt-2.5 pb-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (/^\d{4}$/.test(value)) onDone(value);
        }}
      >
        <span className="block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">{title}</span>
        <p className="mt-1 mb-5 text-[13px] leading-[1.45] text-muted">{ask?.message}</p>
        <label className="relative block" onClick={() => input.current?.focus()}>
          <span className="sr-only">4-digit PIN</span>
          <input
            ref={input}
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={value}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setValue(v);
              if (v.length === 4) setTimeout(() => onDone(v), 120);
            }}
            className="absolute inset-0 opacity-0"
          />
          <span className="flex justify-center gap-3" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`flex h-14 w-12 items-center justify-center rounded-2xl text-2xl font-extrabold ${i < value.length ? "bg-ink text-white" : "bg-white text-faint shadow-card"}`}
              >
                {i < value.length ? "•" : ""}
              </span>
            ))}
          </span>
        </label>
        <button type="button" onClick={() => onDone(null)} className="mt-6 w-full rounded-full py-3 text-[13px] font-semibold text-muted hover:bg-line">
          Cancel
        </button>
      </form>
    </Sheet>
  );
}

export function usePin() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error("usePin must be used inside PinProvider");
  return ctx;
}
