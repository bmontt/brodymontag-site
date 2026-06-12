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
  src: "../public/fonts/NeueHaasDisplayMedium.ttf",
  weight: "500",
  display: "swap",
  variable: "--font-neue",
});

export const metadata: Metadata = {
  title: "Brody Montag",
  description:
    "Full Stack Developer & DJ/Producer. Fiserv ML/AI team. Monty (US). Based in NY/DC.",
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
      "Full Stack Developer & DJ/Producer. Fiserv ML/AI team. Monty (US). Based in NY/DC.",
    images: ["/brody.optimized.webp"],
  },
  icons: {
    icon: "/favicon.ico",
  },
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
