// ── / ──────────────────────────────────────────────────────────────────────────
// The landing page: the name, split down the middle into the site's two halves
// — software and music — with "about me" where they meet (components/landing).
// Each half lives on its own page: /software, /music, /about.

import type { Metadata } from "next";
import Landing from "@/components/landing";
import { nowLines } from "@/lib/now";
import { flag } from "@/lib/flags";
import { alternates } from "@/lib/canonical";

export const metadata: Metadata = { alternates: alternates("/") };

export default function Home() {
  return <Landing now={flag("now") ? nowLines() : null} />;
}
