"use client";

import { useEffect, useRef, useState } from "react";
import { asciiConfig } from "@/lib/ascii-config";
import {
  precompute,
  computeNormals,
  getBakeCacheKey,
  lookupBakeCache,
  storeBakeCache,
} from "@/lib/ascii-engine/bake";
import { draw, buildLight, type TrailPt, type DitherBlend } from "@/lib/ascii-engine/draw";
import {
  DEFAULT_SKIN,
  SECTION_SKINS,
  ERA_SEQUENCE,
  evolveEra,
  lerpSkin,
  type EraSkin,
} from "@/lib/ascii-engine/skins";
import type { DrawConfig, DrawInput, FrameBuf } from "@/lib/ascii-engine/types";
import { chapters } from "@/lib/chapters";
import { journey } from "@/lib/journey-store";

/* ─── fixed structural constants ─────────────────────────────────────────────── */
const TRAIL_MAX = 18; // pointer ring-buffer cap

/* ─── phase velocity constants ───────────────────────────────────────────────── */
// baseRate = 1: at velocity 0 the orbit advances exactly +1 frame per drawn frame,
// identical to the original AsciiBg loop (frameIndex = (frameIndex+1) % frames).
const BASE_RATE = 1;
// GAIN: maps journey.state.velocity (px/s, signed) to extra frames/draw. Negative
// velocity (scroll up) → negative phaseVel → time reversal (seamless τ-loop).
const GAIN = 0.004;

/* ─── dynamic draw rate constants ────────────────────────────────────────────── */
const VELOCITY_THRESHOLD = 300; // px/s — above this, draw every rAF
const BOOST_DECAY_MS = 400;     // keep drawing every rAF this long after slowing

/* ─── per-skin palette + skin order ──────────────────────────────────────────── */
// Section skins are resolved by chapter index; build an ordered list once from
// the chapter manifest, falling back to DEFAULT_SKIN for any unmapped chapter.
const SKIN_LIST: EraSkin[] = chapters.map((c) => SECTION_SKINS[c.id] ?? DEFAULT_SKIN);
const LAST_SKIN = SKIN_LIST.length - 1;
const clampIdx = (i: number) => (i < 0 ? 0 : i > LAST_SKIN ? LAST_SKIN : i);

interface Palette { light: string[]; glow: string[]; }
const mkPalette = (s: EraSkin): Palette => ({
  light: buildLight(s.lightSat),
  glow: buildLight(Math.min(s.lightSat * 1.15, 1), 0.93),
});
// One palette pair per skin (sat differs per section/era). Faint tint → switching
// the palette at the blend midpoint is invisible, so no per-frame rebuild.
const PALETTES: Palette[] = SKIN_LIST.map(mkPalette);
const ERA_PALETTES: Palette[] = ERA_SEQUENCE.map(mkPalette);

const drawConfig: DrawConfig = {
  trailMs:           asciiConfig.trailMs,
  repelR:            asciiConfig.repelR,
  repelCore:         asciiConfig.repelCore,
  shimmerMin:        asciiConfig.shimmerMin,
  lightSharpness:    asciiConfig.lightSharpness,
  glowThresholdFrac: asciiConfig.glowThresholdFrac,
  contentDim:        asciiConfig.contentDim,
};

export default function Vessel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rawCanvas = canvasRef.current;
    if (!rawCanvas) return;
    const rawCtx = rawCanvas.getContext("2d");
    if (!rawCtx) return;
    const cv  = rawCanvas;
    const gfx = rawCtx;

    let animId      = 0;
    let lastTime    = 0;
    let frameFloat  = 0;   // float accumulator for hybrid phase velocity
    let buf: FrameBuf | null = null;
    let normX = new Float32Array(0);
    let normY = new Float32Array(0);
    let cellRand = new Float32Array(0); // stable per-cell [0,1) for density + dither
    let logW = 0, logH = 0;
    let dpr = 1;
    let gridW = asciiConfig.cellW, gridH = asciiConfig.cellH;
    let lightAngle    = Math.random() * Math.PI * 2;
    let lightHuePhase = 0;
    let boostUntil    = 0;

    const trail: TrailPt[] = [];

    // prefers-reduced-motion: draw one static frame per visible chapter, no rAF
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function recomputeField() {
      const key = getBakeCacheKey("default", logW, logH, dpr, gridW, gridH);
      const cached = lookupBakeCache(key);
      if (cached) {
        buf   = cached.buf;
        normX = cached.normX;
        normY = cached.normY;
      } else {
        buf = precompute(asciiConfig, logW, logH, gridW, gridH);
        const n = computeNormals(buf.cols, buf.rows, gridW, gridH, logW, logH);
        normX = n.normX;
        normY = n.normY;
        storeBakeCache({ key, stateId: "default", buf, normX, normY });
      }
      // stable per-cell randoms drive density culling + glyph dither
      const cells = buf.cols * buf.rows;
      cellRand = new Float32Array(cells);
      for (let i = 0; i < cells; i++) cellRand[i] = Math.random();
      frameFloat = 0;
    }

    function setup() {
      logW  = window.innerWidth;
      logH  = window.innerHeight;
      gridW = asciiConfig.cellW;
      gridH = asciiConfig.cellH;
      dpr   = window.devicePixelRatio || 1;
      cv.width        = logW * dpr;
      cv.height       = logH * dpr;
      cv.style.width  = `${logW}px`;
      cv.style.height = `${logH}px`;
      gfx.setTransform(1, 0, 0, 1, 0, 0);
      gfx.scale(dpr, dpr);
      gfx.font         = "16px 'Geist Mono', monospace";
      gfx.textBaseline = "top";
      recomputeField();
      setReady(true);
    }

    function onMove(e: PointerEvent) {
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.length > TRAIL_MAX) trail.shift();
    }

    // Resolve the skin + palette + optional glyph-dither context for this frame.
    function resolveSkin(): { skin: EraSkin; pal: Palette; blend: DitherBlend | null } {
      // reduced motion: no scroll blend — pick the visible chapter's skin flat.
      if (reducedMotion) {
        const ci = clampIdx(journey.state.chapterIndex);
        return { skin: SKIN_LIST[ci], pal: PALETTES[ci], blend: null };
      }
      // inside the horizontal timeline: evolve through the era sequence by its
      // pinned scroll progress (overrides the section blend entirely).
      const tp = journey.state.timelineProgress;
      if (tp >= 0) {
        const { skin, from, to, i, f } = evolveEra(tp);
        const pal = f < 0.5 ? ERA_PALETTES[i] : ERA_PALETTES[i + 1];
        const blend: DitherBlend | null =
          f > 0 && f < 1 && (from.chars !== to.chars || from.levelLut !== to.levelLut)
            ? { charsA: from.chars, lutA: from.levelLut, charsB: to.chars, lutB: to.levelLut, t: f }
            : null;
        return { skin, pal, blend };
      }
      const b = journey.state.blend;
      const from = clampIdx(b.from);
      const to   = clampIdx(b.to);
      const t    = b.t;
      if (t <= 0 || from === to) {
        return { skin: SKIN_LIST[from], pal: PALETTES[from], blend: null };
      }
      const A = SKIN_LIST[from];
      const B = SKIN_LIST[to];
      const skin = lerpSkin(A, B, t);
      const pal  = t < 0.5 ? PALETTES[from] : PALETTES[to];
      // dither only when the glyph vocabulary actually differs (else cheap path)
      const blend: DitherBlend | null =
        t < 1 && (A.chars !== B.chars || A.levelLut !== B.levelLut)
          ? { charsA: A.chars, lutA: A.levelLut, charsB: B.chars, lutB: B.levelLut, t }
          : null;
      return { skin, pal, blend };
    }

    function drawFrame(now: number, isStatic: boolean) {
      const cfg = asciiConfig;
      if (!isStatic) {
        // dynamic draw rate: every rAF when boosted, else fps-capped
        if (now < boostUntil) {
          // boosted — no gate
        } else {
          const msPerFrame = 1000 / cfg.fpsCap;
          if (now - lastTime < msPerFrame) return;
        }
        lastTime = now;
      }
      if (!buf) return;

      // advance stochastic light before draw (non-static frames only)
      if (!isStatic) {
        lightAngle    += cfg.lightDrift + (Math.random() - 0.5) * cfg.lightJitter;
        lightHuePhase += cfg.lightHueDrift;
      }

      // ── hybrid phase velocity ──────────────────────────────────────────────
      let frameIndex = 0;
      if (!isStatic) {
        const phaseVel = BASE_RATE + journey.state.velocity * GAIN;
        const N = buf.frames;
        frameFloat = (((frameFloat + phaseVel) % N) + N) % N;
        frameIndex = Math.floor(frameFloat);
        if (Math.abs(journey.state.velocity) > VELOCITY_THRESHOLD) {
          boostUntil = now + BOOST_DECAY_MS;
        }
      } else {
        frameIndex = Math.floor(frameFloat);
      }

      const { skin, pal, blend } = resolveSkin();

      const input: DrawInput = {
        frameIndex,
        // skins carry per-era intensity, so the past-driven dim is disabled here
        // (past = 0 → dim = styleAlphaMul). Hero stays full-bright via its skin.
        past: 0,
        isStatic,
        now,
        lightAngle,
        lightHuePhase,
      };

      draw(
        gfx,
        buf,
        normX,
        normY,
        logW,
        logH,
        gridW,
        gridH,
        trail,
        pal.light,
        pal.glow,
        drawConfig,
        input,
        skin,
        cellRand,
        blend,
      );
    }

    function rafLoop(now: number) {
      animId = requestAnimationFrame(rafLoop);
      drawFrame(now, false);
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        setup();
        if (reducedMotion) drawFrame(performance.now(), true);
      }, 200);
    };

    // visibility change: pause rAF when tab hidden, resume when visible
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animId !== 0) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else if (!reducedMotion && animId === 0) {
        lastTime = 0; // reset so there is no time jump
        animId = requestAnimationFrame(rafLoop);
      }
    };

    setup();

    // reduced motion: one static frame, redrawn when the visible chapter changes
    // so the static field still reflects each era's skin. No rAF loop.
    let unsubChapter: (() => void) | undefined;
    if (reducedMotion) {
      drawFrame(performance.now(), true);
      unsubChapter = journey.subscribe(() => drawFrame(performance.now(), true));
    } else {
      animId = requestAnimationFrame(rafLoop);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (animId !== 0) cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      unsubChapter?.();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
      style={{
        opacity: ready ? 1 : 0,
        // delayed start so the hero typing animation leads, then they overlap
        transition: "opacity 1.6s ease 0.7s",
        maskImage:
          "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 85% 75% at 50% 40%, black 35%, transparent 88%)",
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
