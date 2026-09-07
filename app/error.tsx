"use client";

import { useEffect } from "react";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisMark } from "@/components/AxisMark";

// Root error boundary. Without this, a failed chunk or render throws a blank
// screen. Keeps the user inside the product with a way to recover.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PhoneFrame>
      <main className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AxisMark size={56} radius={18} glyph={32} />
        <h1 className="mt-6 font-display text-[26px] font-extrabold tracking-[-0.02em] text-ink">
          Something broke on our end.
        </h1>
        <p className="mt-2 text-[14px] leading-[1.5] text-faint">
          That wasn&rsquo;t you. Try again, and if it keeps happening give it a
          minute.
        </p>
        <button
          onClick={reset}
          className="mt-7 rounded-full bg-red px-7 py-[15px] text-[15px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark focus-visible:ring-2 focus-visible:ring-ink focus-visible:outline-none"
        >
          Try again
        </button>
      </main>
    </PhoneFrame>
  );
}
