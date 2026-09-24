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

export default function EntryCard({ entry }: { entry: TimelineEntry }) {
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
