"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { lagosTime } from "@/lib/format";
import { disconnect, saveSettings } from "@/lib/settings";
import { type StandingOrder, autoSummary, describeSchedule, updateStanding } from "@/lib/standing";

type App = { id: string; name: string; until: string; can: string };
type Permissions = { spendingPaused: boolean; autopay: StandingOrder[]; apps: App[] };

const card = "rounded-[20px] bg-white p-4 shadow-card";
const heading = "mb-2 mt-5 text-[10px] font-bold tracking-[0.1em] text-faint uppercase";

/**
 * Everything that can act on the user's money without a fresh tap from them:
 * auto-pay mandates and connected AI apps, in plain words, each revocable here.
 */
export default function PermissionsPage() {
  const router = useRouter();
  useGuard("complete");
  const [data, setData] = useState<Permissions | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/permissions", { cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as Permissions & { error?: string };
    if (!res.ok) throw new Error(body.error || "Couldn't load your permissions.");
    setData(body);
  }, []);

  const act = useCallback(
    async (action: () => Promise<unknown>) => {
      setBusy(true);
      setError("");
      try {
        await action();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  useEffect(() => {
    // Loading the user's standing permissions after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch((e: Error) => setError(e.message));
  }, [load]);

  return (
    <PhoneFrame>
      <main className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-2">
          <button
            onClick={() => router.push("/home")}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span aria-hidden="true">&larr;</span> Home
          </button>
          <h2 className="font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">Permissions</h2>
          <p className="mt-2 text-[13px] leading-[1.5] text-faint">
            Everything that can act on your money without asking you each time. Every payment still checks your limits.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {error && <p className="mb-3 text-[13px] text-red-deep" role="alert">{error}</p>}
          {!data && !error && <p className="text-[13.5px] text-faint">Loading…</p>}
          {data && (
            <>
              <div className={`${card} mt-1 flex items-start gap-3 ${data.spendingPaused ? "ring-2 ring-red" : ""}`}>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-bold text-ink">{data.spendingPaused ? "All spending is paused" : "Pause all spending"}</div>
                  <p className="mt-0.5 text-[12.5px] leading-[1.45] text-faint">
                    Stops every payment below, and any other, until you turn it back on.
                  </p>
                </div>
                <button
                  role="switch"
                  aria-checked={data.spendingPaused}
                  aria-label="Pause all spending"
                  disabled={busy}
                  onClick={() => void act(() => saveSettings({ spendingPaused: !data.spendingPaused }))}
                  className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${data.spendingPaused ? "bg-red" : "bg-unfilled"}`}
                >
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${data.spendingPaused ? "left-6" : "left-1"}`} />
                </button>
              </div>

              <div className={heading}>Auto-pay</div>
              {data.autopay.length === 0 && (
                <p className="text-[13px] text-muted">
                  No auto-pay. Recurring payments ask you each time.{" "}
                  <button onClick={() => router.push("/recurring")} className="font-semibold text-ink underline underline-offset-2">
                    Recurring
                  </button>
                </p>
              )}
              <ul className="flex flex-col gap-2.5">
                {data.autopay.map((o) => (
                  <li key={o.id} className={card}>
                    <div className="text-[15px] font-bold text-ink">{o.label}</div>
                    <div className="mt-0.5 text-[12.5px] text-muted">
                      {o.schedule ? describeSchedule(o.schedule) : ""} · ₦{Number(o.spec.amountNaira).toLocaleString("en-NG")}
                    </div>
                    <div className="mt-1 text-[12.5px] text-ink">{autoSummary(o).replace(/^a/, "A")}</div>
                    {o.originText && <div className="mt-1 text-[12px] text-faint italic">You said: &ldquo;{o.originText}&rdquo;</div>}
                    <div className="mt-1 text-[11.5px] text-faint">
                      {o.autoRuns} {o.autoRuns === 1 ? "payment" : "payments"} made automatically
                      {o.lastRun ? ` · last run ${lagosTime(o.lastRun.dueAt)}` : ""}
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => void act(() => updateStanding(o.id, { action: "set_auto", autoMaxMinor: null }))}
                      className="mt-3 w-full rounded-full bg-line py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-red-tint disabled:opacity-40"
                    >
                      Revoke auto-pay (ask me each time)
                    </button>
                  </li>
                ))}
              </ul>

              <div className={heading}>Connected AI apps</div>
              {data.apps.length === 0 && <p className="text-[13px] text-muted">No AI apps connected.</p>}
              <ul className="flex flex-col gap-2.5">
                {data.apps.map((a) => (
                  <li key={a.id} className={card}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[15px] font-bold text-ink">{a.name}</span>
                      <span className="shrink-0 text-[11.5px] text-faint">until {lagosTime(a.until)}</span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-[1.45] text-muted">{a.can}</p>
                    <button
                      disabled={busy}
                      onClick={() => void act(() => disconnect(a.id))}
                      className="mt-3 w-full rounded-full bg-line py-2.5 text-[13px] font-bold text-ink transition-colors hover:bg-red-tint disabled:opacity-40"
                    >
                      Disconnect {a.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}
