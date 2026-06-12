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
}

import { content } from "./content";

// Copy lives in content.json (code.projects); the Project interface stays the
// typed contract. JSON stores absent githubUrl as null and widens the status
// union, so the cast through unknown re-narrows to Project.
export const projects: Project[] = content.code.projects as unknown as Project[];
