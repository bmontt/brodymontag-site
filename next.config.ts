import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
    // AVIF first (smaller at the same quality), WebP for browsers without it
    formats: ["image/avif", "image/webp"],
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
