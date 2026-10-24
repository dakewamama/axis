// The transaction PIN step-up. brain answers 403 with a pin_* code when an action
// needs the PIN; callers retry with it (see PinProvider).
export type PinCode = "pin_not_set" | "pin_required" | "wrong_pin" | "pin_locked";
const CODES = new Set<string>(["pin_not_set", "pin_required", "wrong_pin", "pin_locked"]);

export class PinNeeded extends Error {
  constructor(readonly code: PinCode, message: string, readonly attemptsLeft?: number) {
    super(message);
  }
}

/** Throw PinNeeded for a PIN answer, or Error for any other failure; return the body otherwise. */
export async function readOrPin<T>(res: Response, fallback: string): Promise<T> {
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; code?: string; attemptsLeft?: number };
  if (res.status === 403 && data.code && CODES.has(data.code)) {
    throw new PinNeeded(data.code as PinCode, data.error ?? "Enter your transaction PIN.", data.attemptsLeft);
  }
  if (!res.ok) throw new Error(data.error || fallback);
  return data;
}

export async function pinStatus(): Promise<{ set: boolean; lockedUntil: string | null }> {
  const res = await fetch("/api/pin", { cache: "no-store" });
  return readOrPin(res, "Couldn't check your PIN.");
}

export async function setPin(pin: string, currentPin?: string) {
  const res = await fetch("/api/pin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pin, ...(currentPin ? { currentPin } : {}) }),
  });
  return readOrPin<{ set: boolean }>(res, "Couldn't save your PIN.");
}
