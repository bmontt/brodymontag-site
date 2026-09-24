// ── chapter ───────────────────────────────────────────────────────────────────
// Server component — no client hooks needed. Renders the structural frame for
// each scrollytelling chapter: a tall section that the controller attaches
// ScrollTriggers to, a sticky heading rail, and a flowing z-20 reading layer for
// entry children.
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

export default function Chapter({
  id,
  heading,
  yearLabel,
  heightVh,
  children,
}: ChapterProps) {
  // backdrop numeral — the era's year, drifting behind the vessel (z-0)
  const ghostText = yearLabel.match(/\d{4}/g)?.pop();

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
      {/* sticky heading rail — stays at top of viewport while section scrolls */}
      <div className="sticky top-0 z-20 bg-background/60 backdrop-blur-sm px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-6">
          <h2
            id={`${id}-heading`}
            tabIndex={-1}
            className="font-mono text-xs tracking-widest text-iridescent-dim uppercase outline-none"
          >
            {heading}
          </h2>
          {yearLabel && (
            <span className="font-mono text-xs text-foreground/30 tabular-nums shrink-0">
              {yearLabel}
            </span>
          )}
        </div>
      </div>

      {/* reading layer — entries flow here; GSAP reveals animate these */}
      <div className="relative z-20 px-6 pb-24 pt-8 md:px-12">
        {children}
      </div>
    </section>
  );
}
