export function ChannelField({
  id,
  label,
  prefix,
  value,
  onChange,
  placeholder,
  hint,
  inputMode,
  autoComplete,
  lowercase,
}: {
  id: string;
  label: string;
  prefix: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  hint: string;
  inputMode?: "numeric" | "text";
  autoComplete?: string;
  lowercase?: boolean;
}) {
  return (
    <div className="animate-rise rounded-b-[18px] bg-white px-4 pb-3.5 shadow-lift">
      <div className="border-t border-line pt-3.5">
        <label
          htmlFor={id}
          className="mb-2 block text-[10px] font-bold tracking-[0.09em] text-faint uppercase"
        >
          {label}
        </label>
        <div className="flex items-center gap-2 rounded-xl bg-field px-3.5 py-2.5 transition-shadow focus-within:ring-2 focus-within:ring-ink/15">
          <span className="text-[15px] font-semibold text-faint">{prefix}</span>
          <input
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            inputMode={inputMode}
            autoComplete={autoComplete}
            autoCapitalize={lowercase ? "none" : undefined}
            autoCorrect={lowercase ? "off" : undefined}
            className="w-full bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:font-normal placeholder:text-unfilled"
          />
        </div>
        <p className="mt-2 text-[11px] leading-[1.4] text-faint">{hint}</p>
      </div>
    </div>
  );
}