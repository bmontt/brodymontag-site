// ── timeline-nav ──────────────────────────────────────────────────────────────
// Fixed right-edge vertical rail. z-50. Hidden on mobile (hidden md:flex).
//
// Active chapter: useSyncExternalStore on journey.subscribe/getSnapshot.
// Re-renders ONLY on discrete chapter changes (~6/scroll total). Correct.
//
// Progress thread: driven by the CSS var --journey-progress that
// JourneyController writes on the global ScrollTrigger's onUpdate. The thread
// element uses `style={{ height: "calc(var(--journey-progress, 0) * 100%)" }}`
// so it fills purely via CSS — no React state, no rAF, no per-frame re-render.
//
// Mobile: hidden on <md via `hidden md:flex`. Collapses to nothing on small
// screens keeping mobile layout clean — keyboard/focus still works via headings.

"use client";

import { useSyncExternalStore } from "react";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";

export default function TimelineNav() {
  // re-renders only on discrete chapter index change
  const activeIndex = useSyncExternalStore(
    journey.subscribe,
    journey.getSnapshot,
    journey.getServerSnapshot,
  );

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    // focus the chapter heading for a11y (tabIndex={-1} on chapter headings)
    // hero uses id="hero" section directly; its heading id would be "hero-heading"
    const headingEl = document.getElementById(`${id}-heading`);
    if (headingEl) {
      headingEl.focus({ preventScroll: true });
    }
    // graceful fallback: focus the section itself if no heading element found
  }

  return (
    <nav
      aria-label="timeline"
      className="hidden md:flex fixed right-6 top-1/2 z-50 -translate-y-1/2 flex-col items-center gap-0"
    >
      {/* progress thread — fills via CSS var, no React re-render per frame */}
      <div className="relative flex flex-col items-center">
        {/* background track */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-white/8" />
        {/* filled thread driven by --journey-progress CSS var */}
        <div
          className="absolute left-1/2 top-0 w-px -translate-x-1/2 bg-accent/50 origin-top"
          style={{ height: "calc(var(--journey-progress, 0) * 100%)" }}
        />

        {/* chapter ticks */}
        <div className="relative flex flex-col items-center gap-8 py-2">
          {chapters.map((chapter, i) => {
            const isActive = activeIndex === i;
            return (
              <button
                key={chapter.id}
                onClick={() => scrollTo(chapter.id)}
                aria-current={isActive ? "true" : undefined}
                aria-label={chapter.label}
                className="group flex flex-col items-center gap-1"
              >
                {/* tick dot */}
                <span
                  className={`block h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-accent scale-125"
                      : "bg-white/20 group-hover:bg-white/45"
                  }`}
                />
                {/* year label — only show if non-empty */}
                {chapter.yearLabel && (
                  <span
                    className={`font-mono text-[0.55rem] leading-none tabular-nums transition-colors duration-300 ${
                      isActive
                        ? "text-accent"
                        : "text-foreground/25 group-hover:text-foreground/50"
                    }`}
                  >
                    {/* show the last year only for ranges to keep rail compact */}
                    {chapter.yearLabel.includes("—")
                      ? chapter.yearLabel.split("—").pop()?.trim()
                      : chapter.yearLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
