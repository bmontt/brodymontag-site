"use client";

// ── promo-film ────────────────────────────────────────────────────────────────
// The set film on /music: untitled, edge to edge, its borders feathered into the
// page so it reads as rising out of the background. The clip (the last 7.6 s of
// John Narvell's Echostage edit) loops muted, playing only while it's on screen.
// While it's on screen a veil fades in over the stage (above the laser layer at
// z-10, below the reading layer at z-20), so the beams recede and the film holds
// the room. The clip is fetched once the film is within a screen and a half.
// When it can't autoplay — reduced motion, or a phone in Low Power Mode,
// where iOS refuses autoplay — it shows its first frame and a play button:
// playback the visitor starts is allowed in both cases.

import { useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useFullBleed } from "@/components/full-bleed";

interface Film {
  src: string;
  poster: string;
  /** read to screen readers (aria-label); not shown */
  caption: string;
}

// both axes feathered, intersected: the film fades out on all four sides. Phones
// keep only the top and bottom (--feather-x 0): fading a seventh of a narrow
// screen off each side left the film reading as inset, not edge to edge
const FEATHER =
  "linear-gradient(to right, transparent, #000 var(--feather-x), #000 calc(100% - var(--feather-x)), transparent), " +
  "linear-gradient(to bottom, transparent, #000 16%, #000 84%, transparent)";

/** how much the veil covers the stage at its peak (film centered on screen) */
const VEIL_MAX = 0.9;

export default function PromoFilm({ film }: { film: Film }) {
  const slot = useRef<HTMLElement>(null);
  const bleed = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);
  // autoplay isn't available (reduced motion, or the browser refused): offer a button
  const [needsTap, setNeedsTap] = useState(false);
  // the visitor started it by hand: from then on it plays whenever on screen
  const started = useRef(false);
  const [mounted, setMounted] = useState(false);

  // edge to edge (components/full-bleed.tsx)
  useFullBleed(slot, bleed);
  useEffect(() => setMounted(true), []);

  // fetch the clip once it's near; play only while it's on screen
  useEffect(() => {
    const s = slot.current;
    const v = video.current;
    if (!s || !v) return;
    // iOS only autoplays a video it sees as muted and inline: set both as
    // properties and attributes (React doesn't render `muted` to the markup)
    v.muted = true;
    v.defaultMuted = true;
    v.setAttribute("muted", "");
    v.setAttribute("playsinline", "");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) setNeedsTap(true);
    const auto = () => !reduce || started.current;
    let onScreen = false;
    const tryPlay = () => {
      if (!auto() || !onScreen || !v.paused || !v.currentSrc) return;
      // refused (Low Power Mode, or a browser policy): fall back to the button
      v.play().then(() => setNeedsTap(false), () => setNeedsTap(true));
    };
    // the clip can arrive after the film is already on screen (phones: it sits
    // right under the opener): start it once it can play, not only on scroll
    v.addEventListener("canplay", tryPlay);
    v.addEventListener("loadeddata", tryPlay);
    const near = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting) && !reduce) {
          setLoad(true);
          near.disconnect();
        }
      },
      { rootMargin: "150% 0px" },
    );
    const vis = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          onScreen = e.isIntersecting;
          if (onScreen) tryPlay();
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
      v.removeEventListener("canplay", tryPlay);
      v.removeEventListener("loadeddata", tryPlay);
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

  // a tap is a user gesture, so play() is allowed even where autoplay isn't —
  // but only inside the handler itself: commit the source synchronously (a
  // later render re-applying it would restart loading and abort the play)
  const playByHand = () => {
    const v = video.current;
    if (!v) return;
    started.current = true;
    flushSync(() => setLoad(true));
    v.play().then(() => setNeedsTap(false), () => setNeedsTap(true));
  };

  return (
    <figure ref={slot}>
      <div ref={bleed} className="relative" style={{ height: "min(56.25vw, 88svh)" }}>
        {needsTap && (
          <button
            type="button"
            onClick={playByHand}
            aria-label={`play the film: ${film.caption}`}
            className="absolute inset-0 z-10 flex items-center justify-center"
          >
            <span className="flex items-center gap-3 rounded-full border border-white/25 bg-black/40 px-5 py-2.5 font-mono text-xs text-foreground/88 backdrop-blur-sm transition-colors hover:border-white/50 hover:text-foreground">
              <span aria-hidden="true">▶</span> play film
            </span>
          </button>
        )}
        <video
          ref={video}
          className="h-full w-full object-cover [--feather-x:0%] md:[--feather-x:14%]"
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
