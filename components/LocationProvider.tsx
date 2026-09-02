"use client";

import { createContext, useContext, useState } from "react";

export type Place = {
  label: string;
  detail: string;
  tag?: string;
};

const SAVED: Place[] = [
  { label: "Home", detail: "14 Herbert Macaulay Way, Yaba", tag: "Default" },
  { label: "Work", detail: "Plot 8 Adeola Odeku, Victoria Island" },
  { label: "Mum's place", detail: "22 Ogunlana Drive, Surulere" },
  { label: "Nadia's Kitchen", detail: "Last used yesterday" },
];

type Selection = number | "current";

type LocationState = {
  places: Place[];
  selected: Selection;
  select: (value: Selection) => void;
  addPlace: (label: string) => void;
  activeLabel: string;
};

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [places, setPlaces] = useState<Place[]>(SAVED);
  const [selected, setSelected] = useState<Selection>(0);

  function addPlace(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    setPlaces((prev) => {
      const next = [...prev, { label: trimmed, detail: "Added just now" }];
      setSelected(next.length - 1);
      return next;
    });
  }

  const activeLabel =
    selected === "current" ? "Near Surulere" : (places[selected]?.label ?? "Home");

  return (
    <LocationContext.Provider
      value={{ places, selected, select: setSelected, addPlace, activeLabel }}
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