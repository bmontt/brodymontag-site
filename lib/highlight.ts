// ── highlight ─────────────────────────────────────────────────────────────────
// Code excerpts are colored at build time by shiki, through a theme of CSS
// variables (--shiki-* in globals.css), so the page ships plain HTML and no
// highlighter. One highlighter per build, shared by every code block.
//
// The HTML is written here from shiki's tokens, as small as it can be: it is
// sent twice on a direct visit (the markup, and the RSC payload inline in the
// page, where every < and " costs extra bytes). One short class per color
// (globals.css .code-block .kw …), no span for text in the foreground color,
// one span for a run of tokens in the same color (whitespace takes any color),
// and attribute values without quotes where HTML allows it.

import "server-only";
import { createCssVariablesTheme, createHighlighter, type Highlighter } from "shiki";

const theme = createCssVariablesTheme({ name: "site", variablePrefix: "--shiki-", fontStyle: false });
const LANGS = ["ts", "tsx", "js", "python", "cpp", "csharp", "yaml", "json", "bash"] as const;

let highlighter: Promise<Highlighter> | null = null;
const get = () => (highlighter ??= createHighlighter({ themes: [theme], langs: [...LANGS] }));

/** token color (a --shiki-token-* variable) → class; a color not here is the foreground */
const CLASS: Record<string, string> = {
  keyword: "kw",
  string: "st",
  "string-expression": "st",
  constant: "cn",
  link: "cn",
  function: "fn",
  comment: "cm",
  punctuation: "pu",
  // parameter: the foreground color (globals.css), so no span
};

const text = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const attr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

/** one line's tokens as HTML: same-colored runs merged, foreground text bare */
function line(tokens: { content: string; color?: string }[]): string {
  const runs: { cls: string; s: string }[] = [];
  for (const t of tokens) {
    const kind = t.color?.match(/^var\(--shiki-token-([\w-]+)\)$/)?.[1];
    const cls = (kind && CLASS[kind]) ?? "";
    if (kind && !(kind in CLASS) && kind !== "parameter") throw new Error(`highlight: no class for token color ${kind}`);
    const last = runs[runs.length - 1];
    if (last && (last.cls === cls || !t.content.trim())) {
      last.s += t.content;
      continue;
    }
    // leading whitespace has no color: it joins the run before, so runs merge more
    const lead = last ? (t.content.match(/^\s+/)?.[0] ?? "") : "";
    if (lead) last!.s += lead;
    runs.push({ cls, s: t.content.slice(lead.length) });
  }
  return runs.map((r) => (r.cls ? `<span class=${r.cls}>${text(r.s)}</span>` : text(r.s))).join("");
}

/**
 * An excerpt as highlighted HTML (a <pre>, one span per line straight under
 * <code>; globals.css styles them as lines). `highlight` takes
 * source line numbers, the same ones the caption shows.
 */
export async function highlight(code: string, lang: string, opts: { firstLine: number; highlight?: number[]; label: string }): Promise<string> {
  const hl = await get();
  const marked = new Set((opts.highlight ?? []).map((n) => n - opts.firstLine + 1));
  const known = (LANGS as readonly string[]).includes(lang);
  const { tokens } = hl.codeToTokens(code, { lang: known ? (lang as (typeof LANGS)[number]) : "text", theme: "site" });
  const lines = tokens.map((t, i) => `<span${marked.has(i + 1) ? " class=highlighted" : ""}>${line(t)}</span>`);
  // a scrollable region needs a name for screen readers, and a tab stop
  return `<pre tabindex=0 role=region aria-label="${attr(opts.label)}"><code>${lines.join("\n")}</code></pre>`;
}
