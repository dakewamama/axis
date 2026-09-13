import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Home-screen icon (iOS). Ink tile, red glyph — the same mark as in-app.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#201e1d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="108" viewBox="0 0 100 100">
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
      </div>
    ),
    { ...size },
  );
}
