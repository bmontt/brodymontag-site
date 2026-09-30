"use client";

// ── journey-controller ────────────────────────────────────────────────────────
// Single source of truth for scroll→store state. Registers:
//   1. one global #journey trigger that, each frame, derives which chapter we're
//      in and the cross-chapter blend from precomputed boundary offsets, writes
//      them to the journey store + a --journey-progress CSS var, and gently
//      snaps onto a chapter start when the reader stops near one (desktop only).
//      It refreshes last (refreshPriority -1) so its range and the chapter
//      bounds include the timeline pin's spacer.
//   2. one scrubbed reveal timeline per chapter ([data-reveal] autoAlpha + y).
//
// Why a single writer: per-chapter progress triggers overlap (a chapter is
// "active" from top-bottom to bottom-top), so multiple fire each frame and race
// to write blend state. Deriving everything from one global progress value
// against measured boundaries is deterministic and race-free.
//
// Blend convention (consumed by the Vessel as lerpSkin(from, to, t)):
//   exit band  (local > 0.85, segment i): setBlend(i, i+1, (local-0.85)/0.15)
//   entry band (local < 0.15, segment i): setBlend(i, i-1, (0.15-local)/0.15)
//   mid-chapter: setBlend(i, i, 0)
//
// Reduced motion: registers ZERO ScrollTriggers and never hides content. An
// IntersectionObserver sets chapterIndex so the static vessel reflects the
// visible era; [data-reveal] elements are left fully visible (their hidden
// state is only ever set by gsap.from inside the no-preference branch).

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

import { useGSAP } from "@gsap/react";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";

const BLEND_BAND = 0.15; // fraction of a chapter's scroll span used to cross-fade
// snap is magnetic, not a trap: only settle onto a chapter start when the reader
// stops within this fraction of a viewport of it; mid-chapter stops stay put
const SNAP_MAGNET_VH = 0.2;

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export default function JourneyController() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    // ── no-preference branch ──────────────────────────────────────────────────
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const lastIndex = chapters.length - 1;

      // normalized scroll-start of each chapter over the global range; recomputed
      // on every ScrollTrigger refresh (resize, font/image reflow, dvh changes).
      let bounds: number[] = chapters.map(() => 0);
      let rangePx = 1;

      function computeBounds(start: number, end: number) {
        const range = end - start;
        if (range <= 0) return;
        rangePx = range;
        const scrollY = window.scrollY;
        bounds = chapters.map((c) => {
          const el = document.getElementById(c.id);
          if (!el) return 0;
          const docY = el.getBoundingClientRect().top + scrollY;
          return clamp01((docY - start) / range);
        });
      }

      // snap to the nearest chapter boundary — desktop only (touch momentum +
      // snap fight each other). isTouch === 1 means touch-only.
      const enableSnap = ScrollTrigger.isTouch !== 1;

      const globalTrigger = ScrollTrigger.create({
        trigger: "#journey",
        start: "top top",
        end: "bottom bottom",
        // refresh LAST: its range and the chapter bounds must be measured after
        // the timeline pin has inserted its spacer (otherwise progress saturates
        // at 1 mid-timeline and the epilogue's bound clamps to 1)
        refreshPriority: -1,
        onRefresh(self) {
          computeBounds(self.start, self.end);
        },
        onUpdate(self) {
          const g = self.progress;
          document.documentElement.style.setProperty("--journey-progress", String(g));

          // segment i: the chapter whose [bounds[i], bounds[i+1]) contains g
          let i = 0;
          // (epsilon: a snap lands exactly on a start; float noise must not
          // leave the reader attributed to the previous chapter)
          while (i < bounds.length - 1 && g >= bounds[i + 1] - 1e-4) i++;
          const segStart = bounds[i];
          const segEnd = i + 1 < bounds.length ? bounds[i + 1] : 1;
          const span = segEnd - segStart;
          const local = span > 1e-6 ? clamp01((g - segStart) / span) : 0;

          // active chapter (nav highlight): the chapter being read
          journey.setChapter(i);

          // cross-chapter blend
          if (local > 1 - BLEND_BAND && i < lastIndex) {
            journey.setBlend(i, i + 1, (local - (1 - BLEND_BAND)) / BLEND_BAND);
          } else if (local < BLEND_BAND && i > 0) {
            journey.setBlend(i, i - 1, (BLEND_BAND - local) / BLEND_BAND);
          } else {
            journey.setBlend(i, i, 0);
          }

          journey.report(local, self.getVelocity(), g);
        },
        snap: enableSnap
          ? {
              snapTo(value: number) {
                let best = value;
                let bestDist = Infinity;
                for (const b of bounds) {
                  const d = Math.abs(b - value);
                  if (d < bestDist) { bestDist = d; best = b; }
                }
                // magnetic: settle only when already near a chapter start
                return bestDist * rangePx <= window.innerHeight * SNAP_MAGNET_VH ? best : value;
              },
              duration: { min: 0.15, max: 0.4 },
              delay: 0.12,
              ease: "power1.inOut",
              directional: true,
            }
          : undefined,
      });

      // per-chapter choreography (independent of the global trigger). Each
      // standard section gets a one-shot CINEMATIC ENTRANCE the first time it
      // scrolls into view, layered for an on-brand "terminal coming alive" feel:
      //   1. heading       — SplitText line-mask rise (premium typography reveal)
      //   2. [data-scramble] labels — ScrambleText decode (terminal decrypt)
      //   3. [data-reveal] cards    — alternating slide + rise + micro-rotate
      //   • [data-ghost] backdrop numeral drifts horizontally (scrubbed parallax)
      // All start states are set by gsap (never CSS) so reduced-motion / no-JS
      // users always see fully-visible, fully-readable content.
      const cleanup: (() => void)[] = [];
      chapters.forEach((chapter) => {
        const section = document.getElementById(chapter.id);
        if (!section) return;

        // ghost parallax — applies wherever a backdrop numeral exists
        const ghost = section.querySelector<HTMLElement>("[data-ghost]");
        if (ghost) {
          const g = gsap.fromTo(
            ghost,
            { xPercent: 6 },
            {
              xPercent: -6,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
          cleanup.push(() => g.scrollTrigger?.kill());
        }

        // the timeline owns its horizontal motion — no vertical entrance there
        if (chapter.kind === "timeline") return;

        const entrance = gsap.timeline({
          scrollTrigger: { trigger: section, start: "top 72%", toggleActions: "play none none none" },
        });

        // 1. heading — split into masked lines, rise each from below
        const heading = document.getElementById(`${chapter.id}-heading`);
        let split: SplitText | null = null;
        if (heading) {
          split = new SplitText(heading, { type: "lines", mask: "lines", linesClass: "split-line" });
          entrance.from(
            split.lines,
            { yPercent: 120, duration: 0.7, ease: "power3.out", stagger: 0.12 },
            0,
          );
        }

        // 2. labels — decode in like a terminal resolving a cipher
        const labels = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-scramble]"));
        labels.forEach((el, i) => {
          const finalText = el.textContent ?? "";
          entrance.to(
            el,
            {
              duration: 0.9,
              ease: "none",
              scrambleText: { text: finalText, chars: "01<>/[]{}=+*·", speed: 0.6, revealDelay: 0.25 },
            },
            0.1 + i * 0.04,
          );
        });

        // 3. content — alternating directional slide + rise + micro-rotation
        const reveals = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-reveal]"));
        if (reveals.length > 0) {
          entrance.from(
            reveals,
            {
              autoAlpha: 0,
              y: 26,
              x: (i: number) => (i % 2 ? 22 : -22),
              rotate: (i: number) => (i % 2 ? 0.5 : -0.5),
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.06,
            },
            0.15,
          );
        }

        cleanup.push(() => {
          entrance.scrollTrigger?.kill();
          entrance.kill();
          split?.revert();
        });
      });

      // ── horizontal timeline: pin the section, scrub the year track sideways ──
      // CSS `.is-horizontal` flips the track to a row first; function-based
      // distance + invalidateOnRefresh keep it correct across resizes. The
      // pinned progress also drives the vessel's era evolution via the store.
      const timelineSection = document.getElementById("timeline");
      const track = timelineSection?.querySelector<HTMLElement>("[data-timeline-track]");
      if (timelineSection && track) {
        timelineSection.classList.add("is-horizontal");
        const move = () => Math.max(track.scrollWidth - window.innerWidth, 0);
        // extra pinned scroll AFTER the track stops, so 2026 (and the fully
        // assembled "now" vessel) lingers before the section releases.
        const dwell = () => window.innerWidth * 0.85;

        // vessel era maps to the TRACK position only (held at "now" through the
        // dwell) so the displayed year and the field's era stay in lockstep.
        const report = (self: ScrollTrigger) => {
          const m = move();
          const moveFrac = m + dwell() > 0 ? m / (m + dwell()) : 1;
          journey.setTimelineProgress(
            moveFrac > 0 ? Math.min(self.progress / moveFrac, 1) : 1,
          );
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: timelineSection,
            start: "top top",
            end: () => `+=${move() + dwell()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: report,
            onEnter: report,
            onEnterBack: report,
            onLeave: () => journey.setTimelineProgress(-1),
            onLeaveBack: () => journey.setTimelineProgress(-1),
          },
        });
        // segment 1: slide the track across all years; segment 2: hold (dwell)
        tl.to(track, { x: () => -move(), ease: "none", duration: move() })
          .to(track, { duration: dwell() });

        cleanup.push(() => {
          tl.scrollTrigger?.kill();
          tl.kill();
          timelineSection.classList.remove("is-horizontal");
          journey.setTimelineProgress(-1);
        });
      }

      // recompute all positions now that the pin/spacer exists — sorted so every
      // trigger below the timeline is measured after its pin (page order), and
      // the global trigger (refreshPriority -1) last
      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      return () => {
        globalTrigger.kill();
        for (const fn of cleanup) fn();
      };
    });

    // ── reduce branch ──────────────────────────────────────────────────────────
    mm.add("(prefers-reduced-motion: reduce)", () => {
      journey.setReducedMotion(true);

      const sections = Array.from(
        document.querySelectorAll<HTMLElement>("[data-chapter]"),
      );
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const id = (entry.target as HTMLElement).id;
            const idx = chapters.findIndex((c) => c.id === id);
            if (idx !== -1) journey.setChapter(idx);
          }
        },
        { threshold: 0.4 },
      );
      for (const s of sections) observer.observe(s);

      return () => observer.disconnect();
    });
  });

  return null;
}
