"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { type ActivityItem, STATUS, amountOf, loadActivity } from "@/lib/activity";
import { relativeDay } from "@/lib/format";

/** The history, refreshed while the page is open so in-progress items move on their own. */
export function useActivity(refreshMs = 15000) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setItems(await loadActivity());
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load your activity.");
    }
  }, []);
  useEffect(() => {
    // Loading history after mount and on an interval.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload();
    const t = setInterval(() => void reload(), refreshMs);
    return () => clearInterval(t);
  }, [reload, refreshMs]);
  return { items, error, reload };
}

export function StatusChip({ status }: { status: ActivityItem["status"] }) {
  const s = STATUS[status];
  return (
    <span className={`inline-block shrink-0 rounded-full px-2 py-[3px] text-[10px] font-extrabold tracking-[0.04em] whitespace-nowrap uppercase ${s.tone}`}>
      {s.label}
    </span>
  );
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  const href = item.approvalId ? `/approve/${item.approvalId}` : `/activity/${encodeURIComponent(item.id)}`;
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 border-b border-line py-3.5 transition-colors last:border-0 hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold text-ink">{item.title}</span>
          <span className="mt-1 flex items-center gap-2">
            <StatusChip status={item.status} />
            <span className="truncate text-[11px] text-faint">{relativeDay(Date.parse(item.at))}</span>
          </span>
        </span>
        <span className={`text-[14px] font-bold whitespace-nowrap ${item.direction === "in" ? "text-red-deep" : item.status === "completed" ? "text-ink" : "text-faint"}`}>
          {amountOf(item)}
        </span>
      </Link>
    </li>
  );
}
