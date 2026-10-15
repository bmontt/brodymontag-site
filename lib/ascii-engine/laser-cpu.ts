/* ─── ASCII engine — laser layer on the CPU (2D tier) ───────────────────────── */

import type { LaserUniforms } from "./gl/laser-shader";

/**
 * The same per-cell laser evaluation as laser-shader.ts, for the 2D canvas
 * tier (reduced motion, low-end devices, lost WebGL). Fed by the same director
 * (lib/director/laser.ts) through the same uniform objects, so both tiers
 * draw one piece. The CPU path precomputes the fan rays once per frame instead
 * of per cell, and rejects cells far from each figure.
 */

export const LASER_STROKES = ["─", "│", "╲", "╱"] as const;
export const LASER_DOT = "·";

export interface LaserCell {
  ch: string;
  alpha: number;
  /** palette coordinate: [0,0.5) tech greys, [0.5,1) sound reds (laserRgb) */
  pal: number;
}

/**
 * The sound scale's hue at a cell and time — the pearlescent band (sky blue ↔
 * orchid, 205°–315°, every 6s); mirrors laserColor in ascii-shaders.ts.
 */
export function shimmerHue(time: number, col: number, row: number): number {
  return 260 + 55 * Math.sin((Math.PI * 2 * time) / 6 + col * 0.035 + row * 0.09);
}

function hsl2rgb(h: number, sat: number, l: number): [number, number, number] {
  const a = sat * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  };
  return [f(0), f(8), f(4)];
}

/**
 * palette coordinate → [r, g, b] 0–255; mirrors laserColor in ascii-shaders.ts.
 * `hue` (degrees) only matters on the sound scale (the shimmer).
 */
export function laserRgb(v: number, hue = 0): [number, number, number] {
  const sm = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  if (v < 0.5) {
    const l = 0.16 + (1 - 0.16) * v * 2;
    return [l * 255, l * 255, l * 255];
  }
  const t = (v - 0.5) * 2;
  const iri = hsl2rgb(hue, 0.7, 0.16 + (0.74 - 0.16) * sm(0, 0.75, t));
  const hot = 0.7 * sm(0.85, 1, t);
  return [0, 1, 2].map((i) => (iri[i] + (1 - iri[i]) * hot) * 255) as [number, number, number];
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
  /** the 3D title's mask pixels (white on black, RGBA) */
  title?: { data: Uint8ClampedArray; w: number; h: number } | null,
): void {
  const W = u.uView.value.x;
  const time = u.uLaserTime.value;
  const mix = u.uLaserMix.value;
  if (mix < 0.002) return;

  const scope = u.uScope.value, scopeB = u.uScopeB.value, scopeC = u.uScopeC.value, scopeD = u.uScopeD.value;
  const fan = u.uFan.value, fanB = u.uFanB.value, fanC = u.uFanC.value;
  const gridL = u.uGridL.value, gridB = u.uGridB.value, rails = u.uRails.value;
  const orbit = u.uOrbit.value, orbitB = u.uOrbitB.value, orbitC = u.uOrbitC.value, ringL = u.uRingL.value;
  const H = u.uView.value.y;

  // ── per-frame precompute ──────────────────────────────────────────────────
  const scopeF = (x: number, ph: number, fr: number, amp: number) => {
    const k = (TAU * scope.z * fr) / W;
    return scope.y * amp * (Math.sin(x * k + ph) * 0.62
      + Math.sin(x * k * 2.31 - ph * 1.37) * 0.28 * scopeB.z
      + Math.sin(x * k * 5.7 + ph * 2.1) * 0.1 * scopeB.z);
  };
  const nFan = fan.x >= 0.002 ? Math.round(fan.y) : 0;
  const fx = new Float32Array(Math.max(nFan, 1)), fy = new Float32Array(Math.max(nFan, 1));
  for (let i = 0; i < nFan; i++) {
    const k = nFan > 1 ? i / (nFan - 1) - 0.5 : 0;
    const ang = -Math.PI / 2 + fan.w + k * fan.z;
    fx[i] = fanB.x + Math.cos(ang) * fanB.w;
    fy[i] = fanB.y + Math.sin(ang) * fanB.w;
  }
  const ox = Math.cos(orbit.z) * orbit.y, oy = Math.sin(orbit.z) * 0.42 * orbit.y;
  const oz = Math.sin(orbit.z) * Math.min(1, Math.max(0, orbit.y / Math.max(orbit.w, 1)));
  const nSeg = Math.round(u.uSegN.value);
  const segs = u.uSegs.value, segsB = u.uSegsB.value;
  // each segment's reach (its box grown by the 70 px a stroke can light), so
  // most cells skip it without measuring
  const segBox = new Float32Array(Math.max(nSeg, 1) * 4);
  for (let i = 0; i < nSeg; i++) {
    const sg = segs[i], node = segsB[i].w < -0.5;
    segBox[i * 4] = (node ? sg.x - sg.z : Math.min(sg.x, sg.z)) - 70;
    segBox[i * 4 + 1] = (node ? sg.x + sg.z : Math.max(sg.x, sg.z)) + 70;
    segBox[i * 4 + 2] = (node ? sg.y - sg.w : Math.min(sg.y, sg.w)) - 70;
    segBox[i * 4 + 3] = (node ? sg.y + sg.w : Math.max(sg.y, sg.w)) + 70;
  }
  const carHull = u.uCarHull.value, carN = Math.round(u.uCarN.value);
  // inside the car's silhouette, grown by about a glyph, the road behind it is
  // hidden (laser-shader.ts inCar)
  const inCar = (px: number, py: number) => {
    if (carN < 3) return false;
    for (let i = 0; i < carN; i++) {
      const a = carHull[i], b = carHull[i + 1 >= carN ? 0 : i + 1];
      if ((b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x) < -12 * Math.hypot(b.x - a.x, b.y - a.y)) return false;
    }
    return true;
  };
  const wipe = u.uWipe.value, wipeB = u.uWipeB.value;
  const tt = u.uTitle.value, tb = u.uTitleB.value;
  const titleOn = !!title && tt.w >= 0.002 && tt.z >= 1;
  const tCos = Math.cos(tb.z), tSin = Math.sin(tb.z);
  const mask = (ux: number, uy: number) => {
    if (!title || ux < 0 || ux > 1 || uy < 0 || uy > 1) return 0;
    return title.data[(Math.min(title.h - 1, Math.floor(uy * title.h)) * title.w + Math.min(title.w - 1, Math.floor(ux * title.w))) * 4] / 255;
  };

  const b: Best = { score: 1e9, d: 1e9, nx: 0, ny: 1, hue: 0, w: 0 };
  const fanLo = fanB.z < 0.5 ? 0 : 0.5;
  const take = (dpx: number, nx: number, ny: number, hue: number, w: number) => {
    if (w < 0.002) return;
    const dc = dpx * Math.hypot(nx / cw, ny / ch);
    const score = dc - 1.5 * w;
    if (score < b.score) { b.score = score; b.d = dc; b.nx = nx; b.ny = ny; b.hue = hue; b.w = w; }
  };
  // nearest point on a segment, folded into a running best (px + normal)
  let segBest = 1e9, segNx = 0, segNy = 1, segIdx = 0, segCount = 0, segT = 0;
  const seg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
    segCount++;
    const abx = bx - ax, aby = by - ay;
    const t = Math.min(1, Math.max(0, ((px - ax) * abx + (py - ay) * aby) / Math.max(abx * abx + aby * aby, 1e-4)));
    const dx = px - (ax + abx * t), dy = py - (ay + aby * t);
    const d = Math.hypot(dx, dy);
    if (d < segBest) {
      segBest = d;
      segIdx = segCount - 1;
      segT = t;
      if (d > 1e-3) { segNx = dx / d; segNy = dy / d; }
      else { const L = Math.hypot(abx, aby) || 1; segNx = -aby / L; segNy = abx / L; }
    }
  };
  const circle = (px: number, py: number, cx: number, cy: number, r: number, hue: number, w: number) => {
    const dx = px - cx, dy = py - cy, L = Math.hypot(dx, dy);
    take(Math.abs(L - r), L > 1e-3 ? dx / L : 0, L > 1e-3 ? dy / L : 1, hue, w);
  };
  // a spinning hoop: an ellipse, first-order distance (laser-shader.ts hoopL)
  const hoop = (px: number, py: number, cx: number, cy: number, r: number, spin: number, axis: number, round: number, hue: number, w: number) => {
    const ca = Math.cos(axis), sa = Math.sin(axis);
    const qx = ca * (px - cx) + sa * (py - cy), qy = -sa * (px - cx) + ca * (py - cy);
    const a = r, bb = r * (0.22 + 0.78 * Math.abs(Math.cos(spin)) + (1 - (0.22 + 0.78 * Math.abs(Math.cos(spin)))) * round);
    const ux = qx / a, uy = qy / bb, L = Math.hypot(ux, uy);
    if (L < 1e-4) return;
    const gx = ux / a, gy = uy / bb, gl = Math.max(Math.hypot(gx, gy), 1e-5);
    const nx = gx / gl, ny = gy / gl;
    take((Math.abs(L - 1) * L) / gl, ca * nx - sa * ny, sa * nx + ca * ny, hue, w);
  };

  const flick = Math.floor(time * 9) * 0.137;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const px = (col + 0.5) * cw, py = (row + 0.5) * ch;
      b.score = 1e9; b.w = 0;
      const car = inCar(px, py);

      const trace = (ph: number, fr: number, amp: number, pal: number, w: number, side: number) => {
        if (scopeD.x >= 0) {
          // split: each trace keeps to its half and flattens as it meets the other
          if (side * (px - scopeD.x) < 0) return;
          const t = Math.min(1, Math.abs(px - scopeD.x) / scopeD.y);
          amp *= t * t * (3 - 2 * t);
        }
        const f = scopeF(px, ph, fr, amp), df = (scopeF(px + 1, ph, fr, amp) - scopeF(px - 1, ph, fr, amp)) * 0.5;
        const L = Math.hypot(df, 1);
        take(Math.abs(py - (scopeB.x + f)) / L, -df / L, 1 / L, pal, w);
      };
      if (!car && scope.x >= 0.002) trace(scope.w, 1, 1, scopeB.y, scope.x, -1);
      if (!car && scopeC.x >= 0.002) trace(scope.w + scopeC.y, scopeC.z, scopeC.w, scopeB.w, scopeC.x, 1);
      if (nFan > 0) {
        segBest = 1e9; segCount = 0;
        for (let i = 0; i < nFan; i++) seg(px, py, fanB.x, fanB.y, fx[i], fy[i]);
        const k = nFan > 1 ? segIdx / (nFan - 1) - 0.5 : 0;
        // the far fade and the pulse running up (laser-shader.ts fanL)
        const far = 1 + (Math.pow(1 - segT, 1.6) - 1) * fanC.y;
        const pd = (segT - fanC.z) / 0.07;
        take(segBest, segNx, segNy, Math.min(fanLo + 0.499, Math.max(fanLo, fanB.z + k * fanC.x)), fan.x * far * (1 + fanC.w * Math.exp(-pd * pd)));
      }
      if (!car && gridL.x >= 0.002) {
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
          if (rails.x >= 0.002) {
            for (let k = 0; k < 2; k++) {
              const side = k === 0 ? -1 : 1;
              const rl = Math.hypot(side * rails.y, depth), ax = (side * rails.y) / rl, ay = depth / rl;
              take(Math.abs(rx * ay - ry * ax), ay, -ax, k === 0 ? rails.z : rails.w, rails.x);
            }
          }
        }
      }
      if (orbit.x >= 0.002) {
        hoop(px, py, orbitB.x + ox, orbitB.y + oy, orbit.w * (1 + 0.14 * oz), orbitC.x, orbitC.x * 0.37, orbitC.z, orbitB.z, orbit.x * (1 + 0.3 * oz));
        hoop(px, py, orbitB.x - ox, orbitB.y - oy, orbit.w * (1 - 0.14 * oz), orbitC.y, -orbitC.y * 0.29, orbitC.z, orbitB.w, orbit.x * (1 - 0.3 * oz));
      }
      if (ringL.x >= 0.002) circle(px, py, orbitB.x, orbitB.y, ringL.y, ringL.z, ringL.x);
      // the room, the car, the software figure: projected segments (lib/director)
      for (let i = 0; i < nSeg; i++) {
        if (px < segBox[i * 4] || px > segBox[i * 4 + 1] || py < segBox[i * 4 + 2] || py > segBox[i * 4 + 3]) continue;
        const sg = segs[i], sb = segsB[i];
        if (sb.w < -0.5) {
          // a node: a diamond's outline (laser-shader.ts roomL)
          const qx = px - sg.x, qy = py - sg.y, ax = Math.abs(qx), ay = Math.abs(qy);
          const ex = -sg.z, ey = sg.w;
          const t = Math.min(1, Math.max(0, ((ax - sg.z) * ex + ay * ey) / Math.max(ex * ex + ey * ey, 1e-4)));
          const dx = ax - (sg.z + ex * t), dy = ay - ey * t, d = Math.hypot(dx, dy);
          const L = Math.hypot(sg.w, sg.z) || 1;
          take(d, (d > 1e-3 ? dx / d : sg.w / L) * (qx < 0 ? -1 : 1), (d > 1e-3 ? dy / d : sg.z / L) * (qy < 0 ? -1 : 1), sb.x, sb.y);
          continue;
        }
        const abx = sg.z - sg.x, aby = sg.w - sg.y;
        const t = Math.min(1, Math.max(0, ((px - sg.x) * abx + (py - sg.y) * aby) / Math.max(abx * abx + aby * aby, 1e-4)));
        const dx = px - (sg.x + abx * t), dy = py - (sg.y + aby * t), d = Math.hypot(dx, dy);
        if (d > 70) continue;
        const L = Math.hypot(abx, aby) || 1;
        let w = sb.y + (sb.z - sb.y) * t;
        // a packet riding the segment (laser-shader.ts roomL)
        if (sb.w > 0.5) { const pd = ((t - (sb.w - 1)) * L) / 16; w *= 1 + 2.2 * Math.exp(-pd * pd); }
        take(d, d > 1e-3 ? dx / d : -aby / L, d > 1e-3 ? dy / d : abx / L, sb.x, w);
      }
      // the 3D title: outline strokes from the mask gradient, sparse fill
      if (titleOn) {
        const qx = px - tt.x, qy = py - tt.y;
        const rx = tCos * qx + tSin * qy, ry = -tSin * qx + tCos * qy;
        const sw = tt.z, sh = tt.z * tb.y;
        const ux = rx / sw + 0.5, uy = ry / sh + 0.5;
        if (ux > -0.05 && ux < 1.05 && uy > -0.05 && uy < 1.05) {
          const ex = cw / sw, ey = ch / sh;
          const gx = mask(ux + ex, uy) - mask(ux - ex, uy), gy = mask(ux, uy + ey) - mask(ux, uy - ey);
          const g = Math.hypot(gx, gy);
          if (g > 0.3) take(0, gx / g, gy / g, tb.x, tt.w * Math.min(g, 1));
          else if (mask(ux, uy) > 0.5 && hash(col + 3.1, row + 3.1) < 0.1) take(ch * 0.95, 0, 1, tb.x, tt.w * 0.6);
        }
      }
      // the transition wave
      if (wipeB.x >= 0.002) {
        const rx = px - wipe.x, ry = py - wipe.y, rl = Math.hypot(rx, ry) || 1e-3;
        const d = rl + (hash(col * 0.37 + 11, row * 0.37 + 11) - 0.5) * wipe.w;
        take(Math.abs(d - wipe.z), rx / rl, ry / rl, wipeB.y, wipeB.x);
        if (d < wipe.z - wipe.w && hash(col + flick, row - flick) < 0.07) take(ch * 0.95, 0, 1, wipeB.y, wipeB.x * 0.7);
      }
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
        emit(col, row, { ch: LASER_STROKES[s], alpha: core * b.w * k, pal: b.hue });
        continue;
      }
      const t1 = Math.min(1, Math.max(0, (b.d - 0.82) / 1.58));
      const haze = (1 - t1 * t1 * (3 - 2 * t1)) * 0.38 * b.w;
      if (haze > 0.03 && hash(col + flick, row + flick) < 0.5) emit(col, row, { ch: LASER_DOT, alpha: haze * k, pal: b.hue });
    }
  }
}
