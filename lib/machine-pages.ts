// ── machine pages ─────────────────────────────────────────────────────────────
// One page of the site as plain text (/machine/projects/<slug>,
// /machine/experience/<id>): the same card copy as the human page, then its
// detail doc block by block (content/detail/text.ts), with the status, dates,
// evidence kinds and excerpt provenance (plan §8). Server only: the detail
// docs never reach the client. lib/machine.ts (the index) links here.

import "server-only";
import { getDetail } from "@/content/detail";
import { docText } from "@/content/detail/text";
import { ORIGIN, dots, experienceTextPath, plainLinks, projectTextPath } from "./machine";
import { projects, statusLine } from "./projects";
import { experience } from "./stack-data";

const foot = (path: string) =>
  `-- end of page · this page as text: ${ORIGIN}${path} · index: ${ORIGIN}/machine · summary: ${ORIGIN}/llms.txt`;

/** a project page as text, or undefined for an unknown slug */
export function projectText(slug: string): string | undefined {
  const p = projects.find((x) => x.slug === slug);
  if (!p) return undefined;
  const detail = getDetail("project", p.slug);
  const L = [
    `# ${p.name}`,
    "",
    dots("kind") + "project",
    dots("status") + statusLine(p) + (p.statusNote ? ` · ${p.statusNote}` : ""),
    dots("checked") + (detail?.updated ?? p.updated),
    dots("stack") + p.tags.map((t) => t.toLowerCase()).join(" · "),
    dots("source") + (p.githubUrl ?? "private repo"),
    dots("page") + `${ORIGIN}/projects/${p.slug}`,
    "",
    p.description,
    "",
    ...p.longDescription.split("\n\n").flatMap((para) => [para, ""]),
  ];
  if (p.stats) {
    L.push(`## results${p.statsAsOf ? ` (as of ${p.statsAsOf})` : ""}`, "");
    for (const s of p.stats) L.push(`- ${s.label}: ${s.value}${s.note ? ` (${s.note})` : ""}`);
    L.push("");
  }
  L.push("## highlights", "", ...p.highlights.map((h) => `- ${plainLinks(h)}`), "");
  if (detail) L.push("## detail", "", docText(detail), "");
  L.push(foot(projectTextPath(p.slug)));
  return L.join("\n") + "\n";
}

/** an experience page as text, or undefined for an unknown id */
export function experienceText(id: string): string | undefined {
  const e = experience.find((x) => x.id === id);
  if (!e) return undefined;
  const detail = getDetail("experience", e.id);
  const L = [
    `# ${e.org}`,
    "",
    dots("kind") + "experience",
    dots("role") + e.role,
    dots("org") + `${e.org} · ${e.orgDetail}${e.href ? `  ↗ ${e.href}` : ""}`,
    dots("period") + e.period,
    ...(detail ? [dots("checked") + detail.updated] : []),
    dots("stack") + e.tags.join(" · "),
    dots("page") + `${ORIGIN}/experience/${e.id}`,
    "",
    plainLinks(e.description),
    "",
  ];
  if (e.highlights?.length) L.push("## my part", "", ...e.highlights.map((h) => `- ${plainLinks(h)}`), "");
  if (detail) L.push("## detail", "", docText(detail), "");
  L.push(foot(experienceTextPath(e.id)));
  return L.join("\n") + "\n";
}
