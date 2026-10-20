#!/usr/bin/env node
// ── sync-excerpts ─────────────────────────────────────────────────────────────
// Fills content/excerpts.lock.json from the local repos. Each entry names a
// source (repo key, path, line range, pinned commit); this script reads the
// file AT THAT COMMIT with `git show` (never the working tree, which may hold
// uncommitted work), slices the lines, and writes the code and its sha256.
// Runs on the Mac only: the Vercel build never sees the other repos, so it
// checks the lock instead (content/detail/index.ts verifies every sha256).
//
//   node scripts/sync-excerpts.mjs            fill or refresh every entry
//   node scripts/sync-excerpts.mjs --check    verify; warn where the repo's `ref` has drifted
//   node scripts/sync-excerpts.mjs --strict   like --check, but drift fails
//
// To add an excerpt: add `"key": { "source": { repo, path, lines, commit } }`
// to the lock and run the script. It refuses code that looks like a secret.

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const LOCK = `${root}content/excerpts.lock.json`;
const repos = JSON.parse(readFileSync(`${root}content/repos.json`, "utf8"));
const lock = JSON.parse(readFileSync(LOCK, "utf8"));

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const check = strict || args.has("--check");

const SECRETS = [
  /AKIA[0-9A-Z]{16}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\bsk-[A-Za-z0-9_-]{20,}/,
  /\bgh[pousr]_[A-Za-z0-9]{30,}/,
  /\bxox[abprs]-[A-Za-z0-9-]{10,}/,
  /(api[_-]?key|secret|passw(or)?d|token)\s*[:=]\s*["'][^"'\s]{8,}["']/i,
];

const sha256 = (s) => createHash("sha256").update(s).digest("hex");
const git = (dir, ...a) => execFileSync("git", ["-C", dir, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function slice(dir, rev, path, [a, b]) {
  const lines = git(dir, "show", `${rev}:${path}`).split("\n");
  if (b > lines.length) throw new Error(`${path} has ${lines.length} lines, asked for ${a}-${b}`);
  return lines.slice(a - 1, b).join("\n");
}

let failed = 0;
let drifted = 0;
for (const [key, entry] of Object.entries(lock)) {
  if (key.startsWith("_")) continue;
  const { repo, path, lines, commit } = entry.source;
  const r = repos[repo];
  try {
    if (!r) throw new Error(`unknown repo "${repo}" (content/repos.json)`);
    if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error(`commit must be a full 40-char sha, got "${commit}"`);
    const code = slice(r.path, commit, path, lines);
    const hit = SECRETS.find((re) => re.test(code));
    if (hit) throw new Error(`looks like a secret (${hit}); pick other lines`);
    const pushed = r.github ? git(r.path, "branch", "-r", "--contains", commit).trim().length > 0 : false;

    if (check) {
      if (entry.code !== code || entry.sha256 !== sha256(code)) throw new Error("lock does not match the source; run without --check");
      let head;
      const ref = r.ref ?? "HEAD";
      try { head = slice(r.path, ref, path, lines); } catch { head = null; }
      if (head !== code) {
        drifted++;
        console.warn(`drift  ${key}: ${path}:${lines.join("-")} differs at ${ref} (pinned ${commit.slice(0, 7)})`);
      }
    } else {
      lock[key] = { source: entry.source, pushed, sha256: sha256(code), code };
    }
    console.log(`ok     ${key}  ${repo}@${commit.slice(0, 7)} ${path}:${lines.join("-")}${pushed ? "" : "  (not on a public remote: no link)"}`);
  } catch (e) {
    failed++;
    console.error(`FAIL   ${key}: ${e.message.split("\n")[0]}`);
  }
}

if (!check && !failed) writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n");
if (failed || (strict && drifted)) process.exit(1);
