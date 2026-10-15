"use client";

// ── widget slide ──────────────────────────────────────────────────────────────
// The software page's alternating widgets ([data-slide="left" | "right"]) slide
// in from their own side as they come up the screen and back out the same way
// as they leave, fading as they go — scrubbed by scroll both ways, so the one
// in the middle of the screen sits fully in place and its neighbors recede:
// one widget at a time. Phones (one column) get a short drift. Reduced motion
// or no JS: nothing is set, every widget plain and fully visible. Horizontal
// overflow is clipped on html/body (globals.css), so a widget out at the side
// never adds a scrollbar.
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
              // 0 with its center in the middle of the screen → 1 with it at an edge
              const place = (progress: number, now = false) => {
                const H = innerHeight;
                const k = smooth(0.12, 0.9, Math.abs((progress - 0.5) * (H + h)) / (H * 0.5));
                const x = side * k * (wide ? Math.min(innerWidth * 0.16, 240) : 22);
                const o = 1 - k * (wide ? 0.85 : 0.5);
                if (now) gsap.set(el, { x, opacity: o });
                else { toX(x); toO(o); }
              };
              ScrollTrigger.create({
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (s) => place(s.progress),
                onRefresh: (s) => { h = el.offsetHeight; place(s.progress, true); },
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
