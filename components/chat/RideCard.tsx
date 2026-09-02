import { RIDES, RIDE_ROUTE } from "@/lib/data";
import { NGN } from "@/lib/format";

export function RideCard({ onBook }: { onBook: () => void }) {
  const cheapest = RIDES.find((r) => r.best) ?? RIDES[0];

  return (
    <div className="my-1 w-full rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_14px_30px_-16px_rgb(32_30_29_/_0.32)]">
      <div className="mb-3 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">
        {RIDE_ROUTE}
      </div>
      <div className="flex flex-col gap-2">
        {RIDES.map((r) => (
          <div
            key={r.app}
            className={`flex items-center gap-3 rounded-[16px] px-3.5 py-3 ${
              r.best ? "bg-ink" : "bg-field"
            }`}
          >
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span
                  className={`text-[14.5px] font-bold ${
                    r.best ? "text-cream" : "text-ink"
                  }`}
                >
                  {r.app}
                </span>
                {r.best && (
                  <span className="rounded-full bg-red px-2 py-0.5 text-[9px] font-extrabold tracking-[0.07em] text-white uppercase">
                    Cheapest
                  </span>
                )}
              </span>
              <span
                className={`mt-0.5 block text-[11.5px] ${
                  r.best ? "text-cream/55" : "text-faint"
                }`}
              >
                {r.note}
              </span>
            </span>
            <span
              className={`font-display text-[17px] font-extrabold tracking-[-0.01em] whitespace-nowrap ${
                r.best ? "text-cream" : "text-ink"
              }`}
            >
              {NGN(r.price)}
            </span>
          </div>
        ))}
      </div>
      <button
        onClick={onBook}
        className="mt-3.5 w-full rounded-full bg-red py-[15px] text-[14.5px] font-bold text-white transition-colors hover:bg-red-dark"
      >
        Book {cheapest.app} · {NGN(cheapest.price)}
      </button>
    </div>
  );
}