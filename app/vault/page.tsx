"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { useVault } from "@/components/VaultProvider";
import { AddressForm, BeneficiaryForm, PhoneForm } from "@/components/VaultForms";
import { type Address, type Beneficiary, type Phone, type Section, addressLine, formatNgPhone } from "@/lib/vault";

const TABS: { id: Section; label: string; empty: string; add: string }[] = [
  { id: "beneficiaries", label: "People", empty: "Save the people and businesses you pay. Then just say “pay my landlord 150k”.", add: "Add someone you pay" },
  { id: "addresses", label: "Addresses", empty: "Save where things get delivered: home, office, family.", add: "Add an address" },
  { id: "phones", label: "Phone lines", empty: "Save lines you top up, so “₦2k airtime for mum” just works.", add: "Add a phone line" },
];

type Editing = { section: Section; id?: string } | null;

/**
 * Everything Axis remembers for the user, stored on their account (not this
 * device) and used by the Axis chat and connected AI apps to act without
 * retyping account numbers, addresses or phone numbers.
 */
export default function VaultPage() {
  const router = useRouter();
  useGuard("complete");
  const { vault, loaded, error } = useVault();
  const [tab, setTab] = useState<Section>("beneficiaries");
  const [editing, setEditing] = useState<Editing>(null);
  const meta = TABS.find((t) => t.id === tab)!;
  const counts: Record<Section, number> = {
    beneficiaries: vault.beneficiaries.length,
    addresses: vault.addresses.length,
    phones: vault.phones.length,
  };
  const done = () => setEditing(null);

  return (
    <PhoneFrame>
      <main className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-3">
          <button
            onClick={() => router.push("/home")}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span aria-hidden="true">&larr;</span> Home
          </button>
          <h2 className="mb-2 font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
            Your saved details.
          </h2>
          <p className="text-[13px] leading-[1.5] text-faint">
            Kept on your Axis account, private to you. Axis uses them here and in ChatGPT or Claude, and still
            asks you to approve every payment.
          </p>
        </div>

        <div role="tablist" aria-label="Saved details" className="flex gap-1.5 px-6 pb-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                setTab(t.id);
                setEditing(null);
              }}
              className={`rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                tab === t.id ? "bg-ink text-white" : "bg-white text-ink shadow-card hover:bg-red-tint"
              }`}
            >
              {t.label}
              {counts[t.id] > 0 && <span className={tab === t.id ? "ml-1.5 text-white/60" : "ml-1.5 text-faint"}>{counts[t.id]}</span>}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="flex-1 overflow-y-auto px-6 pb-8">
          {error && <p className="mb-3 text-[13px] text-red-deep" role="alert">{error}</p>}
          {!loaded && !error && <p className="text-[13.5px] text-faint">Loading your saved details…</p>}

          {loaded && editing?.section === tab ? (
            <div className="rounded-[22px] bg-white p-[18px] shadow-lift">
              <div className="mb-3 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">
                {editing.id ? "Edit" : meta.add}
              </div>
              {tab === "beneficiaries" && (
                <BeneficiaryForm key={editing.id ?? "new"} entry={vault.beneficiaries.find((b) => b.id === editing.id)} onDone={done} />
              )}
              {tab === "addresses" && (
                <AddressForm key={editing.id ?? "new"} entry={vault.addresses.find((a) => a.id === editing.id)} onDone={done} />
              )}
              {tab === "phones" && <PhoneForm key={editing.id ?? "new"} entry={vault.phones.find((p) => p.id === editing.id)} onDone={done} />}
            </div>
          ) : (
            loaded && (
              <>
                {counts[tab] === 0 && <p className="mb-4 text-[13.5px] leading-[1.5] text-muted">{meta.empty}</p>}
                {tab === "beneficiaries" && counts.beneficiaries > 0 && (
                  <button
                    onClick={() => router.push("/pay")}
                    className="mb-3 w-full rounded-full bg-red py-3 text-[13.5px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark"
                  >
                    Pay someone
                  </button>
                )}
                <ul className="flex flex-col gap-2">
                  {tab === "beneficiaries" &&
                    vault.beneficiaries.map((b) => <BeneficiaryRow key={b.id} b={b} onEdit={() => setEditing({ section: tab, id: b.id })} />)}
                  {tab === "addresses" &&
                    vault.addresses.map((a) => <AddressRow key={a.id} a={a} onEdit={() => setEditing({ section: tab, id: a.id })} />)}
                  {tab === "phones" && vault.phones.map((p) => <PhoneRow key={p.id} p={p} onEdit={() => setEditing({ section: tab, id: p.id })} />)}
                </ul>
                <button
                  onClick={() => setEditing({ section: tab })}
                  className="mt-3 flex w-full items-center gap-3 rounded-[18px] border border-dashed border-unfilled px-4 py-3.5 text-left transition-colors hover:bg-white"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line text-base leading-none font-bold text-ink">
                    +
                  </span>
                  <span className="text-[14.5px] font-semibold text-muted">{meta.add}</span>
                </button>
              </>
            )
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}

function Row({ title, detail, sub, badge, onEdit }: { title: string; detail: React.ReactNode; sub?: string; badge?: React.ReactNode; onEdit: () => void }) {
  return (
    <li>
      <button
        onClick={onEdit}
        className="flex w-full items-center gap-3 rounded-[18px] bg-white px-4 py-3.5 text-left shadow-card transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] leading-[1.2] font-bold text-ink">{title}</span>
          <span className="mt-0.5 block truncate text-[12px] text-faint">{detail}</span>
          {sub && <span className="mt-0.5 block truncate text-[12px] font-semibold text-muted">{sub}</span>}
        </span>
        {badge}
        <span aria-hidden="true" className="text-faint">
          &rsaquo;
        </span>
      </button>
    </li>
  );
}

const NETWORK: Record<string, string> = { mtn: "MTN", airtel: "Airtel", glo: "Glo", "9mobile": "9mobile" };
const pill = "shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold tracking-[0.07em] uppercase";

function BeneficiaryRow({ b, onEdit }: { b: Beneficiary; onEdit: () => void }) {
  return (
    <Row
      title={b.label}
      detail={`${b.accountNumber} · ${b.bank}`}
      sub={b.accountName ?? "Bank name not confirmed yet"}
      badge={b.confirmed ? <span className={`${pill} bg-line text-faint`}>Bank-checked</span> : <span className={`${pill} bg-red-tint text-red-deep`}>Unchecked</span>}
      onEdit={onEdit}
    />
  );
}

function AddressRow({ a, onEdit }: { a: Address; onEdit: () => void }) {
  return (
    <Row
      title={a.label}
      detail={`${addressLine(a)}${a.latitude !== null ? " · pinned" : ""}`}
      badge={a.isDefault ? <span className={`${pill} bg-line text-faint`}>Default</span> : undefined}
      onEdit={onEdit}
    />
  );
}

function PhoneRow({ p, onEdit }: { p: Phone; onEdit: () => void }) {
  return <Row title={p.label} detail={`${formatNgPhone(p.phone)}${p.network ? ` · ${NETWORK[p.network] ?? p.network}` : ""}`} onEdit={onEdit} />;
}
