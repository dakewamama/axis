"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisGlyph } from "@/components/AxisMark";
import { AddMoneySheet } from "@/components/AddMoneySheet";
import { PlacesSheet } from "@/components/PlacesSheet";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useOnboarding } from "@/components/OnboardingProvider";
import { useWallet } from "@/components/WalletProvider";
import { useLocation } from "@/components/LocationProvider";
import { useVault } from "@/components/VaultProvider";
import { ActivityRow, StatusChip, useActivity } from "@/components/ActivityList";
import { NGN, lagosTime } from "@/lib/format";
import { amountOf } from "@/lib/activity";
import { type StandingOrder, loadStanding } from "@/lib/standing";
import { loadSettings } from "@/lib/settings";

type Notice = { text: string; at: string };

/**
 * The user's account at a glance: balance, what needs them, recent updates and
 * activity, and the details Axis keeps for them. Conversation happens in the AI
 * apps connected to Axis; this is where the user sees and controls everything.
 */
export default function HomePage() {
  const router = useRouter();
  const { name } = useOnboarding();
  const { activeLabel } = useLocation();
  const { balance, usdc, live, status, axisAddress } = useWallet();
  const { items: activity } = useActivity();
  const { vault, loaded } = useVault();
  const [tasks, setTasks] = useState<StandingOrder[] | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [mcpUrl, setMcpUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    loadStanding().then(setTasks).catch(() => setTasks([]));
    loadSettings().then((s) => setMcpUrl(s.mcpUrl)).catch(() => setMcpUrl(null));
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    fetch(`/api/notices?since=${encodeURIComponent(since)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { notices: [] }))
      .then((d: { notices?: Notice[] }) => setNotices((d.notices ?? []).slice(-3).reverse()))
      .catch(() => setNotices([]));
  }, []);

  const firstName = name.trim();
  const waiting = (activity ?? []).filter((i) => i.status === "awaiting_approval");
  const proposed = (tasks ?? []).filter((t) => t.status === "proposed");
  const active = (tasks ?? []).filter((t) => t.status === "active" || t.status === "paused");
  const autoPay = active.filter((t) => t.mode === "auto").length;

  return (
    <PhoneFrame>
      <main className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 px-5 pt-4 pb-2">
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-ink transition-colors hover:bg-red focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <AxisGlyph size={18} />
          </button>
          <button
            onClick={() => setPlacesOpen(true)}
            className="flex min-w-0 items-center gap-1.5 rounded-full px-2 py-1.5 transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span className="truncate text-[13px] font-semibold text-muted">{activeLabel}</span>
            <span aria-hidden="true" className="shrink-0 text-[9px] text-faint">▼</span>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          <h2 className="pt-4 pb-4 font-display text-[30px] leading-[1.05] font-extrabold tracking-[-0.03em] text-ink">
            {firstName ? `Hi, ${firstName}` : "Your Axis"}
          </h2>

          <section className="rounded-[24px] bg-ink p-5 text-white shadow-lift" aria-label="Wallet">
            <div className="text-[11px] font-bold tracking-[0.1em] text-white/60 uppercase">Wallet</div>
            <div className="mt-1 font-display text-[36px] leading-none font-extrabold tracking-[-0.02em]">
              {live ? (usdc === null ? "—" : `$${usdc}`) : status === "unavailable" ? "Unavailable" : "—"}
            </div>
            <div className="mt-1 text-[13px] text-white/60">{live && balance ? `about ${NGN(balance)}` : "USDC and SOL, held for you on Solana"}</div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setTopUpOpen(true)} className="flex-1 rounded-full bg-red py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-red-dark">
                Add money
              </button>
              <button onClick={() => router.push("/pay")} className="flex-1 rounded-full bg-white/10 py-3 text-[13.5px] font-bold text-white transition-colors hover:bg-white/20">
                Pay someone
              </button>
            </div>
          </section>

          {(waiting.length > 0 || proposed.length > 0) && (
            <section className="mt-6" aria-label="Needs you">
              <Heading>Needs you</Heading>
              <ul className="flex flex-col gap-2">
                {waiting.map((i) => (
                  <li key={i.id}>
                    <button onClick={() => router.push(`/approve/${i.approvalId}`)} className="flex w-full items-center gap-3 rounded-[18px] bg-white p-4 text-left shadow-card ring-1 ring-red/30 hover:bg-red-tint">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold text-ink">{i.title}</span>
                        <span className="mt-0.5 block text-[12px] text-faint">Waiting for your approval</span>
                      </span>
                      <span className="text-[14px] font-bold text-ink">{amountOf(i)}</span>
                    </button>
                  </li>
                ))}
                {proposed.map((t) => (
                  <li key={t.id}>
                    <button onClick={() => router.push("/recurring")} className="flex w-full items-center gap-3 rounded-[18px] bg-white p-4 text-left shadow-card ring-1 ring-red/30 hover:bg-red-tint">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-bold text-ink">{t.label}</span>
                        <span className="mt-0.5 block text-[12px] text-faint">Recurring payment suggested in chat. Confirm it?</span>
                      </span>
                      <StatusChip status="awaiting_approval" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {notices.length > 0 && (
            <section className="mt-6" aria-label="Updates">
              <Heading>Updates</Heading>
              <ul className="rounded-[18px] bg-white px-4 shadow-card">
                {notices.map((n) => (
                  <li key={n.at + n.text} className="border-b border-line py-3 last:border-0">
                    <div className="text-[13px] leading-[1.45] text-ink">{n.text}</div>
                    <div className="mt-0.5 text-[11px] text-faint">{lagosTime(n.at)}</div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-6" aria-label="Your account">
            <Heading>Your account</Heading>
            <div className="grid grid-cols-2 gap-2.5">
              <Tile
                title="Saved details"
                detail={loaded ? `${vault.beneficiaries.length} people · ${vault.addresses.length} addresses · ${vault.phones.length} lines` : "People, addresses, phones"}
                onClick={() => router.push("/vault")}
              />
              <Tile
                title="Recurring"
                detail={tasks ? (active.length ? `${active.length} active${autoPay ? ` · ${autoPay} auto-pay` : ""}` : "Rent, fees, alerts") : "…"}
                onClick={() => router.push("/recurring")}
              />
              <Tile title="Permissions" detail="Auto-pay and connected apps" onClick={() => router.push("/permissions")} />
              <Tile title="Pay where you are" detail="Scan a tag or use your location" onClick={() => router.push("/place")} />
              <Tile title="Services & limits" detail="What Axis may do, PIN" onClick={() => router.push("/services")} />
              <Tile title="Activity" detail="Everything, with proof" onClick={() => router.push("/activity")} />
            </div>
          </section>

          <section className="mt-6" aria-label="Activity">
            <div className="flex items-baseline justify-between">
              <Heading>Recent activity</Heading>
              <button onClick={() => router.push("/activity")} className="text-[12px] font-semibold text-muted hover:text-ink">
                See all
              </button>
            </div>
            {activity && activity.length === 0 && <p className="py-2 text-[13px] text-faint">Nothing yet. Payments, top-ups and deposits show here.</p>}
            <ul>
              {(activity ?? []).slice(0, 5).map((i) => (
                <ActivityRow key={i.id} item={i} />
              ))}
            </ul>
          </section>

          <section className="mt-6 rounded-[20px] bg-white p-4 shadow-card" aria-label="Use Axis from your AI app">
            <div className="text-[15px] font-bold text-ink">Talk to Axis in ChatGPT or Claude</div>
            <p className="mt-1 text-[12.5px] leading-[1.45] text-muted">
              Add Axis as a connector, sign in with this account, and ask for anything. Payments come back here for your approval.
            </p>
            {mcpUrl && (
              <button
                onClick={() => void navigator.clipboard?.writeText(mcpUrl).then(() => setCopied(true))}
                className="mt-3 w-full truncate rounded-full bg-field px-4 py-3 text-left font-mono text-[12.5px] text-ink"
              >
                {copied ? "Copied" : mcpUrl}
              </button>
            )}
          </section>
        </div>

        <PlacesSheet open={placesOpen} onClose={() => setPlacesOpen(false)} />
        <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} onAddMoney={() => setTopUpOpen(true)} />
        <AddMoneySheet open={topUpOpen} onClose={() => setTopUpOpen(false)} axisAddress={axisAddress} />
      </main>
    </PhoneFrame>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[10px] font-bold tracking-[0.1em] text-faint uppercase">{children}</div>;
}

function Tile({ title, detail, onClick }: { title: string; detail: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[86px] flex-col justify-between rounded-[18px] bg-white p-3.5 text-left shadow-card transition-colors hover:bg-red-tint focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
    >
      <span className="text-[14px] font-bold text-ink">{title}</span>
      <span className="mt-1 text-[11.5px] leading-[1.35] text-faint">{detail}</span>
    </button>
  );
}
