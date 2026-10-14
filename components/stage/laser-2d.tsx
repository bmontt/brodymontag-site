"use client";

// ── laser-2d ──────────────────────────────────────────────────────────────────
// The 2D tier's background: the same laser piece as the 3D stage's laser layer,
// evaluated on the CPU (lib/ascii-engine/laser-cpu.ts) from the same director
// (lib/director/laser.ts) and drawn with fillText into a canvas. It paints
// first on every visit (before the 3D stage crossfades in) and is what reduced-
// motion, low-end and lost-WebGL visitors keep.
//
//   motion OK      → ~30fps, scroll-driven like the 3D layer
//   reduced motion → no clock, no glides: still frames, redrawn only
//                    when the layout the figures sit in moves (scroll, route,
//                    hover, resize)

import { useEffect, useRef } from "react";
import { journey } from "@/lib/journey-store";
import { createLaserDirector, laserInputFrom, noteKnot, TRANSITION_MS } from "@/lib/director/laser";
import { TITLE_ASPECT, TITLE_TEXT, titleCanvas } from "@/lib/ascii-engine/title-mask";
import { makeLaserUniforms } from "@/lib/ascii-engine/gl/laser-shader";
import { laserFrame, laserRgb, shimmerHue } from "@/lib/ascii-engine/laser-cpu";
import { readAnchor } from "@/lib/laser-anchors";

const CELL_W = 8;
const CELL_H = 22;
const FRAME_MS = 33;
// a gentle vignette — figures live in the gutters and rise from the floor now
const MASK = "radial-gradient(ellipse 125% 115% at 50% 45%, black 58%, transparent 100%)";

export default function Laser2D() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const u = makeLaserUniforms();
    const direct = createLaserDirector();
    let W = 0, H = 0, cols = 0, rows = 0, family = "monospace";
    // palette coordinate × hue × brightness → css color (quantized + cached;
    // the hue only varies on the sound scale — the shimmer)
    let title: { text: string; data: Uint8ClampedArray; w: number; h: number } = { text: "", data: new Uint8ClampedArray(4), w: 1, h: 1 };
    const styles = new Map<number, string>();
    let brightness = 1;
    const palStyle = (v: number, hue: number) => {
      const pq = Math.round(v * 128);
      const hq = v < 0.5 ? 0 : Math.round(hue / 5) % 72;
      const k = (pq * 72 + hq) * 8 + Math.round(brightness * 6);
      let s = styles.get(k);
      if (!s) {
        const [r, g, b] = laserRgb(pq / 128, hq * 5).map((c) => Math.min(255, Math.round(c * brightness)));
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
      const time = reduced ? 0 : now / 1000;
      const delta = reduced ? 0 : Math.min(0.1, last ? (now - last) / 1000 : 0);
      last = now;
      u.uLaserMix.value = 1;
      const lo = direct(u, laserInputFrom(st, reduced ? 0 : now, delta, W, H, readAnchor, TRANSITION_MS));
      noteKnot(lo);
      const text = lo.title ? TITLE_TEXT[st.focus.route.kind] : undefined;
      if (text && title.text !== text) {
        const c = titleCanvas(text);
        title = { text, data: c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
        u.uTitleB.value.y = TITLE_ASPECT;
      }
      brightness = Math.round(lo.brightness * 6) / 6;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      ctx.font = `${Math.round(CELL_H * (16 / 22))}px ${family}`;
      ctx.textBaseline = "top";
      laserFrame(u, cols, rows, CELL_W, CELL_H, (col, row, c) => {
        ctx.globalAlpha = Math.min(1, c.alpha);
        ctx.fillStyle = palStyle(c.pal, shimmerHue(time, col, row));
        ctx.fillText(c.ch, col * CELL_W, row * CELL_H);
      }, calm, lo.title ? title : null);
      ctx.globalAlpha = 1;
    };

    resize();
    // motion: ~30fps. reduced motion: no clock — redraw only when something the
    // figures depend on changes (scroll moves their anchors, route, hover, size)
    let raf = 0;
    let sig = "";
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden) return;
      if (reduced) {
        const st = journey.state;
        const next = `${Math.round(window.scrollY)}|${st.focus.route.kind}|${st.focus.hover}|${W}x${H}|${st.timelineProgress}`;
        if (next === sig) return;
        sig = next;
      } else if (now - last < FRAME_MS) return;
      draw(now);
    };
    const onResize = () => {
      resize();
      sig = "";
    };
    window.addEventListener("resize", onResize);
    document.fonts.ready.then(onResize);
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
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
