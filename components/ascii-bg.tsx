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
import { draw, buildLight, type TrailPt } from "@/lib/ascii-engine/draw";
import { DEFAULT_SKIN } from "@/lib/ascii-engine/skins";
import type { DrawConfig, DrawInput, FrameBuf } from "@/lib/ascii-engine/types";

/* ─── fixed structural constants ─────────────────────────────────────────────── */
const TRAIL_MAX = 18; // pointer ring-buffer cap

const drawConfig: DrawConfig = {
  trailMs:           asciiConfig.trailMs,
  repelR:            asciiConfig.repelR,
  repelCore:         asciiConfig.repelCore,
  shimmerMin:        asciiConfig.shimmerMin,
  lightSharpness:    asciiConfig.lightSharpness,
  glowThresholdFrac: asciiConfig.glowThresholdFrac,
  contentDim:        asciiConfig.contentDim,
};

export default function AsciiBg({ subpage = false }: { subpage?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const rawCanvas = canvasRef.current;
    if (!rawCanvas) return;
    const rawCtx = rawCanvas.getContext("2d");
    if (!rawCtx) return;
    const cv  = rawCanvas;
    const gfx = rawCtx;

    let animId     = 0;
    let lastTime   = 0;
    let frameIndex = 0;
    let buf: FrameBuf | null = null;
    let normX = new Float32Array(0);
    let normY = new Float32Array(0);
    let logW = 0, logH = 0;
    let dpr = 1;
    let gridW = asciiConfig.cellW, gridH = asciiConfig.cellH;
    let lightPalette = buildLight(asciiConfig.lightSat);
    // brighter, slightly more saturated band for the glow halo on peak cells
    const glowPalette = buildLight(Math.min(asciiConfig.lightSat * 1.15, 1), 0.93);
    let lightAngle    = Math.random() * Math.PI * 2;
    let lightHuePhase = 0;
    let scrollY = 0;      // drives the past-hero readability calm

    const trail: TrailPt[] = [];

    // prefers-reduced-motion check
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
      frameIndex = 0;
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
      gfx.font          = "16px 'Geist Mono', monospace";
      gfx.textBaseline  = "top";
      recomputeField();
      lightPalette = buildLight(asciiConfig.lightSat);
      setReady(true);
    }

    function onMove(e: PointerEvent) {
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.length > TRAIL_MAX) trail.shift();
    }

    function drawFrame(now: number, isStatic: boolean) {
      const cfg = asciiConfig;
      if (!isStatic) {
        const msPerFrame = 1000 / cfg.fpsCap;
        if (now - lastTime < msPerFrame) return;
        lastTime = now;
      }
      if (!buf) return;

      // stochastic directional light — advance angle before draw (non-static only).
      // draw() reads lightAngle/lightHuePhase as-is without mutating them.
      if (!isStatic) {
        lightAngle    += cfg.lightDrift + (Math.random() - 0.5) * cfg.lightJitter;
        lightHuePhase += cfg.lightHueDrift;
      }

      // past-hero readability calm: subpage → fully dimmed; else smoothstep of scroll.
      const pRaw = Math.min(Math.max(scrollY / (logH * 0.8), 0), 1);
      const past = subpage ? 1 : pRaw * pRaw * (3 - 2 * pRaw);   // smoothstep

      const input: DrawInput = {
        frameIndex,
        past,
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
        lightPalette,
        glowPalette,
        drawConfig,
        input,
        DEFAULT_SKIN,
      );

      if (!isStatic) {
        frameIndex = (frameIndex + 1) % buf.frames;
      }
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
        if (reducedMotion) {
          drawFrame(performance.now(), true);
        }
      }, 200);
    };

    const onScroll = () => { scrollY = window.scrollY; };

    // visibility change: pause rAF when tab is hidden, resume when visible
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animId !== 0) {
          cancelAnimationFrame(animId);
          animId = 0;
        }
      } else {
        if (!reducedMotion && animId === 0) {
          lastTime = 0;   // reset so there is no time jump
          animId = requestAnimationFrame(rafLoop);
        }
      }
    };

    setup();
    scrollY = window.scrollY;

    if (reducedMotion) {
      // draw a single static frame and stop — no rAF loop
      drawFrame(performance.now(), true);
    } else {
      animId = requestAnimationFrame(rafLoop);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onMove);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (animId !== 0) cancelAnimationFrame(animId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [subpage]);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
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
