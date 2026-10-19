// ── highlight ─────────────────────────────────────────────────────────────────
// Code excerpts are colored at build time by shiki, through a theme of CSS
// variables (--shiki-* in globals.css), so the page ships plain HTML and no
// highlighter. One highlighter per build, shared by every code block.

import "server-only";
import { createCssVariablesTheme, createHighlighter, type Highlighter, type ShikiTransformer } from "shiki";

const theme = createCssVariablesTheme({ name: "site", variablePrefix: "--shiki-", fontStyle: false });
const LANGS = ["ts", "tsx", "js", "python", "cpp", "csharp", "yaml", "json", "bash"] as const;

let highlighter: Promise<Highlighter> | null = null;
const get = () => (highlighter ??= createHighlighter({ themes: [theme], langs: [...LANGS] }));

/**
 * An excerpt as highlighted HTML (a <pre> of `.line` spans). `highlight` takes
 * source line numbers, the same ones the caption shows.
 */
export async function highlight(code: string, lang: string, opts: { firstLine: number; highlight?: number[]; label: string }): Promise<string> {
  const hl = await get();
  const marked = new Set((opts.highlight ?? []).map((n) => n - opts.firstLine + 1));
  const transformer: ShikiTransformer = {
    pre(node) {
      // a scrollable region needs a name for screen readers (tabindex is shiki's)
      node.properties.role = "region";
      node.properties["aria-label"] = opts.label;
    },
    line(node, line) {
      if (marked.has(line)) this.addClassToHast(node, "highlighted");
    },
    // a short class per token kind in place of an inline style on every span
    // (globals.css .tk-*): fewer bytes in the HTML and in the RSC payload
    span(node) {
      const style = String(node.properties.style ?? "");
      const kind = style.match(/^color:var\(--shiki-token-([\w-]+)\)$/)?.[1];
      if (kind) {
        delete node.properties.style;
        this.addClassToHast(node, `tk-${kind}`);
      } else if (style === "color:var(--shiki-foreground)") delete node.properties.style;
    },
  };
  return hl.codeToHtml(code, { lang: (LANGS as readonly string[]).includes(lang) ? lang : "text", theme: "site", transformers: [transformer] });
}
