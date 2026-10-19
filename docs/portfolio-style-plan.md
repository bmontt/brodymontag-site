# Portfolio style and content plan — October 2026

> **Status (2026-10-19):** plan decisions P1–P6 are answered (§10). Phase 4
> (the block pipeline) has started on branch `claude/site-detail-blocks`.
> Steps marked **waits on** need answers to the fact-audit prompts (IDs such as
> `S1`, `M3`).

This plan does three things:

1. It applies the rules of strong technical portfolio sites to brodymontag.com.
2. It rewrites the software tab in ASD-STE100 Simplified Technical English (STE).
3. It adds detail pages with code excerpts, diagrams, tables and decision records.

Sources: the fact audit of 2026-10-19 (four agents, every claim checked against
the resume, LinkedIn text, EPK, vault, repos and the web), a style study of
about 60 portfolio and documentation sites, and a study of block rendering in
this repo (Next 16.3.8 docs in `node_modules/next/dist/docs/`).

---

## 1. The problem in one paragraph

The audit found the same four faults in many places. Design targets are written
as measured results (Prism). Paused or archived projects show "live" or "in
progress" (realmbot, kicker, Peak_Finding_Toolbox). Words of praise replace facts
("research-grade", "autonomous", "control plane"). Crowd claims have no source
("sold-out", "a large crowd"). The machine view (`/machine`, `/llms.txt`) copies
the same text and drops status and dates. The rules below remove each fault at
the level of the data model, so a new entry cannot bring a fault back.

---

## 2. Rules (ranked)

Each rule comes from at least two of the studied sites. Section 5 of the
research brief holds the examples and URLs.

1. **Every figure has a kind, a method and a date.** Write
   `value · kind · method · date`. Kinds: `measured` (I ran it), `target`
   (a design goal), `reported` (another source, with a link), `priced`
   (a quote with a date). Examples: ripgrep benchmarks, Dan Luu, nanoGPT, the
   Google SRE book (SLI vs SLO).
2. **One status word from a fixed list, with a reason and a date.** See §3.
   Examples: repostatus.org, Linus Lee's project sections, Gwern's status line.
3. **Keep what exists apart from what is planned.** Present tense only for what
   exists. Plans go in `status and next`. A design page says "design" in its
   status. Examples: Nygard ADR status, Rust RFC "unresolved questions".
4. **Plain descriptions.** The first sentence is a noun phrase that says what
   the thing is. Each next sentence states one fact. No praise words. See the
   word map in §6.
5. **Absolute dates, two kinds.** `started` (`YYYY-MM`) and `updated`
   (`YYYY-MM-DD`, meaning "I checked the facts on this page on this day").
   A changing figure has `as of YYYY-MM-DD`. Examples: Gwern created/modified,
   Keep a Changelog.
6. **Limits on the same page as the claims.** Three to five short items.
   Examples: Josh Comeau's downsides, Dan Luu's corrections page, Ciechanowski's
   notes beside a diagram.
7. **Link proof that stays valid.** Link source at a commit, not a branch. For a
   private repo, write "private". Do not hide the row. Examples: Simon Willison's
   colophon, GitHub permalinks.
8. **Experience entries: scope, my part, a result with its measure, what is not
   public.** Examples: Julia Evans's brag documents, Tom MacWright's year spans.
9. **Decisions with reasons and a cost.** "I chose X over Y because Z. Cost: W."
   Two to four per project.
10. **"I" for choices and status. No subject for facts.**
11. **A dated `now` line, a change record and a colophon line.** The colophon
    states the tools and the AI help that made the work.
12. **Show rows record the billing as the listing prints it.** Fixed fields,
    a link to the listing, no crowd adjectives.
13. **The machine view carries the same status, dates and evidence kinds as the
    human view.**

Not copied: garden metaphors (seedling, evergreen), relative dates ("3 years
ago"), jokes, contractions, dashes between clauses, per-page confidence scores,
long essays, vanity counters without a date.

---

## 3. Status words, evidence kinds, dates

| word | definition |
|---|---|
| `concept` | Design only. No working code and no hardware. |
| `building` | Work in progress. Not ready for other people to use. Changed in the last 60 days. |
| `active` | It works. I use it or change it. Changed in the last 90 days. |
| `paused` | I stopped for now. I plan to continue. A reason and a date follow. |
| `finished` | It is done and it works. I fix only bugs. |
| `archived` | I stopped. I do not plan to continue. I keep it as a record. |

- Display: `paused since 2026-10-01 · model access not granted`.
- No new colors (`docs/design-system.md` §2.3). `active` uses white at `/80`.
  `paused`, `finished` and `archived` use white at `/30`. `concept` and
  `building` keep the current accent pill (`text-accent/75 border-accent/25`).
- A build check warns when an `active` project has an `updated` date older
  than 180 days.

Proposed mapping (**waits on** `S1`, `S6`, `S10`, `S11`):

| project | now | proposed |
|---|---|---|
| prism | wip | `concept` or `building` · hardware not built |
| venture | live | `active` |
| superset | live | `active` or `paused` · last commit 2026-06-30 |
| realmbot | wip | `paused` since 2026-10-01 |
| brodymontag.com | live | `active` |
| here comes the kicker | wip | `paused` since 2026-08-19 |
| agent-forge | live | `active` |
| Peak_Finding_Toolbox | live | `archived` · last commit 2025-05-07 |

Date convention: metadata rows use ISO (`started 2026-06`, `updated 2026-10-19`).
Prose uses a spelled month ("19 October 2026"). Shows keep the current
spelled-month form and get the day where a source gives it (`M1`).

---

## 4. Voice by tab

- **Software tab, project pages, experience pages:** strict STE. The rules are
  the ones in `~/.claude/ste100.md`: approved verb forms only, no "-ing" verbs,
  active voice, 25 words or fewer per descriptive sentence, six sentences or
  fewer per paragraph, one meaning per word, no contractions, no dashes or
  semicolons between clauses. Technical names (three.js, GLSL, OPA) are allowed.
  Lowercase UI labels stay as they are (`docs/design-system.md` §3.4).
- **Music and about tabs:** rules 1, 4, 5, 6, 12 apply (no praise, sources and
  dates for every fact). The personal voice stays. STE is not used there (`P1`).
- **Hero pitch and `/llms.txt` summary:** plain and checkable. The pitch feeds
  the machine view, so it follows rule 4.

### 4.1 Example: brodymontag.com card and page in STE

Card description (replaces the current one):

> A personal site with a 3D stage behind the text. A GLSL pass draws the stage
> as text glyphs, one glyph for each 8×22 px cell.

Page sections:

- **what:** A personal site for my software and my music. One animated stage
  stays on screen across all pages.
- **why:** I wanted one background that continues when a visitor moves between
  pages. The background must not slow the scroll.
- **how it works:** A three.js scene renders to a small target, one pixel for
  each 8×22 px cell. A second pass selects a glyph for each cell. A third pass
  draws the glyphs from an atlas. Every visitor first sees a CPU version in a
  Web Worker. A capable device then loads the 3D version and fades to it.
  *(diagram: scroll → GSAP → journey store → director → 2D or 3D tier)*
- **decisions:** GSAP ScrollTrigger is the only code that writes scroll state.
  React gets only chapter changes. Cost: a Playwright test must guard this
  rule. The test allows at most 4 React commits for a full scroll.
- **results:**

  | figure | kind | method | date |
  |---|---|---|---|
  | 120 fps, p95 frame 9.3 ms | measured | scripted wheel scroll, 6× CPU throttle, Chromium, production build, M4 Pro, 120 Hz, 1440×900 at 2× | 2026-10-14 |
  | style recalc 411 → 69 ms per s | measured | same run, 6× CPU | 2026-10-14 |
  | worker paint = main-thread paint, PSNR 108 dB | measured | still frames | 2026-10-14 |

- **limits:** The frame figures come from one machine. A 60 Hz display limits
  the rate to 60. The frame-test scripts are not in the public repo.

### 4.2 Example: Fiserv entry in STE (public facts only)

- **scope:** Full-stack developer in Fiserv's Global Business Solutions group
  (**waits on** `A9`). I work on a payments developer portal and the AI tools
  for it.
- **my part:**
  - I proposed and built a document editor for the team. Two or more people
    can edit a page at the same time. It uses Tiptap, Yjs, Fastify and
    Postgres. It became the team's CMS.
  - I built a delivery platform for AI agents. An AI review runs before a human
    reads the code. The platform logs each agent run. A human approves each
    merge. The team adopted it.
  - I built a tool that sorts security scanner findings. On one run, it sorted
    344 findings in 13 seconds. It found all of the findings that a manual
    review found. Each fix has a regression test.
  - I moved the authorization checks from the browser to the backend. OPA
    policies make the checks. A check that fails denies access.
- **not public:** The code, the product names and the figures that are not on
  my resume.

---

## 5. Data model

### 5.1 Card-level fields (`lib/content.json`, typed in `lib/projects.ts`)

```ts
type Status = "concept" | "building" | "active" | "paused" | "finished" | "archived";
type Stat = { label: string; value: string; kind: "measured" | "target" | "reported" | "priced"; method: string; date: string };

interface Project {
  id: string; slug: string; name: string;
  status: Status; statusSince: string; statusNote?: string;   // "hardware not built"
  started: string; updated: string;                            // "2026-06", "2026-10-19"
  description: string;                                         // STE, 1–2 sentences
  longDescription: string;                                     // STE, stays on the card data (P2)
  highlights: string[];                                        // STE; a figure names its kind
  tags: string[];
  source: { repo: string; visibility: "public" | "private" | "none"; url?: string };
  stats?: Stat[];                                              // replaces stats + statsAsOf
  icon?: string;
}
```

- `highlights` and `longDescription` stay (`P2`). They follow the STE rules and
  the evidence rules: a highlight that states a figure says its kind
  ("target: 12× real time"), and `ste-lint` checks them. The detail blocks add
  decisions, results and limits below them.
- Experience gets `scope`, `part[]`, `result`, `notPublic`, `checked`.
- Shows get `billedAs` (the listing's order), `role`, `listing` (URL) and an
  optional `proof` (post or flyer). `context` loses crowd adjectives.

### 5.2 Detail blocks (`content/detail/<slug>.ts`, server only)

Long blocks do not go in `content.json`. Reason: the stage imports `projects`
(`lib/director/layouts.ts:9`), so all project text ships in a shared client
chunk on every page today. Detail files start with `import "server-only"`.
The stage gets a slim `lib/projects-lite.ts` (ids and slugs only), which also
makes the current client chunk smaller.

```ts
type Source = { repo: string; path: string; lines: [number, number]; commit: string };
type Block = { id: string; caption?: string } & (
  | { type: "prose"; text: string }
  | { type: "code"; excerpt: string; lang: string; highlight?: number[] }
  | { type: "diagram"; mermaid: string; alt: string; render?: "svg" | "ascii" }
  | { type: "table"; variant: "results" | "targets"; columns: string[]; rows: (string | number)[][]; method: string; asOf: string }
  | { type: "decision"; title: string; status: "proposed" | "accepted" | "superseded"; date: string; context: string; decision: string; cost: string[] }
  | { type: "callout"; kind: "status" | "limits" | "note"; text: string }
  | { type: "commits"; repo: string; items: { sha: string; date: string; subject: string }[] }
  | { type: "links"; items: { label: string; href?: string; source?: Source }[] }
);
```

Page order (target total: 400–550 words of prose, not counting tables and code):

| section | content | size |
|---|---|---|
| header | name, status line, started, updated, stack, source or "private" | metadata rows |
| what | one sentence | ≤ 25 words |
| why | the problem or the question | ≤ 50 words |
| how it works | two short paragraphs, then one diagram | ~120 words |
| decisions | 2–4 decision records; one code excerpt under the decision it supports | ~50 words each |
| results | one table: figure · kind · method · date | ≤ 6 rows |
| limits | 3–5 items | ≤ 20 words each |
| status and next | done, blocked, next, each with a date | ~60 words |
| proof | ≤ 5 links, each label names the artifact | — |

Code excerpts: at most one under "how it works" and one under each decision,
three per page at most, 25 lines or fewer, caption
`src/path.py:41-58 @ 3f2a9c1 ↗`. Diagrams: one per page, under "how it works",
caption as a noun phrase (`figure 1 · signal path · design`).

---

## 6. Word map (software tab)

| do not write | write |
|---|---|
| research-grade | the benchmark: picks, median error, method |
| autonomous | "runs on a schedule", then list what needs a human |
| governed | "with approval steps", then list the steps |
| control plane | "a web page that shows the running agents" |
| agentic | "AI agent" |
| fleet | "[N] agents" |
| real-time | the latency figure with its method, or delete |
| optimized, optimizer | what changed and by how much; "generator" |
| live (as a status) | a word from §3 |
| trustworthy, rigor, craft | the checks that exist |
| never, always, every | "the code does not allow X (test: name)" |
| a lot of, most | a count: "3 of 8 projects" |
| designed for | "built for", or "design only" |

`scripts/ste-lint.mjs` (new) checks the software copy at build time:
sentence length, contractions, words from this table and from the STE word
table, "-ing" verb forms (with an allow list of technical names), and dashes
or semicolons between clauses. It prints warnings first. It fails the build
only after the rewrite is done.

---

## 7. Rendering (zero new client JavaScript)

- **Code:** `shiki@4.5.0` at build, `createCssVariablesTheme` so the colors come
  from `globals.css` tokens. `@shikijs/transformers@4.5.0` for highlighted
  lines. Line numbers from CSS counters. No animated token colors
  (`docs/performance.md`: animated colors force a style recalc on each frame).
- **Diagrams:** `beautiful-mermaid@1.1.3` at build. It is pure TypeScript and
  needs no browser. It gives SVG with CSS variables, or Unicode box art that
  matches the ASCII look. A 30-minute spike comes first (`P6`). Fallback:
  render with `@mermaid-js/mermaid-cli` on the Mac and commit the SVG.
  Rejected: client-side mermaid (174 KB gz, layout on the main thread) and
  rehype-mermaid (needs Chromium in the Vercel build).
- **Excerpts:** `scripts/sync-excerpts.mjs` runs on the Mac. It reads
  `git show <sha>:<path>` (never the working tree), slices the lines and writes
  `content/excerpts.lock.json` with a sha256 for each slice. `--check` warns
  when the source changed at HEAD. It fails on secret patterns.
  `scripts/check-content.mjs` runs in `npm run build` on Vercel and checks the
  lock file only. Public repos get a permalink when the commit is on the remote.
  Private repos get `venture@<sha> · path:41-68 · private repo`.
- **Experience pages:** `app/(site)/experience/[id]/page.tsx` with
  `generateStaticParams`. A shared `components/detail-page.tsx` serves both
  detail routes. Cards on `/software` link to it. `proxy.ts`, `app/machine`
  and `lib/director/software-figure.ts:302` learn the new path.
- **Accessibility:** `<figure>` and `<figcaption>`, `<table>` with `<caption>`
  and `scope`, scrollable `<pre>` with `tabindex="0"` and a label, box art in
  `role="img"` with an `alt` sentence and the mermaid source in `<details>`.
  Block text at white `/55` or more (`/45` fails AA). No motion of their own.
  `content-visibility: auto` on each block.
- **Budget:** static routes prefetch in full when their link enters the
  viewport, so `/software` pays for every detail page. Today `prism.html` is
  30.6 KB and `prism.rsc` 17.5 KB. Limit: 3× that. Gate: the scroll test on
  `/software` at 6× CPU before and after. Lever: `prefetch={false}` on cards.

---

## 8. Machine view

- `/machine` and `/llms.txt` print the status word, `updated` and each stat's
  kind for every project.
- `llmsText()` uses the plain pitch.
- New per-page text routes `app/machine/projects/[slug]/route.ts` and
  `app/machine/experience/[id]/route.ts`. A pure `blockText(block)` prints each
  block: code with its provenance line, diagrams as alt text plus mermaid
  source, tables as aligned rows plus the method line.
- `e2e/machine.spec.ts` gets a case for each block type.

---

## 9. Phases

Each phase is one PR into `feat/3d-stage` from a branch cut from
`origin/feat/3d-stage` (`X2`).

| # | phase | waits on | files |
|---|---|---|---|
| 1 | Fact fixes: the `K` list and the answered prompts | answers | `lib/content.json` |
| 2 | Status, dates, evidence kinds in the data model and the cards | `S1`, `S6`, `S10`, `S11` | `lib/projects.ts`, `lib/stack-data.ts`, cards, `/software`, `lib/now.ts` |
| 3 | STE rewrite of the software tab, `ste-lint` | phase 2 | `lib/content.json`, `scripts/ste-lint.mjs` |
| 4 | Block pipeline: spike, types, renderers, excerpt sync, checks | — (started) | `content/`, `components/blocks/`, `lib/highlight.ts`, `lib/diagram.ts`, `scripts/` |
| 5 | Detail pages: projects rebuilt on the template, experience route | phase 4, `S8`, `E1` | `components/detail-page.tsx`, `app/(site)/projects/[slug]`, `app/(site)/experience/[id]` |
| 6 | Content for each page: diagrams, excerpts, decisions, results | phase 5 | `content/detail/*.ts` |
| 7 | Machine view parity | phase 6 | `lib/machine.ts`, `app/machine/**`, `e2e/machine.spec.ts` |
| 8 | `now` line, `/changelog` page, colophon line | — | `lib/now.ts`, footer, `app/(site)/changelog` |
| 9 | Music and about clean-up: show fields, proof links | `M*`, `A*` | `lib/content.json`, show page |

Verification for each phase: `npx tsc --noEmit`, `npm run build`,
`npx playwright test`, the scroll test at 6× CPU on `/software`, a diff of
`/machine` before and after, and a check by eye on desktop and on a 390 px
screen.

Order of detail pages (best material first, from the audit): brodymontag.com,
venture, realmbot, superset (after `S9`), agent-forge, Prism, here comes the
kicker, Peak_Finding_Toolbox. Employer work (Fiserv, Galago) gets no code and
no diagram of internal systems.

---

## 10. Plan decisions (answered 2026-10-19)

| id | question | answer |
|---|---|---|
| P1 | STE scope | Software tab only (cards, project pages, experience pages). |
| P2 | Remove `highlights` and `longDescription` | No. Both stay, rewritten in STE. |
| P3 | Change record | Yes: a `/changelog` page. The footer shows the date of the last entry and links to it. |
| P4 | Colophon line on tools and AI help | Yes. |
| P5 | 60 days for `building`, 90 for `active` | Yes. |
| P6 | `shiki`, `@shikijs/transformers`, `beautiful-mermaid` and a spike | Yes. |

---

## 11. Risks

1. `/software` prefetch weight grows with every detail page. Measure before
   and after. Use `prefetch={false}` if the 3× limit breaks.
2. `beautiful-mermaid` had no release since 2026-02-26. Subgraphs and the
   Turbopack server build are not tested. The spike settles this.
3. Geist Mono loads the `latin` subset only. Box-drawing glyphs may fall back
   to a system font and break ASCII alignment. Check by eye.
4. Code excerpts can drift from the prose. The lock file and `--check` find
   drift in code only.
5. Employer IP and secrets: no Fiserv or Galago code. The excerpt script scans
   for secret patterns. Private repos show text only.
