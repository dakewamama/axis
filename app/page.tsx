import Link from "next/link";
import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/PhoneFrame";
import { AxisMark } from "@/components/AxisMark";
import { SKIP_ONBOARDING } from "@/lib/flags";

const STATS = [
  { value: "0", label: "Apps to install" },
  { value: "1", label: "Chat for it all" },
  { value: "24/7", label: "Always on" },
];

export default function SplashPage() {
  if (SKIP_ONBOARDING) redirect("/home");
  return (
    <PhoneFrame>
      <div className="flex flex-1 flex-col justify-between px-6 pt-8 pb-7">
        <div className="pt-16">
          <AxisMark />
          <h1 className="mt-8 font-display text-[44px] leading-[0.98] font-extrabold tracking-[-0.03em] text-pretty text-ink">
            Stop
            <br />
            downloading
            <br />
            apps.
          </h1>
          <p className="mt-5 max-w-[300px] text-base leading-[1.45] text-pretty text-muted">
            Axis is one chat to buy airtime and top up any line. Type it like
            you&rsquo;d say it.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2.5">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-[18px] bg-white px-2.5 py-3.5 shadow-card"
              >
                <div className="font-display text-2xl font-extrabold tracking-[-0.02em]">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[9.5px] tracking-[0.07em] text-faint uppercase">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/auth"
            className="mt-1.5 block rounded-full bg-red py-[17px] text-center text-[15.5px] font-bold text-white shadow-cta transition-colors hover:bg-red-dark"
          >
            Get started
          </Link>

          <Link
            href="/auth"
            className="block rounded-full py-3.5 text-center text-sm font-semibold text-muted transition-colors hover:bg-line"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </PhoneFrame>
  );
}