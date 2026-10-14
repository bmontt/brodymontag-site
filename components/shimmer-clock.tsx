"use client";

// ── shimmer clock ─────────────────────────────────────────────────────────────
// The iridescent shimmer (globals.css: sheen, pill-hue-cycle, iri-cycle,
// subtitle-pulse) animates colors and registered custom properties. The
// compositor can't run those, so a running CSS animation forces a style
// recalculation of its element (and, for inherited properties, its subtree)
// on every frame — 50 of them on /software cost ~200 ms of main thread per
// second at 120 Hz, idle, whether on screen or not.
//
// Here the same animations keep their keyframes, durations, easing and phase
// offsets, but they're paused and stepped from one shared clock: only while
// their element is on screen, and at TICK_HZ. A 4–6 s drift between nearby
// colors steps by well under a percent of its range per tick, so it reads the
// same as 120 Hz, and style work drops ~95%.
//
// Reduced motion keeps them too: they change color, not position.

import { useEffect } from "react";

const SHIMMER = new Set(["sheen", "pill-hue-cycle", "iri-cycle", "subtitle-pulse"]);
const TICK_HZ = 20;

export default function ShimmerClock() {
  useEffect(() => {
    if (typeof document.getAnimations !== "function") return;
    // animation → its timeline start (kept so each one's phase is unchanged)
    const managed = new Map<CSSAnimation, number>();
    const visible = new Set<Element>();
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) visible.add(e.target);
          else visible.delete(e.target);
        }
      },
      { rootMargin: "10% 0px" },
    );

    const adopt = () => {
      const now = (document.timeline.currentTime as number | null) ?? performance.now();
      for (const a of document.getAnimations()) {
        if (!(a instanceof CSSAnimation) || managed.has(a) || !SHIMMER.has(a.animationName)) continue;
        const target = (a.effect as KeyframeEffect | null)?.target;
        if (!target) continue;
        const start = (a.startTime as number | null) ?? now;
        a.pause();
        a.currentTime = now - start;
        managed.set(a, start);
        io.observe(target);
      }
      // forget animations whose element left the page or lost its class
      for (const a of managed.keys()) {
        const target = (a.effect as KeyframeEffect | null)?.target;
        if (a.playState === "idle" || !target || !target.isConnected) {
          managed.delete(a);
          if (target) {
            io.unobserve(target);
            visible.delete(target);
          }
        }
      }
    };

    const tick = () => {
      if (document.hidden) return;
      const now = (document.timeline.currentTime as number | null) ?? performance.now();
      for (const [a, start] of managed) {
        const target = (a.effect as KeyframeEffect | null)?.target;
        if (target && visible.has(target)) a.currentTime = now - start;
      }
    };

    // new shimmer arrives with route changes and reveals: re-adopt, debounced
    let pending = 0;
    const mo = new MutationObserver(() => {
      if (pending) return;
      pending = window.setTimeout(() => {
        pending = 0;
        adopt();
      }, 120);
    });
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });

    adopt();
    const iv = window.setInterval(tick, 1000 / TICK_HZ);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(pending);
      mo.disconnect();
      io.disconnect();
      for (const a of managed.keys()) if (a.playState !== "idle") a.play();
    };
  }, []);
  return null;
}
