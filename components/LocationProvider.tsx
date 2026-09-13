"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Place = {
  label: string;
  detail: string;
  tag?: string;
};

export type Coords = { lat: number; lng: number };

const KEY = "axis:location:v1";

type Selection = number | "current";

type Persisted = {
  places: Place[];
  selected: Selection;
  current: Coords | null;
};

type LocationState = {
  hydrated: boolean;
  places: Place[];
  selected: Selection;
  current: Coords | null;
  select: (value: Selection) => void;
  addPlace: (label: string) => void;
  /** Ask the browser for the real device location. Resolves to an error string
   *  on failure (permission denied / unavailable), or null on success. */
  useCurrentLocation: () => Promise<string | null>;
  activeLabel: string;
  activeDetail: string;
  reset: () => void;
};

const LocationContext = createContext<LocationState | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  // No fabricated addresses. Saved places start empty; the user adds their own.
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Selection>("current");
  const [current, setCurrent] = useState<Coords | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        if (Array.isArray(p.places)) setPlaces(p.places);
        if (p.selected === "current" || typeof p.selected === "number") {
          setSelected(p.selected);
        }
        if (p.current && typeof p.current.lat === "number") setCurrent(p.current);
      }
    } catch {
      // corrupt or unavailable storage — fall through to defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      const payload: Persisted = { places, selected, current };
      sessionStorage.setItem(KEY, JSON.stringify(payload));
    } catch {
      // storage full or blocked
    }
  }, [hydrated, places, selected, current]);

  function addPlace(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    setPlaces((prev) => {
      const next = [...prev, { label: trimmed, detail: "Saved address" }];
      setSelected(next.length - 1);
      return next;
    });
  }

  function useCurrentLocation(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve("Location isn't available on this device.");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrent({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setSelected("current");
          resolve(null);
        },
        (err) => {
          resolve(
            err.code === err.PERMISSION_DENIED
              ? "Location permission was denied."
              : "Couldn't get your location. Try again.",
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }

  function reset() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    setPlaces([]);
    setSelected("current");
    setCurrent(null);
  }

  const active = selected === "current" ? null : places[selected];
  const activeLabel =
    selected === "current"
      ? current
        ? "Current location"
        : "Set location"
      : (active?.label ?? "Set location");
  const activeDetail =
    selected === "current"
      ? current
        ? `${current.lat.toFixed(4)}, ${current.lng.toFixed(4)}`
        : "Tap to set your delivery location"
      : (active?.detail ?? "");

  return (
    <LocationContext.Provider
      value={{
        hydrated,
        places,
        selected,
        current,
        select: setSelected,
        addPlace,
        useCurrentLocation,
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
