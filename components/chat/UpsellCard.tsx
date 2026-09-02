import { ADDONS, FREE_DELIVERY_AT } from "@/lib/data";
import { NGN } from "@/lib/format";

export function UpsellCard({
  selected,
  onToggle,
  subtotal,
  total,
  onReview,
}: {
  selected: Set<number>;
  onToggle: (index: number) => void;
  subtotal: number;
  total: number;
  onReview: () => void;
}) {
  const remaining = Math.max(0, FREE_DELIVERY_AT - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_DELIVERY_AT) * 100));

  return (
    <div className="my-1 w-full rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_14px_30px_-16px_rgb(32_30_29_/_0.32)]">
      <div className="mb-3 text-[10px] font-bold tracking-[0.09em] text-faint uppercase">
        Goes well with this
      </div>
      <div className="flex flex-col gap-2.5">
        {ADDONS.map((a, i) => {
          const on = selected.has(i);
          return (
            <button
              key={a.name}
              onClick={() => onToggle(i)}
              aria-pressed={on}
              className="flex items-center gap-2.5 text-left"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-line font-display text-lg font-extrabold text-faint">
                {a.name.charAt(0)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] leading-[1.2] font-bold text-ink">
                  {a.name}
                </span>
                <span className="mt-0.5 block text-[11.5px] text-faint">
                  {a.note}
                </span>
              </span>
              <span className="text-[13px] font-bold whitespace-nowrap text-ink">
                {NGN(a.price)}
              </span>
              <span
                className={`flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold transition-colors ${
                  on ? "bg-red text-white" : "bg-line text-ink"
                }`}
              >
                {on ? "✓" : "+"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-line pt-3.5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-pretty text-muted">
            {remaining === 0
              ? "Free delivery unlocked"
              : `Add ${NGN(remaining)} more for free delivery`}
          </span>
          <span className="font-display text-[22px] font-extrabold tracking-[-0.02em] text-ink">
            {NGN(total)}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-red transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          onClick={onReview}
          className="mt-3.5 w-full rounded-full bg-red py-[15px] text-[14.5px] font-bold text-white transition-colors hover:bg-red-dark"
        >
          Review and pay
        </button>
      </div>
    </div>
  );
}