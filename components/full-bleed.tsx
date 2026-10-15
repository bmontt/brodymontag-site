"use client";

// ── full bleed ────────────────────────────────────────────────────────────────
// Pulls a block out of its column to the viewport's edges. The section pages'
// columns sit in a grid beside the laser gutter, so the offset is measured,
// not 50vw. Used by the film and the supported-artists strip on /music.

import { useEffect, useRef, type ReactNode, type RefObject } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/** keep `bleed` edge to edge: its column is `slot` (an unshifted wrapper) */
export function useFullBleed(slot: RefObject<HTMLElement | null>, bleed: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const s = slot.current;
    const b = bleed.current;
    if (!s || !b) return;
    const fit = () => {
      b.style.marginLeft = `${-s.getBoundingClientRect().left}px`;
      b.style.width = `${document.documentElement.clientWidth}px`;
    };
    fit();
    // anything measured inside before this widened it (a pin locks in its
    // width) re-measures now
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [slot, bleed]);
}

export default function FullBleed({ children, className = "" }: { children: ReactNode; className?: string }) {
  const slot = useRef<HTMLDivElement>(null);
  const bleed = useRef<HTMLDivElement>(null);
  useFullBleed(slot, bleed);
  return (
    <div ref={slot}>
      <div ref={bleed} className={className}>
        {children}
      </div>
    </div>
  );
}
