// ── detail docs ───────────────────────────────────────────────────────────────
// The registry of long-form pages, and the build's integrity check: a lock
// entry whose code no longer matches its sha256, a code block that names a
// missing excerpt, or a doc for a page that doesn't exist fails `next build`
// (this module loads while the pages prerender). Server only: none of this
// reaches the client bundle.

import "server-only";
import { createHash } from "node:crypto";
import lockJson from "@/content/excerpts.lock.json";
import reposJson from "@/content/repos.json";
import { projects } from "@/lib/projects";
import { experience } from "@/lib/stack-data";
import { steCheckDoc } from "@/scripts/ste-rules.mjs";
import { hasFigure } from "@/components/blocks/figures";
import type { DetailDoc, Excerpt } from "./types";
import agentForge from "./agent-forge";
import brodymontagCom from "./brodymontag-com";
import kicker from "./here-comes-the-kicker";
import peakFinding from "./peak-finding-toolbox";
import prism from "./prism";
import realmbot from "./realmbot";
import superset from "./superset";
import venture from "./venture";

const DOCS: DetailDoc[] = [brodymontagCom, prism, venture, superset, realmbot, kicker, agentForge, peakFinding];

type Repo = { path: string; github?: string; visibility: "public" | "private" | "none" };
const repos = reposJson as unknown as Record<string, Repo>;
const lock = Object.fromEntries(
  Object.entries(lockJson as Record<string, unknown>).filter(([k]) => !k.startsWith("_")),
) as Record<string, Excerpt>;

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

export interface ResolvedExcerpt extends Excerpt {
  /** "lib/journey-store.ts:1-10" */
  location: string;
  /** "brodymontag-site@57d2653" */
  at: string;
  /** a permalink at the pinned commit, only when that commit is public */
  href?: string;
}

export function getExcerpt(key: string): ResolvedExcerpt {
  const ex = lock[key];
  const { repo, path, lines, commit } = ex.source;
  const r = repos[repo];
  return {
    ...ex,
    location: `${path}:${lines[0]}-${lines[1]}`,
    at: `${repo}@${commit.slice(0, 7)}`,
    href: r.github && ex.pushed ? `https://github.com/${r.github}/blob/${commit}/${path}#L${lines[0]}-L${lines[1]}` : undefined,
  };
}
