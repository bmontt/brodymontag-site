export interface ProjectHighlight {
  text: string;
}

/**
 * One word for where a project stands (docs/portfolio-style-plan.md §3).
 * Pick the first that is true, top to bottom.
 */
export type ProjectStatus = "concept" | "building" | "active" | "paused" | "finished" | "archived";

export const STATUS_MEANING: Record<ProjectStatus, string> = {
  concept: "Design only. No working code and no hardware.",
  building: "Work in progress, changed in the last 60 days. Not ready for other people.",
  active: "It works. I use it or change it. Changed in the last 90 days.",
  paused: "I stopped for now. I plan to continue.",
  finished: "It is done and it works. I fix only bugs.",
  archived: "I stopped. I do not plan to continue. I keep it as a record.",
};

/** still moving (the accent pill, a tall pillar on the stage) or at rest */
export const isMoving = (s: ProjectStatus) => s === "concept" || s === "building" || s === "active";

/** "paused since 2026-10-01" (or the word alone when it has no date) */
export const statusLine = (p: Pick<Project, "status" | "statusSince">) => (p.statusSince ? `${p.status} since ${p.statusSince}` : p.status);

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  status: ProjectStatus;
  /** YYYY-MM-DD the status began (required for paused / finished / archived) */
  statusSince?: string;
  /** why, in a few words: "hardware not built" */
  statusNote?: string;
  /** YYYY-MM-DD: the day the facts on this project were last checked */
  updated: string;
  // detail-page fields
  longDescription: string;
  highlights: string[];
  /** live figures (a dated snapshot): shown on the card and the detail page */
  stats?: { label: string; value: string; note?: string }[];
  /** a small mark beside the name (public/icons) */
  icon?: string;
  statsAsOf?: string;
}

import { content } from "./content";

// Copy lives in content.json (code.projects); the Project interface stays the
// typed contract. JSON stores absent githubUrl as null and widens the status
// union, so the cast through unknown re-narrows to Project. A status at rest
// must say since when; the check runs at build, when this module loads.
export const projects: Project[] = content.code.projects as unknown as Project[];
for (const p of projects) {
  if (!(p.status in STATUS_MEANING)) throw new Error(`project ${p.id}: unknown status "${p.status}"`);
  if (!isMoving(p.status) && !p.statusSince) throw new Error(`project ${p.id}: "${p.status}" needs statusSince`);
}
