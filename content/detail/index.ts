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
import type { DetailDoc, Excerpt } from "./types";
import brodymontagCom from "./brodymontag-com";

const DOCS: DetailDoc[] = [brodymontagCom];

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
