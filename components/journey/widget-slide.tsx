"use client";

// ── widget slide ──────────────────────────────────────────────────────────────
// The software page's alternating widgets ([data-slide="left" | "right"]) slide
// in from their own side as they come up the screen, on past their resting
// place to nearly the middle of it, hold there perfectly still at full
// opacity while their center crosses the middle ~45% of the screen, then slide
// back out the same way as they leave, fading as they go. Scrubbed by scroll
// both ways, so the widget you're reading is centered and still, and its
// neighbors recede: one widget at a time — or, on wide screens, one row at a
// time, where two cards share it ([data-pair]): each comes in from its own
// side and holds in its own column. Phones (one column) get a short
// drift. Reduced motion or no JS: nothing is set, every widget plain and fully
// visible. Horizontal overflow is clipped on html/body (globals.css), so a
// widget out at the side never adds a scrollbar.
//
// These widgets carry no [data-reveal], so the journey controller's one-shot
// entrance never tweens the same transform.

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function WidgetSlide() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(
      { wide: "(min-width: 768px) and (prefers-reduced-motion: no-preference)", narrow: "(max-width: 767.98px) and (prefers-reduced-motion: no-preference)" },
      (ctx) => {
        const wide = !!ctx.conditions?.wide;
        const els = gsap.utils.toArray<HTMLElement>("[data-slide]");
        // wait a frame, like the summary tiles: the full-bleed block above
        // settles its width (and its pin) first
        const raf = requestAnimationFrame(() =>
          ctx.add(() => {
            for (const el of els) {
              const side = el.dataset.slide === "right" ? 1 : -1;
              const toX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
              const toO = gsap.quickTo(el, "opacity", { duration: 0.5, ease: "power3.out" });
              let h = el.offsetHeight;
              let toMid = 0; // px from its resting center to (nearly) the screen's
              // a card in a two-up row ([data-pair]) holds in its own column —
              // pulled to the middle it would cover its neighbour
              const paired = el.dataset.pair !== undefined;
              const measure = () => {
                h = el.offsetHeight;
                const r = el.getBoundingClientRect();
                toMid = paired ? 0 : (innerWidth / 2 - (r.left + r.width / 2 - Number(gsap.getProperty(el, "x")))) * 0.92;
              };
              measure();
              // its center from the screen's, as a share of half the screen:
              // held (k = 0) within the middle ~45%, sliding out to k = 1 past the edge
              const place = (progress: number, now = false) => {
                const H = innerHeight;
                const k = smooth(0.45, 1.05, Math.abs((progress - 0.5) * (H + h)) / (H * 0.5));
                const x = toMid * (1 - k) + side * k * (wide ? Math.min(innerWidth * 0.16, 240) : 22);
                const o = 1 - k * (wide ? 0.85 : 0.5);
                if (now) gsap.set(el, { x, opacity: o });
                else { toX(x); toO(o); }
              };
              ScrollTrigger.create({
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (s) => place(s.progress),
                onRefresh: (s) => { measure(); place(s.progress, true); },
              });
            }
          }),
        );
        return () => {
          cancelAnimationFrame(raf);
          // leaving this mode (a resize across it, reduced motion turned on):
          // nothing left offset or faded
          gsap.set(els, { clearProps: "transform,opacity" });
        };
      },
    );
    return () => mm.revert();
  });
  return null;
}
