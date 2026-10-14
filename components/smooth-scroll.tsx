"use client";

// ── smooth-scroll ─────────────────────────────────────────────────────────────
// Lenis (docs/design-inspiration.md #5): wheel scrolling glides like the
// damped camera instead of stepping per tick, so DOM and stage move together.
// GSAP's ticker drives Lenis and every Lenis scroll updates ScrollTrigger —
// one clock for scroll, triggers, and the stage. Touch keeps native momentum
// (no syncTouch). Off under reduced motion and with ?lenis=0 (A/B).
// scrollToId() is the one programmatic-scroll entry point (nav, skip links):
// it goes through Lenis when it runs, else native smooth scroll.

import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

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
    const l = new Lenis({ autoRaf: false, anchors: true, lerp: 0.12 });
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
