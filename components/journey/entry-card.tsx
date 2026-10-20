// ── entry-card ────────────────────────────────────────────────────────────────
// Server dispatcher: maps a unified TimelineEntry to its kind-specific card.
// `entry.source` is the raw content.json record (full object), so each cast is
// safe at runtime — timeline.ts only narrows the *view* for parsing, never the
// underlying data.
import ShowCard from "@/components/cards/show-card";
import ReleaseCard from "@/components/cards/release-card";
import ProjectCard from "@/components/cards/project-card";
import ExperienceCard from "@/components/cards/experience-card";
import type { TimelineEntry } from "@/lib/timeline";
import type { Event } from "@/lib/brody-events";
import type { Release } from "@/lib/releases-data";
import type { Project } from "@/lib/projects";
import type { ExperienceEntry } from "@/lib/stack-data";
import Link from "next/link";

/** the timeline's row: kind, title and one line, linking to the full page */
function CompactEntry({ entry }: { entry: TimelineEntry }) {
  const src = entry.source as Partial<Event & Release & Project & ExperienceEntry>;
  const [kind, line, href] =
    entry.kind === "show" ? ["show", src.description, entry.href]
    : entry.kind === "release" ? [src.type ?? "release", src.tags?.join(" · "), src.links?.[0]?.href]
    : entry.kind === "project" ? [src.status ? `project · ${src.status}` : "project", src.tags?.join(" · "), entry.href]
    : ["role", `${src.org} · ${src.period}`, src.href];
  const body = (
    <>
      <span className="font-mono text-2xs text-foreground/55">{kind}</span>
      <span className="mt-0.5 block font-sans text-[16.5px] font-medium leading-snug text-foreground/90">{entry.title}</span>
      {line && <span className="mt-0.5 block truncate font-mono text-2xs text-foreground/60">{line}</span>}
    </>
  );
  const cls = "block border-l border-white/10 py-1 pl-3 transition-colors hover:border-white/40";
  if (!href) return <div className={cls}>{body}</div>;
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>{body}</Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{body}</a>
  );
}

export default function EntryCard({ entry, compact = false }: { entry: TimelineEntry; compact?: boolean }) {
  if (compact) return <CompactEntry entry={entry} />;
  switch (entry.kind) {
    case "show":
      return <ShowCard event={entry.source as Event} />;
    case "release":
      return <ReleaseCard release={entry.source as Release} />;
    case "project":
      return <ProjectCard project={entry.source as Project} />;
    case "experience":
      return <ExperienceCard entry={entry.source as ExperienceEntry} />;
  }
}
