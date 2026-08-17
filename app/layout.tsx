import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Source_Sans_3 } from "next/font/google";
import { TripShell } from "@/components/trip-shell";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["WONK", "SOFT", "opsz"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: {
    default: "Europe 2026 — Munich, Innsbruck, the Dolomites, Venice",
    template: "%s — Europe 2026",
  },
  description:
    "Sept 5–14, 2026. A continuous journey from Munich to Innsbruck, across the Puez-Odle, then down to Venice.",
  applicationName: "Europe 2026",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Europe 2026",
  },
  openGraph: {
    title: "Europe 2026",
    description:
      "Munich → Innsbruck → the Dolomites → Venice. Sept 5–14, 2026.",
    images: [{ url: "/photos/dolomites.jpg", width: 1600, height: 2000 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${sourceSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full font-sans text-[var(--ink)] antialiased">
        <TripShell />
        {children}
      </body>
    </html>
  );
}
