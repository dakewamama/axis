"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";
import { useLocation } from "@/components/LocationProvider";
import { PayForm } from "@/components/PayForm";

type Place = {
  placeId: string;
  name: string;
  spot?: string;
  pay: { bank: string; accountNumber: string; accountName: string | null; confirmed: boolean };
  menu: { name: string; priceKobo?: number }[];
};
type Answer = { status: string; note?: string; place?: Place };

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

/**
 * The place you are at: from the QR/NFC tag at the counter or seat (exact), or
 * from your precise location. Paying it uses the place's account from Axis's
 * records, approved with your PIN.
 */
function PlaceView() {
  const router = useRouter();
  const ready = useGuard("complete");
  const tag = useSearchParams().get("tag") ?? "";
  const { locateCurrent } = useLocation();
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [error, setError] = useState("");
  const [locating, setLocating] = useState(false);

  const look = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/place", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(tag ? { code: tag } : {}),
      });
      const data = (await res.json().catch(() => ({}))) as Answer & { error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't check where you are.");
      setAnswer(data);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tag]);

  useEffect(() => {
    // Looking up the place once the session is restored.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) void look();
  }, [ready, look]);

  const place = answer?.place;
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
          <h2 className="font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
            {place ? place.name : "Where you are"}
          </h2>
          {place?.spot && <p className="mt-1 text-[14px] font-semibold text-muted">{place.spot}</p>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8">
          {error && <p className="mb-3 text-[13px] text-red-deep" role="alert">{error}</p>}
          {!answer && !error && <p className="text-[13.5px] text-faint">Checking…</p>}
          {answer && !place && (
            <div className="rounded-[20px] bg-white p-4 shadow-card">
              <p className="text-[13.5px] leading-[1.5] text-muted">{answer.note}</p>
              {(answer.status === "needs_location" || answer.status === "too_coarse" || answer.status === "none") && (
                <button
                  disabled={locating}
                  onClick={async () => {
                    setLocating(true);
                    const problem = await locateCurrent();
                    setLocating(false);
                    if (problem) setError(problem);
                    else void look();
                  }}
                  className="mt-3 w-full rounded-full bg-ink py-3 text-sm font-bold text-white transition-colors hover:bg-red disabled:opacity-40"
                >
                  {locating ? "Getting your location…" : "Use my precise location"}
                </button>
              )}
            </div>
          )}
          {place && (
            <>
              <div className="mb-3 rounded-[20px] bg-white p-4 shadow-card">
                <div className="text-[10px] font-bold tracking-[0.09em] text-faint uppercase">Pays to</div>
                <div className="mt-1 text-[14px] font-semibold text-ink">
                  {place.pay.bank} {place.pay.accountNumber}
                </div>
                <div className="text-[12.5px] text-muted">
                  {place.pay.confirmed ? `${place.pay.accountName}, confirmed by the bank` : "Account name not yet confirmed by the bank"}
                </div>
              </div>
              {place.menu.length > 0 && (
                <div className="mb-3 rounded-[20px] bg-white p-4 shadow-card">
                  <div className="mb-1 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">Menu (listed by the place)</div>
                  <ul>
                    {place.menu.map((m) => (
                      <li key={m.name} className="flex justify-between gap-3 border-b border-line py-2 text-[13.5px] last:border-0">
                        <span className="text-ink">{m.name}</span>
                        {m.priceKobo !== undefined && <span className="font-semibold text-ink">{naira(m.priceKobo)}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-[20px] bg-white p-4 shadow-lift">
                <div className="mb-3 text-[15px] font-bold text-ink">Pay {place.name}</div>
                <PayForm to={{ placeId: place.placeId }} defaultReference={place.spot ?? ""} defaultPurpose={`at ${place.name}`} />
              </div>
            </>
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}

export default function PlacePage() {
  return (
    <Suspense>
      <PlaceView />
    </Suspense>
  );
}
