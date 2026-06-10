import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
