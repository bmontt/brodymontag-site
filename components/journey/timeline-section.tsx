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

export default function TimelineSection() {
  const chapter = getChapter("timeline")!;
  const groups = groupByYear(2021);

  return (
    <section
      data-chapter
      id="timeline"
      aria-labelledby="timeline-heading"
      className="relative"
      style={{ minHeight: `${chapter.heightVh}dvh` }}
    >
      {/* heading rail — stays pinned at the top of the section during scroll */}
      <div className="z-20 shrink-0 px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <h2
            id="timeline-heading"
            tabIndex={-1}
            className="font-mono text-xs uppercase tracking-widest text-iridescent-dim outline-none"
          >
            {chapter.heading}
          </h2>
          <span className="shrink-0 font-mono text-xs tabular-nums text-foreground/30">
            {chapter.yearLabel}
          </span>
        </div>
      </div>

      {/* year track — vertical by default, horizontal once `is-horizontal` is set */}
      <div data-timeline-track className="timeline-track px-6 pb-16 md:px-12">
        {groups.map((g) => (
          <div
            key={g.year}
            className="timeline-panel flex flex-col justify-center border-l border-white/5 pl-6 md:pl-8"
          >
            <p
              data-reveal
              className="mb-6 font-mono text-5xl font-extralight tabular-nums text-iridescent-dim md:text-6xl"
            >
              {g.year}
            </p>

            {g.entries.length > 0 ? (
              <div className="flex max-w-md flex-col gap-3 overflow-y-auto">
                {g.entries.map((e) => (
                  <div key={`${e.kind}-${e.id}`} data-reveal>
                    <EntryCard entry={e} />
                  </div>
                ))}
              </div>
            ) : (
              <p data-reveal className="font-mono text-xs text-foreground/25">
                — quiet year, heads down —
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
