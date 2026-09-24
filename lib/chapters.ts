// ── chapters ─────────────────────────────────────────────────────────────────
// The journey is organized by THEME, not by era. Order: hero → code/work →
// music → a horizontal year-by-year timeline (which re-surfaces the full
// catalogue chronologically while the vessel evolves) → epilogue (about /
// contact / presence). Headings are single-sourced from content.json
// `journey.<id>.heading`.
//
// The `kind` distinguishes the standard sticky-frame chapters from the special
// horizontal-scroll timeline section (pinned + scrubbed by the controller).

import { content } from "./content";

export interface Chapter {
  id: string;
  label: string;
  yearLabel: string;
  heading: string;
  heightVh: number;
  kind: "standard" | "timeline";
}

export function getChapter(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

const j = content.journey as Record<string, { heading: string }>;

export const chapters: Chapter[] = [
  {
    id: "hero",
    label: "start",
    yearLabel: "",
    heading: j["hero"].heading,
    heightVh: 100,
    kind: "standard",
  },
  {
    id: "code",
    label: "code",
    yearLabel: "",
    heading: j["code"].heading,
    heightVh: 160,
    kind: "standard",
  },
  {
    id: "music",
    label: "music",
    yearLabel: "",
    heading: j["music"].heading,
    heightVh: 160,
    kind: "standard",
  },
  {
    id: "timeline",
    label: "timeline",
    yearLabel: "2021 — 2026",
    heading: j["timeline"].heading,
    // height drives the pinned horizontal-scroll distance; the controller pins
    // this section and translates the year track across it.
    heightVh: 100,
    kind: "timeline",
  },
  {
    id: "epilogue",
    label: "end",
    yearLabel: "",
    heading: j["epilogue"].heading,
    heightVh: 100,
    kind: "standard",
  },
];

/** Index of the horizontal timeline section (the Vessel overrides its skin). */
export const TIMELINE_INDEX = chapters.findIndex((c) => c.kind === "timeline");
