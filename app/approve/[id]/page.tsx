"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { useGuard } from "@/components/useGuard";

type Request = { id: string; status: string; summary: string; expiresAt: string; outcome?: string };

const STATUS: Record<string, string> = {
  pending: "Waiting for your decision",
  approved: "Approved",
  declined: "Declined",
  failed: "Not sent",
  expired: "Expired",
};

/**
 * Approve or decline a payment that Axis prepared, often from a connected AI app
 * such as ChatGPT or Claude. The decision is the signed-in owner's tap, handled by
 * fixed code in brain, never by an AI model.
 */
export default function ApprovePage() {
  const router = useRouter();
  const ready = useGuard("authed");
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<Request | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/payments/${id}`, { cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as Request & { error?: string };
    if (res.status === 401) return; // the guard sends the user to sign in
    if (!res.ok) {
      setError(res.status === 404 ? "This payment request isn't on your account." : res.status === 503 ? "Payments aren't switched on for Axis yet. Nothing will be paid." : "Couldn't load this payment. Try again.");
      return;
    }
    setRequest(data);
  }, [id]);

  useEffect(() => {
    // Loading the request once the session is restored.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (ready) void load();
  }, [ready, load]);

  async function decide(decision: "approve" | "decline") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ buttonId: `${decision}:${id}` }),
      });
      const data = (await res.json().catch(() => ({}))) as { replies?: { text: string }[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't record your decision. Try again.");
      setResult(data.replies?.map((r) => r.text).join("\n") ?? "");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't record your decision. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const pending = request?.status === "pending";

  return (
    <PhoneFrame>
      <main className="flex flex-1 animate-rise flex-col overflow-hidden">
        <div className="px-6 pt-7 pb-4">
          <button
            onClick={() => router.push("/home")}
            className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
          >
            <span aria-hidden="true">&larr;</span> Home
          </button>
          <h2 className="font-display text-[32px] leading-[1.02] font-extrabold tracking-[-0.02em] text-ink">
            Approve payment
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {!request && !error && <p className="text-[13.5px] text-faint">Loading the payment…</p>}
          {error && <p className="mb-3 text-[13.5px] text-red-deep" role="alert">{error}</p>}
          {request && (
            <div className="rounded-[22px] bg-white p-[18px] shadow-lift">
              <div className="mb-2 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">
                {STATUS[request.status] ?? request.status}
              </div>
              <p className="text-[15px] leading-[1.5] text-pretty text-ink">{request.summary}</p>
              {request.outcome && <p className="mt-3 text-[13.5px] leading-[1.45] text-muted">{request.outcome}</p>}
              {result && <p className="mt-3 text-[13.5px] leading-[1.45] font-semibold text-ink" aria-live="polite">{result}</p>}
              {pending && (
                <>
                  <p className="mt-3 text-[12.5px] text-faint">
                    Nothing is paid until you approve. Check the account number and amount first.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => decide("decline")}
                      disabled={busy}
                      className="flex-1 rounded-full bg-line py-3.5 text-sm font-bold text-ink transition-colors hover:bg-unfilled disabled:opacity-40"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => decide("approve")}
                      disabled={busy}
                      className="flex-1 rounded-full bg-red py-3.5 text-sm font-bold text-white shadow-cta transition-colors hover:bg-red-dark disabled:opacity-40"
                    >
                      {busy ? "Working…" : "Approve"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </PhoneFrame>
  );
}
