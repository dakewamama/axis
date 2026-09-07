import Link from "next/link";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisMark } from "@/components/AxisMark";

export default function NotFound() {
  return (
    <PhoneFrame>
      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AxisMark size={56} radius={18} glyph={32} />
        <h1 className="mt-6 font-display text-[28px] font-extrabold tracking-[-0.02em] text-ink">
          That page wandered off.
        </h1>
        <p className="mt-2 text-[14px] leading-[1.5] text-faint">
          The link you followed doesn&rsquo;t lead anywhere. Head back and just
          tell Axis what you need.
        </p>
        <Link
          href="/"
          className="mt-7 rounded-full bg-red px-7 py-[15px] text-[15px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          Back to Axis
        </Link>
      </main>
    </PhoneFrame>
  );
}
