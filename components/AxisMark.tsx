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