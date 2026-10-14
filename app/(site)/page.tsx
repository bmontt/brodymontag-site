// ── / ──────────────────────────────────────────────────────────────────────────
// The landing page: the name, split down the middle into the site's two halves
// — software and music — with "about me" where they meet (components/landing).
// Each half lives on its own page: /software, /music, /about.

import Landing from "@/components/landing";
import { nowLines } from "@/lib/now";

export default function Home() {
  return <Landing now={nowLines()} />;
}
