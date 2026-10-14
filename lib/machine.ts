// ── machine ───────────────────────────────────────────────────────────────────
// The machine-readable face of the site (/machine, /llms.txt): every project,
// show, release and paragraph as plain text, generated from content.json so it
// can never drift from the human site. No canvas; readable without JavaScript — for agents, crawlers,
// terminals, and anyone who prefers text.

import { content } from "./content";
import { projects } from "./projects";
import { experience, stack } from "./stack-data";
import { releases } from "./releases-data";
import { events } from "./brody-events";

const ORIGIN = `https://${content.meta.domain}`;

// ── banner: a small original block font (5 rows) ─────────────────────────────
const FONT: Record<string, string[]> = {
  A: [" ███ ", "█   █", "█████", "█   █", "█   █"],
  B: ["████ ", "█   █", "████ ", "█   █", "████ "],
  D: ["████ ", "█   █", "█   █", "█   █", "████ "],
  G: [" ███ ", "█    ", "█  ██", "█   █", " ███ "],
  M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
  N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
  O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
  R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
  T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
  Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
  " ": ["  ", "  ", "  ", "  ", "  "],
};
export function banner(word: string): string {
  const letters = [...word.toUpperCase()].map((c) => FONT[c] ?? FONT[" "]);
  return Array.from({ length: 5 }, (_, r) => letters.map((g) => g[r]).join(" ")).join("\n");
}

/** [text](url) → text <url> */
const plainLinks = (s: string) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 <$2>");
const dots = (label: string, width = 14) => `${label} ${".".repeat(Math.max(2, width - label.length))} `;

/** The full plain-text mirror shown at /machine. */
export function machineText(): string {
  const L: string[] = [];
  const push = (...xs: string[]) => L.push(...xs);
  const c = content;

  push(banner(c.meta.name), "");
  push(`${c.meta.domain.toUpperCase()} :: MACHINE-READABLE INDEX`);
  push(`# plain-text mirror of ${c.meta.domain} — same content, no canvas, readable without javascript.`);
  push(`# generated from the site's content source at build time. summary for llms: /llms.txt`);
  push("");

  push("## identity");
  push(dots("name") + c.hero.name.toLowerCase());
  push(dots("also") + "monty (us)");
  for (const { label, value } of c.about.meta) if (label) push(dots(label) + value);
  push(dots("in his words") + c.journey.epilogue.heading);
  push("", "## summary", c.hero.elevatorPitch, "");

  push("## code / projects");
  for (const p of projects) {
    push(`- ${p.name}  [${p.tags.join(" · ")}]${p.status === "wip" ? "  (in progress)" : ""}`);
    push(`  ${p.description}`);
    push(`  → ${ORIGIN}/projects/${p.slug}${p.githubUrl ? `   ↗ ${p.githubUrl}` : ""}`);
  }
  push("", "## code / experience");
  for (const e of experience) {
    push(`- ${e.role} @ ${e.org} (${e.orgDetail}) · ${e.period}`);
    push(`  ${e.description}`);
  }
  push("", "## code / stack");
  for (const s of stack) push(dots(s.label) + s.items.join(", "));

  push("", "## music / shows");
  for (const e of events) push(`- ${e.date} · ${e.title} — ${e.description}   → ${ORIGIN}/shows/${e.slug}`);
  push(`  supported: ${c.music.shows.supportedArtists.map((a) => a.name).join(", ")}`);
  push("", "## music / releases");
  for (const r of releases) {
    push(`- ${r.title} · ${r.type} · ${r.date}  [${r.tags.join(" · ")}]`);
    for (const l of r.links) push(`  ${l.platform}: ${l.href}`);
  }
  push("", "## music / collective");
  push(`${c.music.collective.name} — ${c.music.collective.scene}`);
  for (const m of c.music.collective.meta) push(dots(m.label) + m.value);

  push("", "## about");
  for (const p of c.about.paragraphs) push(plainLinks(p), "");
  push("## contact");
  for (const i of c.contact.items) push(dots(i.label) + i.value);
  push("", "## presence");
  for (const s of c.about.socials) push(dots(s.label) + s.href);
  push("", `-- end of index · ${c.meta.copyright} · human view: ${ORIGIN}/`);
  return L.join("\n");
}

/** llms.txt (llmstxt.org): a short, link-first summary for language models. */
export function llmsText(): string {
  const c = content;
  const L: string[] = [];
  L.push(`# ${c.meta.name}`, "", `> ${c.hero.elevatorPitch}`, "");
  L.push(`${c.meta.name} is a ${c.hero.subtitle}.`, "");
  L.push("## Projects");
  for (const p of projects) L.push(`- [${p.name}](${ORIGIN}/projects/${p.slug}): ${p.description}`);
  L.push("", "## Shows");
  for (const e of events) L.push(`- [${e.title}](${ORIGIN}/shows/${e.slug}): ${e.date} — ${e.description}`);
  L.push("", "## Music");
  for (const r of releases) L.push(`- [${r.title}](${r.links[0]?.href ?? ORIGIN}): ${r.type}, ${r.date}`);
  L.push("", "## Contact");
  for (const i of c.contact.items) L.push(`- ${i.label}: ${i.value}`);
  L.push("", "## Optional", `- [Machine-readable mirror](${ORIGIN}/machine): the whole site as plain text`);
  return L.join("\n") + "\n";
}
