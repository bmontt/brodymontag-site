#!/usr/bin/env node
// ── ste-lint ──────────────────────────────────────────────────────────────────
// Checks the software tab's copy (lib/content.json code.projects and
// code.experience) against the ASD-STE100 rules the site uses
// (docs/portfolio-style-plan.md §4, §6): sentence length, contractions,
// "-ing" verb forms, perfect tenses, dashes or semicolons between clauses, and words the plan
// replaces. Technical names stay allowed; the allow list below holds them.
//
//   node scripts/ste-lint.mjs            print warnings, exit 0
//   node scripts/ste-lint.mjs --strict   exit 1 on any warning (the build runs this)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const content = JSON.parse(readFileSync(`${root}lib/content.json`, "utf8"));
const strict = process.argv.includes("--strict");

const MAX_WORDS = 25;
// words the STE table and the plan's word map replace (lowercase, whole words)
const BANNED = [
  "ensure", "utilize", "utilise", "perform", "prior to", "commence", "initiate", "terminate", "obtain", "assist",
  "facilitate", "modify", "attempt", "sufficient", "numerous", "in order to", "basically", "actually", "just",
  "simply", "really", "quite", "pretty much", "research-grade", "autonomous", "governed", "control plane",
  "agentic", "fleet", "real-time", "optimized", "trustworthy", "rigor", "craft", "a lot of", "designed for",
  "cutting-edge", "seamless", "seamlessly", "robust", "powerful", "leverage", "world-class", "state-of-the-art",
];
// "-ing" words that are not verb forms, or are technical names
const ING_OK = new Set([
  "during", "string", "strings", "thing", "things", "something", "anything", "everything", "nothing", "spring",
  "bring", "ring", "king", "ceiling", "settings", "setting",
]);
// technical names that end in "-ing": STE allows them as names
const TECH = ["machine learning", "deep learning", "deep-learning", "signal processing", "hearing loss", "model routing", "environmental monitoring", "embedding"];
const CONTRACTION = /\b(\w+n't|\w+'re|\w+'ve|\w+'ll|\w+'d|i'm|it's|that's|there's|what's|let's|here's)\b/i;

const strip = (s) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"); // [text](url) → text
// split on sentence ends (a project name may start lowercase); decimals ("5.79") stay whole
const sentences = (s) => strip(s).split(/(?<=[.!?])\s+(?=[A-Za-z0-9(])/).map((x) => x.trim()).filter(Boolean);

const out = [];
function check(where, text) {
  for (const s of sentences(text)) {
    const words = s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w));
    if (words.length > MAX_WORDS) out.push(`${where}: ${words.length} words (max ${MAX_WORDS}): "${s.slice(0, 70)}…"`);
    const c = s.match(CONTRACTION);
    if (c) out.push(`${where}: contraction "${c[0]}"`);
    const perfect = s.match(/\b(has|have|had)\s+(not\s+)?(been|\w+ed|run|done|gone|seen|made|built|written|taken|given|shown|known|grown|begun|come)\b/i);
    if (perfect) out.push(`${where}: perfect tense "${perfect[0]}"`);
    if (/\s[—–]\s|;/.test(s)) out.push(`${where}: dash or semicolon between clauses: "${s.slice(0, 70)}…"`);
    const lower = ` ${s.toLowerCase().replace(/[^a-z0-9'\- ]/g, " ")} `;
    for (const b of BANNED) if (lower.includes(` ${b} `)) out.push(`${where}: "${b}" (see the word map)`);
    const named = TECH.reduce((t, n) => t.replace(new RegExp(n, "gi"), ""), s);
    for (const w of named.match(/\b[A-Za-z]+ing\b/g) ?? []) if (!ING_OK.has(w.toLowerCase())) out.push(`${where}: "-ing" form "${w}"`);
  }
}

for (const p of content.code.projects) {
  check(`projects.${p.id}.description`, p.description);
  p.longDescription.split("\n\n").forEach((para, i) => check(`projects.${p.id}.longDescription[${i}]`, para));
  p.highlights.forEach((h, i) => check(`projects.${p.id}.highlights[${i}]`, h));
}
for (const e of content.code.experience) {
  check(`experience.${e.id}.description`, e.description);
  (e.highlights ?? []).forEach((h, i) => check(`experience.${e.id}.highlights[${i}]`, h));
}

for (const line of out) console.warn(`ste  ${line}`);
console.log(`ste-lint: ${out.length} warning${out.length === 1 ? "" : "s"}`);
if (strict && out.length) process.exit(1);
