"use client";

import { useEffect, useState } from "react";
import { SelectRow } from "@/components/SelectRow";
import {
  type Settings,
  fromMinor,
  loadSettings,
  saveSettings,
  toMinor,
} from "@/lib/settings";

const card = "mb-4 rounded-[22px] bg-white p-[18px] shadow-card";
const heading = "mb-3 text-[10px] font-bold tracking-[0.09em] text-faint uppercase";
const input =
  "h-[46px] w-full rounded-full bg-field px-4 text-[16px] text-ink outline-none placeholder:text-faint";

/** The user's Axis configuration, stored and enforced by brain for every connected app. */
export function Configuration() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [perPayment, setPerPayment] = useState("");
  const [monthly, setMonthly] = useState("");
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  function apply(next: Settings) {
    setSettings(next);
    setPerPayment(fromMinor(next.limits.perPaymentMinor));
    setMonthly(fromMinor(next.limits.monthlyMinor));
  }

  useEffect(() => {
    loadSettings()
      .then(apply)
      .catch(() => setError("Couldn't load your settings. Check your connection and reopen this page."));
  }, []);

  async function run(action: () => Promise<Settings>) {
    setBusy(true);
    setError("");
    try {
      apply(await action());
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!settings) {
    return (
      <div className={card}>
        <p className="text-[13.5px] text-faint">{error || "Loading your settings…"}</p>
      </div>
    );
  }

  const { services, limits, connections, mcpUrl } = settings;
  const disabled = services.filter((s) => !s.enabled).map((s) => s.id);
  const covered = limits.tier > 0;

  return (
    <>
      <div className={`${card} ${settings.spendingPaused ? "ring-2 ring-red" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold text-ink">{settings.spendingPaused ? "All spending is paused" : "Pause all spending"}</div>
            <p className="mt-0.5 text-[12.5px] leading-[1.45] text-faint">
              {settings.spendingPaused
                ? "Nothing can be paid from your wallet: not here, not from ChatGPT or Claude, not auto-pay. Turn it back on any time."
                : "One switch that stops every payment from your wallet, from any app and from auto-pay, until you turn it back on."}
            </p>
          </div>
          <button
            role="switch"
            aria-checked={settings.spendingPaused}
            aria-label="Pause all spending"
            disabled={busy}
            onClick={() => run(() => saveSettings({ spendingPaused: !settings.spendingPaused }))}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${settings.spendingPaused ? "bg-red" : "bg-unfilled"}`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.spendingPaused ? "left-6" : "left-1"}`} />
          </button>
        </div>
      </div>

      <div className={card}>
        <div className={heading}>Services</div>
        <div className="flex flex-col gap-2.5">
          {services.map((s) => (
            <SelectRow
              key={s.id}
              label={s.label}
              note={s.note}
              selected={s.enabled}
              disabled={busy}
              onClick={() =>
                run(() =>
                  saveSettings({
                    disabledServices: s.enabled ? [...disabled, s.id] : disabled.filter((id) => id !== s.id),
                  }),
                )
              }
            />
          ))}
        </div>
      </div>

      <div className={card}>
        <div className={heading}>Spending limits</div>
        <p className="mb-3 text-[13px] leading-[1.45] text-faint">
          {covered
            ? `Axis allows up to ${fromMinor(limits.tierPerPaymentMinor)} USDC per payment and ${fromMinor(limits.tierMonthlyMinor)} USDC per 30 days. Set lower limits for yourself; every payment still needs your Approve tap.`
            : "Spending isn't switched on for your account yet. You can still set your limits now."}
        </p>
        <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">Most per payment (USDC)</label>
        <input
          inputMode="decimal"
          value={perPayment}
          onChange={(e) => {
            setPerPayment(e.target.value);
            setSaved(false);
          }}
          placeholder={`Up to ${fromMinor(limits.tierPerPaymentMinor) || "0"}`}
          className={`${input} mb-3`}
        />
        <label className="mb-1.5 block text-[12.5px] font-semibold text-ink">Most per 30 days (USDC)</label>
        <input
          inputMode="decimal"
          value={monthly}
          onChange={(e) => {
            setMonthly(e.target.value);
            setSaved(false);
          }}
          placeholder={`Up to ${fromMinor(limits.tierMonthlyMinor) || "0"}`}
          className={`${input} mb-3`}
        />
        <button
          disabled={busy}
          onClick={async () => {
            let patch;
            try {
              patch = { perPaymentMinor: toMinor(perPayment), monthlyMinor: toMinor(monthly) };
            } catch (e) {
              setError((e as Error).message);
              return;
            }
            if (await run(() => saveSettings(patch))) setSaved(true);
          }}
          className="w-full rounded-full bg-ink py-3.5 text-sm font-bold text-white transition-colors hover:bg-red disabled:opacity-40"
        >
          {saved ? "Saved" : "Save limits"}
        </button>
      </div>

      <div className={card}>
        <div className={heading}>Connected AI apps</div>
        <p className="mb-3 text-[13px] text-faint">
          {connections.length
            ? `${connections.length} connected: ${connections.map((c) => c.name).join(", ")}.`
            : "No AI apps connected yet."}{" "}
          <a href="/permissions" className="font-semibold text-ink underline underline-offset-2">
            Manage in Permissions
          </a>
        </p>
        {mcpUrl && (
          <>
            <p className="mb-2 text-[13px] leading-[1.45] text-ink">
              To use Axis from ChatGPT or Claude, add a connector with this URL and sign in with
              this account:
            </p>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(mcpUrl).then(() => setCopied(true));
              }}
              className="w-full truncate rounded-full bg-field px-4 py-3 text-left font-mono text-[12.5px] text-ink"
            >
              {copied ? "Copied" : mcpUrl}
            </button>
          </>
        )}
      </div>

      {error && <p className="mb-4 text-[13.5px] font-medium text-red">{error}</p>}
    </>
  );
}
