// ── timeline-section ──────────────────────────────────────────────────────────
// The chronological coda: every entry (gigs, releases, projects, experience)
// re-surfaced year by year. Server-rendered as a vertical stack of year panels
// (fully accessible / reduced-motion safe); the controller upgrades it to a
// pinned horizontal track under prefers-reduced-motion: no-preference by adding
// `is-horizontal` and scrubbing [data-timeline-track] sideways. The vessel
// evolves its era skin across the same scroll (journey.timelineProgress).

import EntryCard from "@/components/journey/entry-card";
import { groupByYear } from "@/lib/timeline";
import { getChapter } from "@/lib/chapters";

/** entries per year panel: enough to fill a phone screen without overflowing it */
const PER_PANEL = 6;

export default function TimelineSection() {
  const chapter = getChapter("timeline")!;
  const groups = groupByYear(2021);

  return (
    <section
      data-chapter
      id="timeline"
      // the laser layer assembles the road as this rises (lib/director/laser.ts)
      data-laser-anchor="timeline"
      aria-labelledby="timeline-heading"
      className="relative z-20"
      style={{ minHeight: `${chapter.heightVh}svh` }}
    >
      {/* heading — bold white display type like the other chapters, smaller so
          the pinned year track keeps the viewport */}
      <div className="z-20 shrink-0 px-6 pt-10 pb-4 md:px-12 md:pt-14">
        <h2
          id="timeline-heading"
          tabIndex={-1}
          className="mx-auto max-w-5xl font-sans font-medium leading-[0.95] tracking-[-0.04em] text-foreground outline-none"
          style={{ fontSize: "clamp(2rem, 4.5vw, 4rem)" }}
        >
          <span className="sr-only">{chapter.heading.split(" — ")[0]} — </span>
          <span data-display className="block">
            {chapter.heading.split(" — ").pop()}
          </span>
        </h2>
      </div>

      {/* year track — vertical by default, horizontal once `is-horizontal` is set */}
      <div data-timeline-track className="timeline-track px-6 pb-8 md:px-12 md:pb-16">
        {groups.flatMap((g) => {
          // a busy year continues into further panels, PER_PANEL entries each,
          // so every panel fits a screen (the pinned track's travel is measured
          // from its width, so extra panels just lengthen the ride)
          const chunks: (typeof g.entries)[] = [];
          for (let i = 0; i < g.entries.length; i += PER_PANEL) chunks.push(g.entries.slice(i, i + PER_PANEL));
          if (chunks.length === 0) chunks.push([]);
          return chunks.map((entries, ci) => (
            <div
              key={`${g.year}-${ci}`}
              className="timeline-panel flex flex-col justify-center border-l border-white/5 pl-6 md:pl-8"
            >
              {ci === 0 ? (
                <p
                  data-reveal
                  className="mb-4 font-mono text-4xl font-extralight tabular-nums text-iridescent-dim md:mb-6 md:text-6xl"
                >
                  {g.year}
                </p>
              ) : (
                <p data-reveal className="mb-4 font-mono text-xs tabular-nums text-foreground/35 md:mb-6">
                  {g.year}, continued
                </p>
              )}

              {entries.length > 0 ? (
                <div className="flex max-w-md flex-col gap-2 md:gap-3">
                  {entries.map((e) => (
                    <div key={`${e.kind}-${e.id}`} data-reveal>
                      <EntryCard entry={e} compact />
                    </div>
                  ))}
                </div>
              ) : (
                <p data-reveal className="font-mono text-xs text-foreground/25">
                  — quiet year, heads down —
                </p>
              )}
            </div>
          ));
        })}
      </div>
    </section>
  );
}
