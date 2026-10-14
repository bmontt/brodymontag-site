"use client";

// ── laser-2d ──────────────────────────────────────────────────────────────────
// The 2D tier's background: the same laser piece as the 3D stage's laser layer,
// evaluated on the CPU (lib/ascii-engine/laser-cpu.ts) from the same director
// (lib/director/laser.ts) and drawn with fillText into a canvas. It paints
// first on every visit (before the 3D stage crossfades in) and is what reduced-
// motion, low-end and lost-WebGL visitors keep.
//
//   motion OK      → ~30fps, scroll-driven like the 3D layer, row-tear glitch
//   reduced motion → no clock, no glitch: one still frame per chapter, redrawn
//                    only when the chapter changes (the controller registers no
//                    ScrollTriggers then, so chapters come from its observer)

import { useEffect, useRef } from "react";
import { journey } from "@/lib/journey-store";
import { chapters } from "@/lib/chapters";
import { FLAT, poseAt, resolveTrack, type Pose, type ResolvedTrack } from "@/lib/director/rig";
import { HOME_TRACK } from "@/lib/director/stations";
import { createLaserDirector } from "@/lib/director/laser";
import { makeLaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";
import { laserFrame, laserRgb } from "@/lib/ascii-engine/laser-cpu";
import { readAnchor } from "@/lib/laser-anchors";

const IDS = chapters.map((c) => c.id);
const CELL_W = 8;
const CELL_H = 22;
const FRAME_MS = 33;
// a gentle vignette — figures live in the gutters and rise from the floor now
const MASK = "radial-gradient(ellipse 125% 115% at 50% 45%, black 58%, transparent 100%)";

const h21 = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

export default function Laser2D({ dim = 1 }: { dim?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const dimRef = useRef(dim);
  dimRef.current = dim;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const u = makeLaserUniforms();
    const direct = createLaserDirector();
    const pose: Pose = { ...FLAT };
    let track: { bounds: readonly number[] | null; t: ResolvedTrack | null } = { bounds: null, t: null };
    let W = 0, H = 0, cols = 0, rows = 0, family = "monospace";
    // palette coordinate × brightness → css color (quantized, cached per frame mood)
    const styles = new Map<number, string>();
    let brightness = 1;
    const palStyle = (v: number) => {
      const k = Math.round(v * 128) * 8 + Math.round(brightness * 6);
      let s = styles.get(k);
      if (!s) {
        const [r, g, b] = laserRgb(Math.round(v * 128) / 128).map((c) => Math.min(255, Math.round(c * brightness)));
        styles.set(k, (s = `rgb(${r} ${g} ${b})`));
      }
      return s;
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CELL_W);
      rows = Math.ceil(H / CELL_H);
      u.uView.value.set(W, H);
      family = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "monospace";
    };

    // the reading column stays calm, like the 3D carve
    const calm = (x: number) => {
      const half = Math.min(512, W * 0.4);
      const inside = Math.min(1, Math.max(0, (half - Math.abs(x - W / 2)) / 120));
      return 1 - 0.55 * inside * inside * (3 - 2 * inside);
    };

    let last = 0;
    const draw = (now: number) => {
      const st = journey.state;
      let g = st.globalProgress;
      let bounds: readonly number[] = st.bounds;
      if (bounds.length !== IDS.length) {
        // reduced motion (no ScrollTriggers): even bounds, sit mid-chapter
        bounds = IDS.map((_, i) => i / IDS.length);
        g = (st.chapterIndex + 0.5) / IDS.length;
      }
      if (track.bounds !== bounds) track = { bounds, t: resolveTrack(HOME_TRACK, IDS, bounds) };
      poseAt(track.t!, g, H, pose);
      const time = reduced ? 0 : now / 1000;
      const delta = Math.min(0.1, last ? (now - last) / 1000 : 0);
      last = now;
      u.uLaserMix.value = dimRef.current;
      const lo = direct(u, {
        g, ids: IDS, bounds, timelineProgress: reduced ? -1 : st.timelineProgress,
        merge: pose.merge, ring: pose.ring, velocity: reduced ? 0 : st.velocity,
        time, delta: reduced ? 0 : delta, viewW: W, viewH: H, anchor: readAnchor,
      });
      const glitch = lo.glitch;
      brightness = Math.round(lo.brightness * 6) / 6;
      if (reduced) u.uJitter.value.set(0, 0);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.font = `${Math.round(CELL_H * (16 / 22))}px ${family}`;
      ctx.textBaseline = "top";
      // glitch: bands of three rows tear sideways for a tick
      const tick = Math.floor(time * 14);
      const tear = (row: number) => {
        if (reduced) return 0;
        const band = Math.floor(row / 3);
        const roll = h21(band, tick);
        return roll > 1 - glitch * 0.35 ? (h21(roll * 91.7, tick) - 0.5) * (14 + 90 * glitch) : 0;
      };
      let tearRow = -1, shift = 0;
      laserFrame(u, cols, rows, CELL_W, CELL_H, (col, row, c) => {
        if (row !== tearRow) { tearRow = row; shift = tear(row); }
        ctx.globalAlpha = Math.min(1, c.alpha);
        ctx.fillStyle = palStyle(c.pal);
        ctx.fillText(c.ch, col * CELL_W + shift, row * CELL_H);
      }, calm);
      ctx.globalAlpha = 1;
    };

    resize();
    let raf = 0;
    let unsub: (() => void) | undefined;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - last < FRAME_MS) return;
      draw(now);
    };
    const onResize = () => {
      resize();
      if (reduced) draw(performance.now());
    };
    window.addEventListener("resize", onResize);
    document.fonts.ready.then(() => {
      resize();
      if (reduced) draw(performance.now());
    });
    if (reduced) {
      draw(performance.now());
      unsub = journey.subscribe(() => draw(performance.now()));
    } else {
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      unsub?.();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    >
      <canvas ref={ref} className="absolute inset-0" />
    </div>
  );
}
