"use client";

import { useEffect, useState } from "react";
import { useVault } from "@/components/VaultProvider";
import { useLocation } from "@/components/LocationProvider";
import type { Address, Beneficiary, Phone, Section } from "@/lib/vault";

export const field =
  "h-[46px] w-full rounded-2xl bg-field px-4 text-[16px] text-ink outline-none transition-shadow placeholder:text-unfilled focus:ring-2 focus:ring-ink/15";
const labelCls = "mb-1.5 block text-[12px] font-semibold text-ink";

/** Common save/cancel/delete footer with error handling. */
function useSubmit(section: Section, id: string | undefined, onDone: () => void) {
  const { save, remove } = useVault();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return {
    busy,
    error,
    submit: (details: Record<string, unknown>) => run(() => save(section, details, id)),
    destroy: id ? () => run(() => remove(section, id)) : undefined,
  };
}

function Footer({
  busy,
  error,
  canSave,
  saveLabel,
  onCancel,
  onDelete,
}: {
  busy: boolean;
  error: string;
  canSave: boolean;
  saveLabel: string;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  return (
    <>
      {error && (
        <p className="mt-3 text-[12.5px] leading-[1.4] text-red-deep" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full bg-line py-3 text-sm font-semibold text-ink transition-colors hover:bg-unfilled"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy || !canSave}
          className="flex-1 rounded-full bg-red py-3 text-sm font-bold text-white transition-colors hover:bg-red-dark disabled:opacity-40"
        >
          {busy ? "Saving…" : saveLabel}
        </button>
      </div>
      {onDelete && (
        <button
          type="button"
          disabled={busy}
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
          className="mt-2 w-full rounded-full py-2.5 text-[12.5px] font-semibold text-red transition-colors hover:bg-red-tint disabled:opacity-40"
        >
          {confirming ? "Tap again to delete" : "Delete"}
        </button>
      )}
    </>
  );
}

/** Banks Axis can pay, fetched once per page load for the bank field. */
let bankList: Promise<string[]> | null = null;
function useBanks(): string[] {
  const [banks, setBanks] = useState<string[]>([]);
  useEffect(() => {
    bankList ??= fetch("/api/banks")
      .then((r) => r.json())
      .then((d: { banks?: string[] }) => d.banks ?? [])
      .catch(() => []);
    void bankList.then(setBanks);
  }, []);
  return banks;
}

export function BeneficiaryForm({ entry, onDone }: { entry?: Beneficiary; onDone: () => void }) {
  const [label, setLabel] = useState(entry?.label ?? "");
  const [bank, setBank] = useState(entry?.bank ?? "");
  const [accountNumber, setAccountNumber] = useState(entry?.accountNumber ?? "");
  const [note, setNote] = useState(entry?.note ?? "");
  const { busy, error, submit, destroy } = useSubmit("beneficiaries", entry?.id, onDone);
  const banks = useBanks();
  const valid = label.trim() && bank.trim().length >= 2 && /^\d{10}$/.test(accountNumber);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void submit({ label, bank, accountNumber, ...(note.trim() ? { note } : {}) });
      }}
    >
      <label className={labelCls} htmlFor="b-label">Who is this?</label>
      <input id="b-label" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder="e.g. Landlord, Mum, Tailor" className={`${field} mb-3`} />
      <label className={labelCls} htmlFor="b-bank">Bank</label>
      <input id="b-bank" list="b-banks" autoComplete="off" value={bank} onChange={(e) => setBank(e.target.value.slice(0, 80))} placeholder="e.g. GTBank, OPay, Moniepoint" className={`${field} mb-3`} />
      <datalist id="b-banks">
        {banks.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      <label className={labelCls} htmlFor="b-acct">Account number</label>
      <input
        id="b-acct"
        inputMode="numeric"
        autoComplete="off"
        value={accountNumber}
        onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
        placeholder="10 digits"
        className={`${field} mb-3 font-mono tracking-[0.06em]`}
      />
      <label className={labelCls} htmlFor="b-note">Note (optional)</label>
      <input id="b-note" value={note} onChange={(e) => setNote(e.target.value.slice(0, 200))} placeholder="e.g. rent, every 1st" className={field} />
      <p className="mt-2 text-[11.5px] leading-[1.4] text-faint">
        Axis asks the bank for the account name when you save, so you can check it before paying.
      </p>
      <Footer busy={busy} error={error} canSave={Boolean(valid)} saveLabel={entry ? "Save changes" : "Save person"} onCancel={onDone} onDelete={destroy} />
    </form>
  );
}

export function AddressForm({ entry, onDone }: { entry?: Address; onDone: () => void }) {
  const { current } = useLocation();
  const [label, setLabel] = useState(entry?.label ?? "");
  const [line1, setLine1] = useState(entry?.line1 ?? "");
  const [line2, setLine2] = useState(entry?.line2 ?? "");
  const [landmark, setLandmark] = useState(entry?.landmark ?? "");
  const [city, setCity] = useState(entry?.city ?? "");
  const [state, setState] = useState(entry?.state ?? "");
  const [phone, setPhone] = useState(entry?.phone ?? "");
  const [isDefault, setIsDefault] = useState(entry?.isDefault ?? false);
  const hadPin = entry?.latitude != null && entry?.longitude != null;
  const [pin, setPin] = useState<"keep" | "here" | "none">(hadPin ? "keep" : "none");
  const { busy, error, submit, destroy } = useSubmit("addresses", entry?.id, onDone);
  const valid = label.trim() && line1.trim().length >= 3 && city.trim().length >= 2;
  const coords =
    pin === "here" && current
      ? { latitude: current.lat, longitude: current.lng, ...(current.accuracy !== undefined ? { accuracyM: current.accuracy } : {}) }
      : pin === "keep" && hadPin
        ? { latitude: entry!.latitude, longitude: entry!.longitude, ...(entry!.accuracyM !== null ? { accuracyM: entry!.accuracyM } : {}) }
        : {};
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        void submit({
          label,
          line1,
          city,
          ...(line2.trim() ? { line2 } : {}),
          ...(landmark.trim() ? { landmark } : {}),
          ...(state.trim() ? { state } : {}),
          ...(phone.trim() ? { phone } : {}),
          ...coords,
          isDefault,
        });
      }}
    >
      <label className={labelCls} htmlFor="a-label">Name</label>
      <input id="a-label" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder="e.g. Home, Office, Mum's place" className={`${field} mb-3`} />
      <label className={labelCls} htmlFor="a-line1">Street address</label>
      <input id="a-line1" autoComplete="address-line1" value={line1} onChange={(e) => setLine1(e.target.value.slice(0, 160))} placeholder="e.g. 12 Admiralty Way" className={`${field} mb-3`} />
      <label className={labelCls} htmlFor="a-line2">Flat, estate or floor (optional)</label>
      <input id="a-line2" autoComplete="address-line2" value={line2} onChange={(e) => setLine2(e.target.value.slice(0, 160))} className={`${field} mb-3`} />
      <label className={labelCls} htmlFor="a-landmark">Landmark (optional)</label>
      <input id="a-landmark" value={landmark} onChange={(e) => setLandmark(e.target.value.slice(0, 160))} placeholder="e.g. opposite the filling station" className={`${field} mb-3`} />
      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <label className={labelCls} htmlFor="a-city">Area / city</label>
          <input id="a-city" autoComplete="address-level2" value={city} onChange={(e) => setCity(e.target.value.slice(0, 80))} placeholder="Lekki" className={field} />
        </div>
        <div className="flex-1">
          <label className={labelCls} htmlFor="a-state">State</label>
          <input id="a-state" autoComplete="address-level1" value={state} onChange={(e) => setState(e.target.value.slice(0, 80))} placeholder="Lagos" className={field} />
        </div>
      </div>
      <label className={labelCls} htmlFor="a-phone">Phone for delivery (optional)</label>
      <input id="a-phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 20))} placeholder="0803 123 4567" className={`${field} mb-3`} />

      <fieldset className="mb-1">
        <legend className={labelCls}>Map pin</legend>
        <div className="flex flex-wrap gap-1.5">
          {hadPin && <Chip on={pin === "keep"} onClick={() => setPin("keep")}>Keep saved pin</Chip>}
          <Chip on={pin === "here"} disabled={!current} onClick={() => setPin("here")}>
            {current ? `Use where I am (±${Math.round(current.accuracy ?? 0)} m)` : "Set your location first"}
          </Chip>
          <Chip on={pin === "none"} onClick={() => setPin("none")}>No pin</Chip>
        </div>
      </fieldset>
      <label className="mt-3 flex items-center gap-2.5 text-[13.5px] font-semibold text-ink">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="h-5 w-5 accent-[var(--color-red)]" />
        Use as my default address
      </label>
      <Footer busy={busy} error={error} canSave={Boolean(valid)} saveLabel={entry ? "Save changes" : "Save address"} onCancel={onDone} onDelete={destroy} />
    </form>
  );
}

const NETWORKS = [
  { id: "mtn", label: "MTN" },
  { id: "airtel", label: "Airtel" },
  { id: "glo", label: "Glo" },
  { id: "9mobile", label: "9mobile" },
];

export function PhoneForm({ entry, onDone }: { entry?: Phone; onDone: () => void }) {
  const [label, setLabel] = useState(entry?.label ?? "");
  const [phone, setPhone] = useState(entry?.phone ?? "");
  const [network, setNetwork] = useState(entry?.network ?? "");
  const { busy, error, submit, destroy } = useSubmit("phones", entry?.id, onDone);
  const valid = label.trim() && phone.replace(/\D/g, "").length >= 10;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) void submit({ label, phone, ...(network ? { network } : {}) });
      }}
    >
      <label className={labelCls} htmlFor="p-label">Whose line?</label>
      <input id="p-label" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder="e.g. Me, Mum, Office MiFi" className={`${field} mb-3`} />
      <label className={labelCls} htmlFor="p-phone">Phone number</label>
      <input id="p-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value.slice(0, 20))} placeholder="0803 123 4567" className={`${field} mb-3`} />
      <div className={labelCls}>Network</div>
      <div className="flex flex-wrap gap-1.5">
        {NETWORKS.map((n) => (
          <Chip key={n.id} on={network === n.id} onClick={() => setNetwork(network === n.id ? "" : n.id)}>
            {n.label}
          </Chip>
        ))}
      </div>
      <Footer busy={busy} error={error} canSave={Boolean(valid)} saveLabel={entry ? "Save changes" : "Save line"} onCancel={onDone} onDelete={destroy} />
    </form>
  );
}

function Chip({ on, disabled, onClick, children }: { on: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors disabled:opacity-40 ${
        on ? "bg-ink text-white" : "bg-line text-ink hover:bg-red-tint"
      }`}
    >
      {children}
    </button>
  );
}
