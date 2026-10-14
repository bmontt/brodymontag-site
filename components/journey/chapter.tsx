// ── chapter ───────────────────────────────────────────────────────────────────
// Server component — no client hooks needed. Renders the structural frame for
// each scrollytelling chapter: a tall section that the controller attaches
// ScrollTriggers to, and a flowing z-20 reading layer that opens with the
// chapter's oversized heading. `figure` splits the reading layer into text +
// a gutter the chapter's laser figure lives in (lib/laser-anchors.ts).
//
// data-chapter: selector the controller uses to find all chapter sections.
// id="${id}-heading": a focus target for in-page links (tabIndex={-1} makes it
//   programmatically focusable without adding it to the tab order).
// heightVh: expressed as `dvh` so iOS viewport shrink doesn't create dead scroll.

import { ViewTransition } from "react";

/** a section page's opening screen (the chapter starts with it) */
export interface Opener {
  /** "01" — the section's place in the site */
  index: string;
  /** the section's name — the word picked on the landing, which morphs into this */
  title: string;
  /** text tone class: "text-foreground" (tech), "text-shimmer" (sound), "text-blend" */
  tone: string;
  /** a live line: what's current in this half */
  now?: string;
}

interface ChapterProps {
  id: string;
  heading: string;
  yearLabel: string;
  heightVh: number;
  /** reserve a right-hand gutter for the chapter's laser figure (desktop) */
  figure?: boolean;
  /** open the chapter with a full screen: index, title (h1), the heading line, now */
  opener?: Opener;
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
  figure = false,
  opener,
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
      {opener && (
        // the opening screen — the laser layer frames it ([data-laser-anchor=
        // "opener"]: the figure starts large here, then settles into the gutter)
        <div data-laser-anchor="opener" className="relative z-20 flex min-h-dvh flex-col justify-center px-6 pt-20 md:px-12">
          <div className="mx-auto w-full max-w-6xl">
            <p className="mb-6 font-mono text-xs text-foreground/40">
              {opener.index} <span className="text-foreground/20">/</span> {opener.title}
            </p>
            <ViewTransition name={`title-${id}`} share="morph" default="none">
              <h1
                className={`inline-block font-sans font-medium leading-[0.88] tracking-[-0.05em] ${opener.tone}`}
                style={{ fontSize: "clamp(3.5rem, 13vw, 12rem)" }}
              >
                {opener.title}
              </h1>
            </ViewTransition>
            <h2
              id={`${id}-heading`}
              tabIndex={-1}
              className="mt-8 max-w-3xl font-sans font-light leading-[1.05] tracking-[-0.03em] text-foreground/80 outline-none"
              style={{ fontSize: "clamp(1.6rem, 3.6vw, 3rem)" }}
            >
              {prefix && <span className="sr-only">{prefix} — </span>}
              <span data-display className="block">
                {displayLine(heading)}
              </span>
            </h2>
            {figure && <div aria-hidden="true" data-laser-anchor={`${id}-rule`} className="mt-10 h-8 w-full" />}
            {opener.now && <p className="mt-6 font-mono text-xs text-foreground/45">{opener.now}</p>}
          </div>
          <p aria-hidden="true" className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-xs text-foreground/30">
            scroll ↓
          </p>
        </div>
      )}
      {/* reading layer — entries flow here; GSAP reveals animate these */}
      <div className={`relative z-20 px-6 pb-24 md:px-12 ${opener ? "pt-16" : "pt-24 md:pt-32"}`}>
        {!opener && (
          <>
            {/* heading — the chapter's one oversized typographic moment (bold
                white Neue Haas). Screen readers get the full heading via the
                visually hidden prefix; [data-display] is what the controller
                splits for the entrance. */}
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
            {figure && <div aria-hidden="true" data-laser-anchor={`${id}-rule`} className="mx-auto -mt-8 mb-14 h-8 max-w-6xl md:-mt-14 md:mb-20" />}
          </>
        )}
        {figure ? (
          // text on the left, the figure's gutter on the right: the laser
          // director holds the chapter's figure inside [data-laser-anchor]
          // (sticky within it), so beams and text share the page instead of
          // stacking. Phones get one column; the figure floats free there.
          <div className="mx-auto max-w-6xl md:grid md:grid-cols-[minmax(0,1fr)_clamp(220px,30vw,440px)] md:gap-x-12">
            <div className="min-w-0">{children}</div>
            <div aria-hidden="true" data-laser-anchor={id} className="hidden md:block" />
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
