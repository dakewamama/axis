export function AxisGlyph({ size = 35 }: { size?: number }) {
  return (
    <svg width={size} viewBox="0 0 100 100" aria-hidden="true">
      {/* Centered, symmetric upward burst: a stem with two branches and a rising
          center stroke, capped by the amber spark. Balanced about x=50. */}
      <g
        stroke="#ec3013"
        strokeWidth="15"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      >
        <path d="M50 86 L50 58" />
        <path d="M50 58 L27 35" />
        <path d="M50 58 L73 35" />
        <path d="M50 58 L50 30" />
      </g>
      <circle cx="50" cy="16" r="7.5" fill="#f5a623" />
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
      className="flex shrink-0 items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        // Top-lit gradient + inner highlight gives the tile real depth.
        background: "linear-gradient(155deg, #35312e 0%, #201e1d 58%)",
        boxShadow:
          "0 10px 30px -12px rgb(32 30 29 / 0.5), inset 0 1px 0 rgb(255 255 255 / 0.07)",
      }}
    >
      <AxisGlyph size={glyph} />
    </div>
  );
}