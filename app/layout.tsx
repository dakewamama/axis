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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="font-body text-ink antialiased">
        <OnboardingProvider>
          <WalletProvider>
            <LocationProvider>{children}</LocationProvider>
          </WalletProvider>
        </OnboardingProvider>
      </body>
    </html>
  );
}