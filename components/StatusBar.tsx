export function StatusBar() {
  return (
    <div className="hidden shrink-0 items-center justify-between px-5 pt-3 pb-1.5 text-xs font-semibold tracking-[0.02em] text-ink lg:flex">
      <span>9:41</span>
      <span className="flex items-center gap-1.5">
        <span>MTN</span>
        <span className="relative inline-block h-2.5 w-[22px] rounded-[3px] border-[1.5px] border-ink">
          <span className="absolute inset-[1.5px] right-[5px] block rounded-[1px] bg-ink" />
        </span>
      </span>
    </div>
  );
}