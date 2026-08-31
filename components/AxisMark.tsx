export function AxisGlyph({ size = 35 }: { size?: number }) {
  return (
    <svg width={size} viewBox="0 0 100 100" aria-hidden="true">
      <g
        stroke="#ec3013"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M41.9 88.2 L41.9 52.2" />
        <path d="M41.9 52.2 L17.8 28.1" />
        <path d="M41.9 52.2 L41.9 18.2" />
        <path d="M41.9 52.2 L65.9 28.1" />
      </g>
      <circle cx="82.2" cy="11.9" r="8" fill="#f5a623" />
    </svg>
  );
}

export function AxisMark({
  size = 60,
  radius = 20,
  glyph = 35,
}: {
  size?: number;
  radius?: number;
  glyph?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center bg-ink"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        boxShadow: "0 14px 28px -12px rgb(32 30 29 / 0.55)",
      }}
    >
      <AxisGlyph size={glyph} />
    </div>
  );
}