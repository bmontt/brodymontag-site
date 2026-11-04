#!/usr/bin/env node
// ── check-page-size ───────────────────────────────────────────────────────────
// Fails the build when a project page is over the size limit in
// docs/portfolio-style-plan.md §7. It reads the raw files that `next build`
// prerenders to server/app/projects in its output folder, before gzip.
//
//   node scripts/check-page-size.mjs   exit 1 on any page over the limit (the build runs this)

import { existsSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

// KB = 1024 bytes. §7 says why these two numbers; change them there as well.
const LIMIT_KB = { html: 150, rsc: 75 };

const root = fileURLToPath(new URL("..", import.meta.url));
// the same folder as distDir in next.config.ts
const dir = `${root}${process.env.NEXT_DIST_DIR || ".next"}/server/app/projects/`;
// rounded up, so a page over the limit never prints as the limit
const kb = (bytes) => (Math.ceil((bytes * 100) / 1024) / 100).toFixed(2);

const pages = existsSync(dir)
  ? readdirSync(dir).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -".html".length))
  : [];
// no pages must not read as no page over the limit
if (!pages.length) {
  console.error(`check-page-size: no project pages in ${dir}`);
  process.exit(1);
}

const out = [];
const largest = { html: 0, rsc: 0 };
for (const page of pages) {
  const over = [];
  for (const [ext, limit] of Object.entries(LIMIT_KB)) {
    const file = `${dir}${page}.${ext}`;
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
