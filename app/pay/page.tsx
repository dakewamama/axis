"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { useVault } from "@/components/VaultProvider";
import { PayForm } from "@/components/PayForm";
import { field } from "@/components/VaultForms";

/** Pay someone you saved. They are chosen from your saved people, never typed here. */
function Pay() {
  const router = useRouter();
  useGuard("complete");
  const params = useSearchParams();
  const { vault, loaded } = useVault();
  const [to, setTo] = useState(params.get("to") ?? "");
  const person = vault.beneficiaries.find((b) => b.id === to);

  return (
    <PhoneFrame>
      <main className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-3">
          <button
            onClick={() => router.back()}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span aria-hidden="true">&larr;</span> Back
          </button>
          <h2 className="font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">Pay someone</h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {!loaded && <p className="text-[13.5px] text-faint">Loading…</p>}
          {loaded && vault.beneficiaries.length === 0 && (
            <button onClick={() => router.push("/vault")} className="w-full rounded-[20px] bg-white p-4 text-left text-[13.5px] text-muted shadow-card">
              Save the person first in Saved details →
            </button>
          )}
          {loaded && vault.beneficiaries.length > 0 && (
            <div className="rounded-[20px] bg-white p-4 shadow-lift">
              <label className="mb-1.5 block text-[12px] font-semibold text-ink" htmlFor="pay-to">Pay</label>
              <select id="pay-to" value={to} onChange={(e) => setTo(e.target.value)} className={`${field} mb-2`}>
                <option value="">Choose someone you saved</option>
                {vault.beneficiaries.map((b) => (
                  <option key={b.id} value={b.id}>{b.label} · {b.bank} {b.accountNumber}</option>
                ))}
              </select>
              {person && (
                <p className="mb-3 text-[12px] text-faint">
                  {person.accountName ? `${person.accountName}, confirmed by the bank` : "The bank has not confirmed this account name yet."}
                </p>
              )}
              {person && <PayForm key={person.id} to={{ beneficiaryId: person.id }} defaultPurpose={person.note} />}
            </div>
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}

export default function PayPage() {
  return (
    <Suspense>
      <Pay />
    </Suspense>
  );
}
