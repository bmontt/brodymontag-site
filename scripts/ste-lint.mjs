#!/usr/bin/env node
// ── ste-lint ──────────────────────────────────────────────────────────────────
// Checks the software tab's copy (lib/content.json code.projects and
// code.experience, and the detail docs in content/detail) against the
// ASD-STE100 rules in scripts/ste-rules.mjs.
//
//   node scripts/ste-lint.mjs            print warnings, exit 0
//   node scripts/ste-lint.mjs --strict   exit 1 on any warning (the build runs this)
//   node scripts/ste-lint.mjs content/detail/venture.ts   one detail doc only
//
// The detail docs are TypeScript. Node 22.18+ loads them (it strips types);
// an older Node skips them here, and content/detail/index.ts checks them
// during `next build` instead.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { steCheck, steCheckDoc } from "./ste-rules.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const content = JSON.parse(readFileSync(`${root}lib/content.json`, "utf8"));
const strict = process.argv.includes("--strict");
const only = process.argv.find((a) => a.endsWith(".ts"));

const out = [];
const check = (where, text) => out.push(...steCheck(where, text));

if (!only) {
  for (const p of content.code.projects) {
    check(`projects.${p.id}.description`, p.description);
    p.longDescription.split("\n\n").forEach((para, i) => check(`projects.${p.id}.longDescription[${i}]`, para));
    p.highlights.forEach((h, i) => check(`projects.${p.id}.highlights[${i}]`, h));
  }
  for (const e of content.code.experience) {
    check(`experience.${e.id}.description`, e.description);
    (e.highlights ?? []).forEach((h, i) => check(`experience.${e.id}.highlights[${i}]`, h));
  }
}

const detailDir = `${root}content/detail/`;
for (const f of readdirSync(detailDir).filter((f) => f.endsWith(".ts") && !["index.ts", "types.ts", "text.ts", "docs.ts", "excerpts.ts"].includes(f))) {
  if (only && !only.endsWith(f)) continue;
  try {
    out.push(...steCheckDoc((await import(`${detailDir}${f}`)).default));
  } catch (e) {
    if (e?.code !== "ERR_UNKNOWN_FILE_EXTENSION") throw e;
    console.log(`ste-lint: this Node cannot load ${f}; next build checks it`);
  }
}

for (const line of out) console.warn(`ste  ${line}`);
console.log(`ste-lint: ${out.length} warning${out.length === 1 ? "" : "s"}`);
if (strict && out.length) process.exit(1);
