// ── now ───────────────────────────────────────────────────────────────────────
// One live line per half of the site — what's current, from the content source
// (the landing shows them under the choices; each section opener repeats its
// own). Computed at build/render time like the rest of the static site.

import { content } from "./content";
import { projects } from "./projects";
import { getAllEntries, isFuture } from "./timeline";

export interface NowLines {
  software: string;
  music: string;
  about: string;
}

export function nowLines(): NowLines {
  const wip = projects.find((p) => p.status === "wip");
  const shows = getAllEntries().filter((e) => e.kind === "show");
  const next = shows.filter((e) => isFuture(e))[0];
  const last = shows.filter((e) => !isFuture(e)).at(-1);
  const based = content.about.meta.find((m) => m.label === "based")?.value;
  return {
    software: wip ? `building ${wip.name.toLowerCase()}` : `${projects.length} projects`,
    music: next
      ? `next: ${next.title.toLowerCase()} · ${next.date.raw.toLowerCase()}`
      : last
        ? `last: ${last.title.toLowerCase()} · ${last.date.raw.toLowerCase()}`
        : "monty (us)",
    about: based ? `${based.toLowerCase()} based` : "",
  };
}
