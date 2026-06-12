export interface ReleaseLink {
  platform: string;
  href: string;
}

export interface Release {
  id: string;
  title: string;
  date: string;
  type: "single" | "ep" | "album" | "mix";
  tags: string[];
  links: ReleaseLink[];
  description?: string;
}

import { content } from "./content";

// Copy lives in content.json (music.releases.items); Release stays the typed
// contract. JSON widens the `type` union, so cast through unknown re-narrows.
export const releases: Release[] = content.music.releases.items as unknown as Release[];
