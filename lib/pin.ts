import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

// The step-up before money moves. brain answers 403 with a pin_* code when an
// action needs it; callers retry with a credential (see PinProvider). The
// credential is either the PIN or a passkey assertion — brain accepts both.
export type Cred = { pin?: string; passkey?: unknown };
export type PinCode = "pin_not_set" | "pin_required" | "wrong_pin" | "pin_locked" | "passkey_failed" | "passkey_unavailable";
const CODES = new Set<string>(["pin_not_set", "pin_required", "wrong_pin", "pin_locked", "passkey_failed", "passkey_unavailable"]);

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

export type Passkey = { credentialId: string; label: string; createdAt: string; lastUsedAt: string | null };

/** The user's passkeys, and whether this deployment supports them at all. */
export async function listPasskeys(): Promise<{ passkeys: Passkey[]; available: boolean }> {
  const res = await fetch("/api/passkeys", { cache: "no-store" });
  if (res.status === 503) return { passkeys: [], available: false };
  return readOrPin(res, "Couldn't load your passkeys.");
}

/** Whether this browser can do WebAuthn at all. */
export const passkeysSupported = () => typeof window !== "undefined" && Boolean(window.PublicKeyCredential);

/** Enrol a passkey on this device: brain issues the challenge, the device signs it. */
export async function enrollPasskey(label?: string): Promise<Passkey[]> {
  const begin = await fetch("/api/passkeys/register", { method: "POST" });
  const options = await readOrPin<Record<string, unknown>>(begin, "Couldn't start passkey setup.");
  const attestation = await startRegistration({ optionsJSON: options as never });
  const finish = await fetch("/api/passkeys/register/finish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ response: attestation, ...(label ? { label } : {}) }),
  });
  return (await readOrPin<{ passkeys: Passkey[] }>(finish, "Couldn't finish passkey setup.")).passkeys;
}

export async function removePasskey(credentialId: string): Promise<Passkey[]> {
  const res = await fetch(`/api/passkeys/${encodeURIComponent(credentialId)}`, { method: "DELETE" });
  return (await readOrPin<{ passkeys: Passkey[] }>(res, "Couldn't remove the passkey.")).passkeys;
}

/** Sign a step-up with a passkey, returning the assertion to send with the action. */
export async function passkeyStepUp(): Promise<unknown> {
  const begin = await fetch("/api/passkeys/auth", { method: "POST" });
  const options = await readOrPin<Record<string, unknown>>(begin, "Couldn't start the passkey.");
  return startAuthentication({ optionsJSON: options as never });
}
