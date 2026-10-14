"use client";

// ── laser-2d ──────────────────────────────────────────────────────────────────
// The 2D tier's background: the same laser piece as the 3D stage's laser layer,
// evaluated on the CPU (lib/ascii-engine/laser-cpu.ts) from the same director
// (lib/director/laser.ts) and drawn with fillText into a canvas. It paints
// first on every visit (before the 3D stage crossfades in) and is what reduced-
// motion, low-end and lost-WebGL visitors keep.
//
// The painting runs in a worker (laser-2d.worker.ts) on an OffscreenCanvas:
// the page only runs the director — it reads layout — and posts each frame's
// packed uniforms, so the main thread stays free for input and scroll on the
// very devices this tier is for. Where a worker can't paint (no
// OffscreenCanvas, or the glyph font won't load there) it paints here instead,
// with the same painter (laser-paint.ts).
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
import { LASER_PACK_SIZE, packLaser } from "@/lib/ascii-engine/laser-pack";
import { createLaserPainter, type TitleMask } from "@/lib/ascii-engine/laser-paint";
import { LASER_DOT, LASER_STROKES } from "@/lib/ascii-engine/laser-cpu";
import { readAnchor } from "@/lib/laser-anchors";

// the worker paints every display frame (a frame still waits while it's busy
// with the last); painting on the page's own thread is held to 60 fps so it
// never competes with scrolling. Motion is time-based either way.
const FRAME_MS_WORKER = 0;
const FRAME_MS_MAIN = 16;
// a gentle vignette — figures live in the gutters and rise from the floor now
const MASK = "radial-gradient(ellipse 125% 115% at 50% 45%, black 58%, transparent 100%)";

type Face = { family: string; src: string; descriptors: FontFaceDescriptors };

/** The page's @font-face rules for every family in the glyph font's stack
 *  (next/font adds a metric-matched fallback face), with absolute URLs — the
 *  worker registers the same faces, so the same glyphs come out. */
function glyphFaces(family: string): Face[] {
  const names = new Set(family.split(",").map((f) => f.trim().replace(/^['"]|['"]$/g, "")));
  const out: Face[] = [];
  // (sizeAdjust is newer than the DOM typings)
  const DESCRIPTORS: [string, string][] = [
    ["font-style", "style"], ["font-weight", "weight"], ["font-stretch", "stretch"], ["unicode-range", "unicodeRange"],
    ["size-adjust", "sizeAdjust"], ["ascent-override", "ascentOverride"], ["descent-override", "descentOverride"],
    ["line-gap-override", "lineGapOverride"], ["font-feature-settings", "featureSettings"],
  ];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const r of Array.from(rules)) {
      if (!(r instanceof CSSFontFaceRule)) continue;
      const fam = r.style.getPropertyValue("font-family").trim().replace(/^['"]|['"]$/g, "");
      if (!names.has(fam)) continue;
      const base = sheet.href ?? location.href;
      const src = r.style.getPropertyValue("src").replace(/url\((['"]?)([^'")]+)\1\)/g, (_m, _q, url) => `url("${new URL(url, base).href}")`);
      const d: Record<string, string> = {};
      for (const [css, key] of DESCRIPTORS) {
        const v = r.style.getPropertyValue(css).trim();
        if (v) d[key] = v;
      }
      out.push({ family: fam, src, descriptors: d as FontFaceDescriptors });
    }
  }
  return out;
}

const monoFamily = () => getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim() || "monospace";

export default function Laser2D() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!host.current) return;
    // the canvas is made here, per run: one handed to a worker can't be handed
    // again (Strict Mode runs this twice; a fallback needs a fresh one)
    const hostEl = host.current;
    const freshCanvas = () => {
      const c = document.createElement("canvas");
      c.className = "absolute inset-0";
      hostEl.appendChild(c);
      return c;
    };
    let canvas = freshCanvas();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const u = makeLaserUniforms();
    const direct = createLaserDirector();
    let W = 0, H = 0, dpr = 1, family = "monospace";
    let titleText = "";
    let mainTitle: TitleMask | null = null;

    // ── the painter: a worker (OffscreenCanvas) or, failing that, right here ──
    let worker: Worker | null = null;
    let painter: ReturnType<typeof createLaserPainter> | null = null;
    let ready = false, busy = false;
    let sig = "";
    let litWaiter: ((n: number) => void) | null = null;
    const buf = new Float64Array(LASER_PACK_SIZE);
    family = monoFamily();
    const paintHere = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      painter = createLaserPainter(ctx);
      ready = true;
    };
    // a worker that can't paint (no font there, or it failed): paint here on a fresh canvas
    const fallBack = () => {
      worker?.terminate();
      worker = null;
      busy = false;
      canvas.remove();
      canvas = freshCanvas();
      paintHere();
      resize();
      sig = "";
    };
    // ?laser2d=main paints here (A/B). A worker paints only where its glyphs
    // can match this page's pixel for pixel: an OffscreenCanvas doesn't inherit
    // the page's font smoothing (macOS: -webkit-font-smoothing: antialiased),
    // and "geometricPrecision" text rendering reproduces it exactly — so the
    // browser must support textRendering there; anywhere else paints here.
    const forceMain = new URLSearchParams(window.location.search).get("laser2d") === "main";
    const matchable =
      typeof OffscreenCanvasRenderingContext2D !== "undefined" && "textRendering" in OffscreenCanvasRenderingContext2D.prototype;
    const textRendering: CanvasTextRendering =
      /Mac/.test(navigator.platform) && getComputedStyle(document.documentElement).getPropertyValue("-webkit-font-smoothing") === "antialiased"
        ? "geometricPrecision"
        : "auto";
    const faces = !forceMain && matchable && "transferControlToOffscreen" in canvas && typeof Worker !== "undefined" ? glyphFaces(family) : [];
    (window as unknown as { __laser2dMode?: string }).__laser2dMode = faces.length ? "worker" : "main";
    if (faces.length) {
      const off = canvas.transferControlToOffscreen();
      worker = new Worker(new URL("./laser-2d.worker.ts", import.meta.url), { type: "module" });
      worker.onmessage = (e: MessageEvent) => {
        const m = e.data;
        if (m.type === "ready") {
          ready = true;
          resize();
        } else if (m.type === "done") busy = false;
        else if (m.type === "lit") litWaiter?.(m.n);
        else if (m.type === "nofont") fallBack();
      };
      worker.onerror = fallBack;
      worker.postMessage({ type: "init", canvas: off, faces, family, glyphs: LASER_STROKES.join("") + LASER_DOT, textRendering }, [off]);
    } else paintHere();
    // tests: lit pixels, wherever the painting happens
    (window as unknown as { __laser2dLit?: () => Promise<number> }).__laser2dLit = () =>
      worker ? new Promise((res) => { litWaiter = res; worker!.postMessage({ type: "lit" }); }) : Promise.resolve(painter!.lit());

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // the stage box (globals.css .stage-box): the large viewport, so mobile
      // toolbars coming and going don't resize the piece mid-scroll
      W = hostEl.clientWidth || window.innerWidth;
      H = hostEl.clientHeight || window.innerHeight;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      u.uView.value.set(W, H);
      family = monoFamily();
      if (worker) {
        if (ready) worker.postMessage({ type: "resize", w: W, h: H, dpr, family });
      } else painter!.resize(W, H, dpr, family);
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
      if (text && titleText !== text) {
        titleText = text;
        const c = titleCanvas(text);
        const mask = { data: c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
        u.uTitleB.value.y = TITLE_ASPECT;
        if (worker) worker.postMessage({ type: "title", mask }, [mask.data.buffer]);
        else mainTitle = mask;
      }
      if (worker) {
        packLaser(u, buf);
        busy = true;
        worker.postMessage({ type: "frame", buf, time, bright: lo.brightness, titled: lo.title });
      } else painter!.paint(u, time, lo.brightness, lo.title ? mainTitle : null);
    };

    resize();
    // motion: the display's rate in the worker, 60 fps on the main thread.
    // reduced motion: no clock — redraw only when something the figures depend
    // on changes (scroll moves their anchors, route, hover, size). A frame waits
    // while the worker is still painting the last one.
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || !ready || busy) return;
      if (reduced) {
        const st = journey.state;
        const next = `${Math.round(window.scrollY)}|${st.focus.route.kind}|${st.focus.hover}|${W}x${H}|${st.timelineProgress}`;
        if (next === sig) return;
        sig = next;
      } else if (now - last < (worker ? FRAME_MS_WORKER : FRAME_MS_MAIN) - 1) return;
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
      worker?.terminate();
      canvas.remove();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="stage-box pointer-events-none z-10 overflow-hidden"
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
    />
  );
}
