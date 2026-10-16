"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Place = {
  label: string;
  detail: string;
  tag?: string;
};

/** accuracy: the device's confidence radius in metres. */
export type Coords = { lat: number; lng: number; accuracy?: number };

const KEY = "axis:location:v1";
/** Stop early once the fix is this precise (metres). */
const GOOD_ENOUGH_M = 20;
/** Longest we wait for GPS to settle. */
const LOCATE_MS = 15000;

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
  locateCurrent: () => Promise<string | null>;
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
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw) as Partial<Persisted>;
        // Restoring saved places from localStorage after mount (not available during SSR).
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
      localStorage.setItem(KEY, JSON.stringify(payload));
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

  function locateCurrent(): Promise<string | null> {
    return new Promise((resolve) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        resolve("Location isn't available on this device.");
        return;
      }
      // The first fix is often Wi-Fi/cell-tower grade (100 m+). Keep listening
      // for GPS until it is good enough to tell neighbouring places apart, or
      // until time runs out, and keep the most accurate reading.
      let best: GeolocationPosition | null = null;
      let done = false;
      const finish = (error: string | null) => {
        if (done) return;
        done = true;
        navigator.geolocation.clearWatch(watch);
        clearTimeout(timer);
        if (!best) return resolve(error ?? "Couldn't get your location. Try again.");
        const fix = { lat: best.coords.latitude, lng: best.coords.longitude, accuracy: best.coords.accuracy };
        setCurrent(fix);
        setSelected("current");
        // brain keeps it 15 minutes for "where am I" / pay-here; best-effort.
        void fetch("/api/location", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ latitude: fix.lat, longitude: fix.lng, accuracyM: fix.accuracy }),
        }).catch(() => {});
        resolve(null);
      };
      const watch = navigator.geolocation.watchPosition(
        (pos) => {
          if (!best || pos.coords.accuracy < best.coords.accuracy) best = pos;
          if (pos.coords.accuracy <= GOOD_ENOUGH_M) finish(null);
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) finish("Location permission was denied.");
        },
        { enableHighAccuracy: true, timeout: LOCATE_MS, maximumAge: 0 },
      );
      const timer = setTimeout(() => finish(null), LOCATE_MS);
    });
  }

  function reset() {
    try {
      localStorage.removeItem(KEY);
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
        ? `${current.lat.toFixed(5)}, ${current.lng.toFixed(5)}${current.accuracy !== undefined ? ` · ±${Math.round(current.accuracy)} m` : ""}`
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
        locateCurrent,
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
