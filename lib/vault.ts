// The user's saved details, stored by brain (owner-only) and used by Axis to pay
// people, deliver to addresses and top up phone lines without retyping them.
export type Beneficiary = {
  id: string;
  label: string;
  bank: string;
  accountNumber: string;
  /** The bank's own name for the account; null until the bank confirms it. */
  accountName: string | null;
  confirmed: boolean;
  note: string;
  lastUsedAt: string | null;
};
export type Address = {
  id: string;
  label: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  latitude: number | null;
  longitude: number | null;
  accuracyM: number | null;
  isDefault: boolean;
};
export type Phone = { id: string; label: string; phone: string; network: string | null };
export type Vault = { beneficiaries: Beneficiary[]; addresses: Address[]; phones: Phone[] };
export type Section = "beneficiaries" | "addresses" | "phones";

export const EMPTY_VAULT: Vault = { beneficiaries: [], addresses: [], phones: [] };

async function call(path: string, body?: unknown): Promise<Vault> {
  const res = await fetch(path, body === undefined ? { cache: "no-store" } : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Vault & { error?: string };
  if (!res.ok) throw new Error(data.error || `Couldn't reach your saved details (${res.status}).`);
  return data;
}

export const loadVault = () => call("/api/vault");
export const saveEntry = (section: Section, details: Record<string, unknown>, id?: string) =>
  call(`/api/vault/${section}${id ? `/${id}` : ""}`, details);
export const removeEntry = (section: Section, id: string) => call(`/api/vault/${section}/${id}/delete`, {});

/** One line for an address, e.g. "12 Admiralty Way, Lekki". */
export function addressLine(a: Address): string {
  return [a.line1, a.line2, a.city].filter(Boolean).join(", ");
}

/** 08031234567 -> 0803 123 4567 */
export function formatNgPhone(p: string): string {
  return /^\d{11}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
}
