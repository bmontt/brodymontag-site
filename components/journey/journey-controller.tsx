"use client";

// ── journey-controller ────────────────────────────────────────────────────────
// Single source of truth for scroll→store state. Registers:
//   1. one global #journey trigger that, each frame, derives which chapter we're
//      in and the cross-chapter blend from precomputed boundary offsets, writes
//      them to the journey store. No snapping:
//      scroll behaves the same on every device. It refreshes last (refreshPriority -1) so its range and the chapter
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
import { chapters as allChapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";

const BLEND_BAND = 0.15; // fraction of a chapter's scroll span used to cross-fade

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** the chapters on this page, in document order */
function presentChapters() {
  const el = (id: string) => document.getElementById(id)!;
  return allChapters
    .filter((c) => document.getElementById(c.id))
    .sort((a, b) => (el(a.id).compareDocumentPosition(el(b.id)) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
}

// Has a controller set up on this page load yet? The first one (hydration)
// sets up synchronously, so no content is ever painted before its entrance
// state is set. Later ones arrive by client navigation.
let hydrated = false;

export default function JourneyController() {
  useGSAP(() => {
    // On a client navigation React commits the new page inside a view
    // transition's update step, and the screen holds a frozen snapshot until
    // that step returns. This setup (every trigger and split measured, ~25 ms
    // in production, far more in dev or on slow machines) used to run in
    // there and freeze the whole screen, stage included. It now waits one
    // frame: the transition is already playing by then, and the new page is
    // still invisible (globals.css vt-in: a 120 ms delay at opacity 0), so its
    // entrance states are set before it can be seen.
    const defer = hydrated && typeof document.startViewTransition === "function";
    hydrated = true;
    if (!defer) {
      const mm = setup();
      return () => mm.revert();
    }
    let mm: gsap.MatchMedia | null = null;
    const raf = requestAnimationFrame(() => {
      mm = setup();
    });
    return () => {
      cancelAnimationFrame(raf);
      mm?.revert();
    };
  });

  return null;
}

function setup(): gsap.MatchMedia {
    const mm = gsap.matchMedia();

    // ── no-preference branch ──────────────────────────────────────────────────
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      // each section page carries a subset of the chapters, in its own order
      // (about puts the epilogue before the timeline) — measure those, top-down
      const chapters = presentChapters();
      journey.setIds(chapters.map((c) => c.id));
      const lastIndex = chapters.length - 1;

      // normalized scroll-start of each chapter over the global range; recomputed
      // on every ScrollTrigger refresh (resize, font/image reflow).
      let bounds: number[] = chapters.map(() => 0);

      function computeBounds(start: number, end: number) {
        const range = end - start;
        if (range <= 0) return;
        const scrollY = window.scrollY;
        bounds = chapters.map((c) => {
          const el = document.getElementById(c.id);
          if (!el) return 0;
          const docY = el.getBoundingClientRect().top + scrollY;
          return clamp01((docY - start) / range);
        });
        journey.setBounds(bounds);
      }

      // (no snapping: it ran on mouse and trackpad but not on touch, so the same
      // page scrolled differently per device — scroll is free everywhere)
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
          // (no CSS var: a per-frame write on <html> re-styled the whole page
          // every scroll frame, and nothing read it)
          const g = self.progress;

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
      });

      // per-chapter choreography (independent of the global trigger). Each
      // standard section gets a one-shot CINEMATIC ENTRANCE the first time it
      // scrolls into view, layered for an on-brand "terminal coming alive" feel:
      //   1. heading       — SplitText word rise out of line masks, + scroll drift
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

        // 1. heading display — words rise out of their line masks, then drift
        //    sideways a touch with the scroll (kinetic scale contrast)
        const display = section.querySelector<HTMLElement>("[data-display]");
        let displaySplit: SplitText | null = null;
        if (display) {
          displaySplit = new SplitText(display, { type: "lines,words", mask: "lines" });
          entrance.from(
            displaySplit.words,
            { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.05 },
            0.05,
          );
          const drift = gsap.fromTo(
            display,
            { xPercent: 2 },
            {
              xPercent: -4,
              ease: "none",
              scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
          cleanup.push(() => drift.scrollTrigger?.kill());
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

        // 3. content — in a chapter with a laser figure, blocks are emitted by
        //    the figure: they slide out from its side and resolve from a blur,
        //    each as it scrolls in (the figure's gutter is on the right).
        //    Elsewhere: alternating directional slide + rise + micro-rotation.
        const reveals = gsap.utils.toArray<HTMLElement>(section.querySelectorAll("[data-reveal]"));
        const hasFigure = !!section.querySelector("[data-laser-anchor]");
        if (reveals.length > 0 && hasFigure) {
          reveals.forEach((el) => {
            const t = gsap.from(el, {
              autoAlpha: 0,
              x: 48,
              filter: "blur(6px)",
              duration: 0.8,
              ease: "power3.out",
              clearProps: "filter",
              scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
            });
            cleanup.push(() => t.scrollTrigger?.kill());
          });
        } else if (reveals.length > 0) {
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
          displaySplit?.revert();
        });
      });

      // ── prologue: pin the hero while the stage performs the fly-through ─────
      // (hold → dolly-zoom tilt → rolled dive; see HOME_TRACK). The hero content
      // exits "past the camera" — scale up + fade, angular.dev's scene exit —
      // during the dive. Shorter on phones.
      const hero = document.getElementById("hero");
      const heroContent = hero?.querySelector<HTMLElement>("[data-hero-content]");
      const heroSkip = hero?.querySelector<HTMLElement>("[data-hero-skip]");
      if (hero && heroContent) {
        const pinLength = () => window.innerHeight * (window.innerWidth < 768 ? 1.0 : 1.6);
        const prologue = gsap.timeline({
          scrollTrigger: {
            trigger: hero,
            start: "top top",
            end: () => `+=${pinLength()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
        prologue
          .to(heroContent, { scale: 1.3, autoAlpha: 0, filter: "blur(6px)", ease: "power2.in", duration: 0.35 }, 0.5)
          .to(heroSkip ?? {}, { autoAlpha: 0, duration: 0.2 }, 0.4)
          .to({}, { duration: 0.15 }); // hold empty while the dive finishes
        cleanup.push(() => {
          prologue.scrollTrigger?.kill();
          prologue.kill();
          gsap.set(heroContent, { clearProps: "transform,opacity,visibility,filter" });
          if (heroSkip) gsap.set(heroSkip, { clearProps: "opacity,visibility" });
        });
      }

      // ── horizontal timeline: pin the section, scrub the year track sideways ──
      // CSS `.is-horizontal` flips the track to a row first; function-based
      // distance + invalidateOnRefresh keep it correct across resizes. The
      // pinned progress also drives the vessel's era evolution via the store.
      const timelineSection = document.getElementById("timeline");
      const track = timelineSection?.querySelector<HTMLElement>("[data-timeline-track]");
      if (timelineSection && track) {
        timelineSection.classList.add("is-horizontal");
        const move = () => Math.max(track.scrollWidth - window.innerWidth, 0);
        // scroll lengths in screens, not px of width, so a year takes the same
        // scroll on every device: each panel the track slides past costs
        // PANEL_SCREENS of a screen, and the dwell after it — 2026 lingering
        // before the section releases — DWELL_SCREENS (on a 16:10 laptop the
        // same as before, when both were measured in px of width)
        const PANEL_SCREENS = 0.6, DWELL_SCREENS = 1.36;
        const panelW = () => track.querySelector<HTMLElement>(".timeline-panel")?.offsetWidth || window.innerWidth;
        const travel = () => (move() / panelW()) * PANEL_SCREENS * window.innerHeight;
        const dwell = () => DWELL_SCREENS * window.innerHeight;

        // vessel era maps to the TRACK position only (held at "now" through the
        // dwell) so the displayed year and the field's era stay in lockstep.
        const report = (self: ScrollTrigger) => {
          const m = travel();
          const moveFrac = m + dwell() > 0 ? m / (m + dwell()) : 1;
          journey.setTimelineProgress(
            moveFrac > 0 ? Math.min(self.progress / moveFrac, 1) : 1,
          );
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: timelineSection,
            start: "top top",
            end: () => `+=${travel() + dwell()}`,
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
        tl.to(track, { x: () => -move(), ease: "none", duration: travel() })
          .to(track, { duration: dwell() });

        cleanup.push(() => {
          tl.scrollTrigger?.kill();
          tl.kill();
          timelineSection.classList.remove("is-horizontal");
          journey.setTimelineProgress(-1);
        });
      }

      // ── transition points ([data-tp]: section labels, the next-section
      //    handoff) — a shimmer draws through each as it comes into view
      //    (globals.css .tp-line), and each slides in from the page's left edge
      //    as it enters the lower screen, lands in line with the text by the
      //    time it reaches ~60% of the way up, and rests there. Horizontal only,
      //    so it never overlaps the text above or below.
      gsap.utils.toArray<HTMLElement>("[data-tp]").forEach((el) => {
        const lit = ScrollTrigger.create({
          trigger: el,
          start: "top 82%",
          onEnter: () => el.classList.add("tp-on"),
          onLeaveBack: () => el.classList.remove("tp-on"),
        });
        // start at the viewport's left border, measured without our own offset
        const fromEdge = () => -(el.getBoundingClientRect().left - (gsap.getProperty(el, "x") as number));
        const drift = gsap.fromTo(
          el,
          { x: fromEdge, autoAlpha: 0 },
          {
            x: 0,
            autoAlpha: 1,
            ease: "power3.out",
            immediateRender: false,
            scrollTrigger: { trigger: el, start: "top bottom", end: "top 60%", scrub: 0.6, invalidateOnRefresh: true },
          },
        );
        cleanup.push(() => {
          lit.kill();
          drift.scrollTrigger?.kill();
          drift.kill();
          gsap.set(el, { clearProps: "transform,opacity,visibility" });
          el.classList.remove("tp-on");
        });
      });

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
            const idx = presentChapters().findIndex((c) => c.id === id);
            if (idx !== -1) journey.setChapter(idx);
          }
        },
        // the chapter crossing the viewport's middle line — a visibility
        // threshold would never fire for sections taller than the viewport
        { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
      );
      for (const s of sections) observer.observe(s);

      return () => observer.disconnect();
    });

    return mm;
}
