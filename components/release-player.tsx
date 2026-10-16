"use client";

// ── release-player ────────────────────────────────────────────────────────────
// The latest release as a player, one platform at a time: a column of round
// platform bubbles beside the embed (content.json music.releases.player).
// Spotify loads first, deferred like every third-party embed; another
// platform's player loads the first time it's picked and stays mounted, so
// switching back is instant. The panel keeps one height, so switching never
// moves the page.

import { useRef, useState, type KeyboardEvent } from "react";
import { FaSoundcloud, FaSpotify } from "react-icons/fa";
import { SiApplemusic } from "react-icons/si";
import type { IconType } from "react-icons";
import DeferredIframe from "@/components/deferred-iframe";
import { glow, IRIDESCENT } from "@/lib/glow";

export interface PlayerSource {
  id: string;
  label: string;
  /** the embed */
  src: string;
  /** the release on that platform */
  href: string;
}

const ICONS: Record<string, IconType> = { spotify: FaSpotify, apple: SiApplemusic, soundcloud: FaSoundcloud };
const HEIGHT = 352;
const ALLOW = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";

export default function ReleasePlayer({ sources }: { sources: PlayerSource[] }) {
  const [active, setActive] = useState(0);
  const [visited, setVisited] = useState<Set<number>>(() => new Set([0]));
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const pick = (i: number) => {
    setActive(i);
    setVisited((v) => (v.has(i) ? v : new Set(v).add(i)));
  };
  // arrow keys move along the column, like any tab list
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (active + step + sources.length) % sources.length;
    pick(next);
    tabs.current[next]?.focus();
  };

  return (
    <div className="iri-cycle flex gap-3">
      <div role="tablist" aria-label="listen on" aria-orientation="vertical" onKeyDown={onKey} className="flex shrink-0 flex-col gap-2.5">
        {sources.map((s, i) => {
          const Icon = ICONS[s.id];
          const on = i === active;
          return (
            <button
              key={s.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`listen-${s.id}`}
              aria-selected={on}
              aria-controls={`listen-${s.id}-panel`}
              tabIndex={on ? 0 : -1}
              title={s.label}
              onClick={() => pick(i)}
              className="flex h-11 w-11 items-center justify-center rounded-full border transition-[background-color,border-color,box-shadow] duration-300 focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60"
              style={{
                borderColor: on ? glow(IRIDESCENT, 0.55) : "rgba(255, 255, 255, 0.1)",
                background: on ? glow(IRIDESCENT, 0.14) : "rgba(255, 255, 255, 0.02)",
                boxShadow: on ? `0 0 14px -3px ${glow(IRIDESCENT, 0.45)}` : "none",
              }}
            >
              {Icon ? (
                <Icon className="h-[18px] w-[18px]" style={{ color: on ? glow(IRIDESCENT, 0.95) : "rgba(255, 255, 255, 0.55)" }} aria-hidden />
              ) : (
                <span className="font-mono text-2xs">{s.label.slice(0, 2)}</span>
              )}
              <span className="sr-only">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden rounded-xl" style={{ height: HEIGHT }}>
        {sources.map((s, i) => {
          const on = i === active;
          const props = {
            title: `${s.label} player`,
            width: "100%",
            height: HEIGHT,
            frameBorder: "0",
            allow: ALLOW,
            className: "absolute inset-0 block h-full w-full",
          } as const;
          return (
            <div
              key={s.id}
              role="tabpanel"
              id={`listen-${s.id}-panel`}
              aria-labelledby={`listen-${s.id}`}
              hidden={!on}
              className="absolute inset-0"
            >
              {i === 0 ? (
                <DeferredIframe {...props} src={s.src} />
              ) : visited.has(i) ? (
                <iframe {...props} src={s.src} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
