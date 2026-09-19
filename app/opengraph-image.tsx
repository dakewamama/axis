import { ImageResponse } from "next/og";

export const alt = "Axis — buy airtime and data by chat in Nigeria";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Rendered in the product palette (cream / ink / red) so a shared link on
// WhatsApp shows the brand, not a grey rectangle.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5f2",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 40,
              background: "#201e1d",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="76" viewBox="0 0 100 100">
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
          <span
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#201e1d",
              letterSpacing: "-0.03em",
            }}
          >
            Axis
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 62,
              fontWeight: 800,
              color: "#201e1d",
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              maxWidth: 900,
            }}
          >
            One chat. Buy airtime, top up any line.
          </span>
          <span
            style={{
              marginTop: 24,
              fontSize: 34,
              color: "#6b655f",
              fontWeight: 500,
            }}
          >
            Type it like you&rsquo;d say it.
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
