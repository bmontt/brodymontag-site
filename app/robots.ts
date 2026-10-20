// ── robots.txt ────────────────────────────────────────────────────────────────
// Everything is open to crawlers (the lab page carries its own noindex), and
// the sitemap tells search engines what exists and when it last changed.

import type { MetadataRoute } from "next";
import { content } from "@/lib/content";

const ORIGIN = `https://${content.meta.domain}`;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${ORIGIN}/sitemap.xml`,
    host: ORIGIN,
  };
}
