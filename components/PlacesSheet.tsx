"use client";

import { useState } from "react";
import { Sheet } from "@/components/Sheet";
import { useLocation } from "@/components/LocationProvider";

export function PlacesSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { places, selected, select, addPlace } = useLocation();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  function close() {
    setAdding(false);
    setDraft("");
    onClose();
  }

  function save() {
    if (!draft.trim()) return;
    addPlace(draft);
    setAdding(false);
    setDraft("");
    onClose();
  }

  const onCurrent = selected === "current";

  return (
    <Sheet open={open} onClose={close}>
      <div className="px-5 pt-2.5 pb-1">
        <span className="block font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
          Deliver to
        </span>
        <span className="mt-1 block text-[12.5px] leading-[1.45] text-faint">
          Axis uses this for delivery fees, ride pickups and what&rsquo;s open
          near you.
        </span>
      </div>

      <div className="px-5 pt-4">
        <button
          onClick={() => {
            select("current");
            close();
          }}
          className={`flex w-full items-center gap-3.5 rounded-[18px] px-4 py-3.5 text-left transition-colors ${
            onCurrent ? "bg-ink" : "bg-white shadow-card hover:bg-red-tint"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white ${
              onCurrent ? "bg-red" : "bg-unfilled"
            }`}
          >
            {onCurrent ? "✓" : ""}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`block text-[15px] leading-[1.2] font-bold ${
                onCurrent ? "text-cream" : "text-ink"
              }`}
            >
              Use my current location
            </span>
            <span
              className={`mt-0.5 block text-[11.5px] ${
                onCurrent ? "text-cream/55" : "text-faint"
              }`}
            >
              {onCurrent ? "Detected: near Surulere" : "Most accurate for rides"}
            </span>
          </span>
        </button>

        <div className="mt-5 mb-2.5 text-[10px] font-bold tracking-[0.1em] text-faint uppercase">
          Saved
        </div>
        <div className="flex flex-col gap-2">
          {places.map((p, i) => {
            const on = selected === i;
            return (
              <button
                key={p.label + i}
                onClick={() => {
                  select(i);
                  close();
                }}
                className={`flex w-full items-center gap-3.5 rounded-[18px] px-4 py-3.5 text-left transition-colors ${
                  on ? "bg-white shadow-lift" : "bg-white/55 hover:bg-red-tint"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white ${
                    on ? "bg-red" : "bg-unfilled"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] leading-[1.2] font-bold text-ink">
                    {p.label}
                  </span>
                  <span className="mt-0.5 block truncate text-[11.5px] text-faint">
                    {p.detail}
                  </span>
                </span>
                {p.tag && (
                  <span className="shrink-0 rounded-full bg-line px-2 py-1 text-[9px] font-extrabold tracking-[0.07em] text-faint uppercase">
                    {p.tag}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 pt-3 pb-7">
        {adding ? (
          <div className="rounded-[20px] bg-white p-4 shadow-lift">
            <label
              htmlFor="newPlace"
              className="mb-2 block text-[10px] font-bold tracking-[0.09em] text-faint uppercase"
            >
              New address
            </label>
            <input
              id="newPlace"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              placeholder="Street, area, landmark"
              autoFocus
              className="w-full rounded-xl bg-field px-3.5 py-3 text-[15px] text-ink outline-none transition-shadow focus:ring-2 focus:ring-ink/15 placeholder:text-unfilled"
            />
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                className="flex-1 rounded-full bg-line py-3 text-sm font-semibold text-ink transition-colors hover:bg-unfilled"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={!draft.trim()}
                className="flex-1 rounded-full bg-red-deep py-3 text-sm font-bold text-white transition-colors hover:bg-red-dark disabled:opacity-40"
              >
                Save address
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-3 rounded-[18px] border border-dashed border-unfilled px-4 py-3.5 text-left transition-colors hover:bg-white"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line text-base leading-none font-bold text-ink">
              +
            </span>
            <span className="text-[14.5px] font-semibold text-muted">
              Add a new address
            </span>
          </button>
        )}
      </div>
    </Sheet>
  );
}