"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { ActivityRow, useActivity } from "@/components/ActivityList";
import type { ActivityItem } from "@/lib/activity";

const FILTERS: { id: string; label: string; match: (i: ActivityItem) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "needs", label: "Needs you", match: (i) => i.status === "awaiting_approval" },
  { id: "open", label: "In progress", match: (i) => i.status === "in_progress" || i.status === "checking" },
  { id: "out", label: "Payments", match: (i) => i.direction === "out" },
  { id: "in", label: "Added", match: (i) => i.direction === "in" },
];

/** Every payment, request, deposit and debit on the account, from any app. */
export default function ActivityPage() {
  const router = useRouter();
  useGuard("complete");
  const { items, error } = useActivity();
  const [filter, setFilter] = useState("all");
  const active = FILTERS.find((f) => f.id === filter)!;
  const shown = (items ?? []).filter(active.match);
  const needs = (items ?? []).filter((i) => i.status === "awaiting_approval").length;

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
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">Activity</h2>
            <button
              onClick={() => router.push("/recurring")}
              className="shrink-0 text-[12.5px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
            >
              Recurring →
            </button>
          </div>
          <p className="mt-2 text-[13px] leading-[1.5] text-faint">
            Everything Axis did with your money, here or from ChatGPT and Claude. &ldquo;Checking&rdquo; means Axis is confirming the
            outcome and will not pay twice.
          </p>
        </div>

        <div className="flex gap-1.5 overflow-x-auto px-6 pb-3" role="tablist" aria-label="Filter activity">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold transition-colors ${
                filter === f.id ? "bg-ink text-white" : "bg-white text-ink shadow-card hover:bg-red-tint"
              }`}
            >
              {f.label}
              {f.id === "needs" && needs > 0 && <span className="ml-1.5 text-red">{needs}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {error && <p className="mb-3 text-[13px] text-red-deep" role="alert">{error}</p>}
          {!items && !error && <p className="text-[13.5px] text-faint">Loading your activity…</p>}
          {items && shown.length === 0 && (
            <p className="text-[13.5px] leading-[1.5] text-muted">
              {filter === "all" ? "Nothing yet. Payments, top-ups and deposits will show here." : "Nothing here right now."}
            </p>
          )}
          <ul>
            {shown.map((i) => (
              <ActivityRow key={i.id} item={i} />
            ))}
          </ul>
        </div>
      </main>
    </PhoneFrame>
  );
}
