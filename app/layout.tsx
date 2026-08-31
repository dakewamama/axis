import type { Metadata, Viewport } from "next";
import { Manrope, Inter} from "next/font/google";
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

export const metadata: Metadata = {
  title: "Axis    stop downloading apps",
  description: "One chat that orders food, books rides, pays bills and moves money. Type it like you'd say it.",
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
      <body className="font-body text-ink antialiased">{children}</body>
    </html>
  );
}