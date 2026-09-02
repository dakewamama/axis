import { DISHES } from "@/lib/data";
import { NGN } from "@/lib/format";

export function DishRail({ onPick }: { onPick: (index: number) => void }) {
  return (
    <div className="my-1 flex w-full snap-x snap-mandatory gap-3 overflow-x-auto pt-0.5 pb-1.5">
      {DISHES.map((d, i) => (
        <div
          key={d.name}
          className="w-[172px] shrink-0 snap-start overflow-hidden rounded-[20px] bg-white shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_12px_26px_-14px_rgb(32_30_29_/_0.3)]"
        >
          <div className="relative flex h-[124px] w-full items-center justify-center bg-line">
            <span className="px-3 text-center text-[11px] leading-[1.3] text-faint">
              {d.name}
            </span>
            {d.flag && (
              <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-red px-[7px] py-1 text-[9px] font-extrabold tracking-[0.08em] text-white uppercase">
                {d.flag}
              </span>
            )}
          </div>
          <div className="px-3 pt-3 pb-3">
            <div className="text-sm leading-[1.2] font-bold text-pretty text-ink">
              {d.name}
            </div>
            <div className="mt-1 text-[11.5px] text-faint">{d.detail}</div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="font-display text-base font-extrabold tracking-[-0.01em] text-ink">
                {NGN(d.price)}
              </span>
              <button
                onClick={() => onPick(i)}
                className="rounded-full bg-ink px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-red"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}