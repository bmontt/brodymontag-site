// ── detail blocks ─────────────────────────────────────────────────────────────
// The typed contract for the long-form part of a project or role page: code
// excerpts, diagrams, tables, decision records. Card-level copy stays in
// lib/content.json; these files hold what is too long (or too multi-line) for
// it, and stay on the server (content/detail/index.ts is server-only), so none
// of this ships in the stage's client chunk. Plan: docs/portfolio-style-plan.md.

/** where an excerpt comes from: a file, a line range, a pinned commit */
export interface Source {
  /** a key in content/repos.json */
  repo: string;
  path: string;
  /** 1-based, inclusive */
  lines: [number, number];
  /** full sha; the excerpt is read with `git show <commit>:<path>` */
  commit: string;
}

/** one entry of content/excerpts.lock.json (written by scripts/sync-excerpts.mjs) */
export interface Excerpt {
  source: Source;
  /** the commit is on the public remote, so a permalink resolves */
  pushed: boolean;
  /** sha256 of `code`, so a hand edit of the lock fails the build */
  sha256: string;
  code: string;
}

/** a figure's evidence: ran it / design goal / someone else's / a dated quote */
export type EvidenceKind = "measured" | "target" | "reported" | "priced";

type Base = { id: string; caption?: string };

export type Block = Base &
  (
    | { type: "prose"; text: string } // [text](url) links allowed
    | { type: "code"; excerpt: string; lang: string; highlight?: number[] } // excerpt: a key in excerpts.lock.json
    | { type: "diagram"; mermaid: string; alt: string }
    | { type: "table"; columns: string[]; rows: string[][]; method?: string; asOf?: string }
    | {
        type: "decision";
        title: string;
        status: "proposed" | "accepted" | "superseded";
        date: string;
        context: string;
        decision: string;
        cost: string[];
      }
    | { type: "callout"; kind: "status" | "limits" | "note"; items: string[] }
    | { type: "commits"; repo: string; items: { sha: string; date: string; subject: string }[] }
    | { type: "links"; items: { label: string; href: string }[] }
  );

export interface Section {
  /** lowercase, the site's label style: "how it works", "decisions" */
  heading: string;
  blocks: Block[];
}

export interface DetailDoc {
  /** a project slug or an experience id */
  key: string;
  kind: "project" | "experience";
  /** YYYY-MM-DD: the day the facts on this page were last checked */
  updated: string;
  sections: Section[];
}
