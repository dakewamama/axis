import { NGN } from "@/lib/format";

export function PayConfirmCard({
  line,
  amount,
  onPay,
  disabled,
}: {
  line: string;
  amount: number;
  onPay: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="my-1 w-full rounded-[22px] bg-white p-4 shadow-[0_1px_2px_rgb(32_30_29_/_0.1),0_14px_30px_-16px_rgb(32_30_29_/_0.32)]">
      <div className="text-[11.5px] text-faint">{line}</div>
      <div className="mt-1 font-display text-[30px] font-extrabold tracking-[-0.02em] text-ink">
        {NGN(amount)}
      </div>
      <p className="mt-3 border-t border-line pt-3 text-[11.5px] leading-[1.45] text-pretty text-faint">
        Confirmed before charge. Debited from your Axis wallet, settled on a
        licensed rail.
      </p>
      <button
        onClick={onPay}
        disabled={disabled}
        className="mt-3 w-full rounded-full bg-red py-[15px] text-[14.5px] font-bold text-white transition-colors hover:bg-red-dark disabled:cursor-not-allowed disabled:opacity-40"
      >
        {disabled ? "Insufficient balance" : `Pay ${NGN(amount)}`}
      </button>
    </div>
  );
}