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
      </div>
    ),
    { ...size },
  );
}
