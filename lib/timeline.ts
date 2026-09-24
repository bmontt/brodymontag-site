// ── timeline ──────────────────────────────────────────────────────────────────
// Unified chronological timeline for the scrollytelling journey.
//
// Resolves entries from all four sources (shows, releases, projects, experience)
// by id, parses heterogeneous date strings into a common shape, and provides
// getChapterEntries() for chapter-scoped rendering.
//
// FUTURE-EVENT GUARD
// ------------------
// Routing is EXPLICIT: chapters.ts owns which ids appear in which chapter, so
// there is no algorithmic bucketing to guard against. The guard's remaining job:
// if a future-dated entry (sortKey > now's sortKey) appears in a chapter whose
// yearLabel is strictly in the past, it is skipped and a console.warn is emitted.
// The `now` chapter (yearLabel "2026") intentionally carries event_afterdark
// (August 2026) — isFuture(entry) === true — so callers can render it as
// "next up" rather than a past event. Use isFuture() in the rendering layer.
//
// sortKey encoding: year*100 + (month ?? 0). Month-unknown entries sort to the
// start of their year (month=0). Period entries (experience) use the start year;
// endDate captures the end. "present" end → endDate is undefined.

import { content } from "./content";

// ── types ─────────────────────────────────────────────────────────────────────

export type EntryKind = "show" | "release" | "project" | "experience";

export interface ParsedDate {
  year: number;
  month?: number;
}

export interface TimelineEntry {
  kind: EntryKind;
  id: string;
  sortKey: number;
  date: { year: number; month?: number; raw: string };
  endDate?: { year: number; month?: number; raw: string };
  title: string;
  href?: string;
  source: unknown;
}

// ── date parser ───────────────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

interface PeriodResult {
  start: ParsedDate;
  end?: ParsedDate;    // undefined means "present"
  isPresent: boolean;
}

// parseDate: handles "September 2025", "oct 2025", "2024", "April 2025".
export function parseDate(raw: string): ParsedDate {
  const s = raw.trim();
  const parts = s.split(/\s+/);
  if (parts.length === 2) {
    const maybeMonth = MONTH_MAP[parts[0].toLowerCase()];
    const maybeYear = parseInt(parts[1], 10);
    if (maybeMonth && !isNaN(maybeYear)) {
      return { year: maybeYear, month: maybeMonth };
    }
  }
  // bare year
  const year = parseInt(s, 10);
  if (!isNaN(year)) return { year };
  throw new Error(`timeline: cannot parse date "${raw}"`);
}

// parsePeriod: handles "2021 — 2025", "2025 — present".
// The EM-DASH separator is " — " (space + U+2014 + space).
export function parsePeriod(raw: string): PeriodResult {
  const EM = " — ";
  const idx = raw.indexOf(EM);
  if (idx === -1) throw new Error(`timeline: cannot parse period "${raw}"`);
  const startStr = raw.slice(0, idx).trim();
  const endStr = raw.slice(idx + EM.length).trim();
  const start = parseDate(startStr);
  const isPresent = endStr.toLowerCase() === "present";
  const end = isPresent ? undefined : parseDate(endStr);
  return { start, end, isPresent };
}

// sortKey encoding: year*100 + (month ?? 0).
export function toSortKey(d: ParsedDate): number {
  return d.year * 100 + (d.month ?? 0);
}

// ── future-event guard ────────────────────────────────────────────────────────

// isFuture: true when the entry's date is strictly after `now`.
// Uses sortKey comparison: nowKey = year*100 + month (1-based).
export function isFuture(entry: TimelineEntry, now: Date = new Date()): boolean {
  const nowKey = now.getFullYear() * 100 + (now.getMonth() + 1);
  return entry.sortKey > nowKey;
}

// ── source maps ──────────────────────────────────────────────────────────────

type ShowRecord      = { id: string; slug: string; title: string; date: string };
type ReleaseRecord   = { id: string; title: string; date: string };
type ProjectRecord   = { id: string; slug: string; name: string; date?: string; status: string };
type ExperienceRecord = { id: string; role: string; period: string };

const showMap      = new Map<string, ShowRecord>();
const releaseMap   = new Map<string, ReleaseRecord>();
const projectMap   = new Map<string, ProjectRecord>();
const experienceMap = new Map<string, ExperienceRecord>();

for (const s of content.music.shows.events as unknown as ShowRecord[]) {
  showMap.set(s.id, s);
}
for (const r of content.music.releases.items as unknown as ReleaseRecord[]) {
  releaseMap.set(r.id, r);
}
for (const p of content.code.projects as unknown as ProjectRecord[]) {
  projectMap.set(p.id, p);
}
for (const e of content.code.experience as unknown as ExperienceRecord[]) {
  experienceMap.set(e.id, e);
}

// ── entry builders ────────────────────────────────────────────────────────────

function buildShow(id: string): TimelineEntry | null {
  const s = showMap.get(id);
  if (!s) return null;
  const d = parseDate(s.date);
  return {
    kind: "show",
    id: s.id,
    sortKey: toSortKey(d),
    date: { ...d, raw: s.date },
    title: s.title,
    href: `/shows/${s.slug}`,
    source: s,
  };
}

function buildRelease(id: string): TimelineEntry | null {
  const r = releaseMap.get(id);
  if (!r) return null;
  const d = parseDate(r.date);
  return {
    kind: "release",
    id: r.id,
    sortKey: toSortKey(d),
    date: { ...d, raw: r.date },
    title: r.title,
    source: r,
  };
}

function buildProject(id: string): TimelineEntry | null {
  const p = projectMap.get(id);
  if (!p) return null;
  const rawDate = p.date ?? "";
  if (!rawDate) {
    // project has no date; sort to 0 (top of list)
    return {
      kind: "project",
      id: p.id,
      sortKey: 0,
      date: { year: 0, raw: "" },
      title: p.name,
      href: `/projects/${p.slug}`,
      source: p,
    };
  }
  const d = parseDate(rawDate);
  return {
    kind: "project",
    id: p.id,
    sortKey: toSortKey(d),
    date: { ...d, raw: rawDate },
    title: p.name,
    href: `/projects/${p.slug}`,
    source: p,
  };
}

function buildExperience(id: string): TimelineEntry | null {
  const e = experienceMap.get(id);
  if (!e) return null;
  const { start, end, isPresent } = parsePeriod(e.period);
  const endField = isPresent || !end ? undefined : { ...end, raw: e.period };
  return {
    kind: "experience",
    id: e.id,
    sortKey: toSortKey(start),
    date: { ...start, raw: e.period },
    endDate: endField,
    title: e.role,
    source: e,
  };
}

// ── aggregate accessors ─────────────────────────────────────────────────────────

// Every entry across all four sources, chronologically sorted. Used by the
// horizontal year-by-year timeline, which re-surfaces the full catalogue.
export function getAllEntries(): TimelineEntry[] {
  const out: TimelineEntry[] = [];
  for (const id of showMap.keys())       { const e = buildShow(id);       if (e) out.push(e); }
  for (const id of releaseMap.keys())    { const e = buildRelease(id);    if (e) out.push(e); }
  for (const id of projectMap.keys())    { const e = buildProject(id);    if (e) out.push(e); }
  for (const id of experienceMap.keys()) { const e = buildExperience(id); if (e) out.push(e); }
  return out.sort((a, b) => a.sortKey - b.sortKey);
}

export interface YearGroup {
  year: number;
  entries: TimelineEntry[];
}

// Entries bucketed into a contiguous year range (sparse years kept as quiet
// panels so the horizontal track reads as a continuous chronology). Experience
// spans bucket at their start year; future-dated entries land in their real year.
export function groupByYear(minYear = 2021, maxYear?: number): YearGroup[] {
  const all = getAllEntries();
  const max =
    maxYear ?? Math.max(new Date().getFullYear(), ...all.map((e) => e.date.year));
  const groups: YearGroup[] = [];
  for (let y = minYear; y <= max; y++) {
    groups.push({ year: y, entries: all.filter((e) => e.date.year === y) });
  }
  return groups;
}
