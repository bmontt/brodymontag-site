"use client";

// ── summary tiles ─────────────────────────────────────────────────────────────
// The software page's overview before the detail: every project, role and
// stack category as a titled tile, in three tidy groups that fit one screen.
// Pinned for about a screen of scroll, the tiles pour down out of view in a
// quick cascade (slight sideways drift, fade) and hand off to the full cards
// below. Each tile links to its card. Reduced motion / no JS: a static index.

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export type Tile = { label: string; href: string; icon?: string };
export type TileGroup = { title: string; tiles: Tile[] };

const drift = (i: number) => {
  const v = Math.sin(i * 12.9898) * 43758.5453;
  return v - Math.floor(v) - 0.5;
};

export default function SummaryTiles({ groups }: { groups: TileGroup[] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const r = root.current;
      if (!r || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      // wait a frame: the full-bleed wrapper widens this block in its own
      // effect, after this one; pinning before that would lock in the column's
      // narrow width
      let tl: gsap.core.Timeline | null = null;
      const raf = requestAnimationFrame(() => {
      const tiles = gsap.utils.toArray<HTMLElement>(r.querySelectorAll("[data-tile]"));
      const heads = gsap.utils.toArray<HTMLElement>(r.querySelectorAll("[data-tile-head]"));
      tl = gsap.timeline({
        scrollTrigger: { trigger: r, start: "top top+=56", end: () => `+=${innerHeight * 0.85}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      });
      tl.to(heads, { opacity: 0, y: -12, duration: 0.25, stagger: 0.05, ease: "power1.in" }, 0)
        .to(tiles, {
          y: () => innerHeight * 0.7,
          x: (i: number) => drift(i) * 24,
          opacity: 0,
          scale: 0.92,
          duration: 0.55,
          ease: "power2.in",
          stagger: { each: 0.018, from: "start" },
        }, 0.05);
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      });
      return () => {
        cancelAnimationFrame(raf);
        tl?.scrollTrigger?.kill();
        tl?.kill();
        gsap.set(r.querySelectorAll("[data-tile], [data-tile-head]"), { clearProps: "all" });
      };
    },
    { scope: root },
  );

  return (
    <div ref={root} className="flex min-h-[calc(100svh-7rem)] flex-col justify-center py-8">
      <div className="grid w-full gap-x-12 gap-y-8 md:grid-cols-[1.25fr_1.1fr_0.9fr]">
        {groups.map((g) => (
          <div key={g.title}>
            <p data-tile-head className="mb-4 font-sans text-lg font-medium tracking-[-0.02em] text-foreground md:text-xl">{g.title}</p>
            <ul className="flex flex-wrap gap-2">
              {g.tiles.map((t) => (
                <li key={`${g.title}:${t.label}`} data-tile>
                  <a
                    href={t.href}
                    className="pill rounded-xl border border-white/12 px-3.5 py-2.5 font-sans text-sm font-medium leading-none text-foreground/80 md:text-[15px]"
                  >
                    <span className="flex items-center gap-2">
                    {t.icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={t.icon} alt="" aria-hidden="true" className="brand-icon h-4 w-4 object-contain" style={{ width: t.icon.includes("fiserv") ? "auto" : undefined, height: t.icon.includes("fiserv") ? 10 : undefined }} />
                    )}
                    {t.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
