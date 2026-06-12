export interface EventMedia {
  type: "image" | "video";
  src: string;
  poster?: string;
}

export interface EventLink {
  label: string;
  href: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  description: string;
  media: EventMedia[];
  // detail-page fields
  venue: string;
  city: string;
  format: string;
  headliners?: string[];
  promoter?: string;
  promoterUrl?: string;
  context: string;
  setlistNote?: string;
  links?: EventLink[];
}

import { content } from "./content";

// Copy lives in content.json (music.shows.events); interfaces above stay the
// typed contract. JSON widens string-literal unions (e.g. media.type), so the
// cast through unknown re-narrows to the Event shape.
export const events: Event[] = content.music.shows.events as unknown as Event[];
