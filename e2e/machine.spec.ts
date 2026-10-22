import { expect, test } from "@playwright/test";
import { DOCS } from "../content/detail/docs";
import { blockText } from "../content/detail/text";
import type { Block, DetailDoc } from "../content/detail/types";
import lockJson from "../content/excerpts.lock.json";
import reposJson from "../content/repos.json";

test("/machine is a readable plain-text mirror without JavaScript", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/machine");
  const text = await page.locator("pre").innerText();
  expect(text).toContain("MACHINE-READABLE INDEX");
  expect(text).toContain("## code / projects");
  expect(text).toContain("## music / shows");
  expect(await page.locator("canvas").count()).toBe(0);
  await ctx.close();
});

test("/llms.txt is text/plain in llmstxt.org shape", async ({ request }) => {
  const res = await request.get("/llms.txt");
  expect(res.ok()).toBe(true);
  expect(res.headers()["content-type"]).toContain("text/plain");
  const body = await res.text();
  expect(body).toMatch(/^# .+\n\n> /);
  expect(body).toContain("## Projects");
});

test("every page advertises the text alternate", async ({ page }) => {
  await page.goto("/?tier=2d");
  await expect(page.locator('link[rel="alternate"][type="text/plain"]')).toHaveAttribute("href", /llms\.txt$/);
});

// no switch in the UI: the proxy picks the face per client (lib/agent.ts)
const MIRROR = "MACHINE-READABLE INDEX";
const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0 Safari/537.36";
const cases: [string, Record<string, string>, "human" | "machine" | "text"][] = [
  ["a browser", { "user-agent": CHROME, accept: "text/html,*/*;q=0.8" }, "human"],
  ["Googlebot (no cloaking)", { "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)", accept: "text/html" }, "human"],
  ["a link unfurler", { "user-agent": "Slackbot-LinkExpanding 1.0", accept: "text/html" }, "human"],
  ["ClaudeBot", { "user-agent": "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0)", accept: "text/html" }, "machine"],
  ["ChatGPT-User", { "user-agent": "Mozilla/5.0 (compatible; ChatGPT-User/1.0)", accept: "text/html" }, "machine"],
  ["curl", { "user-agent": "curl/8.7.1", accept: "*/*" }, "text"],
  ["an agent asking for markdown", { "user-agent": CHROME, accept: "text/markdown, text/html;q=0.5" }, "text"],
];
for (const [who, headers, want] of cases) {
  test(`${who} gets the ${want} view`, async ({ request }) => {
    const res = await request.get("/projects/superset", { headers });
    const body = await res.text();
    const type = res.headers()["content-type"];
    if (want === "human") {
      expect(type).toContain("text/html");
      expect(body).not.toContain(MIRROR);
    } else {
      expect(body).toContain(MIRROR);
      expect(type).toContain(want === "text" ? "text/plain" : "text/html");
    }
  });
}

test("?view=human overrides the guess", async ({ request }) => {
  const res = await request.get("/?view=human", { headers: { "user-agent": "curl/8.7.1" } });
  expect(await res.text()).not.toContain(MIRROR);
});

// ── one page as text (/machine/projects/<slug>, /machine/experience/<id>) ─────
// The docs are the ones the site renders (content/detail/docs.ts); each case
// takes the first block of its type, so a new doc or block keeps it honest.

type LockEntry = { source: { repo: string; path: string; lines: [number, number]; commit: string }; pushed: boolean; code: string };
const lock = lockJson as unknown as Record<string, LockEntry>;
const repos = reposJson as unknown as Record<string, { github?: string }>;
const plain = (s: string) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 <$2>");
const textPath = (d: DetailDoc) => `/machine/${d.kind === "project" ? "projects" : "experience"}/${d.key}`;
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** the excerpt's provenance line: repo@sha · path:lines, then a permalink or "not public" */
function provenance(key: string): string {
  const { source: s, pushed } = lock[key];
  const github = repos[s.repo]?.github;
  const at = `${s.repo}@${s.commit.slice(0, 7)} · ${s.path}:${s.lines[0]}-${s.lines[1]}`;
  return github && pushed ? `${at} <https://github.com/${github}/blob/${s.commit}/${s.path}#L${s.lines[0]}-L${s.lines[1]}>` : `${at} · not public`;
}

/** what the text must hold for a block: its facts, and its provenance where it has one */
function expected(b: Block): (string | RegExp)[] {
  switch (b.type) {
    case "prose":
      return [plain(b.text)];
    case "code":
      return [provenance(b.excerpt), "```" + b.lang, lock[b.excerpt].code];
    case "diagram":
      return [b.alt, "```mermaid\n" + b.mermaid.trim() + "\n```"];
    case "figure":
      return [b.alt];
    case "table":
      return [
        new RegExp(b.columns.map(escape).join(" +")),
        new RegExp(b.rows[0].map(escape).join(" +")),
        ...(b.method ? [`method: ${b.method}`] : []),
        ...(b.asOf ? [`as of ${b.asOf}`] : []),
      ];
    case "decision":
      return [`decision: ${b.title} (${b.status}, ${b.date})`, `context: ${b.context}`, `decision: ${b.decision}`, `cost: ${b.cost.join(" ")}`];
    case "callout":
      return [`${b.kind}:\n${b.items.map((i) => `- ${plain(i)}`).join("\n")}`];
    case "commits":
      return b.items.map((c) => `${c.date} ${b.repo}@${c.sha.slice(0, 7)} ${c.subject}`);
    case "links":
      return b.items.map((l) => `- ${l.label} <${l.href}>`);
  }
}

const ALL = DOCS.flatMap((d) => d.sections.flatMap((s) => s.blocks.map((b) => ({ d, b }))));
const TYPES: Block["type"][] = ["prose", "code", "diagram", "figure", "table", "decision", "callout", "commits", "links"];
const CASES: [string, { d: DetailDoc; b: Block } | undefined][] = [
  ...TYPES.map((t) => [`a ${t} block`, ALL.find((x) => x.b.type === t)] as [string, { d: DetailDoc; b: Block } | undefined]),
  // both faces of provenance: a public excerpt links its commit, a private one says so
  ["a code block from a private repo", ALL.find((x) => x.b.type === "code" && !(lock[x.b.excerpt].pushed && repos[lock[x.b.excerpt].source.repo]?.github))],
  ["a code block from a public repo", ALL.find((x) => x.b.type === "code" && lock[x.b.excerpt].pushed && !!repos[lock[x.b.excerpt].source.repo]?.github)],
];
// a type no doc uses yet is checked on a sample block, straight through blockText
const SAMPLES: Partial<Record<Block["type"], Block>> = {
  commits: {
    id: "sample",
    type: "commits",
    repo: "brodymontag-site",
    items: [{ sha: "7ff325c55270ade6b887be00204a41b58cdae50b", date: "2026-10-20", subject: "feat(projects): a detail page for every project, with animated figures" }],
  },
};
for (const t of TYPES) {
  const sample = SAMPLES[t];
  if (!sample || ALL.some((x) => x.b.type === t)) continue;
  test(`blockText prints a ${t} block (no doc has one yet: a sample)`, () => {
    const text = blockText(sample);
    for (const want of expected(sample)) expect(text).toContain(want as string);
  });
}

for (const [what, hit] of CASES) {
  test(`the text view prints ${what}`, async ({ request }) => {
    test.skip(!hit, `no detail doc has ${what} yet`);
    const res = await request.get(textPath(hit!.d));
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/plain");
    const body = await res.text();
    for (const want of expected(hit!.b)) {
      if (typeof want === "string") expect(body).toContain(want);
      else expect(body).toMatch(want);
    }
  });
}

test("each detail doc's text view carries its page header and checked date", async ({ request }) => {
  for (const d of DOCS) {
    const body = await (await request.get(textPath(d))).text();
    expect(body, d.key).toMatch(new RegExp(`^# .+\\n\\nkind \\.+ ${d.kind}\\n`));
    expect(body, d.key).toContain(`checked ....... ${d.updated}`);
    expect(body, d.key).toContain(`## detail\n\nupdated ${d.updated}`);
    for (const s of d.sections) expect(body, d.key).toContain(`### ${s.heading}\n`);
  }
});

test("an unknown page has no text view", async ({ request }) => {
  expect((await request.get("/machine/projects/no-such-project")).status()).toBe(404);
  expect((await request.get("/machine/experience/no-such-role")).status()).toBe(404);
});

test("/machine and /llms.txt link each page's text view", async ({ request }) => {
  const machine = await (await request.get("/machine.txt")).text();
  const llms = await (await request.get("/llms.txt")).text();
  for (const d of DOCS) {
    expect(machine, d.key).toContain(`full page as text: https://brodymontag.com${textPath(d)}`);
    expect(llms, d.key).toContain(`[Full page as text](https://brodymontag.com${textPath(d)})`);
  }
  expect(llms).toContain("## Experience");
});

test("/machine links a text view with a plain anchor (a text file, not a page)", async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto("/machine");
  await expect(page.locator('a[href="/machine/projects/venture"]')).toHaveCount(1);
  await expect(page.locator('a[href="/machine/experience/fiserv"]')).toHaveCount(1);
  await expect(page.locator('a[href="/experience/fiserv"]')).toHaveCount(1);
  await ctx.close();
});

test("an AI agent on a role's page gets the machine view", async ({ request }) => {
  const res = await request.get("/experience/fiserv", { headers: { "user-agent": "Mozilla/5.0 (compatible; ClaudeBot/1.0)", accept: "text/html" } });
  expect(await res.text()).toContain(MIRROR);
});
