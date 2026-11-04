#!/usr/bin/env node
// ── check-page-size ───────────────────────────────────────────────────────────
// Fails the build when a project page is over the size limit in
// docs/portfolio-style-plan.md §7. It reads the raw files that `next build`
// leaves in its output folder for each page, before gzip.
//
//   node scripts/check-page-size.mjs   exit 1 on any page over the limit (the build runs this)

import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

// KB = 1024 bytes. §7 says why these two numbers; change them there as well.
const LIMIT_KB = { html: 150, rsc: 75 };

const root = fileURLToPath(new URL("..", import.meta.url));
// the same folder as distDir in next.config.ts
const dist = `${root}${process.env.NEXT_DIST_DIR || ".next"}/`;
// where a page's files are after `next build`; on Vercel its adapter moves them
const LAYOUTS = [
  { dir: `${dist}server/app/projects/`, html: ".html", rsc: ".rsc" },
  { dir: `${dist}output/functions/projects/`, html: ".prerender-fallback.html", rsc: ".rsc.prerender-fallback.rsc" },
];
// rounded up, so a page over the limit never prints as the limit
const kb = (bytes) => (Math.ceil((bytes * 100) / 1024) / 100).toFixed(2);

const pagesIn = ({ dir, html }) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(html)).map((f) => f.slice(0, -html.length)) : [];
const layout = LAYOUTS.find((l) => pagesIn(l).length);
// no pages must not read as no page over the limit
if (!layout) {
  console.error(`check-page-size: no project pages in ${LAYOUTS.map((l) => l.dir).join(" or ")}`);
  process.exit(1);
}
const pages = pagesIn(layout);

const out = [];
const largest = { html: 0, rsc: 0 };
for (const page of pages) {
  const over = [];
  for (const [ext, limit] of Object.entries(LIMIT_KB)) {
    const file = `${layout.dir}${page}${layout[ext]}`;
    if (!existsSync(file)) {
      over.push(`no ${ext} file`);
      continue;
    }
    const { size } = statSync(file);
    largest[ext] = Math.max(largest[ext], size);
    if (size > limit * 1024) over.push(`${ext} ${kb(size)} KB, limit ${limit} KB`);
  }
  if (over.length) out.push(`/projects/${page}: ${over.join("; ")}`);
}

for (const line of out) console.error(`size  ${line}`);
const margins = Object.entries(LIMIT_KB).map(([ext, limit]) => `${ext} ${kb(largest[ext])} of ${limit} KB`);
console.log(`check-page-size: ${out.length} of ${pages.length} pages over the limit; largest ${margins.join(", ")}`);
if (out.length) process.exit(1);
