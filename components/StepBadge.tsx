export function StepBadge({ step }: { step: number }) {
  return (
    <span className="inline-block rounded-full bg-red-tint px-3 py-1.5 text-[10px] font-bold tracking-[0.1em] text-red-deep uppercase">
      Step {step} of 4
    </span>
  );
}