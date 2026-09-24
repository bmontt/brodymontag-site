// ── /lab/3d ───────────────────────────────────────────────────────────────────
// Phase 1 spike for the 3D stage (docs/3d-journey-plan.md §8). Not linked from
// the site and excluded from indexing.

import type { Metadata } from "next";
import Lab3D from "@/components/stage/lab-3d";

export const metadata: Metadata = {
  title: "lab · 3d stage",
  robots: { index: false, follow: false },
};

export default function Lab3DPage() {
  return <Lab3D />;
}
