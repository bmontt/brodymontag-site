"use client";

// ── promo-film ────────────────────────────────────────────────────────────────
// The set film on /music: untitled, edge to edge, its borders feathered into the
// page so it reads as rising out of the background. The clip (the last 7.6 s of
// John Narvell's Echostage edit) loops muted, playing only while it's on screen.
// While it's on screen a veil fades in over the stage (above the laser layer at
// z-10, below the reading layer at z-20), so the beams recede and the film holds
// the room. The clip is fetched once the film is within a screen and a half.
// Reduced motion gets the first frame and no playback.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface Film {
  src: string;
  poster: string;
  caption: string;
  credit: string;
  href?: string;
}

// both axes feathered, intersected: the film fades out on all four sides
const FEATHER =
  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent), " +
  "linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent)";

/** how much the veil covers the stage at its peak (film centered on screen) */
const VEIL_MAX = 0.9;

export default function PromoFilm({ film }: { film: Film }) {
  const slot = useRef<HTMLElement>(null);
  const bleed = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  const [mounted, setMounted] = useState(false);

  // edge to edge: pull the film out of its column to the viewport's edges
  // (the column sits in a grid beside the laser gutter, so measure, not 50vw)
  useEffect(() => {
    setMounted(true);
    const s = slot.current;
    const b = bleed.current;
    if (!s || !b) return;
    const fit = () => {
      const left = s.getBoundingClientRect().left;
      b.style.marginLeft = `${-left}px`;
      b.style.width = `${document.documentElement.clientWidth}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, []);

  // fetch the clip once it's near; play only while it's on screen
  useEffect(() => {
    const s = slot.current;
    const v = video.current;
    if (!s || !v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const near = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setLoad(true);
          near.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    const vis = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (e.isIntersecting) v.play().catch(() => {});
          else v.pause();
        }
      },
      { threshold: 0.25 },
    );
    near.observe(s);
    vis.observe(v);
    return () => {
      near.disconnect();
      vis.disconnect();
    };
  }, []);

  // veil: 0 while the film is off screen, rising to VEIL_MAX as its middle
  // reaches the middle of the viewport
  useEffect(() => {
    const b = bleed.current;
    if (!b || !mounted) return;
    let raf = 0;
    const tick = () => {
      raf = 0;
      const el = veil.current;
      if (!el) return;
      const r = b.getBoundingClientRect();
      const vh = window.innerHeight;
      const dist = Math.abs(r.top + r.height / 2 - vh / 2);
      const reach = vh / 2 + r.height / 2; // fully off screen at this distance
      const t = Math.min(1, Math.max(0, 1 - dist / reach));
      el.style.opacity = String(t * t * (3 - 2 * t) * VEIL_MAX);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted]);

  return (
    <figure ref={slot}>
      <div ref={bleed} className="relative" style={{ height: "min(56.25vw, 88svh)" }}>
        <video
          ref={video}
          className="h-full w-full object-cover"
          style={{ maskImage: FEATHER, WebkitMaskImage: FEATHER, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
          poster={film.poster}
          src={load ? film.src : undefined}
          muted
          loop
          playsInline
          preload="none"
          aria-label={film.caption}
        />
      </div>
      <figcaption className="-mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-xs">
        {film.href ? (
          <Link href={film.href} className="text-foreground/45 transition-colors hover:text-foreground/90">
            {film.caption} ↗
          </Link>
        ) : (
          <span className="text-foreground/45">{film.caption}</span>
        )}
        <span className="text-foreground/25">{film.credit}</span>
      </figcaption>
      {mounted &&
        createPortal(
          <div
            ref={veil}
            aria-hidden="true"
            className="pointer-events-none fixed inset-0 bg-background"
            style={{ zIndex: 15, opacity: 0 }}
          />,
          document.body,
        )}
    </figure>
  );
}
