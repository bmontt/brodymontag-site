// ── block text ────────────────────────────────────────────────────────────────
// Each block as plain text, for the machine view (/machine, /llms.txt): the
// same facts as the page, with provenance, and nothing that needs a renderer.
// Diagrams print their mermaid source, which is itself readable.

import type { Block, DetailDoc } from "./types";
import { getExcerpt } from "./excerpts";

const plainLinks = (s: string) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 <$2>");

export function blockText(b: Block): string {
  const head = b.caption ? `${b.caption}\n` : "";
  switch (b.type) {
    case "prose":
      return head + plainLinks(b.text);
    case "code": {
      const ex = getExcerpt(b.excerpt);
      return `${head}${ex.at} · ${ex.location}${ex.href ? ` <${ex.href}>` : " · not public"}\n\`\`\`${b.lang}\n${ex.code}\n\`\`\``;
    }
    case "diagram":
      return `${head}${b.alt}\n\`\`\`mermaid\n${b.mermaid.trim()}\n\`\`\``;
    case "figure":
      return `${head}${b.alt}`;
    case "table": {
      const all = [b.columns, ...b.rows];
      const w = b.columns.map((_, i) => Math.max(...all.map((r) => (r[i] ?? "").length)));
      const row = (r: string[]) => r.map((c, i) => (c ?? "").padEnd(w[i])).join("  ").trimEnd();
      const foot = [b.method && `method: ${b.method}`, b.asOf && `as of ${b.asOf}`].filter(Boolean).join(" · ");
      return [head + row(b.columns), ...b.rows.map(row), foot].filter(Boolean).join("\n");
    }
    case "decision":
      return `${head}decision: ${b.title} (${b.status}, ${b.date})\ncontext: ${b.context}\ndecision: ${b.decision}\ncost: ${b.cost.join(" ")}`;
    case "callout":
      return `${head}${b.kind}:\n${b.items.map((i) => `- ${plainLinks(i)}`).join("\n")}`;
    case "commits":
      return `${head}${b.items.map((c) => `${c.date} ${b.repo}@${c.sha.slice(0, 7)} ${c.subject}`).join("\n")}`;
    case "links":
      return `${head}${b.items.map((l) => `- ${l.label} <${l.href}>`).join("\n")}`;
  }
}

export function docText(doc: DetailDoc): string {
  return [
    `updated ${doc.updated}`,
    ...doc.sections.map((s) => `### ${s.heading}\n\n${s.blocks.map(blockText).join("\n\n")}`),
  ].join("\n\n");
}
