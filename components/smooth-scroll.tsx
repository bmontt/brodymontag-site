"use client";

// ── smooth-scroll ─────────────────────────────────────────────────────────────
// Lenis (docs/design-inspiration.md #5): wheel scrolling glides like the
// damped camera instead of stepping per tick, so DOM and stage move together.
// GSAP's ticker drives Lenis and every Lenis scroll updates ScrollTrigger —
// one clock for scroll, triggers, and the stage. Touch keeps native momentum
// (no syncTouch). Off under reduced motion and with ?lenis=0 (A/B).
// scrollToId() is the one programmatic-scroll entry point (nav, skip links):
// it goes through Lenis when it runs, else native smooth scroll.
//
// The same input should travel the same distance through the site on every
// device. Sections are sized in screens (svh), so a wheel step is scaled to
// the window's height (REF_H px = 1×, the 16:10 laptop the pacing was tuned
// on) — a notch moves the same fraction of a section on a phone, a laptop or
// a 4K monitor. Line-mode wheels (Firefox) are brought to the 100 px/notch
// pixel-mode wheels report (Lenis assumes 16.7 px/line, half a notch).
// Touch keeps native momentum, which already moves 1:1 with the finger.

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);
// mobile toolbars collapsing/expanding resize the viewport mid-scroll: don't
// re-measure every trigger for it (positions would jump under the finger)
ScrollTrigger.config({ ignoreMobileResize: true });

const REF_H = 800;
const LINE_TO_NOTCH = 2; // 3 lines × 16.7 px × 2 = 100 px

let lenis: Lenis | null = null;

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el);
  else el.scrollIntoView({ behavior: "smooth" });
}

export default function SmoothScroll() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("lenis") === "0") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const l = new Lenis({
      autoRaf: false,
      anchors: true,
      lerp: 0.12,
      virtualScroll: (data) => {
        const e = data.event;
        if (e.type !== "wheel") return true;
        const k = ((e as WheelEvent).deltaMode === 1 ? LINE_TO_NOTCH : 1) * Math.min(Math.max(window.innerHeight / REF_H, 0.75), 1.6);
        data.deltaX *= k;
        data.deltaY *= k;
        return true;
      },
    });
    lenis = l;
    l.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => l.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.dataset.lenis = "on";
    return () => {
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      l.destroy();
      lenis = null;
      delete document.documentElement.dataset.lenis;
    };
  }, []);
  return null;
}
