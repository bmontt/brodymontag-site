"use client";

// ── widget slide: a focus pull ────────────────────────────────────────────────
// The software page's widgets ([data-slide]) come into focus as they reach the
// middle of the screen, the way a camera racks focus through the network
// behind them. The row at the middle is crisp, full size and full strength;
// the further a card's center is from the middle, the more it recedes — a
// little smaller, dimmer, and tipped in depth. Cards below the middle sit a
// touch lower, top tipped back, and rise into place like cards being dealt
// (in a two-up row the right card trails the left by a beat); cards above
// lift away and tip forward as they leave.
//
// Every value is a function of scroll position, set straight onto the card
// each frame (quickSetter, no easing tween, no layout reads): the cards track
// the scroll 1:1, and nothing ever moves sideways. Phones get the same at half
// strength and without the tilt. Reduced motion or no JS: nothing is set,
// every widget plain and fully visible.
//
// These widgets carry no [data-reveal], so the journey controller's one-shot
// entrance never tweens the same transform. The laser network reads their
// opacity to know how far each is showing (lib/director/software-figure.ts).

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** the most a card recedes (k = 1, at the edge of the screen) */
const FOCUS = {
  wide: { rise: 40, lift: 16, tiltIn: 10, tiltOut: 6, scale: 0.06, fade: 0.65 },
  narrow: { rise: 20, lift: 8, tiltIn: 0, tiltOut: 0, scale: 0.03, fade: 0.4 },
};
/** how far behind the left card the right card of a pair is dealt (share of half the screen) */
const DEAL_LAG = 0.07;

export default function WidgetSlide() {
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(
      { wide: "(min-width: 768px) and (prefers-reduced-motion: no-preference)", narrow: "(max-width: 767.98px) and (prefers-reduced-motion: no-preference)" },
      (ctx) => {
        const F = ctx.conditions?.wide ? FOCUS.wide : FOCUS.narrow;
        const els = gsap.utils.toArray<HTMLElement>("[data-slide]");
        // wait a frame, like the summary tiles: the full-bleed block above
        // settles its width (and its pin) first
        const raf = requestAnimationFrame(() =>
          ctx.add(() => {
            for (const el of els) {
              const lags = el.dataset.slide === "right" && el.dataset.pair !== undefined;
              gsap.set(el, { transformPerspective: 1100, force3D: true });
              const setY = gsap.quickSetter(el, "y", "px");
              const setS = gsap.quickSetter(el, "scale");
              const setR = gsap.quickSetter(el, "rotationX", "deg");
              const setO = gsap.quickSetter(el, "opacity");
              let h = el.offsetHeight;
              let below: boolean | null = null;
              const place = (progress: number) => {
                const H = innerHeight;
                // its center from the screen's, signed (negative: below the middle)
                const d = (progress - 0.5) * (H + h);
                const entering = d < 0;
                const u = Math.abs(d) / (H * 0.5) + (entering && lags ? DEAL_LAG : 0);
                const k = smooth(0.18, 1, u);
                // tip about the edge nearest the middle, so a card hinges toward focus
                // (switched only where k is ~0, so the change never shows)
                if (entering !== below) {
                  below = entering;
                  gsap.set(el, { transformOrigin: entering ? "50% 100%" : "50% 0%" });
                }
                setY(entering ? F.rise * k : -F.lift * k);
                setR(entering ? F.tiltIn * k : -F.tiltOut * k);
                setS(1 - F.scale * k);
                setO(1 - F.fade * k);
              };
              ScrollTrigger.create({
                trigger: el,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (s) => place(s.progress),
                onRefresh: (s) => {
                  h = el.offsetHeight;
                  place(s.progress);
                },
              });
            }
          }),
        );
        return () => {
          cancelAnimationFrame(raf);
          // leaving this mode (a resize across it, reduced motion turned on):
          // nothing left offset, tipped or faded
          gsap.set(els, { clearProps: "transform,transformOrigin,opacity" });
        };
      },
    );
    return () => mm.revert();
  });
  return null;
}
