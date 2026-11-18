import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // a second output folder lets a production build run beside `next dev`
  // (NEXT_DIST_DIR=.next-prod next build && NEXT_DIST_DIR=.next-prod next start)
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // AVIF first (smaller at the same quality), WebP for browsers without it
    formats: ["image/avif", "image/webp"],
  },
  // brodymontag.com/glitchcam is the product page of GLITCHCAM. It is a static page in its
  // own Vercel project (bmontt/glitchcam, web/), and all its files live under /glitchcam there
  // too, so these two rules pass the page and its files through with the paths unchanged.
  async rewrites() {
    return [
      { source: "/glitchcam", destination: "https://glitchcam-orcin.vercel.app/glitchcam" },
      { source: "/glitchcam/:path*", destination: "https://glitchcam-orcin.vercel.app/glitchcam/:path*" },
    ];
  },
  async headers() {
    return [
      {
        // public files aren't fingerprinted: a day fresh, then served stale
        // while revalidating for a week (repeat visits never wait on them)
        source: "/:dir(artistLogos|BrodyEvents|fonts)/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
