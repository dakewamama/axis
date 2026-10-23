"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { useVault } from "@/components/VaultProvider";
import { field } from "@/components/VaultForms";
import { toMinor } from "@/lib/settings";
import { usdc } from "@/lib/activity";
import {
  MONTHS,
  type Schedule,
  type StandingOrder,
  WEEKDAYS,
  confirmStanding,
  createStanding,
  describeSchedule,
  loadStanding,
  updateStanding,
} from "@/lib/standing";

const labelCls = "mb-1.5 block text-[12px] font-semibold text-ink";
const card = "rounded-[20px] bg-white p-4 shadow-card";
const chip = (on: boolean) =>
  `rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors disabled:opacity-40 ${on ? "bg-ink text-white" : "bg-line text-ink hover:bg-red-tint"}`;
const when = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const OUTCOME: Record<string, string> = {
  awaiting_approval: "Last run is waiting for your approval",
  auto_approved: "Last run was paid automatically",
  failed: "Last run could not be prepared",
  skipped: "Last run was skipped",
  claimed: "A run is starting",
};

/** Payments that repeat on a schedule, and rate alerts. Axis asks before each payment unless you turn on auto-pay. */
export default function RecurringPage() {
  const router = useRouter();
  useGuard("complete");
  const { vault } = useVault();
  const [orders, setOrders] = useState<StandingOrder[] | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (action: () => Promise<StandingOrder[]>) => {
    setBusy(true);
    setError("");
    try {
      setOrders(await action());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    // Loading the user's tasks after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run(loadStanding);
  }, [run]);

  const who = (id?: string) => vault.beneficiaries.find((b) => b.id === id);
  const proposed = (orders ?? []).filter((o) => o.status === "proposed");
  const rest = (orders ?? []).filter((o) => o.status !== "proposed");

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
          <h2 className="font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">Recurring</h2>
          <p className="mt-2 text-[13px] leading-[1.5] text-faint">
            Rent, school fees, renewals: Axis prepares each payment on schedule and asks you to approve it, unless you turn on
            auto-pay with a limit.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {error && <p className="mb-3 text-[13px] text-red-deep" role="alert">{error}</p>}
          {!orders && !error && <p className="text-[13.5px] text-faint">Loading…</p>}

          {proposed.map((o) => (
            <Proposed key={o.id} order={o} payee={who(o.spec.beneficiaryId)?.label} busy={busy} run={run} />
          ))}

          {orders && rest.length === 0 && !creating && proposed.length === 0 && (
            <p className="mb-3 text-[13.5px] leading-[1.5] text-muted">
              Nothing recurring yet. You can also just say it in chat: &ldquo;pay my landlord ₦150k on the 1st of every month&rdquo;.
            </p>
          )}

          <ul className="flex flex-col gap-2.5">
            {rest.map((o) => (
              <Task key={o.id} order={o} payee={who(o.spec.beneficiaryId)?.label} busy={busy} run={run} />
            ))}
          </ul>

          {creating ? (
            <div className={`${card} mt-3 shadow-lift`}>
              <CreateForm
                onCancel={() => setCreating(false)}
                onCreate={async (body) => {
                  if (await run(() => createStanding(body))) setCreating(false);
                }}
                busy={busy}
              />
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="mt-3 flex w-full items-center gap-3 rounded-[18px] border border-dashed border-unfilled px-4 py-3.5 text-left transition-colors hover:bg-white"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line text-base leading-none font-bold text-ink">+</span>
              <span className="text-[14.5px] font-semibold text-muted">Add a recurring payment or alert</span>
            </button>
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}

type Run = (action: () => Promise<StandingOrder[]>) => Promise<boolean>;

function summary(o: StandingOrder, payee?: string): string {
  if (o.kind === "rate_alert") return `When 1 USDC is ${o.spec.direction} ₦${(o.spec.ngnPerUsdc ?? 0).toLocaleString("en-NG")}`;
  const amount = `₦${Number(o.spec.amountNaira).toLocaleString("en-NG")}`;
  return `${amount} to ${payee ?? "a saved person"} · ${o.schedule ? describeSchedule(o.schedule) : ""}`;
}

function AutoPay({ order, busy, onSave, saveLabel = "Save" }: { order: StandingOrder; busy: boolean; onSave: (minor: string | null) => void; saveLabel?: string }) {
  const [on, setOn] = useState(order.mode === "auto");
  const [limit, setLimit] = useState(order.autoMaxMinor ? (Number(order.autoMaxMinor) / 1e6).toString() : "");
  const [err, setErr] = useState("");
  return (
    <div className="mt-3">
      <div className="mb-2 flex flex-wrap gap-1.5">
        <button type="button" className={chip(!on)} disabled={busy} onClick={() => setOn(false)}>Ask me each time</button>
        <button type="button" className={chip(on)} disabled={busy} onClick={() => setOn(true)}>Pay automatically</button>
      </div>
      {on && (
        <>
          <label className={labelCls} htmlFor={`lim-${order.id}`}>Most per payment (USDC)</label>
          <input id={`lim-${order.id}`} inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="e.g. 110" className={`${field} mb-1`} />
          <p className="mb-2 text-[11.5px] leading-[1.4] text-faint">
            A run that costs more than this waits for your approval. Your account limits still apply.
          </p>
        </>
      )}
      {err && <p className="mb-2 text-[12px] text-red-deep">{err}</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setErr("");
          try {
            const minor = on ? toMinor(limit) : null;
            if (on && !minor) throw new Error("Enter a limit for auto-pay");
            onSave(minor);
          } catch (e) {
            setErr((e as Error).message);
          }
        }}
        className="w-full rounded-full bg-ink py-3 text-sm font-bold text-white transition-colors hover:bg-red disabled:opacity-40"
      >
        {saveLabel}
      </button>
    </div>
  );
}

function Proposed({ order, payee, busy, run }: { order: StandingOrder; payee?: string; busy: boolean; run: Run }) {
  return (
    <div className={`${card} mb-3 shadow-lift`}>
      <div className="mb-1 text-[10px] font-bold tracking-[0.09em] text-red-deep uppercase">Suggested in chat · needs you</div>
      <div className="text-[15px] font-bold text-ink">{order.label}</div>
      <div className="mt-0.5 text-[12.5px] text-muted">{summary(order, payee)}</div>
      <AutoPay order={order} busy={busy} saveLabel="Set it up" onSave={(minor) => void run(() => confirmStanding(order.id, minor))} />
      <button
        disabled={busy}
        onClick={() => void run(() => updateStanding(order.id, { action: "end" }))}
        className="mt-2 w-full rounded-full py-2.5 text-[12.5px] font-semibold text-red transition-colors hover:bg-red-tint disabled:opacity-40"
      >
        Don&rsquo;t set this up
      </button>
    </div>
  );
}

function Task({ order, payee, busy, run }: { order: StandingOrder; payee?: string; busy: boolean; run: Run }) {
  const [open, setOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const paused = order.status === "paused";
  return (
    <li className={card}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-start gap-3 text-left" aria-expanded={open}>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-bold text-ink">{order.label}</span>
          <span className="mt-0.5 block text-[12.5px] text-muted">{summary(order, payee)}</span>
          <span className="mt-1 block text-[11.5px] text-faint">
            {paused
              ? "Paused"
              : order.kind === "pay" && order.nextRunAt
                ? `Next: ${when(order.nextRunAt)}${order.runsLeft !== null ? ` · ${order.runsLeft} left` : ""}`
                : "Watching"}
            {order.mode === "auto" && order.autoMaxMinor ? ` · auto-pay up to ${usdc(order.autoMaxMinor)}` : ""}
          </span>
          {order.lastRun && OUTCOME[order.lastRun.outcome] && (
            <span className="mt-0.5 block text-[11.5px] text-faint">{OUTCOME[order.lastRun.outcome]}</span>
          )}
        </span>
        <span aria-hidden="true" className="text-faint">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="mt-3 border-t border-line pt-3">
          {order.kind === "pay" && (
            <AutoPay order={order} busy={busy} onSave={(minor) => void run(() => updateStanding(order.id, { action: "set_auto", autoMaxMinor: minor }))} />
          )}
          <div className="mt-2 flex gap-2">
            <button
              disabled={busy}
              onClick={() => void run(() => updateStanding(order.id, { action: paused ? "resume" : "pause" }))}
              className="flex-1 rounded-full bg-line py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-unfilled disabled:opacity-40"
            >
              {paused ? "Resume" : "Pause"}
            </button>
            <button
              disabled={busy}
              onClick={() => (ending ? void run(() => updateStanding(order.id, { action: "end" })) : setEnding(true))}
              className="flex-1 rounded-full py-2.5 text-[13px] font-semibold text-red transition-colors hover:bg-red-tint disabled:opacity-40"
            >
              {ending ? "Tap again to stop" : "Stop"}
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function CreateForm({ onCancel, onCreate, busy }: { onCancel: () => void; onCreate: (body: Record<string, unknown>) => void; busy: boolean }) {
  const router = useRouter();
  const { vault } = useVault();
  const [kind, setKind] = useState<"pay" | "rate_alert">("pay");
  const [label, setLabel] = useState("");
  const [beneficiaryId, setBeneficiaryId] = useState("");
  const [amount, setAmount] = useState("");
  const [purpose, setPurpose] = useState("");
  const [every, setEvery] = useState<Schedule["every"]>("month");
  const [day, setDay] = useState(1);
  const [weekday, setWeekday] = useState(1);
  const [month, setMonth] = useState(1);
  const [n, setN] = useState(14);
  const [runs, setRuns] = useState("");
  const [auto, setAuto] = useState(false);
  const [limit, setLimit] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [rate, setRate] = useState("");
  const [err, setErr] = useState("");

  const schedule: Schedule =
    every === "month" ? { every, day } : every === "week" ? { every, weekday } : every === "year" ? { every, month, day } : { every, n };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      if (!label.trim()) throw new Error("Give it a name, e.g. Rent");
      if (kind === "rate_alert") {
        const v = Number(rate.replace(/,/g, ""));
        if (!(v > 0)) throw new Error("Enter a naira rate, e.g. 1600");
        onCreate({ kind, label: label.trim(), direction, ngnPerUsdc: v });
        return;
      }
      if (!beneficiaryId) throw new Error("Pick who to pay");
      const naira = amount.replace(/[,\s₦]/g, "");
      if (!/^[1-9]\d{0,9}(\.\d{1,2})?$/.test(naira)) throw new Error("Enter an amount in naira, e.g. 150000");
      if (!purpose.trim()) throw new Error("Say what it's for, e.g. rent");
      const autoMaxMinor = auto ? toMinor(limit) : null;
      if (auto && !autoMaxMinor) throw new Error("Enter a limit for auto-pay");
      onCreate({
        kind,
        label: label.trim(),
        beneficiaryId,
        amountNaira: naira,
        purpose: purpose.trim(),
        schedule,
        ...(runs.trim() ? { runs: Number(runs) } : {}),
        ...(autoMaxMinor ? { autoMaxMinor } : {}),
      });
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <form onSubmit={submit}>
      <div className="mb-3 flex gap-1.5">
        <button type="button" className={chip(kind === "pay")} onClick={() => setKind("pay")}>Payment</button>
        <button type="button" className={chip(kind === "rate_alert")} onClick={() => setKind("rate_alert")}>Rate alert</button>
      </div>
      <label className={labelCls} htmlFor="r-label">Name</label>
      <input id="r-label" value={label} onChange={(e) => setLabel(e.target.value.slice(0, 60))} placeholder={kind === "pay" ? "e.g. Rent" : "e.g. Dollar rate"} className={`${field} mb-3`} />

      {kind === "rate_alert" ? (
        <>
          <div className={labelCls}>Tell me when 1 USDC is</div>
          <div className="mb-2 flex gap-1.5">
            <button type="button" className={chip(direction === "above")} onClick={() => setDirection("above")}>Above</button>
            <button type="button" className={chip(direction === "below")} onClick={() => setDirection("below")}>Below</button>
          </div>
          <input inputMode="decimal" aria-label="Naira per USDC" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="₦ e.g. 1600" className={`${field} mb-3`} />
        </>
      ) : (
        <>
          <label className={labelCls} htmlFor="r-who">Pay</label>
          {vault.beneficiaries.length ? (
            <select id="r-who" value={beneficiaryId} onChange={(e) => setBeneficiaryId(e.target.value)} className={`${field} mb-3`}>
              <option value="">Choose someone you saved</option>
              {vault.beneficiaries.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label} · {b.bank} {b.accountNumber}
                </option>
              ))}
            </select>
          ) : (
            <button type="button" onClick={() => router.push("/vault")} className="mb-3 w-full rounded-2xl bg-field px-4 py-3 text-left text-[13.5px] text-muted">
              Save the person first in Saved details →
            </button>
          )}
          <div className="mb-3 flex gap-2">
            <div className="flex-1">
              <label className={labelCls} htmlFor="r-amount">Amount (₦)</label>
              <input id="r-amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="150000" className={field} />
            </div>
            <div className="flex-1">
              <label className={labelCls} htmlFor="r-purpose">For</label>
              <input id="r-purpose" value={purpose} onChange={(e) => setPurpose(e.target.value.slice(0, 200))} placeholder="rent" className={field} />
            </div>
          </div>
          <div className={labelCls}>How often</div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(["month", "week", "year", "days"] as const).map((e) => (
              <button key={e} type="button" className={chip(every === e)} onClick={() => setEvery(e)}>
                {{ month: "Monthly", week: "Weekly", year: "Yearly", days: "Every N days" }[e]}
              </button>
            ))}
          </div>
          <div className="mb-3 flex gap-2">
            {every === "week" && (
              <select aria-label="Day of the week" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className={field}>
                {WEEKDAYS.map((w, i) => <option key={w} value={i}>{w}</option>)}
              </select>
            )}
            {every === "year" && (
              <select aria-label="Month" value={month} onChange={(e) => setMonth(Number(e.target.value))} className={field}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            )}
            {(every === "month" || every === "year") && (
              <select aria-label="Day of the month" value={day} onChange={(e) => setDay(Number(e.target.value))} className={field}>
                {days.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            {every === "days" && (
              <input aria-label="Number of days" inputMode="numeric" value={n} onChange={(e) => setN(Math.max(1, Math.min(366, Number(e.target.value.replace(/\D/g, "")) || 1)))} className={field} />
            )}
          </div>
          <p className="mb-3 text-[11.5px] text-faint">{describeSchedule(schedule)}, at 9am. Days past a month&rsquo;s end use its last day.</p>
          <label className={labelCls} htmlFor="r-runs">Stop after (optional)</label>
          <input id="r-runs" inputMode="numeric" value={runs} onChange={(e) => setRuns(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Number of payments" className={`${field} mb-3`} />
          <div className={labelCls}>Approval</div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button type="button" className={chip(!auto)} onClick={() => setAuto(false)}>Ask me each time</button>
            <button type="button" className={chip(auto)} onClick={() => setAuto(true)}>Pay automatically</button>
          </div>
          {auto && (
            <>
              <input inputMode="decimal" aria-label="Most per payment in USDC" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="Most per payment, USDC (e.g. 110)" className={`${field} mb-1`} />
              <p className="mb-3 text-[11.5px] leading-[1.4] text-faint">A run that costs more waits for your approval. Your account limits still apply.</p>
            </>
          )}
        </>
      )}

      {err && <p className="mb-2 text-[12.5px] text-red-deep" role="alert">{err}</p>}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-full bg-line py-3 text-sm font-semibold text-ink transition-colors hover:bg-unfilled">Cancel</button>
        <button type="submit" disabled={busy} className="flex-1 rounded-full bg-red py-3 text-sm font-bold text-white transition-colors hover:bg-red-dark disabled:opacity-40">
          {busy ? "Saving…" : "Set it up"}
        </button>
      </div>
    </form>
  );
}
