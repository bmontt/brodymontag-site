"use client";

// ── project deck ──────────────────────────────────────────────────────────────
// The software projects as a deck. Their real layout is a staggered, slightly
// rotated scatter down the page. On arrival they're drawn as a grid that fits
// the screen just under the "projects" heading; as you scroll, each peels off
// and falls into its place in the scatter (GSAP, scrubbed), top cards first.
// Reduced motion / no JS: no grid, just the scatter.

import { Children, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

// a fixed pseudo-random pattern: same scatter on every visit
const jitter = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v) - 0.5; // -0.5 … 0.5
};

export default function ProjectDeck({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const deck = useRef<HTMLDivElement>(null);
  const items = Children.toArray(children);

  useGSAP(
    () => {
      const r = root.current, d = deck.current;
      if (!r || !d || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const slots = [...r.querySelectorAll<HTMLElement>("[data-deck-slot]")];
      const W = d.clientWidth;
      const cols = W < 560 ? 2 : W < 900 ? 3 : 4;
      const rows = Math.ceil(slots.length / cols);
      d.style.height = `calc(100svh - 9rem)`;
      const dr = d.getBoundingClientRect();
      const cellW = dr.width / cols, cellH = dr.height / rows;
      const tweens = slots.map((slot, i) => {
        const card = slot.firstElementChild as HTMLElement;
        const sr = slot.getBoundingClientRect();
        const c = i % cols, row = Math.floor(i / cols);
        const tx = dr.left + (c + 0.5) * cellW, ty = dr.top + (row + 0.5) * cellH;
        const s = Math.min((cellW * 0.9) / slot.offsetWidth, (cellH * 0.9) / slot.offsetHeight);
        const rot = parseFloat(slot.dataset.rot ?? "0");
        // one scrubbed timeline per card: the flight, then — only at the very
        // end — the backing clears, so a card stays opaque while it passes
        // over cards that already landed and lands as wireframe
        const BACKED = "rgba(16, 17, 21, 0.96)";
        const tl = gsap.timeline({
          scrollTrigger: { trigger: d, start: `top+=${i * 28} 18%`, endTrigger: slot, end: "top 70%", scrub: 0.7 },
        });
        tl.fromTo(
          card,
          { x: tx - (sr.left + sr.width / 2), y: ty - (sr.top + sr.height / 2), scale: s, rotation: -rot, backgroundColor: BACKED },
          { x: 0, y: 0, scale: 1, rotation: 0, ease: "power2.inOut", duration: 1, immediateRender: true },
        ).to(card, { backgroundColor: "rgba(16, 17, 21, 0)", ease: "none", duration: 0.12 }, 0.9);
        return tl;
      });
      ScrollTrigger.refresh();
      return () => {
        for (const t of tweens) { t.scrollTrigger?.kill(); t.kill(); }
        gsap.set(slots.map((s) => s.firstElementChild), { clearProps: "transform,backgroundColor" });
        d.style.height = "";
      };
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      {/* where the grid is drawn on arrival (sized by the effect) */}
      <div ref={deck} aria-hidden="true" />
      <div className="flex flex-col">
        {items.map((child, i) => {
          const rot = (jitter(i, 1) * 3.2).toFixed(2); // ±1.6°
          const shift = (jitter(i, 2) * 6).toFixed(2); // ±3% sideways
          return (
            <div
              key={i}
              data-deck-slot
              data-rot={rot}
              className={`relative w-full sm:w-[62%] ${i % 2 ? "sm:self-end" : "sm:self-start"}`}
              // wireframe cards can't overlap (text would sit on text): a loose
              // vertical rhythm instead, each gap a little different
              style={{ rotate: `${rot}deg`, translate: `${shift}% 0`, zIndex: i + 1, marginTop: i ? `${1.25 + (jitter(i, 3) + 0.5) * 1.5}rem` : 0 }}
            >
              <div className="rounded-[18px]">{child}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
