"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { field } from "@/components/VaultForms";

const labelCls = "mb-1.5 block text-[12px] font-semibold text-ink";

/**
 * Start a payment the user then approves with their PIN: to a saved person
 * (beneficiaryId) or a place (placeId). Axis takes the bank and account from its
 * own records, never from this form, and shows the bank's name before approval.
 */
export function PayForm({
  to,
  defaultReference = "",
  defaultPurpose = "",
}: {
  to: { beneficiaryId: string } | { placeId: string };
  defaultReference?: string;
  defaultPurpose?: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState(defaultReference);
  const [purpose, setPurpose] = useState(defaultPurpose);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const naira = amount.replace(/[,\s₦]/g, "");
    if (!/^[1-9]\d{0,9}(\.\d{1,2})?$/.test(naira)) return setError("Enter an amount in naira, e.g. 5000");
    if (!reference.trim()) return setError("Add a reference the payee will see, e.g. an invoice number or your table");
    if (!purpose.trim()) return setError("Say what it's for");
    setBusy(true);
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...to, amountNaira: naira, reference: reference.trim(), purpose: purpose.trim() }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) throw new Error(data.error || "Couldn't prepare this payment. Try again.");
      router.push(`/approve/${data.id}`);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <label className={labelCls} htmlFor="pay-amount">Amount (₦)</label>
      <input id="pay-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="5000" className={`${field} mb-3 text-[20px] font-bold`} />
      <label className={labelCls} htmlFor="pay-ref">Reference</label>
      <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value.slice(0, 100))} placeholder="Invoice number, table, or a note for them" className={`${field} mb-3`} />
      <label className={labelCls} htmlFor="pay-purpose">For</label>
      <input id="pay-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value.slice(0, 200))} placeholder="e.g. rent, lunch" className={`${field} mb-3`} />
      {error && <p className="mb-2 text-[12.5px] text-red-deep" role="alert">{error}</p>}
      <button type="submit" disabled={busy} className="w-full rounded-full bg-red py-3.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-red-dark disabled:opacity-40">
        {busy ? "Preparing…" : "Continue"}
      </button>
      <p className="mt-2 text-center text-[11.5px] text-faint">Next you&rsquo;ll see the exact amount from your wallet and approve with your PIN.</p>
    </form>
  );
}
