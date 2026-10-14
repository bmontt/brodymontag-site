// ── chapter ───────────────────────────────────────────────────────────────────
// Server component — no client hooks needed. Renders the structural frame for
// each scrollytelling chapter: a tall section that the controller attaches
// ScrollTriggers to, and a flowing z-20 reading layer that opens with the
// chapter's oversized heading.
//
// data-chapter: selector the controller uses to find all chapter sections.
// id="${id}-heading": focused by TimelineNav click (tabIndex={-1} makes it
//   programmatically focusable without adding it to the tab order).
// heightVh: expressed as `dvh` so iOS viewport shrink doesn't create dead scroll.

interface ChapterProps {
  id: string;
  heading: string;
  yearLabel: string;
  heightVh: number;
  children?: React.ReactNode;
}

/** "the build — systems, models, tools." → "systems, models, tools." */
const displayLine = (heading: string) => heading.split(" — ").pop()!;
const headingPrefix = (heading: string) => (heading.includes(" — ") ? heading.split(" — ")[0] : "");

export default function Chapter({
  id,
  heading,
  yearLabel,
  heightVh,
  children,
}: ChapterProps) {
  // backdrop numeral — the era's year, drifting behind the vessel (z-0)
  const ghostText = yearLabel.match(/\d{4}/g)?.pop();
  const prefix = headingPrefix(heading);

  return (
    <section
      data-chapter
      id={id}
      aria-labelledby={`${id}-heading`}
      className="relative"
      style={{ minHeight: `${heightVh}dvh` }}
    >
      {/* ghost layer — giant year numeral behind the vessel; out of flow (no
          layout impact), sticky so it holds the viewport through the era. The
          controller drifts [data-ghost] horizontally for parallax depth. */}
      {ghostText && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div
            data-ghost
            className="sticky top-0 flex h-dvh items-center justify-center"
          >
            <span
              className="font-mono font-extralight leading-none text-white/[0.02] tabular-nums"
              style={{ fontSize: "clamp(11rem, 40vw, 44rem)" }}
            >
              {ghostText}
            </span>
          </div>
        </div>
      )}
      {/* reading layer — entries flow here; GSAP reveals animate these */}
      <div className="relative z-20 px-6 pb-24 pt-24 md:px-12 md:pt-32">
        {/* heading — the chapter's one oversized typographic moment (bold white
            Neue Haas; docs/design-inspiration.md #6). It scrolls with the
            content (no sticky rail to overlap it). Screen readers get the full
            heading via the visually hidden prefix; [data-display] is what the
            controller splits for the entrance. */}
        <h2
          id={`${id}-heading`}
          tabIndex={-1}
          className="mx-auto mb-16 max-w-5xl font-sans font-medium leading-[0.92] tracking-[-0.045em] text-foreground outline-none md:mb-24"
          style={{ fontSize: "clamp(2.75rem, 9vw, 8.5rem)" }}
        >
          {prefix && <span className="sr-only">{prefix} — </span>}
          <span data-display className="block">
            {displayLine(heading)}
          </span>
        </h2>
        {children}
      </div>
    </section>
  );
}
