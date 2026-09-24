/* ─── ASCII engine — bake (field precomputation + cache) ────────────────────── */

import type { BakeParams, CacheEntry, FrameBuf } from "./types";

/* ─── shared constants ───────────────────────────────────────────────────────── */
export const MIN_FRAMES = 180;
export const MAX_FRAMES = 480;
export const TWO_PI     = Math.PI * 2;

export const clamp = (v: number, lo: number, hi: number) =>
  v < lo ? lo : v > hi ? hi : v;

/* ─── physics helper ─────────────────────────────────────────────────────────── */
export function ampToLevel(amp: number): number {
  if (amp < 0.05 || amp > 0.82) return 0;
  if (amp < 0.14) return 1;
  if (amp < 0.28) return 2;
  if (amp < 0.46) return 3;
  if (amp < 0.65) return 4;
  return 5;
}

/* ─── bake cache ─────────────────────────────────────────────────────────────── */
export const BAKE_CACHE_MAX = 4;
export const bakeCache: CacheEntry[] = [];

/**
 * Build a cache key. `stateId` distinguishes per-skin bakes (defaults to
 * "default" for the standard ASCII background).
 */
export function getBakeCacheKey(
  stateId: string,
  logW: number,
  logH: number,
  dpr: number,
  gridW: number,
  gridH: number,
): string {
  return `${stateId}|${logW}x${logH}@${dpr}@${gridW}x${gridH}`;
}

export function lookupBakeCache(key: string): CacheEntry | undefined {
  return bakeCache.find(e => e.key === key);
}

export function storeBakeCache(entry: CacheEntry): void {
  // evict oldest if at cap
  if (bakeCache.length >= BAKE_CACHE_MAX) bakeCache.shift();
  bakeCache.push(entry);
}

/* ─── field precomputation ───────────────────────────────────────────────────── */

/**
 * Bakes a *seamless* loop of the two-body interference field.
 * Every time term is a function of loop-phase τ = f/N with integer cycles per
 * loop, so frame N ≡ frame 0 (no jump, matched velocity at the seam):
 *   • orbit angle  θ = 2π·τ            — exactly one revolution per loop
 *   • wave phase   ψ = 2π·Kwave·τ      — integer wave cycles per loop
 *   • breath       s = (1-cos(2π·osc·τ))/2 ∈ [0,1] — orbitFrac/waveFreq sweep
 * N is derived from dt so dt still reads as "orbital speed".
 *
 * params is typically the site's ascii config object (structural supertype of BakeParams).
 */
export function precompute(
  params: BakeParams,
  logW: number,
  logH: number,
  cellW: number,
  cellH: number,
): FrameBuf {
  const cfg   = params;
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

/* ─── normal map ─────────────────────────────────────────────────────────────── */

/** Per-cell outward normal from screen center → drives the directional light. */
export function computeNormals(
  cols: number,
  rows: number,
  cellW: number,
  cellH: number,
  logW: number,
  logH: number,
): { normX: Float32Array<ArrayBuffer>; normY: Float32Array<ArrayBuffer> } {
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
