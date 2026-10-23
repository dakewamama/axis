"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { lagosTime } from "@/lib/format";
import { StatusChip } from "@/components/ActivityList";
import {
  type ActivityDetail,
  type SupportReport,
  amountOf,
  explorer,
  loadActivityItem,
  naira,
  reportProblem,
  sol,
  usdc,
} from "@/lib/activity";

/** A Solana transaction signature (base58, 64 bytes), which Solscan can show. */
const isSignature = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{64,90}$/.test(s);

const time = (at: string) => lagosTime(at);

/** One payment, request or deposit: what it is, where it stands, and what happened, with proof. */
export default function ActivityDetailPage() {
  const router = useRouter();
  const ready = useGuard("complete");
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ActivityDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await loadActivityItem(decodeURIComponent(id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load this.");
    }
  }, [id]);

  useEffect(() => {
    if (!ready) return;
    // Load after the session is restored; refresh while the outcome is still open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [ready, load]);

  const item = data?.item;
  const rows: [string, string][] = item
    ? [
        ...(item.subtitle ? ([["Details", item.subtitle]] as [string, string][]) : []),
        ...(item.recurring ? ([["Recurring", item.recurring]] as [string, string][]) : []),
        ...(item.amountKobo ? ([["Amount", naira(item.amountKobo)]] as [string, string][]) : []),
        ...(item.usdcMinor
          ? ([[item.direction === "in" ? "Credited" : "Taken from your wallet", usdc(item.usdcMinor)]] as [string, string][])
          : []),
        ...(item.maxDebitMinor && !item.usdcMinor ? ([["Most you approved", usdc(item.maxDebitMinor)]] as [string, string][]) : []),
        ...(item.asset && item.direction === "out" ? ([["Paid with", item.asset]] as [string, string][]) : []),
        ...(item.lamports ? ([["Received", sol(item.lamports)]] as [string, string][]) : []),
        ["Date", time(item.at)],
        ...(item.expectBy ? ([["Expected by", time(item.expectBy)]] as [string, string][]) : []),
      ]
    : [];

  return (
    <PhoneFrame>
      <main className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-2">
          <button
            onClick={() => router.push("/activity")}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span aria-hidden="true">&larr;</span> Activity
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {error && <p className="text-[13.5px] text-red-deep" role="alert">{error}</p>}
          {!item && !error && <p className="text-[13.5px] text-faint">Loading…</p>}
          {item && (
            <>
              <div className="mb-1 flex items-center gap-2">
                <StatusChip status={item.status} />
              </div>
              <h2 className="font-display text-[26px] leading-[1.1] font-extrabold tracking-[-0.02em] text-ink">{item.title}</h2>
              <div className={`mt-1 font-display text-[34px] font-extrabold tracking-[-0.02em] ${item.direction === "in" ? "text-red-deep" : "text-ink"}`}>
                {amountOf(item)}
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.5] text-muted">{item.note}</p>
              {item.approvalId && (
                <button
                  onClick={() => router.push(`/approve/${item.approvalId}`)}
                  className="mt-4 w-full rounded-full bg-red py-3.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-red-dark"
                >
                  Review and approve
                </button>
              )}

              <dl className="mt-5 rounded-[20px] bg-white p-4 shadow-card">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 text-[13px] last:border-0">
                    <dt className="shrink-0 text-faint">{k}</dt>
                    <dd className="min-w-0 text-right font-semibold break-words text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              {data.timeline.length > 0 && (
                <>
                  <div className="mt-6 mb-2 text-[10px] font-bold tracking-[0.1em] text-faint uppercase">What happened</div>
                  <ol className="relative ml-1.5 border-l-2 border-line">
                    {data.timeline.map((t, n) => (
                      <li key={n} className="relative pb-4 pl-4 last:pb-0">
                        <span
                          aria-hidden="true"
                          className={`absolute top-1.5 -left-[5px] h-2 w-2 rounded-full ${n === data.timeline.length - 1 ? "bg-red" : "bg-unfilled"}`}
                        />
                        <div className="text-[11px] text-faint">{time(t.at)}</div>
                        <div className="text-[13.5px] leading-[1.45] text-ink">{t.text}</div>
                        {t.proof && !isSignature(t.proof) && (
                          <div className="mt-0.5 font-mono text-[11.5px] break-all text-muted">Proof: {t.proof}</div>
                        )}
                        {t.proof && isSignature(t.proof) && (
                          <a
                            href={explorer(t.proof)}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-0.5 inline-block font-mono text-[11.5px] text-muted underline decoration-unfilled underline-offset-2 hover:text-ink"
                          >
                            Proof: {t.proof.slice(0, 10)}…{t.proof.slice(-6)}
                          </a>
                        )}
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <Reports
                reports={data.reports}
                reasons={data.reasons}
                onReport={async (reason, details) => {
                  const reports = await reportProblem(item.id, reason, details);
                  setData({ ...data, reports });
                }}
              />
            </>
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}

const REPORT_STATUS: Record<SupportReport["status"], { label: string; tone: string }> = {
  open: { label: "Reported", tone: "bg-red-tint text-red-deep" },
  investigating: { label: "Support is on it", tone: "bg-amber/20 text-ink" },
  resolved: { label: "Resolved", tone: "bg-ink text-white" },
};

/** Problems reported on this item, and a way to report one. Support replies in chat and here. */
function Reports({
  reports,
  reasons,
  onReport,
}: {
  reports: SupportReport[];
  reasons: Record<string, string>;
  onReport: (reason: string, details: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!Object.keys(reasons).length) return null;
  return (
    <div className="mt-6">
      {reports.map((r) => (
        <div key={r.id} className="mb-2 rounded-[16px] bg-white p-3.5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-semibold text-ink">{r.reasonText}</span>
            <span className={`shrink-0 rounded-full px-2 py-[3px] text-[10px] font-extrabold tracking-[0.04em] uppercase ${REPORT_STATUS[r.status].tone}`}>
              {REPORT_STATUS[r.status].label}
            </span>
          </div>
          {r.details && <p className="mt-1 text-[12.5px] whitespace-pre-line text-muted">{r.details}</p>}
          {r.resolution && <p className="mt-1.5 text-[12.5px] text-ink">Axis support: {r.resolution}</p>}
        </div>
      ))}
      {open ? (
        <form
          className="rounded-[18px] bg-white p-4 shadow-lift"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!reason) return setError("Choose what went wrong.");
            setBusy(true);
            setError("");
            try {
              await onReport(reason, details);
              setOpen(false);
              setReason("");
              setDetails("");
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="mb-2 text-[12px] font-semibold text-ink">What went wrong?</div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {Object.entries(reasons).map(([id, text]) => (
              <button
                key={id}
                type="button"
                aria-pressed={reason === id}
                onClick={() => setReason(id)}
                className={`rounded-full px-3 py-2 text-left text-[12px] font-bold transition-colors ${reason === id ? "bg-ink text-white" : "bg-line text-ink hover:bg-red-tint"}`}
              >
                {text}
              </button>
            ))}
          </div>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value.slice(0, 1000))}
            rows={3}
            placeholder="Anything that helps, e.g. the session ID from the recipient's bank"
            className="mb-2 w-full resize-none rounded-2xl bg-field px-4 py-3 text-[16px] text-ink outline-none placeholder:text-unfilled focus:ring-2 focus:ring-ink/15"
          />
          {error && <p className="mb-2 text-[12.5px] text-red-deep" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-full bg-line py-3 text-sm font-semibold text-ink hover:bg-unfilled">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="flex-1 rounded-full bg-red py-3 text-sm font-bold text-white hover:bg-red-dark disabled:opacity-40">
              {busy ? "Sending…" : "Send report"}
            </button>
          </div>
          <p className="mt-2 text-[11.5px] text-faint">Axis support checks it with the provider and replies in your chat.</p>
        </form>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-full rounded-full py-3 text-[13px] font-semibold text-muted transition-colors hover:bg-white hover:text-ink"
        >
          Report a problem
        </button>
      )}
    </div>
  );
}
