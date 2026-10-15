"use client";

// ── platform card ─────────────────────────────────────────────────────────────
// A presence card: details always open, and the whole card links to the
// profile. Stretched-link pattern — an overlay <a> covers the card, and the
// detail links sit above it (their own z, pointer events back on), so there
// are no nested anchors.

import { useRef, useState, useCallback } from "react";
import type { PlatformData } from "@/lib/platform-data";
import { glow } from "@/lib/glow";

type Props = Omit<PlatformData, "id">;

export default function PlatformCard({
  name,
  handle,
  href,
  icon: Icon,
  glowRgb,
  stat,
  details,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    const el = glowRef.current;
    if (!rect || !el) return;
    el.style.setProperty("--mx", (e.clientX - rect.left) + "px");
    el.style.setProperty("--my", (e.clientY - rect.top) + "px");
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="iri-cycle relative overflow-hidden border border-white/8 transition-[border-color] duration-200 hover:border-white/20 has-[a:focus-visible]:border-white/30"
    >
      {/* the card's own link: covers it, under the content */}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${name} — ${handle}`}
        className="absolute inset-0 z-10 outline-none"
      />

      {/* cursor glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          ["--mx" as string]: "0px",
          ["--my" as string]: "0px",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.35s ease",
          background: `radial-gradient(circle 220px at var(--mx) var(--my), ${glow(glowRgb, 0.10)}, transparent 72%)`,
        }}
      />

      {/* content: clicks fall through to the card's link, except on detail links */}
      <div className="pointer-events-none relative z-20 p-5">
        {/* logo row — icon is the visual anchor */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3.5">
            {/* icon box */}
            <div
              className="flex items-center justify-center w-9 h-9 border border-white/10 shrink-0"
              style={{
                background: `${glow(glowRgb, 0.06)}`,
                transition: "background 0.3s ease, border-color 0.3s ease",
                ...(hovered && {
                  background: `${glow(glowRgb, 0.12)}`,
                  borderColor: `${glow(glowRgb, 0.30)}`,
                }),
              }}
            >
              <Icon
                className="h-5 w-5"
                style={{
                  color: `${glow(glowRgb, hovered ? 0.95 : 0.65)}`,
                  transition: "color 0.3s ease",
                }}
              />
            </div>
            <div>
              <p className="font-mono text-xs text-foreground/90 tracking-wide">{name}</p>
              <p className="font-mono text-xs text-foreground/52 mt-0.5">{handle}</p>
            </div>
          </div>
          {stat && (
            <div className="text-right">
              <p className="font-mono text-xl font-light text-foreground/88 leading-none">
                {stat.value}
              </p>
              <p className="font-mono text-xs text-foreground/42 mt-1">{stat.label}</p>
            </div>
          )}
        </div>

        {/* details, always open */}
        <div className="pt-3 mt-1 border-t border-white/8 flex flex-col gap-2.5">
          {details.map((d) => (
            <div
              key={d.label}
              className="flex items-baseline justify-between gap-4"
            >
              <span className="font-mono text-xs text-foreground/45 shrink-0">
                {d.label}
              </span>
              {d.href ? (
                <a
                  href={d.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pointer-events-auto relative z-30 font-mono text-xs text-foreground/80 hover:text-accent/80 transition-colors text-right"
                >
                  {d.value}&nbsp;↗
                </a>
              ) : (
                <span className="font-mono text-xs text-foreground/80 text-right">
                  {d.value}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* where the card goes (the card itself is the link) */}
        <p
          aria-hidden="true"
          className="mt-4 font-mono text-xs transition-colors duration-300"
          style={{ color: `${glow(glowRgb, hovered ? 0.9 : 0.55)}` }}
        >
          view profile&nbsp;↗
        </p>
      </div>
    </div>
  );
}
