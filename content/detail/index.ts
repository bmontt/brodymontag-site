// ── detail docs ───────────────────────────────────────────────────────────────
// The registry of long-form pages, and the build's integrity check: a lock
// entry whose code no longer matches its sha256, a code block that names a
// missing excerpt, or a doc for a page that doesn't exist fails `next build`
// (this module loads while the pages prerender). Server only: none of this
// reaches the client bundle.

import "server-only";
import { createHash } from "node:crypto";
import { projects } from "@/lib/projects";
import { experience } from "@/lib/stack-data";
import { steCheckDoc } from "@/scripts/ste-rules.mjs";
import { hasFigure } from "@/components/blocks/figures";
import type { DetailDoc } from "./types";
import { DOCS } from "./docs";
import { lock, repos } from "./excerpts";

export { getExcerpt, type ResolvedExcerpt } from "./excerpts";

// ── integrity ────────────────────────────────────────────────────────────────
for (const [key, ex] of Object.entries(lock)) {
  if (!ex.code) throw new Error(`excerpt ${key}: no code. Run node scripts/sync-excerpts.mjs`);
  const sum = createHash("sha256").update(ex.code).digest("hex");
  if (sum !== ex.sha256) throw new Error(`excerpt ${key}: code does not match its sha256. Run node scripts/sync-excerpts.mjs`);
  if (!repos[ex.source.repo]) throw new Error(`excerpt ${key}: unknown repo ${ex.source.repo}`);
}
const pages = { project: new Set(projects.map((p) => p.slug)), experience: new Set(experience.map((e) => e.id)) };
for (const doc of DOCS) {
  if (!pages[doc.kind].has(doc.key)) throw new Error(`detail doc ${doc.key}: no ${doc.kind} with that key`);
  for (const s of doc.sections)
    for (const b of s.blocks)
      if (b.type === "code" && !lock[b.excerpt]) throw new Error(`detail doc ${doc.key}: code block ${b.id} names missing excerpt ${b.excerpt}`);
      else if (b.type === "figure" && !hasFigure(b.name)) throw new Error(`detail doc ${doc.key}: figure ${b.id} names unknown figure ${b.name}`);
  // the software tab is in STE (docs/portfolio-style-plan.md §4): a doc that
  // does not pass fails the build, on any Node (scripts/ste-lint.mjs prints
  // the same warnings while you write)
  const ste = steCheckDoc(doc);
  if (ste.length) throw new Error(`detail doc ${doc.key}: STE\n${ste.join("\n")}`);
}

// ── access ───────────────────────────────────────────────────────────────────
export function getDetail(kind: DetailDoc["kind"], key: string): DetailDoc | undefined {
  return DOCS.find((d) => d.kind === kind && d.key === key);
}
