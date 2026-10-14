export interface ProjectHighlight {
  text: string;
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  status: "live" | "wip";
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
// union, so the cast through unknown re-narrows to Project.
export const projects: Project[] = content.code.projects as unknown as Project[];
