import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import { OnboardingProvider } from "@/components/OnboardingProvider";
import { WalletProvider } from "@/components/WalletProvider";
import { LocationProvider } from "@/components/LocationProvider";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-manrope",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://axis-two-xi.vercel.app";
const TITLE = "Axis: stop downloading apps";
const DESCRIPTION =
  "One chat to order food, send gifts and shop. Type it like you'd say it.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Axis",
  openGraph: {
    type: "website",
    siteName: "Axis",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#f7f5f2",
  viewportFit: "cover",
  // Resize the layout when the on-screen keyboard opens so the fixed bottom
  // input stays visible instead of being covered.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="font-body text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-deep"
        >
          Skip to content
        </a>
        <OnboardingProvider>
          <WalletProvider>
            <LocationProvider>{children}</LocationProvider>
          </WalletProvider>
        </OnboardingProvider>
      </body>
    </html>
  );
}