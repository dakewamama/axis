export function SelectRow({
  label,
  note,
  selected,
  disabled,
  badge,
  onClick,
}: {
  label: string;
  note: string;
  selected: boolean;
  disabled?: boolean;
  badge?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3.5 rounded-[18px] px-4 py-3.5 text-left transition-colors ${
        selected ? "bg-white shadow-lift" : "bg-white/55 shadow-[0_1px_2px_rgb(32_30_29_/_0.05)]"
      } ${disabled ? "opacity-50" : "hover:bg-red-tint"}`}
    >
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white ${
          selected ? "bg-red" : "bg-unfilled"
        }`}
      >
        {selected ? "✓" : ""}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-[1.2] font-bold text-ink">
          {label}
        </span>
        <span className="mt-0.5 block text-[11.5px] text-faint">{note}</span>
      </span>
      {badge}
    </button>
  );
}