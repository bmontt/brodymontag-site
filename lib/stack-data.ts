import { content } from "./content";

export interface StackCategory {
  label: string;
  items: string[];
}

export interface ExperienceEntry {
  id: string;
  role: string;
  org: string;
  orgDetail: string;
  period: string;
  tags: string[];
  description: string;
  /** the org's site — the card links its name */
  href?: string;
  /** a few concrete results (inline markdown links allowed) */
  highlights?: string[];
}

// Copy lives in content.json (code.stack / code.experience).
export const stack: StackCategory[] = content.code.stack as unknown as StackCategory[];
export const experience: ExperienceEntry[] = content.code.experience as unknown as ExperienceEntry[];
