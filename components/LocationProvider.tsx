"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Place = {
  label: string;
  detail: string;
  tag?: string;
};

const KEY = "axis:location:v1";

const SAVED: Place[] = [
  { label: "Home", detail: "14 Herbert Macaulay Way, Yaba", tag: "Default" },
  { label: "Work", detail: "Plot 8 Adeola Odeku, Victoria Island" },
  { label: "Mum's place", detail: "22 Ogunlana Drive, Surulere" },
  { label: "Nadia's Kitchen", detail: "Last used yesterday" },
];

type Selection = number | "current";

type Persisted = {
  places: Place[];
  selected: Selection;
};

type LocationState = {
  hydrated: boolean;
  places: Place[];
  selected: Selection;
  select: (value: Selection) => void;
  addPlace: (label: string) => void;
  activeLabel: string;
  activeDetail: string;
  reset: () => void;
};

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [places, setPlaces] = useState<Place[]>(SAVED);
  const [selected, setSelected] = useState<Selection>(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (Array.isArray(p.places) && p.places.length) setPlaces(p.places);
        if (p.selected === "current" || typeof p.selected === "number") {
          setSelected(p.selected);
        }
      }
    } catch {
      // corrupt or unavailable storage — fall through to defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: Persisted = { places, selected };
      sessionStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // storage full or blocked
    }
  }, [hydrated, places, selected]);

  function addPlace(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    setPlaces((prev) => {
      const next = [...prev, { label: trimmed, detail: "Added just now" }];
      setSelected(next.length - 1);
      return next;
    });
  }

  function reset() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setPlaces(SAVED);
    setSelected(0);
  }

  const active = selected === "current" ? null : places[selected];
  const activeLabel =
    selected === "current" ? "Near Surulere" : (active?.label ?? "Home");
  const activeDetail =
    selected === "current"
      ? "Using your current location"
      : (active?.detail ?? "");

  return (
    <LocationContext.Provider
      value={{
        hydrated,
        places,
        selected,
        select: setSelected,
        addPlace,
        activeLabel,
        activeDetail,
        reset,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used inside LocationProvider");
  return ctx;
}
