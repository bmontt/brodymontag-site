"use client";

import { useEffect, useRef, useState } from "react";
import { asciiConfig } from "@/lib/ascii-config";

/* ─── fixed structural constants (not user-tunable) ─────────────────────────── */
const MIN_FRAMES   = 180;   // seamless-loop length bounds (derived from dt)
const MAX_FRAMES   = 480;
const TWO_PI       = Math.PI * 2;
const TRAIL_MAX    = 18;    // pointer ring-buffer cap
const STEPS        = 90;    // light-tint palette resolution

// Char vocabulary, ordered by amplitude level (index 0 = empty)
const CHARS: readonly string[] = [" ", "·", "∘", "╌", "┼", "◆"];

// Calm steel → neutral base tones (matches site palette); shine is added on top
const STYLES: readonly string[] = [
  "",
  "rgba(190,200,215,0.060)",
  "rgba(190,200,215,0.092)",
  "rgba(210,212,218,0.112)",
  "rgba(210,212,218,0.098)",
  "rgba(210,212,218,0.110)",
];

/* ─── bake cache ─────────────────────────────────────────────────────────────── */
interface CacheEntry {
  key: string;
  buf: FrameBuf;
  normX: Float32Array<ArrayBuffer>;
  normY: Float32Array<ArrayBuffer>;
}

const BAKE_CACHE_MAX = 4;
const bakeCache: CacheEntry[] = [];

function getBakeCacheKey(logW: number, logH: number, dpr: number, gridW: number, gridH: number): string {
  return `${logW}x${logH}@${dpr}@${gridW}x${gridH}`;
}

function lookupBakeCache(key: string): CacheEntry | undefined {
  return bakeCache.find(e => e.key === key);
}

function storeBakeCache(entry: CacheEntry): void {
  // evict oldest if at cap
  if (bakeCache.length >= BAKE_CACHE_MAX) {
    bakeCache.shift();
  }
  bakeCache.push(entry);
}

/* ─── light-tint palette (faint, near-white) ────────────────────────────────── */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (hp < 1)      [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else             [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ];
}

// Near-white tints whose faint hue drifts; alpha is applied live via globalAlpha
function buildLight(sat: number, lightness = 0.86): string[] {
  return Array.from({ length: STEPS }, (_, i) => {
    const [r, g, b] = hslToRgb((i / STEPS) * 360, sat, lightness);
    return `rgb(${r},${g},${b})`;
  });
}

/* ─── physics ───────────────────────────────────────────────────────────────── */
function ampToLevel(amp: number): number {
  if (amp < 0.05 || amp > 0.82) return 0;
  if (amp < 0.14) return 1;
  if (amp < 0.28) return 2;
  if (amp < 0.46) return 3;
  if (amp < 0.65) return 4;
  return 5;
}

interface FrameBuf {
  data: Uint8Array;
  cols: number;
  rows: number;
  frames: number;
}

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Bakes a *seamless* loop of the two-body interference field.
 * Every time term is a function of loop-phase τ = f/N with integer cycles per
 * loop, so frame N ≡ frame 0 (no jump, matched velocity at the seam):
 *   • orbit angle  θ = 2π·τ            — exactly one revolution per loop
 *   • wave phase   ψ = 2π·Kwave·τ      — integer wave cycles per loop
 *   • breath       s = (1-cos(2π·osc·τ))/2 ∈ [0,1] — orbitFrac/waveFreq sweep
 * N is derived from dt so dt still reads as "orbital speed".
 */
function precompute(logW: number, logH: number, cellW: number, cellH: number): FrameBuf {
  const cfg   = asciiConfig;
  const N     = clamp(Math.round(TWO_PI / cfg.dt), MIN_FRAMES, MAX_FRAMES);
  const Kwave = Math.max(1, Math.round(cfg.waveSpeed * 6));
  const Kosc  = Math.max(1, Math.round(cfg.oscCycles));
  const cols  = Math.ceil(logW / cellW);
  const rows  = Math.ceil(logH / cellH);
  const cells = cols * rows;
  const data  = new Uint8Array(N * cells);
  const cx    = logW / 2;
  const cy    = logH / 2;
  const minWH = Math.min(logW, logH);
  const lensR = cfg.lensR, gG = cfg.lensG;
  const lens = (r: number) => (r < lensR ? r / (1 + gG * (1 - r / lensR) ** 2) : r);

  const oFracLo = cfg.orbitFracLo, oFracHi = cfg.orbitFracHi;
  const wFreqLo = cfg.waveFreqLo,  wFreqHi = cfg.waveFreqHi;

  for (let f = 0; f < N; f++) {
    const tau = f / N;
    const s   = (1 - Math.cos(TWO_PI * Kosc * tau)) / 2;     // synced breath driver
    const orbitR = minWH * (oFracLo + s * (oFracHi - oFracLo));
    const wf  = wFreqLo + s * (wFreqHi - wFreqLo);
    const theta = TWO_PI * tau;
    const psi   = TWO_PI * Kwave * tau;
    const cosT = Math.cos(theta), sinT = Math.sin(theta);
    const x1 = cx + orbitR * cosT, y1 = cy + orbitR * sinT;
    const x2 = cx - orbitR * cosT, y2 = cy - orbitR * sinT;

    for (let row = 0; row < rows; row++) {
      const py  = row * cellH + cellH / 2;
      const off = f * cells + row * cols;
      for (let col = 0; col < cols; col++) {
        const px  = col * cellW + cellW / 2;
        const dx1 = px - x1, dy1 = py - y1;
        const dx2 = px - x2, dy2 = py - y2;
        const r1l = lens(Math.hypot(dx1, dy1));
        const r2l = lens(Math.hypot(dx2, dy2));
        const wave =
          Math.sin(wf * r1l - psi + Math.atan2(dy1, dx1)) +
          Math.sin(wf * r2l - psi + Math.atan2(dy2, dx2));
        data[off + col] = ampToLevel(Math.min(Math.abs(wave) * 0.5, 1.0));
      }
    }
  }

  return { data, cols, rows, frames: N };
}

// Per-cell outward normal from screen center → drives the directional light.
function computeNormals(cols: number, rows: number, cellW: number, cellH: number, logW: number, logH: number): { normX: Float32Array<ArrayBuffer>; normY: Float32Array<ArrayBuffer> } {
  const normX = new Float32Array(cols * rows);
  const normY = new Float32Array(cols * rows);
  const ctrX = logW / 2, ctrY = logH / 2;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const dx = col * cellW + cellW / 2 - ctrX;
      const dy = row * cellH + cellH / 2 - ctrY;
      const len = Math.hypot(dx, dy) || 1;
      const i = row * cols + col;
      normX[i] = dx / len;
      normY[i] = dy / len;
    }
  }
  return { normX, normY };
}

/* ─── runtime types ─────────────────────────────────────────────────────────── */
interface TrailPt { x: number; y: number; t: number; }

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

    let animId = 0;
    let lastTime = 0;
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
    let lightAngle = Math.random() * Math.PI * 2;
    let lightHuePhase = 0;
    let scrollY = 0;                       // drives the past-hero readability calm
    let colMul = new Float32Array(0);      // per-column intensity multiplier

    const trail: TrailPt[] = [];

    // prefers-reduced-motion check
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function recomputeField() {
      const key = getBakeCacheKey(logW, logH, dpr, gridW, gridH);
      const cached = lookupBakeCache(key);
      if (cached) {
        buf = cached.buf;
        normX = cached.normX;
        normY = cached.normY;
      } else {
        buf = precompute(logW, logH, gridW, gridH);
        const n = computeNormals(buf.cols, buf.rows, gridW, gridH, logW, logH);
        normX = n.normX;
        normY = n.normY;
        storeBakeCache({ key, buf, normX, normY });
      }
      frameIndex = 0;
    }

    function setup() {
      logW = window.innerWidth;
      logH = window.innerHeight;
      gridW = asciiConfig.cellW;
      gridH = asciiConfig.cellH;
      dpr = window.devicePixelRatio || 1;
      cv.width  = logW * dpr;
      cv.height = logH * dpr;
      cv.style.width  = `${logW}px`;
      cv.style.height = `${logH}px`;
      gfx.setTransform(1, 0, 0, 1, 0, 0);
      gfx.scale(dpr, dpr);
      gfx.font = "16px 'Geist Mono', monospace";
      gfx.textBaseline = "top";
      recomputeField();
      setReady(true);
    }

    function onMove(e: PointerEvent) {
      trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
      if (trail.length > TRAIL_MAX) trail.shift();
    }

    function suppression(px: number, py: number, now: number): number {
      const cfg = asciiConfig;
      let supp = 0;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        const ageF = 1 - (now - p.t) / cfg.trailMs;
        if (ageF <= 0) continue;
        const r = cfg.repelR * (0.4 + 0.6 * ageF);
        const d = Math.hypot(px - p.x, py - p.y);
        if (d >= r) continue;
        if (d < cfg.repelCore) return 1;
        const u = 1 - d / r;
        const s = u * u * (3 - 2 * u) * ageF;
        if (s > supp) supp = s;
      }
      return supp > 1 ? 1 : supp;
    }

    function drawFrame(now: number, isStatic: boolean) {
      const cfg = asciiConfig;
      if (!isStatic) {
        const msPerFrame = 1000 / cfg.fpsCap;
        if (now - lastTime < msPerFrame) return;
        lastTime = now;
      }
      if (!buf) return;

      // stochastic directional light — angle random-walks + steady drift
      if (!isStatic) {
        lightAngle += cfg.lightDrift + (Math.random() - 0.5) * cfg.lightJitter;
        lightHuePhase += cfg.lightHueDrift;
      }
      const lx = Math.cos(lightAngle), ly = Math.sin(lightAngle);
      const sharp = cfg.lightSharpness, strength = cfg.lightStrength;
      const shimmerMin = cfg.shimmerMin;
      // dynamic glow gate: scales with lightStrength rather than a fixed magic number
      const glowThr = strength * cfg.glowThresholdFrac;
      const glowRange = Math.max(strength - glowThr, 0.001);

      while (trail.length && now - trail[0].t > cfg.trailMs) trail.shift();

      // past-hero readability calm: dim the field, and dim the reading column more.
      // subpages have no hero, so the whole viewport is dimmed from the top (past = 1).
      const pRaw = clamp(scrollY / (logH * 0.8), 0, 1);
      const past = subpage ? 1 : pRaw * pRaw * (3 - 2 * pRaw);   // smoothstep
      const dim = 1 + past * (cfg.contentDim - 1);        // lerp(1 → contentDim)
      // per-column multiplier (cheap; cols is small)
      if (colMul.length !== buf.cols) colMul = new Float32Array(buf.cols);
      {
        const cx = logW / 2;
        const halfCol = cfg.columnWidth * logW;
        const edge = Math.max(halfCol * 0.5, 1);
        for (let c = 0; c < buf.cols; c++) {
          const dxc = Math.abs(c * gridW + gridW / 2 - cx);
          const inside = clamp((halfCol - dxc) / edge, 0, 1);
          const ct = inside * inside * (3 - 2 * inside);
          colMul[c] = dim * (1 - past * cfg.columnCalm * ct);
        }
      }

      // local influence box so suppression stays cheap
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      const R = cfg.repelR;
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i];
        if (p.x - R < bx0) bx0 = p.x - R;
        if (p.y - R < by0) by0 = p.y - R;
        if (p.x + R > bx1) bx1 = p.x + R;
        if (p.y + R > by1) by1 = p.y + R;
      }
      const hasBubble = trail.length > 0;

      const { data, cols, rows, frames } = buf;
      const cells = cols * rows;
      gfx.clearRect(0, 0, logW, logH);
      const base = frameIndex * cells;
      let curAlpha = 1;
      gfx.globalAlpha = 1;

      for (let row = 0; row < rows; row++) {
        const yPx = row * gridH;
        const cyc = yPx + gridH / 2;
        const off = base + row * cols;
        const rowInBox = hasBubble && cyc >= by0 && cyc <= by1;
        for (let col = 0; col < cols; col++) {
          const level = data[off + col];
          if (level === 0) continue;
          const cellMul = colMul[col];
          if (cellMul < 0.012) continue;       // column fully calmed → skip
          const xPx = col * gridW;

          let supp = 0;
          if (rowInBox) {
            const cxc = xPx + gridW / 2;
            if (cxc >= bx0 && cxc <= bx1) {
              supp = suppression(cxc, cyc, now);
              if (supp >= 0.999) continue;
            }
          }

          const baseAlpha = (1 - supp) * cellMul;
          if (baseAlpha !== curAlpha) { gfx.globalAlpha = baseAlpha; curAlpha = baseAlpha; }
          gfx.fillStyle = STYLES[level];
          gfx.fillText(CHARS[level], xPx, yPx);

          // directional specular highlight on lit-facing edge cells
          if (level >= shimmerMin) {
            const idx = row * cols + col;
            const facing = normX[idx] * lx + normY[idx] * ly;
            if (facing > 0) {
              const spec = Math.pow(facing, sharp) * strength * baseAlpha;
              if (spec > 0.012) {
                let hi = ((lightHuePhase + col * 0.7 + row * 0.5) | 0) % STEPS;
                if (hi < 0) hi += STEPS;
                gfx.globalAlpha = spec; curAlpha = spec;
                gfx.fillStyle = lightPalette[hi];
                gfx.fillText(CHARS[level], xPx, yPx);

                // brightness-gated glow: only peak-band cells get a soft halo —
                // a 4-offset fake bloom + brighter core (no shadowBlur in the hot path)
                if (spec > glowThr) {
                  const g = ((spec - glowThr) / glowRange) * cfg.glowStrength;
                  const ch = CHARS[level];
                  gfx.fillStyle = glowPalette[hi];
                  gfx.globalAlpha = g * 0.16;
                  gfx.fillText(ch, xPx - 1, yPx);
                  gfx.fillText(ch, xPx + 1, yPx);
                  gfx.fillText(ch, xPx, yPx - 1);
                  gfx.fillText(ch, xPx, yPx + 1);
                  gfx.globalAlpha = g * spec; curAlpha = g * spec;
                  gfx.fillText(ch, xPx, yPx);
                }
              }
            }
          }
        }
      }

      if (curAlpha !== 1) gfx.globalAlpha = 1;
      if (!isStatic) {
        frameIndex = (frameIndex + 1) % frames;
      }
    }

    function draw(now: number) {
      animId = requestAnimationFrame(draw);
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
          lastTime = 0; // reset so there is no time jump
          animId = requestAnimationFrame(draw);
        }
      }
    };

    setup();
    scrollY = window.scrollY;

    if (reducedMotion) {
      // draw a single static frame and stop — no rAF loop
      drawFrame(performance.now(), true);
    } else {
      animId = requestAnimationFrame(draw);
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
