// ── excerpts ──────────────────────────────────────────────────────────────────
// The pinned code excerpts (content/excerpts.lock.json) and their provenance:
// repo@sha, path:lines, and a permalink only when the commit is public. Plain
// data with no server-only import, so content/detail/text.ts (and the e2e
// tests through it) can read it. content/detail/index.ts checks every entry
// when the build loads it.

import lockJson from "@/content/excerpts.lock.json";
import reposJson from "@/content/repos.json";
import type { Excerpt } from "./types";

type Repo = { path: string; github?: string; visibility: "public" | "private" | "none" };
export const repos = reposJson as unknown as Record<string, Repo>;
export const lock = Object.fromEntries(
  Object.entries(lockJson as Record<string, unknown>).filter(([k]) => !k.startsWith("_")),
) as Record<string, Excerpt>;

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
