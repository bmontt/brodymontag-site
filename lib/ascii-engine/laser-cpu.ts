/* ─── ASCII engine — laser layer on the CPU (2D tier) ───────────────────────── */

import type { LaserUniforms } from "./gl/laser-shader";

/**
 * The same per-cell laser evaluation as laser-shader.ts, for the 2D canvas
 * tier (reduced motion, low-end devices, lost WebGL). Fed by the same director
 * (lib/director/laser.ts) through the same uniform objects, so both tiers
 * draw one piece. The CPU path precomputes the Lissajous polyline and fan rays
 * once per frame instead of per cell, and rejects cells far from each figure.
 */

export const LASER_STROKES = ["─", "│", "╲", "╱"] as const;
export const LASER_DOT = "·";

export interface LaserCell {
  ch: string;
  alpha: number;
  hue: number; // 0–1
}

const TAU = Math.PI * 2;

function hash(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

interface Best {
  score: number;
  d: number;
  nx: number;
  ny: number;
  hue: number;
  w: number;
}

/** Evaluates every cell; calls `emit` for the lit ones. */
export function laserFrame(
  u: LaserUniforms,
  cols: number,
  rows: number,
  cw: number,
  ch: number,
  emit: (col: number, row: number, cell: LaserCell) => void,
  calm: (x: number) => number = () => 1,
): void {
  const W = u.uView.value.x;
  const jx = u.uJitter.value.x, jy = u.uJitter.value.y;
  const time = u.uLaserTime.value;
  const mix = u.uLaserMix.value;
  if (mix < 0.002) return;

  const scope = u.uScope.value, scopeB = u.uScopeB.value;
  const liss = u.uLiss.value, lissB = u.uLissB.value, lissC = u.uLissC.value;
  const fan = u.uFan.value, fanB = u.uFanB.value;
  const gridL = u.uGridL.value, gridB = u.uGridB.value;
  const orbit = u.uOrbit.value, orbitB = u.uOrbitB.value, ringL = u.uRingL.value;
  const H = u.uView.value.y;

  // ── per-frame precompute ──────────────────────────────────────────────────
  const scopeF = (x: number) => {
    const k = (TAU * scope.z) / W;
    const ph = scope.w;
    return scope.y * (Math.sin(x * k + ph) * 0.62
      + Math.sin(x * k * 2.31 - ph * 1.37) * 0.28 * scopeB.z
      + Math.sin(x * k * 5.7 + ph * 2.1) * 0.1 * scopeB.z);
  };
  const SEG = 72;
  const lx = new Float32Array(SEG + 1), ly = new Float32Array(SEG + 1);
  const lissOn = liss.x >= 0.002 && lissB.y >= 1;
  if (lissOn) {
    const cs = Math.cos(lissB.x), sn = Math.sin(lissB.x), ct = Math.cos(lissB.w), st = Math.sin(lissB.w);
    for (let i = 0; i <= SEG; i++) {
      const t = (i / SEG) * TAU;
      let qx = Math.sin(liss.y * t + liss.w), qy = Math.sin(liss.z * t), qz = Math.cos(liss.y * t + liss.w * 0.5);
      const rx = cs * qx + sn * qz, rz = -sn * qx + cs * qz;
      qx = rx; qz = rz;
      const ty = ct * qy - st * qz, tz = st * qy + ct * qz;
      const pr = 2.6 / (2.6 + tz);
      lx[i] = lissC.x + qx * lissB.y * pr;
      ly[i] = lissC.y + ty * lissB.y * pr;
    }
  }
  const nFan = fan.x >= 0.002 ? Math.round(fan.y) : 0;
  const fx = new Float32Array(Math.max(nFan, 1)), fy = new Float32Array(Math.max(nFan, 1));
  for (let i = 0; i < nFan; i++) {
    const k = nFan > 1 ? i / (nFan - 1) - 0.5 : 0;
    const ang = -Math.PI / 2 + fan.w + k * fan.z;
    fx[i] = fanB.x + Math.cos(ang) * fanB.w;
    fy[i] = fanB.y + Math.sin(ang) * fanB.w;
  }
  const ox = Math.cos(orbit.z) * orbit.y, oy = Math.sin(orbit.z) * 0.42 * orbit.y;

  const b: Best = { score: 1e9, d: 1e9, nx: 0, ny: 1, hue: 0, w: 0 };
  const take = (dpx: number, nx: number, ny: number, hue: number, w: number) => {
    if (w < 0.002) return;
    const dc = dpx * Math.hypot(nx / cw, ny / ch);
    const score = dc - 1.5 * w;
    if (score < b.score) { b.score = score; b.d = dc; b.nx = nx; b.ny = ny; b.hue = hue; b.w = w; }
  };
  // nearest point on a segment, folded into a running best (px + normal)
  let segBest = 1e9, segNx = 0, segNy = 1;
  const seg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    const abx = bx - ax, aby = by - ay;
    const t = Math.min(1, Math.max(0, ((px - ax) * abx + (py - ay) * aby) / Math.max(abx * abx + aby * aby, 1e-4)));
    const dx = px - (ax + abx * t), dy = py - (ay + aby * t);
    const d = Math.hypot(dx, dy);
    if (d < segBest) {
      segBest = d;
      if (d > 1e-3) { segNx = dx / d; segNy = dy / d; }
      else { const L = Math.hypot(abx, aby) || 1; segNx = -aby / L; segNy = abx / L; }
    }
  };
  const circle = (px: number, py: number, cx: number, cy: number, r: number, hue: number, w: number) => {
    const dx = px - cx, dy = py - cy, L = Math.hypot(dx, dy);
    take(Math.abs(L - r), L > 1e-3 ? dx / L : 0, L > 1e-3 ? dy / L : 1, hue, w);
  };

  const flick = Math.floor(time * 9) * 0.137;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = (col + 0.5) * cw + jx, py = (row + 0.5) * ch + jy;
      b.score = 1e9; b.w = 0;

      if (scope.x >= 0.002) {
        const f = scopeF(px), df = (scopeF(px + 1) - scopeF(px - 1)) * 0.5;
        const L = Math.hypot(df, 1);
        take(Math.abs(py - (scopeB.x + f)) / L, -df / L, 1 / L, scopeB.y, scope.x);
      }
      if (lissOn && Math.hypot(px - lissC.x, py - lissC.y) <= lissB.y * 1.9 + 80) {
        segBest = 1e9;
        for (let i = 0; i < SEG; i++) seg(px, py, lx[i], ly[i], lx[i + 1], ly[i + 1]);
        take(segBest, segNx, segNy, lissB.z, liss.x);
      }
      if (nFan > 0) {
        segBest = 1e9;
        for (let i = 0; i < nFan; i++) seg(px, py, fanB.x, fanB.y, fx[i], fy[i]);
        take(segBest, segNx, segNy, fanB.z, fan.x);
      }
      if (gridL.x >= 0.002) {
        const hy = gridL.y, below = py - hy;
        take(Math.abs(below), 0, 1, gridL.w, gridL.x * 0.9);
        if (below > 1) {
          const depth = Math.max(H - hy, 1);
          const tt = Math.min(1, Math.max(0, below / depth / 0.3));
          const fade = tt * tt * (3 - 2 * tt) * gridL.x;
          const uu = (depth / below) * gridB.z + gridL.z;
          const fu = uu - Math.floor(uu);
          take((Math.min(fu, 1 - fu) / gridB.z) * below * below / depth, 0, 1, gridL.w, fade);
          const ri = Math.floor(((px - gridB.x) / below) * depth / gridB.y + 0.5);
          const dl = Math.hypot(ri * gridB.y, depth), dxn = (ri * gridB.y) / dl, dyn = depth / dl;
          const rx = px - gridB.x, ry = py - hy;
          take(Math.abs(rx * dyn - ry * dxn), dyn, -dxn, gridL.w, fade);
        }
      }
      if (orbit.x >= 0.002) {
        circle(px, py, orbitB.x + ox, orbitB.y + oy, orbit.w, orbitB.z, orbit.x);
        circle(px, py, orbitB.x - ox, orbitB.y - oy, orbit.w, orbitB.w, orbit.x);
      }
      if (ringL.x >= 0.002) circle(px, py, orbitB.x, orbitB.y, ringL.y, ringL.z, ringL.x);
      if (b.w < 0.002) continue;

      const k = calm(px) * mix;
      const t0 = Math.min(1, Math.max(0, (b.d - 0.38) / 0.44));
      const core = 1 - t0 * t0 * (3 - 2 * t0);
      if (core > 0.05) {
        // stroke from the beam's tangent in cell space
        const tx = b.ny / cw, ty = -b.nx / ch;
        let ang = Math.atan2(ty, tx);
        if (ang < 0) ang += Math.PI;
        const s = ang < 0.3927 || ang > 2.7489 ? 0 : ang < 1.1781 ? 2 : ang < 1.9635 ? 1 : 3;
        emit(col, row, { ch: LASER_STROKES[s], alpha: core * b.w * k, hue: b.hue });
        continue;
      }
      const t1 = Math.min(1, Math.max(0, (b.d - 0.82) / 1.58));
      const haze = (1 - t1 * t1 * (3 - 2 * t1)) * 0.38 * b.w;
      if (haze > 0.03 && hash(col + flick, row + flick) < 0.5) emit(col, row, { ch: LASER_DOT, alpha: haze * k, hue: b.hue });
    }
  }
}
