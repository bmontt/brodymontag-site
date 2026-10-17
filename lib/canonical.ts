// ── canonical ─────────────────────────────────────────────────────────────────
// Each page names its brodymontag.com address as the real one (metadataBase in
// app/layout.tsx makes the path absolute), so copies served elsewhere — the
// vercel.app domain, preview deployments — fold into it in search. Metadata
// merges shallowly: a page's `alternates` replaces the layout's whole object,
// so this carries the llms.txt alternate along with the canonical.

import type { Metadata } from "next";

export function alternates(path: string): Metadata["alternates"] {
  return { canonical: path, types: { "text/plain": "/llms.txt" } };
}
