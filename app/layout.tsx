import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

const neueHaas = localFont({
  src: "../public/fonts/NeueHaasDisplayMedium.woff2", // lossless WOFF2 of the .ttf (¼ the bytes)
  weight: "500",
  display: "swap",
  variable: "--font-neue",
});

export const metadata: Metadata = {
  title: { default: "Brody Montag", template: "%s — Brody Montag" },
  description:
    "Full-stack developer & DJ/producer. Fiserv. Monty (US). East Coast based.",
  metadataBase: new URL("https://brodymontag.com"),
  openGraph: {
    title: "Brody Montag",
    description: "Full Stack Developer & DJ/Producer. Monty (US).",
    url: "https://brodymontag.com",
    siteName: "Brody Montag",
    images: [{ url: "/brody.optimized.webp" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brody Montag",
    description:
      "Full-stack developer & DJ/producer. Fiserv. Monty (US). East Coast based.",
    images: ["/brody.optimized.webp"],
  },
  // BM in the shimmer. The SVG adapts to the browser theme (dark tile on light
  // chrome, floating letters on dark); the .ico (always on the tile) is the
  // fallback for browsers without SVG favicons — sized, not "any", so the SVG
  // wins where it's supported. The 192px PNG is for search results (Google
  // wants a square multiple of 48px); the SVG stays last, so browsers that take
  // the last suitable icon still get the theme-aware one.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // machine-readable face of the site (see lib/machine.ts)
  alternates: { types: { "text/plain": "/llms.txt" } },
};

export const viewport: Viewport = {
  themeColor: "#1a1e23",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`h-full antialiased dark ${geistMono.variable} ${neueHaas.variable}`}
      style={{ backgroundColor: "oklch(0.14 0.006 235)" }}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
