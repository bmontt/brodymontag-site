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

/** how long the tiles hold, pinned, while they pour into the cards (screens) */
const PIN = 0.3;

gsap.registerPlugin(ScrollTrigger);

export type Tile = { label: string; href: string; icon?: string; meta?: string };
export type TileGroup = { title: string; tiles: Tile[] };

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
        scrollTrigger: { trigger: r, start: "top top+=56", end: () => `+=${innerHeight * PIN}`, pin: true, scrub: 0.5, invalidateOnRefresh: true },
      });
      tl.to(tiles, { x: -18, opacity: 0, duration: 0.4, ease: "power2.in", stagger: { each: 0.014, from: "start" } }, 0)
        .to(heads, { opacity: 0, duration: 0.2, stagger: 0.04, ease: "power1.in" }, 0.25);
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
      <div className="grid w-full gap-x-10 gap-y-10 md:grid-cols-3">
        {groups.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <div data-tile-head className="mb-1 flex items-baseline justify-between border-b border-white/15 pb-2">
              <h3 className="font-sans text-lg font-medium tracking-[-0.02em] text-foreground">{g.title}</h3>
              <span className="font-mono text-2xs tabular-nums text-foreground/55">{String(g.tiles.length).padStart(2, "0")}</span>
            </div>
            <ol>
              {g.tiles.map((t, i) => (
                <li key={`${g.title}:${t.label}`} data-tile>
                  <a
                    href={t.href}
                    className="group grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-x-2 border-b border-white/[0.07] py-2 transition-colors hover:border-white/20"
                  >
                    <span className="font-mono text-2xs tabular-nums text-foreground/45">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 text-balance font-sans text-[16px] md:truncate text-foreground/88 transition-colors group-hover:text-foreground">{t.label}</span>
                    {t.meta && <span className="font-mono text-2xs text-foreground/55">{t.meta}</span>}
                  </a>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
